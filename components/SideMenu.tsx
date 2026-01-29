import { ThemedText } from '@/components/themed-text';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

type SideMenuContextValue = {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
  user: any | null;
};

const SideMenuContext = createContext<SideMenuContextValue | null>(null);

export function SideMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<number>(85);

  const loadUser = async () => {
    try {
      const ud = await AsyncStorage.getItem('userData');
      if (ud) {
        const parsed = JSON.parse(ud);
        setUser(parsed);
        if (parsed && typeof parsed.profile_completion !== 'undefined') {
          setProfileCompletion(Number(parsed.profile_completion) || 0);
        }
      }
      
      // Also check if profile_images are stored separately (from login response)
      const profileImagesStr = await AsyncStorage.getItem('profile_images');
      if (!profileImagesStr) {
        // Try to get from userData if it's stored there
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
  };

  return (
    <SideMenuContext.Provider value={value}>
      {children}
      <GlobalSideMenu isOpen={isOpen} onClose={() => setIsOpen(false)} user={user} profileCompletion={profileCompletion} />
    </SideMenuContext.Provider>
  );
}

export function useSideMenu() {
  const ctx = useContext(SideMenuContext);
  if (!ctx) throw new Error('useSideMenu must be used within SideMenuProvider');
  return ctx;
}

function GlobalSideMenu({ isOpen, onClose, user, profileCompletion }: { isOpen: boolean; onClose: () => void; user: any | null; profileCompletion: number }) {
  const { language, setLanguage } = useLanguage();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  
  const displayName = user?.fullname || user?.name || user?.first_name || (language === 'ta' ? 'முருகன் குமார்' : 'User Name');
  const displayPhone = user?.mobile_no || user?.mobile || user?.phone || (language === 'ta' ? '9876543210' : '9876543210');

  // Load profile image from AsyncStorage
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        // Reset image load failed state when loading new image
        setImageLoadFailed(false);
        
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
        setImageLoadFailed(false);
      } catch (e) {
        console.warn('Error loading profile image:', e);
        setProfileImageUrl(null);
        setImageLoadFailed(false);
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

  return (
    <>
      {isOpen && <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={onClose}><View /></TouchableOpacity>}
      <View style={[styles.sideMenu, isOpen ? styles.sideMenuOpen : {}]} pointerEvents={isOpen ? 'auto' : 'none'}>
        <View style={styles.menuHeader}>
          <View style={styles.avatarWrap}>
            {profileImageUrl && !imageLoadFailed ? (
              <Image 
                source={{ uri: profileImageUrl }} 
                style={styles.avatar}
                onError={(error) => {
                  console.log('Profile image load error:', error.nativeEvent.error);
                  setImageLoadFailed(true);
                }}
                onLoad={() => {
                  console.log('Profile image loaded successfully');
                  setImageLoadFailed(false);
                }}
              />
            ) : (
              <Image source={require('../assets/images/coconut-trees.png')} style={styles.avatar} />
            )}
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

        <TouchableOpacity style={styles.menuItem} onPress={async () => { onClose(); await AsyncStorage.removeItem('authToken'); await AsyncStorage.removeItem('userData'); router.replace('/'); }}>
          <Ionicons name="log-out" size={20} color="#ef4444" />
          <ThemedText style={[styles.menuItemText, { color: '#ef4444' }]}>{language === 'ta' ? 'வெளியேறு' : 'Logout'}</ThemedText>
        </TouchableOpacity>
      </View>
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
});
