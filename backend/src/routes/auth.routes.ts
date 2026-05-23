import { Router } from 'express';
import {
  register, login, logout, getMe,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import {
  registerValidator, loginValidator,
} from '../validators/auth.validators';

/**
 * @router /api/v1/auth
 *
 * POST /register         — Create account (rate limited)
 * POST /login            — Login (rate limited per email)
 * POST /logout           — Logout (clears cookie)
 * GET  /me               — Get current user profile
 */
const router = Router();

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login',    authLimiter, loginValidator,    validate, login);
router.post('/logout',   protect,                                  logout);
router.get( '/me',       protect,                                  getMe);

export default router;
