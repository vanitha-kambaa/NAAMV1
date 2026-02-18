import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the bottom nav bar (without safe area). Use for content paddingBottom when nav is fixed. */
export const FARMER_BOTTOM_NAV_BAR_HEIGHT = 72;

export default function FarmerBottomNav() {
  const { language } = useLanguage();
  const pathname = usePathname() ?? '';
  const insets = useSafeAreaInsets();

  const path = pathname != null ? '/' + String(pathname).replace(/^\/+|\/+$/g, '') : '';
  const isActive = (tab: 'home' | 'harvest' | 'leader' | 'profile') => {
    if (tab === 'home') return path === '/dashboard-farmer' || path === '' || path === '/';
    if (tab === 'harvest') return path === '/harvest' || path.startsWith('/harvest/') || path === '/price-history' || path.startsWith('/price-history/');
    if (tab === 'leader') return path === '/investor-farmers' || path.startsWith('/investor-farmers/');
    if (tab === 'profile') return path === '/profile' || path.startsWith('/profile/') || path === '/me' || path.startsWith('/me/');
    return false;
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(12, insets.bottom) }]}>
      <TouchableOpacity style={styles.item} onPress={() => router.push('/dashboard-farmer' as any)}>
        <Ionicons name="home-outline" size={22} color={isActive('home') ? '#10B981' : '#718096'} />
        <ThemedText style={[styles.label, isActive('home') && styles.labelActive]}>{language === 'ta' ? 'முகப்பு' : 'Home'}</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => router.push('/harvest' as any)}>
        <Ionicons name="trending-up-outline" size={22} color={isActive('harvest') ? '#10B981' : '#718096'} />
        <ThemedText style={[styles.label, isActive('harvest') && styles.labelActive]}>{language === 'ta' ? 'அறுவடை' : 'Harvest'}</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => router.push('/investor-farmers' as any)}>
        <Ionicons name="person-outline" size={22} color={isActive('leader') ? '#10B981' : '#718096'} />
        <ThemedText style={[styles.label, isActive('leader') && styles.labelActive]}>{language === 'ta' ? 'தலைமை' : 'Leaders'}</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => router.push('/profile' as any)}>
        <Ionicons name="person-circle-outline" size={22} color={isActive('profile') ? '#10B981' : '#718096'} />
        <ThemedText style={[styles.label, isActive('profile') && styles.labelActive]}>{language === 'ta' ? 'சுயவிவரம்' : 'Profile'}</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', paddingTop: 12, paddingHorizontal: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 8, justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#ffffff' },
  item: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  label: { fontSize: 12, fontWeight: '500', marginTop: 4, color: '#718096' },
  labelActive: { color: '#10B981' },
});