import { Router, Request, Response, NextFunction } from 'express';
import { protect, authorize, AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { StatusCodes } from 'http-status-codes';

const router = Router();

// PATCH /users/me/preferences
router.patch('/me/preferences', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { preferences: req.body as Record<string, unknown> },
      { new: true, runValidators: true }
    );
    sendSuccess(res, { data: user?.preferences, message: 'Preferences updated' });
  } catch (err) { next(err); }
});

// GET /users (admin only)
router.get('/', protect, authorize('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    sendSuccess(res, { data: users });
  } catch (err) { next(err); }
});

// DELETE /users/:id (admin only)
router.delete('/:id', protect, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return next(new AppError('User not found', StatusCodes.NOT_FOUND));
    sendSuccess(res, { message: 'User deactivated' });
  } catch (err) { next(err); }
});

export default router;
