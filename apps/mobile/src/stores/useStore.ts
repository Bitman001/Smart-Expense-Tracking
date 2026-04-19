import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, recordsAPI, categoriesAPI, familiesAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  is_system: number;
}

interface Record {
  id: string;
  amount: number;
  type: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  description: string;
  date: string;
  source: string;
  user_id: string;
  user_name?: string;
  family_id?: string;
  created_at: string;
}

interface Family {
  id: string;
  name: string;
  invite_code: string;
  my_role: string;
  members: any[];
}

interface Summary {
  month: string;
  totalExpense: number;
  totalIncome: number;
  balance: number;
  budget: number;
  budgetUsed: number;
  byCategory: any[];
  dailyTrend: any[];
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isLoading: boolean;

  // Data
  records: Record[];
  categories: Category[];
  families: Family[];
  summary: Summary | null;
  currentFamilyId: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  fetchRecords: (params?: any) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchFamilies: () => Promise<void>;
  fetchSummary: (month?: string) => Promise<void>;
  setCurrentFamily: (familyId: string | null) => void;
  addRecord: (record: Record) => void;
  removeRecord: (id: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  records: [],
  categories: [],
  families: [],
  summary: null,
  currentFamilyId: null,

  login: async (email, password) => {
    const res: any = await authAPI.login(email, password);
    const { user, token } = res.data;
    await AsyncStorage.setItem('token', token);
    // ⚠️ 必须清空上一用户的缓存数据,否则会把前一个账号的 currentFamilyId
    // 透传给后端 → 拉到别人的账单(已知历史 bug)
    set({
      user,
      token,
      records: [],
      summary: null,
      families: [],
      currentFamilyId: null,
    });
  },

  register: async (name, email, password) => {
    const res: any = await authAPI.register(name, email, password);
    const { user, token } = res.data;
    await AsyncStorage.setItem('token', token);
    // 同 login,清空所有前一用户的缓存
    set({
      user,
      token,
      records: [],
      summary: null,
      families: [],
      currentFamilyId: null,
    });
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({
      user: null,
      token: null,
      records: [],
      families: [],
      summary: null,
      categories: [],
      currentFamilyId: null,
    });
  },

  loadSession: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const res: any = await authAPI.getMe();
        set({ user: res.data, token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await AsyncStorage.removeItem('token');
      set({ isLoading: false });
    }
  },

  fetchRecords: async (params) => {
    try {
      const familyId = get().currentFamilyId;
      const res: any = await recordsAPI.getList({ ...params, familyId: familyId || undefined });
      set({ records: res.data.records });
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  },

  fetchCategories: async () => {
    try {
      const res: any = await categoriesAPI.getAll();
      set({ categories: res.data });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  },

  fetchFamilies: async () => {
    try {
      const res: any = await familiesAPI.getList();
      set({ families: res.data });
      // 如果有家庭且未选择，默认选第一个
      if (res.data.length > 0 && !get().currentFamilyId) {
        set({ currentFamilyId: res.data[0].id });
      }
    } catch (error) {
      console.error('Failed to fetch families:', error);
    }
  },

  fetchSummary: async (month) => {
    try {
      const familyId = get().currentFamilyId;
      const res: any = await recordsAPI.getSummary({ month, familyId: familyId || undefined });
      set({ summary: res.data });
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  },

  setCurrentFamily: (familyId) => set({ currentFamilyId: familyId }),

  addRecord: (record) => set((state) => ({ records: [record, ...state.records] })),

  removeRecord: (id) => set((state) => ({ records: state.records.filter(r => r.id !== id) })),
}));
