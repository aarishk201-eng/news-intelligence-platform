/**
 * @module io/auth.io
 * @description JWT verification for Socket.IO connections
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface DecodedJWT {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Verify JWT token from Socket.IO handshake
 */
export const verifyJWT = async (token: string): Promise<DecodedJWT> => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as DecodedJWT;

    return decoded;
  } catch (error) {
    logger.warn('JWT verification failed', { error: String(error) });
    throw error;
  }
};
