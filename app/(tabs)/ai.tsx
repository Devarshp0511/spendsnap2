import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store/useStore';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { formatCurrency, getCategoryLabel, sortedCategories } from '@/utils/helpers';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const SUGGESTED = [
  'Where did I overspend this week?',
  'How much do I spend on food monthly?',
  'Am I on track with my budget?',
  'What\'s my biggest spending category?',
  'How can I reduce my expenses?',
  'Compare this week vs last week',
];

export default function AIScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const typingDot = useRef(new Animated.Value(0)).current;

  const { expenses, settings, getExpensesForPeriod, getTotalForPeriod, getByCategory } = useStore();
  const sym = settings.currencySymbol;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingDot, { toValue:1, duration:600, useNativeDriver:true }),
          Animated.timing(typingDot, { toValue:0, duration:600, useNativeDriver:true }),
        ])
      ).start();
    }
  }, [loading]);

  // Build spending context for Claude
  const buildContext = () => {
    const todayExpenses   = getExpensesForPeriod('today');
    const weekExpenses    = getExpensesForPeriod('week');
    const monthExpenses   = getExpensesForPeriod('month');
    const todayTotal      = getTotalForPeriod('today');
    const weekTotal       = getTotalForPeriod('week');
    const monthTotal      = getTotalForPeriod('month');
    const byCategory      = getByCategory(monthExpenses);
    const topCats         = sortedCategories(byCategory).slice(0,5);

    const recentTx = expenses.slice(0,10).map(e =>
      `- ${e.label}: ${sym}${e.amount} (${e.category}, ${new Date(e.createdAt).toLocaleDateString()})`
    ).join('\n');

    return `
You are a personal finance assistant inside SpendSnap, a spending tracker app.
The user's name is ${settings.name}.
Their daily budget is ${sym}${settings.dailyBudget}.
Their currency is ${settings.currency}.

SPENDING SUMMARY:
- Today: ${sym}${todayTotal} across ${todayExpenses.length} transactions
- This week: ${sym}${weekTotal} across ${weekExpenses.length} transactions
- This month: ${sym}${monthTotal} across ${monthExpenses.length} transactions

TOP CATEGORIES THIS MONTH:
${topCats.map(([cat,amt]) => `- ${getCategoryLabel(cat)}: ${sym}${amt}`).join('\n')}

RECENT TRANSACTIONS:
${recentTx}

Be concise, friendly, and specific. Use the actual numbers from their data.
Give actionable advice. Keep responses under 150 words.
Use ${sym} for amounts. Don't use markdown formatting, just plain text.
    `.trim();
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '', 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: buildContext(),
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.text })),
            { role: 'user', content: text.trim() },
          ],
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text ?? "Sorry, I couldn't get a response. Please try again.";

      const assistantMsg: Message = {
        id: Math.random().toString(36).slice(2),
        role: 'assistant',
        text: reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).slice(2),
        role: 'assistant',
        text: "Couldn't connect right now. Check your internet and try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={0}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiDot}/>
            <View>
              <Text style={styles.headerTitle}>Ask AI</Text>
              <Text style={styles.headerSub}>Powered by Claude</Text>
            </View>
          </View>
          <View style={styles.modelBadge}>
            <Text style={styles.modelBadgeText}>claude-sonnet</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* EMPTY STATE */}
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Text style={{fontSize:32}}>✦</Text>
              </View>
              <Text style={styles.emptyTitle}>Your AI money advisor</Text>
              <Text style={styles.emptySub}>
                Ask anything about your spending. Claude has full context of your transactions and budget.
              </Text>

              <Text style={styles.suggestLabel}>Try asking</Text>
              <View style={styles.suggestions}>
                {SUGGESTED.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestionChip}
                    onPress={() => sendMessage(s)}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* MESSAGES */}
          {messages.map(msg => (
            <View key={msg.id} style={[styles.msgWrap, msg.role==='user' && styles.msgWrapUser]}>
              {msg.role === 'assistant' && (
                <View style={styles.msgAvatar}>
                  <Text style={{fontSize:12}}>✦</Text>
                </View>
              )}
              <View style={[styles.bubble, msg.role==='user' ? styles.bubbleUser : styles.bubbleAI]}>
                <Text style={[styles.bubbleText, msg.role==='user' && styles.bubbleTextUser]}>
                  {msg.text}
                </Text>
                <Text style={[styles.bubbleTime, msg.role==='user' && styles.bubbleTimeUser]}>
                  {formatTime(msg.timestamp)}
                </Text>
              </View>
            </View>
          ))}

          {/* TYPING INDICATOR */}
          {loading && (
            <View style={styles.msgWrap}>
              <View style={styles.msgAvatar}>
                <Text style={{fontSize:12}}>✦</Text>
              </View>
              <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
                <View style={styles.typingDots}>
                  {[0,1,2].map(i => (
                    <Animated.View
                      key={i}
                      style={[styles.typingDot, {
                        opacity: typingDot,
                        transform:[{ translateY: Animated.multiply(typingDot, new Animated.Value(-3)) }]
                      }]}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* INPUT BAR */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your spending..."
              placeholderTextColor={Colors.text3}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(input)}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.bg} size="small"/>
              : <Text style={styles.sendBtnText}>↑</Text>
            }
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:Colors.bg },

  header: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingHorizontal:Spacing.lg, paddingVertical:Spacing.md,
    borderBottomWidth:0.5, borderBottomColor:Colors.border,
  },
  headerLeft: { flexDirection:'row', alignItems:'center', gap:12 },
  aiDot: {
    width:10, height:10, borderRadius:5,
    backgroundColor:Colors.accent,
    shadowColor:Colors.accent, shadowOffset:{width:0,height:0},
    shadowOpacity:0.8, shadowRadius:6, elevation:4,
  },
  headerTitle: { fontSize:18, fontWeight:'800', color:Colors.white, letterSpacing:-0.3 },
  headerSub: { fontSize:11, color:Colors.text3, marginTop:1 },
  modelBadge: {
    backgroundColor:Colors.surface2,
    borderRadius:Radius.full,
    paddingHorizontal:10, paddingVertical:4,
    borderWidth:1, borderColor:Colors.border2,
  },
  modelBadgeText: { fontSize:10, color:Colors.accent, fontWeight:'600', letterSpacing:0.3 },

  messages: { flex:1 },
  messagesContent: { padding:Spacing.lg, gap:Spacing.md, paddingBottom:Spacing.xl },

  emptyState: { alignItems:'center', paddingTop:Spacing.xl, gap:Spacing.md },
  emptyIcon: {
    width:72, height:72, borderRadius:22,
    backgroundColor:Colors.surface2,
    borderWidth:1, borderColor:Colors.border2,
    alignItems:'center', justifyContent:'center',
    marginBottom:Spacing.sm,
  },
  emptyTitle: { fontSize:20, fontWeight:'800', color:Colors.white, letterSpacing:-0.3 },
  emptySub: { fontSize:14, color:Colors.text2, textAlign:'center', lineHeight:22, maxWidth:300 },
  suggestLabel: {
    fontSize:11, color:Colors.text3,
    fontWeight:'700', letterSpacing:1,
    textTransform:'uppercase', marginTop:Spacing.md,
    alignSelf:'flex-start',
  },
  suggestions: { width:'100%', gap:8 },
  suggestionChip: {
    backgroundColor:Colors.surface,
    borderRadius:Radius.lg,
    borderWidth:1, borderColor:Colors.border2,
    paddingHorizontal:Spacing.md, paddingVertical:12,
  },
  suggestionText: { fontSize:13, color:Colors.text2, fontWeight:'500' },

  msgWrap: { flexDirection:'row', alignItems:'flex-end', gap:8 },
  msgWrapUser: { flexDirection:'row-reverse' },
  msgAvatar: {
    width:28, height:28, borderRadius:10,
    backgroundColor:Colors.surface2,
    borderWidth:1, borderColor:Colors.border2,
    alignItems:'center', justifyContent:'center',
    flexShrink:0,
  },
  bubble: {
    maxWidth:'80%', borderRadius:Radius.lg,
    padding:Spacing.md, gap:4,
  },
  bubbleAI: {
    backgroundColor:Colors.surface,
    borderWidth:1, borderColor:Colors.border2,
    borderBottomLeftRadius:4,
  },
  bubbleUser: {
    backgroundColor:Colors.accent,
    borderBottomRightRadius:4,
  },
  bubbleText: { fontSize:14, color:Colors.white, lineHeight:22 },
  bubbleTextUser: { color:Colors.black },
  bubbleTime: { fontSize:10, color:Colors.text3, alignSelf:'flex-end' },
  bubbleTimeUser: { color:'rgba(0,0,0,0.4)' },
  typingBubble: { paddingVertical:14 },
  typingDots: { flexDirection:'row', gap:5, alignItems:'center' },
  typingDot: {
    width:7, height:7, borderRadius:4,
    backgroundColor:Colors.accent,
  },

  inputBar: {
    flexDirection:'row', alignItems:'flex-end', gap:10,
    paddingHorizontal:Spacing.lg, paddingVertical:Spacing.md,
    borderTopWidth:0.5, borderTopColor:Colors.border,
    backgroundColor:Colors.bg,
  },
  inputWrap: {
    flex:1,
    backgroundColor:Colors.surface,
    borderRadius:Radius.xl,
    borderWidth:1, borderColor:Colors.border2,
    paddingHorizontal:Spacing.md, paddingVertical:10,
    minHeight:44,
  },
  input: { fontSize:15, color:Colors.white, maxHeight:100 },
  sendBtn: {
    width:44, height:44, borderRadius:14,
    backgroundColor:Colors.accent,
    alignItems:'center', justifyContent:'center',
  },
  sendBtnDisabled: { backgroundColor:Colors.surface2 },
  sendBtnText: { fontSize:20, color:Colors.black, fontWeight:'700', lineHeight:24 },
});
