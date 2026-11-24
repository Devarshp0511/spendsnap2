import { CategoryKey } from './theme';
export interface Expense {
  id: string;
  amount: number;
  label: string;
  category: CategoryKey;
  merchant?: string;
  note?: string;
  captureMethod: 'scan' | 'manual' | 'voice' | 'sms';
  createdAt: string;
  receiptUri?: string;
}
export interface Settings {
  name: string;
  currency: string;
  currencySymbol: string;
  dailyBudget: number;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  dailyDigestEnabled: boolean;
  weeklyDigestEnabled: boolean;
  smsAutoReadEnabled: boolean;
  offlineFirst: boolean;
  phone?: string;
  email?: string;
}
