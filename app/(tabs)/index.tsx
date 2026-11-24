import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { formatCurrency, getCategoryMeta, getCategoryLabel, sortedCategories, getPctOfBudget } from '@/utils/helpers';
import { Divider, Row } from '@/components/UI';
import { ExpenseRow } from '@/components/ExpenseRow';
import { SpendChart } from '@/components/SpendChart';

const PERIODS = ['Today','Week','Month','Year'] as const;
type Period = typeof PERIODS[number];
const PERIOD_MAP: Record<Period,string> = { Today:'today', Week:'week', Month:'month', Year:'year' };

export default function HomeScreen() {
  const [period, setPeriod] = useState<Period>('Today');
  const [refreshing, setRefreshing] = useState(false);
  const { settings, getExpensesForPeriod, getTotalForPeriod, getByCategory, getDailyTotals } = useStore();
  const expenses   = getExpensesForPeriod(PERIOD_MAP[period]);
  const total      = getTotalForPeriod(PERIOD_MAP[period]);
  const byCategory = getByCategory(expenses);
  const dailyData  = getDailyTotals(7);
  const pct        = getPctOfBudget(total, settings.dailyBudget);
  const sym        = settings.currencySymbol;
  const topCats    = sortedCategories(byCategory).slice(0,4);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Row style={styles.topbar}>
        <View>
          <Text style={styles.appName}>SpendSnap</Text>
          <Text style={styles.subDate}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={()=>router.push('/(tabs)/settings')}>
          <Text style={styles.avatarText}>{settings.name.slice(0,2).toUpperCase()}</Text>
        </TouchableOpacity>
      </Row>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);setTimeout(()=>setRefreshing(false),600);}} tintColor={Colors.accent}/>}>

        {/* HERO */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>TOTAL SPENT</Text>
          <Text style={styles.heroAmount}>{sym}{total.toLocaleString('en-IN')}</Text>
          <Row style={{justifyContent:'space-between', marginTop:4}}>
            <Text style={styles.heroSub}>{expenses.length} transactions · {period.toLowerCase()}</Text>
            <Text style={[styles.heroSub,{color: pct>85?'#FF6B6B':'rgba(255,255,255,0.7)'}]}>{pct}% of limit</Text>
          </Row>
          <View style={styles.budgetBg}>
            <View style={[styles.budgetFill,{width:`${pct}%`, backgroundColor: pct>85?'#FF6B6B':'rgba(255,255,255,0.9)'}]}/>
          </View>
        </View>

        {/* PERIODS */}
        <Row style={{gap:8}}>
          {PERIODS.map(p=>(
            <TouchableOpacity key={p} style={[styles.tab, period===p&&styles.tabActive]} onPress={()=>setPeriod(p)}>
              <Text style={[styles.tabText, period===p&&styles.tabTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </Row>

        {/* STATS */}
        <Row style={{gap:10}}>
          {[
            {label:'Transactions', val:String(expenses.length)},
            {label:'Avg / day',    val:formatCurrency(Math.round(total/Math.max(1,7)),sym)},
            {label:'Largest',      val:expenses.length?formatCurrency(Math.max(...expenses.map(e=>e.amount)),sym):sym+'0'},
          ].map(s=>(
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statVal}>{s.val}</Text>
            </View>
          ))}
        </Row>

        {/* CHART */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>7-DAY TREND</Text>
          <SpendChart data={dailyData}/>
        </View>

        {/* CATEGORIES */}
        {topCats.length>0&&(
          <View style={styles.card}>
            <Row style={{justifyContent:'space-between',marginBottom:Spacing.lg}}>
              <Text style={styles.cardTitle}>BY CATEGORY</Text>
              <TouchableOpacity onPress={()=>router.push('/(tabs)/insights')}>
                <Text style={styles.cardLink}>See all</Text>
              </TouchableOpacity>
            </Row>
            <View style={{gap:20}}>
              {topCats.map(([cat,amt])=>{
                const meta=getCategoryMeta(cat);
                const p=total>0?(amt/total)*100:0;
                return (
                  <Row key={cat} style={{gap:14}}>
                    <View style={[styles.catDot,{backgroundColor:meta.color}]}/>
                    <View style={{flex:1}}>
                      <Row style={{justifyContent:'space-between',marginBottom:8}}>
                        <Text style={styles.catName}>{getCategoryLabel(cat)}</Text>
                        <Text style={styles.catAmt}>{formatCurrency(amt,sym)}</Text>
                      </Row>
                      <View style={styles.catBg}>
                        <View style={[styles.catFill,{width:`${p}%`,backgroundColor:meta.color}]}/>
                      </View>
                    </View>
                  </Row>
                );
              })}
            </View>
          </View>
        )}

        {/* RECENT */}
        <View style={styles.card}>
          <Row style={{justifyContent:'space-between',marginBottom:Spacing.md}}>
            <Text style={styles.cardTitle}>RECENT</Text>
            <TouchableOpacity onPress={()=>router.push('/(tabs)/insights')}>
              <Text style={styles.cardLink}>All</Text>
            </TouchableOpacity>
          </Row>
          {expenses.slice(0,6).map((e,i)=>(
            <View key={e.id}>
              <ExpenseRow expense={e} symbol={sym} onPress={()=>router.push(`/expense/${e.id}`)}/>
              {i<Math.min(expenses.length,6)-1&&<Divider style={{marginVertical:0}}/>}
            </View>
          ))}
          {expenses.length===0&&(
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySub}>Tap + to log your first spend</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.bg},
  topbar:{paddingHorizontal:Spacing.lg,paddingVertical:Spacing.md,justifyContent:'space-between',borderBottomWidth:0.5,borderBottomColor:Colors.border},
  appName:{fontSize:22,fontWeight:'800',color:Colors.white,letterSpacing:-0.5},
  subDate:{fontSize:12,color:Colors.text3,marginTop:2},
  avatar:{width:38,height:38,borderRadius:19,backgroundColor:Colors.surface2,borderWidth:1,borderColor:Colors.border2,alignItems:'center',justifyContent:'center'},
  avatarText:{color:Colors.accent,fontWeight:'700',fontSize:13},
  scroll:{flex:1},
  content:{padding:Spacing.lg,gap:Spacing.md,paddingBottom:40},

  heroCard:{backgroundColor:Colors.accent,borderRadius:Radius.xl,padding:Spacing.xl,gap:4},
  heroLabel:{fontSize:11,color:'rgba(0,0,0,0.5)',fontWeight:'700',letterSpacing:1},
  heroAmount:{fontSize:44,fontWeight:'800',color:Colors.white,letterSpacing:-1.5,marginTop:4},
  heroSub:{fontSize:12,color:'rgba(255,255,255,0.75)'},
  budgetBg:{height:3,backgroundColor:'rgba(0,0,0,0.2)',borderRadius:2,overflow:'hidden',marginTop:Spacing.md},
  budgetFill:{height:'100%',borderRadius:2},

  tab:{flex:1,paddingVertical:10,borderRadius:Radius.md,backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.border,alignItems:'center'},
  tabActive:{backgroundColor:'rgba(0,200,150,0.12)',borderColor:Colors.accent},
  tabText:{fontSize:12,fontWeight:'600',color:Colors.text3},
  tabTextActive:{color:Colors.accent,fontWeight:'700'},

  statCard:{flex:1,backgroundColor:Colors.surface,borderRadius:Radius.lg,borderWidth:1,borderColor:Colors.border,padding:Spacing.md,gap:6},
  statLabel:{fontSize:9,color:Colors.text3,textTransform:'uppercase',letterSpacing:0.8,fontWeight:'600'},
  statVal:{fontSize:16,fontWeight:'700',color:Colors.white},

  card:{backgroundColor:Colors.surface,borderRadius:Radius.xl,borderWidth:1,borderColor:Colors.border,padding:Spacing.lg},
  cardTitle:{fontSize:11,fontWeight:'700',color:Colors.text2,letterSpacing:1,textTransform:'uppercase',marginBottom:Spacing.md},
  cardLink:{fontSize:13,color:Colors.accent,fontWeight:'600'},

  catDot:{width:8,height:8,borderRadius:4,marginTop:4,flexShrink:0},
  catName:{fontSize:13,fontWeight:'500',color:Colors.white},
  catAmt:{fontSize:13,fontWeight:'700',color:Colors.white},
  catBg:{height:2,backgroundColor:Colors.surface3,borderRadius:1,overflow:'hidden'},
  catFill:{height:'100%',borderRadius:1},

  empty:{paddingVertical:28,alignItems:'center',gap:6},
  emptyText:{fontSize:15,fontWeight:'600',color:Colors.text2},
  emptySub:{fontSize:13,color:Colors.text3},
});
