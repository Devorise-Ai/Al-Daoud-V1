import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { env } from '../config/env';
import { authenticate, JwtPayload } from '../middleware/auth';
import { loginSchema } from '../../../../packages/shared/src/validation';

const router = Router();

/**
 * POST /login
 * Authenticates an admin user with email and password.
 * Returns a JWT token and user info on success.
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed.',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parsed.data;

    // Look up the admin user by email
    const result = await query(
      'SELECT id, email, password_hash, name, role, is_active FROM admin_users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = result.rows[0];

    // Check if the account is active
    if (!user.is_active) {
      res.status(403).json({ error: 'Account is deactivated. Contact an administrator.' });
      return;
    }

    // Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Generate JWT
    const tokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, env.jwtSecret, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /refresh
 * Issues a new JWT with a fresh 24h expiry for the authenticated user.
 * Requires a valid (non-expired) token via the authenticate middleware.
 */
router.post('/refresh', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    // Verify the user still exists and is active
    const result = await query(
      'SELECT id, email, name, role, is_active FROM admin_users WHERE id = $1',
      [user.id]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User no longer exists.' });
      return;
    }

    const dbUser = result.rows[0];

    if (!dbUser.is_active) {
      res.status(403).json({ error: 'Account is deactivated.' });
      return;
    }

    // Issue a fresh token with latest user data from DB
    const tokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
    };

    const token = jwt.sign(tokenPayload, env.jwtSecret, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
      },
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /me
 * Returns the current authenticated user's info from the JWT.
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    // Fetch fresh data from the database to ensure accuracy
    const result = await query(
      'SELECT id, email, name, role, is_active, created_at, updated_at FROM admin_users WHERE id = $1',
      [user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const dbUser = result.rows[0];

    if (!dbUser.is_active) {
      res.status(403).json({ error: 'Account is deactivated.' });
      return;
    }

    res.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        is_active: dbUser.is_active,
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at,
      },
    });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
