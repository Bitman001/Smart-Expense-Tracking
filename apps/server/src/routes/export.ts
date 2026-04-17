import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

// 导出 CSV
router.get('/csv', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { familyId, startDate, endDate } = req.query;

    let query = `
      SELECT r.date, r.type, r.amount, c.name as category, r.description, r.source, u.name as user_name
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

    if (startDate) { query += ' AND r.date >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND r.date <= ?'; params.push(endDate); }

    query += ' ORDER BY r.date DESC';

    const records = db.prepare(query).all(...params) as any[];

    // 生成 CSV
    const headers = '日期,类型,金额,类别,描述,来源,记录人';
    const rows = records.map((r: any) =>
      `${r.date},${r.type === 'expense' ? '支出' : '收入'},${r.amount},${r.category},${r.description},${r.source},${r.user_name}`
    );

    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=records.csv');
    res.send('\uFEFF' + csv); // BOM for Excel
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 导出 JSON 统计数据（用于分享卡片）
router.get('/share-data', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { month, familyId } = req.query;
    const currentMonth = (month as string) || new Date().toISOString().slice(0, 7);
    const startDate = `${currentMonth}-01`;
    const endDate = `${currentMonth}-31`;

    let whereClause = 'WHERE r.date >= ? AND r.date <= ?';
    const params: any[] = [startDate, endDate];

    if (familyId) {
      whereClause += ' AND r.family_id = ?';
      params.push(familyId);
    } else {
      whereClause += ' AND r.user_id = ?';
      params.push(req.userId);
    }

    const totals = db.prepare(`
      SELECT type, SUM(amount) as total, COUNT(*) as count
      FROM records r ${whereClause} GROUP BY type
    `).all(...params) as any[];

    const topCategories = db.prepare(`
      SELECT c.name, c.icon, c.color, SUM(r.amount) as total
      FROM records r LEFT JOIN categories c ON r.category_id = c.id
      ${whereClause} AND r.type = 'expense'
      GROUP BY r.category_id ORDER BY total DESC LIMIT 5
    `).all(...params);

    let expense = 0, income = 0;
    totals.forEach((t: any) => {
      if (t.type === 'expense') expense = t.total;
      if (t.type === 'income') income = t.total;
    });

    res.json({
      success: true,
      data: {
        month: currentMonth,
        totalExpense: expense,
        totalIncome: income,
        balance: income - expense,
        topCategories,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
