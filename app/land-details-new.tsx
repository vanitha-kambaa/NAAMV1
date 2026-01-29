import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLanguage } from '@/contexts/LanguageContext';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api';
import { apiService, LandDetailsUpdateData } from '@/services/api';
import { Colors } from '@/constants/theme';

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
  
  // Map state
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    loadLandDetails();
  }, []);

  const loadLandDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (!token || !userData) {
        router.replace('/');
        return;
      }

      const user = JSON.parse(userData);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.LAND_DETAILS}/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.status === 'success') {
        setLandData(result.data);
      }
    } catch (error) {
      console.error('Error loading land details:', error);
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
        coconutFarm: 'தென்னை தோட்டம்',
        coconutArea: 'தென்னை பகுதி',
        noOfTrees: 'மரங்களின் எண்ணிக்கை',
        treesAge: 'மரங்களின் வயது',
        estimatedFalling: 'மதிப்பிடப்பட்ட விளைச்சல்',
        lastHarvest: 'கடைசி அறுவடை',
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
        no: 'இல்லை',
        selectOption: 'தேர்ந்தெடுக்கவும்'
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
        no: 'No',
        selectOption: 'Select Option'
      };
    }
  };

  const labels = getLabels();



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

  const handleLandSelect = (land: LandDetails) => {
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
      };

      const success = await apiService.updateLandDetails(editData.id, updateData, token);

      if (success) {
        setSelectedLand(editData);
        setLandData(prev => prev.map(land => land.id === editData!.id ? editData! : land));
        setIsEditing(false);
        Alert.alert('Success', 'Land details updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update land details');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to update land details');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const openDocument = (filename: string) => {
    if (filename) {
      const documentUrl = `${API_CONFIG.UPLOADS_URL}/${filename}`;
      Linking.openURL(documentUrl).catch(() => {
        Alert.alert('Error', 'Unable to open document');
      });
    }
  };

  const renderDropdown = (
    value: string,
    placeholder: string,
    onPress: () => void
  ) => (
    <TouchableOpacity 
      style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
      onPress={onPress}
    >
      <ThemedText style={[styles.dropdownText, { color: value ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
        {value || placeholder}
      </ThemedText>
      <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
    </TouchableOpacity>
  );

  const renderModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: Array<{id: string, label: string}>,
    onSelect: (value: string) => void
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>{title}</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                onPress={() => onSelect(item.label)}
              >
                <ThemedText style={styles.modalItemText}>{item.label}</ThemedText>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

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
    const landLocation = {
      latitude: parseFloat(selectedLand.land_lattitude) || 0,
      longitude: parseFloat(selectedLand.land_longitude) || 0
    };

    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: labels.landDetails, headerShown: false }} />
        <View style={styles.container}>
          <LinearGradient colors={['#48bb78', '#38a169']} style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSelectedLand(null)}>
              <IconSymbol name="chevron.left" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={isEditing ? handleSave : handleEdit}
              >
                <IconSymbol name={isEditing ? "checkmark" : "pencil"} size={20} color="#ffffff" />
                <ThemedText style={styles.buttonText}>{isEditing ? labels.save : labels.edit}</ThemedText>
              </TouchableOpacity>
              
              {isEditing && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <IconSymbol name="xmark" size={20} color="#ffffff" />
                  <ThemedText style={styles.buttonText}>{labels.cancel}</ThemedText>
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
                
                {/* Ownership Type */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{labels.ownership} *</ThemedText>
                  {isEditing ? (
                    renderDropdown(
                      editData?.land_ownership_type || '',
                      labels.selectOption,
                      () => setShowOwnershipModal(true)
                    )
                  ) : (
                    <View style={styles.infoRow}>
                      <IconSymbol name="house.fill" size={20} color="#48bb78" />
                      <View style={styles.infoText}>
                        <ThemedText style={styles.infoValue}>{selectedLand.land_ownership_type}</ThemedText>
                      </View>
                    </View>
                  )}
                </View>

                {/* Total Land */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{labels.totalLand} *</ThemedText>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                      value={editData?.total_land_holding}
                      onChangeText={(text) => setEditData(prev => prev ? {...prev, total_land_holding: text} : null)}
                      placeholder={labels.totalLand}
                      keyboardType="numeric"
                      placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                    />
                  ) : (
                    <View style={styles.infoRow}>
                      <IconSymbol name="map.fill" size={20} color="#48bb78" />
                      <View style={styles.infoText}>
                        <ThemedText style={styles.infoValue}>{selectedLand.total_land_holding} {labels.acres}</ThemedText>
                      </View>
                    </View>
                  )}
                </View>

                {/* Irrigation Source */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{labels.irrigation} *</ThemedText>
                  {isEditing ? (
                    renderDropdown(
                      editData?.irrigation_source || '',
                      labels.selectOption,
                      () => setShowIrrigationModal(true)
                    )
                  ) : (
                    <View style={styles.infoRow}>
                      <IconSymbol name="drop.fill" size={20} color="#48bb78" />
                      <View style={styles.infoText}>
                        <ThemedText style={styles.infoValue}>{selectedLand.irrigation_source}</ThemedText>
                      </View>
                    </View>
                  )}
                </View>

                {/* Soil Type */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{labels.soilType} *</ThemedText>
                  {isEditing ? (
                    renderDropdown(
                      editData?.soil_type || '',
                      labels.selectOption,
                      () => setShowSoilModal(true)
                    )
                  ) : (
                    <View style={styles.infoRow}>
                      <IconSymbol name="leaf.fill" size={20} color="#48bb78" />
                      <View style={styles.infoText}>
                        <ThemedText style={styles.infoValue}>{selectedLand.soil_type}</ThemedText>
                      </View>
                    </View>
                  )}
                </View>

                {/* Irrigation Type */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{labels.irrigationType} *</ThemedText>
                  {isEditing ? (
                    renderDropdown(
                      editData?.irrigation_type || '',
                      labels.selectOption,
                      () => setShowIrrigationTypeModal(true)
                    )
                  ) : (
                    <View style={styles.infoRow}>
                      <IconSymbol name="drop.triangle.fill" size={20} color="#48bb78" />
                      <View style={styles.infoText}>
                        <ThemedText style={styles.infoValue}>{selectedLand.irrigation_type}</ThemedText>
                      </View>
                    </View>
                  )}
                </View>

                {/* Location Fields */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{labels.village} *</ThemedText>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                      value={editData?.village}
                      onChangeText={(text) => setEditData(prev => prev ? {...prev, village: text} : null)}
                      placeholder={labels.village}
                      placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                    />
                  ) : (
                    <View style={styles.infoRow}>
                      <IconSymbol name="location.fill" size={20} color="#48bb78" />
                      <View style={styles.infoText}>
                        <ThemedText style={styles.infoValue}>{selectedLand.village}</ThemedText>
                      </View>
                    </View>
                  )}
                </View>

                {/* Coconut Farm Radio Button */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{labels.coconutFarm} *</ThemedText>
                  {isEditing ? (
                    <View style={styles.radioGroup}>
                      <TouchableOpacity 
                        style={styles.radioOption}
                        onPress={() => setEditData(prev => prev ? {...prev, coconut_farm: 1} : null)}
                      >
                        <View style={[styles.radioButton, { borderColor: editData?.coconut_farm === 1 ? '#48bb78' : '#cbd5e0' }]}>
                          {editData?.coconut_farm === 1 && <View style={styles.radioButtonSelected} />}
                        </View>
                        <ThemedText style={styles.radioText}>{labels.yes}</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.radioOption}
                        onPress={() => setEditData(prev => prev ? {...prev, coconut_farm: 0} : null)}
                      >
                        <View style={[styles.radioButton, { borderColor: editData?.coconut_farm === 0 ? '#48bb78' : '#cbd5e0' }]}>
                          {editData?.coconut_farm === 0 && <View style={styles.radioButtonSelected} />}
                        </View>
                        <ThemedText style={styles.radioText}>{labels.no}</ThemedText>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.infoRow}>
                      <IconSymbol name="tree.fill" size={20} color="#48bb78" />
                      <View style={styles.infoText}>
                        <ThemedText style={styles.infoValue}>{selectedLand.coconut_farm === 1 ? labels.yes : labels.no}</ThemedText>
                      </View>
                    </View>
                  )}
                </View>

                {/* Geolocation */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{labels.latitude}</ThemedText>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                      value={editData?.land_lattitude}
                      onChangeText={(text) => setEditData(prev => prev ? {...prev, land_lattitude: text} : null)}
                      placeholder={labels.latitude}
                      keyboardType="numeric"
                      placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                    />
                  ) : (
                    <View style={styles.infoRow}>
                      <IconSymbol name="location.circle" size={20} color="#48bb78" />
                      <View style={styles.infoText}>
                        <ThemedText style={styles.infoValue}>{selectedLand.land_lattitude}</ThemedText>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{labels.longitude}</ThemedText>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                      value={editData?.land_longitude}
                      onChangeText={(text) => setEditData(prev => prev ? {...prev, land_longitude: text} : null)}
                      placeholder={labels.longitude}
                      keyboardType="numeric"
                      placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                    />
                  ) : (
                    <View style={styles.infoRow}>
                      <IconSymbol name="location.circle" size={20} color="#48bb78" />
                      <View style={styles.infoText}>
                        <ThemedText style={styles.infoValue}>{selectedLand.land_longitude}</ThemedText>
                      </View>
                    </View>
                  )}
                </View>

                {/* Map View Button */}
                {(selectedLand.land_lattitude && selectedLand.land_longitude) && (
                  <TouchableOpacity 
                    style={styles.mapButton}
                    onPress={() => setShowMap(true)}
                  >
                    <IconSymbol name="map.fill" size={20} color="#48bb78" />
                    <ThemedText style={styles.mapButtonText}>{labels.mapView}</ThemedText>
                  </TouchableOpacity>
                )}

              </View>
            </View>
          </ScrollView>

          {/* Modals */}
          {renderModal(
            showOwnershipModal,
            () => setShowOwnershipModal(false),
            labels.ownership,
            ownershipOptions,
            (value) => selectOption('ownership', value)
          )}

          {renderModal(
            showIrrigationModal,
            () => setShowIrrigationModal(false),
            labels.irrigation,
            irrigationOptions,
            (value) => selectOption('irrigation', value)
          )}

          {renderModal(
            showSoilModal,
            () => setShowSoilModal(false),
            labels.soilType,
            soilOptions,
            (value) => selectOption('soil', value)
          )}

          {renderModal(
            showIrrigationTypeModal,
            () => setShowIrrigationTypeModal(false),
            labels.irrigationType,
            irrigationTypeOptions,
            (value) => selectOption('irrigationType', value)
          )}

          {/* Map Modal */}
          <Modal visible={showMap} animationType="slide">
            <SafeAreaView style={styles.mapContainer}>
              <View style={styles.mapHeader}>
                <ThemedText style={styles.mapTitle}>{labels.mapView}</ThemedText>
                <TouchableOpacity onPress={() => setShowMap(false)}>
                  <IconSymbol name="xmark" size={24} color="#48bb78" />
                </TouchableOpacity>
              </View>
              <View style={styles.mapPlaceholder}>
                <IconSymbol name="map.fill" size={60} color="#48bb78" />
                <ThemedText style={styles.mapPlaceholderText}>
                  Map would display here with coordinates:
                </ThemedText>
                <ThemedText style={styles.coordinatesText}>
                  {landLocation.latitude}, {landLocation.longitude}
                </ThemedText>
              </View>
            </SafeAreaView>
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
            <IconSymbol name="chevron.left" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <ThemedText style={styles.title}>{labels.landDetails}</ThemedText>
            <ThemedText style={styles.subtitle}>{landData.length} lands found</ThemedText>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
    padding: 8,
  },
  headerButtons: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    gap: 10,
    zIndex: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    gap: 6,
  },
  editButton: {},
  cancelButton: {
    backgroundColor: 'rgba(255,0,0,0.2)',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
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
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#4a5568',
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dropdown: {
    height: 56,
    borderRadius: 16,
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

  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f0fff4',
    borderRadius: 16,
    gap: 8,
    marginTop: 10,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#48bb78',
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
  mapContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  coordinatesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#48bb78',
  },
});