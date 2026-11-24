import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors, Spacing, Radius, CATEGORIES } from '@/constants/theme';
import { CategoryKey } from '@/constants/theme';
import { PrimaryButton, GhostButton, Row, Card, Divider } from '@/components/UI';
import { scanBillFromCamera, scanBillFromGallery, OCRResult } from '@/utils/ocr';
import { parseSMS, parseMultipleSMS, SMSParseResult } from '@/utils/smsParser';

const OCR_API_KEY = process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY ?? '';

type CaptureMode = 'manual' | 'scan' | 'sms';

const MODES = [
  { key: 'manual' as CaptureMode, label: 'Quick Entry', sub: 'Type amount & label' },
  { key: 'scan'   as CaptureMode, label: 'Scan Bill',   sub: 'Camera OCR' },
  { key: 'sms'    as CaptureMode, label: 'SMS / UPI',   sub: 'Paste & parse' },
];

export default function AddScreen() {
  const [mode, setMode]           = useState<CaptureMode>('manual');
  const [amount, setAmount]       = useState('');
  const [label, setLabel]         = useState('');
  const [category, setCategory]   = useState<CategoryKey>('food');
  const [note, setNote]           = useState('');
  const [saving, setSaving]       = useState(false);
  const [scanning, setScanning]   = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [showRaw, setShowRaw]     = useState(false);

  // SMS states
  const [smsText, setSmsText]           = useState('');
  const [parsedSMS, setParsedSMS]       = useState<SMSParseResult[]>([]);
  const [confirmedIds, setConfirmedIds] = useState<Set<number>>(new Set());

  const { addExpense, settings, getExpensesForPeriod, getTotalForPeriod } = useStore();
  const sym        = settings.currencySymbol;
  const todayTotal = getTotalForPeriod('today');

  // ── Save expense with notification ────────────────────────────────────────
  const handleSave = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert('Invalid amount', 'Please enter a valid amount.'); return; }
    if (!label.trim())    { Alert.alert('Missing label', 'Add a description.'); return; }

    setSaving(true);

    const newTotal = todayTotal + num;

    addExpense({
      amount: num,
      label: label.trim(),
      category,
      note: note.trim() || undefined,
      captureMethod: mode,
      merchant: label.trim(),
    });

    // Fire notification silently
    try {
      const { triggerExpenseNotifications } = await import('@/utils/notifyOnSave');
      await triggerExpenseNotifications(
        label.trim(), num, sym, newTotal, settings.dailyBudget
      );
    } catch {}

    setSaving(false);
    router.back();
  };

  // ── OCR scan ─────────────────────────────────────────────────────────────
  const handleScan = async (fromGallery = false) => {
    setScanning(true);
    setOcrResult(null);
    try {
      const result = fromGallery
        ? await scanBillFromGallery(OCR_API_KEY)
        : await scanBillFromCamera(OCR_API_KEY);
      if (result) {
        setOcrResult(result);
        setAmount(String(result.amount));
        setLabel(result.merchant);
        setCategory(result.category);
      }
    } catch (err: any) {
      Alert.alert('Scan failed', err.message ?? 'Could not read bill. Try again or enter manually.');
    } finally {
      setScanning(false);
    }
  };

  // ── SMS parse ─────────────────────────────────────────────────────────────
  const handleParseSMS = () => {
    if (!smsText.trim()) { Alert.alert('Paste an SMS first'); return; }
    const results = parseMultipleSMS(smsText);
    if (results.length === 0) {
      const single = parseSMS(smsText);
      if (single && single.amount > 0) {
        setParsedSMS([single]);
      } else {
        Alert.alert('No transactions found', 'Make sure you paste a UPI or bank debit SMS.');
      }
      return;
    }
    setParsedSMS(results);
    setConfirmedIds(new Set());
  };

  const handleConfirmSMS = (result: SMSParseResult, index: number) => {
    addExpense({
      amount: result.amount,
      label: result.merchant,
      category: result.category,
      captureMethod: 'sms',
      merchant: result.merchant,
      note: `Via ${result.bank}`,
    });
    setConfirmedIds(prev => new Set([...prev, index]));
  };

  const handleConfirmAll = () => {
    parsedSMS.forEach((result, i) => {
      if (!confirmedIds.has(i)) {
        addExpense({
          amount: result.amount,
          label: result.merchant,
          category: result.category,
          captureMethod: 'sms',
          merchant: result.merchant,
          note: `Via ${result.bank}`,
        });
      }
    });
    Alert.alert('All saved!', `${parsedSMS.length} transactions added.`);
    setSmsText('');
    setParsedSMS([]);
    setConfirmedIds(new Set());
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios' ? 'padding' : undefined}>

        {/* HEADER */}
        <Row style={styles.header}>
          <Text style={styles.title}>Add Expense</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </Row>

        {/* MODE TABS */}
        <Row style={styles.modeRow}>
          {MODES.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.modeTab, mode===m.key && styles.modeTabActive]}
              onPress={() => {
                setMode(m.key);
                setOcrResult(null); setAmount(''); setLabel('');
                setParsedSMS([]); setSmsText('');
              }}
            >
              <Text style={[styles.modeLabel, mode===m.key && styles.modeLabelActive]}>{m.label}</Text>
              <Text style={[styles.modeSub, mode===m.key && styles.modeSubActive]}>{m.sub}</Text>
            </TouchableOpacity>
          ))}
        </Row>

        <ScrollView style={{ flex:1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* ── SCAN MODE ─────────────────────────────────────────── */}
          {mode === 'scan' && (
            <View style={{ gap: Spacing.md }}>
              {!scanning && !ocrResult && (
                <View style={{ gap: Spacing.sm }}>
                  <TouchableOpacity style={styles.scanPrimary} onPress={() => handleScan(false)} activeOpacity={0.85}>
                    <Text style={styles.scanPrimaryIcon}>📷</Text>
                    <View>
                      <Text style={styles.scanPrimaryTitle}>Scan with Camera</Text>
                      <Text style={styles.scanPrimarySub}>Point at any bill or receipt</Text>
                    </View>
                  </TouchableOpacity>
                  <GhostButton label="Pick from Gallery" onPress={() => handleScan(true)} />
                </View>
              )}

              {scanning && (
                <View style={styles.scanningWrap}>
                  <ActivityIndicator color={Colors.accent} size="large" />
                  <Text style={styles.scanningTitle}>Reading your bill...</Text>
                  <Text style={styles.scanningSub}>OCR processing</Text>
                </View>
              )}

              {ocrResult && !scanning && (
                <View style={{ gap: Spacing.md }}>
                  <Row style={{ justifyContent:'space-between', alignItems:'center' }}>
                    <Text style={styles.ocrSuccess}>Bill scanned</Text>
                    <View style={[styles.confidenceBadge, {
                      backgroundColor: ocrResult.confidence==='high' ? 'rgba(0,200,150,0.15)'
                        : ocrResult.confidence==='medium' ? 'rgba(255,179,71,0.15)'
                        : 'rgba(255,107,107,0.15)'
                    }]}>
                      <Text style={[styles.confidenceText, {
                        color: ocrResult.confidence==='high' ? Colors.accent
                          : ocrResult.confidence==='medium' ? Colors.accent4
                          : Colors.red
                      }]}>
                        {ocrResult.confidence === 'high' ? 'High confidence'
                          : ocrResult.confidence === 'medium' ? 'Check values'
                          : 'Low confidence'}
                      </Text>
                    </View>
                  </Row>
                  <Card style={styles.ocrCard}>
                    <Text style={styles.ocrCardLabel}>EXTRACTED FROM BILL</Text>
                    {[
                      { key:'Merchant', val: ocrResult.merchant },
                      { key:'Amount',   val: `${sym}${ocrResult.amount}` },
                      { key:'Category', val: CATEGORIES.find(c=>c.key===ocrResult.category)?.label ?? ocrResult.category },
                    ].map(item => (
                      <Row key={item.key} style={styles.ocrRow}>
                        <Text style={styles.ocrKey}>{item.key}</Text>
                        <Text style={styles.ocrVal}>{item.val}</Text>
                      </Row>
                    ))}
                    <TouchableOpacity onPress={() => setShowRaw(!showRaw)} style={{ marginTop: Spacing.sm }}>
                      <Text style={styles.rawToggle}>{showRaw ? 'Hide' : 'Show'} raw text</Text>
                    </TouchableOpacity>
                    {showRaw && <Text style={styles.rawText} numberOfLines={8}>{ocrResult.rawText}</Text>}
                  </Card>
                  <GhostButton label="Rescan" onPress={() => { setOcrResult(null); setAmount(''); setLabel(''); }} />
                </View>
              )}

              <View style={{ gap: Spacing.md }}>
                {ocrResult && <Text style={styles.editLabel}>Review & edit if needed</Text>}
                <View style={styles.amountWrap}>
                  <Text style={styles.amountSym}>{sym}</Text>
                  <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount}
                    keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={Colors.text3}/>
                </View>
                <TextInput style={styles.input} value={label} onChangeText={setLabel}
                  placeholder="Merchant / Description" placeholderTextColor={Colors.text3}/>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8, paddingVertical:2 }}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity key={c.key} style={[styles.chip, category===c.key && styles.chipActive]} onPress={() => setCategory(c.key)}>
                      <Text style={[styles.chipText, category===c.key && styles.chipTextActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput style={[styles.input, { height:72, textAlignVertical:'top', paddingTop:12 }]}
                  value={note} onChangeText={setNote} placeholder="Note (optional)"
                  placeholderTextColor={Colors.text3} multiline/>
                <PrimaryButton label="Save Expense" onPress={handleSave} loading={saving} />
              </View>
            </View>
          )}

          {/* ── MANUAL MODE ───────────────────────────────────────── */}
          {mode === 'manual' && (
            <View style={{ gap: Spacing.md }}>
              <View style={styles.amountWrap}>
                <Text style={styles.amountSym}>{sym}</Text>
                <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount}
                  keyboardType="decimal-pad" autoFocus placeholder="0.00" placeholderTextColor={Colors.text3}/>
              </View>
              <TextInput style={styles.input} value={label} onChangeText={setLabel}
                placeholder="Description" placeholderTextColor={Colors.text3}/>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8, paddingVertical:2 }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c.key} style={[styles.chip, category===c.key && styles.chipActive]} onPress={() => setCategory(c.key)}>
                    <Text style={[styles.chipText, category===c.key && styles.chipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput style={[styles.input, { height:72, textAlignVertical:'top', paddingTop:12 }]}
                value={note} onChangeText={setNote} placeholder="Note (optional)"
                placeholderTextColor={Colors.text3} multiline/>
              <PrimaryButton label="Save" onPress={handleSave} loading={saving} />
            </View>
          )}

          {/* ── SMS MODE ──────────────────────────────────────────── */}
          {mode === 'sms' && (
            <View style={{ gap: Spacing.md }}>

              <View style={styles.smsHowTo}>
                <Text style={styles.smsHowToTitle}>How to use</Text>
                <Text style={styles.smsHowToText}>
                  1. Open your Messages app{'\n'}
                  2. Find any UPI / bank debit SMS{'\n'}
                  3. Copy the message{'\n'}
                  4. Paste it below and tap Parse
                </Text>
              </View>

              <TextInput
                style={styles.smsPasteBox}
                value={smsText}
                onChangeText={setSmsText}
                placeholder={`Paste your SMS here...\n\nExample:\nRs.420 debited from A/c XX1234 to VPA pizzahut@upi on 18-05-26. UPI Ref: 123456`}
                placeholderTextColor={Colors.text3}
                multiline
                textAlignVertical="top"
              />

              <PrimaryButton label="Parse SMS" onPress={handleParseSMS} />

              {parsedSMS.length > 0 && (
                <View style={{ gap: Spacing.sm }}>
                  <Row style={{ justifyContent:'space-between', alignItems:'center' }}>
                    <Text style={styles.parsedTitle}>
                      {parsedSMS.length} transaction{parsedSMS.length > 1 ? 's' : ''} found
                    </Text>
                    {parsedSMS.length > 1 && (
                      <TouchableOpacity style={styles.confirmAllBtn} onPress={handleConfirmAll}>
                        <Text style={styles.confirmAllText}>Add All</Text>
                      </TouchableOpacity>
                    )}
                  </Row>

                  {parsedSMS.map((result, i) => (
                    <Card key={i} style={[styles.parsedCard, confirmedIds.has(i) && styles.parsedCardDone]}>
                      <Row style={{ justifyContent:'space-between', alignItems:'flex-start' }}>
                        <View style={{ flex:1, gap:4 }}>
                          <Text style={styles.parsedMerchant}>{result.merchant}</Text>
                          <Text style={styles.parsedMeta}>
                            {CATEGORIES.find(c=>c.key===result.category)?.label} · {result.bank}
                          </Text>
                        </View>
                        <View style={{ alignItems:'flex-end', gap:6 }}>
                          <Text style={styles.parsedAmount}>{sym}{result.amount}</Text>
                          {confirmedIds.has(i) ? (
                            <View style={styles.savedBadge}>
                              <Text style={styles.savedBadgeText}>✓ Saved</Text>
                            </View>
                          ) : (
                            <TouchableOpacity style={styles.addBtn} onPress={() => handleConfirmSMS(result, i)}>
                              <Text style={styles.addBtnText}>Add</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </Row>
                    </Card>
                  ))}
                </View>
              )}

              <View style={styles.orDivider}>
                <View style={styles.orLine}/>
                <Text style={styles.orText}>or try sample messages</Text>
                <View style={styles.orLine}/>
              </View>

              <Text style={styles.sampleLabel}>TAP TO TRY</Text>
              {[
                'Rs.420 debited from A/c XX1234 to VPA pizzahut@upi on 29-05-26. UPI Ref: 123456789. -HDFC Bank',
                'INR 540.00 debited from your account XX5678 for UPI txn to ola@okaxis on 29-05-26. -Axis Bank',
                'Rs 1200 paid to amazon@apl via UPI on 29-05-26. Ref No 987654321. -SBI',
              ].map((sample, i) => (
                <TouchableOpacity key={i} style={styles.sampleCard} onPress={() => setSmsText(sample)}>
                  <Text style={styles.sampleText} numberOfLines={2}>{sample}</Text>
                  <Text style={styles.sampleTap}>Tap to use →</Text>
                </TouchableOpacity>
              ))}

            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:Colors.bg },
  header: {
    paddingHorizontal:Spacing.lg, paddingVertical:Spacing.md,
    justifyContent:'space-between', borderBottomWidth:0.5, borderBottomColor:Colors.border,
  },
  title: { fontSize:17, fontWeight:'700', color:Colors.white },
  closeBtn: { width:30, height:30, borderRadius:15, backgroundColor:Colors.surface2, alignItems:'center', justifyContent:'center' },
  closeText: { fontSize:12, color:Colors.text2 },
  modeRow: { paddingHorizontal:Spacing.lg, paddingVertical:Spacing.sm, gap:8, borderBottomWidth:0.5, borderBottomColor:Colors.border },
  modeTab: { flex:1, paddingVertical:10, borderRadius:Radius.md, alignItems:'center', backgroundColor:Colors.surface, borderWidth:1, borderColor:Colors.border },
  modeTabActive: { backgroundColor:'rgba(0,200,150,0.1)', borderColor:Colors.accent },
  modeLabel: { fontSize:12, fontWeight:'700', color:Colors.text3 },
  modeLabelActive: { color:Colors.accent },
  modeSub: { fontSize:9, color:Colors.text3, marginTop:2 },
  modeSubActive: { color:Colors.accent2 },
  content: { padding:Spacing.lg, gap:Spacing.md, paddingBottom:40 },
  scanPrimary: {
    flexDirection:'row', alignItems:'center', gap:16,
    backgroundColor:Colors.accent, borderRadius:Radius.xl, padding:Spacing.xl,
  },
  scanPrimaryIcon: { fontSize:32 },
  scanPrimaryTitle: { fontSize:16, fontWeight:'700', color:Colors.black },
  scanPrimarySub: { fontSize:12, color:'rgba(0,0,0,0.6)', marginTop:2 },
  scanningWrap: {
    backgroundColor:Colors.surface, borderRadius:Radius.xl,
    borderWidth:1, borderColor:Colors.border2, padding:40, alignItems:'center', gap:12,
  },
  scanningTitle: { fontSize:16, fontWeight:'600', color:Colors.white },
  scanningSub: { fontSize:12, color:Colors.text3 },
  ocrSuccess: { fontSize:13, fontWeight:'600', color:Colors.accent },
  confidenceBadge: { paddingHorizontal:10, paddingVertical:4, borderRadius:Radius.full },
  confidenceText: { fontSize:11, fontWeight:'600' },
  ocrCard: { gap:Spacing.sm },
  ocrCardLabel: { fontSize:10, color:Colors.text3, fontWeight:'700', letterSpacing:1, textTransform:'uppercase', marginBottom:4 },
  ocrRow: { justifyContent:'space-between', paddingVertical:3 },
  ocrKey: { fontSize:13, color:Colors.text3 },
  ocrVal: { fontSize:13, fontWeight:'600', color:Colors.white },
  rawToggle: { fontSize:12, color:Colors.accent, fontWeight:'500', marginTop:4 },
  rawText: { fontSize:10, color:Colors.text3, lineHeight:16, marginTop:8 },
  editLabel: { fontSize:12, color:Colors.text3, fontWeight:'500' },
  amountWrap: {
    flexDirection:'row', alignItems:'center', gap:6,
    backgroundColor:Colors.surface, borderRadius:Radius.lg,
    borderWidth:1, borderColor:Colors.border2,
    paddingHorizontal:Spacing.lg, paddingVertical:Spacing.md,
  },
  amountSym: { fontSize:28, color:Colors.text3, fontWeight:'300' },
  amountInput: { flex:1, fontSize:40, fontWeight:'700', color:Colors.accent, letterSpacing:-1 },
  input: {
    backgroundColor:Colors.surface, borderRadius:Radius.md, borderWidth:1, borderColor:Colors.border2,
    paddingHorizontal:Spacing.md, paddingVertical:13, color:Colors.white, fontSize:14,
  },
  chip: { paddingHorizontal:14, paddingVertical:8, borderRadius:Radius.full, backgroundColor:Colors.surface, borderWidth:1, borderColor:Colors.border2 },
  chipActive: { borderColor:Colors.accent, backgroundColor:'rgba(0,200,150,0.1)' },
  chipText: { fontSize:12, color:Colors.text2, fontWeight:'500' },
  chipTextActive: { color:Colors.accent },
  smsHowTo: {
    backgroundColor:Colors.surface, borderRadius:Radius.lg,
    borderWidth:1, borderColor:Colors.border2, padding:Spacing.lg,
  },
  smsHowToTitle: { fontSize:13, fontWeight:'700', color:Colors.white, marginBottom:8 },
  smsHowToText: { fontSize:13, color:Colors.text2, lineHeight:22 },
  smsPasteBox: {
    backgroundColor:Colors.surface, borderRadius:Radius.lg,
    borderWidth:1, borderColor:Colors.border2,
    padding:Spacing.lg, color:Colors.white, fontSize:13,
    minHeight:130, lineHeight:20,
  },
  parsedTitle: { fontSize:14, fontWeight:'700', color:Colors.white },
  confirmAllBtn: {
    backgroundColor:Colors.accent, borderRadius:Radius.sm, paddingHorizontal:14, paddingVertical:6,
  },
  confirmAllText: { fontSize:12, fontWeight:'700', color:Colors.black },
  parsedCard: { gap:8 },
  parsedCardDone: { opacity:0.5 },
  parsedMerchant: { fontSize:14, fontWeight:'600', color:Colors.white },
  parsedMeta: { fontSize:11, color:Colors.text3 },
  parsedAmount: { fontSize:16, fontWeight:'800', color:Colors.white },
  addBtn: {
    backgroundColor:Colors.accent, borderRadius:Radius.sm, paddingHorizontal:14, paddingVertical:6,
  },
  addBtnText: { fontSize:12, fontWeight:'700', color:Colors.black },
  savedBadge: {
    backgroundColor:'rgba(0,200,150,0.15)', borderRadius:Radius.sm, paddingHorizontal:10, paddingVertical:5,
  },
  savedBadgeText: { fontSize:11, fontWeight:'600', color:Colors.accent },
  orDivider: { flexDirection:'row', alignItems:'center', gap:10 },
  orLine: { flex:1, height:0.5, backgroundColor:Colors.border },
  orText: { fontSize:11, color:Colors.text3 },
  sampleLabel: { fontSize:10, color:Colors.text3, fontWeight:'700', letterSpacing:1 },
  sampleCard: {
    backgroundColor:Colors.surface, borderRadius:Radius.md,
    borderWidth:1, borderColor:Colors.border2, padding:Spacing.md, gap:6,
  },
  sampleText: { fontSize:12, color:Colors.text2, lineHeight:18 },
  sampleTap: { fontSize:11, color:Colors.accent, fontWeight:'600' },
});
