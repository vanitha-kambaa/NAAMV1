import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiService, District, LandDetailsUpdateData, State, Taluk, Village } from '@/services/api';

interface LandDetails {
  id: number;
  user_id: number;
  land_ownership_type: string;
  total_land_holding: string;
  irrigation_source: string;
  soil_type: string;
  irrigation_type: string;
  land_lattitude: string;
  land_longitude: string;
  village: string;
  taluk: string;
  district: string;
  state: string;
  pincode: string;
  geo_photo?: string;
  land_document?: string;
  patta_number?: string;
  coconut_farm: number;
  status: number;
  created_at: string;
  updated_at: string;
  coconut_area?: string;
  no_of_trees?: number;
  trees_age?: number;
  estimated_falling?: number;
  last_harvest_date?: string;
}

export default function LandDetailsPage() {
  const { language } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const [landData, setLandData] = useState<LandDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLand, setSelectedLand] = useState<LandDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<LandDetails | null>(null);
  
  // Dropdown states
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [showIrrigationModal, setShowIrrigationModal] = useState(false);
  const [showSoilModal, setShowSoilModal] = useState(false);
  const [showIrrigationTypeModal, setShowIrrigationTypeModal] = useState(false);

  
  // Location dropdown states
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showTalukModal, setShowTalukModal] = useState(false);
  const [showVillageModal, setShowVillageModal] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedTalukId, setSelectedTalukId] = useState<number | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  


  useEffect(() => {
    loadLandDetails();
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const statesData = await apiService.getStates();
      setStates(statesData);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const selectState = async (state: State) => {
    if (!editData) return;
    setEditData({ ...editData, state: state.state });
    setSelectedStateId(state.id);
    setShowStateModal(false);
    try {
      const districtsData = await apiService.getDistricts(state.id);
      setDistricts(districtsData);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const selectDistrict = async (district: District) => {
    if (!editData) return;
    setEditData({ ...editData, district: district.district_name });
    setSelectedDistrictId(district.id);
    setShowDistrictModal(false);
    try {
      const taluksData = await apiService.getTaluks(district.id);
      setTaluks(taluksData);
    } catch (error) {
      console.error('Error fetching taluks:', error);
    }
  };

  const selectTaluk = async (taluk: Taluk) => {
    if (!editData) return;
    setEditData({ ...editData, taluk: taluk.taluk_name });
    setSelectedTalukId(taluk.id);
    setShowTalukModal(false);
    try {
      const villagesData = await apiService.getVillages(selectedDistrictId!, taluk.id);
      setVillages(villagesData);
    } catch (error) {
      console.error('Error fetching villages:', error);
    }
  };

  const selectVillage = (village: Village) => {
    if (!editData) return;
    setEditData({ ...editData, village: village.village_name });
    setShowVillageModal(false);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      if (editData) {
        setEditData({
          ...editData,
          land_lattitude: location.coords.latitude.toFixed(6),
          land_longitude: location.coords.longitude.toFixed(6)
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to get current location');
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.latitude && data.longitude) {
        setSelectedCoordinates({ latitude: data.latitude, longitude: data.longitude });
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const confirmLocation = () => {
    if (selectedCoordinates && editData) {
      setEditData({
        ...editData,
        land_lattitude: selectedCoordinates.latitude.toFixed(6),
        land_longitude: selectedCoordinates.longitude.toFixed(6)
      });
      setShowMapModal(false);
      setSelectedCoordinates(null);
    }
  };

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && editData) {
      setEditData({ ...editData, geo_photo: result.assets[0].uri });
      setShowImagePicker(false);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && editData) {
      setEditData({ ...editData, geo_photo: result.assets[0].uri });
      setShowImagePicker(false);
    }
  };

  const viewImage = (imageUri: string) => {
    setSelectedImage(imageUri);
    setShowImageModal(true);
  };



  const loadLandDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (!token || !userData) {
        console.log('Land Details - No auth token or user data, redirecting to login');
        router.replace('/');
        return;
      }

      const user = JSON.parse(userData);
      const apiUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.LAND_DETAILS}/${user.id}`;
      
      console.log('Land Details API - Request:', {
        url: apiUrl,
        userId: user.id,
        method: 'GET',
        headers: { Authorization: `Bearer ${token?.substring(0, 20)}...` },
        timestamp: new Date().toISOString()
      });

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      console.log('Land Details API - Response:', {
        url: apiUrl,
        status: response.status,
        statusText: response.statusText,
        responseData: result,
        dataCount: result.data?.length || 0,
        timestamp: new Date().toISOString()
      });

      if (result.status === 'success') {
        setLandData(result.data);
        console.log('Land Details - Success: Data loaded successfully', {
          landCount: result.data.length,
          lands: result.data.map(land => ({ id: land.id, village: land.village, totalLand: land.total_land_holding }))
        });
      } else {
        console.log('Land Details - Failed: API returned non-success status', result);
      }
    } catch (error) {
      console.error('Land Details API - Error:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const getLabels = () => {
    if (language === 'ta') {
      return {
        landDetails: 'நில விவரங்கள்',
        ownership: 'உரிமை வகை',
        totalLand: 'மொத்த நிலம்',
        irrigation: 'நீர்ப்பாசன மூலம்',
        soilType: 'மண் வகை',
        irrigationType: 'நீர்ப்பாசன வகை',
        location: 'இடம்',
        coconutFarm: 'தென்னை விவசாயம்',
        coconutArea: 'தென்னை சாகுபடி பகுதி (ஏக்கரில்)',
        noOfTrees: 'தென்னை மரங்களின் எண்ணிக்கை',
        treesAge: 'மரங்களின் சராசரி வயது',
        estimatedFalling: 'இரண்டு மாதங்களுக்கு ஒருமுறை விழும் தென்னைகளின் எண்ணிக்கை',
        lastHarvest: 'கடைசி அறுவடை தேதி',
        documents: 'ஆவணங்கள்',
        geoPhoto: 'நில புகைப்படம்',
        landDocument: 'நில ஆவணம்',
        edit: 'திருத்து',
        save: 'சேமி',
        cancel: 'ரத்து',
        back: 'பின்செல்',
        viewDetails: 'விவரங்கள் பார்க்க',
        acres: 'ஏக்கர்',
        years: 'ஆண்டுகள்',
        nuts: 'தேங்காய்கள்',
        village: 'கிராமம்',
        taluk: 'தாலுக்',
        district: 'மாவட்டம்',
        state: 'மாநிலம்',
        pincode: 'பின்கோட்',
        pattaNumber: 'பட்டா எண்',
        latitude: 'அட்சரேகை',
        longitude: 'தீர்க்கரேகை',
        getCurrentLocation: 'தற்போதைய இடத்தைப் பெறுக',
        mapView: 'வரைபட காட்சி',
        yes: 'ஆம்',
        no: 'இல்லை'
      };
    } else {
      return {
        landDetails: 'Land Details',
        ownership: 'Ownership Type',
        totalLand: 'Total Land',
        irrigation: 'Irrigation Source',
        soilType: 'Soil Type',
        irrigationType: 'Irrigation Type',
        location: 'Location',
        coconutFarm: 'Coconut Farm',
        coconutArea: 'Coconut Area',
        noOfTrees: 'Number of Trees',
        treesAge: 'Trees Age',
        estimatedFalling: 'Estimated Yield',
        lastHarvest: 'Last Harvest',
        documents: 'Documents',
        geoPhoto: 'Geo Photo',
        landDocument: 'Land Document',
        edit: 'Edit',
        save: 'Save',
        cancel: 'Cancel',
        back: 'Back',
        viewDetails: 'View Details',
        acres: 'acres',
        years: 'years',
        nuts: 'coconuts',
        village: 'Village',
        taluk: 'Taluk',
        district: 'District',
        state: 'State',
        pincode: 'Pincode',
        pattaNumber: 'Patta Number',
        latitude: 'Latitude',
        longitude: 'Longitude',
        getCurrentLocation: 'Get Current Location',
        mapView: 'Map View',
        yes: 'Yes',
        no: 'No'
      };
    }
  };

  const labels = getLabels();

  const handleLandSelect = (land: LandDetails) => {
    console.log('Land Details - Land Selected:', {
      landId: land.id,
      village: land.village,
      totalLand: land.total_land_holding,
      ownershipType: land.land_ownership_type,
      coconutFarm: land.coconut_farm,
      timestamp: new Date().toISOString()
    });
    setSelectedLand(land);
  };

  const handleEdit = () => {
    setEditData({ ...selectedLand! });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token || !editData) return;

      const updateData: LandDetailsUpdateData = {
        land_ownership_type: editData.land_ownership_type,
        total_land_holding: editData.total_land_holding,
        irrigation_source: editData.irrigation_source,
        soil_type: editData.soil_type,
        irrigation_type: editData.irrigation_type,
        land_lattitude: editData.land_lattitude,
        land_longitude: editData.land_longitude,
        village: editData.village,
        taluk: editData.taluk,
        district: editData.district,
        state: editData.state,
        pincode: editData.pincode,
        patta_number: editData.patta_number,
        coconut_farm: String(editData.coconut_farm),
        coconut_area: editData.coconut_area,
        no_of_trees: String(editData.no_of_trees),
        trees_age: String(editData.trees_age),
        estimated_falling: String(editData.estimated_falling),
        last_harvest_date: editData.last_harvest_date,
        geo_photo: editData.geo_photo,
      };

      console.log('Land Details Update - Request:', {
        landId: editData.id,
        updateData,
        timestamp: new Date().toISOString()
      });

      const success = await apiService.updateLandDetails(editData.id, updateData, token);

      console.log('Land Details Update - Response:', {
        landId: editData.id,
        success,
        timestamp: new Date().toISOString()
      });

      if (success) {
        setSelectedLand(editData);
        setLandData(prev => prev.map(land => land.id === editData!.id ? editData! : land));
        setIsEditing(false);
        Alert.alert('Success', 'Land details updated successfully');
        console.log('Land Details Update - Success: UI updated');
      } else {
        console.log('Land Details Update - Failed: API returned false');
        Alert.alert('Error', 'Failed to update land details');
      }
    } catch (error) {
      console.error('Land Details Update - Error:', {
        error: error.message,
        stack: error.stack,
        landId: editData?.id,
        timestamp: new Date().toISOString()
      });
      Alert.alert('Error', 'Failed to update land details');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(null);
  };



  const ownershipOptions = [
    { id: 'own', label: language === 'ta' ? 'சொந்தம்' : 'Own' },
    { id: 'lease', label: language === 'ta' ? 'குத்தகை' : 'Lease' },
    { id: 'shared', label: language === 'ta' ? 'பகிர்ந்து' : 'Shared' }
  ];

  const irrigationOptions = [
    { id: 'bore_well', label: language === 'ta' ? 'போர் கிணறு' : 'Bore Well' },
    { id: 'canal', label: language === 'ta' ? 'கால்வாய்' : 'Canal' },
    { id: 'river', label: language === 'ta' ? 'ஆறு' : 'River' },
    { id: 'rain_fed', label: language === 'ta' ? 'மழை நீர்' : 'Rain Fed' }
  ];

  const soilOptions = [
    { id: 'red_soil', label: language === 'ta' ? 'சிவப்பு மண்' : 'Red Soil' },
    { id: 'black_soil', label: language === 'ta' ? 'கருப்பு மண்' : 'Black Soil' },
    { id: 'clay', label: language === 'ta' ? 'களிமண்' : 'Clay' },
    { id: 'sandy', label: language === 'ta' ? 'மணல் மண்' : 'Sandy' }
  ];

  const irrigationTypeOptions = [
    { id: 'drip', label: language === 'ta' ? 'துளி நீர்ப்பாசனம்' : 'Drip Irrigation' },
    { id: 'sprinkler', label: language === 'ta' ? 'தெளிப்பு' : 'Sprinkler' },
    { id: 'flood', label: language === 'ta' ? 'வெள்ள நீர்ப்பாசனம்' : 'Flood Irrigation' }
  ];

  const selectOption = (type: string, value: string) => {
    if (!editData) return;
    
    switch (type) {
      case 'ownership':
        setEditData({ ...editData, land_ownership_type: value });
        setShowOwnershipModal(false);
        break;
      case 'irrigation':
        setEditData({ ...editData, irrigation_source: value });
        setShowIrrigationModal(false);
        break;
      case 'soil':
        setEditData({ ...editData, soil_type: value });
        setShowSoilModal(false);
        break;
      case 'irrigationType':
        setEditData({ ...editData, irrigation_type: value });
        setShowIrrigationTypeModal(false);
        break;
    }
  };

  const openDocument = (filename: string) => {
    if (filename) {
      const documentUrl = `${API_CONFIG.UPLOADS_URL}/${filename}`;
      Linking.openURL(documentUrl).catch(() => {
        Alert.alert('Error', 'Unable to open document');
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedLand) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: labels.landDetails, headerShown: false }} />
        <View style={styles.container}>
          <LinearGradient colors={['#48bb78', '#38a169']} style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSelectedLand(null)}>
              <ThemedText style={styles.backArrow}>←</ThemedText>
            </TouchableOpacity>
            
            <View style={styles.rightButtons}>
              <TouchableOpacity 
                style={styles.editIconButton}
                onPress={isEditing ? handleSave : handleEdit}
              >
                <IconSymbol name={isEditing ? "checkmark" : "pencil"} size={20} color="#ffffff" />
              </TouchableOpacity>
              
              {isEditing && (
                <TouchableOpacity 
                  style={styles.editIconButton}
                  onPress={handleCancel}
                >
                  <IconSymbol name="xmark" size={20} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.headerContent}>
              <ThemedText style={styles.title}>{labels.landDetails}</ThemedText>
              <ThemedText style={styles.subtitle}>{selectedLand.village}</ThemedText>
            </View>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.infoContainer}>
              <View style={[styles.infoCard, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
                <View style={styles.infoRow}>
                  <IconSymbol name="house.fill" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.ownership}</ThemedText>
                    {isEditing ? (
                      <TouchableOpacity 
                        style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                        onPress={() => setShowOwnershipModal(true)}
                      >
                        <ThemedText style={styles.dropdownText}>
                          {ownershipOptions.find(opt => opt.id === editData?.land_ownership_type)?.label || editData?.land_ownership_type}
                        </ThemedText>
                        <IconSymbol name="chevron.down" size={16} color="#718096" />
                      </TouchableOpacity>
                    ) : (
                      <ThemedText style={styles.infoValue}>
                        {ownershipOptions.find(opt => opt.id === selectedLand.land_ownership_type)?.label || selectedLand.land_ownership_type}
                      </ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="map.fill" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.totalLand}</ThemedText>
                    {isEditing ? (
                      <TextInput
                        style={styles.editInput}
                        value={editData?.total_land_holding}
                        onChangeText={(text) => setEditData(prev => prev ? {...prev, total_land_holding: text} : null)}
                        keyboardType="numeric"
                      />
                    ) : (
                      <ThemedText style={styles.infoValue}>{selectedLand.total_land_holding} {labels.acres}</ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="drop.fill" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.irrigation}</ThemedText>
                    {isEditing ? (
                      <TouchableOpacity 
                        style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                        onPress={() => setShowIrrigationModal(true)}
                      >
                        <ThemedText style={styles.dropdownText}>
                          {irrigationOptions.find(opt => opt.id === editData?.irrigation_source)?.label || editData?.irrigation_source}
                        </ThemedText>
                        <IconSymbol name="chevron.down" size={16} color="#718096" />
                      </TouchableOpacity>
                    ) : (
                      <ThemedText style={styles.infoValue}>
                        {irrigationOptions.find(opt => opt.id === selectedLand.irrigation_source)?.label || selectedLand.irrigation_source}
                      </ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="leaf.fill" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.soilType}</ThemedText>
                    {isEditing ? (
                      <TouchableOpacity 
                        style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                        onPress={() => setShowSoilModal(true)}
                      >
                        <ThemedText style={styles.dropdownText}>
                          {soilOptions.find(opt => opt.id === editData?.soil_type)?.label || editData?.soil_type}
                        </ThemedText>
                        <IconSymbol name="chevron.down" size={16} color="#718096" />
                      </TouchableOpacity>
                    ) : (
                      <ThemedText style={styles.infoValue}>
                        {soilOptions.find(opt => opt.id === selectedLand.soil_type)?.label || selectedLand.soil_type}
                      </ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="drop.triangle.fill" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.irrigationType}</ThemedText>
                    {isEditing ? (
                      <TouchableOpacity 
                        style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                        onPress={() => setShowIrrigationTypeModal(true)}
                      >
                        <ThemedText style={styles.dropdownText}>
                          {irrigationTypeOptions.find(opt => opt.id === editData?.irrigation_type)?.label || editData?.irrigation_type}
                        </ThemedText>
                        <IconSymbol name="chevron.down" size={16} color="#718096" />
                      </TouchableOpacity>
                    ) : (
                      <ThemedText style={styles.infoValue}>
                        {irrigationTypeOptions.find(opt => opt.id === selectedLand.irrigation_type)?.label || selectedLand.irrigation_type}
                      </ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="globe" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.state}</ThemedText>
                    {isEditing ? (
                      <TouchableOpacity 
                        style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                        onPress={() => setShowStateModal(true)}
                      >
                        <ThemedText style={styles.dropdownText}>
                          {editData?.state || 'Select State'}
                        </ThemedText>
                        <IconSymbol name="chevron.down" size={16} color="#718096" />
                      </TouchableOpacity>
                    ) : (
                      <ThemedText style={styles.infoValue}>{selectedLand.state}</ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="map" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.district}</ThemedText>
                    {isEditing ? (
                      <TouchableOpacity 
                        style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                        onPress={() => selectedStateId ? setShowDistrictModal(true) : Alert.alert('Please select state first')}
                      >
                        <ThemedText style={styles.dropdownText}>
                          {editData?.district || 'Select District'}
                        </ThemedText>
                        <IconSymbol name="chevron.down" size={16} color="#718096" />
                      </TouchableOpacity>
                    ) : (
                      <ThemedText style={styles.infoValue}>{selectedLand.district}</ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="location" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.taluk}</ThemedText>
                    {isEditing ? (
                      <TouchableOpacity 
                        style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                        onPress={() => selectedDistrictId ? setShowTalukModal(true) : Alert.alert('Please select district first')}
                      >
                        <ThemedText style={styles.dropdownText}>
                          {editData?.taluk || 'Select Taluk'}
                        </ThemedText>
                        <IconSymbol name="chevron.down" size={16} color="#718096" />
                      </TouchableOpacity>
                    ) : (
                      <ThemedText style={styles.infoValue}>{selectedLand.taluk}</ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="location.fill" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.village}</ThemedText>
                    {isEditing ? (
                      <TouchableOpacity 
                        style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                        onPress={() => selectedTalukId ? setShowVillageModal(true) : Alert.alert('Please select taluk first')}
                      >
                        <ThemedText style={styles.dropdownText}>
                          {editData?.village || 'Select Village'}
                        </ThemedText>
                        <IconSymbol name="chevron.down" size={16} color="#718096" />
                      </TouchableOpacity>
                    ) : (
                      <ThemedText style={styles.infoValue}>{selectedLand.village}</ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="number" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.pincode}</ThemedText>
                    {isEditing ? (
                      <TextInput
                        style={styles.editInput}
                        value={editData?.pincode}
                        onChangeText={(text) => setEditData(prev => prev ? {...prev, pincode: text} : null)}
                        keyboardType="numeric"
                      />
                    ) : (
                      <ThemedText style={styles.infoValue}>{selectedLand.pincode}</ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="doc.text" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.pattaNumber}</ThemedText>
                    {isEditing ? (
                      <TextInput
                        style={styles.editInput}
                        value={editData?.patta_number}
                        onChangeText={(text) => setEditData(prev => prev ? {...prev, patta_number: text} : null)}
                      />
                    ) : (
                      <ThemedText style={styles.infoValue}>{selectedLand.patta_number}</ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="tree.fill" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.coconutFarm}</ThemedText>
                    {isEditing ? (
                      <View style={styles.radioGroup}>
                        <TouchableOpacity 
                          style={styles.radioOption}
                          onPress={() => setEditData(prev => prev ? {...prev, coconut_farm: 1} : null)}
                        >
                          <View style={[styles.radioButton, { borderColor: '#48bb78' }]}>
                            {editData?.coconut_farm === 1 && <View style={styles.radioButtonSelected} />}
                          </View>
                          <ThemedText style={styles.radioText}>{labels.yes}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.radioOption}
                          onPress={() => setEditData(prev => prev ? {...prev, coconut_farm: 0} : null)}
                        >
                          <View style={[styles.radioButton, { borderColor: '#48bb78' }]}>
                            {editData?.coconut_farm === 0 && <View style={styles.radioButtonSelected} />}
                          </View>
                          <ThemedText style={styles.radioText}>{labels.no}</ThemedText>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <ThemedText style={styles.infoValue}>{selectedLand.coconut_farm === 1 ? labels.yes : labels.no}</ThemedText>
                    )}
                  </View>
                </View>

                {((selectedLand.coconut_farm === 1 && !isEditing) || (isEditing && editData?.coconut_farm === 1)) && (
                  <>
                    <View style={styles.infoRow}>
                      <IconSymbol name="tree.fill" size={20} color="#48bb78" />
                      <View style={styles.infoText}>
                        <ThemedText style={styles.infoLabel}>{labels.coconutArea}</ThemedText>
                        {isEditing ? (
                          <TextInput
                            style={styles.editInput}
                            value={editData?.coconut_area}
                            onChangeText={(text) => setEditData(prev => prev ? {...prev, coconut_area: text} : null)}
                            keyboardType="numeric"
                          />
                        ) : (
                          <ThemedText style={styles.infoValue}>{selectedLand.coconut_area} {labels.acres}</ThemedText>
                        )}
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <IconSymbol name="number" size={20} color="#48bb78" />
                      <View style={styles.infoText}>
                        <ThemedText style={styles.infoLabel}>{labels.noOfTrees}</ThemedText>
                        {isEditing ? (
                          <TextInput
                            style={styles.editInput}
                            value={String(editData?.no_of_trees || '')}
                            onChangeText={(text) => setEditData(prev => prev ? {...prev, no_of_trees: parseInt(text) || 0} : null)}
                            keyboardType="numeric"
                          />
                        ) : (
                          <ThemedText style={styles.infoValue}>{selectedLand.no_of_trees}</ThemedText>
                        )}
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <IconSymbol name="calendar" size={20} color="#48bb78" />
                      <View style={styles.infoText}>
                        <ThemedText style={styles.infoLabel}>{labels.treesAge}</ThemedText>
                        {isEditing ? (
                          <TextInput
                            style={styles.editInput}
                            value={String(editData?.trees_age || '')}
                            onChangeText={(text) => setEditData(prev => prev ? {...prev, trees_age: parseInt(text) || 0} : null)}
                            keyboardType="numeric"
                          />
                        ) : (
                          <ThemedText style={styles.infoValue}>{selectedLand.trees_age} {labels.years}</ThemedText>
                        )}
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <IconSymbol name="chart.bar.fill" size={20} color="#48bb78" />
                      <View style={styles.infoText}>
                        <ThemedText style={styles.infoLabel}>{labels.estimatedFalling}</ThemedText>
                        {isEditing ? (
                          <TextInput
                            style={styles.editInput}
                            value={String(editData?.estimated_falling || '')}
                            onChangeText={(text) => setEditData(prev => prev ? {...prev, estimated_falling: parseInt(text) || 0} : null)}
                            keyboardType="numeric"
                          />
                        ) : (
                          <ThemedText style={styles.infoValue}>{selectedLand.estimated_falling} {labels.nuts}</ThemedText>
                        )}
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <IconSymbol name="calendar.badge.clock" size={20} color="#48bb78" />
                      <View style={styles.infoText}>
                        <ThemedText style={styles.infoLabel}>{labels.lastHarvest}</ThemedText>
                        {isEditing ? (
                          <TextInput
                            style={styles.editInput}
                            value={editData?.last_harvest_date}
                            onChangeText={(text) => setEditData(prev => prev ? {...prev, last_harvest_date: text} : null)}
                            placeholder="YYYY-MM-DD"
                          />
                        ) : (
                          <ThemedText style={styles.infoValue}>{selectedLand.last_harvest_date}</ThemedText>
                        )}
                      </View>
                    </View>
                  </>
                )}

                <View style={styles.infoRow}>
                  <IconSymbol name="location" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.location}</ThemedText>
                    {isEditing ? (
                      <View style={styles.locationContainer}>
                        <View style={styles.coordinateInputs}>
                          <TextInput
                            style={[styles.editInput, styles.coordinateInput]}
                            value={editData?.land_lattitude}
                            onChangeText={(text) => setEditData(prev => prev ? {...prev, land_lattitude: text} : null)}
                            keyboardType="numeric"
                            placeholder="Latitude"
                          />
                          <TextInput
                            style={[styles.editInput, styles.coordinateInput]}
                            value={editData?.land_longitude}
                            onChangeText={(text) => setEditData(prev => prev ? {...prev, land_longitude: text} : null)}
                            keyboardType="numeric"
                            placeholder="Longitude"
                          />
                        </View>
                        <TouchableOpacity 
                          style={styles.mapButton}
                          onPress={() => setShowMapModal(true)}
                        >
                          <IconSymbol name="map.fill" size={20} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <ThemedText style={styles.infoValue}>
                        {selectedLand.land_lattitude}, {selectedLand.land_longitude}
                      </ThemedText>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.documentsContainer}>
              <ThemedText style={styles.sectionTitle}>{labels.documents}</ThemedText>
              <View style={[styles.infoCard, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
                <View style={styles.documentRow}>
                  <IconSymbol name="photo.fill" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.geoPhoto}</ThemedText>
                    {isEditing ? (
                      <TouchableOpacity 
                        style={styles.uploadButton}
                        onPress={() => setShowImagePicker(true)}
                      >
                        <ThemedText style={styles.uploadButtonText}>Upload Photo</ThemedText>
                      </TouchableOpacity>
                    ) : (
                      selectedLand.geo_photo ? (
                        <View style={styles.imageContainer}>
                          <TouchableOpacity onPress={() => viewImage(`https://tlzwdzgp-9000.inc1.devtunnels.ms/uploads/${selectedLand.geo_photo}`)}>
                            <Image 
                              source={{ uri: `https://tlzwdzgp-9000.inc1.devtunnels.ms/uploads/${selectedLand.geo_photo}` }}
                              style={styles.thumbnailImage}
                              contentFit="cover"
                            />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <ThemedText style={styles.documentText}>No photo uploaded</ThemedText>
                      )
                    )}
                  </View>
                  {editData?.geo_photo && isEditing && (
                    <TouchableOpacity onPress={() => viewImage(editData.geo_photo!)}>
                      <Image 
                        source={{ uri: editData.geo_photo }}
                        style={styles.thumbnailImage}
                        contentFit="cover"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Dropdown Modals */}
          <Modal visible={showOwnershipModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>{labels.ownership}</ThemedText>
                  <TouchableOpacity onPress={() => setShowOwnershipModal(false)}>
                    <IconSymbol name="xmark" size={24} color="#718096" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={ownershipOptions}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#f1f5f9' }]}
                      onPress={() => selectOption('ownership', item.id)}
                    >
                      <ThemedText style={styles.modalItemText}>{item.label}</ThemedText>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          <Modal visible={showIrrigationModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>{labels.irrigation}</ThemedText>
                  <TouchableOpacity onPress={() => setShowIrrigationModal(false)}>
                    <IconSymbol name="xmark" size={24} color="#718096" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={irrigationOptions}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#f1f5f9' }]}
                      onPress={() => selectOption('irrigation', item.id)}
                    >
                      <ThemedText style={styles.modalItemText}>{item.label}</ThemedText>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          <Modal visible={showSoilModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>{labels.soilType}</ThemedText>
                  <TouchableOpacity onPress={() => setShowSoilModal(false)}>
                    <IconSymbol name="xmark" size={24} color="#718096" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={soilOptions}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#f1f5f9' }]}
                      onPress={() => selectOption('soil', item.id)}
                    >
                      <ThemedText style={styles.modalItemText}>{item.label}</ThemedText>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          <Modal visible={showIrrigationTypeModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>{labels.irrigationType}</ThemedText>
                  <TouchableOpacity onPress={() => setShowIrrigationTypeModal(false)}>
                    <IconSymbol name="xmark" size={24} color="#718096" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={irrigationTypeOptions}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#f1f5f9' }]}
                      onPress={() => selectOption('irrigationType', item.id)}
                    >
                      <ThemedText style={styles.modalItemText}>{item.label}</ThemedText>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          {/* Location Dropdown Modals */}
          <Modal visible={showStateModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Select State</ThemedText>
                  <TouchableOpacity onPress={() => setShowStateModal(false)}>
                    <IconSymbol name="xmark" size={24} color="#718096" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={states}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#f1f5f9' }]}
                      onPress={() => selectState(item)}
                    >
                      <ThemedText style={styles.modalItemText}>{item.state}</ThemedText>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          <Modal visible={showDistrictModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Select District</ThemedText>
                  <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                    <IconSymbol name="xmark" size={24} color="#718096" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={districts}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#f1f5f9' }]}
                      onPress={() => selectDistrict(item)}
                    >
                      <ThemedText style={styles.modalItemText}>{item.district_name}</ThemedText>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          <Modal visible={showTalukModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Select Taluk</ThemedText>
                  <TouchableOpacity onPress={() => setShowTalukModal(false)}>
                    <IconSymbol name="xmark" size={24} color="#718096" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={taluks}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#f1f5f9' }]}
                      onPress={() => selectTaluk(item)}
                    >
                      <ThemedText style={styles.modalItemText}>{item.taluk_name}</ThemedText>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          <Modal visible={showVillageModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Select Village</ThemedText>
                  <TouchableOpacity onPress={() => setShowVillageModal(false)}>
                    <IconSymbol name="xmark" size={24} color="#718096" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={villages}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#f1f5f9' }]}
                      onPress={() => selectVillage(item)}
                    >
                      <ThemedText style={styles.modalItemText}>{item.village_name}</ThemedText>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          {/* Google Maps Modal */}
          <Modal visible={showMapModal} animationType="slide">
            <View style={styles.mapModalContainer}>
              <View style={styles.mapHeader}>
                <ThemedText style={styles.mapTitle}>{labels.mapView}</ThemedText>
                <TouchableOpacity onPress={() => { setShowMapModal(false); setSelectedCoordinates(null); }}>
                  <IconSymbol name="xmark" size={24} color="#718096" />
                </TouchableOpacity>
              </View>
              <WebView
                style={styles.map}
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>
                        body { margin: 0; padding: 0; }
                        #map { height: 100vh; width: 100%; }
                        #info { position: absolute; bottom: 10px; left: 10px; right: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                      </style>
                    </head>
                    <body>
                      <div id="map"></div>
                      <div id="info" style="display: none;">
                        <div>Tap on map to select location</div>
                        <div id="coords"></div>
                      </div>
                      <script>
                        let map, currentMarker, selectedMarker;
                        const currentLat = ${editData?.land_lattitude || '12.9716'};
                        const currentLng = ${editData?.land_longitude || '77.5946'};
                        
                        function initMap() {
                          map = new google.maps.Map(document.getElementById('map'), {
                            center: { lat: parseFloat(currentLat), lng: parseFloat(currentLng) },
                            zoom: 15
                          });
                          
                          if (currentLat && currentLng && currentLat !== '12.9716') {
                            currentMarker = new google.maps.Marker({
                              position: { lat: parseFloat(currentLat), lng: parseFloat(currentLng) },
                              map: map,
                              title: 'Current Location',
                              icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                            });
                          }
                          
                          map.addListener('click', function(e) {
                            if (selectedMarker) selectedMarker.setMap(null);
                            selectedMarker = new google.maps.Marker({
                              position: e.latLng,
                              map: map,
                              title: 'Selected Location',
                              icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                            });
                            
                            const lat = e.latLng.lat();
                            const lng = e.latLng.lng();
                            document.getElementById('coords').innerHTML = 'Lat: ' + lat.toFixed(6) + ', Lng: ' + lng.toFixed(6);
                            document.getElementById('info').style.display = 'block';
                            
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              latitude: lat,
                              longitude: lng
                            }));
                          });
                        }
                      </script>
                      <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDVYsG_3cM-lClouzXfvIHCYuJO38SCMCk&callback=initMap"></script>
                    </body>
                    </html>
                  `
                }}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
              {selectedCoordinates && (
                <View style={styles.confirmationContainer}>
                  <View style={styles.confirmationContent}>
                    <ThemedText style={styles.confirmationTitle}>Confirm Location</ThemedText>
                    <ThemedText style={styles.confirmationText}>
                      Latitude: {selectedCoordinates.latitude.toFixed(6)}{"\n"}
                      Longitude: {selectedCoordinates.longitude.toFixed(6)}
                    </ThemedText>
                    <View style={styles.confirmationButtons}>
                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => setSelectedCoordinates(null)}
                      >
                        <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.confirmButton}
                        onPress={confirmLocation}
                      >
                        <ThemedText style={styles.confirmButtonText}>Confirm</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </Modal>

          {/* Image Picker Modal */}
          <Modal visible={showImagePicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Select Photo</ThemedText>
                  <TouchableOpacity onPress={() => setShowImagePicker(false)}>
                    <IconSymbol name="xmark" size={24} color="#718096" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.imagePickerOption} onPress={takePhoto}>
                  <IconSymbol name="camera.fill" size={24} color="#48bb78" />
                  <ThemedText style={styles.imagePickerText}>Take Photo</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imagePickerOption} onPress={pickImageFromGallery}>
                  <IconSymbol name="photo.fill" size={24} color="#48bb78" />
                  <ThemedText style={styles.imagePickerText}>Choose from Gallery</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Image Viewer Modal */}
          <Modal visible={showImageModal} transparent animationType="fade">
            <View style={styles.imageModalOverlay}>
              <TouchableOpacity 
                style={styles.imageModalClose}
                onPress={() => setShowImageModal(false)}
              >
                <IconSymbol name="xmark" size={30} color="#ffffff" />
              </TouchableOpacity>
              {selectedImage && (
                <Image 
                  source={{ uri: selectedImage }}
                  style={styles.fullScreenImage}
                  contentFit="contain"
                />
              )}
            </View>
          </Modal>

        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: labels.landDetails, headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient colors={['#48bb78', '#38a169']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ThemedText style={styles.backArrow}>←</ThemedText>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <ThemedText style={styles.title}>{labels.landDetails}</ThemedText>
            <ThemedText style={styles.subtitle}>{landData.length} lands found</ThemedText>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-land-details')}
          >
            <IconSymbol name="plus.circle.fill" size={20} color="#48bb78" />
            <ThemedText style={styles.addButtonText}>
              {language === 'ta' ? 'சேர்க்கவும்' : 'Add'}
            </ThemedText>
          </TouchableOpacity>

          {landData.map((land) => (
            <TouchableOpacity
              key={land.id}
              style={[styles.landCard, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}
              onPress={() => handleLandSelect(land)}
            >
              <View style={styles.landCardHeader}>
                <View style={styles.landInfo}>
                  <ThemedText style={styles.landTitle}>{land.village}</ThemedText>
                  <ThemedText style={styles.landSubtitle}>{land.total_land_holding} {labels.acres}</ThemedText>
                </View>
                <IconSymbol name="chevron.right" size={20} color="#48bb78" />
              </View>
              
              <View style={styles.landCardContent}>
                <View style={styles.landDetail}>
                  <IconSymbol name="house.fill" size={16} color="#718096" />
                  <ThemedText style={styles.landDetailText}>{land.land_ownership_type}</ThemedText>
                </View>
                <View style={styles.landDetail}>
                  <IconSymbol name="drop.fill" size={16} color="#718096" />
                  <ThemedText style={styles.landDetailText}>{land.irrigation_source}</ThemedText>
                </View>
                {land.coconut_farm === 1 && (
                  <View style={styles.landDetail}>
                    <IconSymbol name="tree.fill" size={16} color="#718096" />
                    <ThemedText style={styles.landDetailText}>{labels.coconutFarm}</ThemedText>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    height: '20%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
  },
  landCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  landCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  landInfo: {
    flex: 1,
  },
  landTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 4,
  },
  landSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  landCardContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  landDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  landDetailText: {
    fontSize: 12,
    color: '#718096',
  },
  infoContainer: {
    marginBottom: 30,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoText: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  editInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    borderBottomWidth: 1,
    borderBottomColor: '#48bb78',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  dropdown: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 24,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#48bb78',
  },
  radioText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a5568',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
  },
  rightButtons: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  editIconButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },

  documentsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 16,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  documentText: {
    fontSize: 14,
    color: '#48bb78',
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#48bb78',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#48bb78',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coordinateInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  coordinateInput: {
    flex: 1,
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#48bb78',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  confirmationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  confirmationContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#4a5568',
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4a5568',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#48bb78',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#48bb78',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    marginTop: 8,
  },
  thumbnailImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  imagePickerText: {
    fontSize: 16,
    marginLeft: 16,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
  },
});