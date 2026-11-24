import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors, Spacing, Radius, CATEGORIES } from '@/constants/theme';
import { CategoryKey } from '@/constants/theme';
import {
  formatCurrency, getCategoryMeta, getCategoryLabel,
  getCategoryIcon, formatDateFull, formatTime, captureLabel,
} from '@/utils/helpers';
import { Row, Divider } from '@/components/UI';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { expenses, deleteExpense, editExpense, settings } = useStore();
  const expense = expenses.find(e => e.id === id);
  const sym = settings.currencySymbol;

  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(expense?.amount ?? ''));
  const [label, setLabel] = useState(expense?.label ?? '');
  const [category, setCategory] = useState<CategoryKey>(expense?.category ?? 'other');
  const [note, setNote] = useState(expense?.note ?? '');

  if (!expense) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Expense not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.accent, marginTop: 12 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const meta = getCategoryMeta(category);

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert('Invalid amount'); return; }
    if (!label.trim()) { Alert.alert('Add a label'); return; }
    editExpense(id, {
      amount: num,
      label: label.trim(),
      category,
      note: note.trim() || undefined,
      merchant: label.trim(),
    });
    setEditing(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete expense?', `Remove ${expense.label}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteExpense(expense.id); router.back(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* HEADER */}
        <Row style={styles.header}>
          <TouchableOpacity onPress={() => { setEditing(false); router.back(); }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Row style={{ gap: 10 }}>
            {editing ? (
              <>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </Row>
        </Row>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {editing ? (
            /* ── EDIT MODE ─────────────────────────────────── */
            <View style={{ gap: Spacing.md }}>
              <Text style={styles.editHeading}>Edit Expense</Text>

              {/* Amount */}
              <View style={styles.amountWrap}>
                <Text style={styles.amountSym}>{sym}</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  autoFocus
                  placeholder="0"
                  placeholderTextColor={Colors.text3}
                />
              </View>

              {/* Label */}
              <TextInput
                style={styles.input}
                value={label}
                onChangeText={setLabel}
                placeholder="Description"
                placeholderTextColor={Colors.text3}
              />

              {/* Category chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.chip, category === c.key && styles.chipActive]}
                    onPress={() => setCategory(c.key)}
                  >
                    <Text style={[styles.chipText, category === c.key && styles.chipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Note */}
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                value={note}
                onChangeText={setNote}
                placeholder="Note (optional)"
                placeholderTextColor={Colors.text3}
                multiline
              />

              <TouchableOpacity style={styles.saveLargeBtn} onPress={handleSave}>
                <Text style={styles.saveLargeBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>

          ) : (
            /* ── VIEW MODE ─────────────────────────────────── */
            <View style={{ gap: Spacing.md }}>
              <View style={styles.hero}>
                <View style={[styles.heroDot, { backgroundColor: meta.color }]} />
                <Text style={styles.heroAmount}>{formatCurrency(expense.amount, sym)}</Text>
                <Text style={styles.heroLabel}>{expense.label}</Text>
                <Text style={styles.heroCategory}>{getCategoryLabel(expense.category)}</Text>
              </View>

              <View style={styles.card}>
                {[
                  { label: 'Amount',     value: formatCurrency(expense.amount, sym) },
                  { label: 'Category',   value: `${getCategoryIcon(expense.category)} ${getCategoryLabel(expense.category)}` },
                  { label: 'Date',       value: formatDateFull(expense.createdAt) },
                  { label: 'Time',       value: formatTime(expense.createdAt) },
                  { label: 'Logged via', value: captureLabel(expense.captureMethod) },
                  ...(expense.note ? [{ label: 'Note', value: expense.note }] : []),
                ].map((item, i, arr) => (
                  <View key={item.label}>
                    <Row style={styles.detailRow}>
                      <Text style={styles.detailKey}>{item.label}</Text>
                      <Text style={styles.detailVal}>{item.value}</Text>
                    </Row>
                    {i < arr.length - 1 && <Divider style={{ marginVertical: Spacing.sm }} />}
                  </View>
                ))}
              </View>

              {/* Quick edit hint */}
              <TouchableOpacity style={styles.editHint} onPress={() => setEditing(true)}>
                <Text style={styles.editHintText}>Tap Edit to change any details</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
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
  backText: { fontSize: 15, color: Colors.accent, fontWeight: '500' },
  editBtn: {
    paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border2,
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: Colors.white },
  deleteBtn: {
    paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderRadius: Radius.sm, borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)',
  },
  deleteBtnText: { fontSize: 13, fontWeight: '600', color: Colors.red },
  cancelBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text2 },
  saveBtn: {
    paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: Colors.black },

  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },

  editHeading: {
    fontSize: 22, fontWeight: '800',
    color: Colors.white, letterSpacing: -0.3,
    marginBottom: Spacing.sm,
  },
  amountWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border2,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  amountSym: { fontSize: 28, color: Colors.text3, fontWeight: '300' },
  amountInput: {
    flex: 1, fontSize: 40, fontWeight: '700',
    color: Colors.accent, letterSpacing: -1,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border2,
    paddingHorizontal: Spacing.md, paddingVertical: 13,
    color: Colors.white, fontSize: 14,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border2,
  },
  chipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(0,200,150,0.1)' },
  chipText: { fontSize: 12, color: Colors.text2, fontWeight: '500' },
  chipTextActive: { color: Colors.accent },
  saveLargeBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg, paddingVertical: 16,
    alignItems: 'center', marginTop: Spacing.sm,
  },
  saveLargeBtnText: { fontSize: 16, fontWeight: '700', color: Colors.black },

  hero: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  heroDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 6 },
  heroAmount: { fontSize: 46, fontWeight: '800', color: Colors.white, letterSpacing: -1.5 },
  heroLabel: { fontSize: 18, fontWeight: '600', color: Colors.white },
  heroCategory: { fontSize: 13, color: Colors.text3, marginTop: 2 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg,
  },
  detailRow: { justifyContent: 'space-between', paddingVertical: 2 },
  detailKey: { fontSize: 13, color: Colors.text3 },
  detailVal: { fontSize: 13, fontWeight: '600', color: Colors.white, textAlign: 'right', flex: 1, marginLeft: 16 },

  editHint: {
    alignItems: 'center', paddingVertical: Spacing.md,
  },
  editHintText: { fontSize: 12, color: Colors.text3 },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, fontWeight: '600', color: Colors.text2 },
});
