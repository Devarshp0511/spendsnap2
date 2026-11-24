import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Secure storage adapter for Supabase auth tokens
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Auth helpers ───────────────────────────────────────────────────────────────
export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: {
  name?: string;
  currency?: string;
  currency_symbol?: string;
  daily_budget?: number;
  phone?: string;
}) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

// ── Expense sync helpers ───────────────────────────────────────────────────────
export async function syncExpensesToCloud(userId: string, expenses: any[]) {
  const formatted = expenses.map(e => ({
    id: e.id,
    user_id: userId,
    amount: e.amount,
    label: e.label,
    category: e.category,
    merchant: e.merchant,
    note: e.note,
    capture_method: e.captureMethod,
    created_at: e.createdAt,
  }));

  const { error } = await supabase
    .from('expenses')
    .upsert(formatted, { onConflict: 'id' });
  if (error) throw error;
}

export async function fetchExpensesFromCloud(userId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data?.map(e => ({
    id: e.id,
    amount: e.amount,
    label: e.label,
    category: e.category,
    merchant: e.merchant,
    note: e.note,
    captureMethod: e.capture_method,
    createdAt: e.created_at,
  })) ?? [];
}

export async function deleteExpenseFromCloud(expenseId: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);
  if (error) throw error;
}
