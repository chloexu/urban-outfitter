import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/tokens';
import { getToken, setToken } from '../lib/storage';

export default function RootLayout() {
  useEffect(() => {
    // Seed dev token on first launch if not already stored
    const devToken = process.env.EXPO_PUBLIC_DEV_TOKEN;
    if (devToken) {
      getToken().then((existing) => {
        if (!existing) setToken(devToken);
      });
    }
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }} />
    </SafeAreaProvider>
  );
}
