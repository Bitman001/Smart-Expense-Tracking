import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../database';

const JWT_SECRET = process.env.JWT_SECRET || 'smart-expense-jwt-secret-2024';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;

    const user = db.prepare('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: '用户不存在' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: '令牌无效或已过期' });
  }
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}
