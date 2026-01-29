import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Razorpay import - will be available after installing react-native-razorpay
let RazorpayCheckout: any = null;
try {
  RazorpayCheckout = require('react-native-razorpay').default;
} catch (e) {
  console.log('Razorpay not installed');
}

export default function NewRegistration() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDarkMode = colorScheme === 'dark';
  const { t, language, setLanguage } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(language || 'en');
  const [showLocationChoice, setShowLocationChoice] = useState(false);
  const [pincode, setPincode] = useState('');
  const [showPincode, setShowPincode] = useState(false);
  const [showPincodeConfirm, setShowPincodeConfirm] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photos, setPhotos] = useState<string[]>(['', '', '']);
  const [showAadhar, setShowAadhar] = useState(false);
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharFront, setAadharFront] = useState('');
  const [aadharBack, setAadharBack] = useState('');
  const [showFarm, setShowFarm] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [statesList, setStatesList] = useState<any[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [showStateList, setShowStateList] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedStateName, setSelectedStateName] = useState<string>('');
  const [districtsList, setDistrictsList] = useState<any[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [showDistrictList, setShowDistrictList] = useState(false);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('');

  const [subdistrictsList, setSubdistrictsList] = useState<any[]>([]);
  const [subdistrictsLoading, setSubdistrictsLoading] = useState(false);
  const [showSubdistrictList, setShowSubdistrictList] = useState(false);
  const [selectedSubdistrictId, setSelectedSubdistrictId] = useState<number | null>(null);
  const [selectedSubdistrictName, setSelectedSubdistrictName] = useState<string>('');

  // Panchayat selections
  const [panchayatsList, setPanchayatsList] = useState<any[]>([]);
  const [panchayatsLoading, setPanchayatsLoading] = useState(false);
  const [showPanchayatList, setShowPanchayatList] = useState(false);
  const [selectedPanchayatId, setSelectedPanchayatId] = useState<number | null>(null);
  const [selectedPanchayatName, setSelectedPanchayatName] = useState<string>('');

  // Villages
  const [villagesList, setVillagesList] = useState<any[]>([]);
  const [villagesLoading, setVillagesLoading] = useState(false);
  const [showVillageList, setShowVillageList] = useState(false);
  const [selectedVillageId, setSelectedVillageId] = useState<number | null>(null);
  const [selectedVillageName, setSelectedVillageName] = useState<string>('');

  // Search states for dropdowns
  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [subdistrictSearch, setSubdistrictSearch] = useState('');
  const [panchayatSearch, setPanchayatSearch] = useState('');
  const [villageSearch, setVillageSearch] = useState('');

  const [registering, setRegistering] = useState(false);

  // Fee related states
  const [feeData, setFeeData] = useState<{ reg_fees_enable: number; reg_fees: number } | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [showFeeConfirmModal, setShowFeeConfirmModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const pickFromLibrary = async (index: number) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(language === 'ta' ? 'பொதிடம்' : 'Permission required', language === 'ta' ? 'கேலரி அனுமதி தேவை' : 'Permission to access gallery is required');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
      if (result.canceled) return;
      const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri;
      if (uri) setPhotos(prev => { const copy = [...prev]; copy[index] = uri; return copy; });
    } catch (e) {
      console.warn('pickFromLibrary error', e);
    }
  };

  const takePhoto = async (index: number) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(language === 'ta' ? 'பொதிடம்' : 'Permission required', language === 'ta' ? 'கேமரா அனுமதி தேவை' : 'Permission to access camera is required');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
      if (result.canceled) return;
      const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri;
      if (uri) setPhotos(prev => { const copy = [...prev]; copy[index] = uri; return copy; });
    } catch (e) {
      console.warn('takePhoto error', e);
    }
  };

  const onChoosePhoto = (index: number) => {
    Alert.alert('', '', [
      { text: language === 'ta' ? 'கேமரா' : 'Take photo', onPress: () => takePhoto(index) },
      { text: language === 'ta' ? 'கேலரி' : 'Choose from gallery', onPress: () => pickFromLibrary(index) },
      { text: language === 'ta' ? 'ரத்து' : 'Cancel', style: 'cancel' },
    ]);
  };

  const pickAadharFromLibrary = async (side: 'front' | 'back') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(language === 'ta' ? 'பொதிடம்' : 'Permission required', language === 'ta' ? 'கேலரி அனுமதி தேவை' : 'Permission to access gallery is required');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
      if (result.canceled) return;
      const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri;
      if (uri) {
        if (side === 'front') setAadharFront(uri);
        else setAadharBack(uri);
      }
    } catch (e) {
      console.warn('pickAadharFromLibrary error', e);
    }
  };

  const takeAadharPhoto = async (side: 'front' | 'back') => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(language === 'ta' ? 'பொதிடம்' : 'Permission required', language === 'ta' ? 'கேமரா அனுமதி தேவை' : 'Permission to access camera is required');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
      if (result.canceled) return;
      const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri;
      if (uri) {
        if (side === 'front') setAadharFront(uri);
        else setAadharBack(uri);
      }
    } catch (e) {
      console.warn('takeAadharPhoto error', e);
    }
  };

  const onChooseAadhar = (side: 'front' | 'back') => {
    Alert.alert('', '', [
      { text: language === 'ta' ? 'கேமரா' : 'Take photo', onPress: () => takeAadharPhoto(side) },
      { text: language === 'ta' ? 'கேலரி' : 'Choose from gallery', onPress: () => pickAadharFromLibrary(side) },
      { text: language === 'ta' ? 'ரத்து' : 'Cancel', style: 'cancel' },
    ]);
  };

  // Get current location, reverse geocode and extract postal code
  const handleMyLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(language === 'ta' ? 'அனுமதி தேவை' : 'Permission required', language === 'ta' ? 'இருப்பிடம் பெற அனுமதி தேவை' : 'Permission to access location is required');
        setIsLocating(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = pos.coords;
      const places = await Location.reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude });
      const found = (places && places[0]) ? places[0].postalCode : undefined;
      if (!found) {
        Alert.alert(language === 'ta' ? 'தவறியுள்ளது' : 'Unable', language === 'ta' ? 'பின் கோடு கண்டறிய முடியவில்லை. தயவு செய்து கைமுறை தேர்வை பயன்படுத்தவும் அல்லது பின் கோடைக் கீட்டு பதியவும்' : 'Could not determine pin code. Please try manual selection or enter pin code');
        setIsLocating(false);
        return;
      }

      setPincode(String(found));
      setShowPincodeConfirm(true);
      setIsLocating(false);
    } catch (e) {
      console.warn('handleMyLocation error', e);
      Alert.alert(language === 'ta' ? 'தவறு' : 'Error', language === 'ta' ? 'இருப்பிடம் பெற இயலவில்லை' : 'Failed to get location');
      setIsLocating(false);
    }
  };

  const fetchStates = async () => {
    try {
      setStatesLoading(true);
      const res = await fetch(`${API_CONFIG.BASE_URL}/states/all`, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': ".Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZv31YOsh-h-Ump33XuTjbbpMelAGqZunFiIm1L7aDTTKtYpg4NlTPljIM7eZUF8cv7Lg8GzM0UPYRGLgFVxVPf61SZIFsKWRCVWDZOgbOJetEVgi5HRu1YBifFIRYSKmlEJVz2pncyrO4WyXp6CxsP5qjGIVfmu6r5djvOkP37JfkLhPjrl7J3vfBbZ8xVJ19_ePs-CZx987nsJtqCKRWeFuMINwgMVXDjtegXaVp0llZrgnPz4L6pZWxQp1K2fYVZZDJTsmuhOTuBjagHEFyFFTZ8zwOSDSl14jkY-WQ4MUnrDyJhiAjzVGzZch2Yi7oxanZ6Lu0cCV7vvJfuztxu3QygBrWOwHb8QOkVg2hgtN7m5ko1pGu66M6JrS_FJsJIO47L1lckfQ3K5IqiTkRdzb3XREm8bf_Zb_wAcDB7tjfOlsb2VOEQn-mJkS6FkPP2CTJKo8QfJOTcEG_n3tq1IliVhJ_Z8NxIPrmu8L9e1hVH2NXJt4sXepRAQ__XVUyOdVgyQJdwyaVNri4bpEaUdWBCgQwxB5D4rJb2W_1Dz1tex9tcUj-CQHkP48_TOgyxI268d21bP-sqSueoiOSYAD8XdojjggcNQ0aZ9w6BitZjAapdRG585rP3fc1-_GpkxiHIOlQiFXveBA4IxwV2-DZLUejIU1T0mfuitnyP-rFC5QpcT195wr1bm17Zp2bcNdZNwML31_jG6LL87hqMAkB7ScLg0IAiMWeRyyN3Wozr6woEP9pa3AZqFo6qRKxqwQc9QuhkbNaVjIGBiJvCapGybrJvZNSTDLPGtKx9yq9Vum3uanJpsS192qRZYIGasSwfF3OCPOzEndJkIrFqQxcjlBqLtCebNgvbqmQpINzmHLNtDtDAiE6B0-E5buhpHPTVwyAYT7Bq0wCB0bikl"
        }
      });
      const json = await res.json();
      if (json?.status === 'success' && json?.data?.states) {
        setStatesList(json.data.states);
      } else {
        Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'மாநிலங்களை பெற முடியவில்லை' : 'Unable to fetch states');
      }
    } catch (e) {
      console.warn('fetchStates error', e);
      Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'மாநிலங்களை பெற முடியவில்லை' : 'Unable to fetch states');
    } finally {
      setStatesLoading(false);
    }
  };

  const fetchDistricts = async (stateId: number) => {
    try {
      setDistrictsLoading(true);
      setDistrictsList([]);
      const res = await fetch(`${API_CONFIG.BASE_URL}/districts/state/${stateId}/all`, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': ".Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZv31YOsh-h-Ump33XuTjbbpMelAGqZunFiIm1L7aDTTKtYpg4NlTPljIM7eZUF8cv7Lg8GzM0UPYRGLgFVxVPf61SZIFsKWRCVWDZOgbOJetEVgi5HRu1YBifFIRYSKmlEJVz2pncyrO4WyXp6CxsP5qjGIVfmu6r5djvOkP37JfkLhPjrl7J3vfBbZ8xVJ19_ePs-CZx987nsJtqCKRWeFuMINwgMVXDjtegXaVp0llZrgnPz4L6pZWxQp1K2fYVZZDJTsmuhOTuBjagHEFyFFTZ8zwOSDSl14jkY-WQ4MUnrDyJhiAjzVGzZch2Yi7oxanZ6Lu0cCV7vvJfuztxu3QygBrWOwHb8QOkVg2hgtN7m5ko1pGu66M6JrS_FJsJIO47L1lckfQ3K5IqiTkRdzb3XREm8bf_Zb_wAcDB7tjfOlsb2VOEQn-mJkS6FkPP2CTJKo8QfJOTcEG_n3tq1IliVhJ_Z8NxIPrmu8L9e1hVH2NXJt4sXepRAQ__XVUyOdVgyQJdwyaVNri4bpEaUdWBCgQwxB5D4rJb2W_1Dz1tex9tcUj-CQHkP48_TOgyxI268d21bP-sqSueoiOSYAD8XdojjggcNQ0aZ9w6BitZjAapdRG585rP3fc1-_GpkxiHIOlQiFXveBA4IxwV2-DZLUejIU1T0mfuitnyP-rFC5QpcT195wr1bm17Zp2bcNdZNwML31_jG6LL87hqMAkB7ScLg0IAiMWeRyyN3Wozr6woEP9pa3AZqFo6qRKxqwQc9QuhkbNaVjIGBiJvCapGybrJvZNSTDLPGtKx9yq9Vum3uanJpsS192qRZYIGasSwfF3OCPOzEndJkIrFqQxcjlBqLtCebNgvbqmQpINzmHLNtDtDAiE6B0-E5buhpHPTVwyAYT7Bq0wCB0bikl"
        }
      });
      const json = await res.json();
      if (json?.status === 'success' && json?.data?.districts) {
        setDistrictsList(json.data.districts);
        setShowDistrictList(true);
      } else {
        Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'மாவட்டங்களை பெற முடியவில்லை' : 'Unable to fetch districts');
      }
    } catch (e) {
      console.warn('fetchDistricts error', e);
      Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'மாவட்டங்களை பெற முடியவில்லை' : 'Unable to fetch districts');
    } finally {
      setDistrictsLoading(false);
    }
  };

  const fetchSubdistricts = async (districtId: number) => {
    try {
      setSubdistrictsLoading(true);
      setSubdistrictsList([]);
      const res = await fetch(`${API_CONFIG.BASE_URL}/subdistricts/district/${districtId}/all`, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': ".Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZvu6psc6fbDUs4DMFDIXHOA_e5kVnP-jrSjxY1lVSYegu7l-RXwbgCzYuXT6poAA-wr6Uw2MUtZfBDMsQitIISm3pET4je5EQGQpPbw6Pz n..."
        }
      });
      const json = await res.json();
      if (json?.status === 'success' && json?.data?.subdistricts) {
        setSubdistrictsList(json.data.subdistricts);
        setShowSubdistrictList(true);
      } else {
        Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'உபமாவட்டங்களை பெற முடியவில்லை' : 'Unable to fetch subdistricts');
      }
    } catch (e) {
      console.warn('fetchSubdistricts error', e);
      Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'உபமாவட்டங்களை பெற முடியவில்லை' : 'Unable to fetch subdistricts');
    } finally {
      setSubdistrictsLoading(false);
    }
  };

  const fetchPanchayats = async (subdistrictId: number) => {
    try {
      setPanchayatsLoading(true);
      setPanchayatsList([]);
      const res = await fetch(`${API_CONFIG.BASE_URL}/panchayats/subdistrict/${subdistrictId}/all`, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': ".Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZsSTmkpvTboQQA22pGrf2gtXaGnf-BSx7zq8TKjMGmwmTgtbuQU6WAn3eVvF1xjRlKw4c-U2GP9kI3YVN0BgOIdwNhlUkkIItTyLCQ2sFA5lzikMcsA9BN-fvTwl4SRe7uCpnOc7Ulabx0W4DgztY2Y631Kf0S0cV3_f3c-1FAC7yjcYEQK3rG5BWylFwe_pkO5YcknHsA26f3hGLBxfedY2Mx_dq4vqT_S4OLkPlzx7UMZMXII2u5pXZl11L5nk2EUm4vfZhzpDOFj5PR_mITwc7iNU3Hqs6FnDFXmlx3uPTsbWWK2y822nOQQNpiSL-Iixj7nwFMUSn6p5nM7_ZGSXvT2Bi73uAULDyrdRnHDJkGiIEQ2xeLIH0uVoPVdeIn2RsBk9kt-JdXoZONU7RYD5OGG-nXN5m3igGUeMVaqln6LD6aZgqLJkAZkBuM3gKj3jrSrEAU9LM89AHl6Oo3CC71ArsrVSc1QHIzVUOWm0vAQYNLR7xz67YVJNvopw6C4ajCQVgLMzeu2A_RD_HPNggVHGm6s5ShUDqseEpOSeLwuGBIARqAhesZluqOu5kM07pl--Q-B_C0PAON2Vcctf6fLOJJna0b2Xp1pZNgjkuX63j5yATv3aNoklYl7XicgmngKYYQDte0dT61vdECaFaP599AmUTACDhTdHlcyxB5iTzKQapujZxvbxhtCwglApwiyYl0PqUCDdBNVFhAhfWIo03K2SpJOMrdNlPbhBlO_nOHkgtzgRWHSjwRfw59qSuznu6_tUlV40zQsGPSx43Pzfu54Nn0AWqB3mNZtuvbKLp3zC_XEtpToMq26man7-bdrfxshbMhWqABbNh6k8zGsSZQgade1A5XdYvSP4T0DXk3YzJzf63YLCDxunISTfzB5Wa1DsFgbif8MRSVe"
        }
      });
      const json = await res.json();
      if (json?.status === 'success' && json?.data?.panchayats) {
        setPanchayatsList(json.data.panchayats);
        setShowPanchayatList(true);
      } else {
        Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'பஞ்சாயத்துகளைப் பெற முடியவில்லை' : 'Unable to fetch panchayats');
      }
    } catch (e) {
      console.warn('fetchPanchayats error', e);
      Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'பஞ்சாயத்துகளைப் பெற முடியவில்லை' : 'Unable to fetch panchayats');
    } finally {
      setPanchayatsLoading(false);
    }
  };

  const fetchVillages = async (panchayatId: number) => {
    try {
      setVillagesLoading(true);
      setVillagesList([]);
      const res = await fetch(`${API_CONFIG.BASE_URL}/villages/panchayat/${panchayatId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': ".Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZvakifMm41SM9Z9Zz43E6SSlBX0AePugf9y4E3bmr9yrBp-97d9A-CDqCMGcBAHrDdALIkaDPmNKf-CDsuu3kK5pvmrcDl4-O167in4FUV0SnzqtdnCSLYQcs-GuiBeR1zC_fzptJUIx6Io3zYL7DhZDWMVFNt9sSSRvV6tAfLFDHxSnGuCTBX--JNqEASohOtOs8EQn9HU5O-B8O6mfE7KNRSUMEOIjbxyZLtI02LHH-whKJsltySTSuL8et5GXSKiYpDthB0_FUWjFszqggeVCQv7DgGR3muETM4GE6oKrlK9hCcp4-0snmdVwhI4FKD9wpsSjr8Y-Eoc4v-hvMY48JaL_0FnOBaB7H6mMO7hsnj10Qi9T9oS5GdAm1s4Q2SCZtBlSr9UQmDid4FCU9GD05JP_C9vhgz6LE_0DROVennDyODV-i4nAQui1WZa0AgU72ayW6vW4fXG2t-ICCp5lqppZd08JPtZAhmV2pMsOerrttKcVNMm5JeQnVxCWo-ampzgEExWj3LBwHlp0rzEB1HO-71sqQ8UPeexkqEOtg1hryTVnuBpjPGW0GrsfJMygc8YiPIGu3d2cYi5G4yA3zB5MjqPK-iQObZMGiGHY4nf9fjUUfUJv4eFcDk-_o4CK7mkljAYo2eSoV76QkbJED8VFCL7Jof5LNqXpKWi4mXsalc3oSxLQhOij91PPPu-shn_VOjR-NSZoIpmtBjxIl0ovK-XbZI8uU5Gbq_KYfp3arBBbzau5dKlD1cqv26PxGSmgMqfFYvVnfg59tvJlvvEQXPEFx3UXJFL0hEy1lPxcDZ6R33U88FhBFugzDfLwVztJHxT3ixD-IMorZGnfNTFxVQZtZetNgjaDJT6CyrwmEn09aeIgNs1uBpLVMLbhOt0SS9DJeH6sW3RPPim"
        }
      });
      const json = await res.json();
      if (json?.status === 'success' && json?.data?.villages) {
        setVillagesList(json.data.villages);
        setShowVillageList(true);
      } else {
        Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'ஊர்களைப் பெற முடியவில்லை' : 'Unable to fetch villages');
      }
    } catch (e) {
      console.warn('fetchVillages error', e);
      Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'ஊர்களைப் பெற முடியவில்லை' : 'Unable to fetch villages');
    } finally {
      setVillagesLoading(false);
    }
  };

  // Fetch registration fee settings
  const fetchFeeSettings = async () => {
    try {
      setFeeLoading(true);
      const res = await fetch(`${API_CONFIG.BASE_URL}/fees`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const json = await res.json();
      console.log('Fee settings response:', json);
      
      if (json?.status === 'success' && json?.data?.fees && Array.isArray(json.data.fees) && json.data.fees.length > 0) {
        // Extract fee data from the first fee object in the fees array
        const feeInfo = json.data.fees[0];
        const feeData = {
          reg_fees_enable: feeInfo.reg_fees_enable || 0,
          reg_fees: parseFloat(feeInfo.reg_fees || '0'), // Convert string to number
        };
        setFeeData(feeData);
        return feeData;
      }
      // Default to no fee if response structure is unexpected
      const defaultFeeData = { reg_fees_enable: 0, reg_fees: 0 };
      setFeeData(defaultFeeData);
      return defaultFeeData;
    } catch (e) {
      console.warn('fetchFeeSettings error', e);
      // On error, default to no fee
      const defaultFeeData = { reg_fees_enable: 0, reg_fees: 0 };
      setFeeData(defaultFeeData);
      return defaultFeeData;
    } finally {
      setFeeLoading(false);
    }
  };

  // Navigate after successful registration
  const navigateAfterRegistration = async (userId: number | null) => {
    if (!userId) return;
    
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      
      // Navigate to appropriate dashboard based on role
      if (userData?.role_id === 2) {
        router.replace('/dashboard-farmer');
      } else {
        router.replace('/dashboard');
      }
    } catch (e) {
      console.warn('navigateAfterRegistration error', e);
      // Default navigation
      router.replace('/dashboard-farmer');
    }
  };

  // Handle complete button click - check fee settings first
  const handleCompleteClick = async () => {
    try {
      setFeeLoading(true);
      const fees = await fetchFeeSettings();
      
      if (fees && fees.reg_fees_enable === 1 && fees.reg_fees > 0) {
        // Show fee confirmation modal
        setShowFeeConfirmModal(true);
      } else {
        // No fee required, directly register and navigate
        const userId = await registerUser();
        if (userId) {
          await navigateAfterRegistration(userId);
        }
      }
    } catch (e) {
      console.warn('handleCompleteClick error', e);
      // If fee check fails, try to register anyway
      const userId = await registerUser();
      if (userId) {
        await navigateAfterRegistration(userId);
      }
    } finally {
      setFeeLoading(false);
    }
  };

  // Update payment status API
  const updatePaymentStatus = async (
    userId: number,
    paymentId: string,
    paymentStatus: number,
    amount: number,
    failureReason?: string
  ) => {
    try {
      // Get auth token if available
      const token = await AsyncStorage.getItem('authToken');
      
      const requestBody: any = {
        user_id: userId,
        payment_id: paymentId,
        payment_status: paymentStatus,
        amount: amount,
        currency: 'INR',
        payment_method: 'razorpay',
      };

      if (failureReason) {
        requestBody.failure_reason = failureReason;
      }

      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Calling payment status update API with:', {
        url: `${API_CONFIG.BASE_URL}/payments/update-status`,
        body: requestBody,
      });

      const res = await fetch(`${API_CONFIG.BASE_URL}/payments/update-status`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      const json = await res.json();
      console.log('Payment status update response:', { 
        status: res.status, 
        statusText: res.statusText, 
        body: json 
      });
      
      if (res.ok && json?.status === 'success') {
        console.log('Payment status updated successfully');
        return true;
      } else {
        console.warn('Payment status update failed:', json);
        return false;
      }
    } catch (e) {
      console.error('updatePaymentStatus error:', e);
      return false;
    }
  };

  // Handle Razorpay payment
  const handlePayment = async () => {
    let paymentId = '';
    let paymentSuccess = false;
    
    try {
      setPaymentProcessing(true);
      setShowFeeConfirmModal(false);

      // Check if Razorpay is available
      if (!RazorpayCheckout) {
        Alert.alert(
          language === 'ta' ? 'பிழை' : 'Error',
          language === 'ta' ? 'பணம் செலுத்துதல் அமைப்பு கிடைக்கவில்லை' : 'Payment system not available. Please install react-native-razorpay.',
        );
        setPaymentProcessing(false);
        return;
      }

      const amountInPaise = (feeData?.reg_fees || 0) * 100; // Razorpay expects amount in paise

      const options = {
        description: language === 'ta' ? 'NAAM பதிவு கட்டணம்' : 'NAAM Registration Fee',
        image: '../assets/images/NAAM_Leaf Icon.png', // Replace with actual logo
        currency: 'INR',
        key: 'rzp_test_RcPoxTDuikU5MK', // TODO: Replace with actual Razorpay key from environment/config
        amount: amountInPaise,
        name: 'NAAM',
        prefill: {
          contact: mobile,
          name: fullName,
        },
        theme: { color: '#0bb24c' },
      };

      const paymentData = await RazorpayCheckout.open(options);
      console.log('Payment success:', paymentData);

      // Extract payment ID from response
      paymentId = paymentData?.razorpay_payment_id || paymentData?.payment_id || `pay_${Date.now()}`;
      paymentSuccess = true;

      // Payment successful, now register the user
      /*Alert.alert(
        language === 'ta' ? 'வெற்றி' : 'Success',
        language === 'ta' ? 'பணம் செலுத்தப்பட்டது. பதிவு செய்கிறது...' : 'Payment successful. Registering...',
      );*/
      
      // Call register API after successful payment
      const userId = await registerUser();
      
      if (userId) {
        console.log('Registration successful, userId:', userId);
        console.log('Updating payment status with:', {
          userId,
          paymentId,
          paymentStatus: 1,
          amount: feeData?.reg_fees || 0
        });
        
        // Update payment status with success
        try {
          const paymentUpdateSuccess = await updatePaymentStatus(
            userId,
            paymentId,
            1, // payment_status: 1 for success
            feeData?.reg_fees || 0
          );
          
          if (paymentUpdateSuccess) {
            console.log('Payment status updated successfully');
          } else {
            console.warn('Payment status update returned false');
          }
        } catch (paymentUpdateError) {
          console.error('Error updating payment status:', paymentUpdateError);
          // Continue to navigate even if payment status update fails
        }
        
        // Navigate after payment status update
        await navigateAfterRegistration(userId);
      } else {
        console.error('Registration failed - no userId returned');
        setPaymentProcessing(false);
      }

    } catch (error: any) {
      console.log('Payment error:', error);
      paymentSuccess = false;
      setPaymentProcessing(false);
      
      // Check if payment was cancelled
      const isCancelled = error?.code === 'PAYMENT_CANCELLED' || 
                         error?.description?.includes('cancelled') ||
                         error?.code === 'RazorpayCheckout.E_PAYMENT_CANCELLED';

      if (isCancelled) {
        // Payment was cancelled by user - don't register or update payment status
        Alert.alert(
          language === 'ta' ? 'ரத்து செய்யப்பட்டது' : 'Cancelled',
          language === 'ta' ? 'பணம் செலுத்துதல் ரத்து செய்யப்பட்டது' : 'Payment was cancelled',
        );
        return;
      }

      // Payment failed (not cancelled) - register user and update payment status
      // Generate payment ID for failed payment (format: failed_timestamp)
      paymentId = error?.razorpay_payment_id || `failed_${Date.now()}`;
      const failureReason = error?.description || error?.message || 'Payment failed due to insufficient funds.';

      // Even on payment failure, register the user as per requirements
      try {
        const userId = await registerUser();
        
        if (userId) {
          console.log('Registration successful after payment failure, userId:', userId);
          console.log('Updating payment status with failure:', {
            userId,
            paymentId,
            paymentStatus: 0,
            amount: feeData?.reg_fees || 0,
            failureReason
          });
          
          // Update payment status with failure
          try {
            const paymentUpdateSuccess = await updatePaymentStatus(
              userId,
              paymentId,
              0, // payment_status: 0 for failure
              feeData?.reg_fees || 0,
              failureReason
            );
            
            if (paymentUpdateSuccess) {
              console.log('Payment status updated successfully (failure)');
            } else {
              console.warn('Payment status update returned false (failure)');
            }
          } catch (paymentUpdateError) {
            console.error('Error updating payment status (failure):', paymentUpdateError);
            // Continue to navigate even if payment status update fails
          }
          
          // Navigate after payment status update
          await navigateAfterRegistration(userId);
        } else {
          console.error('Registration failed after payment failure - no userId returned');
        }
      } catch (regError) {
        console.warn('Registration after payment failure error:', regError);
        setPaymentProcessing(false);
      }

      Alert.alert(
        language === 'ta' ? 'பிழை' : 'Error',
        language === 'ta' ? 'பணம் செலுத்துதல் தோல்வி. பதிவு செய்யப்பட்டது.' : 'Payment failed. Registration completed.',
      );
    }
  };

  const registerUser = async (): Promise<number | null> => {
    try {
      setRegistering(true);

      const makeFile = (uri?: string, fallbackName = 'file') => {
        if (!uri) return null;
        const parts = uri.split('.');
        const ext = parts[parts.length - 1].toLowerCase();
        let type = 'image/jpeg';
        if (ext === 'png') type = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
        else if (ext === 'heic') type = 'image/heic';
        const name = `${fallbackName}.${ext}`;
        // RN/FormData expects { uri, name, type }
        return { uri, name, type } as any;
      };

      const fd = new FormData();
      // required / available fields from UI (aligned with register-farmer API)
      fd.append('fullname', fullName);
      fd.append('mobile_no', mobile);
      fd.append('preferred_language', selectedLanguage);
      fd.append('pincode', pincode);
      fd.append('state', selectedStateId ? String(selectedStateId) : '');
      fd.append('district', selectedDistrictId ? String(selectedDistrictId) : '');
      fd.append('subdistrict', selectedSubdistrictId ? String(selectedSubdistrictId) : '');
      fd.append('panchayat', selectedPanchayatId ? String(selectedPanchayatId) : '');
      fd.append('village', selectedVillageId ? String(selectedVillageId) : '');
      // Aadhar (aathar) number as expected by API (keeps formatting with spaces)
      fd.append('aathar', aadharNumber);

      // files: attach available images (aathar front/back and profile images)
      const af = makeFile(aadharFront, 'aathar_front_photo');
      const ab = makeFile(aadharBack, 'aathar_back_photo');
      const profileFiles = photos.map((uri, idx) => makeFile(uri, `profile_image_${idx}`)).filter(Boolean) as any[];

      if (af) fd.append('aathar_front_photo', af);
      if (ab) fd.append('aathar_back_photo', ab);

      // Append each profile image as repeated 'profile_image' fields (matches curl example)
      profileFiles.forEach((f) => fd.append('profile_image', f));

      // Keep legacy/extra fields for backward compatibility
      fd.append('email_id', '');
      fd.append('address', '');
      fd.append('gender', 'male');
      fd.append('dob', '');
      fd.append('age', '');
      fd.append('account_holder_name', '');
      fd.append('bank_name', '');
      fd.append('branch_name', '');
      fd.append('account_no', '');
      fd.append('ifsc_code', '');
      fd.append('account_type', '');
      fd.append('upi_id', '');
      fd.append('role_id', '2');
      fd.append('alternate_mobile_no', '');

      // Log a readable payload summary (FormData can't be inspected directly)
      try {
        console.log('registerUser payload summary', {
          fields: {
            fullname: fullName,
            mobile_no: mobile,
            preferred_language: selectedLanguage,
            state: selectedStateId,
            district: selectedDistrictId,
            subdistrict: selectedSubdistrictId,
            panchayat: selectedPanchayatId,
            village: selectedVillageId,
            pincode,
          },
          files: {
            aathar_front: af?.name ?? null,
            aathar_back: ab?.name ?? null,
            profile_images: profileFiles.map(f => f.name),
          },
        });
      } catch (logErr) {
        console.warn('registerUser payload log error', logErr);
      }

      const res = await fetch(`${API_CONFIG.BASE_URL}/users/register-farmer`, {
        method: 'POST',
        headers: {
          // The cookie is included per the provided curl example
          'Cookie': ".Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZvakifMm41SM9Z9Zz43E6SSlBX0AePugf9y4E3bmr9yrBp-97d9A-CDqCMGcBAHrDdALIkaDPmNKf-CDsuu3kK5pvmrcDl4-O167in4FUV0SnzqtdnCSLYQcs-GuiBeR1zC_fzptJUIx6Io3zYL7DhZDWMVFNt9sSSRvV6tAfLFDHxSnGuCTBX--JNqEASohOtOs8EQn9HU5O-B8O6mfE7KNRSUMEOIjbxyZLtI02LHH-whKJsltySTSuL8et5GXSKiYpDthB0_FUWjFszqggeVCQv7DgGR3muETM4GE6oKrlK9hCcp4-0snmdVwhI4FKD9wpsSjr8Y-Eoc4v-hvMY48JaL_0FnOBaB7H6mMO7hsnj10Qi9T9oS5GdAm1s4Q2SCZtBlSr9UQmDid4FCU9GD05JP_C9vhgz6LE_0DROVennDyODV-i4nAQui1WZa0AgU72ayW6vW4fXG2t-ICCp5lqppZd08JPtZAhmV2pMsOerrttKcVNMm5JeQnVxCWo-ampzgEExWj3LBwHlp0rzEB1HO-71sqQ8UPeexkqEOtg1hryTVnuBpjPGW0GrsfJMygc8YiPIGu3d2cYi5G4yA3zB5MjqPK-iQObZMGiGHY4nf9fjUUfUJv4eFcDk-_o4CK7mkljAYo2eSoV76QkbJED8VFCL7Jof5LNqXpKWi4mXsalc3oSxLQhOij91PPPu-shn_VOjR-NSZoIpmtBjxIl0ovK-XbZI8uU5Gbq_KYfp3arBBbzau5dKlD1cqv26PxGSmgMqfFYvVnfg59tvJlvvEQXPEFx3UXJFL0hEy1lPxcDZ6R33U88FhBFugzDfLwVztJHxT3ixD-IMorZGnfNTFxVQZtZetNgjaDJT6CyrwmEn09aeIgNs1uBpLVMLbhOt0SS9DJeH6sW3RPPim"
        },
        body: fd,
      });

      // Parse response safely and log full response
      let json: any = null;
      try {
        json = await res.json();
      } catch (parseErr) {
        const text = await res.text().catch(() => '<unable to read response text>');
        console.warn('registerUser: response JSON parse failed, text:', text, parseErr);
      }

      console.log('registerUser response', { status: res.status, statusText: res.statusText, body: json });

      if (json?.status === 'success') {
        // The register-farmer response returns farmer object and token
        const farmer = json.data?.farmer ?? json.data?.user ?? null;
        const token = json.data?.token ?? json.data?.auth_token ?? json.data?.token_id ?? null;
        const userId = farmer?.id || null;

        Alert.alert(language === 'ta' ? 'வெற்றி' : 'Success', language === 'ta' ? 'பதிவு வெற்றி' : 'Registration successful');

        // Store auth token and user details similar to login flows
        try {
          if (token) {
            await AsyncStorage.setItem('authToken', String(token));
          }
          if (userId) {
            await AsyncStorage.setItem('userId', String(userId));
          }
          // map role
          const roleName = farmer?.role_id ? (farmer.role_id === 2 ? 'farmer' : farmer.role_id === 3 ? 'investor' : farmer.role_id === 4 ? 'serviceProvider' : 'farmer') : 'farmer';
          await AsyncStorage.setItem('userRole', roleName);
          if (farmer) {
            await AsyncStorage.setItem('userData', JSON.stringify(farmer));
          }
        } catch (storageErr) {
          console.warn('registerUser: failed to store auth data', storageErr);
        }

        // Return userId for payment status update
        // Navigation will be handled by the caller after payment update
        console.log('registerUser returning userId:', userId);
        return userId;
      } else {
        console.warn('registerUser failed', json);
        Alert.alert(language === 'ta' ? 'பிழை' : 'Error', json?.message ?? (language === 'ta' ? 'பதிவு தோல்வி' : 'Registration failed'));
        return null;
      }
    } catch (e) {
      console.warn('registerUser error', e);
      Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'பதிவு தோல்வி' : 'Registration failed');
      return null;
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    if (showManual && statesList.length === 0) fetchStates();
  }, [showManual]); 

  return (
    <>
      <Stack.Screen options={{ title: '', headerShown: false }} />

      <ScrollView
        style={[styles.container, { backgroundColor: isDarkMode ? '#061025' : '#ecfdf5' }]}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', paddingTop: 200, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.back} onPress={() => {
            if (showFarm) { setShowFarm(false); setShowAadhar(true); }
            else if (showAadhar) { setShowAadhar(false); setShowPhotoUpload(true); }
            else if (showPhotoUpload) { setShowPhotoUpload(false); setShowWelcome(true); }
            else if (showWelcome) { setShowWelcome(false); }
            else if (showPincodeConfirm) { setShowPincodeConfirm(false); /* back to location choice */ }
            else if (showPincode) { setShowPincode(false); }            else if (showPanchayatList) { setShowPanchayatList(false); }
            else if (showSubdistrictList) { setShowSubdistrictList(false); }
            else if (showDistrictList) { setShowDistrictList(false); }            else if (showManual) { setShowManual(false); }
            else if (showLocationChoice) { setShowLocationChoice(false); }
            else { router.back(); }
          }}>
            <IconSymbol name="chevron.left" size={20} color="#274241" />
            <ThemedText style={styles.backText}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
          </TouchableOpacity>
        </View>

        {!showLocationChoice ? (

          <View style={styles.cardWrap}>
             
            <View style={styles.card}>
              <ThemedText style={styles.title}>{language === 'ta' ? 'புதிய பதிவு' : t('new_registration')}</ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{language === 'ta' ? 'முழு பெயர்' : t('full_name')}</ThemedText>
                <TextInput
                  placeholder={language === 'ta' ? 'உங்கள் பெயர்' : t('enter_full_name')}
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{language === 'ta' ? 'மொபைல் எண்' : t('mobile_number')}</ThemedText>
                <TextInput
                  placeholder={'9876543210'}
                  keyboardType="phone-pad"
                  style={styles.input}
                  value={mobile}
                  onChangeText={(v) => setMobile(v.replace(/[^0-9]/g, ''))}
                  maxLength={10}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>{language === 'ta' ? 'விருப்ப மொழி' : t('preferred_language')}</ThemedText>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => {
                    const next = selectedLanguage === 'ta' ? 'en' : 'ta';
                    setSelectedLanguage(next);
                    setLanguage(next);
                  }}
                >
                  <ThemedText style={styles.pickerText}>{selectedLanguage === 'ta' ? 'தமிழ்' : 'English'}</ThemedText>
                  <IconSymbol name="chevron.down" size={16} color="#4a5568" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.cta}
                onPress={() => {
                  // validation
                  if (!fullName || fullName.trim().length === 0) {
                    Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'பெயரை உள்ளிடவும்' : 'Please enter your full name');
                    return;
                  }
                  if (!/^[0-9]{10}$/.test(mobile)) {
                    Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்' : 'Please enter a valid 10-digit mobile number');
                    return;
                  }
                  if (!selectedLanguage) {
                    Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'மொழியை தேர்ந்தெடுக்கவும்' : 'Please select a language');
                    return;
                  }

                  setShowLocationChoice(true);
                }}
              >
                <ThemedText style={styles.ctaText}>{language === 'ta' ? 'தொடரவும்' : t('continue')}</ThemedText>
              </TouchableOpacity>
            </View>
            
          </View>
        ) : showWelcome ? (
          <View style={[styles.card, { marginTop: 18, maxWidth: 760, alignSelf: 'center' }]}>
            <View style={{ alignItems: 'center', marginBottom: 6 }}>
              <View style={styles.welcomeEmoji}><ThemedText style={{ fontSize: 28 }}>👋</ThemedText></View>
            </View>

            <ThemedText style={[styles.title, { fontSize: 22, marginTop: 6 }]}>{language === 'ta' ? `வரவேற்கிறோம், ${fullName || 'நண்பர்'}!` : `Welcome, ${fullName || 'user'}!`}</ThemedText>
            <ThemedText style={{ textAlign: 'center', marginTop: 10, color: '#6b7280', marginBottom: 16 }}>{language === 'ta' ? 'உங்கள் சுயவிவரத்தை முழுமையாக்க சில படிகள் மட்டுமே' : 'Just a few steps to complete your profile'}</ThemedText>

            <View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><ThemedText style={{ color: '#fff', fontWeight: '700' }}>1</ThemedText></View>
                <ThemedText style={styles.stepText}>{language === 'ta' ? 'புகைப்படம் பதிவேற்றம்' : 'Upload Photos'}</ThemedText>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><ThemedText style={{ color: '#fff', fontWeight: '700' }}>2</ThemedText></View>
                <ThemedText style={styles.stepText}>{language === 'ta' ? 'ஆதார் விவரங்கள்' : 'Aadhaar Details'}</ThemedText>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><ThemedText style={{ color: '#fff', fontWeight: '700' }}>3</ThemedText></View>
                <ThemedText style={styles.stepText}>{language === 'ta' ? 'பண்ணை அமைப்பு (விருப்பின்)' : 'Farm Setup (Optional)'}</ThemedText>
              </View>
            </View>

            <TouchableOpacity style={[styles.cta, { marginTop: 18 }]} onPress={() => { setShowWelcome(false); setShowPhotoUpload(true); }}>
              <ThemedText style={styles.ctaText}>{language === 'ta' ? 'தொடங்குவோம்' : "Let's Start"}</ThemedText>
            </TouchableOpacity>
          </View>
        ) : showPhotoUpload ? (
          <View style={[styles.card, { marginTop: 18, maxWidth: 760, alignSelf: 'center' }]}>
            <ThemedText style={[styles.title, { fontSize: 24, marginBottom: 12 }]}>{language === 'ta' ? 'உங்கள் புகைப்படங்கள்' : 'Your photos'}</ThemedText>
            <ThemedText style={{ color: '#6b7280', textAlign: 'left', marginTop: 8 }}>{language === 'ta' ? 'NAAM அடையாள அடைக்காக 2-3 புகைப்படங்கள் பதிவேற்றவும்' : 'Upload 2-3 photos for your NAAM ID card'}</ThemedText>

            <View style={styles.photoGrid}>
              {[0, 1, 2].map((i) => (
                <TouchableOpacity key={i} style={[styles.photoBox, !photos[i] && styles.photoBoxEmpty]} onPress={() => onChoosePhoto(i)}>
                  {photos[i] ? (
                    <>
                      <Image source={{ uri: photos[i] }} style={styles.photoImage} />
                      {/* small overlay for change action when image exists */}
                      <View style={styles.cameraOverlay} pointerEvents="none">
                        <IconSymbol name="camera" size={16} color="#fff" />
                      </View>
                    </>
                  ) : (
                    <View style={styles.emptyCameraInner}>
                      <IconSymbol name="camera" size={28} color="#9ca3af" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', marginTop: 18 }}>
              <TouchableOpacity style={[styles.backBtn, { marginRight: 12 }]} onPress={() => { setShowPhotoUpload(false); setShowWelcome(true); }}>
                <ThemedText style={{ color: '#374151' }}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.nextBtn, !photos.some(Boolean) && styles.nextBtnDisabled]} disabled={!photos.some(Boolean)} onPress={() => { setShowPhotoUpload(false); setShowAadhar(true); }}>
                <ThemedText style={styles.ctaText}>{language === 'ta' ? 'அடுத்து' : 'Next'}</ThemedText>
              </TouchableOpacity> 
            </View>
          </View>
        ) : showAadhar ? (
          <View style={[styles.card, { marginTop: 18, maxWidth: 760, alignSelf: 'center' }]}>
            <ThemedText style={[styles.title, { fontSize: 24, marginBottom: 12 }]}>{language === 'ta' ? 'ஆதார் விவரங்கள்' : 'Aadhaar Details'}</ThemedText>
            <ThemedText style={{ color: '#6b7280', textAlign: 'left', marginTop: 8 }}>{language === 'ta' ? 'உங்கள் ஆதார் எண் மற்றும் படங்களை பதிவேற்றவும்' : 'Upload your Aadhaar number and images'}</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{language === 'ta' ? 'ஆதார் எண்' : 'Aadhaar Number'}</ThemedText>
              <TextInput
                placeholder={'XXXX XXXX XXXX'}
                style={styles.input}
                value={aadharNumber}
                onChangeText={(v) => { const digits = v.replace(/[^0-9]/g, ''); const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim(); setAadharNumber(formatted); }}
                keyboardType='numeric'
                maxLength={14}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <ThemedText style={styles.label}>{language === 'ta' ? 'ஆதார் முன்பக்கம்' : 'Aadhaar Front'}</ThemedText>
              <TouchableOpacity style={[styles.aadharBox, !aadharFront && styles.photoBoxEmpty]} onPress={() => onChooseAadhar('front')}>
                {aadharFront ? (
                  <>
                    <Image source={{ uri: aadharFront }} style={styles.photoImageSmall} />
                    <View style={styles.cameraOverlay} pointerEvents="none">
                      <IconSymbol name="camera" size={16} color="#fff" />
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyCameraInner}>
                    <IconSymbol name="camera" size={28} color="#9ca3af" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              <ThemedText style={styles.label}>{language === 'ta' ? 'ஆதார் பின்பக்கம்' : 'Aadhaar Back'}</ThemedText>
              <TouchableOpacity style={[styles.aadharBox, !aadharBack && styles.photoBoxEmpty]} onPress={() => onChooseAadhar('back')}>
                {aadharBack ? (
                  <>
                    <Image source={{ uri: aadharBack }} style={styles.photoImageSmall} />
                    <View style={styles.cameraOverlay} pointerEvents="none">
                      <IconSymbol name="camera" size={16} color="#fff" />
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyCameraInner}>
                    <IconSymbol name="camera" size={28} color="#9ca3af" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 18 }}>
              <TouchableOpacity style={[styles.backBtn, { marginRight: 12 }]} onPress={() => { setShowAadhar(false); setShowPhotoUpload(true); }}>
                <ThemedText style={{ color: '#374151' }}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.nextBtn, (!/^[0-9]{12}$/.test(aadharNumber.replace(/\s/g, '')) || (!aadharFront && !aadharBack)) && styles.nextBtnDisabled]} disabled={!(/^[0-9]{12}$/.test(aadharNumber.replace(/\s/g, '')) && (aadharFront || aadharBack))} onPress={() => { setShowAadhar(false); setShowFarm(true); }}>
                <ThemedText style={styles.ctaText}>{language === 'ta' ? 'அடுத்து' : 'Next'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ) : showFarm ? (
          <View style={[styles.card, { marginTop: 18, maxWidth: 760, alignSelf: 'center' }]}>
            <ThemedText style={[styles.title, { fontSize: 24, marginBottom: 12 }]}>{language === 'ta' ? 'பண்ணை அமைப்பு' : 'Farm Setup'}</ThemedText>
            <ThemedText style={{ color: '#6b7280', textAlign: 'left', marginTop: 8 }}>{language === 'ta' ? 'உங்களுக்கு விவசாய நிலம் உள்ளதா?' : 'Do you own or manage farm land?'}</ThemedText>

            <View style={styles.infoBox}>
              <ThemedText style={{ color: '#0b5bdb' }}>{language === 'ta' ? 'நீங்கள் தேவைப்பட்டால் பின்னர் பண்ணை விவரங்களை சேர்க்கலாம்' : 'You can add farm details later if needed'}</ThemedText>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 18 }}>
              <TouchableOpacity style={[styles.backBtn, { marginRight: 12 }]} onPress={() => { setShowFarm(false); setShowAadhar(true); }}>
                <ThemedText style={{ color: '#374151' }}>{language === 'ta' ? 'தவிர்க்கவும்' : 'Skip for Now'}</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.finishBtn} onPress={() => { handleCompleteClick(); }} disabled={registering || feeLoading || paymentProcessing}>
                <ThemedText style={styles.ctaText}>
                  {feeLoading ? (language === 'ta' ? 'சரிபார்க்கிறது...' : 'Checking...') : 
                   paymentProcessing ? (language === 'ta' ? 'செயலாக்கம்...' : 'Processing...') :
                   registering ? (language === 'ta' ? 'சேமிக்கிறது' : 'Registering...') : 
                   (language === 'ta' ? 'முடிக்கவும்' : 'Complete')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ) : showPincodeConfirm ? (
          <View style={[styles.card, { marginTop: 18, maxWidth: 760, alignSelf: 'center' }]}>
            <ThemedText style={[styles.title, { fontSize: 24, marginBottom: 12 }]}>{language === 'ta' ? 'இருப்பிடம் தேர்ந்தெடுக்கப்பட்டது' : 'Location detected'}</ThemedText>
            <View style={styles.successBox}>
              <ThemedText style={{ color: '#0b9145' }}>{language === 'ta' ? 'இருப்பிடம் கண்டறியப்பட்டது' : 'Location detected successfully'}</ThemedText>
              <ThemedText style={{ color: '#0b9145', marginTop: 6 }}>{language === 'ta' ? `பின்கோடு: ${pincode}` : `Pin code: ${pincode}`}</ThemedText>
            </View>

            <TouchableOpacity style={styles.cta} onPress={() => { setShowPincodeConfirm(false); setShowWelcome(true); }}>
              <ThemedText style={styles.ctaText}>{language === 'ta' ? 'சமர்ப்பிக்கவும்' : 'Submit'}</ThemedText>
            </TouchableOpacity>
          </View>
        ) : showManual ? (
          <View style={[styles.card, { marginTop: 18, maxWidth: 760, alignSelf: 'center' }]}>
            <ThemedText style={[styles.title, { fontSize: 24, marginBottom: 12 }]}>{language === 'ta' ? 'இருப்பிடம் தேர்ந்தெடுக்கவும்' : 'Choose location'}</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{language === 'ta' ? 'மாநிலம்' : 'State'}</ThemedText>
              <TouchableOpacity style={styles.picker} onPress={() => {
                setShowStateList(s => !s);
                if (!showStateList) setStateSearch('');
              }}>
                <ThemedText style={styles.pickerText}>{selectedStateName ? selectedStateName : (language === 'ta' ? 'மாநிலம் தேர்ந்தெடுத்துக்கவும்' : 'Select state')}</ThemedText>
                <IconSymbol name="chevron.down" size={16} color="#4a5568" />
              </TouchableOpacity>

              {showStateList && (
                <View style={styles.dropdownList}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder={language === 'ta' ? 'தேடவும்...' : 'Search...'}
                    value={stateSearch}
                    onChangeText={setStateSearch}
                    autoFocus={true}
                  />
                  {statesLoading ? (
                    <ThemedText style={{ padding: 12 }}>{language === 'ta' ? 'காத்திருக்கவும்...' : 'Loading...'}</ThemedText>
                  ) : (
                    <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={true}>
                      {statesList
                        .filter((s) => {
                          const label = selectedLanguage === 'ta' ? s.statet_name : s.state;
                          return !stateSearch || label.toLowerCase().includes(stateSearch.toLowerCase());
                        })
                        .map((s) => (
                          <TouchableOpacity key={s.id} style={styles.dropdownItem} onPress={() => {
                            setSelectedStateId(s.id);
                            setSelectedStateName(selectedLanguage === 'ta' ? s.statet_name : s.state);
                            setShowStateList(false);
                            setStateSearch('');
                            setSelectedDistrictId(null);
                            setSelectedDistrictName('');
                            fetchDistricts(s.id);
                          }}>
                            <ThemedText>{selectedLanguage === 'ta' ? s.statet_name : s.state}</ThemedText>
                          </TouchableOpacity>
                        ))}
                      {statesList.filter((s) => {
                        const label = selectedLanguage === 'ta' ? s.statet_name : s.state;
                        return !stateSearch || label.toLowerCase().includes(stateSearch.toLowerCase());
                      }).length === 0 && !statesLoading && (
                        <ThemedText style={{ padding: 12, color: '#999' }}>{language === 'ta' ? 'முடிவுகள் இல்லை' : 'No results found'}</ThemedText>
                      )}
                    </ScrollView>
                  )}
                </View>
              )}

              {selectedStateId && (
                <View style={{ marginTop: 12 }}>
                  <ThemedText style={styles.label}>{language === 'ta' ? 'மாவட்டம்' : 'District'}</ThemedText>
                  <TouchableOpacity style={styles.picker} onPress={() => {
                    setShowDistrictList(s => !s);
                    if (!showDistrictList) setDistrictSearch('');
                  }}>
                    <ThemedText style={styles.pickerText}>{selectedDistrictName ? selectedDistrictName : (language === 'ta' ? 'மாவட்டம் தேர்ந்தெடுக்கவும்' : 'Select district')}</ThemedText>
                    <IconSymbol name="chevron.down" size={16} color="#4a5568" />
                  </TouchableOpacity>

                  {showDistrictList && (
                    <View style={styles.dropdownList}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder={language === 'ta' ? 'தேடவும்...' : 'Search...'}
                        value={districtSearch}
                        onChangeText={setDistrictSearch}
                        autoFocus={true}
                      />
                      {districtsLoading ? (
                        <ThemedText style={{ padding: 12 }}>{language === 'ta' ? 'காத்திருக்கவும்...' : 'Loading...'}</ThemedText>
                      ) : (
                        <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={true}>
                          {districtsList
                            .filter((d) => {
                              const label = selectedLanguage === 'ta' ? d.district_tname : d.district_name;
                              return !districtSearch || label.toLowerCase().includes(districtSearch.toLowerCase());
                            })
                            .map((d) => (
                              <TouchableOpacity key={d.id} style={styles.dropdownItem} onPress={() => {
                                setSelectedDistrictId(d.id);
                                setSelectedDistrictName(selectedLanguage === 'ta' ? d.district_tname : d.district_name);
                                setShowDistrictList(false);
                                setDistrictSearch('');
                                setSelectedSubdistrictId(null);
                                setSelectedSubdistrictName('');
                                // fetch subdistricts for this district
                                fetchSubdistricts(d.id);
                              }}>
                                <ThemedText>{selectedLanguage === 'ta' ? d.district_tname : d.district_name}</ThemedText>
                              </TouchableOpacity>
                            ))}
                          {districtsList.filter((d) => {
                            const label = selectedLanguage === 'ta' ? d.district_tname : d.district_name;
                            return !districtSearch || label.toLowerCase().includes(districtSearch.toLowerCase());
                          }).length === 0 && !districtsLoading && (
                            <ThemedText style={{ padding: 12, color: '#999' }}>{language === 'ta' ? 'முடிவுகள் இல்லை' : 'No results found'}</ThemedText>
                          )}
                        </ScrollView>
                      )}
                    </View>
                  )}

                  {selectedDistrictId && (
                    <View style={{ marginTop: 12 }}>
                      <ThemedText style={styles.label}>{language === 'ta' ? 'துணை மாவட்டம்' : 'Subdistrict'}</ThemedText>
                      <TouchableOpacity style={styles.picker} onPress={() => {
                        setShowSubdistrictList(s => !s);
                        if (!showSubdistrictList) setSubdistrictSearch('');
                      }}>
                        <ThemedText style={styles.pickerText}>{selectedSubdistrictName ? selectedSubdistrictName : (language === 'ta' ? 'துணை மாவட்டம் தேர்ந்தெடுக்கவும்' : 'Select subdistrict')}</ThemedText>
                        <IconSymbol name="chevron.down" size={16} color="#4a5568" />
                      </TouchableOpacity>

                      {showSubdistrictList && (
                        <View style={styles.dropdownList}>
                          <TextInput
                            style={styles.searchInput}
                            placeholder={language === 'ta' ? 'தேடவும்...' : 'Search...'}
                            value={subdistrictSearch}
                            onChangeText={setSubdistrictSearch}
                            autoFocus={true}
                          />
                          {subdistrictsLoading ? (
                            <ThemedText style={{ padding: 12 }}>{language === 'ta' ? 'காத்திருக்கவும்...' : 'Loading...'}</ThemedText>
                          ) : (
                            <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={true}>
                              {subdistrictsList
                                .filter((sd) => {
                                  const label = selectedLanguage === 'ta' ? sd.subdistrict_tname : sd.subdistrict_name;
                                  return !subdistrictSearch || label.toLowerCase().includes(subdistrictSearch.toLowerCase());
                                })
                                .map((sd) => (
                                  <TouchableOpacity key={sd.id} style={styles.dropdownItem} onPress={() => {
                                    setSelectedSubdistrictId(sd.id);
                                    setSelectedSubdistrictName(selectedLanguage === 'ta' ? sd.subdistrict_tname : sd.subdistrict_name);
                                    setShowSubdistrictList(false);
                                    setSubdistrictSearch('');
                                    setSelectedPanchayatId(null);
                                    setSelectedPanchayatName('');
                                    // fetch panchayats for this subdistrict
                                    fetchPanchayats(sd.id);
                                  }}>
                                    <ThemedText>{selectedLanguage === 'ta' ? sd.subdistrict_tname : sd.subdistrict_name}</ThemedText>
                                  </TouchableOpacity>
                                ))}
                              {subdistrictsList.filter((sd) => {
                                const label = selectedLanguage === 'ta' ? sd.subdistrict_tname : sd.subdistrict_name;
                                return !subdistrictSearch || label.toLowerCase().includes(subdistrictSearch.toLowerCase());
                              }).length === 0 && !subdistrictsLoading && (
                                <ThemedText style={{ padding: 12, color: '#999' }}>{language === 'ta' ? 'முடிவுகள் இல்லை' : 'No results found'}</ThemedText>
                              )}
                            </ScrollView>
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {selectedSubdistrictId && (
                    <View style={{ marginTop: 12 }}>
                      <ThemedText style={styles.label}>{language === 'ta' ? 'பஞ்சாயத்து' : 'Panchayat'}</ThemedText>
                      <TouchableOpacity style={styles.picker} onPress={() => {
                        setShowPanchayatList(s => !s);
                        if (!showPanchayatList) setPanchayatSearch('');
                      }}>
                        <ThemedText style={styles.pickerText}>{selectedPanchayatName ? selectedPanchayatName : (language === 'ta' ? 'பஞ்சாயத்து தேர்ந்தெடுக்கவும்' : 'Select panchayat')}</ThemedText>
                        <IconSymbol name="chevron.down" size={16} color="#4a5568" />
                      </TouchableOpacity>

                      {showPanchayatList && (
                        <View style={styles.dropdownList}>
                          <TextInput
                            style={styles.searchInput}
                            placeholder={language === 'ta' ? 'தேடவும்...' : 'Search...'}
                            value={panchayatSearch}
                            onChangeText={setPanchayatSearch}
                            autoFocus={true}
                          />
                          {panchayatsLoading ? (
                            <ThemedText style={{ padding: 12 }}>{language === 'ta' ? 'காத்திருக்கவும்...' : 'Loading...'}</ThemedText>
                          ) : (
                            <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={true}>
                              {panchayatsList
                                .filter((p) => {
                                  const label = selectedLanguage === 'ta' ? p.panchayat_tname : p.panchayat_name;
                                  return !panchayatSearch || label.toLowerCase().includes(panchayatSearch.toLowerCase());
                                })
                                .map((p) => (
                                  <TouchableOpacity key={p.id} style={styles.dropdownItem} onPress={() => {
                                    setSelectedPanchayatId(p.id);
                                    setSelectedPanchayatName(selectedLanguage === 'ta' ? p.panchayat_tname : p.panchayat_name);
                                    setShowPanchayatList(false);
                                    setPanchayatSearch('');
                                    setSelectedVillageId(null);
                                    setSelectedVillageName('');
                                    // fetch villages for this panchayat
                                    fetchVillages(p.id);
                                  }}>
                                    <ThemedText>{selectedLanguage === 'ta' ? p.panchayat_tname : p.panchayat_name}</ThemedText>
                                  </TouchableOpacity>
                                ))}
                              {panchayatsList.filter((p) => {
                                const label = selectedLanguage === 'ta' ? p.panchayat_tname : p.panchayat_name;
                                return !panchayatSearch || label.toLowerCase().includes(panchayatSearch.toLowerCase());
                              }).length === 0 && !panchayatsLoading && (
                                <ThemedText style={{ padding: 12, color: '#999' }}>{language === 'ta' ? 'முடிவுகள் இல்லை' : 'No results found'}</ThemedText>
                              )}
                            </ScrollView>
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {selectedPanchayatId && (
                    <View style={{ marginTop: 12 }}>
                      <ThemedText style={styles.label}>{language === 'ta' ? 'கிராமம்' : 'Village'}</ThemedText>
                      <TouchableOpacity style={styles.picker} onPress={() => {
                        setShowVillageList(s => !s);
                        if (!showVillageList) setVillageSearch('');
                      }}>
                        <ThemedText style={styles.pickerText}>{selectedVillageName ? selectedVillageName : (language === 'ta' ? 'கிராமம் தேர்ந்தெடுக்கவும்' : 'Select village')}</ThemedText>
                        <IconSymbol name="chevron.down" size={16} color="#4a5568" />
                      </TouchableOpacity>

                      {showVillageList && (
                        <View style={styles.dropdownList}>
                          <TextInput
                            style={styles.searchInput}
                            placeholder={language === 'ta' ? 'தேடவும்...' : 'Search...'}
                            value={villageSearch}
                            onChangeText={setVillageSearch}
                            autoFocus={true}
                          />
                          {villagesLoading ? (
                            <ThemedText style={{ padding: 12 }}>{language === 'ta' ? 'காத்திருக்கவும்...' : 'Loading...'}</ThemedText>
                          ) : (
                            <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={true}>
                              {villagesList
                                .filter((v) => {
                                  const label = selectedLanguage === 'ta' ? v.village_tname : v.village_name;
                                  return !villageSearch || label.toLowerCase().includes(villageSearch.toLowerCase());
                                })
                                .map((v) => (
                                  <TouchableOpacity key={v.id} style={styles.dropdownItem} onPress={() => {
                                    setSelectedVillageId(v.id);
                                    setSelectedVillageName(selectedLanguage === 'ta' ? v.village_tname : v.village_name);
                                    setShowVillageList(false);
                                    setVillageSearch('');
                                    setShowManual(false);
                                    setShowWelcome(true);
                                  }}>
                                    <ThemedText>{selectedLanguage === 'ta' ? v.village_tname : v.village_name}</ThemedText>
                                  </TouchableOpacity>
                                ))}
                              {villagesList.filter((v) => {
                                const label = selectedLanguage === 'ta' ? v.village_tname : v.village_name;
                                return !villageSearch || label.toLowerCase().includes(villageSearch.toLowerCase());
                              }).length === 0 && !villagesLoading && (
                                <ThemedText style={{ padding: 12, color: '#999' }}>{language === 'ta' ? 'முடிவுகள் இல்லை' : 'No results found'}</ThemedText>
                              )}
                            </ScrollView>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            
                 
            </View>
          </View>
        ) : showPincode ? (
          <View style={[styles.card, { marginTop: 18, maxWidth: 760, alignSelf: 'center' }]}>
            <ThemedText style={[styles.title, { fontSize: 24, marginBottom: 12 }]}>{language === 'ta' ? 'இருப்பிடம் தேர்ந்தெடுக்கவும்' : 'Choose location'}</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{language === 'ta' ? 'பின் கோடு' : t('pin_code')}</ThemedText>
              <TextInput
                placeholder={'642127'}
                keyboardType="numeric"
                style={styles.input}
                value={pincode}
                onChangeText={(v) => setPincode(v.replace(/[^0-9]/g, ''))}
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={styles.cta}
              onPress={() => {
                if (!/^[0-9]{6}$/.test(pincode)) {
                  Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'சரியான 6 இலக்க பின் கோடையை உள்ளிடவும்' : 'Please enter a valid 6-digit pin code');
                  return;
                }
                setShowPincode(false);
                setShowWelcome(true);
              }}
            >
              <ThemedText style={styles.ctaText}>{language === 'ta' ? 'தொடரவும்' : t('continue')}</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, { marginTop: 18, maxWidth: 760, alignSelf: 'center' }]}>
            <ThemedText style={[styles.title, { fontSize: 24, marginBottom: 12 }]}>{language === 'ta' ? 'இருப்பிடம் தேர்ந்தெடுக்கவும்' : 'Select Location'}</ThemedText>

            <TouchableOpacity style={styles.locationBtn} onPress={() => { /* pin code */ setShowPincode(true); setPincode(''); }}>
              <View style={styles.locationInner}><IconSymbol name="mappin" size={20} color="#0bb24c" /></View>
              <ThemedText style={styles.locationText}>{language === 'ta' ? 'பின் கோடு' : 'PIN code'}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.locationBtn} onPress={() => { /* my location */ handleMyLocation(); }}>
              <View style={styles.locationInner}><IconSymbol name="paperplane" size={20} color="#0bb24c" /></View>
              <ThemedText style={styles.locationText}>{language === 'ta' ? 'எனது இருப்பிடம்' : 'Use My location'}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.locationBtn} onPress={() => { /* manual */ setShowManual(true); }}>
              <View style={styles.locationInner}><IconSymbol name="list.bullet" size={20} color="#0bb24c" /></View>
              <ThemedText style={styles.locationText}>{language === 'ta' ? 'கைமுறை தேர்வு' : 'Manual Selection'}</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Fee Confirmation Modal */}
      <Modal
        visible={showFeeConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFeeConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.feeModalContent}>
            <View style={styles.feeModalHeader}>
              <View style={styles.feeIconCircle}>
                <ThemedText style={{ fontSize: 28 }}>💳</ThemedText>
              </View>
              <ThemedText style={styles.feeModalTitle}>
                {language === 'ta' ? 'பதிவு கட்டணம்' : 'Registration Fee'}
              </ThemedText>
            </View>

            <View style={styles.feeAmountBox}>
              <ThemedText style={styles.feeAmountLabel}>
                {language === 'ta' ? 'செலுத்த வேண்டிய தொகை' : 'Amount to Pay'}
              </ThemedText>
              <ThemedText style={styles.feeAmountValue}>
                ₹{feeData?.reg_fees || 0}
              </ThemedText>
            </View>

            <ThemedText style={styles.feeDescription}>
              {language === 'ta' 
                ? 'NAAM உறுப்பினராக பதிவு செய்ய இந்த கட்டணத்தை செலுத்த வேண்டும்' 
                : 'This fee is required to complete your NAAM membership registration'}
            </ThemedText>

            <View style={styles.feeModalButtons}>
              <TouchableOpacity 
                style={styles.feeCancelBtn} 
                onPress={() => setShowFeeConfirmModal(false)}
              >
                <ThemedText style={styles.feeCancelBtnText}>
                  {language === 'ta' ? 'ரத்து' : 'Cancel'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.feePayBtn} 
                onPress={handlePayment}
                disabled={paymentProcessing}
              >
                {paymentProcessing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.feePayBtnText}>
                    {language === 'ta' ? 'பணம் செலுத்து' : 'Confirm & Pay'}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRow: { paddingHorizontal: 18, marginBottom: 8 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { marginLeft: 8, color: '#274241' },
  cardWrap: { alignItems: 'center', paddingHorizontal: 18 },
  card: {
    width: '100%',
    maxWidth: 760,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 22,
    elevation: 6,
  },
  title: { textAlign: 'center', fontSize: 26, fontWeight: '700', marginBottom: 14, color: '#083b2b' },
  inputGroup: { marginTop: 12 },
  label: { marginBottom: 8, color: '#444' },
  input: { borderRadius: 12, borderWidth: 1, borderColor: '#e6e6e6', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
  picker: { borderRadius: 12, borderWidth: 1, borderColor: '#e6e6e6', paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText: { color: '#222' },
  cta: { marginTop: 20, backgroundColor: '#0bb24c', paddingVertical: 14, borderRadius: 18, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  locationBtn: { marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e6e6e6', paddingVertical: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
  locationInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  locationText: { marginLeft: 8, fontSize: 16, color: '#153f31' },
  welcomeEmoji: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f6fbf7', padding: 14, borderRadius: 12, marginTop: 12 },
  stepNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0bb24c', alignItems: 'center', justifyContent: 'center' },
  stepText: { color: '#153f31', fontSize: 16 },
  photoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  successBox: { backgroundColor: '#ecfdf5', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#bfead0', marginBottom: 12, alignItems: 'flex-start' },
  photoBox: { width: '30%', aspectRatio: 1, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', position: 'relative', overflow: 'hidden', zIndex: 1 },
  photoImage: { width: '100%', height: '100%', borderRadius: 10, zIndex: 0 },
  aadharBox: { width: '100%', height: 140, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', position: 'relative', overflow: 'hidden', zIndex: 1 },
  photoImageSmall: { width: '100%', height: '100%', borderRadius: 10, zIndex: 0 },
  cameraOverlay: { position: 'absolute', top: 8, right: 8, width: 34, height: 34, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 200, elevation: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  photoBoxEmpty: { borderColor: '#0bb24c', backgroundColor: '#ecfdf5' },
  emptyCameraInner: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#0bb24c', alignItems: 'center', justifyContent: 'center' },
  backBtn: { flex: 1, backgroundColor: '#e6e6e6', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  nextBtn: { flex: 1, backgroundColor: '#0bb24c', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  nextBtnDisabled: { backgroundColor: '#cbd5c1' },
  infoBox: { backgroundColor: '#eef6ff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#dbeafe', marginTop: 12 },
  dropdownList: { maxHeight: 200, borderWidth: 1, borderColor: '#e6e6e6', borderRadius: 8, marginTop: 8, backgroundColor: '#fff' },
  searchInput: { borderWidth: 1, borderColor: '#e6e6e6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: '#222', margin: 8, marginBottom: 4 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  skipBtn: { flex: 1, backgroundColor: '#e6e6e6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  finishBtn: { flex: 1, backgroundColor: '#0bb24c', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },

  // Fee Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feeModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  feeModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  feeIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  feeModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#083b2b',
    textAlign: 'center',
  },
  feeAmountBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  feeAmountLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  feeAmountValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0bb24c',
  },
  feeDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  feeModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  feeCancelBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  feeCancelBtnText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  feePayBtn: {
    flex: 1,
    backgroundColor: '#0bb24c',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feePayBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
