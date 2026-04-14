import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { signToken, authenticate } from '../middleware/auth';

export const authRouter = Router();

// POST /api/v1/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { phone, pin } = req.body;

  if (!phone || !pin) {
    res.status(400).json({ error: 'Phone and PIN required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !user.active) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(pin, user.pin);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role, phone: user.phone });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        details: `User ${user.name} logged in`,
      },
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        zone: user.zone,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/v1/auth/me
authRouter.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, phone: true, role: true, zone: true, active: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/v1/auth/integration-mode
authRouter.get('/integration-mode', (_req: Request, res: Response): void => {
  const mode = process.env.INTEGRATION_MODE || 'standalone';
  res.json({ mode });
});
