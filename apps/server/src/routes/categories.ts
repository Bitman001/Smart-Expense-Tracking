import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

// 获取所有类别
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const categories = db.prepare(
      'SELECT * FROM categories WHERE is_system = 1 OR user_id = ? ORDER BY type, is_system DESC, created_at ASC'
    ).all(req.userId);

    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建自定义类别
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name, icon, color, type = 'expense' } = req.body;

    if (!name || !icon || !color) {
      return res.status(400).json({ success: false, error: '请填写完整类别信息' });
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO categories (id, name, icon, color, type, is_system, user_id) VALUES (?, ?, ?, ?, ?, 0, ?)'
    ).run(id, name, icon, color, type, req.userId);

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.json({ success: true, data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
