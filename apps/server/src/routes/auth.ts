import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { generateToken, authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

// 注册
router.post('/register', (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: '请填写完整信息' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ success: false, error: '该邮箱已注册' });
    }

    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.prepare('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)').run(
      id, name, email, hashedPassword
    );

    const token = generateToken(id);
    const user = db.prepare('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?').get(id);

    res.json({ success: true, data: { user, token } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 登录
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: '请填写邮箱和密码' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      return res.status(400).json({ success: false, error: '邮箱或密码错误' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ success: false, error: '邮箱或密码错误' });
    }

    const token = generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;

    res.json({ success: true, data: { user: userWithoutPassword, token } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: req.user });
});

// 更新用户信息
router.put('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name, avatar } = req.body;
    if (name) {
      db.prepare("UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name, req.userId);
    }
    if (avatar) {
      db.prepare("UPDATE users SET avatar = ?, updated_at = datetime('now') WHERE id = ?").run(avatar, req.userId);
    }
    const user = db.prepare('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?').get(req.userId);
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
