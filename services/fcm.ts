import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

const FCM_TOKEN_KEY = '@fcm_token';

// Check if Firebase is ready
let firebaseInitialized = false;

export const isFirebaseReady = (): boolean => {
  return firebaseInitialized;
};

export const initializeFirebase = async (): Promise<void> => {
  try {
    // Firebase is auto-initialized from google-services.json and GoogleService-Info.plist
    // Just mark as initialized
    firebaseInitialized = true;
    console.log('Firebase initialized');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

// Check Google Play Services availability (Android only)
const checkPlayServicesAvailability = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  
  try {
    // Firebase automatically checks Play Services
    // If it's not available, getToken() will throw an error
    return true;
  } catch (error) {
    console.warn('Google Play Services check failed:', error);
    return false;
  }
};

export const getFCMToken = async (retryCount = 0): Promise<string | null> => {
  try {
    console.log(`[${Platform.OS}] Starting FCM token retrieval...`);
    
    // Initialize Firebase if not already done
    if (!isFirebaseReady()) {
      console.log(`[${Platform.OS}] Initializing Firebase first...`);
      await initializeFirebase();
      
      // Wait a moment to ensure initialization is complete
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // For Android, check if Google Play Services is available
    if (Platform.OS === 'android') {
      const playServicesAvailable = await checkPlayServicesAvailability();
      if (!playServicesAvailable) {
        console.log(`[${Platform.OS}] Warning: Google Play Services may not be available`);
      }
    }
    
    // For iOS, make sure we're registered for remote notifications
    if (Platform.OS === 'ios') {
      try {
        const isRegistered = messaging().isDeviceRegisteredForRemoteMessages;
        if (!isRegistered) {
          console.log(`[${Platform.OS}] Registering iOS device for remote messages`);
          await messaging().registerDeviceForRemoteMessages();
          // Wait a bit after registration
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (iosError: any) {
        console.log(`[${Platform.OS}] iOS remote message registration check:`, iosError?.message || iosError);
        // Continue anyway - registration might not be needed in all cases
      }
    }
    
    // Check for existing token
    const existingToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (existingToken) {
      console.log(`[${Platform.OS}] Using existing FCM token:`, existingToken.substring(0, 20) + '...');
      return existingToken;
    }
    
    // For Android, check if we need to wait before requesting token
    // This helps with the SERVICE_NOT_AVAILABLE error
    if (Platform.OS === 'android' && retryCount > 0) {
      const delayTime = retryCount * 2000; // Exponential backoff
      console.log(`[${Platform.OS}] Adding delay before retry: ${delayTime}ms`);
      await new Promise(resolve => setTimeout(resolve, delayTime));
    }
    
    // Request a new FCM token directly
    console.log(`[${Platform.OS}] Requesting new FCM token...`);
    const fcmToken = await messaging().getToken();
    
    if (fcmToken) {
      console.log(`[${Platform.OS}] ✅ New FCM token generated:`, fcmToken.substring(0, 20) + '...');
      await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);
      return fcmToken;
    } else {
      console.error(`[${Platform.OS}] Failed to get FCM token - empty result`);
      
      // Retry logic
      if (retryCount < 3) {
        console.log(`[${Platform.OS}] Retrying FCM token retrieval (attempt ${retryCount + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return getFCMToken(retryCount + 1);
      }
      
      return null;
    }
  } catch (error: any) {
    const errorMessage = String(error);

    // Check for specific iOS APNS token error that's safe to suppress
    const isAPNSTokenError = Platform.OS === 'ios' &&
      (errorMessage.includes('No APNS token specified before fetching FCM Token') ||
       errorMessage.includes('The operation couldn\'t be completed. No APNS token specified'));

    // Check for specific SERVICE_NOT_AVAILABLE error
    const isServiceUnavailable = errorMessage.includes('SERVICE_NOT_AVAILABLE');

    // Only log error if it's not the common APNS token issue
    if (!isAPNSTokenError) {
      console.error(`[${Platform.OS}] FCM token error:`, error);
      console.error(`[${Platform.OS}] Error message:`, errorMessage);
    } else {
      // Silently handle APNS token error - this is expected in development
      console.log(`[${Platform.OS}] FCM token not available yet (APNS token pending) - will retry`);
    }
    
    if (isAPNSTokenError) {
      // For APNS token errors, use shorter delays and more retries since this often resolves quickly
      if (retryCount < 5) {
        const apnsDelay = 1000 + (retryCount * 500); // Shorter delays for APNS issues
        console.log(`[${Platform.OS}] Waiting ${apnsDelay}ms for APNS token to become available...`);
        await new Promise(resolve => setTimeout(resolve, apnsDelay));
        return getFCMToken(retryCount + 1);
      }
    } else if (isServiceUnavailable) {
      console.log(`[${Platform.OS}] Detected SERVICE_NOT_AVAILABLE error - this usually means Google Play Services connectivity issue`);

      // Use longer delay for this specific error
      const serviceUnavailableDelay = 5000 + (retryCount * 2000);
      console.log(`[${Platform.OS}] Waiting ${serviceUnavailableDelay}ms before retrying...`);
      await new Promise(resolve => setTimeout(resolve, serviceUnavailableDelay));

      // Retry with increased backoff for SERVICE_NOT_AVAILABLE
      if (retryCount < 5) {
        console.log(`[${Platform.OS}] Special SERVICE_NOT_AVAILABLE retry (attempt ${retryCount + 1})...`);
        return getFCMToken(retryCount + 1);
      }
    } else {
      // Regular retry logic for other errors
      if (retryCount < 3) {
        console.log(`[${Platform.OS}] Retrying FCM token retrieval after error (attempt ${retryCount + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return getFCMToken(retryCount + 1);
      }
    }
    
    return null;
  }
};

// Request notification permissions (needed for FCM)
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      // Android 13+ requires runtime permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      console.log(`[${Platform.OS}] Notification permission status:`, authStatus);
      return enabled;
    } else if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      console.log(`[${Platform.OS}] Notification permission status:`, authStatus);
      return enabled;
    }
    return true;
  } catch (error) {
    console.error(`[${Platform.OS}] Error requesting notification permissions:`, error);
    return false;
  }
};

// Background message handler for FCM
// This handles notifications when the app is in the background or terminated
export const registerBackgroundMessageHandler = () => {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('[Background] Message handled:', remoteMessage);
    
    // You can process the notification here
    // For example, update local storage, show a local notification, etc.
    if (remoteMessage?.notification) {
      console.log('[Background] Notification title:', remoteMessage.notification.title);
      console.log('[Background] Notification body:', remoteMessage.notification.body);
    }
    
    if (remoteMessage?.data) {
      console.log('[Background] Notification data:', remoteMessage.data);
    }
  });
  
  console.log('[FCM] Background message handler registered');
};
