import { API_CONFIG } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type NotificationContextValue = {
  unreadCount: number;
  notifications: any[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setUnreadCount(0);
        setNotifications([]);
        return;
      }
      const res = await fetch(`${API_CONFIG.BASE_URL}/notifications/unread`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      const data = json?.data ?? json?.notifications ?? (Array.isArray(json) ? json : []);
      const list = Array.isArray(data) ? data : (data?.list ?? data?.notifications ?? []);
      setNotifications(list);

      // Unread count: filter array by readcount === 0
      const count = list.filter((n: any) => (n.readcount ?? n.read_count ?? 1) === 0).length;
      setUnreadCount(count);
    } catch (e) {
      console.log('Notification fetch error:', e);
      setUnreadCount(0);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const value: NotificationContextValue = {
    unreadCount,
    notifications,
    loading,
    refresh: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
