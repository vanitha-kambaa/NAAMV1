import Expo
import React
import ReactAppDependencyProvider
import FirebaseCore
import FirebaseMessaging
import UserNotifications

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Initialize Firebase BEFORE React Native starts, but AFTER super.application()
    // This ensures Expo is initialized first, then Firebase, then React Native
    let result = super.application(application, didFinishLaunchingWithOptions: launchOptions)
    
    // Setup Firebase after super but before React Native starts
    setupFirebase(application: application)
    
    // Set up React Native
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return result
  }
  
  private func setupFirebase(application: UIApplication) {
    print("🔥 [Firebase] Starting Firebase setup...")
    
    // Check if Firebase is already configured
    if let existingApp = FirebaseApp.app() {
      print("✅ [Firebase] Firebase already configured: \(existingApp.name)")
      // Still set up delegates even if already configured
      setupFirebaseDelegates(application: application)
      return
    }
    
    // Check if GoogleService-Info.plist exists
    guard let plistPath = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") else {
      print("❌ [Firebase] GoogleService-Info.plist not found in Bundle.main")
      print("   [Firebase] Make sure GoogleService-Info.plist is added to the Xcode project")
      print("   [Firebase] and included in the app target's Copy Bundle Resources")
      return
    }
    
    print("✅ [Firebase] GoogleService-Info.plist found at: \(plistPath)")
    
    // Initialize Firebase - this must be called before any Firebase operations
    do {
      FirebaseApp.configure()
      print("✅ [Firebase] FirebaseApp.configure() called successfully")
    } catch {
      print("❌ [Firebase] Error calling FirebaseApp.configure(): \(error)")
      return
    }
    
    // Verify Firebase is initialized
    guard let app = FirebaseApp.app() else {
      print("❌ [Firebase] Firebase app instance is nil after configuration")
      print("   [Firebase] This should not happen - Firebase may not be properly linked")
      return
    }
    
    print("✅ [Firebase] Firebase app instance verified: \(app.name)")
    print("✅ [Firebase] Project ID: \(app.options.projectID ?? "unknown")")
    print("✅ [Firebase] Firebase is ready for JavaScript to use")
    
    // Set up delegates
    setupFirebaseDelegates(application: application)
    
    print("🔥 [Firebase] Firebase setup complete!")
  }
  
  private func setupFirebaseDelegates(application: UIApplication) {
    // Set messaging delegate
    Messaging.messaging().delegate = self
    print("✅ [Firebase] Messaging delegate set")
    
    // Set up notification center delegate
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self
      print("✅ [Firebase] Notification center delegate set")
    }
    
    // Register for remote notifications
    application.registerForRemoteNotifications()
    print("✅ [Firebase] Registered for remote notifications")
  }
  
  // Handle APNS token registration
  public override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    // Only set APNS token if Firebase is configured
    if FirebaseApp.app() != nil {
      Messaging.messaging().apnsToken = deviceToken
      print("✅ APNS token set for Firebase")
    }
  }
  
  // Handle APNS token registration failure
  public override func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("⚠️ Failed to register for remote notifications: \(error)")
  }

  // Linking API - Expo handles this through super.application()
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options)
  }

  // Universal Links - Expo handles this through super.application()
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
    let bundleProvider = RCTBundleURLProvider.sharedSettings()
    
    // Try the standard Expo entry point first
    if let metroURL = bundleProvider.jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry") {
      print("✅ Using Metro bundler URL: \(metroURL.absoluteString)")
      return metroURL
    }
    
    // Try alternative entry points
    if let altURL = bundleProvider.jsBundleURL(forBundleRoot: "index") {
      print("✅ Using alternative Metro URL: \(altURL.absoluteString)")
      return altURL
    }
    
    // Fallback to embedded bundle if Metro is not available
    if let embeddedBundle = Bundle.main.url(forResource: "main", withExtension: "jsbundle") {
      print("✅ Using embedded bundle")
      return embeddedBundle
    }
    
    // Last resort: Check if we're in Debug mode and Metro should be running
    #if DEBUG
    print("❌ DEBUG mode: No Metro bundler found and no embedded bundle")
    print("   Solution 1: Start Metro and restart app")
    print("     Run: npx expo start")
    print("   Solution 2: Rebuild with Metro")
    print("     Run: npx expo run:ios --device")
    #else
    print("❌ RELEASE mode: No embedded bundle found")
    print("   Rebuild with embedded bundle:")
    print("     Run: npx expo run:ios --device --configuration Release")
    #endif
    
    return nil
  }
}

// MARK: - MessagingDelegate
extension AppDelegate: MessagingDelegate {
  public func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    print("Firebase registration token: \(String(describing: fcmToken))")
    let dataDict: [String: String] = ["token": fcmToken ?? ""]
    NotificationCenter.default.post(
      name: Notification.Name("FCMToken"),
      object: nil,
      userInfo: dataDict
    )
  }
}

// MARK: - UNUserNotificationCenterDelegate
@available(iOS 10, *)
extension AppDelegate: UNUserNotificationCenterDelegate {
  // Receive displayed notifications for iOS 10 devices.
  public func userNotificationCenter(_ center: UNUserNotificationCenter,
                                     willPresent notification: UNNotification,
                                     withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    let userInfo = notification.request.content.userInfo
    print("Notification received in foreground: \(userInfo)")
    completionHandler([[.banner, .badge, .sound]])
  }

  public func userNotificationCenter(_ center: UNUserNotificationCenter,
                                     didReceive response: UNNotificationResponse,
                                     withCompletionHandler completionHandler: @escaping () -> Void) {
    let userInfo = response.notification.request.content.userInfo
    print("Notification tapped: \(userInfo)")
    completionHandler()
  }
}
