import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import 'react-native-reanimated';

import { SideMenuProvider } from '@/components/SideMenu';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { registerBackgroundMessageHandler } from '@/services/fcm';
import { Platform } from 'react-native';

// Register FCM background message handler (must be at top level, outside components)
if (Platform.OS !== 'web') {
  try {
    registerBackgroundMessageHandler();
  } catch (error) {
    // Firebase might not be ready yet, but this is safe to ignore
    // The handler will be registered when Firebase initializes
    console.log('Background message handler registration deferred:', error);
  }
}

// Suppress known benign expo-keep-awake errors (camera/location on web or certain device states)
LogBox.ignoreLogs(['Unable to activate keep awake', 'Unable to deactivate keep awake']);

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LanguageProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SideMenuProvider>
          <NotificationProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
          </Stack>
          </NotificationProvider>
        </SideMenuProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </LanguageProvider>
  );
}
