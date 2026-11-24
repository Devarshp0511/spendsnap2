import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const { login, register, loading } = useAuthStore();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }
    if (!isLogin && !name.trim()) {
      Alert.alert('Missing name', 'Please enter your name.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim());
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert(
        isLogin ? 'Login failed' : 'Sign up failed',
        err.message ?? 'Something went wrong. Try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoIcon}>
              <Text style={{ fontSize: 36 }}>⚡</Text>
            </View>
            <Text style={styles.logoText}>SpendSnap</Text>
            <Text style={styles.logoTag}>Capture. Track. Know.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isLogin ? 'Welcome back' : 'Create account'}
            </Text>
            <Text style={styles.cardSub}>
              {isLogin
                ? 'Sign in to sync your expenses across devices'
                : 'Join SpendSnap and take control of your spending'}
            </Text>

            <View style={styles.fields}>
              {!isLogin && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Your name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Devarsh"
                    placeholderTextColor={Colors.text3}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.text3}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min 6 characters"
                  placeholderTextColor={Colors.text3}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.black} />
                : <Text style={styles.submitBtnText}>
                    {isLogin ? 'Sign in' : 'Create account'}
                  </Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchBtn} onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.switchText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.switchLink}>{isLogin ? 'Sign up' : 'Sign in'}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Skip for now */}
          <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.skipText}>Continue without account →</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Your data is encrypted and stored securely. We never sell your financial data.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, paddingTop: 40, gap: Spacing.xl },

  logoWrap: { alignItems: 'center', gap: 10, paddingTop: 20 },
  logoIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  logoText: { fontSize: 28, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  logoTag: { fontSize: 13, color: Colors.accent, fontWeight: '500', letterSpacing: 1 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border2,
    padding: Spacing.xl, gap: Spacing.lg,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, letterSpacing: -0.3 },
  cardSub: { fontSize: 14, color: Colors.text2, lineHeight: 20, marginTop: -8 },

  fields: { gap: Spacing.md },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 12, color: Colors.text2, fontWeight: '600', letterSpacing: 0.3 },
  input: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border2,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    color: Colors.white, fontSize: 15,
  },

  submitBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 16, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: Colors.black },

  switchBtn: { alignItems: 'center', paddingVertical: 4 },
  switchText: { fontSize: 14, color: Colors.text2 },
  switchLink: { color: Colors.accent, fontWeight: '700' },

  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 14, color: Colors.text3, fontWeight: '500' },

  disclaimer: {
    fontSize: 11, color: Colors.text3,
    textAlign: 'center', lineHeight: 16,
  },
});
