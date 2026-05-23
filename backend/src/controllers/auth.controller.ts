import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import User from '../models/User.model';
import { AppError } from '../utils/AppError';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { validate } from '../middleware/validate.middleware';

// ─── Validators ────────────────────────────────────────────────────────────────
export const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
  validate,
];

export const loginValidators = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ─── Cookie options ────────────────────────────────────────────────────────────
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// ─── Register ──────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('An account with this email already exists.', StatusCodes.CONFLICT));
    }

    const user = await User.create({ name, email, password });
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    res.cookie('refreshToken', refreshToken, cookieOptions);

    sendCreated(res, {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    }, 'Account created successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Login ─────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password.', StatusCodes.UNAUTHORIZED));
    }

    if (!user.isActive) {
      return next(new AppError('Account deactivated. Please contact support.', StatusCodes.FORBIDDEN));
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    res.cookie('refreshToken', refreshToken, cookieOptions);

    sendSuccess(res, {
      message: 'Login successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, preferences: user.preferences },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Logout ────────────────────────────────────────────────────────────────────
export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('refreshToken');
  sendSuccess(res, { message: 'Logged out successfully' });
};

// ─── Get current user ──────────────────────────────────────────────────────────
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById((req as { user?: { _id: unknown } }).user?._id)
      .populate('savedArticles', 'title slug urlToImage publishedAt');
    if (!user) return next(new AppError('User not found', StatusCodes.NOT_FOUND));
    sendSuccess(res, { data: user });
  } catch (error) {
    next(error);
  }
};
