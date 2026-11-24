import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function RootLayout() {
  const hydrate     = useStore(s => s.hydrate);
  const initialize  = useAuthStore(s => s.initialize);

  useEffect(() => {
    hydrate();
    initialize();

    // Handle notification taps
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const type = response.notification.request.content.data?.type;
      if (type === 'daily_digest' || type === 'weekly_summary') {
        router.push('/(tabs)/reports');
      } else if (type === 'budget_alert' || type === 'expense_added') {
        router.push('/(tabs)');
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" backgroundColor="#000000" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="splash" />
        <Stack.Screen name="login" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="expense/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
});
