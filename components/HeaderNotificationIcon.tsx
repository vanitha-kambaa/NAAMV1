import { useNotifications } from '@/contexts/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function HeaderNotificationIcon() {
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={() => router.push('/notifications' as any)}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={22} color="#ffffff" />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
});
