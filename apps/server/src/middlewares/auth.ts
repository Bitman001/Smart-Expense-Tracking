import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../database';

// JWT 签名密钥:生产环境必须通过环境变量 JWT_SECRET 显式设置。
// 未设置时,为避免泄露代码中的固定字符串导致令牌伪造,改为进程启动时随机生成。
// 副作用:进程重启后旧 token 全部失效(这是开发环境可接受的,生产环境请务必设置)。
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn(
    '[auth] ⚠️  JWT_SECRET 环境变量未设置,已使用随机值。进程重启后所有 token 失效。生产环境请务必在 .env 中配置 JWT_SECRET。'
  );
}

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
