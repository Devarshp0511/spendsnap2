import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

export function SpendChart({ data }: { data: { day: string; total: number }[] }) {
  const maxVal = Math.max(...data.map(d=>d.total),1);
  return (
    <View style={styles.wrap}>
      <View style={styles.bars}>
        {data.map((d,i) => {
          const isToday = i===data.length-1;
          const h = Math.max((d.total/maxVal)*100,4);
          return (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill,{height:`${h}%`},isToday&&styles.barToday]}/>
              </View>
              <Text style={[styles.barLabel,isToday&&styles.barLabelToday]}>{d.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap:{ height:100 },
  bars:{ flexDirection:'row', alignItems:'flex-end', gap:6, flex:1 },
  barCol:{ flex:1, alignItems:'center', gap:4, height:'100%' },
  barTrack:{ flex:1, width:'100%', justifyContent:'flex-end' },
  barFill:{ width:'100%', backgroundColor:'rgba(255,255,255,0.1)', borderRadius:4 },
  barToday:{ backgroundColor:Colors.accent },
  barLabel:{ fontSize:9, color:Colors.text3 },
  barLabelToday:{ color:Colors.accent, fontWeight:'700' },
});
