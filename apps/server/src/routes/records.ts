import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { isFamilyMember } from '../middlewares/family';

const router = Router();

// 获取记录列表
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { familyId, startDate, endDate, categoryId, type, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // 🔒 数据隔离:传入 familyId 时必须验证调用者是该家庭成员,
    // 否则任何人猜到 family UUID 就能读别人家的账单。
    if (familyId && !isFamilyMember(req.userId, familyId as string)) {
      return res.status(403).json({ success: false, error: '无权访问该家庭数据' });
    }

    let query = `
      SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
             u.name as user_name, u.avatar as user_avatar
      FROM records r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (familyId) {
      query += ' AND r.family_id = ?';
      params.push(familyId);
    } else {
      query += ' AND r.user_id = ?';
      params.push(req.userId);
    }

    if (startDate) {
      query += ' AND r.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND r.date <= ?';
      params.push(endDate);
    }
    if (categoryId) {
      query += ' AND r.category_id = ?';
      params.push(categoryId);
    }
    if (type) {
      query += ' AND r.type = ?';
      params.push(type);
    }

    // 获取总数
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = db.prepare(countQuery).get(...params) as any;

    query += ' ORDER BY date(r.date) DESC, r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const records = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limitNum),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建记录
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { amount, type = 'expense', categoryId, description = '', date, source = 'manual', familyId } = req.body;

    if (!amount || !categoryId) {
      return res.status(400).json({ success: false, error: '金额和类别不能为空' });
    }

    // 🔒 数据隔离:要把账单挂到某家庭下,必须是该家庭成员
    if (familyId && !isFamilyMember(req.userId, familyId)) {
      return res.status(403).json({ success: false, error: '无权在该家庭下创建账单' });
    }

    const id = uuidv4();
    const recordDate = date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO records (id, amount, type, category_id, description, date, source, user_id, family_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, amount, type, categoryId, description, recordDate, source, req.userId, familyId || null);

    const record = db.prepare(`
      SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM records r LEFT JOIN categories c ON r.category_id = c.id WHERE r.id = ?
    `).get(id);

    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新记录
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, type, categoryId, description, date } = req.body;

    const existing = db.prepare('SELECT * FROM records WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (!existing) {
      return res.status(404).json({ success: false, error: '记录不存在' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (amount !== undefined) { updates.push('amount = ?'); params.push(amount); }
    if (type) { updates.push('type = ?'); params.push(type); }
    if (categoryId) { updates.push('category_id = ?'); params.push(categoryId); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (date) { updates.push('date = ?'); params.push(date); }

    updates.push("updated_at = datetime('now')");
    params.push(id);

    db.prepare(`UPDATE records SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const record = db.prepare(`
      SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM records r LEFT JOIN categories c ON r.category_id = c.id WHERE r.id = ?
    `).get(id);

    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除记录
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM records WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (!existing) {
      return res.status(404).json({ success: false, error: '记录不存在' });
    }

    db.prepare('DELETE FROM records WHERE id = ?').run(id);
    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取统计摘要
router.get('/summary', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { familyId, month } = req.query;
    const currentMonth = (month as string) || new Date().toISOString().slice(0, 7);
    const startDate = `${currentMonth}-01`;
    const endDate = `${currentMonth}-31`;

    // 🔒 数据隔离:同 GET /,familyId 必须匹配成员关系
    if (familyId && !isFamilyMember(req.userId, familyId as string)) {
      return res.status(403).json({ success: false, error: '无权访问该家庭数据' });
    }

    let whereClause = 'WHERE r.date >= ? AND r.date <= ?';
    const params: any[] = [startDate, endDate];

    if (familyId) {
      whereClause += ' AND r.family_id = ?';
      params.push(familyId);
    } else {
      whereClause += ' AND r.user_id = ?';
      params.push(req.userId);
    }

    // 总收支
    const totals = db.prepare(`
      SELECT type, SUM(amount) as total FROM records r ${whereClause} GROUP BY type
    `).all(...params) as any[];

    let totalExpense = 0;
    let totalIncome = 0;
    totals.forEach((t: any) => {
      if (t.type === 'expense') totalExpense = t.total;
      if (t.type === 'income') totalIncome = t.total;
    });

    // 按类别统计
    const byCategory = db.prepare(`
      SELECT c.id, c.name, c.icon, c.color, c.type as cat_type, r.type, SUM(r.amount) as total, COUNT(*) as count
      FROM records r
      LEFT JOIN categories c ON r.category_id = c.id
      ${whereClause}
      GROUP BY r.category_id, r.type
      ORDER BY total DESC
    `).all(...params);

    // 按日统计（趋势图数据）
    const dailyTrend = db.prepare(`
      SELECT date, type, SUM(amount) as total
      FROM records r
      ${whereClause}
      GROUP BY date, type
      ORDER BY date ASC
    `).all(...params);

    // 预算信息:家庭视图优先查家庭预算,个人视图只查自己的预算
    // 旧实现用 `(user_id = ? OR family_id = ?)` + `familyId || ''`,
    // 虽然空字符串不会匹配真实 UUID,但逻辑混乱,改成分支清晰的写法。
    const budget = familyId
      ? db.prepare('SELECT * FROM budgets WHERE month = ? AND family_id = ?')
          .get(currentMonth, familyId) as any
      : db.prepare('SELECT * FROM budgets WHERE month = ? AND user_id = ? AND family_id IS NULL')
          .get(currentMonth, req.userId) as any;

    res.json({
      success: true,
      data: {
        month: currentMonth,
        totalExpense,
        totalIncome,
        balance: totalIncome - totalExpense,
        budget: budget?.amount || 0,
        budgetUsed: totalExpense,
        byCategory,
        dailyTrend,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
