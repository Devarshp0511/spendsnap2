import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Expense } from '../constants/types';
import { Colors, Spacing } from '../constants/theme';
import { getCategoryMeta, getCategoryIcon, formatCurrency, formatDate, captureLabel, getCategoryLabel } from '../utils/helpers';

export function ExpenseRow({ expense, onPress, symbol='₹' }: { expense: Expense; onPress?: () => void; symbol?: string }) {
  const meta = getCategoryMeta(expense.category);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{expense.label}</Text>
        <Text style={styles.meta}>{getCategoryLabel(expense.category)} · {captureLabel(expense.captureMethod)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatCurrency(expense.amount, symbol)}</Text>
        <Text style={styles.time}>{formatDate(expense.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  row:{ flexDirection:'row', alignItems:'center', gap:14, paddingVertical:14, paddingHorizontal:4 },
  dot:{ width:8, height:8, borderRadius:4, flexShrink:0, marginTop:2 },
  info:{ flex:1, gap:4 },
  name:{ fontSize:14, fontWeight:'600', color:Colors.text },
  meta:{ fontSize:11, color:Colors.text3 },
  right:{ alignItems:'flex-end', gap:3 },
  amount:{ fontSize:14, fontWeight:'700', color:Colors.text },
  time:{ fontSize:10, color:Colors.text3 },
});
