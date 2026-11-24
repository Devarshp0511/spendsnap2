import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Configure how notifications appear when app is open ───────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Request permissions ───────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Notifications only work on physical devices');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('spendsnap', {
      name: 'SpendSnap',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00C896',
      sound: 'default',
    });
  }

  await AsyncStorage.setItem('ss_notifications_enabled', 'true');
  return true;
}

// ── Cancel all scheduled notifications ───────────────────────────────────────
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Schedule daily digest at 9pm ──────────────────────────────────────────────
export async function scheduleDailyDigest(
  totalSpent: number,
  transactionCount: number,
  currencySymbol: string,
  name: string,
) {
  // Cancel existing daily digest
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'daily_digest') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  const messages = [
    `You spent ${currencySymbol}${totalSpent.toLocaleString('en-IN')} today across ${transactionCount} transaction${transactionCount !== 1 ? 's' : ''}.`,
    `Today's total: ${currencySymbol}${totalSpent.toLocaleString('en-IN')} across ${transactionCount} spend${transactionCount !== 1 ? 's' : ''}. Tap to see breakdown.`,
    `${transactionCount} expense${transactionCount !== 1 ? 's' : ''} logged today. Total: ${currencySymbol}${totalSpent.toLocaleString('en-IN')}.`,
  ];
  const body = messages[Math.floor(Math.random() * messages.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Hey ${name}, here's your daily summary 📊`,
      body,
      sound: 'default',
      data: { type: 'daily_digest' },
    },
    trigger: {
      hour: 21,
      minute: 0,
      repeats: true,
    } as any,
  });
}

// ── Schedule budget alert ─────────────────────────────────────────────────────
export async function scheduleBudgetAlert(
  spent: number,
  budget: number,
  currencySymbol: string,
) {
  // Only alert if over 80% of budget
  if (spent < budget * 0.8) return;

  const pct = Math.round((spent / budget) * 100);
  const isOver = spent >= budget;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: isOver ? '⚠️ Budget exceeded!' : `${pct}% of daily budget used`,
      body: isOver
        ? `You've spent ${currencySymbol}${spent.toLocaleString('en-IN')} — ${currencySymbol}${(spent - budget).toLocaleString('en-IN')} over your ${currencySymbol}${budget.toLocaleString('en-IN')} limit.`
        : `${currencySymbol}${spent.toLocaleString('en-IN')} of ${currencySymbol}${budget.toLocaleString('en-IN')} spent today. ${currencySymbol}${(budget - spent).toLocaleString('en-IN')} remaining.`,
      sound: 'default',
      data: { type: 'budget_alert' },
    },
    trigger: null, // Send immediately
  });
}

// ── Schedule weekly summary every Sunday 8pm ──────────────────────────────────
export async function scheduleWeeklySummary(
  weeklyTotal: number,
  currencySymbol: string,
  name: string,
) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'weekly_summary') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${name}'s weekly spending report 📈`,
      body: `You spent ${currencySymbol}${weeklyTotal.toLocaleString('en-IN')} this week. Tap to see the full breakdown.`,
      sound: 'default',
      data: { type: 'weekly_summary' },
    },
    trigger: {
      weekday: 1, // Sunday
      hour: 20,
      minute: 0,
      repeats: true,
    } as any,
  });
}

// ── Send instant test notification ────────────────────────────────────────────
export async function sendTestNotification(name: string, currencySymbol: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Hey ${name}! SpendSnap is set up 🎉`,
      body: `You'll get daily spending summaries at 9 PM and budget alerts when you're close to your limit.`,
      sound: 'default',
      data: { type: 'test' },
    },
    trigger: null, // Send immediately
  });
}

// ── Add expense notification ──────────────────────────────────────────────────
export async function notifyExpenseAdded(
  label: string,
  amount: number,
  currencySymbol: string,
  dailyTotal: number,
  budget: number,
) {
  const pct = Math.round((dailyTotal / budget) * 100);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${currencySymbol}${amount} logged ✓`,
      body: `${label} added. You've spent ${currencySymbol}${dailyTotal.toLocaleString('en-IN')} today (${pct}% of daily limit).`,
      sound: 'default',
      data: { type: 'expense_added' },
    },
    trigger: null,
  });
}
