import { API_CONFIG } from '@/config/api';
import { getFCMToken, requestNotificationPermissions } from '@/services/fcm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type NotificationContextValue = {
  unreadCount: number;
  notifications: any[];
  loading: boolean;
  refresh: () => Promise<void>;
  fcmToken: string | null;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

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

  // Register for push notifications and get FCM token
  useEffect(() => {
    let unsubscribeForeground: (() => void) | undefined;
    let unsubscribeTokenRefresh: (() => void) | undefined;
    let unsubscribeOpenedApp: (() => void) | undefined;

    const setupFCM = async () => {
      try {
        // Configure notification handler for expo-notifications
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        // Request permissions
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          console.log('Notification permission not granted');
          return;
        }

        // Get FCM token
        const token = await getFCMToken();
        if (token) {
          console.log('✅ FCM token retrieved in NotificationContext');
          setFcmToken(token);
          sendTokenToBackend(token);
        }

        // Listen for foreground messages
        unsubscribeForeground = messaging().onMessage(async remoteMessage => {
          console.log('FCM message received in foreground: Subbu ', remoteMessage);
          
          // Show local notification when app is in foreground
          let notificationTitle = 'New Notification';
          let notificationBody = 'You have a new notification';
          
          // Extract title and body from notification object or data payload
          if (remoteMessage?.notification) {
            notificationTitle = String(remoteMessage.notification.title || notificationTitle);
            notificationBody = String(remoteMessage.notification.body || notificationBody);
          } else if (remoteMessage?.data) {
            // Fallback to data payload if notification object is not present
            const dataTitle = remoteMessage.data.title || remoteMessage.data.notification_title;
            const dataBody = remoteMessage.data.body || remoteMessage.data.message || remoteMessage.data.notification_body;
            notificationTitle = dataTitle ? String(dataTitle) : notificationTitle;
            notificationBody = dataBody ? String(dataBody) : notificationBody;
          }
          
          try {
            // Display the notification using expo-notifications
            await Notifications.scheduleNotificationAsync({
              content: {
                title: notificationTitle,
                body: notificationBody,
                data: remoteMessage.data || {},
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: null, // Show immediately
            });
            
            console.log('✅ Local notification displayed:', { title: notificationTitle, body: notificationBody });
          } catch (error) {
            console.error('Error displaying local notification:', error);
          }
          
          // Refresh notifications when a new one arrives
          fetchNotifications();
        });

        // Handle notification when app is opened from background/quit state
        unsubscribeOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
          console.log('Notification opened app from background:Subbu ', remoteMessage);
          fetchNotifications();
        });

        // Check if app was opened from a notification (app was quit)
        messaging()
          .getInitialNotification()
          .then(remoteMessage => {
            if (remoteMessage) {
              console.log('Notification opened app from quit state:', remoteMessage);
              fetchNotifications();
            }
          });

        // Listen for token refresh
        unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
          console.log('FCM token refreshed:', token);
          setFcmToken(token);
          sendTokenToBackend(token);
        });
      } catch (error) {
        console.error('Error setting up FCM:', error);
      }
    };

    setupFCM();

    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
      if (unsubscribeTokenRefresh) unsubscribeTokenRefresh();
      if (unsubscribeOpenedApp) unsubscribeOpenedApp();
    };
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const sendTokenToBackend = async (token: string) => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) return;

      await fetch(`${API_CONFIG.BASE_URL}/users/register-device-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          device_token: token,
          platform: Platform.OS,
        }),
      });
      console.log('Device token sent to backend');
    } catch (error) {
      console.error('Error sending device token:', error);
    }
  };

  const value: NotificationContextValue = {
    unreadCount,
    notifications,
    loading,
    refresh: fetchNotifications,
    fcmToken,
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
