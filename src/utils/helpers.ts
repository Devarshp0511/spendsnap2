import { CategoryKey, CATEGORIES, Colors } from '../constants/theme';
export function formatCurrency(amount: number, symbol='₹'): string {
  if (amount>=100000) return `${symbol}${(amount/100000).toFixed(1)}L`;
  if (amount>=1000) return `${symbol}${amount.toLocaleString('en-IN')}`;
  return `${symbol}${amount}`;
}
export function formatDate(iso: string): string {
  const d = new Date(iso); const now = new Date();
  const diff = Math.floor((now.getTime()-d.getTime())/86400000);
  if (diff===0) return formatTime(iso);
  if (diff===1) return 'Yesterday';
  if (diff<7) return `${diff} days ago`;
  return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
}
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true});
}
export function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}
export function getCategoryMeta(key: CategoryKey) { return Colors.categories[key]??Colors.categories.other; }
export function getCategoryLabel(key: CategoryKey): string { return CATEGORIES.find(c=>c.key===key)?.label??'Other'; }
export function getCategoryIcon(key: CategoryKey): string { return CATEGORIES.find(c=>c.key===key)?.icon??'📌'; }
export function sortedCategories(byCategory: Record<CategoryKey,number>) {
  return (Object.entries(byCategory) as [CategoryKey,number][]).sort((a,b)=>b[1]-a[1]);
}
export function getGreeting(): string {
  const h = new Date().getHours();
  if (h<12) return 'Good morning'; if (h<17) return 'Good afternoon'; return 'Good evening';
}
export function getPctOfBudget(total: number, budget: number): number { return Math.min(Math.round((total/budget)*100),100); }
export function captureLabel(method: string): string {
  switch(method) { case 'scan': return 'Bill scan'; case 'manual': return 'Quick entry'; case 'voice': return 'Voice log'; case 'sms': return 'SMS parsed'; default: return method; }
}
