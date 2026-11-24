import { create } from 'zustand';
import { supabase, signIn, signUp, signOut, getProfile, syncExpensesToCloud, fetchExpensesFromCloud } from '../utils/supabase';
import { User } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  profile: any | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  syncToCloud: (expenses: any[]) => Promise<void>;
  fetchFromCloud: () => Promise<any[]>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id).catch(() => null);
        set({ user: session.user, profile, initialized: true });
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await getProfile(session.user.id).catch(() => null);
        set({ user: session.user, profile });
      } else {
        set({ user: null, profile: null });
      }
    });
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const data = await signIn(email, password);
      const profile = await getProfile(data.user!.id).catch(() => null);
      set({ user: data.user, profile, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (email, password, name) => {
    set({ loading: true });
    try {
      const data = await signUp(email, password, name);
      set({ user: data.user, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    await signOut();
    set({ user: null, profile: null });
  },

  syncToCloud: async (expenses) => {
    const { user } = get();
    if (!user) return;
    await syncExpensesToCloud(user.id, expenses);
  },

  fetchFromCloud: async () => {
    const { user } = get();
    if (!user) return [];
    return await fetchExpensesFromCloud(user.id);
  },
}));
