import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { NativeModules, Platform } from 'react-native';

const FCM_TOKEN_KEY = '@fcm_token';

// Lazy-load Firebase only when native module exists (avoids crash in Expo Go)
let _getApp: (() => any) | null = null;
let _messaging: (() => any) | null = null;
try {
  if (NativeModules.RNFBAppModule) {
    const firebaseApp = require('@react-native-firebase/app');
    const firebaseMessaging = require('@react-native-firebase/messaging');
    _getApp = firebaseApp.getApp;
    _messaging = () => firebaseMessaging.default;
  }
} catch {
  // Expo Go or Firebase not linked – FCM will be no-op
}

const getApp = (): any => {
  if (!_getApp) throw new Error('Firebase not available');
  return _getApp();
};
const messaging = (): any => {
  if (!_messaging) throw new Error('Firebase not available');
  return _messaging();
};

/** Returns Firebase messaging instance or null when running in Expo Go / without native Firebase */
export const getMessagingOrNull = (): (() => any) | null => _messaging;

export const isFirebaseAvailable = (): boolean => !!_getApp && !!_messaging;

// Check if Firebase is ready
let firebaseInitialized = false;

export const isFirebaseReady = (): boolean => {
  return isFirebaseAvailable() && firebaseInitialized;
};

// Helper function to ensure Firebase is ready before using messaging()
export const ensureFirebaseReady = async (): Promise<boolean> => {
  if (!isFirebaseAvailable()) return false;
  try {
    // If already initialized, verify it's still working
    if (firebaseInitialized) {
      try {
        const app = getApp();
        if (app) {
          return true;
        }
      } catch (e) {
        // App not accessible, need to re-initialize
        firebaseInitialized = false;
      }
    }
    
    // Initialize if not ready
    if (!firebaseInitialized) {
      await initializeFirebase();
    }
    
    // Verify Firebase is actually accessible
    for (let i = 0; i < 10; i++) {
      try {
        const app = getApp();
        if (app) {
          console.log(`[${Platform.OS}] ✅ Firebase verified and ready`);
          return true;
        }
      } catch (error: any) {
        const errorMsg = String(error?.message || error);
        if (!errorMsg.includes('No Firebase App')) {
          // Different error - might be ready
          return true;
        }
        if (i < 9) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
    
    console.warn(`[${Platform.OS}] ⚠️ Firebase not fully ready, but proceeding anyway`);
    return false;
  } catch (error) {
    console.error(`[${Platform.OS}] ❌ Error ensuring Firebase ready:`, error);
    return false;
  }
};

// Simplified helper to wait for native module - just check if it exists, don't verify apps
const waitForNativeModule = async (maxRetries = 10, retryDelay = 500): Promise<boolean> => {
  const moduleName = 'RNFBAppModule';
  
  for (let i = 0; i < maxRetries; i++) {
    if (NativeModules[moduleName]) {
      console.log(`[${Platform.OS}] ✅ Native module '${moduleName}' found (attempt ${i + 1})`);
      return true;
    }
    
    if (i < maxRetries - 1) {
      if (i % 3 === 0) { // Log every 3rd attempt
        console.log(`[${Platform.OS}] ⏳ Waiting for native module... (${i + 1}/${maxRetries})`);
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  console.warn(`[${Platform.OS}] ⚠️ Native module not found after ${maxRetries} attempts, but will try anyway`);
  return false;
};

export const initializeFirebase = async (): Promise<void> => {
  if (!isFirebaseAvailable()) return;
  if (firebaseInitialized) {
    // Double-check Firebase is still accessible
    try {
      const app = getApp();
      if (app) {
        return; // Already initialized and working
      }
    } catch (e) {
      // Firebase not accessible, need to re-initialize
      firebaseInitialized = false;
    }
  }
  
  try {
    console.log(`[${Platform.OS}] 🔥 Initializing Firebase...`);
    
    // For iOS, wait for native module
    if (Platform.OS === 'ios') {
      await waitForNativeModule(10, 500); // Max 5 seconds wait
      // Give React Native bridge a moment to sync
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // CRITICAL: Actually wait until Firebase is accessible
    // Don't mark as initialized until we can actually use it
    let success = false;
    const maxAttempts = Platform.OS === 'ios' ? 20 : 10; // More attempts for iOS
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const app = getApp();
        if (app) {
          // Verify we can actually access messaging
          try {
            const testMessaging = messaging();
            if (testMessaging) {
              success = true;
              console.log(`[${Platform.OS}] ✅ Firebase fully ready and accessible (attempt ${attempt + 1})`);
              break;
            }
          } catch (messagingError: any) {
            // Messaging not ready yet, continue waiting
            const msg = String(messagingError?.message || messagingError);
            if (!msg.includes('No Firebase App')) {
              // Different error - might be ready
              success = true;
              break;
            }
          }
        }
      } catch (error: any) {
        const errorMsg = String(error?.message || error);
        if (!errorMsg.includes('No Firebase App') && !errorMsg.includes('has been created')) {
          // Different error - might be ready, try messaging
          try {
            const testMessaging = messaging();
            if (testMessaging) {
              success = true;
              console.log(`[${Platform.OS}] ✅ Firebase accessible (attempt ${attempt + 1})`);
              break;
            }
          } catch (e) {
            // Not ready yet
          }
        }
        
        if (attempt < maxAttempts - 1) {
          if (attempt % 3 === 0) { // Log every 3rd attempt
            console.log(`[${Platform.OS}] ⏳ Waiting for Firebase to be ready... (${attempt + 1}/${maxAttempts})`);
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    if (!success) {
      console.error(`[${Platform.OS}] ❌ Firebase initialization failed - not accessible after ${maxAttempts} attempts`);
      throw new Error('Firebase not accessible');
    }
    
    // Only mark as initialized if we successfully verified it works
    firebaseInitialized = true;
    console.log(`[${Platform.OS}] ✅ Firebase initialization complete and verified`);
  } catch (error) {
    console.error(`[${Platform.OS}] ❌ Firebase initialization error:`, error);
    // Don't mark as initialized if it failed - allow retry
    firebaseInitialized = false;
    throw error; // Re-throw so caller knows it failed
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

// Helper function to verify Firebase messaging is actually accessible
const verifyFirebaseMessaging = async (maxRetries = 10, retryDelay = 500): Promise<boolean> => {
  // Wait briefly for native module
  await waitForNativeModule(5, 400);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // First check if app is available
      const app = getApp();
      if (!app) {
        throw new Error('Firebase app not available');
      }
      
      // Then verify messaging() is accessible
      // This is the actual check - if messaging() throws, Firebase isn't ready
      const messagingInstance = messaging();
      if (!messagingInstance) {
        throw new Error('Messaging instance not available');
      }
      
      console.log(`[${Platform.OS}] ✅ Firebase messaging verified (attempt ${i + 1})`);
      return true;
    } catch (error: any) {
      const errorMessage = String(error?.message || error);
      
      if (errorMessage.includes('No Firebase App') || 
          errorMessage.includes('has been created') ||
          errorMessage.includes('initializeApp')) {
        if (i < maxRetries - 1) {
          console.log(`[${Platform.OS}] ⏳ Waiting for Firebase bridge... (${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          console.warn(`[${Platform.OS}] ⚠️ Firebase messaging not accessible after ${maxRetries} attempts`);
          return false;
        }
      } else {
        // Different error - might mean Firebase is ready but something else is wrong
        console.warn(`[${Platform.OS}] ⚠️ Firebase verification error (non-initialization):`, errorMessage);
        // Return true anyway - might still work
        return true;
      }
    }
  }
  return false;
};

export const getFCMToken = async (retryCount = 0): Promise<string | null> => {
  if (!isFirebaseAvailable()) return null;
  try {
    console.log(`[${Platform.OS}] 🔥 Starting FCM token retrieval (attempt ${retryCount + 1})...`);
    
    // Check for existing token first
    const existingToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (existingToken) {
      console.log(`[${Platform.OS}] ✅ Using existing FCM token:`, existingToken.substring(0, 20) + '...');
      return existingToken;
    }
    
    // Initialize Firebase if not already done - this MUST succeed
    if (!isFirebaseReady()) {
      console.log(`[${Platform.OS}] 🔥 Initializing Firebase first...`);
      try {
        await initializeFirebase();
      } catch (initError) {
        console.error(`[${Platform.OS}] ❌ Firebase initialization failed:`, initError);
        // Will be handled by retry logic below
        throw initError;
      }
    }
    
    // Verify Firebase is actually ready before proceeding
    try {
      const app = getApp();
      if (!app) {
        throw new Error('Firebase app not accessible');
      }
      console.log(`[${Platform.OS}] ✅ Firebase app verified before token request`);
    } catch (verifyError: any) {
      const errorMsg = String(verifyError?.message || verifyError);
      if (errorMsg.includes('No Firebase App')) {
        // Reset and retry
        firebaseInitialized = false;
        if (retryCount < 3) {
          console.log(`[${Platform.OS}] ⚠️ Firebase not ready, will retry initialization...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return getFCMToken(retryCount + 1);
        }
        throw verifyError;
      }
    }
    
    // For iOS, do minimal setup and then try to get token directly
    if (Platform.OS === 'ios') {
      // Try to register for remote notifications (this helps with token generation)
      try {
        const isRegistered = messaging().isDeviceRegisteredForRemoteMessages;
        if (!isRegistered) {
          console.log(`[${Platform.OS}] 📱 Registering for remote messages...`);
          await messaging().registerDeviceForRemoteMessages();
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (iosError: any) {
        // Continue anyway - registration might not be critical
        console.log(`[${Platform.OS}] ⚠️ Remote message registration:`, iosError?.message || 'skipped');
      }
    }
    
    // For Android, check if Google Play Services is available
    if (Platform.OS === 'android') {
      const playServicesAvailable = await checkPlayServicesAvailability();
      if (!playServicesAvailable) {
        console.log(`[${Platform.OS}] ⚠️ Warning: Google Play Services may not be available`);
      }
      
      // Add delay for retries
      if (retryCount > 0) {
        const delayTime = retryCount * 2000;
        console.log(`[${Platform.OS}] ⏳ Adding delay before retry: ${delayTime}ms`);
        await new Promise(resolve => setTimeout(resolve, delayTime));
      }
    }
    
    // Request FCM token - this is the critical call
    console.log(`[${Platform.OS}] 🔑 Requesting FCM token from Firebase...`);
    
    try {
      const fcmToken = await messaging().getToken();
      
      if (fcmToken && fcmToken.length > 0) {
        console.log(`[${Platform.OS}] ✅ FCM token generated successfully!`);
        console.log(`[${Platform.OS}] Token preview:`, fcmToken.substring(0, 30) + '...');
        console.log(`[${Platform.OS}] Token length:`, fcmToken.length);
        
        // Save token for future use
        await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);
        return fcmToken;
      } else {
        console.error(`[${Platform.OS}] ❌ FCM token is empty or invalid`);
        throw new Error('FCM token is empty');
      }
    } catch (tokenError: any) {
      // Re-throw to be handled by outer catch block
      throw tokenError;
    }
  } catch (error: any) {
    const errorMessage = String(error?.message || error);

    // Check for Firebase initialization error - this is the main issue on iOS
    const isFirebaseInitError = errorMessage.includes('No Firebase App') || 
                                errorMessage.includes('has been created') ||
                                errorMessage.includes('initializeApp');

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
    
    // Handle Firebase initialization error - this is critical for iOS
    if (isFirebaseInitError) {
      console.warn(`[${Platform.OS}] ⚠️ Firebase initialization error detected - bridge may not be ready`);
      if (retryCount < 5) {
        // Use longer delays for iOS initialization issues
        const initDelay = Platform.OS === 'ios' ? 2000 + (retryCount * 1000) : 1000 + (retryCount * 500);
        console.log(`[${Platform.OS}] Waiting ${initDelay}ms for Firebase bridge to be ready...`);
        await new Promise(resolve => setTimeout(resolve, initDelay));
        
        // Reset the initialized flag to force re-initialization
        firebaseInitialized = false;
        return getFCMToken(retryCount + 1);
      } else {
        console.error(`[${Platform.OS}] ❌ Firebase initialization failed after ${retryCount} attempts`);
        return null;
      }
    } else if (isAPNSTokenError) {
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
    if (Platform.OS === 'ios') {
      // For iOS, use expo-notifications to request permissions first
      // This works independently of Firebase and is more reliable
      console.log(`[${Platform.OS}] 🔔 Requesting notification permissions via expo-notifications...`);
      
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        const granted = finalStatus === 'granted';
        console.log(`[${Platform.OS}] ✅ Expo notification permission status:`, finalStatus, `(granted: ${granted})`);
        
        if (granted) {
          // Also request Firebase permissions (for FCM token)
          // But don't fail if Firebase isn't ready yet
          try {
            // Wait a bit for Firebase bridge to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try to also request Firebase permissions (optional, for FCM)
            try {
              const firebaseAuthStatus = await messaging().requestPermission();
              const firebaseEnabled =
                firebaseAuthStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                firebaseAuthStatus === messaging.AuthorizationStatus.PROVISIONAL;
              console.log(`[${Platform.OS}] ✅ Firebase notification permission:`, firebaseAuthStatus, `(granted: ${firebaseEnabled})`);
            } catch (firebaseError: any) {
              // Firebase might not be ready, but expo permissions are granted
              console.warn(`[${Platform.OS}] ⚠️ Firebase permission request failed (but expo permissions granted):`, firebaseError?.message);
              // Continue - expo permissions are enough for now
            }
          } catch (e) {
            // Ignore Firebase errors - expo permissions are granted
            console.warn(`[${Platform.OS}] ⚠️ Firebase permission check failed, but expo permissions are granted`);
          }
        }
        
        return granted;
      } catch (expoError: any) {
        console.error(`[${Platform.OS}] ❌ Error requesting expo notification permissions:`, expoError?.message || expoError);
        return false;
      }
    } else if (Platform.OS === 'android') {
      if (!isFirebaseAvailable()) return true;
      // For Android, use Firebase messaging to request permissions
      // Ensure Firebase is initialized first
      if (!isFirebaseReady()) {
        console.log(`[${Platform.OS}] 🔥 Firebase not ready, initializing...`);
        await initializeFirebase();
      }
      
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      console.log(`[${Platform.OS}] Notification permission status:`, authStatus);
      return enabled;
    }
    
    return true;
  } catch (error: any) {
    console.error(`[${Platform.OS}] Error requesting notification permissions:`, error);
    console.error(`[${Platform.OS}] Error details:`, error?.message || error);
    // Return false instead of throwing - don't block the app
    return false;
  }
};

// Background message handler for FCM
// This handles notifications when the app is in the background or terminated
export const registerBackgroundMessageHandler = () => {
  if (!isFirebaseAvailable()) return;
  try {
    // Check if Firebase is initialized before registering handler
    const app = getApp();
    if (!app) {
      console.warn('[FCM] Firebase not initialized - background handler registration deferred');
      // Try again after a delay
      setTimeout(() => {
        try {
          const retryApp = getApp();
          if (retryApp) {
            messaging().setBackgroundMessageHandler(async remoteMessage => {
              console.log('[Background] Message handled:', remoteMessage);
              
              if (remoteMessage?.notification) {
                console.log('[Background] Notification title:', remoteMessage.notification.title);
                console.log('[Background] Notification body:', remoteMessage.notification.body);
              }
              
              if (remoteMessage?.data) {
                console.log('[Background] Notification data:', remoteMessage.data);
              }
            });
            console.log('[FCM] Background message handler registered (retry)');
          }
        } catch (retryError) {
          console.warn('[FCM] Background handler registration failed on retry:', retryError);
        }
      }, 2000);
      return;
    }
    
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('[Background] Message handled:', remoteMessage);
      
      if (remoteMessage?.notification) {
        console.log('[Background] Notification title:', remoteMessage.notification.title);
        console.log('[Background] Notification body:', remoteMessage.notification.body);
      }
      
      if (remoteMessage?.data) {
        console.log('[Background] Notification data:', remoteMessage.data);
      }
    });
    
    console.log('[FCM] ✅ Background message handler registered');
  } catch (error) {
    console.warn('[FCM] ⚠️ Background handler registration failed:', error);
    // Don't throw - this is not critical for app startup
  }
};
