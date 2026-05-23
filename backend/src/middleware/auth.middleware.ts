import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/AppError';
import User, { IUser } from '../models/User.model';
import { logger } from '../config/logger';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', StatusCodes.UNAUTHORIZED));
    }

    const decoded = jwt.verify(
      token,
      env.JWT_SECRET,
      {
        algorithms: ['HS256'],            // Pin algorithm — prevents RS256/none substitution
        issuer:     env.JWT_ISSUER,        // Validate iss claim
        audience:   env.JWT_AUDIENCE,      // Validate aud claim
      }
    ) as JwtPayload;

    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!user) {
      return next(new AppError('User no longer exists.', StatusCodes.UNAUTHORIZED));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Contact support.', StatusCodes.FORBIDDEN));
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('Password was recently changed. Please log in again.', StatusCodes.UNAUTHORIZED));
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn('JWT verification failed:', error);
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired. Please log in again.', StatusCodes.UNAUTHORIZED));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token. Please log in again.', StatusCodes.UNAUTHORIZED));
    }
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Role '${req.user?.role ?? 'unknown'}' is not authorized to access this resource.`,
          StatusCodes.FORBIDDEN
        )
      );
    }
    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(
        token,
        env.JWT_SECRET,
        { algorithms: ['HS256'], issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE }
      ) as JwtPayload;
      const user = await User.findById(decoded.id);
      if (user?.isActive) req.user = user;
    }
  } catch {
    // Non-fatal for optional auth
  }
  next();
};
