export const Colors = {
  bg: '#000000',
  surface: '#111111',
  surface2: '#1A1A1A',
  surface3: '#222222',
  border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.14)',
  accent: '#00C896',
  accent2: '#00A87A',
  accent3: '#FF6B6B',
  accent4: '#FFB347',
  text: '#FFFFFF',
  text2: '#AAAAAA',
  text3: '#555555',
  green: '#00C896',
  red: '#FF6B6B',
  white: '#FFFFFF',
  black: '#000000',
  categories: {
    food:      { bg: 'rgba(255,107,107,0.12)', color: '#FF6B6B' },
    transport: { bg: 'rgba(0,200,150,0.12)',   color: '#00C896' },
    shopping:  { bg: 'rgba(255,179,71,0.12)',  color: '#FFB347' },
    bills:     { bg: 'rgba(116,185,255,0.12)', color: '#74B9FF' },
    health:    { bg: 'rgba(162,155,254,0.12)', color: '#A29BFE' },
    fun:       { bg: 'rgba(253,121,168,0.12)', color: '#FD79A8' },
    other:     { bg: 'rgba(170,170,170,0.12)', color: '#AAAAAA' },
  },
};
export const Spacing = { xs:4, sm:8, md:12, lg:16, xl:20, xxl:28 };
export const Radius = { sm:8, md:12, lg:16, xl:24, full:999 };
export const CATEGORIES = [
  { key: 'food',      label: 'Food & Drinks', icon: '🍽' },
  { key: 'transport', label: 'Transport',      icon: '🚌' },
  { key: 'shopping',  label: 'Shopping',       icon: '🛍' },
  { key: 'bills',     label: 'Bills',          icon: '📋' },
  { key: 'health',    label: 'Health',         icon: '⚕' },
  { key: 'fun',       label: 'Entertainment',  icon: '🎬' },
  { key: 'other',     label: 'Other',          icon: '📌' },
] as const;
export type CategoryKey = typeof CATEGORIES[number]['key'];
