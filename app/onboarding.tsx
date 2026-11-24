import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Dimensions, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors, Spacing, Radius } from '@/constants/theme';

const { width } = Dimensions.get('window');

const CURRENCIES = [
  { code:'INR', symbol:'₹', name:'Indian Rupee',     flag:'🇮🇳' },
  { code:'USD', symbol:'$', name:'US Dollar',         flag:'🇺🇸' },
  { code:'EUR', symbol:'€', name:'Euro',              flag:'🇪🇺' },
  { code:'GBP', symbol:'£', name:'British Pound',     flag:'🇬🇧' },
  { code:'AED', symbol:'د.إ',name:'UAE Dirham',       flag:'🇦🇪' },
  { code:'SGD', symbol:'S$',name:'Singapore Dollar',  flag:'🇸🇬' },
  { code:'AUD', symbol:'A$',name:'Australian Dollar', flag:'🇦🇺' },
  { code:'CAD', symbol:'C$',name:'Canadian Dollar',   flag:'🇨🇦' },
];

const BUDGETS = [500,1000,2000,3000,5000,10000,20000,50000];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [budget, setBudget] = useState(3000);
  const [customBudget, setCustomBudget] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { updateSettings } = useStore();

  const goNext = () => {
    Animated.timing(slideAnim, {
      toValue: -(step + 1) * width,
      duration: 350,
      useNativeDriver: true,
    }).start(() => setStep(s => s + 1));
  };

  const goBack = () => {
    Animated.timing(slideAnim, {
      toValue: -(step - 1) * width,
      duration: 350,
      useNativeDriver: true,
    }).start(() => setStep(s => s - 1));
  };

  const finish = () => {
    const finalBudget = customBudget ? Number(customBudget) : budget;
    updateSettings({
      name: name.trim() || 'Friend',
      currency: currency.code,
      currencySymbol: currency.symbol,
      dailyBudget: finalBudget,
    });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>

        {/* PROGRESS BAR */}
        <View style={styles.progressWrap}>
          {[0,1,2,3].map(i => (
            <View key={i} style={[styles.progressDot, i<=step && styles.progressDotActive, i===step && styles.progressDotCurrent]}/>
          ))}
        </View>

        {/* SLIDES */}
        <Animated.View style={[styles.slidesWrap, { transform:[{ translateX: slideAnim }] }]}>

          {/* STEP 0 — Welcome */}
          <View style={[styles.slide]}>
            <View style={styles.slideContent}>
              <View style={styles.iconWrap}>
                <Text style={styles.icon}>⚡</Text>
              </View>
              <Text style={styles.heading}>Welcome to{'\n'}SpendSnap</Text>
              <Text style={styles.subheading}>
                The fastest way to track every rupee you spend. Scan bills, log expenses in seconds, get instant reports.
              </Text>
              <View style={styles.featureList}>
                {[
                  { icon:'📷', text:'Scan any bill instantly' },
                  { icon:'⚡', text:'Log a spend in 3 taps' },
                  { icon:'📊', text:'Instant reports to WhatsApp' },
                  { icon:'🔒', text:'100% private, offline first' },
                ].map(f => (
                  <View key={f.text} style={styles.featureRow}>
                    <View style={styles.featureIconWrap}>
                      <Text style={{fontSize:16}}>{f.icon}</Text>
                    </View>
                    <Text style={styles.featureText}>{f.text}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.bottomWrap}>
              <TouchableOpacity style={styles.primaryBtn} onPress={goNext}>
                <Text style={styles.primaryBtnText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* STEP 1 — Name */}
          <View style={styles.slide}>
            <View style={styles.slideContent}>
              <Text style={styles.stepLabel}>STEP 1 OF 3</Text>
              <Text style={styles.heading}>What should{'\n'}we call you?</Text>
              <Text style={styles.subheading}>
                We'll personalise your experience and reports with your name.
              </Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.nameInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your first name"
                  placeholderTextColor={Colors.text3}
                  autoFocus
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={() => name.trim() && goNext()}
                />
                {name.length > 0 && (
                  <Text style={styles.namePreview}>Hey {name}, let's get started!</Text>
                )}
              </View>
            </View>
            <View style={styles.bottomWrap}>
              <TouchableOpacity style={[styles.primaryBtn, !name.trim() && styles.primaryBtnDisabled]}
                onPress={() => name.trim() && goNext()} disabled={!name.trim()}>
                <Text style={styles.primaryBtnText}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipBtn} onPress={() => { setName('Friend'); goNext(); }}>
                <Text style={styles.skipBtnText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* STEP 2 — Currency */}
          <View style={styles.slide}>
            <View style={styles.slideContent}>
              <Text style={styles.stepLabel}>STEP 2 OF 3</Text>
              <Text style={styles.heading}>Your currency</Text>
              <Text style={styles.subheading}>Choose the currency you spend in daily.</Text>
              <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
                {CURRENCIES.map(c => (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.currencyRow, currency.code===c.code && styles.currencyRowActive]}
                    onPress={() => setCurrency(c)}
                  >
                    <Text style={styles.currencyFlag}>{c.flag}</Text>
                    <View style={{flex:1}}>
                      <Text style={styles.currencyName}>{c.name}</Text>
                      <Text style={styles.currencyCode}>{c.code}</Text>
                    </View>
                    <Text style={styles.currencySymbol}>{c.symbol}</Text>
                    {currency.code===c.code && (
                      <View style={styles.checkWrap}>
                        <Text style={styles.check}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.bottomWrap}>
              <TouchableOpacity style={styles.primaryBtn} onPress={goNext}>
                <Text style={styles.primaryBtnText}>Continue with {currency.symbol} {currency.code}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* STEP 3 — Budget */}
          <View style={styles.slide}>
            <View style={styles.slideContent}>
              <Text style={styles.stepLabel}>STEP 3 OF 3</Text>
              <Text style={styles.heading}>Daily spending{'\n'}limit</Text>
              <Text style={styles.subheading}>
                We'll alert you when you're getting close. You can change this anytime.
              </Text>
              <View style={styles.budgetGrid}>
                {BUDGETS.map(b => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.budgetChip, budget===b && !customBudget && styles.budgetChipActive]}
                    onPress={() => { setBudget(b); setCustomBudget(''); }}
                  >
                    <Text style={[styles.budgetChipText, budget===b && !customBudget && styles.budgetChipTextActive]}>
                      {currency.symbol}{b.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.customWrap}>
                <Text style={styles.customLabel}>Or enter custom amount</Text>
                <View style={styles.customInputRow}>
                  <Text style={styles.customSymbol}>{currency.symbol}</Text>
                  <TextInput
                    style={styles.customInput}
                    value={customBudget}
                    onChangeText={setCustomBudget}
                    keyboardType="numeric"
                    placeholder="Custom amount"
                    placeholderTextColor={Colors.text3}
                  />
                </View>
              </View>
            </View>
            <View style={styles.bottomWrap}>
              <TouchableOpacity style={styles.primaryBtn} onPress={finish}>
                <Text style={styles.primaryBtnText}>Start Tracking</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
            </View>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:Colors.bg },

  progressWrap: {
    flexDirection:'row', gap:8,
    paddingHorizontal:Spacing.lg, paddingVertical:Spacing.md,
    justifyContent:'center',
  },
  progressDot: {
    height:4, flex:1, borderRadius:2,
    backgroundColor:Colors.surface2,
  },
  progressDotActive: { backgroundColor:Colors.accent2 },
  progressDotCurrent: { backgroundColor:Colors.accent },

  slidesWrap: {
    flexDirection:'row', flex:1, width: width * 4,
  },
  slide: {
    width, flex:1,
    justifyContent:'space-between',
  },
  slideContent: {
    flex:1, padding:Spacing.xl, paddingTop:Spacing.xxl,
  },

  iconWrap: {
    width:72, height:72, borderRadius:22,
    backgroundColor:Colors.accent,
    alignItems:'center', justifyContent:'center',
    marginBottom:Spacing.xl,
    shadowColor:Colors.accent,
    shadowOffset:{width:0,height:8},
    shadowOpacity:0.4, shadowRadius:20, elevation:12,
  },
  icon: { fontSize:36 },

  stepLabel: {
    fontSize:11, color:Colors.text3,
    fontWeight:'700', letterSpacing:1.5,
    marginBottom:Spacing.md,
  },
  heading: {
    fontSize:34, fontWeight:'800',
    color:Colors.white, letterSpacing:-0.8,
    lineHeight:42, marginBottom:Spacing.md,
  },
  subheading: {
    fontSize:15, color:Colors.text2,
    lineHeight:24, marginBottom:Spacing.xl,
  },

  featureList: { gap:16, marginTop:Spacing.sm },
  featureRow: { flexDirection:'row', alignItems:'center', gap:14 },
  featureIconWrap: {
    width:42, height:42, borderRadius:13,
    backgroundColor:Colors.surface2,
    borderWidth:1, borderColor:Colors.border2,
    alignItems:'center', justifyContent:'center',
  },
  featureText: { fontSize:14, color:Colors.white, fontWeight:'500', flex:1 },

  inputWrap: { gap:Spacing.lg },
  nameInput: {
    backgroundColor:Colors.surface,
    borderRadius:Radius.lg,
    borderWidth:1, borderColor:Colors.border2,
    paddingHorizontal:Spacing.lg, paddingVertical:18,
    fontSize:22, fontWeight:'700',
    color:Colors.white,
  },
  namePreview: {
    fontSize:14, color:Colors.accent,
    fontWeight:'500', textAlign:'center',
    marginTop:Spacing.sm,
  },

  currencyList: { flex:1, marginTop:Spacing.sm },
  currencyRow: {
    flexDirection:'row', alignItems:'center', gap:14,
    backgroundColor:Colors.surface,
    borderRadius:Radius.lg,
    borderWidth:1, borderColor:Colors.border,
    padding:Spacing.lg, marginBottom:10,
  },
  currencyRowActive: {
    borderColor:Colors.accent,
    backgroundColor:'rgba(0,200,150,0.07)',
  },
  currencyFlag: { fontSize:24 },
  currencyName: { fontSize:14, fontWeight:'600', color:Colors.white },
  currencyCode: { fontSize:11, color:Colors.text3, marginTop:2 },
  currencySymbol: { fontSize:18, fontWeight:'700', color:Colors.text2, marginRight:8 },
  checkWrap: {
    width:24, height:24, borderRadius:12,
    backgroundColor:Colors.accent,
    alignItems:'center', justifyContent:'center',
  },
  check: { fontSize:12, color:Colors.black, fontWeight:'800' },

  budgetGrid: {
    flexDirection:'row', flexWrap:'wrap', gap:10,
    marginBottom:Spacing.lg,
  },
  budgetChip: {
    paddingHorizontal:16, paddingVertical:12,
    borderRadius:Radius.md,
    backgroundColor:Colors.surface,
    borderWidth:1, borderColor:Colors.border2,
  },
  budgetChipActive: {
    backgroundColor:'rgba(0,200,150,0.1)',
    borderColor:Colors.accent,
  },
  budgetChipText: { fontSize:13, fontWeight:'600', color:Colors.text2 },
  budgetChipTextActive: { color:Colors.accent },

  customWrap: { gap:Spacing.sm },
  customLabel: { fontSize:12, color:Colors.text3, fontWeight:'500' },
  customInputRow: {
    flexDirection:'row', alignItems:'center', gap:8,
    backgroundColor:Colors.surface,
    borderRadius:Radius.md,
    borderWidth:1, borderColor:Colors.border2,
    paddingHorizontal:Spacing.md, paddingVertical:Spacing.md,
  },
  customSymbol: { fontSize:20, color:Colors.text2, fontWeight:'600' },
  customInput: { flex:1, fontSize:18, fontWeight:'600', color:Colors.white },

  bottomWrap: {
    padding:Spacing.xl, paddingTop:Spacing.md, gap:Spacing.sm,
  },
  primaryBtn: {
    backgroundColor:Colors.accent,
    borderRadius:Radius.lg,
    paddingVertical:16,
    alignItems:'center',
  },
  primaryBtnDisabled: { opacity:0.4 },
  primaryBtnText: { fontSize:16, fontWeight:'700', color:Colors.black },
  skipBtn: { alignItems:'center', paddingVertical:10 },
  skipBtnText: { fontSize:14, color:Colors.text3 },
  backBtn: { alignItems:'center', paddingVertical:10 },
  backBtnText: { fontSize:14, color:Colors.text3, fontWeight:'500' },
});
