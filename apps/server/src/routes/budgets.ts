import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

// 获取预算
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { month, familyId } = req.query;
    const currentMonth = (month as string) || new Date().toISOString().slice(0, 7);

    let query = 'SELECT b.*, c.name as category_name, c.icon as category_icon FROM budgets b LEFT JOIN categories c ON b.category_id = c.id WHERE b.month = ?';
    const params: any[] = [currentMonth];

    if (familyId) {
      query += ' AND b.family_id = ?';
      params.push(familyId);
    } else {
      query += ' AND b.user_id = ?';
      params.push(req.userId);
    }

    const budgets = db.prepare(query).all(...params);
    res.json({ success: true, data: budgets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建/更新预算
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { amount, month, categoryId, familyId } = req.body;
    const currentMonth = month || new Date().toISOString().slice(0, 7);

    if (!amount) {
      return res.status(400).json({ success: false, error: '请输入预算金额' });
    }

    // 检查是否已存在
    let existing;
    if (categoryId) {
      existing = db.prepare(
        'SELECT * FROM budgets WHERE month = ? AND category_id = ? AND (user_id = ? OR family_id = ?)'
      ).get(currentMonth, categoryId, req.userId, familyId || '');
    } else {
      existing = db.prepare(
        'SELECT * FROM budgets WHERE month = ? AND category_id IS NULL AND (user_id = ? OR family_id = ?)'
      ).get(currentMonth, req.userId, familyId || '');
    }

    if (existing) {
      db.prepare("UPDATE budgets SET amount = ?, updated_at = datetime('now') WHERE id = ?").run(amount, (existing as any).id);
      const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get((existing as any).id);
      return res.json({ success: true, data: budget });
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO budgets (id, amount, month, category_id, user_id, family_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, amount, currentMonth, categoryId || null, req.userId, familyId || null);

    const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
