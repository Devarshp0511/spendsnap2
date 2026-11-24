import { notifyExpenseAdded, scheduleBudgetAlert } from './notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function triggerExpenseNotifications(
  label: string,
  amount: number,
  currencySymbol: string,
  dailyTotal: number,
  budget: number,
) {
  try {
    const enabled = await AsyncStorage.getItem('ss_notifications_enabled');
    if (enabled !== 'true') return;

    await notifyExpenseAdded(label, amount, currencySymbol, dailyTotal, budget);
    await scheduleBudgetAlert(dailyTotal, budget, currencySymbol);
  } catch (err) {
    console.log('Notification error:', err);
  }
}
