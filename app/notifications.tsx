import FarmerBottomNav from '@/components/farmer-bottom-nav';
import { useSideMenu } from '@/components/SideMenu';
import { ThemedText } from '@/components/themed-text';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NOTIFICATIONS_API = `${API_CONFIG.BASE_URL}/notifications`;

export default function NotificationsScreen() {
  const { language } = useLanguage();
  const { open: openSideMenu } = useSideMenu();
  const { refresh: refreshBadge } = useNotifications();
  const [viewingNotification, setViewingNotification] = useState<any | null>(null);
  const [displayList, setDisplayList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setDisplayList([]);
        return;
      }
      const res = await fetch(NOTIFICATIONS_API, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      const data = json?.data ?? json?.notifications ?? (Array.isArray(json) ? json : []);
      const list = Array.isArray(data) ? data : (data?.list ?? data?.notifications ?? []);
      setDisplayList(list);
    } catch (e) {
      console.log('Notifications load error:', e);
      setDisplayList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleViewNotification = async (item: any) => {
    setViewingNotification(item);
    const id = item?.id;
    if (!id) return;
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      await fetch(`${API_CONFIG.BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      await loadNotifications();
      refreshBadge();
    } catch (e) {
      console.log('Mark read error:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      await fetch(`${API_CONFIG.BASE_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      await loadNotifications();
      refreshBadge();
    } catch (e) {
      console.log('Mark all read error:', e);
    }
  };

  const unreadCount = displayList.filter((n: any) => (n.readcount ?? n.read_count ?? 1) === 0).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.hamburger} onPress={() => openSideMenu()}>
          <Ionicons name="menu" size={20} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.topAppBarTitle}>
          {language === 'ta' ? 'அறிவிப்புகள்' : 'Notifications'}
        </ThemedText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadNotifications} colors={['#0f6b36']} />
        }
      >
        {loading && displayList.length === 0 ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator size="large" color="#0f6b36" />
            <ThemedText style={styles.emptyText}>
              {language === 'ta' ? 'பொறுத்துக்கொண்டும்...' : 'Loading...'}
            </ThemedText>
          </View>
        ) : displayList.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="notifications-off-outline" size={64} color="#94a3b8" />
            <ThemedText style={styles.emptyText}>
              {language === 'ta' ? 'அறிவிப்புகள் இல்லை' : 'No notifications'}
            </ThemedText>
          </View>
        ) : (
          <>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.markAllRow} onPress={handleMarkAllRead} activeOpacity={0.7}>
                <View style={styles.checkbox}>
                  <Ionicons name="checkbox-outline" size={20} color="#0f6b36" />
                </View>
                <ThemedText style={styles.markAllText}>
                  {language === 'ta' ? 'அனைத்தையும் படித்ததாகக் குறி' : 'Mark all read'}
                </ThemedText>
              </TouchableOpacity>
            )}
            {displayList.map((item: any, idx: number) => {
            const title = item.title ?? item.subject ?? item.message ?? item.notification_title ?? '';
            const body = item.body ?? item.message ?? item.description ?? item.content ?? '';
            const isUnread = (item.readcount ?? item.read_count ?? item.is_read ?? 1) === 0;
            return (
              <TouchableOpacity
                key={item.id ?? idx}
                style={[styles.card, isUnread && styles.cardUnread]}
                onPress={() => handleViewNotification(item)}
                activeOpacity={0.7}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.iconWrap, isUnread && styles.iconWrapUnread]}>
                    <Ionicons
                      name={item.icon ?? 'notifications'}
                      size={20}
                      color={isUnread ? '#0f6b36' : '#64748b'}
                    />
                  </View>
                  <View style={styles.cardBody}>
                    <ThemedText style={[styles.cardTitle, isUnread && styles.cardTitleUnread]} numberOfLines={1}>
                      {title || (language === 'ta' ? 'அறிவிப்பு' : 'Notification')}
                    </ThemedText>
                    <ThemedText style={styles.cardSubtitle} numberOfLines={2}>
                      {body || '-'}
                    </ThemedText>
                    {item.created_at && (
                      <ThemedText style={styles.cardDate}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </ThemedText>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            );
          })}
          </>
        )}
      </ScrollView>

      <FarmerBottomNav />

      {/* View notification modal */}
      <Modal
        visible={!!viewingNotification}
        transparent
        animationType="slide"
        onRequestClose={() => setViewingNotification(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setViewingNotification(null)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {language === 'ta' ? 'அறிவிப்பு' : 'Notification'}
              </ThemedText>
              <TouchableOpacity onPress={() => setViewingNotification(null)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {viewingNotification && (
                <>
                  <ThemedText style={styles.viewTitle}>
                    {viewingNotification.title ??
                      viewingNotification.subject ??
                      viewingNotification.notification_title ??
                      (language === 'ta' ? 'அறிவிப்பு' : 'Notification')}
                  </ThemedText>
                  <ThemedText style={styles.viewBody}>
                    {viewingNotification.body ??
                      viewingNotification.message ??
                      viewingNotification.description ??
                      viewingNotification.content ??
                      '-'}
                  </ThemedText>
                  {viewingNotification.created_at && (
                    <ThemedText style={styles.viewDate}>
                      {new Date(viewingNotification.created_at).toLocaleString()}
                    </ThemedText>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  topAppBar: {
    height: 56,
    backgroundColor: '#0f6b36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  hamburger: { width: 36, alignItems: 'center', justifyContent: 'center' },
  topAppBarTitle: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  content: { padding: 16, paddingBottom: 100 },
  markAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f6b36',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0f6b36',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  markAllText: { fontWeight: '600', fontSize: 15, color: '#0f6b36' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { marginTop: 12, fontSize: 16, color: '#64748b' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardUnread: { backgroundColor: '#dcfce7', borderLeftWidth: 4, borderLeftColor: '#0f6b36' },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapUnread: { backgroundColor: '#bbf7d0' },
  cardBody: { flex: 1 },
  cardTitle: { fontWeight: '600', fontSize: 15, color: '#0f172a' },
  cardTitleUnread: { color: '#0f6b36' },
  cardSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  cardSubtitleUnread: { color: '#166534', fontWeight: '500' },
  cardDate: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontWeight: '700', fontSize: 18 },
  modalBody: { padding: 16 },
  viewTitle: { fontWeight: '700', fontSize: 18, marginBottom: 12 },
  viewBody: { fontSize: 15, color: '#334155', lineHeight: 22 },
  viewDate: { fontSize: 12, color: '#94a3b8', marginTop: 16 },
});
