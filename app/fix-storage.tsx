import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FixStorage() {
  useEffect(() => {
    AsyncStorage.removeItem('ss_expenses').then(() => {
      router.replace('/splash');
    });
  }, []);
  return null;
}
