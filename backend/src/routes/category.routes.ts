import { Router, Request, Response, NextFunction } from 'express';
import Category from '../models/Category.model';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    sendSuccess(res, { data: categories });
  } catch (err) { next(err); }
});

router.post('/', protect, authorize('admin', 'editor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.create(req.body as Record<string, unknown>);
    sendCreated(res, category);
  } catch (err) { next(err); }
});

export default router;
