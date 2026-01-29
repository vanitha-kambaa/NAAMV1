import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function FarmerBottomNav() {
  const { language } = useLanguage();
  const segments = useSegments();
  const segs = segments as unknown as string[];

  const isActive = (tab: 'home' | 'prices' | 'leader' | 'profile') => {
    // Basic segment matching to determine active tab
    if (tab === 'home') return segs.includes('dashboard') || segs.includes('dashboard-farmer') || segs.length === 0;
    if (tab === 'prices') return segs.includes('price-history') || segs.includes('prices');
    if (tab === 'leader') return segs.includes('investor-farmers') || segs.includes('leader');
    if (tab === 'profile') return segs.includes('profile') || segs.includes('me');
    return false;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item} onPress={() => router.push('/dashboard-farmer' as any)}>
        <Ionicons name="home-outline" size={22} color={isActive('home') ? '#10B981' : '#718096'} />
        <ThemedText style={[styles.label, isActive('home') && styles.labelActive]}>{language === 'ta' ? 'முகப்பு' : 'Home'}</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => router.push('/harvest' as any)}>
        <Ionicons name="trending-up-outline" size={22} color={isActive('prices') ? '#10B981' : '#718096'} />
        <ThemedText style={[styles.label, isActive('prices') && styles.labelActive]}>{language === 'ta' ? 'அறுவடை' : 'Harvest'}</ThemedText>
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
  container: { flexDirection: 'row', paddingTop: 12, paddingBottom: 20, paddingHorizontal: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 8, justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#ffffff' },
  item: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  label: { fontSize: 12, fontWeight: '500', marginTop: 4, color: '#718096' },
  labelActive: { color: '#10B981' },
});