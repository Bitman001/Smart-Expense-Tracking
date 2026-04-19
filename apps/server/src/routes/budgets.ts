import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { isFamilyMember } from '../middlewares/family';

const router = Router();

// 获取预算
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { month, familyId } = req.query;
    const currentMonth = (month as string) || new Date().toISOString().slice(0, 7);

    // 🔒 数据隔离
    if (familyId && !isFamilyMember(req.userId, familyId as string)) {
      return res.status(403).json({ success: false, error: '无权访问该家庭数据' });
    }

    let query = 'SELECT b.*, c.name as category_name, c.icon as category_icon FROM budgets b LEFT JOIN categories c ON b.category_id = c.id WHERE b.month = ?';
    const params: any[] = [currentMonth];

    if (familyId) {
      query += ' AND b.family_id = ?';
      params.push(familyId);
    } else {
      query += ' AND b.user_id = ? AND b.family_id IS NULL';
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

    // 🔒 数据隔离:设置家庭预算前必须是家庭成员
    if (familyId && !isFamilyMember(req.userId, familyId)) {
      return res.status(403).json({ success: false, error: '无权操作该家庭数据' });
    }

    // 检查是否已存在:家庭预算按 family_id 归属,个人预算按 user_id 归属,
    // 二者互不干扰(避免之前 `OR` 条件跨作用域匹配)
    const scopeSql = familyId ? 'family_id = ?' : 'user_id = ? AND family_id IS NULL';
    const scopeParam = familyId || req.userId;
    const catSql = categoryId ? 'category_id = ?' : 'category_id IS NULL';

    const params: any[] = [currentMonth];
    if (categoryId) params.push(categoryId);
    params.push(scopeParam);

    const existing = db.prepare(
      `SELECT * FROM budgets WHERE month = ? AND ${catSql} AND ${scopeSql}`
    ).get(...params);

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
