import FarmerBottomNav from '@/components/farmer-bottom-nav';
import { useSideMenu } from '@/components/SideMenu';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserData {
  id?: number;
  role?: string;
  role_id?: number;
  fullname?: string;
  fullname_tamil?: string;
  mobile_no?: string;
  alternate_mobile_no?: string;
  email_id?: string;
  address?: string;
  village?: string;
  taluk?: string;
  district?: string;
  state?: string;
  state_tamil?: string;
  pincode?: string;
  gender?: string;
  dob?: string;
  age?: string | number;
  aadhar_copy?: string;
  pan_copy?: string;
  passport_photo?: string;
  profile_completion?: number | string;
  kyc_verification?: any;
  created_at?: string;
  last_login?: string;
}

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const { open: openSideMenu } = useSideMenu();
  const colorScheme = useColorScheme() ?? 'light';

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserData | null>(null);
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

  const roleLabel = userData?.role_id ? (ROLE_MAP[userData.role_id] ? (language === 'ta' ? ROLE_MAP[userData.role_id].ta : ROLE_MAP[userData.role_id].en) : String(userData.role_id)) : undefined;

  useEffect(() => {
    loadUserProfile();
  }, []);

  const formatDate = (v?: string) => {
    if (!v) return '';
    try {
      const d = new Date(v);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  const formatDateForInput = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const parseDateFromString = (dateString?: string): Date | null => {
    if (!dateString) return null;
    try {
      // Try parsing ISO format first
      const isoDate = new Date(dateString);
      if (!isNaN(isoDate.getTime())) return isoDate;
      
      // Try parsing DD-MM-YYYY format
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) return date;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  };

  const mapServerPayloadToUserData = (data: any): UserData => {
    const ud: any = data.user_details ?? data;
    const firstImage = (data.profile_images && data.profile_images.length) ? (data.profile_images[0].image_url ?? data.profile_images[0].url ?? '') : undefined;

    // Compute profile completion percentage based on presence of key fields/images
    const checks = [
      !!(ud.fullname || ud.name),
      !!ud.mobile_no,
      !!ud.email_id,
      !!ud.address,
      !!(ud.village_name || ud.village),
      !!(ud.district_name || ud.district),
      !!(ud.state || ud.state_name || ud.statet_name),
      !!ud.pincode,
      !!ud.aadhar_copy,
      !!ud.aathar_copy_back || !!ud.aathar_back || !!ud.aathar_copy || !!ud.aathar_copy_back,
      !!firstImage || !!ud.passport_photo,
      !!ud.preferred_language,
      !!ud.dob,
      !!ud.gender,
    ];
    const completed = checks.filter(Boolean).length;
    const computedPct = Math.round((completed / checks.length) * 100);

    return {
      id: ud.id,
      role_id: ud.role_id,
      role: ud.role,
      fullname: ud.fullname ?? ud.name,
      fullname_tamil: ud.fullname_tamil ?? undefined,
      mobile_no: ud.mobile_no,
      alternate_mobile_no: ud.alternate_mobile_no,
      email_id: ud.email_id,
      address: ud.address,
      village: ud.village_name ?? ud.village,
      taluk: ud.taluk_name ?? ud.taluk,
      district: ud.district_name ?? ud.district,
      state: ud.state ?? undefined,
      state_tamil: ud.statet_name ?? ud.state_tamil ?? undefined,
      pincode: ud.pincode,
      gender: (typeof ud.gender === 'string') ? ud.gender.toLowerCase() : ud.gender,
      dob: ud.dob,
      age: ud.age,
      aadhar_copy: ud.aadhar_copy,
      passport_photo: firstImage || ud.passport_photo || undefined,
      // Prefer server value if provided, otherwise use computed percentage
      profile_completion: (typeof ud.profile_completion !== 'undefined' && ud.profile_completion !== null) ? Number(ud.profile_completion) : computedPct,
      kyc_verification: ud.kyc_verification,
      created_at: ud.created_at ?? ud.create_date,
      last_login: ud.last_login,
    };
  };

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const stored = await AsyncStorage.getItem('userData');
      if (token) {
        const res = await fetch(`${API_CONFIG.BASE_URL}/users/farmer-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        // Log API response for debugging
        console.log('PROFILE API response', json);
        if (json && json.status === 'success' && json.data) {
          // API returns payload under data.user_details and profile_images
          const mapped = mapServerPayloadToUserData(json.data);

          setUserData(mapped);
          await AsyncStorage.setItem('userData', JSON.stringify(mapped));
          setLoading(false);
          return;
        }
      }
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.user_details) {
            setUserData(mapServerPayloadToUserData(parsed));
          } else if (parsed && parsed.data && parsed.data.user_details) {
            setUserData(mapServerPayloadToUserData(parsed.data));
          } else if (parsed && (parsed.fullname || parsed.mobile_no || parsed.passport_photo || parsed.pincode)) {
            // already in the mapped shape
            setUserData(parsed);
          } else {
            // attempt to map any other shape
            setUserData(mapServerPayloadToUserData(parsed));
          }
        } catch (e) {
          console.warn('PROFILE: failed reading stored userData', e);
        }
      }
    } catch (err) {
      console.warn('PROFILE: load error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditData({ ...userData } as UserData);
    setPickedImage(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(null);
    setPickedImage(null);
  };

  const openPersonalEditModal = () => {
    const data = { ...userData } as UserData;
    setPickedImage(null);
    // Initialize date picker with existing date or default to 18 years ago
    const parsedDate = parseDateFromString(data?.dob);
    let dateToUse: Date;
    let formattedDob: string;
    
    if (parsedDate) {
      dateToUse = parsedDate;
      formattedDob = formatDateForInput(parsedDate);
    } else {
      // Default to 18 years ago if no valid date
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() - 18);
      dateToUse = defaultDate;
      formattedDob = formatDateForInput(defaultDate);
    }
    
    setSelectedDate(dateToUse);
    setEditData({ ...data, dob: formattedDob });
    setShowDatePicker(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditData(null);
    setPickedImage(null);
    setShowDatePicker(false);
  };

  const uploadProfileImage = async (userId?: number, uri?: string | null, token?: string | null) => {
    if (!userId || !uri) {
      console.log('uploadProfileImage: Missing userId or uri', { userId, uri });
      return null;
    }
    try {
      console.log('uploadProfileImage: Starting upload', { userId, uri });
      const form = new FormData();
      const name = uri.split('/').pop() || 'photo.jpg';
      const file: any = { uri, name, type: 'image/jpeg' };
      console.log('uploadProfileImage: File object', file);
      // @ts-ignore
      form.append('profile_image', file as any);

      const url = `${API_CONFIG.BASE_URL}/users/farmer/${userId}/profile-image`;
      console.log('uploadProfileImage: URL', url);
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          // Do not set Content-Type here; let fetch set the multipart boundary
        } as any,
        body: form as any,
      });
      console.log('uploadProfileImage: Response status', res.status);
      const json = await res.json();
      console.log('PROFILE IMAGE upload response', json);
      return { res, json };
    } catch (err) {
      console.warn('uploadProfileImage error', err);
      return null;
    }
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('permission_required') || 'Permissions required');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('permission_required') || 'Permissions required');
          return;
        }
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });

      // handle new ImagePicker result shape (canceled + assets)
      if (!(result as any).canceled && (result as any).assets && (result as any).assets.length) {
        const uri = (result as any).assets[0].uri;
        setPickedImage(uri);
        setEditData((prev) => ({ ...(prev ?? {}), passport_photo: uri }));

        // Immediate upload if not in edit mode
        if (userData?.id && !isEditing && !isModalOpen) {
          const token = await AsyncStorage.getItem('authToken');
          await uploadProfileImage(userData.id, uri, token);
        }
      } else if ((result as any).uri) {
        setPickedImage((result as any).uri);
        setEditData((prev) => ({ ...(prev ?? {}), passport_photo: (result as any).uri }));

        // Immediate upload if not in edit mode
        if (userData?.id && !isEditing && !isModalOpen) {
          const token = await AsyncStorage.getItem('authToken');
          await uploadProfileImage(userData.id, (result as any).uri, token);
        }
      }
    } catch (err) {
      console.warn('pickImage error', err);
    }
  };

  const showImageOptions = () => {
    const cameraLabel = language === 'ta' ? 'Camera' : 'Camera';
    const galleryLabel = language === 'ta' ? 'Gallery' : 'Gallery';
    const cancelLabel = language === 'ta' ? 'ரத்து' : 'Cancel';
    Alert.alert('', undefined, [
      { text: cameraLabel, onPress: () => pickImage('camera') },
      { text: galleryLabel, onPress: () => pickImage('gallery') },
      { text: cancelLabel, style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!editData) return;
    try {
      const token = await AsyncStorage.getItem('authToken');

      // Convert dd-mm-yyyy to yyyy-mm-dd for API
      let apiDob = editData.dob;
      if (editData.dob && /^\d{2}-\d{2}-\d{4}$/.test(editData.dob)) {
        const [day, month, year] = editData.dob.split('-');
        apiDob = `${year}-${month}-${day}`;
      }

      const payload = {
        fullname: editData.fullname,
        gender: editData.gender,
        dob: apiDob,
        pincode: editData.pincode,
        mobile_no: editData.mobile_no,
        address: editData.address,
      };

      // Update textual/profile fields first
      const res = await fetch(`${API_CONFIG.BASE_URL}/users/farmer/${editData.id}/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        } as any,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json && (json.status === 'success' || res.status === 200)) {
        // If an image was picked, upload it via the profile-image PATCH endpoint
        if (pickedImage && editData.id) {
          const uploadResult = await uploadProfileImage(editData.id, pickedImage, token ?? undefined);
          if (!uploadResult || (uploadResult.json && uploadResult.json.status !== 'success')) {
            console.warn('Image upload may have failed', uploadResult);
            Alert.alert(t('warning') || 'Warning', t('imageUploadFailed') || 'Profile image upload failed');
          }
        }

        Alert.alert(t('success') || 'Success', t('profileUpdated') || 'Profile updated');
        await loadUserProfile();
        setIsEditing(false);
        setPickedImage(null);
        setIsModalOpen(false);
      } else {
        console.warn('save failed', json);
        Alert.alert(t('error') || 'Error', t('updateFailed') || 'Update failed');
      }
    } catch (err) {
      console.warn('save error', err);
      Alert.alert(t('error') || 'Error', t('updateFailed') || 'Update failed');
    }
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <ThemedText style={{ color: '#718096', fontSize: 13 }}>{children}</ThemedText>
  );

  // Derived display values
  const avatarUri = pickedImage ?? (userData?.passport_photo ? (userData.passport_photo!.startsWith('http') ? userData.passport_photo : `${API_CONFIG.UPLOADS_URL}/${userData.passport_photo}`) : undefined);
  const genderRaw = userData?.gender;
  const genderLower = typeof genderRaw === 'string' ? genderRaw.toLowerCase() : genderRaw;
  const genderDisplay = language === 'ta'
    ? (genderLower === 'male' ? 'ஆண்' : genderLower === 'female' ? 'பெண்' : userData?.gender ?? t('noData'))
    : (genderLower === 'male' ? 'Male' : genderLower === 'female' ? 'Female' : userData?.gender ?? t('noData'));
  const nameDisplay = language === 'ta' ? (userData?.fullname_tamil ?? userData?.fullname ?? t('noData')) : (userData?.fullname ?? t('noData'));
  const mobileDisplay = userData?.mobile_no ?? t('noData');

  const updateLanguagePreference = async (lang: string) => {
    if (!userData?.id) return;
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${API_CONFIG.BASE_URL}/users/farmer/${userData.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        } as any,
        body: JSON.stringify({ preferred_language: lang }),
      });
      const json = await res.json();
      console.log('LANGUAGE UPDATE response', json);
    } catch (err) {
      console.warn('metrics update error', err);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      Alert.alert(t('error') || 'Error', language === 'ta' ? 'PIN 4 இலக்கங்களாக இருக்க வேண்டும்' : 'PIN must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert(t('error') || 'Error', language === 'ta' ? 'PIN பொருந்தவில்லை' : 'PINs do not match');
      return;
    }

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/users/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        } as any,
        body: JSON.stringify({
          mobile_no: userData?.mobile_no,
          password: pin
        }),
      });
      const json = await res.json();
      console.log('PIN UPDATE response', json);

      if (json && (json.status === 'success' || res.status === 200)) {
        Alert.alert(t('success') || 'Success', language === 'ta' ? 'PIN வெற்றிகரமாக புதுப்பிக்கப்பட்டது' : 'PIN updated successfully');
        setIsPinModalOpen(false);
        setPin('');
        setConfirmPin('');
      } else {
        Alert.alert(t('error') || 'Error', language === 'ta' ? 'PIN புதுப்பிக்க முடியவில்லை' : 'Failed to update PIN');
      }
    } catch (err) {
      console.warn('pin update error', err);
      Alert.alert(t('error') || 'Error', language === 'ta' ? 'பிழை ஏற்பட்டது' : 'An error occurred');
    }
  };

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        await fetch(`${API_CONFIG.BASE_URL}/users/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          } as any,
        });
      }
    } catch (err) {
      console.warn('Logout API error', err);
    } finally {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: t('profile') || 'Profile', headerShown: false }} />
      {/* Top bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.hamburger} onPress={() => openSideMenu()}>
          <Ionicons name="menu" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Image 
          source={language === 'ta' 
            ? require('../assets/images/naam-logo-ta.png')
            : require('../assets/images/naam-logo-en.png')
          } 
          style={styles.topAppBarLogo}
          resizeMode="contain"
        />
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.container}>

        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          <View style={styles.centerColumn}>
            <View style={styles.cardWrapper}>
              <LinearGradient colors={["#0b704d", "#07a67a"]} style={styles.headerGradient}>
                <View style={styles.headerRow}>
                  <View style={styles.avatarWrap}>
                    <View style={styles.avatar}>{avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                    ) : (
                      <IconSymbol name="person.fill" size={36} color="#ffffff" />
                    )}</View>
                    <TouchableOpacity style={styles.avatarCamera} onPress={showImageOptions} accessibilityLabel="Change profile photo">
                      <IconSymbol name="camera" size={18} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <ThemedText style={styles.nameText}>{nameDisplay}</ThemedText>
                    <ThemedText style={styles.mobileText}>{mobileDisplay}</ThemedText>
                  </View>


                </View>

                <View style={styles.progressWrap}>
                  <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${Math.min(100, Number(userData?.profile_completion ?? 85))}%` }]} /></View>
                  <ThemedText style={styles.progressPct}>{Math.min(100, Number(userData?.profile_completion ?? 85))}%</ThemedText>
                </View>
              </LinearGradient>

              <View style={styles.infoStack}>
                <View style={styles.infoCard}>
                  <View style={styles.infoHeader}>
                    <ThemedText style={styles.infoTitle}>{language === 'ta' ? 'தனிப்பட்ட விவரங்கள்' : 'Personal Details'}</ThemedText>
                    <TouchableOpacity onPress={openPersonalEditModal} style={styles.cardEditBtn}><IconSymbol name="pencil" size={16} color="#06b58a" /></TouchableOpacity>
                  </View>
                  <View style={styles.infoRowSmall}><Label>{t('mobile') || 'Mobile'}</Label><ThemedText style={styles.infoValue}>{userData?.mobile_no ?? t('noData')}</ThemedText></View>
                  <View style={styles.infoRowSmall}><Label>{t('gender') || 'Gender'}</Label><ThemedText style={styles.infoValue}>{language === 'ta' ? (userData?.gender === 'male' ? 'ஆண்' : userData?.gender === 'female' ? 'பெண்' : userData?.gender) : (userData?.gender === 'male' ? 'Male' : userData?.gender === 'female' ? 'Female' : userData?.gender ?? t('noData'))}</ThemedText></View>
                  <View style={styles.infoRowSmall}><Label>{language === 'ta' ? 'அஞ்சல் குறியீடு' : 'Pincode'}</Label><ThemedText style={styles.infoValue}>{userData?.pincode ?? t('noData')}</ThemedText></View>
                </View>

                <View style={styles.infoCard}>
                  <ThemedText style={styles.infoTitle}>{language === 'ta' ? 'ஆதார் / KYC' : 'KYC'}</ThemedText>
                  <View style={styles.infoRowSmall}><Label>{language === 'ta' ? 'நிலை' : 'Status'}</Label><ThemedText style={styles.infoValue}>{userData?.kyc_verification ? (language === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Verified') : (language === 'ta' ? 'சரிபார்க்கப்படவில்லை' : 'Not Verified')}</ThemedText></View>
                </View>

                <View style={styles.infoCard}>
                  <ThemedText style={styles.infoTitle}>{language === 'ta' ? 'பங்குகள்' : 'Role'}</ThemedText>
                  <View style={styles.infoRowSmall}><Label>{language === 'ta' ? 'பங்கு' : 'Role'}</Label><ThemedText style={styles.infoValue}>{(userData?.role ? String(userData.role) : roleLabel) ?? t('noData')}</ThemedText></View>
                </View>

                <View style={styles.infoCard}>
                  <ThemedText style={styles.infoTitle}>{language === 'ta' ? 'அமைப்புகள்' : 'Settings'}</ThemedText>
                  <TouchableOpacity onPress={() => setIsLanguageModalOpen(true)}>
                    <View style={styles.infoRowSmall}>
                      <Label>{language === 'ta' ? 'மொழி' : 'Language'}</Label>
                      <ThemedText style={styles.infoValue}>{language === 'ta' ? 'தமிழ்' : 'English'}</ThemedText>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setPin(''); setConfirmPin(''); setIsPinModalOpen(true); }}>
                    <View style={styles.infoRowSmall}>
                      <Label>PIN</Label>
                      <ThemedText style={styles.infoValueLink}>{language === 'ta' ? 'அமைக்க/மாற்ற' : 'Set/Change'}</ThemedText>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 8 }}>
                  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <ThemedText style={styles.logoutText}>{language === 'ta' ? 'வெளியேறு' : 'Logout'}</ThemedText>
                  </TouchableOpacity>
                </View>

              </View>

            </View>

            {/* Edit Modal (Personal Details) */}
            <Modal transparent visible={isModalOpen} animationType="fade">
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                      <View style={styles.modalHeader}>
                        <ThemedText style={styles.sectionTitle}>{language === 'ta' ? 'சுயவிவரத்தைத் திருத்து' : 'Edit Profile'}</ThemedText>
                        <TouchableOpacity onPress={closeModal} style={styles.modalClose}><IconSymbol name="xmark" size={18} color="#64748b" /></TouchableOpacity>
                      </View>

                      <View style={styles.inputGroup}>
                        <Label>{language === 'ta' ? 'முழு பெயர்' : 'Full name'}</Label>
                        <TextInput style={styles.input} value={editData?.fullname} onChangeText={(v) => setEditData((p) => ({ ...(p ?? {}), fullname: v }))} placeholder={language === 'ta' ? 'பெயர்' : 'Full name'} />
                      </View>

                      <View style={styles.inputGroup}>
                        <Label>{language === 'ta' ? 'பாலினம்' : 'Gender'}</Label>
                        <View style={styles.genderSelectContainer}>
                          <TouchableOpacity
                            style={[styles.genderBtn, (editData?.gender?.toLowerCase() === 'male' || editData?.gender === 'ஆண்') && styles.genderBtnSelected]}
                            onPress={() => setEditData((p) => ({ ...(p ?? {}), gender: 'Male' }))}
                          >
                            <ThemedText style={editData?.gender?.toLowerCase() === 'male' ? styles.genderBtnTextSelected : styles.genderBtnText}>
                              {language === 'ta' ? 'ஆண்' : 'Male'}
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.genderBtn, (editData?.gender?.toLowerCase() === 'female' || editData?.gender === 'பெண்') && styles.genderBtnSelected]}
                            onPress={() => setEditData((p) => ({ ...(p ?? {}), gender: 'Female' }))}
                          >
                            <ThemedText style={editData?.gender?.toLowerCase() === 'female' ? styles.genderBtnTextSelected : styles.genderBtnText}>
                              {language === 'ta' ? 'பெண்' : 'Female'}
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Label>{language === 'ta' ? 'பிறந்த தேதி' : 'Date of birth'}</Label>
                        <TouchableOpacity 
                          style={styles.input} 
                          onPress={() => setShowDatePicker(true)}
                        >
                          <ThemedText style={{ color: editData?.dob ? '#000' : '#999' }}>
                            {editData?.dob ? formatDateForInput(selectedDate) : 'dd-mm-yyyy'}
                          </ThemedText>
                        </TouchableOpacity>
                        {showDatePicker && (
                          <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            maximumDate={new Date()}
                            onChange={(event, date) => {
                              if (Platform.OS === 'android') {
                                setShowDatePicker(false);
                              }
                              if (date) {
                                setSelectedDate(date);
                                const formattedDate = formatDateForInput(date);
                                setEditData((p) => ({ ...(p ?? {}), dob: formattedDate }));
                                if (Platform.OS === 'ios') {
                                  setShowDatePicker(false);
                                }
                              }
                            }}
                          />
                        )}
                      </View>

                      <View style={styles.inputGroup}>
                        <Label>{language === 'ta' ? 'அஞ்சல் குறியீடு' : 'Pincode'}</Label>
                        <TextInput style={styles.input} value={editData?.pincode} onChangeText={(v) => setEditData((p) => ({ ...(p ?? {}), pincode: v }))} keyboardType="numeric" />
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}><ThemedText style={styles.cancelBtnText}>{language === 'ta' ? 'ரத்துசெய்' : 'Cancel'}</ThemedText></TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><ThemedText style={styles.saveBtnText}>{language === 'ta' ? 'சேமி' : 'Save'}</ThemedText></TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </Modal>

            {/* Edit Panel */}
            {isEditing && (
              <View style={styles.editPanel}>
                <ThemedText style={styles.sectionTitle}>{language === 'ta' ? 'விண்ணப்பத்தை திருத்து' : 'Edit Profile'}</ThemedText>

                <View style={styles.inputGroup}>
                  <Label>{language === 'ta' ? 'பெயர்' : 'Full name'}</Label>
                  <TextInput style={styles.input} value={editData?.fullname} onChangeText={(v) => setEditData((p) => ({ ...(p ?? {}), fullname: v }))} placeholder={language === 'ta' ? 'பெயர்' : 'Full name'} />
                </View>

                <View style={styles.inputGroup}>
                  <Label>{language === 'ta' ? 'கைபேசி எண்' : 'Mobile number'}</Label>
                  <TextInput style={styles.input} value={editData?.mobile_no} onChangeText={(v) => setEditData((p) => ({ ...(p ?? {}), mobile_no: v }))} keyboardType="phone-pad" />
                </View>

                <View style={styles.inputGroupRow}>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => pickImage('camera')}><ThemedText style={styles.smallBtnText}>{language === 'ta' ? 'கமெரா' : 'Camera'}</ThemedText></TouchableOpacity>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => pickImage('gallery')}><ThemedText style={styles.smallBtnText}>{language === 'ta' ? 'புத்தககம்' : 'Gallery'}</ThemedText></TouchableOpacity>
                </View>

                <View style={styles.editActionsRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}><ThemedText style={styles.cancelBtnText}>{language === 'ta' ? 'ரத்துசெய்' : 'Cancel'}</ThemedText></TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><ThemedText style={styles.saveBtnText}>{language === 'ta' ? 'சேமி' : 'Save'}</ThemedText></TouchableOpacity>
                </View>
              </View>
            )}

            {/* Language Selection Modal */}
            <Modal transparent visible={isLanguageModalOpen} animationType="fade" onRequestClose={() => setIsLanguageModalOpen(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <ThemedText style={styles.languageModalTitle}>மொழி தேர்வு</ThemedText>
                    <TouchableOpacity onPress={() => setIsLanguageModalOpen(false)} style={styles.modalClose}>
                      <IconSymbol name="xmark" size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.languageOptionsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.languageOption,
                        language === 'ta' && styles.languageOptionSelected
                      ]}
                      onPress={() => {
                        setLanguage('ta');
                        updateLanguagePreference('ta');
                      }}
                    >
                      <View>
                        <ThemedText style={styles.languageOptionTitle}>தமிழ்</ThemedText>
                        <ThemedText style={styles.languageOptionSubtitle}>Tamil</ThemedText>
                      </View>
                      {language === 'ta' && (
                        <View style={styles.checkmarkContainer}>
                          <IconSymbol name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.languageOption,
                        language === 'en' && styles.languageOptionSelected
                      ]}
                      onPress={() => {
                        setLanguage('en');
                        updateLanguagePreference('en');
                      }}
                    >
                      <View>
                        <ThemedText style={styles.languageOptionTitle}>English</ThemedText>
                        <ThemedText style={styles.languageOptionSubtitle}>English</ThemedText>
                      </View>
                      {language === 'en' && (
                        <View style={styles.checkmarkContainer}>
                          <IconSymbol name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>


                  <View style={styles.languageFooter}>
                    <ThemedText style={styles.languageFooterText}>
                      மொழியை மாற்றியவுடன் பயன்பாடு தானாகவே புதுப்பிக்கப்படும்
                    </ThemedText>
                  </View>
                </View>
              </View>
            </Modal>

            {/* PIN Set/Change Modal */}
            <Modal transparent visible={isPinModalOpen} animationType="fade" onRequestClose={() => setIsPinModalOpen(false)}>
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <ThemedText style={styles.sectionTitle}>{language === 'ta' ? 'PIN அமை' : 'Set PIN'}</ThemedText>
                      <TouchableOpacity onPress={() => setIsPinModalOpen(false)} style={styles.modalClose}>
                        <IconSymbol name="xmark" size={18} color="#64748b" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                      <Label>PIN</Label>
                      <TextInput
                        style={styles.input}
                        value={pin}
                        onChangeText={setPin}
                        placeholder="Enter 4 digit PIN"
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Label>{language === 'ta' ? 'PIN ஐ உறுதிப்படுத்தவும்' : 'Confirm PIN'}</Label>
                      <TextInput
                        style={styles.input}
                        value={confirmPin}
                        onChangeText={setConfirmPin}
                        placeholder="Confirm 4 digit PIN"
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                      />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsPinModalOpen(false)}>
                        <ThemedText style={styles.cancelBtnText}>{language === 'ta' ? 'ரத்துசெய்' : 'Cancel'}</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.saveBtn} onPress={handlePinSubmit}>
                        <ThemedText style={styles.saveBtnText}>{language === 'ta' ? 'சமர்ப்பிக்க' : 'Submit'}</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </Modal>

          </View>
        </ScrollView>
      </View >
      <FarmerBottomNav />
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f7f8' },
  topAppBar: { height: 56, backgroundColor: '#0f6b36', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  hamburger: { width: 36, alignItems: 'center', justifyContent: 'center' },
  topAppBarLogo: { height: 40, width: 120, maxWidth: 200 },
  container: { flex: 1 },
  page: { paddingVertical: 20, paddingHorizontal: 12 },
  centerColumn: { alignItems: 'center' },
  cardWrapper: { width: '100%', maxWidth: 720 },
  headerGradient: { borderRadius: 12, padding: 16, overflow: 'visible' },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { position: 'relative', width: 64, height: 64, overflow: 'visible' },
  avatar: { width: 64, height: 64, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarCamera: { position: 'absolute', right: -2, bottom: -2, backgroundColor: '#06b58a', width: 34, height: 34, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', zIndex: 999, elevation: 12, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6 },
  nameText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  mobileText: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  editBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8 },
  progressWrap: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  progressBg: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#fff' },
  progressPct: { marginLeft: 10, color: '#fff', fontWeight: '700' },

  infoStack: { marginTop: 16 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#2d3748', marginBottom: 8 },
  infoRowSmall: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, alignItems: 'center' },
  infoValue: { fontSize: 14, color: '#2d3748', fontWeight: '600' },
  infoValueLink: { fontSize: 14, color: '#3182ce', fontWeight: '600', textDecorationLine: 'underline', backgroundColor: '#ebf8ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  infoValueSmall: { fontSize: 13, color: '#2d3748' },

  logoutButton: { backgroundColor: '#f56565', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '700' },

  editPanel: { width: '100%', maxWidth: 720, marginTop: 16, backgroundColor: '#fff', padding: 12, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  inputGroup: { marginBottom: 12 },
  input: { height: 50, borderRadius: 10, borderWidth: 1, borderColor: '#e6edf2', paddingHorizontal: 12, backgroundColor: '#fbfdff' },
  inputGroupRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  smallBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#06b58a', alignItems: 'center' },
  smallBtnText: { color: '#fff', fontWeight: '700' },
  editActionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#e2e8f0', padding: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtnText: { color: '#2d3748', fontWeight: '700' },
  saveBtn: { flex: 1, backgroundColor: '#06b58a', padding: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },

  /* Modal styles */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  modalContent: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 10, padding: 16, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 6 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalClose: { padding: 8 },
  cardEditBtn: { padding: 6 },

  /* Language Modal Styles */
  languageModalTitle: { fontSize: 18, fontWeight: '700', color: '#1a202c' },
  languageOptionsContainer: { marginTop: 20, gap: 12 },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  languageOptionSelected: {
    borderColor: '#22c55e', // Green border
    borderWidth: 1.5,
  },
  languageOptionTitle: { fontSize: 16, fontWeight: '600', color: '#1a202c', marginBottom: 2 },
  languageOptionSubtitle: { fontSize: 13, color: '#718096' },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageFooter: {
    marginTop: 20,
    backgroundColor: '#eff6ff', // Light blue bg
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  languageFooterText: {
    fontSize: 12,
    color: '#1e40af', // Dark blue text
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Gender Select Styles */
  genderSelectContainer: { flexDirection: 'row', gap: 12 },
  genderBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e6edf2', backgroundColor: '#fbfdff', alignItems: 'center' },
  genderBtnSelected: { borderColor: '#06b58a', backgroundColor: '#e6fffa' }, // Light green bg
  genderBtnText: { color: '#718096', fontWeight: '600' },
  genderBtnTextSelected: { color: '#06b58a', fontWeight: '700' },
});
