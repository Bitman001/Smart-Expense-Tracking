import db from './database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const DEFAULT_CATEGORIES = [
  { name: '餐饮', icon: '🍽️', color: '#FF6B6B', type: 'expense' },
  { name: '交通', icon: '🚗', color: '#74B9FF', type: 'expense' },
  { name: '购物', icon: '🛒', color: '#FD79A8', type: 'expense' },
  { name: '娱乐', icon: '🎮', color: '#6C5CE7', type: 'expense' },
  { name: '医疗', icon: '🏥', color: '#00B894', type: 'expense' },
  { name: '教育', icon: '📚', color: '#FDCB6E', type: 'expense' },
  { name: '居住', icon: '🏠', color: '#E17055', type: 'expense' },
  { name: '通讯', icon: '📱', color: '#0984E3', type: 'expense' },
  { name: '服饰', icon: '👔', color: '#E84393', type: 'expense' },
  { name: '其他', icon: '📌', color: '#636E72', type: 'expense' },
  { name: '工资', icon: '💰', color: '#00B894', type: 'income' },
  { name: '奖金', icon: '🎁', color: '#FDCB6E', type: 'income' },
  { name: '投资', icon: '📈', color: '#6C5CE7', type: 'income' },
  { name: '其他收入', icon: '💵', color: '#74B9FF', type: 'income' },
];

export function seedDatabase() {
  // 检查是否已有类别
  const count = db.prepare('SELECT COUNT(*) as count FROM categories WHERE is_system = 1').get() as any;
  if (count.count > 0) {
    console.log('📦 System categories already exist, skipping seed.');
    return;
  }

  const insertCategory = db.prepare(
    'INSERT INTO categories (id, name, icon, color, type, is_system) VALUES (?, ?, ?, ?, ?, 1)'
  );

  const insertMany = db.transaction(() => {
    for (const cat of DEFAULT_CATEGORIES) {
      insertCategory.run(uuidv4(), cat.name, cat.icon, cat.color, cat.type);
    }
  });

  insertMany();

  // 创建演示用户
  const demoUserId = uuidv4();
  const hashedPassword = bcrypt.hashSync('demo123', 10);
  db.prepare(
    'INSERT INTO users (id, name, email, password, avatar) VALUES (?, ?, ?, ?, ?)'
  ).run(demoUserId, '演示用户', 'demo@example.com', hashedPassword, null);

  // 创建演示家庭
  const familyId = uuidv4();
  db.prepare(
    'INSERT INTO families (id, name, invite_code) VALUES (?, ?, ?)'
  ).run(familyId, '我的家庭', 'DEMO2024');

  // 将演示用户加入家庭
  db.prepare(
    'INSERT INTO family_members (id, user_id, family_id, role) VALUES (?, ?, ?, ?)'
  ).run(uuidv4(), demoUserId, familyId, 'admin');

  // 获取类别 ID
  const categories = db.prepare('SELECT id, name, type FROM categories WHERE is_system = 1').all() as any[];
  const catMap: Record<string, string> = {};
  categories.forEach((c: any) => { catMap[c.name] = c.id; });

  // 创建演示记录（最近30天的数据）
  const insertRecord = db.prepare(
    'INSERT INTO records (id, amount, type, category_id, description, date, source, user_id, family_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const demoRecords = [
    { amount: 35, type: 'expense', cat: '餐饮', desc: '午餐外卖', days: 0 },
    { amount: 15, type: 'expense', cat: '交通', desc: '地铁通勤', days: 0 },
    { amount: 299, type: 'expense', cat: '购物', desc: '买了件新衣服', days: 1 },
    { amount: 88, type: 'expense', cat: '娱乐', desc: '看电影+爆米花', days: 1 },
    { amount: 42, type: 'expense', cat: '餐饮', desc: '晚餐火锅', days: 2 },
    { amount: 200, type: 'expense', cat: '医疗', desc: '体检费用', days: 3 },
    { amount: 68, type: 'expense', cat: '教育', desc: '买了本技术书', days: 4 },
    { amount: 2500, type: 'expense', cat: '居住', desc: '月租分摊', days: 5 },
    { amount: 50, type: 'expense', cat: '通讯', desc: '手机话费', days: 6 },
    { amount: 128, type: 'expense', cat: '服饰', desc: '新鞋子', days: 7 },
    { amount: 25, type: 'expense', cat: '餐饮', desc: '早餐咖啡', days: 8 },
    { amount: 15000, type: 'income', cat: '工资', desc: '月工资', days: 10 },
    { amount: 2000, type: 'income', cat: '奖金', desc: '季度奖金', days: 15 },
    { amount: 500, type: 'income', cat: '投资', desc: '基金收益', days: 20 },
    { amount: 56, type: 'expense', cat: '餐饮', desc: '朋友聚餐', days: 9 },
    { amount: 30, type: 'expense', cat: '交通', desc: '打车回家', days: 10 },
    { amount: 199, type: 'expense', cat: '购物', desc: '日用品采购', days: 12 },
    { amount: 66, type: 'expense', cat: '娱乐', desc: '游戏充值', days: 14 },
    { amount: 38, type: 'expense', cat: '餐饮', desc: '下午茶', days: 16 },
    { amount: 120, type: 'expense', cat: '教育', desc: '在线课程', days: 18 },
  ];

  const insertDemoRecords = db.transaction(() => {
    for (const r of demoRecords) {
      const date = new Date();
      date.setDate(date.getDate() - r.days);
      const dateStr = date.toISOString().split('T')[0];
      insertRecord.run(
        uuidv4(), r.amount, r.type, catMap[r.cat], r.desc, dateStr, 'manual', demoUserId, familyId
      );
    }
  });

  insertDemoRecords();

  // 创建演示预算
  db.prepare(
    'INSERT INTO budgets (id, amount, month, user_id, family_id) VALUES (?, ?, ?, ?, ?)'
  ).run(uuidv4(), 8000, new Date().toISOString().slice(0, 7), demoUserId, familyId);

  console.log('🌱 Seed data created successfully');
}
