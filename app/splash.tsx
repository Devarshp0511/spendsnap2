import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const strip1 = useRef(new Animated.Value(-height)).current;
  const strip2 = useRef(new Animated.Value(-height)).current;
  const strip3 = useRef(new Animated.Value(-height)).current;
  const strip4 = useRef(new Animated.Value(-height)).current;
  const strip5 = useRef(new Animated.Value(-height)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.8)).current;
  const fadeOut     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(strip1, { toValue:0, useNativeDriver:true, tension:60, friction:8 }),
      Animated.spring(strip2, { toValue:0, useNativeDriver:true, tension:60, friction:8 }),
      Animated.spring(strip3, { toValue:0, useNativeDriver:true, tension:60, friction:8 }),
      Animated.spring(strip4, { toValue:0, useNativeDriver:true, tension:60, friction:8 }),
      Animated.spring(strip5, { toValue:0, useNativeDriver:true, tension:60, friction:8 }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue:1, duration:400, useNativeDriver:true }),
        Animated.spring(logoScale,   { toValue:1, useNativeDriver:true, tension:80, friction:6 }),
      ]).start();
    }, 500);

    setTimeout(async () => {
      Animated.timing(fadeOut, { toValue:0, duration:400, useNativeDriver:true }).start(async () => {
        try {
          // Check if logged in
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            router.replace('/(tabs)');
            return;
          }
          // Check onboarding
          const hasOnboarded = await AsyncStorage.getItem('ss_onboarded');
          if (hasOnboarded) {
            router.replace('/login');
          } else {
            await AsyncStorage.setItem('ss_onboarded', 'true');
            router.replace('/onboarding');
          }
        } catch {
          router.replace('/(tabs)');
        }
      });
    }, 2600);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <Animated.View style={[styles.strip, { backgroundColor:'#00C896', left:width*0.00, width:width*0.22, transform:[{translateY:strip1}] }]}/>
      <Animated.View style={[styles.strip, { backgroundColor:'#00A87A', left:width*0.20, width:width*0.18, transform:[{translateY:strip2}] }]}/>
      <Animated.View style={[styles.strip, { backgroundColor:'#007A5A', left:width*0.36, width:width*0.24, transform:[{translateY:strip3}] }]}/>
      <Animated.View style={[styles.strip, { backgroundColor:'#004A35', left:width*0.58, width:width*0.20, transform:[{translateY:strip4}] }]}/>
      <Animated.View style={[styles.strip, { backgroundColor:'#002A1F', left:width*0.76, width:width*0.24, transform:[{translateY:strip5}] }]}/>
      <Animated.View style={[styles.logoWrap, { opacity:logoOpacity, transform:[{scale:logoScale}] }]}>
        <View style={styles.logoMark}>
          <Text style={styles.logoIcon}>⚡</Text>
        </View>
        <Text style={styles.logoText}>SpendSnap</Text>
        <View style={styles.tagWrap}>
          <Text style={styles.tagDot}>·</Text>
          <Text style={styles.logoTag}>Capture</Text>
          <Text style={styles.tagDot}>·</Text>
          <Text style={styles.logoTag}>Track</Text>
          <Text style={styles.tagDot}>·</Text>
          <Text style={styles.logoTag}>Know</Text>
          <Text style={styles.tagDot}>·</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#000000', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  strip: { position:'absolute', bottom:0, height:'100%', opacity:0.9 },
  logoWrap: { alignItems:'center', gap:14, zIndex:10 },
  logoMark: {
    width:76, height:76, borderRadius:24,
    backgroundColor:'#000000',
    alignItems:'center', justifyContent:'center',
    shadowColor:'#000', shadowOffset:{width:0,height:8},
    shadowOpacity:0.4, shadowRadius:20, elevation:16,
  },
  logoIcon: { fontSize:38 },
  logoText: { fontSize:30, fontWeight:'800', color:'#FFFFFF', letterSpacing:-0.5,
    textShadowColor:'rgba(0,0,0,0.4)', textShadowOffset:{width:0,height:2}, textShadowRadius:8 },
  tagWrap: { flexDirection:'row', alignItems:'center', gap:6,
    backgroundColor:'rgba(0,0,0,0.35)', paddingHorizontal:16, paddingVertical:7, borderRadius:999 },
  logoTag: { fontSize:12, color:'#FFFFFF', fontWeight:'700', letterSpacing:1.5, textTransform:'uppercase' },
  tagDot: { fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:'700' },
});
