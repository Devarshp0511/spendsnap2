import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';

function TabIcon({ focused, label, icon }: { focused: boolean; label: string; icon: string }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown:false, tabBarStyle:styles.tabBar, tabBarShowLabel:false }}>
      <Tabs.Screen name="index"           options={{ tabBarIcon:({focused})=><TabIcon focused={focused} icon="⊞" label="Home"/> }}/>
      <Tabs.Screen name="reports"         options={{ tabBarIcon:({focused})=><TabIcon focused={focused} icon="↗" label="Reports"/> }}/>
      <Tabs.Screen name="add-placeholder" options={{
        tabBarIcon:()=><View style={styles.fab}><Text style={styles.fabIcon}>+</Text></View>,
        tabBarButton:(props)=><TouchableOpacity {...props} onPress={()=>router.push('/add')} style={styles.fabWrap}/>,
      }}/>
      <Tabs.Screen name="ai"       options={{ tabBarIcon:({focused})=><TabIcon focused={focused} icon="✦" label="Ask AI"/> }}/>
      <Tabs.Screen name="settings" options={{ tabBarIcon:({focused})=><TabIcon focused={focused} icon="○" label="Settings"/> }}/>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar:{
    backgroundColor:'#111111',
    borderTopColor:'rgba(255,255,255,0.08)',
    borderTopWidth:0.5,
    height:88, paddingBottom:16, paddingTop:10,
  },
  tabIcon:{ alignItems:'center', justifyContent:'center', gap:4, width:60 },
  tabEmoji:{ fontSize:18, color:'#444444' },
  tabEmojiActive:{ color:Colors.accent },
  tabLabel:{ fontSize:10, color:'#444444', fontWeight:'500' },
  tabLabelActive:{ color:Colors.accent, fontWeight:'700' },
  fab:{
    width:52, height:52, borderRadius:18,
    backgroundColor:Colors.accent,
    alignItems:'center', justifyContent:'center',
    shadowColor:Colors.accent,
    shadowOffset:{width:0,height:4},
    shadowOpacity:0.4, shadowRadius:12, elevation:8,
  },
  fabIcon:{ fontSize:28, color:'#000000', fontWeight:'400', lineHeight:32 },
  fabWrap:{ flex:1, alignItems:'center', justifyContent:'center' },
});
