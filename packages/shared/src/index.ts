// ============================================
// @smart-expense/shared - 共享类型与常量
// ============================================

// ---- 角色枚举 ----
export enum FamilyRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

// ---- 记录来源枚举 ----
export enum RecordSource {
  TEXT = 'text',
  VOICE = 'voice',
  MANUAL = 'manual',
  OCR = 'ocr',
}

// ---- 记录类型枚举 ----
export enum RecordType {
  EXPENSE = 'expense',
  INCOME = 'income',
}

// ---- 系统默认类别 ----
export const DEFAULT_CATEGORIES = [
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
] as const;

// ---- 主题配置 ----
export const THEME = {
  colors: {
    primary: '#6C5CE7',
    secondary: '#FD79A8',
    accent: '#00B894',
    danger: '#FF6B6B',
    warning: '#FDCB6E',
    info: '#74B9FF',
    background: '#F8F9FE',
    card: '#FFFFFF',
    text: '#2D3436',
    textSecondary: '#636E72',
    textLight: '#B2BEC3',
    border: '#E8E8F0',
    gradientPurple: ['#6C5CE7', '#A29BFE'],
    gradientPink: ['#FD79A8', '#FDCB6E'],
    gradientGreen: ['#00B894', '#55EFC4'],
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    full: 999,
  },
  shadow: {
    sm: {
      shadowColor: '#6C5CE7',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#6C5CE7',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 4,
    },
    lg: {
      shadowColor: '#6C5CE7',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
  },
} as const;

// ---- API 响应类型 ----
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ---- 用户类型 ----
export interface IUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

// ---- 家庭类型 ----
export interface IFamily {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  members?: IFamilyMember[];
}

// ---- 家庭成员类型 ----
export interface IFamilyMember {
  id: string;
  userId: string;
  familyId: string;
  role: FamilyRole;
  user?: IUser;
}

// ---- 记账记录类型 ----
export interface IRecord {
  id: string;
  amount: number;
  type: RecordType;
  categoryId: string;
  category?: ICategory;
  description: string;
  date: string;
  source: RecordSource;
  userId: string;
  user?: IUser;
  familyId?: string;
  createdAt: string;
}

// ---- 类别类型 ----
export interface ICategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  isSystem: boolean;
}

// ---- 预算类型 ----
export interface IBudget {
  id: string;
  amount: number;
  month: string;
  categoryId?: string;
  category?: ICategory;
  userId?: string;
  familyId?: string;
}

// ---- AI 解析结果类型 ----
export interface ParseResult {
  amount: number;
  category: string;
  description: string;
  type: RecordType;
  date?: string;
  confidence: number;
}
