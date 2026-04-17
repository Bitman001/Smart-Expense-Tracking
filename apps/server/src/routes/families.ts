import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

// 生成邀请码
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 获取用户的家庭列表
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const families = db.prepare(`
      SELECT f.*, fm.role as my_role
      FROM families f
      INNER JOIN family_members fm ON f.id = fm.family_id
      WHERE fm.user_id = ?
    `).all(req.userId) as any[];

    // 为每个家庭获取成员
    const result = families.map((family: any) => {
      const members = db.prepare(`
        SELECT fm.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
        FROM family_members fm
        LEFT JOIN users u ON fm.user_id = u.id
        WHERE fm.family_id = ?
      `).all(family.id);

      return { ...family, members };
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建家庭
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: '请输入家庭名称' });
    }

    const familyId = uuidv4();
    const inviteCode = generateInviteCode();

    db.prepare('INSERT INTO families (id, name, invite_code) VALUES (?, ?, ?)').run(familyId, name, inviteCode);

    // 创建者自动成为管理员
    db.prepare('INSERT INTO family_members (id, user_id, family_id, role) VALUES (?, ?, ?, ?)').run(
      uuidv4(), req.userId, familyId, 'admin'
    );

    const family = db.prepare('SELECT * FROM families WHERE id = ?').get(familyId);
    res.json({ success: true, data: family });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 通过邀请码加入家庭
router.post('/join', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ success: false, error: '请输入邀请码' });
    }

    const family = db.prepare('SELECT * FROM families WHERE invite_code = ?').get(inviteCode) as any;
    if (!family) {
      return res.status(404).json({ success: false, error: '邀请码无效' });
    }

    const existing = db.prepare(
      'SELECT * FROM family_members WHERE user_id = ? AND family_id = ?'
    ).get(req.userId, family.id);
    if (existing) {
      return res.status(400).json({ success: false, error: '你已经是该家庭成员' });
    }

    db.prepare('INSERT INTO family_members (id, user_id, family_id, role) VALUES (?, ?, ?, ?)').run(
      uuidv4(), req.userId, family.id, 'member'
    );

    res.json({ success: true, data: family, message: '成功加入家庭' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新成员角色
router.put('/:familyId/members/:memberId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { familyId, memberId } = req.params;
    const { role } = req.body;

    // 检查操作者是否是管理员
    const operator = db.prepare(
      'SELECT * FROM family_members WHERE user_id = ? AND family_id = ? AND role = ?'
    ).get(req.userId, familyId, 'admin');

    if (!operator) {
      return res.status(403).json({ success: false, error: '只有管理员可以修改角色' });
    }

    db.prepare('UPDATE family_members SET role = ? WHERE id = ? AND family_id = ?').run(role, memberId, familyId);
    res.json({ success: true, message: '角色更新成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取家庭统计
router.get('/:familyId/stats', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { familyId } = req.params;
    const { month } = req.query;
    const currentMonth = (month as string) || new Date().toISOString().slice(0, 7);
    const startDate = `${currentMonth}-01`;
    const endDate = `${currentMonth}-31`;

    // 按成员统计
    const memberStats = db.prepare(`
      SELECT u.id, u.name, u.avatar,
             SUM(CASE WHEN r.type = 'expense' THEN r.amount ELSE 0 END) as total_expense,
             SUM(CASE WHEN r.type = 'income' THEN r.amount ELSE 0 END) as total_income,
             COUNT(*) as record_count
      FROM records r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.family_id = ? AND r.date >= ? AND r.date <= ?
      GROUP BY r.user_id
    `).all(familyId, startDate, endDate);

    res.json({ success: true, data: { memberStats, month: currentMonth } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
