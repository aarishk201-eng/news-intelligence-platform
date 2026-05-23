import { Query, Document } from 'mongoose';
import { env } from '../config/env';

interface QueryString {
  page?: string;
  limit?: string;
  sort?: string;
  fields?: string;
  search?: string;
  [key: string]: string | undefined;
}

/**
 * @class ApiFeatures
 * @description Reusable Mongoose query builder that applies filtering, sorting,
 * field projection, and pagination from Express query params.
 *
 * Supports:
 *  - Comparison operators: gte, gt, lte, lt (e.g. ?sentiment[gte]=0.5)
 *  - Sorting: ?sort=-publishedAt,title
 *  - Field selection: ?fields=title,summary,source
 *  - Pagination: ?page=2&limit=20
 *  - Full-text: handled separately via MongoDB $text
 *
 * @example
 *   const features = new ApiFeatures(Article.find(), req.query)
 *     .filter()
 *     .sort()
 *     .limitFields()
 *     .paginate();
 *
 *   const articles = await features.query;
 *   const total    = await features.countQuery;
 */
export class ApiFeatures<T extends Document> {
  public query: Query<T[], T>;
  public countQuery: Promise<number>;
  private readonly queryString: QueryString;
  private filterConditions: Record<string, unknown> = {};

  constructor(query: Query<T[], T>, queryString: QueryString) {
    this.query = query;
    this.queryString = queryString;
    this.countQuery = Promise.resolve(0); // overwritten after filter()
  }

  // ─── Enforce Lean (always call before .exec) ───────────────────────────────
  // Skips Mongoose document hydration — 3-5x faster reads
  lean(): this {
    this.query = this.query.lean() as unknown as Query<T[], T>;
    return this;
  }

  // ─── Filter ────────────────────────────────────────────────────────────────
  filter(): this {
    const excluded = ['page', 'sort', 'limit', 'fields', 'search'];
    const rawFilter: Record<string, unknown> = {};

    Object.entries(this.queryString).forEach(([key, value]) => {
      if (!excluded.includes(key) && value !== undefined) {
        rawFilter[key] = value;
      }
    });

    // Convert gte/gt/lte/lt to MongoDB operators
    let filterStr = JSON.stringify(rawFilter);
    filterStr = filterStr.replace(/\b(gte|gt|lte|lt|in|nin|ne)\b/g, (op) => `$${op}`);
    this.filterConditions = JSON.parse(filterStr) as Record<string, unknown>;

    this.query = this.query.find(this.filterConditions);

    // Build count query against same conditions — but only if caller needs it
    // (avoids a full collection scan on every request when total not needed)
    const skipCount = this.queryString.skipCount === 'true';
    if (!skipCount) {
      this.countQuery = (this.query.model as unknown as { countDocuments: (f: unknown) => Promise<number> })
        .countDocuments(this.filterConditions);
    }

    return this;
  }

  // ─── Search (Full-Text) ────────────────────────────────────────────────────
  search(): this {
    if (this.queryString.search) {
      this.query = this.query.find({
        $text: { $search: this.queryString.search },
      });
      
      // If we are searching, but NOT explicitly sorting, sort by text score
      if (!this.queryString.sort) {
         this.query = this.query.sort({ score: { $meta: 'textScore' } });
         // Project the score so we can sort by it
         this.query = this.query.select({ score: { $meta: 'textScore' } });
      }
    }
    return this;
  }

  // ─── Sort ──────────────────────────────────────────────────────────────────
  sort(): this {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default: newest first (only if we didn't already sort by textScore)
      if (!this.queryString.search) {
        this.query = this.query.sort('-publishedAt -createdAt');
      }
    }
    return this;
  }

  // ─── Field Projection ──────────────────────────────────────────────────────
  limitFields(): this {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // Always exclude internal version key
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // ─── Pagination ────────────────────────────────────────────────────────────
  // Uses offset pagination up to page 10, then recommends cursor-based.
  // Hard-cap: skip(5000) — beyond that MongoDB does full scans.
  paginate(): this {
    const page  = Math.max(1, parseInt(this.queryString.page ?? '1', 10));
    const limit = Math.min(
      env.MAX_PAGE_SIZE,
      Math.max(1, parseInt(this.queryString.limit ?? String(env.DEFAULT_PAGE_SIZE), 10))
    );
    const skip = Math.min((page - 1) * limit, 5000); // Hard cap: skip > 5000 kills performance

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  // ─── Current page/limit helpers ────────────────────────────────────────────
  get currentPage(): number {
    return Math.max(1, parseInt(this.queryString.page ?? '1', 10));
  }

  get currentLimit(): number {
    return Math.min(
      env.MAX_PAGE_SIZE,
      Math.max(1, parseInt(this.queryString.limit ?? String(env.DEFAULT_PAGE_SIZE), 10))
    );
  }
}
