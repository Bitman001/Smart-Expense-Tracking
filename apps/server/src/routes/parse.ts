import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { parseExpenseText, parseWithAI } from '../services/aiParser';

const router = Router();

// 智能解析文本
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text, useAI = false } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: '请输入文本' });
    }

    let result;
    if (useAI) {
      result = await parseWithAI(text);
    } else {
      result = parseExpenseText(text);
    }

    // 查找匹配的类别 ID
    const category = db.prepare(
      'SELECT * FROM categories WHERE name = ? AND (is_system = 1 OR user_id = ?)'
    ).get(result.category, req.userId) as any;

    res.json({
      success: true,
      data: {
        ...result,
        categoryId: category?.id,
        categoryIcon: category?.icon,
        categoryColor: category?.color,
        date: result.date || new Date().toISOString().split('T')[0],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
