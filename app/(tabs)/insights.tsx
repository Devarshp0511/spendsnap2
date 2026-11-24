import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors, Spacing, Radius, CATEGORIES } from '@/constants/theme';
import { CategoryKey } from '@/constants/theme';
import { formatCurrency, getCategoryMeta, getCategoryLabel, sortedCategories } from '@/utils/helpers';
import { Card, Row, SectionHeader, Divider } from '@/components/UI';
import { ExpenseRow } from '@/components/ExpenseRow';

export default function InsightsScreen() {
  const [filterCat, setFilterCat] = useState<CategoryKey | 'all'>('all');
  const { expenses, settings, getExpensesForPeriod, getByCategory } = useStore();
  const sym = settings.currencySymbol;
  const monthExpenses = getExpensesForPeriod('month');
  const monthTotal    = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const byCategory    = getByCategory(monthExpenses);
  const topCats       = sortedCategories(byCategory);
  const maxCatVal     = topCats[0]?.[1] ?? 1;
  const filtered      = filterCat === 'all' ? expenses : expenses.filter(e => e.category === filterCat);

  const insights = [
    topCats[0] && `Your biggest category is ${getCategoryLabel(topCats[0][0])} at ${formatCurrency(topCats[0][1], sym)} — ${Math.round((topCats[0][1] / monthTotal) * 100)}% of total spending this month.`,
    `At this rate you'll spend ~${formatCurrency(Math.round(monthTotal / Math.max(new Date().getDate(), 1) * 30), sym)} this month.`,
    `You've logged ${monthExpenses.length} expenses this month. Keep it up!`,
    expenses.length > 0 && `Your largest single expense: ${formatCurrency(Math.max(...expenses.map(e => e.amount)), sym)}.`,
  ].filter(Boolean) as string[];

  const dotColors = [Colors.red, Colors.accent4, Colors.green, Colors.accent2];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.sub}>Your money at a glance</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* AI BANNER — now actually navigates */}
        <TouchableOpacity style={styles.aiBanner} onPress={() => router.push('/(tabs)/ai')} activeOpacity={0.85}>
          <View style={styles.aiLeft}>
            <View style={styles.aiGlow}/>
            <View>
              <Text style={styles.aiBannerTitle}>Ask AI about your spending</Text>
              <Text style={styles.aiBannerSub}>Powered by Claude · Tap to chat</Text>
            </View>
          </View>
          <Text style={styles.aiBannerArrow}>→</Text>
        </TouchableOpacity>

        {/* INSIGHTS */}
        <Text style={styles.sectionLabel}>THIS MONTH</Text>
        <View style={{ gap: 8 }}>
          {insights.map((ins, i) => (
            <View key={i} style={styles.insightCard}>
              <Row style={{ gap: 12, alignItems: 'flex-start' }}>
                <View style={[styles.insightLine, { backgroundColor: dotColors[i % 4] }]} />
                <Text style={styles.insightText}>{ins}</Text>
              </Row>
            </View>
          ))}
        </View>

        <Divider style={{ marginVertical: Spacing.lg }} />

        {/* CATEGORY BREAKDOWN */}
        <Text style={styles.sectionLabel}>BY CATEGORY</Text>
        <View style={styles.card}>
          <View style={{ gap: 20 }}>
            {topCats.map(([cat, amt]) => {
              const meta = getCategoryMeta(cat);
              return (
                <Row key={cat} style={{ gap: 14 }}>
                  <View style={[styles.catDot, { backgroundColor: meta.color }]} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Text style={styles.catName}>{getCategoryLabel(cat)}</Text>
                      <Text style={styles.catAmt}>{formatCurrency(amt, sym)}</Text>
                    </Row>
                    <View style={styles.catBarBg}>
                      <View style={[styles.catBarFill, { width: `${(amt / maxCatVal) * 100}%`, backgroundColor: meta.color }]} />
                    </View>
                    <Text style={styles.catPct}>{Math.round((amt / monthTotal) * 100)}% of total</Text>
                  </View>
                </Row>
              );
            })}
          </View>
        </View>

        <Divider style={{ marginVertical: Spacing.lg }} />

        {/* ALL TRANSACTIONS */}
        <SectionHeader title="All Transactions" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
          style={{ marginBottom: Spacing.md }}>
          {(['all', ...CATEGORIES.map(c => c.key)] as (CategoryKey | 'all')[]).map(k => (
            <TouchableOpacity
              key={k}
              style={[styles.filterChip, filterCat === k && styles.filterChipActive]}
              onPress={() => setFilterCat(k)}
            >
              <Text style={[styles.filterChipText, filterCat === k && styles.filterChipTextActive]}>
                {k === 'all' ? 'All' : getCategoryLabel(k as CategoryKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.card, { paddingHorizontal: Spacing.lg, paddingVertical: 0 }]}>
          {filtered.slice(0, 50).map((e, i) => (
            <View key={e.id}>
              <ExpenseRow expense={e} symbol={sym} onPress={() => router.push(`/expense/${e.id}`)} />
              {i < filtered.length - 1 && <Divider style={{ marginVertical: 0 }} />}
            </View>
          ))}
          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No expenses in this category</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topbar: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.white, letterSpacing: -0.3 },
  sub: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 10, color: Colors.text3,
    textTransform: 'uppercase', letterSpacing: 1.2,
    fontWeight: '700', marginBottom: Spacing.sm,
  },

  aiBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.accent,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  aiLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  aiGlow: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: 'rgba(0,200,150,0.15)',
    borderWidth: 1, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  aiBannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.white },
  aiBannerSub: { fontSize: 11, color: Colors.accent, marginTop: 2 },
  aiBannerArrow: { fontSize: 20, color: Colors.accent, fontWeight: '600' },

  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: 0,
  },
  insightLine: { width: 3, minHeight: 18, borderRadius: 2, flexShrink: 0, marginTop: 2 },
  insightText: { flex: 1, fontSize: 13, color: Colors.white, lineHeight: 20 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg,
  },
  catDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  catName: { fontSize: 13, fontWeight: '500', color: Colors.white },
  catAmt: { fontSize: 13, fontWeight: '700', color: Colors.white },
  catBarBg: { height: 2, backgroundColor: Colors.surface3, borderRadius: 1, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 1 },
  catPct: { fontSize: 10, color: Colors.text3 },

  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 0.5, borderColor: Colors.border2,
  },
  filterChipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(0,200,150,0.1)' },
  filterChipText: { fontSize: 12, color: Colors.text3, fontWeight: '500' },
  filterChipTextActive: { color: Colors.accent },

  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.text2 },
});
