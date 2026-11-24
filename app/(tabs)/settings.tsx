import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { Card, Row, Toggle, Divider } from '@/components/UI';

const CURRENCIES = [
  {code:'INR',symbol:'₹',name:'Indian Rupee'},
  {code:'USD',symbol:'$',name:'US Dollar'},
  {code:'EUR',symbol:'€',name:'Euro'},
  {code:'GBP',symbol:'£',name:'British Pound'},
  {code:'AED',symbol:'د.إ',name:'UAE Dirham'},
  {code:'SGD',symbol:'S$',name:'Singapore Dollar'},
];

export default function SettingsScreen() {
  const { settings, updateSettings, expenses } = useStore();
  const { user, logout, syncToCloud } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(settings.name);
  const [phone, setPhone] = useState(settings.phone??'');
  const [email, setEmail] = useState(settings.email??'');
  const [budget, setBudget] = useState(String(settings.dailyBudget));
  const [showCurrencies, setShowCurrencies] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const saveProfile = () => {
    updateSettings({name, phone, email, dailyBudget: Number(budget)||3000});
    setEditing(false);
  };

  const exportData = async () => {
    const csv = [
      'Date,Merchant,Category,Amount,Method',
      ...expenses.map(e =>
        `${new Date(e.createdAt).toLocaleDateString()},${e.label},${e.category},${e.amount},${e.captureMethod}`
      ),
    ].join('\n');
    await Share.share({message: csv, title: 'SpendSnap Export'});
  };

  const handleSync = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setSyncing(true);
    try {
      await syncToCloud(expenses);
      Alert.alert('Synced!', 'All expenses saved to cloud successfully.');
    } catch {
      Alert.alert('Sync failed', 'Check your internet connection and try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => { await logout(); },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* PROFILE */}
        <Card>
          <Row style={{gap:14}}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{settings.name.slice(0,2).toUpperCase()}</Text>
            </View>
            <View style={{flex:1}}>
              {editing
                ? <TextInput style={styles.nameInput} value={name} onChangeText={setName} autoFocus/>
                : <Text style={styles.profileName}>{settings.name}</Text>
              }
              <Text style={styles.profileSub}>
                {user ? user.email : (settings.email || 'Add your email')}
              </Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={()=>editing?saveProfile():setEditing(true)}>
              <Text style={styles.editBtnText}>{editing?'Save':'Edit'}</Text>
            </TouchableOpacity>
          </Row>
          {editing&&(
            <View style={{gap:8,marginTop:Spacing.md}}>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone}
                placeholder="Phone number" placeholderTextColor={Colors.text3} keyboardType="phone-pad"/>
              <TextInput style={styles.input} value={email} onChangeText={setEmail}
                placeholder="Email address" placeholderTextColor={Colors.text3} keyboardType="email-address"/>
              <TextInput style={styles.input} value={budget} onChangeText={setBudget}
                placeholder="Daily budget" placeholderTextColor={Colors.text3} keyboardType="numeric"/>
            </View>
          )}
        </Card>

        {/* CURRENCY */}
        <Text style={styles.sectionLabel}>CURRENCY</Text>
        <TouchableOpacity style={styles.currencyRow} onPress={()=>setShowCurrencies(!showCurrencies)}>
          <Text style={styles.currencySymbolBig}>{settings.currencySymbol}</Text>
          <View style={{flex:1}}>
            <Text style={styles.currencyName}>{settings.currency}</Text>
            <Text style={styles.currencySub}>Tap to change</Text>
          </View>
          <Text style={{color:Colors.text3,fontSize:12}}>{showCurrencies?'▲':'▼'}</Text>
        </TouchableOpacity>
        {showCurrencies&&(
          <Card style={{gap:0,padding:0,overflow:'hidden',marginTop:-8,borderTopLeftRadius:0,borderTopRightRadius:0}}>
            {CURRENCIES.map((c,i)=>(
              <View key={c.code}>
                <TouchableOpacity style={styles.currencyOption}
                  onPress={()=>{updateSettings({currency:c.code,currencySymbol:c.symbol});setShowCurrencies(false);}}>
                  <Text style={styles.currencyOptionSym}>{c.symbol}</Text>
                  <Text style={styles.currencyOptionName}>{c.name}</Text>
                  {settings.currency===c.code&&<Text style={{color:Colors.accent,fontWeight:'700'}}>✓</Text>}
                </TouchableOpacity>
                {i<CURRENCIES.length-1&&<Divider style={{marginHorizontal:Spacing.lg,marginVertical:0}}/>}
              </View>
            ))}
          </Card>
        )}

        {/* PREFERENCES */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <Card style={{gap:0,padding:0,overflow:'hidden'}}>
          {[
            {title:'Daily alert',     sub:`Notify when over ${settings.currencySymbol}${settings.dailyBudget}/day`, key:'dailyDigestEnabled'  as const},
            {title:'SMS auto-read',   sub:'Parse UPI and bank alerts',                                              key:'smsAutoReadEnabled'   as const},
            {title:'Offline first',   sub:'Keep all data on device',                                               key:'offlineFirst'         as const},
          ].map((item,i,arr)=>(
            <View key={item.key}>
              <Row style={styles.prefRow}>
                <View style={{flex:1}}>
                  <Text style={styles.prefTitle}>{item.title}</Text>
                  <Text style={styles.prefSub}>{item.sub}</Text>
                </View>
                <Toggle
                  value={settings[item.key] as boolean}
                  onToggle={()=>updateSettings({[item.key]:!settings[item.key]})}
                />
              </Row>
              {i<arr.length-1&&<Divider style={{marginHorizontal:Spacing.lg,marginVertical:0}}/>}
            </View>
          ))}
        </Card>

        {/* NOTIFICATIONS */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <Card style={{gap:0,padding:0,overflow:'hidden'}}>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/notifications')}>
            <View style={styles.actionIcon}><Text style={{fontSize:18}}>🔔</Text></View>
            <View style={{flex:1}}>
              <Text style={styles.prefTitle}>Notification settings</Text>
              <Text style={styles.prefSub}>Daily digest, budget alerts, weekly summary</Text>
            </View>
            <Text style={{color:Colors.text3,fontSize:16}}>→</Text>
          </TouchableOpacity>
        </Card>

        {/* ACCOUNT & SYNC */}
        <Text style={styles.sectionLabel}>ACCOUNT & SYNC</Text>
        <Card style={{gap:0,padding:0,overflow:'hidden'}}>
          <TouchableOpacity style={styles.actionRow} onPress={handleSync} disabled={syncing}>
            <View style={styles.actionIcon}><Text style={{fontSize:18}}>☁️</Text></View>
            <View style={{flex:1}}>
              <Text style={styles.prefTitle}>
                {syncing ? 'Syncing...' : user ? 'Sync to cloud' : 'Sign in to sync'}
              </Text>
              <Text style={styles.prefSub}>
                {user ? `Signed in as ${user.email}` : 'Back up expenses across all your devices'}
              </Text>
            </View>
            <Text style={{color:Colors.text3,fontSize:16}}>→</Text>
          </TouchableOpacity>

          <Divider style={{marginHorizontal:Spacing.lg,marginVertical:0}}/>

          {!user ? (
            <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/login')}>
              <View style={styles.actionIcon}><Text style={{fontSize:18}}>👤</Text></View>
              <View style={{flex:1}}>
                <Text style={styles.prefTitle}>Create account / Sign in</Text>
                <Text style={styles.prefSub}>Sync expenses, never lose your data</Text>
              </View>
              <Text style={{color:Colors.text3,fontSize:16}}>→</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionRow} onPress={handleSignOut}>
              <View style={styles.actionIcon}><Text style={{fontSize:18}}>🚪</Text></View>
              <View style={{flex:1}}>
                <Text style={[styles.prefTitle, {color:Colors.red}]}>Sign out</Text>
                <Text style={styles.prefSub}>You'll need to sign in again to sync</Text>
              </View>
              <Text style={{color:Colors.text3,fontSize:16}}>→</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* DATA */}
        <Text style={styles.sectionLabel}>DATA</Text>
        <Card style={{gap:0,padding:0,overflow:'hidden'}}>
          <TouchableOpacity style={styles.actionRow} onPress={exportData}>
            <View style={styles.actionIcon}><Text style={{fontSize:18}}>📤</Text></View>
            <View style={{flex:1}}>
              <Text style={styles.prefTitle}>Export all data</Text>
              <Text style={styles.prefSub}>{expenses.length} expenses as CSV</Text>
            </View>
            <Text style={{color:Colors.text3,fontSize:16}}>→</Text>
          </TouchableOpacity>
        </Card>

        {/* ABOUT */}
        <View style={styles.about}>
          <Text style={styles.aboutName}>SpendSnap</Text>
          <Text style={styles.aboutVer}>v1.0.0</Text>
          <Text style={styles.aboutTag}>Capture. Track. Know.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.bg},
  topbar:{paddingHorizontal:Spacing.lg,paddingVertical:Spacing.md,borderBottomWidth:0.5,borderBottomColor:Colors.border},
  title:{fontSize:20,fontWeight:'800',color:Colors.text,letterSpacing:-0.3},
  scroll:{flex:1},
  content:{padding:Spacing.lg,paddingBottom:50,gap:Spacing.sm},
  sectionLabel:{fontSize:10,color:Colors.text3,textTransform:'uppercase',letterSpacing:1.2,fontWeight:'700',marginTop:Spacing.lg,marginBottom:Spacing.sm},
  avatar:{width:48,height:48,borderRadius:24,backgroundColor:Colors.surface2,borderWidth:1,borderColor:Colors.border2,alignItems:'center',justifyContent:'center'},
  avatarText:{fontSize:16,fontWeight:'700',color:Colors.accent},
  profileName:{fontSize:16,fontWeight:'700',color:Colors.text},
  profileSub:{fontSize:12,color:Colors.text3,marginTop:2},
  editBtn:{backgroundColor:Colors.surface2,borderRadius:Radius.sm,borderWidth:1,borderColor:Colors.border2,paddingHorizontal:14,paddingVertical:7},
  editBtnText:{fontSize:12,fontWeight:'600',color:Colors.accent},
  nameInput:{fontSize:16,fontWeight:'700',color:Colors.text,borderBottomWidth:1,borderBottomColor:Colors.accent,paddingBottom:2},
  input:{backgroundColor:Colors.surface2,borderRadius:Radius.sm,borderWidth:1,borderColor:Colors.border2,paddingHorizontal:12,paddingVertical:11,color:Colors.text,fontSize:14},
  currencyRow:{flexDirection:'row',alignItems:'center',gap:14,backgroundColor:Colors.surface,borderRadius:Radius.lg,borderWidth:0.5,borderColor:Colors.border2,padding:Spacing.lg,marginBottom:8},
  currencySymbolBig:{fontSize:24,color:Colors.accent,width:32,textAlign:'center',fontWeight:'600'},
  currencyName:{fontSize:14,fontWeight:'600',color:Colors.text},
  currencySub:{fontSize:11,color:Colors.text3},
  currencyOption:{flexDirection:'row',alignItems:'center',gap:12,padding:Spacing.lg},
  currencyOptionSym:{fontSize:16,width:28,textAlign:'center',color:Colors.text,fontWeight:'600'},
  currencyOptionName:{flex:1,fontSize:14,color:Colors.text},
  prefRow:{padding:Spacing.lg,gap:12},
  prefTitle:{fontSize:14,fontWeight:'600',color:Colors.text},
  prefSub:{fontSize:11,color:Colors.text3,marginTop:2},
  actionRow:{flexDirection:'row',alignItems:'center',gap:14,padding:Spacing.lg},
  actionIcon:{width:36,height:36,borderRadius:9,backgroundColor:Colors.surface2,alignItems:'center',justifyContent:'center'},
  about:{alignItems:'center',paddingVertical:32,gap:4},
  aboutName:{fontSize:17,fontWeight:'800',color:Colors.text2,letterSpacing:-0.3},
  aboutVer:{fontSize:12,color:Colors.text3},
  aboutTag:{fontSize:11,color:Colors.accent,marginTop:4,letterSpacing:0.5},
});
