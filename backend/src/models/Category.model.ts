import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  _id:            mongoose.Types.ObjectId;
  name:           string;
  slug:           string;
  description?:   string;
  icon?:          string;
  color:          string;
  parentCategory?: mongoose.Types.ObjectId;
  ancestors:      mongoose.Types.ObjectId[];   // full path for O(1) tree traversal
  depth:          number;                       // 0 = root, 1 = child, 2 = grandchild
  displayOrder:   number;
  isActive:       boolean;
  articleCount:   number;
  meta: {
    seoTitle?:       string;
    seoDescription?: string;
    keywords:        string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type:      String,
      required:  [true, 'Category name is required'],
      unique:    true,
      trim:      true,
      minlength: [2,   'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type:      String,
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    description: { type: String, trim: true, maxlength: 500 },
    icon:        { type: String, trim: true },
    color:       { type: String, default: '#6366f1', match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code'] },
    parentCategory: {
      type:   Schema.Types.ObjectId,
      ref:    'Category',
      index:  true,
      sparse: true,
    },
    ancestors: {
      type:    [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      default: [],
      index:   true,
    },
    depth:        { type: Number, default: 0, min: 0, max: 5 },
    displayOrder: { type: Number, default: 0, index: true },
    isActive:     { type: Boolean, default: true, index: true },
    articleCount: { type: Number, default: 0, min: 0 },
    meta: {
      seoTitle:       { type: String, maxlength: 70 },
      seoDescription: { type: String, maxlength: 160 },
      keywords:       { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_doc, ret) => { delete (ret as any).__v; return ret; } },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
categorySchema.index({ isActive: 1, displayOrder: 1 }, { name: 'active_order' });
categorySchema.index({ parentCategory: 1, isActive: 1 }, { name: 'parent_active', sparse: true });
categorySchema.index({ 'meta.keywords': 1 }, { name: 'meta_keywords', sparse: true });

// ── Pre-save: slug + ancestor path ────────────────────────────────────────────
categorySchema.pre('save', async function (next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  // Build ancestor array for materialized path pattern
  if (this.isModified('parentCategory') && this.parentCategory) {
    const parent = await mongoose.model<ICategory>('Category')
      .findById(this.parentCategory)
      .select('ancestors depth');
    if (parent) {
      this.ancestors = [...parent.ancestors, parent._id];
      this.depth = parent.depth + 1;
    }
  } else if (!this.parentCategory) {
    this.ancestors = [];
    this.depth = 0;
  }

  next();
});

const Category = mongoose.model<ICategory>('Category', categorySchema);
export default Category;
