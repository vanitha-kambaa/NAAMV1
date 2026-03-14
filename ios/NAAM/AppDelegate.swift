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
    #if DEBUG && !targetEnvironment(simulator)
    // On first launch, iOS shows Local Network permission when we first hit the Metro URL.
    // Trigger the permission dialog with a preflight (long timeout), then delay RN start so user can tap "Allow".
    if let metroURL = delegate.bundleURL(), let host = metroURL.host, host != "localhost" {
      let config = URLSessionConfiguration.default
      config.timeoutIntervalForRequest = 30
      config.timeoutIntervalForResource = 30
      let session = URLSession(configuration: config)
      let task = session.dataTask(with: metroURL) { _, _, _ in }
      task.resume()
      let win = window!
      // Give user time to tap "Allow" on Local Network dialog (8s); then start RN so bundle load can succeed.
      DispatchQueue.main.asyncAfter(deadline: .now() + 8.0) {
        factory.startReactNative(withModuleName: "main", in: win, launchOptions: launchOptions)
      }
    } else {
      factory.startReactNative(withModuleName: "main", in: window!, launchOptions: launchOptions)
    }
    #else
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
    #endif
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
    if let bridgeURL = bridge.bundleURL {
      return bridgeURL
    }
    return bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    // DEBUG: connect to Metro bundler (development only; not used for App Store builds)
    let bundleProvider = RCTBundleURLProvider.sharedSettings()
    
    // Use "index" as bundle root so Metro resolves ./index.js, which imports expo-router/entry (avoids ./expo-router/entry path resolution)
    #if targetEnvironment(simulator)
    // Simulator: use bundleProvider (localhost works)
    let bundleRoots = [".expo/.virtual-metro-entry", "index", "expo-router/entry"]
    for root in bundleRoots {
      if let metroURL = bundleProvider.jsBundleURL(forBundleRoot: root) {
        print("✅ Using Metro bundler URL: \(metroURL.absoluteString)")
        return metroURL
      }
    }
    if let fallback = URL(string: "http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false") {
      return fallback
    }
    #else
    // Physical device: always use Mac IP from Info.plist (injected at build time) so we hit the correct host
    if let plistHost = Bundle.main.object(forInfoDictionaryKey: "RCTMetroHost") as? String, !plistHost.isEmpty,
       let url = URL(string: "http://\(plistHost):8081/index.bundle?platform=ios&dev=true&minify=false") {
      print("✅ Using RCTMetroHost from Info.plist: \(plistHost)")
      return url
    }
    // Fallback: try bundleProvider in case host was set via dev menu
    let bundleRoots = [".expo/.virtual-metro-entry", "index", "expo-router/entry"]
    for root in bundleRoots {
      if let metroURL = bundleProvider.jsBundleURL(forBundleRoot: root), let host = metroURL.host, host != "localhost" {
        print("✅ Using Metro bundler URL: \(metroURL.absoluteString)")
        return metroURL
      }
    }
    print("❌ Physical device: RCTMetroHost not set. Rebuild with: npx expo run:ios. If URL is set but connection fails: (1) Run Metro with: npm start (or npm run start:ios) (2) Tap Allow when iOS shows Local Network permission (3) Same Wi‑Fi for iPhone and Mac (4) macOS: System Settings > Network > Firewall > allow Node/incoming on port 8081 (5) Or use: npm run start:tunnel")
    #endif
    return nil
    #else
    // RELEASE (App Store): use embedded bundle only — never connects to any dev server
    if let embeddedBundle = Bundle.main.url(forResource: "main", withExtension: "jsbundle") {
      print("✅ Using embedded bundle")
      return embeddedBundle
    }
    
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