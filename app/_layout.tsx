import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import FarmerBottomNav, { FARMER_BOTTOM_NAV_BAR_HEIGHT } from '@/components/farmer-bottom-nav';
import { SideMenuProvider } from '@/components/SideMenu';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { registerBackgroundMessageHandler } from '@/services/fcm';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { LogBox } from 'react-native';
import 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

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

const FARMER_ROUTES = [
  '/dashboard-farmer',
  '/harvest',
  '/profile',
  '/investor-farmers',
  '/price-history',
  '/notifications',
  '/events/',
  '/ads/',
  '/dashboard/dashboard',
  '/dashboard',
];

function isFarmerRoute(pathname: string | null): boolean {
  if (!pathname || typeof pathname !== 'string') return false;
  const path = '/' + String(pathname).replace(/^\/+|\/+$/g, '') || '/';
  if (path === '/' || path === '') return false;
  return FARMER_ROUTES.some((r) => path === r || path.startsWith(r));
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LanguageProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SideMenuProvider>
          <NotificationProvider>
            <RootLayoutNav />
          </NotificationProvider>
        </SideMenuProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </LanguageProvider>
  );
}

function RootLayoutNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const showFarmerNav = isFarmerRoute(pathname);
  const bottomPadding = showFarmerNav ? FARMER_BOTTOM_NAV_BAR_HEIGHT + insets.bottom : 0;

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          contentStyle: showFarmerNav ? { paddingBottom: bottomPadding } : undefined,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
      </Stack>
      {showFarmerNav && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <FarmerBottomNav />
        </View>
      )}
    </View>
  );
}
