import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Colors, Radius, Spacing } from '../constants/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <Row style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && <TouchableOpacity onPress={onAction}><Text style={styles.sectionLink}>{action}</Text></TouchableOpacity>}
    </Row>
  );
}
export function IconBox({ icon, bg, size=38, color }: { icon: string; bg: string; size?: number; color?: string }) {
  return (
    <View style={[styles.iconBox,{backgroundColor:bg,width:size,height:size,borderRadius:size*0.28}]}>
      <Text style={{fontSize:size*0.38, color: color ?? Colors.accent}}>{icon}</Text>
    </View>
  );
}
export function PrimaryButton({ label, onPress, loading, style }: { label: string; onPress: () => void; loading?: boolean; style?: ViewStyle }) {
  return (
    <TouchableOpacity style={[styles.primaryBtn,style]} onPress={onPress} activeOpacity={0.85}>
      {loading ? <ActivityIndicator color={Colors.bg}/> : <Text style={styles.primaryBtnText}>{label}</Text>}
    </TouchableOpacity>
  );
}
export function GhostButton({ label, onPress, style }: { label: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <TouchableOpacity style={[styles.ghostBtn,style]} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.ghostBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}
export function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity onPress={onToggle} style={[styles.toggle,value&&styles.toggleOn]} activeOpacity={0.8}>
      <View style={[styles.toggleThumb,value&&styles.toggleThumbOn]}/>
    </TouchableOpacity>
  );
}
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider,style]}/>;
}
export function Pill({ label, color }: { label: string; color?: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: (color ?? Colors.accent) + '18' }]}>
      <Text style={[styles.pillText, { color: color ?? Colors.accent }]}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card:{ backgroundColor:Colors.surface, borderRadius:Radius.lg, borderWidth:0.5, borderColor:Colors.border2, padding:Spacing.lg },
  row:{ flexDirection:'row', alignItems:'center' },
  sectionHead:{ justifyContent:'space-between', marginBottom:Spacing.md },
  sectionTitle:{ fontSize:13, fontWeight:'700', color:Colors.text2, textTransform:'uppercase', letterSpacing:0.8 },
  sectionLink:{ fontSize:13, color:Colors.accent, fontWeight:'500' },
  iconBox:{ alignItems:'center', justifyContent:'center' },
  primaryBtn:{ backgroundColor:Colors.accent, borderRadius:Radius.md, paddingVertical:16, alignItems:'center' },
  primaryBtnText:{ color:Colors.bg, fontWeight:'700', fontSize:15, letterSpacing:0.2 },
  ghostBtn:{ backgroundColor:Colors.surface2, borderRadius:Radius.md, paddingVertical:15, alignItems:'center', borderWidth:1, borderColor:Colors.border2 },
  ghostBtnText:{ color:Colors.text, fontWeight:'600', fontSize:14 },
  toggle:{ width:44, height:24, borderRadius:12, backgroundColor:Colors.surface3, justifyContent:'center', padding:3, borderWidth:1, borderColor:Colors.border2 },
  toggleOn:{ backgroundColor:Colors.accent2, borderColor:Colors.accent2 },
  toggleThumb:{ width:16, height:16, borderRadius:8, backgroundColor:Colors.text3 },
  toggleThumbOn:{ backgroundColor:Colors.white, transform:[{translateX:20}] },
  divider:{ height:0.5, backgroundColor:Colors.border, marginVertical:Spacing.md },
  pill:{ paddingHorizontal:8, paddingVertical:3, borderRadius:Radius.full },
  pillText:{ fontSize:10, fontWeight:'600', letterSpacing:0.4 },
});
