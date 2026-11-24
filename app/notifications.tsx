import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { Card, Row, Toggle, Divider } from '@/components/UI';
import {
  requestNotificationPermission,
  scheduleDailyDigest,
  scheduleWeeklySummary,
  cancelAllNotifications,
  sendTestNotification,
} from '@/utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationsScreen() {
  const { settings, updateSettings, getTotalForPeriod, getExpensesForPeriod } = useStore();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const sym = settings.currencySymbol;

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const enabled = await AsyncStorage.getItem('ss_notifications_enabled');
    setPermissionGranted(enabled === 'true');
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setPermissionGranted(true);
        const todayTotal = getTotalForPeriod('today');
        const todayExpenses = getExpensesForPeriod('today');
        const weeklyTotal = getTotalForPeriod('week');

        await Promise.all([
          scheduleDailyDigest(todayTotal, todayExpenses.length, sym, settings.name),
          scheduleWeeklySummary(weeklyTotal, sym, settings.name),
          sendTestNotification(settings.name, sym),
        ]);

        Alert.alert('Notifications enabled!', 'You\'ll get a daily summary at 9 PM and weekly reports on Sundays. Check your notifications now for a test message!');
      } else {
        Alert.alert('Permission denied', 'Go to iPhone Settings → SpendSnap → Notifications and enable them.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not enable notifications. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    Alert.alert('Disable notifications?', 'You won\'t receive daily summaries or budget alerts.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disable',
        style: 'destructive',
        onPress: async () => {
          await cancelAllNotifications();
          await AsyncStorage.setItem('ss_notifications_enabled', 'false');
          setPermissionGranted(false);
          updateSettings({ dailyDigestEnabled: false, weeklyDigestEnabled: false });
        },
      },
    ]);
  };

  const handleTest = async () => {
    try {
      await sendTestNotification(settings.name, sym);
      Alert.alert('Test sent!', 'You should see a notification in a few seconds.');
    } catch {
      Alert.alert('Error', 'Could not send test notification.');
    }
  };

  const handleUpdateSchedule = async () => {
    if (!permissionGranted) return;
    const todayTotal = getTotalForPeriod('today');
    const todayExpenses = getExpensesForPeriod('today');
    const weeklyTotal = getTotalForPeriod('week');

    await Promise.all([
      settings.dailyDigestEnabled
        ? scheduleDailyDigest(todayTotal, todayExpenses.length, sym, settings.name)
        : Promise.resolve(),
      settings.weeklyDigestEnabled
        ? scheduleWeeklySummary(weeklyTotal, sym, settings.name)
        : Promise.resolve(),
    ]);

    Alert.alert('Schedule updated!', 'Your notification preferences have been saved.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Row style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 60 }} />
      </Row>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* STATUS CARD */}
        <Card style={[styles.statusCard, permissionGranted && styles.statusCardActive]}>
          <Row style={{ gap: 14, alignItems: 'flex-start' }}>
            <View style={[styles.statusIcon, permissionGranted && styles.statusIconActive]}>
              <Text style={{ fontSize: 22 }}>{permissionGranted ? '🔔' : '🔕'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>
                {permissionGranted ? 'Notifications active' : 'Notifications off'}
              </Text>
              <Text style={styles.statusSub}>
                {permissionGranted
                  ? 'You\'ll get daily summaries at 9 PM and budget alerts.'
                  : 'Enable to get daily spending summaries and budget alerts.'}
              </Text>
            </View>
          </Row>

          <TouchableOpacity
            style={[styles.toggleBtn, permissionGranted && styles.toggleBtnOff]}
            onPress={permissionGranted ? handleDisable : handleEnable}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={permissionGranted ? Colors.red : Colors.black} size="small" />
              : <Text style={[styles.toggleBtnText, permissionGranted && styles.toggleBtnTextOff]}>
                  {permissionGranted ? 'Disable notifications' : 'Enable notifications'}
                </Text>
            }
          </TouchableOpacity>
        </Card>

        {/* NOTIFICATION TYPES */}
        <Text style={styles.sectionLabel}>NOTIFICATION TYPES</Text>
        <Card style={{ gap:0, padding:0, overflow:'hidden' }}>
          {[
            {
              icon: '📊',
              title: 'Daily digest',
              sub: 'Every day at 9:00 PM',
              key: 'dailyDigestEnabled' as const,
            },
            {
              icon: '📈',
              title: 'Weekly summary',
              sub: 'Every Sunday at 8:00 PM',
              key: 'weeklyDigestEnabled' as const,
            },
            {
              icon: '⚠️',
              title: 'Budget alerts',
              sub: `Alert when over ${sym}${settings.dailyBudget}/day`,
              key: 'dailyDigestEnabled' as const,
            },
          ].map((item, i, arr) => (
            <View key={item.key + i}>
              <Row style={styles.prefRow}>
                <View style={styles.prefIcon}>
                  <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prefTitle}>{item.title}</Text>
                  <Text style={styles.prefSub}>{item.sub}</Text>
                </View>
                <Toggle
                  value={permissionGranted && (settings[item.key] as boolean)}
                  onToggle={() => {
                    if (!permissionGranted) {
                      Alert.alert('Enable notifications first');
                      return;
                    }
                    updateSettings({ [item.key]: !settings[item.key] });
                  }}
                />
              </Row>
              {i < arr.length - 1 && <Divider style={{ marginHorizontal: Spacing.lg, marginVertical: 0 }} />}
            </View>
          ))}
        </Card>

        {/* SCHEDULE */}
        <Text style={styles.sectionLabel}>SCHEDULE</Text>
        <Card>
          {[
            { label: 'Daily digest time', value: '9:00 PM' },
            { label: 'Weekly summary', value: 'Sunday 8:00 PM' },
            { label: 'Budget alert threshold', value: '80% of limit' },
          ].map((item, i, arr) => (
            <View key={item.label}>
              <Row style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={styles.scheduleKey}>{item.label}</Text>
                <Text style={styles.scheduleVal}>{item.value}</Text>
              </Row>
              {i < arr.length - 1 && <Divider style={{ marginVertical: Spacing.sm }} />}
            </View>
          ))}
        </Card>

        {/* ACTIONS */}
        {permissionGranted && (
          <>
            <Text style={styles.sectionLabel}>ACTIONS</Text>
            <View style={{ gap: Spacing.sm }}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleTest}>
                <Text style={styles.actionBtnText}>Send test notification</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleUpdateSchedule}>
                <Text style={styles.actionBtnText}>Update schedule</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* INFO */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Notifications work even when SpendSnap is closed. Your spending data never leaves your device — summaries are generated locally.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    justifyContent: 'space-between',
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  backText: { fontSize: 15, color: Colors.accent, fontWeight: '500', width: 60 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.white },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 10, color: Colors.text3,
    textTransform: 'uppercase', letterSpacing: 1.2,
    fontWeight: '700', marginTop: Spacing.sm,
  },

  statusCard: { gap: Spacing.lg },
  statusCardActive: { borderColor: Colors.accent },
  statusIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  statusIconActive: { backgroundColor: 'rgba(0,200,150,0.15)' },
  statusTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
  statusSub: { fontSize: 12, color: Colors.text2, marginTop: 3, lineHeight: 18 },
  toggleBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.md,
    paddingVertical: 13, alignItems: 'center',
  },
  toggleBtnOff: {
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)',
  },
  toggleBtnText: { fontSize: 14, fontWeight: '700', color: Colors.black },
  toggleBtnTextOff: { color: Colors.red },

  prefRow: { padding: Spacing.lg, gap: 12 },
  prefIcon: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  prefTitle: { fontSize: 14, fontWeight: '600', color: Colors.white },
  prefSub: { fontSize: 11, color: Colors.text3, marginTop: 2 },

  scheduleKey: { fontSize: 13, color: Colors.text3 },
  scheduleVal: { fontSize: 13, fontWeight: '600', color: Colors.white },

  actionBtn: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border2,
    paddingVertical: 14, alignItems: 'center',
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: Colors.accent },

  infoCard: {
    backgroundColor: Colors.surface2, borderRadius: Radius.md,
    padding: Spacing.lg, marginTop: Spacing.sm,
  },
  infoText: { fontSize: 12, color: Colors.text3, lineHeight: 18, textAlign: 'center' },
});
