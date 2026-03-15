import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'staff';
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware that verifies a Bearer JWT from the Authorization header.
 * On success, attaches the decoded payload to req.user.
 * Returns 401 if the token is missing or invalid.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired.' });
      return;
    }
    res.status(401).json({ error: 'Invalid token.' });
  }
}

/**
 * Middleware factory that restricts access to users with specific roles.
 * Must be used after `authenticate`.
 * Returns 403 if the user's role is not in the allowed list.
 */
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    next();
  };
}
