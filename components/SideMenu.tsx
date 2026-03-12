import { RemoteImage } from '@/components/RemoteImage';
import { ThemedText } from '@/components/themed-text';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

let RazorpayCheckout: any = null;
try {
  RazorpayCheckout = require('react-native-razorpay').default;
} catch {
  // Razorpay optional
}

type SideMenuContextValue = {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
  user: any | null;
  refreshUser: () => Promise<void>;
};

const SideMenuContext = createContext<SideMenuContextValue | null>(null);

export function SideMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<number>(85);

  const loadUser = async () => {
    try {
      const ud = await AsyncStorage.getItem('userData');
      let parsed: any = null;
      if (ud) {
        parsed = JSON.parse(ud);
        setUser(parsed);
        if (parsed && typeof parsed.profile_completion !== 'undefined') {
          setProfileCompletion(Number(parsed.profile_completion) || 0);
        }
      }

      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        try {
          const res = await fetch(`${API_CONFIG.BASE_URL}/users/farmer-profile`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          const json = await res.json();
          if (res.ok && (json?.status === 'success' || json?.data)) {
            const profile = json.data?.user ?? json.data?.farmer ?? json.data ?? {};
            const userType = profile.user_type ?? parsed?.user_type;
            const merged = { ...(parsed || {}), ...profile, user_type: userType };
            setUser(merged);
            if (typeof merged.profile_completion !== 'undefined') {
              setProfileCompletion(Number(merged.profile_completion) || 0);
            }
            await AsyncStorage.setItem('userData', JSON.stringify(merged));
          }
        } catch (_) {
          // keep existing user from AsyncStorage
        }
      }

      // Also check if profile_images are stored separately (from login response)
      const profileImagesStr = await AsyncStorage.getItem('profile_images');
      if (!profileImagesStr) {
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData?.profile_images) {
            await AsyncStorage.setItem('profile_images', JSON.stringify(userData.profile_images));
          }
        }
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    // initial load
    loadUser();
  }, []);

  useEffect(() => {
    // refresh user data whenever the side menu opens (so latest login/updates appear)
    if (isOpen) loadUser();
  }, [isOpen]);

  const value: SideMenuContextValue = {
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((s) => !s),
    isOpen,
    user,
    refreshUser: loadUser,
  };

  return (
    <SideMenuContext.Provider value={value}>
      {children}
      <GlobalSideMenu isOpen={isOpen} onClose={() => setIsOpen(false)} user={user} profileCompletion={profileCompletion} refreshUser={loadUser} />
    </SideMenuContext.Provider>
  );
}

export function useSideMenu() {
  const ctx = useContext(SideMenuContext);
  if (!ctx) throw new Error('useSideMenu must be used within SideMenuProvider');
  return ctx;
}

function GlobalSideMenu({ isOpen, onClose, user, profileCompletion, refreshUser }: { isOpen: boolean; onClose: () => void; user: any | null; profileCompletion: number; refreshUser: () => Promise<void> }) {
  const { language, setLanguage } = useLanguage();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [feesLoading, setFeesLoading] = useState(false);
  const [premiumFee, setPremiumFee] = useState<{ amount: number; type?: string } | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  const displayName = user?.fullname || user?.name || user?.first_name || (language === 'ta' ? 'முருகன் குமார்' : 'User Name');
  const displayPhone = user?.mobile_no || user?.mobile || user?.phone || (language === 'ta' ? '9876543210' : '9876543210');
  const isFreeUser = user?.user_type === 'Free';

  // Load profile image from AsyncStorage
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        // Try to get profile_images from AsyncStorage
        const profileImagesStr = await AsyncStorage.getItem('profile_images');
        if (profileImagesStr) {
          const profileImages = JSON.parse(profileImagesStr);
          if (Array.isArray(profileImages) && profileImages.length > 0 && profileImages[0]?.image_url) {
            const imageUrl = `${API_CONFIG.UPLOADS_URL}/${profileImages[0].image_url}`;
            console.log('Setting profile image URL:', imageUrl);
            setProfileImageUrl(imageUrl);
            return;
          }
        }
        
        // Fallback: check if userData has profile_images embedded
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData?.profile_images && Array.isArray(userData.profile_images) && userData.profile_images.length > 0) {
            if (userData.profile_images[0]?.image_url) {
              const imageUrl = `${API_CONFIG.UPLOADS_URL}/${userData.profile_images[0].image_url}`;
              console.log('Setting profile image URL from userData:', imageUrl);
              setProfileImageUrl(imageUrl);
              return;
            }
          }
        }
        
        // No profile image found
        console.log('No profile image found, using default');
        setProfileImageUrl(null);
      } catch (e) {
        console.warn('Error loading profile image:', e);
        setProfileImageUrl(null);
      }
    };

    if (isOpen) {
      loadProfileImage();
    }
  }, [isOpen, user]);

  const ROLE_MAP: Record<number, { en: string; ta: string }> = {
    15: { en: 'Branch Secretary', ta: 'கிளை செயலாளர்' },
    14: { en: 'Union Secretary', ta: 'ஒன்றிய செயலாளர்' },
    13: { en: 'District Secretary', ta: 'மாவட்ட செயலாளர்' },
    12: { en: 'Zonal Secretary', ta: 'மண்டல செயலாளர்' },
    11: { en: 'General Secretary', ta: 'பொது செயலாளர்' },
    7: { en: 'State Leader', ta: 'மாநில தலைவர்' },
    16: { en: 'Member', ta: 'உறுப்பினர்' },
    2: { en: 'Member', ta: 'உறுப்பினர்' },
    3: { en: 'Investor', ta: 'முதலீட்டாளர்' },
    4: { en: 'Service Provider', ta: 'சேவை வழங்குநர்' },
  };

  const roleFromMap = user?.role_id ? ROLE_MAP[user.role_id] : undefined;
  const roleLabel = user?.role || user?.role_name || (roleFromMap ? (language === 'ta' ? roleFromMap.ta : roleFromMap.en) : '');

  const openUpgradeModal = async () => {
    setUpgradeModalVisible(true);
    setPremiumFee(null);
    setFeesLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${API_CONFIG.BASE_URL}/fees`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json?.status === 'success' && json?.data) {
        const feetype = json.data.feetype ?? json.data.fees;
        const list = Array.isArray(feetype) ? feetype : [];
        const premium = list.find((f: any) => (String(f.type || '').toLowerCase().includes('premium') || String(f.type || '').toLowerCase().includes('registration'))) || list[0];
        const amount = premium ? parseFloat(String(premium.reg_fees ?? '0')) : 0;
        setPremiumFee(amount > 0 ? { amount, type: premium?.type } : null);
        if (amount <= 0 && list.length > 0) {
          const first = list[0];
          setPremiumFee({ amount: parseFloat(String(first.reg_fees ?? '0')), type: first?.type });
        }
      }
    } catch (e) {
      console.warn('Fetch fees error', e);
      Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'கட்டணம் ஏற்ற முடியவில்லை' : 'Failed to load fees');
    } finally {
      setFeesLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, paymentStatus: number, amount: number) => {
    const userId = user?.id ?? user?.user_id;
    if (!userId) return false;
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${API_CONFIG.BASE_URL}/payments/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: Number(userId),
          payment_id: paymentId,
          payment_status: paymentStatus,
          amount,
          currency: 'INR',
          payment_method: 'razorpay',
        }),
      });
      const json = await res.json();
      return res.ok && (json?.status === 'success' || json?.success);
    } catch (e) {
      console.warn('Update payment status error', e);
      return false;
    }
  };

  const handleUpgradeConfirm = async () => {
    const amount = premiumFee?.amount ?? 0;
    if (amount <= 0) {
      Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'செல்லுபடியான கட்டணம் இல்லை' : 'No valid fee amount');
      return;
    }
    if (!RazorpayCheckout) {
      Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'பணம் செலுத்துதல் அமைப்பு கிடைக்கவில்லை' : 'Payment system not available.');
      return;
    }
    setPaymentProcessing(true);
    setUpgradeModalVisible(false);
    try {
      const amountInPaise = Math.round(amount * 100);
      const options = {
        description: language === 'ta' ? 'NAAM பிரீமியம் பதிவு' : 'NAAM Premium Registration',
        currency: 'INR',
        key: 'rzp_test_RcPoxTDuikU5MK',
        amount: amountInPaise,
        name: 'NAAM',
        prefill: { contact: displayPhone, name: displayName },
        theme: { color: '#0f6b36' },
      };
      const paymentData = await RazorpayCheckout.open(options);
      const paymentId = paymentData?.razorpay_payment_id || paymentData?.payment_id || `pay_${Date.now()}`;
      const updated = await updatePaymentStatus(paymentId, 1, amount);
      if (updated) {
        const ud = await AsyncStorage.getItem('userData');
        if (ud) {
          try {
            const parsed = JSON.parse(ud);
            if (parsed && typeof parsed === 'object') {
              await AsyncStorage.setItem('userData', JSON.stringify({ ...parsed, user_type: 'Premium' }));
            }
          } catch (_) {}
        }
        await refreshUser();
        Alert.alert(language === 'ta' ? 'வெற்றி' : 'Success', language === 'ta' ? 'பணம் வெற்றிகரமாக செலுத்தப்பட்டது.' : 'Payment successful.');
        router.replace('/dashboard-farmer' as any);
      } else {
        Alert.alert(language === 'ta' ? 'எச்சரிக்கை' : 'Warning', language === 'ta' ? 'பணம் செலுத்தப்பட்டது, நிலை புதுப்பிக்கப்படவில்லை.' : 'Payment done but status could not be updated.');
        await refreshUser();
      }
    } catch (error: any) {
      const cancelled = error?.code === 2 || error?.code === 0 || error?.message?.toLowerCase().includes('cancel');
      if (!cancelled) {
        Alert.alert(language === 'ta' ? 'பிழை' : 'Error', error?.description || error?.message || (language === 'ta' ? 'பணம் செலுத்துதல் தோல்வி' : 'Payment failed'));
      }
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleDeleteAccount = () => {
    const title = language === 'ta' ? 'கணக்கை நீக்கு' : 'Delete Account';
    const message =
      language === 'ta'
        ? 'உங்கள் கணக்கு நிரந்தரமாக நீக்கப்படும். இந்த செயலை மாற்ற முடியாது. தொடர விரும்புகிறீர்களா?'
        : 'Your account will be permanently deleted. This action cannot be undone. Do you want to continue?';
    const cancelLabel = language === 'ta' ? 'ரத்து' : 'Cancel';
    const deleteLabel = language === 'ta' ? 'ஆம், நீக்கு' : 'Yes, Delete';

    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel' },
      {
        text: deleteLabel,
        style: 'destructive',
        onPress: async () => {
          setDeleteAccountLoading(true);
          onClose();
          try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
              Alert.alert(
                language === 'ta' ? 'பிழை' : 'Error',
                language === 'ta' ? 'அங்கீகாரம் கிடைக்கவில்லை' : 'Not authenticated'
              );
              return;
            }
            const res = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.DELETE_ACCOUNT}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });
            const json = res.ok ? await res.json().catch(() => ({})) : {};
            if (res.ok && (json?.status === 'success' || json?.success !== false)) {
              await AsyncStorage.multiRemove(['authToken', 'userData', 'userInfo', 'profile_images']);
              Alert.alert(
                language === 'ta' ? 'கணக்கு நீக்கப்பட்டது' : 'Account Deleted',
                language === 'ta' ? 'உங்கள் கணக்கு வெற்றிகரமாக நீக்கப்பட்டது.' : 'Your account has been deleted successfully.'
              );
              router.replace('/');
            } else {
              const errMsg = json?.message || json?.error || (language === 'ta' ? 'கணக்கு நீக்குதல் தோல்வி' : 'Failed to delete account');
              Alert.alert(language === 'ta' ? 'பிழை' : 'Error', errMsg);
            }
          } catch (e: any) {
            Alert.alert(
              language === 'ta' ? 'பிழை' : 'Error',
              e?.message || (language === 'ta' ? 'கணக்கு நீக்குதல் தோல்வி' : 'Failed to delete account')
            );
          } finally {
            setDeleteAccountLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <>
      {isOpen && <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={onClose}><View /></TouchableOpacity>}
      <View style={[styles.sideMenu, isOpen ? styles.sideMenuOpen : {}]} pointerEvents={isOpen ? 'auto' : 'none'}>
        <View style={styles.menuHeader}>
          <View style={styles.avatarWrap}>
            <RemoteImage uri={profileImageUrl ?? undefined} style={styles.avatar} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <ThemedText style={styles.userName}>{displayName}</ThemedText>
            <ThemedText style={styles.userPhone}>{displayPhone}</ThemedText>
            {roleLabel ? <ThemedText style={styles.userRole}>{roleLabel}</ThemedText> : null}
            <View style={styles.progressWrap}>
              <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${Math.min(100, Number(profileCompletion || 85))}%` }]} /></View>
              <ThemedText style={styles.progressPct}>{Math.min(100, Number(profileCompletion || 85))}%</ThemedText>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); router.push('/dashboard-farmer'); }}>
          <Ionicons name="home" size={20} color="#0f172a" />
          <ThemedText style={styles.menuItemText}>{language === 'ta' ? 'முகப்பு' : 'Home'}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); router.push('/harvest' as any); }}>
          <Ionicons name="megaphone" size={20} color="#0f172a" />
          <ThemedText style={styles.menuItemText}>{language === 'ta' ? 'அறுவடை' : 'Harvests'}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); router.push('/investor-farmers' as any); }}>
          <Ionicons name="people" size={20} color="#0f172a" />
          <ThemedText style={styles.menuItemText}>{language === 'ta' ? 'தலைமை' : 'Leadership'}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); router.push('/profile' as any); }}>
          <Ionicons name="person" size={20} color="#0f172a" />
          <ThemedText style={styles.menuItemText}>{language === 'ta' ? 'சுயவிவரம்' : 'Profile'}</ThemedText>
        </TouchableOpacity>

        {isFreeUser && (
          <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); setTimeout(() => openUpgradeModal(), 300); }}>
            <Ionicons name="diamond" size={20} color="#0f6b36" />
            <ThemedText style={[styles.menuItemText, { color: '#0f6b36' }]}>{language === 'ta' ? 'பிரீமியத்திற்கு மேம்படுத்து' : 'Upgrade to Premium'}</ThemedText>
          </TouchableOpacity>
        )}

        {/* Administration - visible for non-farmers (role_id !== 2) */}
        {user?.role_id && user.role_id !== 2 && (
          <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); router.push('/admin' as any); }}>
            <Ionicons name="settings" size={20} color="#0f172a" />
            <ThemedText style={styles.menuItemText}>{language === 'ta' ? 'நிர்வாகம்' : 'Administration'}</ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={() => { setLanguage(language === 'ta' ? 'en' : 'ta'); onClose(); }}>
          <Ionicons name="language" size={20} color="#0f172a" />
          <ThemedText style={styles.menuItemText}>{language === 'ta' ? 'English' : 'தமிழ்'}</ThemedText>
        </TouchableOpacity>

        <View style={styles.menuSeparator} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleDeleteAccount}
          disabled={deleteAccountLoading}
        >
          <Ionicons name="trash-outline" size={20} color="#dc2626" />
          <ThemedText style={[styles.menuItemText, { color: '#dc2626' }]}>
            {language === 'ta' ? 'கணக்கை நீக்கு' : 'Delete Account'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={async () => { onClose(); await AsyncStorage.removeItem('authToken'); await AsyncStorage.removeItem('userData'); router.replace('/'); }}
          disabled={deleteAccountLoading}
        >
          <Ionicons name="log-out" size={20} color="#ef4444" />
          <ThemedText style={[styles.menuItemText, { color: '#ef4444' }]}>{language === 'ta' ? 'வெளியேறு' : 'Logout'}</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Upgrade to Premium modal */}
      <Modal visible={upgradeModalVisible} transparent animationType="fade">
        <View style={styles.upgradeModalOverlay}>
          <View style={styles.upgradeModalContent}>
            <ThemedText style={styles.upgradeModalTitle}>{language === 'ta' ? 'பிரீமியத்திற்கு மேம்படுத்து' : 'Upgrade to Premium'}</ThemedText>
            {feesLoading ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0f6b36" />
                <ThemedText style={{ marginTop: 12, color: '#64748b' }}>{language === 'ta' ? 'ஏற்றுகிறது...' : 'Loading...'}</ThemedText>
              </View>
            ) : premiumFee != null && premiumFee.amount > 0 ? (
              <>
                <ThemedText style={styles.upgradeModalFeeLabel}>{language === 'ta' ? 'பிரீமியம் பதிவு கட்டணம்' : 'Premium registration fee'}</ThemedText>
                <ThemedText style={styles.upgradeModalAmount}>₹{premiumFee.amount}</ThemedText>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                  <TouchableOpacity style={[styles.upgradeModalBtn, styles.upgradeModalBtnCancel]} onPress={() => { setUpgradeModalVisible(false); setPremiumFee(null); }}>
                    <ThemedText style={styles.upgradeModalBtnCancelText}>{language === 'ta' ? 'ரத்து' : 'Cancel'}</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.upgradeModalBtn, styles.upgradeModalBtnConfirm]} onPress={handleUpgradeConfirm} disabled={paymentProcessing}>
                    {paymentProcessing ? <ActivityIndicator size="small" color="#fff" /> : <ThemedText style={styles.upgradeModalBtnConfirmText}>{language === 'ta' ? 'உறுதி & பணம் செலுத்து' : 'Confirm & Pay'}</ThemedText>}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <ThemedText style={{ color: '#64748b', marginTop: 8 }}>{language === 'ta' ? 'கட்டணம் கிடைக்கவில்லை.' : 'Fees not available.'}</ThemedText>
                <TouchableOpacity style={[styles.upgradeModalBtn, { marginTop: 20 }]} onPress={() => setUpgradeModalVisible(false)}>
                  <ThemedText style={styles.upgradeModalBtnConfirmText}>{language === 'ta' ? 'மூடு' : 'Close'}</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 80 },
  sideMenu: { position: 'absolute', left: 0, top: 40, bottom: 0, width: 320, backgroundColor: '#fff', zIndex: 90, transform: [{ translateX: -340 }], elevation: 20, paddingTop: 18 },
  sideMenuOpen: { transform: [{ translateX: 0 }] },
  menuHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eef2f6' },
  avatarWrap: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', backgroundColor: '#f3f4f6' },
  avatar: { width: 56, height: 56 },
  userName: { fontWeight: '700', color: '#0f172a' },
  userPhone: { color: '#6b7280', marginTop: 4 },
  userRole: { color: '#64748b', marginTop: 4, fontSize: 13 },
  progressWrap: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  progressBarBg: { height: 8, backgroundColor: '#eef2f6', borderRadius: 8, overflow: 'hidden', flex: 1 },
  progressBarFill: { height: 8, backgroundColor: '#06b58a' },
  progressPct: { marginLeft: 8, color: '#06b58a', fontWeight: '700' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  menuItemText: { marginLeft: 12, fontWeight: '600' },
  menuSeparator: { height: 1, backgroundColor: '#eef2f6', marginTop: 6, marginBottom: 6 },
  upgradeModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  upgradeModalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340 },
  upgradeModalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  upgradeModalFeeLabel: { fontSize: 14, color: '#64748b', marginTop: 12 },
  upgradeModalAmount: { fontSize: 28, fontWeight: '700', color: '#0f6b36', marginTop: 8 },
  upgradeModalBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  upgradeModalBtnCancel: { backgroundColor: '#f1f5f9' },
  upgradeModalBtnCancelText: { color: '#64748b', fontWeight: '600' },
  upgradeModalBtnConfirm: { backgroundColor: '#0f6b36', flex: 1 },
  upgradeModalBtnConfirmText: { color: '#fff', fontWeight: '700' },
});
