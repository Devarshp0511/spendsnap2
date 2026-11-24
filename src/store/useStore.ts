import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Settings } from '../constants/types';
import { CategoryKey } from '../constants/theme';

const daysAgo = (n: number, h=12, m=0) => {
  const d = new Date(); d.setDate(d.getDate()-n); d.setHours(h,m,0,0); return d.toISOString();
};

const SEED: Expense[] = [
  { id:'s1',  amount:420,  label:'Pizza Hut',    category:'food',      captureMethod:'scan',   createdAt: daysAgo(0,14,34) },
  { id:'s2',  amount:540,  label:'Ola Cab',       category:'transport', captureMethod:'sms',    createdAt: daysAgo(0,11,15) },
  { id:'s3',  amount:360,  label:'Starbucks',     category:'food',      captureMethod:'manual', createdAt: daysAgo(0,9,2)   },
  { id:'s4',  amount:327,  label:'D-Mart',        category:'shopping',  captureMethod:'scan',   createdAt: daysAgo(0,8,20)  },
  { id:'s5',  amount:200,  label:'Swiggy',        category:'food',      captureMethod:'sms',    createdAt: daysAgo(1,20,10) },
  { id:'s6',  amount:800,  label:'Petrol',        category:'transport', captureMethod:'sms',    createdAt: daysAgo(1,17,30) },
  { id:'s7',  amount:1200, label:'Amazon Order',  category:'shopping',  captureMethod:'sms',    createdAt: daysAgo(2,13,0)  },
  { id:'s8',  amount:499,  label:'Netflix',       category:'fun',       captureMethod:'sms',    createdAt: daysAgo(3,10,0)  },
  { id:'s9',  amount:2800, label:'Electricity',   category:'bills',     captureMethod:'scan',   createdAt: daysAgo(4,9,0)   },
  { id:'s10', amount:650,  label:'Apollo Pharmacy',category:'health',   captureMethod:'manual', createdAt: daysAgo(5,16,0)  },
  { id:'s11', amount:380,  label:'Zomato',        category:'food',      captureMethod:'sms',    createdAt: daysAgo(5,19,45) },
  { id:'s12', amount:150,  label:'Auto Rickshaw', category:'transport', captureMethod:'manual', createdAt: daysAgo(6,8,30)  },
];

const DEFAULT_SETTINGS: Settings = {
  name: 'Aryan',
  currency: 'INR',
  currencySymbol: '₹',
  dailyBudget: 3000,
  whatsappEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  dailyDigestEnabled: true,
  weeklyDigestEnabled: true,
  smsAutoReadEnabled: true,
  offlineFirst: true,
  phone: '+91 98765 43210',
  email: 'aryan@gmail.com',
};

function startOf(period: string): Date {
  const d = new Date();
  if (period==='today')  { d.setHours(0,0,0,0); return d; }
  if (period==='week')   { d.setDate(d.getDate()-7); d.setHours(0,0,0,0); return d; }
  if (period==='biweek') { d.setDate(d.getDate()-14); d.setHours(0,0,0,0); return d; }
  if (period==='month')  { d.setDate(1); d.setHours(0,0,0,0); return d; }
  d.setMonth(0,1); d.setHours(0,0,0,0); return d;
}

interface SpendStore {
  expenses: Expense[];
  settings: Settings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addExpense: (e: Omit<Expense,'id'|'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  editExpense: (id: string, updates: Partial<Omit<Expense,'id'|'createdAt'>>) => void;
  updateSettings: (s: Partial<Settings>) => void;
  getExpensesForPeriod: (period: string) => Expense[];
  getTotalForPeriod: (period: string) => number;
  getByCategory: (expenses: Expense[]) => Record<CategoryKey, number>;
  getDailyTotals: (days: number) => { day: string; total: number }[];
}

export const useStore = create<SpendStore>((set, get) => ({
  expenses: SEED,
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    try {
      const [re, rs] = await Promise.all([
        AsyncStorage.getItem('ss_expenses'),
        AsyncStorage.getItem('ss_settings'),
      ]);
      set({
        expenses: re ? JSON.parse(re) : SEED,
        settings: rs ? { ...DEFAULT_SETTINGS, ...JSON.parse(rs) } : DEFAULT_SETTINGS,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  addExpense: (data) => {
    const e: Expense = {
      ...data,
      id: Math.random().toString(36).slice(2,10),
      createdAt: new Date().toISOString(),
    };
    const expenses = [e, ...get().expenses];
    set({ expenses });
    AsyncStorage.setItem('ss_expenses', JSON.stringify(expenses));
  },

  deleteExpense: (id) => {
    const expenses = get().expenses.filter(e => e.id !== id);
    set({ expenses });
    AsyncStorage.setItem('ss_expenses', JSON.stringify(expenses));
  },

  editExpense: (id, updates) => {
    const expenses = get().expenses.map(e => e.id===id ? {...e,...updates} : e);
    set({ expenses });
    AsyncStorage.setItem('ss_expenses', JSON.stringify(expenses));
  },

  updateSettings: (partial) => {
    const settings = { ...get().settings, ...partial };
    set({ settings });
    AsyncStorage.setItem('ss_settings', JSON.stringify(settings));
  },

  getExpensesForPeriod: (period) => {
    const since = startOf(period).getTime();
    return get().expenses.filter(e => new Date(e.createdAt).getTime() >= since);
  },

  getTotalForPeriod: (period) =>
    get().getExpensesForPeriod(period).reduce((s,e) => s+e.amount, 0),

  getByCategory: (expenses) => {
    const r = {} as Record<CategoryKey, number>;
    expenses.forEach(e => { r[e.category] = (r[e.category]||0) + e.amount; });
    return r;
  },

  getDailyTotals: (days) => {
    const result = [];
    for (let i=days-1; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const key = d.toISOString().split('T')[0];
      const total = get().expenses
        .filter(e => e.createdAt.startsWith(key))
        .reduce((s,e) => s+e.amount, 0);
      result.push({ day:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()], total });
    }
    return result;
  },
}));
