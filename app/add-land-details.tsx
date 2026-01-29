import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
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
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiService, District, State, Taluk, Village } from '@/services/api';

export default function AddLandDetailsPage() {
  const { language } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const [loading, setLoading] = useState(false);
  
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  
  const [showStateModal, setShowStateModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showTalukModal, setShowTalukModal] = useState(false);
  const [showVillageModal, setShowVillageModal] = useState(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [showIrrigationSourceModal, setShowIrrigationSourceModal] = useState(false);
  const [showSoilTypeModal, setShowSoilTypeModal] = useState(false);
  const [showIrrigationTypeModal, setShowIrrigationTypeModal] = useState(false);
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);
  
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedTalukId, setSelectedTalukId] = useState<number | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    landOwnershipType: '',
    totalLandHolding: '',
    irrigationSource: '',
    soilType: '',
    irrigationType: '',
    location: '',
    state: '',
    district: '',
    taluk: '',
    village: '',
    pincode: '',
    pattaNo: '',
    coconutFarming: '',
    areaUnderCoconut: '',
    numberOfTrees: '',
    averageAgeOfTrees: '',
    estimatedCoconuts: '',
    lastHarvestDate: '',
    geoTaggedPhoto: null as string | null,
    landDocument: null as string | null,
  });

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const statesData = await apiService.getStates();
      setStates(statesData);
    } catch (error) {
      console.error('Error fetching states:', error);
      Alert.alert('Error', 'Failed to load states');
    }
  };

  const selectState = async (state: State) => {
    setFormData(prev => ({ ...prev, state: state.state, district: '' }));
    setSelectedStateId(state.id);
    setShowStateModal(false);
    try {
      const districtsData = await apiService.getDistricts(state.id);
      setDistricts(districtsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load districts');
    }
  };

  const selectDistrict = async (district: District) => {
    setFormData(prev => ({ ...prev, district: district.district_name, taluk: '' }));
    setSelectedDistrictId(district.id);
    setShowDistrictModal(false);
    try {
      const taluksData = await apiService.getTaluks(district.id);
      setTaluks(taluksData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load taluks');
    }
  };

  const selectTaluk = async (taluk: Taluk) => {
    setFormData(prev => ({ ...prev, taluk: taluk.taluk_name, village: '' }));
    setSelectedTalukId(taluk.id);
    setShowTalukModal(false);
    try {
      const villagesData = await apiService.getVillages(selectedDistrictId!, taluk.id);
      setVillages(villagesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load villages');
    }
  };

  const selectVillage = (village: Village) => {
    setFormData(prev => ({ ...prev, village: village.village_name }));
    setSelectedVillageId(village.id);
    setShowVillageModal(false);
  };

  const getLabels = () => {
    if (language === 'ta') {
      return {
        addLandDetails: 'நில விவரங்கள் சேர்க்கவும்',
        landOwnershipType: 'நில உரிமை வகை',
        totalLandHolding: 'மொத்த நிலம்',
        irrigationSource: 'நீர்ப்பாசன மூலம்',
        soilType: 'மண் வகை',
        irrigationType: 'நீர்ப்பாசன வகை',
        locationCoordinates: 'இடம் ஆயத்தொலைவுகள்',
        state: 'மாநிலம்',
        district: 'மாவட்டம்',
        taluk: 'தாலுக்',
        village: 'கிராமம்',
        pincode: 'பின்கோட்',
        pattaNo: 'பட்டா எண்',
        coconutFarming: 'தென்னை விவசாயம்',
        coconutArea: 'தென்னை பகுதி',
        numberOfTrees: 'மரங்களின் எண்ணிக்கை',
        averageAgeOfTrees: 'மரங்களின் சராசரி வயது',
        estimatedCoconuts: 'மதிப்பிடப்பட்ட தேங்காய்கள்',
        lastHarvestDate: 'கடைசி அறுவடை தேதி',
        geoTaggedPhoto: 'புவியியல் குறிக்கப்பட்ட புகைப்படம்',
        landDocument: 'நில ஆவணம்',
        owned: 'சொந்தம்',
        leased: 'குத்தகை',
        jointOwnership: 'கூட்டு உரிமை',
        borewell: 'போர்வெல்',
        canal: 'கால்வாய்',
        sandy: 'மணல்',
        loamy: 'களிமண்',
        clayey: 'களிமண்',
        laterite: 'லேட்டரைட்',
        drip: 'துளி',
        manual: 'கைமுறை',
        yes: 'ஆம்',
        no: 'இல்லை',
        selectOwnership: 'உரிமையைத் தேர்ந்தெடுக்கவும்',
        selectIrrigationSource: 'நீர்ப்பாசன மூலத்தைத் தேர்ந்தெடுக்கவும்',
        selectSoilType: 'மண் வகையைத் தேர்ந்தெடுக்கவும்',
        selectIrrigationType: 'நீர்ப்பாசன வகையைத் தேர்ந்தெடுக்கவும்',
        selectState: 'மாநிலத்தைத் தேர்ந்தெடுக்கவும்',
        selectDistrict: 'மாவட்டத்தைத் தேர்ந்தெடுக்கவும்',
        selectTaluk: 'தாலுக்கைத் தேர்ந்தெடுக்கவும்',
        selectVillage: 'கிராமத்தைத் தேர்ந்தெடுக்கவும்',
        selectHarvestDate: 'அறுவடை தேதியைத் தேர்ந்தெடுக்கவும்',
        enterTotalLand: 'மொத்த நிலத்தை உள்ளிடவும்',
        enterCoordinates: 'ஆயத்தொலைவுகளை உள்ளிடவும்',
        enterPincode: 'பின்கோட்டை உள்ளிடவும்',
        enterPattaNumber: 'பட்டா எண்ணை உள்ளிடவும்',
        enterAreaAcres: 'பகுதியை ஏக்கரில் உள்ளிடவும்',
        enterNumberTrees: 'மரங்களின் எண்ணிக்கையை உள்ளிடவும்',
        enterAverageAge: 'சராசரி வயதை உள்ளிடவும்',
        enterEstimatedNumber: 'மதிப்பிடப்பட்ட எண்ணிக்கையை உள்ளிடவும்',
        takePhoto: 'புகைப்படம் எடுக்கவும்',
        choosePhoto: 'புகைப்படத்தைத் தேர்ந்தெடுக்கவும்',
        farmPhotoUploaded: 'பண்ணை புகைப்படம் பதிவேற்றப்பட்டது',
        landDocumentUploaded: 'நில ஆவணம் பதிவேற்றப்பட்டது',
        submit: 'சமர்ப்பிக்கவும்',
        cancel: 'ரத்து செய்யவும்',
        back: 'பின்செல்',
        required: 'தேவையான',
        optional: 'விருப்பமான',
        coconutFarmingDetails: 'தென்னை விவசாய விவரங்கள்'
      };
    } else {
      return {
        addLandDetails: 'Add Land Details',
        landOwnershipType: 'Land Ownership Type',
        totalLandHolding: 'Total Land Holding',
        irrigationSource: 'Irrigation Source',
        soilType: 'Soil Type',
        irrigationType: 'Irrigation Type',
        locationCoordinates: 'Location Coordinates',
        state: 'State',
        district: 'District',
        taluk: 'Taluk',
        village: 'Village',
        pincode: 'Pincode',
        pattaNo: 'Patta Number',
        coconutFarming: 'Coconut Farming',
        coconutArea: 'Coconut Area',
        numberOfTrees: 'Number of Trees',
        averageAgeOfTrees: 'Average Age of Trees',
        estimatedCoconuts: 'Estimated Coconuts',
        lastHarvestDate: 'Last Harvest Date',
        geoTaggedPhoto: 'Geo Tagged Photo',
        landDocument: 'Land Document',
        owned: 'Owned',
        leased: 'Leased',
        jointOwnership: 'Joint Ownership',
        borewell: 'Borewell',
        canal: 'Canal',
        sandy: 'Sandy',
        loamy: 'Loamy',
        clayey: 'Clayey',
        laterite: 'Laterite',
        drip: 'Drip',
        manual: 'Manual',
        yes: 'Yes',
        no: 'No',
        selectOwnership: 'Select Ownership',
        selectIrrigationSource: 'Select Irrigation Source',
        selectSoilType: 'Select Soil Type',
        selectIrrigationType: 'Select Irrigation Type',
        selectState: 'Select State',
        selectDistrict: 'Select District',
        selectTaluk: 'Select Taluk',
        selectVillage: 'Select Village',
        selectHarvestDate: 'Select Harvest Date',
        enterTotalLand: 'Enter total land',
        enterCoordinates: 'Enter coordinates',
        enterPincode: 'Enter pincode',
        enterPattaNumber: 'Enter patta number',
        enterAreaAcres: 'Enter area in acres',
        enterNumberTrees: 'Enter number of trees',
        enterAverageAge: 'Enter average age',
        enterEstimatedNumber: 'Enter estimated number',
        takePhoto: 'Take Photo',
        choosePhoto: 'Choose Photo',
        farmPhotoUploaded: 'Farm photo uploaded',
        landDocumentUploaded: 'Land document uploaded',
        submit: 'Submit',
        cancel: 'Cancel',
        back: 'Back',
        required: 'Required',
        optional: 'Optional',
        coconutFarmingDetails: 'Coconut Farming Details'
      };
    }
  };

  const labels = getLabels();

  const ownershipTypes = [labels.owned, labels.leased, labels.jointOwnership];
  const irrigationSources = [labels.borewell, labels.canal];
  const soilTypes = [labels.sandy, labels.loamy, labels.clayey, labels.laterite];
  const irrigationTypes = [labels.drip, labels.manual];

  const updateField = (field: string, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImagePicker = async (field: string, source: 'camera' | 'gallery') => {
    try {
      let result;
      
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          return;
        }
        
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Gallery permission is required to select photos.');
          return;
        }
        
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }
      
      if (!result.canceled && result.assets[0]) {
        updateField(field, result.assets[0].uri);
        Alert.alert('Success', 'Image uploaded successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleHarvestDateChange = (event: any, selectedDate?: Date) => {
    setShowHarvestDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString('en-GB');
      updateField('lastHarvestDate', formattedDate);
    }
  };

  const validateForm = () => {
    const basicFields = formData.landOwnershipType && 
                       formData.totalLandHolding && 
                       formData.irrigationSource && 
                       formData.soilType && 
                       formData.irrigationType && 
                       formData.location && 
                       formData.state && 
                       formData.district && 
                       formData.taluk && 
                       formData.village && 
                       formData.pincode && 
                       formData.pattaNo && 
                       formData.coconutFarming;
    
    if (formData.coconutFarming === 'yes') {
      return basicFields && 
             formData.areaUnderCoconut && 
             formData.numberOfTrees && 
             formData.averageAgeOfTrees && 
             formData.estimatedCoconuts && 
             formData.lastHarvestDate;
    }
    return basicFields;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (!token || !userData) {
        router.replace('/');
        return;
      }

      const user = JSON.parse(userData);
      const formDataToSend = new FormData();
      
      formDataToSend.append('user_id', user.id.toString());
      formDataToSend.append('land_ownership_type', formData.landOwnershipType);
      formDataToSend.append('total_land_holding', formData.totalLandHolding);
      formDataToSend.append('irrigation_source', formData.irrigationSource);
      formDataToSend.append('soil_type', formData.soilType);
      formDataToSend.append('irrigation_type', formData.irrigationType);
      
      const [lat, lng] = formData.location.split(', ');
      formDataToSend.append('land_lattitude', lat);
      formDataToSend.append('land_longitude', lng);
      
      formDataToSend.append('village', formData.village);
      formDataToSend.append('taluk', formData.taluk);
      formDataToSend.append('district', formData.district);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('pincode', formData.pincode);
      formDataToSend.append('patta_number', formData.pattaNo);
      formDataToSend.append('coconut_farm', formData.coconutFarming === 'yes' ? '1' : '0');
      
      if (formData.coconutFarming === 'yes') {
        formDataToSend.append('coconut_area', formData.areaUnderCoconut);
        formDataToSend.append('no_of_trees', formData.numberOfTrees);
        formDataToSend.append('trees_age', formData.averageAgeOfTrees);
        formDataToSend.append('estimated_falling', formData.estimatedCoconuts);
        
        const harvestDateParts = formData.lastHarvestDate.split('/');
        const formattedHarvestDate = `${harvestDateParts[2]}-${harvestDateParts[1].padStart(2, '0')}-${harvestDateParts[0].padStart(2, '0')}`;
        formDataToSend.append('last_harvest_date', formattedHarvestDate);
      }
      
      if (formData.geoTaggedPhoto) {
        formDataToSend.append('geo_photo', {
          uri: formData.geoTaggedPhoto,
          type: 'image/jpeg',
          name: 'geo_photo.jpg'
        } as any);
      }

      if (formData.landDocument) {
        formDataToSend.append('land_document', {
          uri: formData.landDocument,
          type: 'image/jpeg',
          name: 'land_document.jpg'
        } as any);
      }

      const payloadData = {
        user_id: user.id.toString(),
        land_ownership_type: formData.landOwnershipType,
        total_land_holding: formData.totalLandHolding,
        irrigation_source: formData.irrigationSource,
        soil_type: formData.soilType,
        irrigation_type: formData.irrigationType,
        land_lattitude: formData.location.split(', ')[0],
        land_longitude: formData.location.split(', ')[1],
        village: formData.village,
        taluk: formData.taluk,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        patta_number: formData.pattaNo,
        coconut_farm: formData.coconutFarming === 'yes' ? '1' : '0',
        coconut_area: formData.coconutFarming === 'yes' ? formData.areaUnderCoconut : '',
        no_of_trees: formData.coconutFarming === 'yes' ? formData.numberOfTrees : '',
        trees_age: formData.coconutFarming === 'yes' ? formData.averageAgeOfTrees : '',
        estimated_falling: formData.coconutFarming === 'yes' ? formData.estimatedCoconuts : '',
        last_harvest_date: formData.coconutFarming === 'yes' ? formData.lastHarvestDate : '',
        geo_photo: formData.geoTaggedPhoto ? 'file_attached' : 'no_file',
        land_document: formData.landDocument ? 'file_attached' : 'no_file'
      };

      console.log('Add Land Details API - Request:', {
        url: `${API_CONFIG.BASE_URL}/api/users/land-details`,
        userId: user.id,
        method: 'POST',
        headers: { Authorization: `Bearer ${token?.substring(0, 20)}...` },
        payload: payloadData,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/land-details`, {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      console.log('Add Land Details API - Response:', {
        status: response.status,
        statusText: response.statusText,
        responseData: result,
        timestamp: new Date().toISOString()
      });

      if (response.ok && result.status === 'success') {
        console.log('=== ADD LAND DETAILS SUCCESS ===');
        console.log('Request Payload:', payloadData);
        console.log('Response Data:', result);
        console.log('Land Details Added:', {
          ownershipType: formData.landOwnershipType,
          totalLand: formData.totalLandHolding,
          location: formData.location,
          village: formData.village,
          coconutFarming: formData.coconutFarming,
          timestamp: new Date().toISOString()
        });
        console.log('=== END ADD LAND DETAILS SUCCESS ===');
        Alert.alert('Success', 'Land details added successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        console.log('=== ADD LAND DETAILS FAILED ===');
        console.log('Request Payload:', payloadData);
        console.log('Response Data:', result);
        console.log('=== END ADD LAND DETAILS FAILED ===');
        Alert.alert('Error', result.message || 'Failed to add land details');
      }
    } catch (error) {
      console.error('Add Land Details API - Error:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      Alert.alert('Error', 'Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: labels.addLandDetails, headerShown: false }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <LinearGradient colors={['#48bb78', '#38a169']} style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ThemedText style={styles.backArrow}>←</ThemedText>
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <ThemedText style={styles.title}>{language === 'ta' ? 'சேர்க்கவும்' : 'Add'}</ThemedText>
            </View>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.landOwnershipType} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowOwnershipModal(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.landOwnershipType ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.landOwnershipType || labels.selectOwnership}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.totalLandHolding} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.totalLandHolding}
                onChangeText={(value) => updateField('totalLandHolding', value)}
                placeholder={labels.enterTotalLand}
                keyboardType="numeric"
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.irrigationSource} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowIrrigationSourceModal(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.irrigationSource ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.irrigationSource || labels.selectIrrigationSource}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.soilType} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowSoilTypeModal(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.soilType ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.soilType || labels.selectSoilType}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.irrigationType} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowIrrigationTypeModal(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.irrigationType ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.irrigationType || labels.selectIrrigationType}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.locationCoordinates} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.location}
                onChangeText={(value) => updateField('location', value)}
                placeholder={labels.enterCoordinates}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.state} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowStateModal(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.state ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.state || labels.selectState}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.district} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => selectedStateId ? setShowDistrictModal(true) : Alert.alert('Please select state first')}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.district ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.district || labels.selectDistrict}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.taluk} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => selectedDistrictId ? setShowTalukModal(true) : Alert.alert('Please select district first')}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.taluk ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.taluk || labels.selectTaluk}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.village} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => selectedTalukId ? setShowVillageModal(true) : Alert.alert('Please select taluk first')}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.village ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.village || labels.selectVillage}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.pincode} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.pincode}
                onChangeText={(value) => updateField('pincode', value)}
                placeholder={labels.enterPincode}
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.geoTaggedPhoto}</ThemedText>
              <View style={styles.fileUploadContainer}>
                {formData.geoTaggedPhoto ? (
                  <View style={[styles.uploadedFile, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f0fff4' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#48bb78" />
                    <ThemedText style={styles.uploadedText}>{labels.farmPhotoUploaded}</ThemedText>
                    <TouchableOpacity onPress={() => updateField('geoTaggedPhoto', null)}>
                      <IconSymbol name="xmark.circle.fill" size={20} color="#e53e3e" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadOptions}>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('geoTaggedPhoto', 'camera')}
                    >
                      <IconSymbol name="camera.fill" size={24} color="#48bb78" />
                      <ThemedText style={styles.uploadButtonText}>{labels.takePhoto}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('geoTaggedPhoto', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#48bb78" />
                      <ThemedText style={styles.uploadButtonText}>{labels.choosePhoto}</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.landDocument}</ThemedText>
              <View style={styles.fileUploadContainer}>
                {formData.landDocument ? (
                  <View style={[styles.uploadedFile, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f0fff4' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#48bb78" />
                    <ThemedText style={styles.uploadedText}>{labels.landDocumentUploaded}</ThemedText>
                    <TouchableOpacity onPress={() => updateField('landDocument', null)}>
                      <IconSymbol name="xmark.circle.fill" size={20} color="#e53e3e" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadOptions}>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('landDocument', 'camera')}
                    >
                      <IconSymbol name="camera.fill" size={24} color="#48bb78" />
                      <ThemedText style={styles.uploadButtonText}>{labels.takePhoto}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('landDocument', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#48bb78" />
                      <ThemedText style={styles.uploadButtonText}>{labels.choosePhoto}</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.pattaNo} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.pattaNo}
                onChangeText={(value) => updateField('pattaNo', value)}
                placeholder={labels.enterPattaNumber}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.coconutFarming} *</ThemedText>
              <View style={styles.radioGroup}>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => updateField('coconutFarming', 'yes')}
                >
                  <View style={[styles.radioButton, { borderColor: formData.coconutFarming === 'yes' ? '#48bb78' : '#cbd5e0' }]}>
                    {formData.coconutFarming === 'yes' && <View style={styles.radioButtonSelected} />}
                  </View>
                  <ThemedText style={styles.radioText}>{labels.yes}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => updateField('coconutFarming', 'no')}
                >
                  <View style={[styles.radioButton, { borderColor: formData.coconutFarming === 'no' ? '#48bb78' : '#cbd5e0' }]}>
                    {formData.coconutFarming === 'no' && <View style={styles.radioButtonSelected} />}
                  </View>
                  <ThemedText style={styles.radioText}>{labels.no}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {formData.coconutFarming === 'yes' && (
              <View>
                <ThemedText style={[styles.sectionTitle, { fontSize: 18, marginTop: 20, marginBottom: 16 }]}>{labels.coconutFarmingDetails}</ThemedText>
                
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{labels.coconutArea} *</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                    value={formData.areaUnderCoconut}
                    onChangeText={(value) => updateField('areaUnderCoconut', value)}
                    placeholder={labels.enterAreaAcres}
                    keyboardType="numeric"
                    placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{labels.numberOfTrees} *</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                    value={formData.numberOfTrees}
                    onChangeText={(value) => updateField('numberOfTrees', value)}
                    placeholder={labels.enterNumberTrees}
                    keyboardType="numeric"
                    placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{labels.averageAgeOfTrees} *</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                    value={formData.averageAgeOfTrees}
                    onChangeText={(value) => updateField('averageAgeOfTrees', value)}
                    placeholder={labels.enterAverageAge}
                    keyboardType="numeric"
                    placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{labels.estimatedCoconuts} *</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                    value={formData.estimatedCoconuts}
                    onChangeText={(value) => updateField('estimatedCoconuts', value)}
                    placeholder={labels.enterEstimatedNumber}
                    keyboardType="numeric"
                    placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{labels.lastHarvestDate} *</ThemedText>
                  <TouchableOpacity 
                    style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                    onPress={() => setShowHarvestDatePicker(true)}
                  >
                    <ThemedText style={[styles.dropdownText, { color: formData.lastHarvestDate ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                      {formData.lastHarvestDate || labels.selectHarvestDate}
                    </ThemedText>
                    <IconSymbol name="calendar" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.cancelButton]} 
            onPress={() => router.back()}
          >
            <ThemedText style={styles.cancelButtonText}>{labels.cancel}</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, { opacity: validateForm() ? 1 : 0.5 }]} 
            onPress={validateForm() ? handleSubmit : undefined}
            disabled={!validateForm() || loading}
          >
            <LinearGradient colors={['#48bb78', '#38a169']} style={styles.buttonGradient}>
              <ThemedText style={styles.submitButtonText}>
                {loading ? 'Submitting...' : labels.submit}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* All Modals */}
        <Modal visible={showOwnershipModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{labels.selectOwnership}</ThemedText>
                <TouchableOpacity onPress={() => setShowOwnershipModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={ownershipTypes}
                keyExtractor={(item, index) => `ownership-${index}-${item}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                    onPress={() => {
                      updateField('landOwnershipType', item);
                      setShowOwnershipModal(false);
                    }}
                  >
                    <ThemedText style={styles.modalItemText}>{item}</ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={showIrrigationSourceModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{labels.selectIrrigationSource}</ThemedText>
                <TouchableOpacity onPress={() => setShowIrrigationSourceModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={irrigationSources}
                keyExtractor={(item, index) => `irrigation-source-${index}-${item}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                    onPress={() => {
                      updateField('irrigationSource', item);
                      setShowIrrigationSourceModal(false);
                    }}
                  >
                    <ThemedText style={styles.modalItemText}>{item}</ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={showSoilTypeModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{labels.selectSoilType}</ThemedText>
                <TouchableOpacity onPress={() => setShowSoilTypeModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={soilTypes}
                keyExtractor={(item, index) => `soil-${index}-${item}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                    onPress={() => {
                      updateField('soilType', item);
                      setShowSoilTypeModal(false);
                    }}
                  >
                    <ThemedText style={styles.modalItemText}>{item}</ThemedText>
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
                <ThemedText style={styles.modalTitle}>{labels.selectIrrigationType}</ThemedText>
                <TouchableOpacity onPress={() => setShowIrrigationTypeModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={irrigationTypes}
                keyExtractor={(item, index) => `irrigation-type-${index}-${item}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                    onPress={() => {
                      updateField('irrigationType', item);
                      setShowIrrigationTypeModal(false);
                    }}
                  >
                    <ThemedText style={styles.modalItemText}>{item}</ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={showStateModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{labels.selectState}</ThemedText>
                <TouchableOpacity onPress={() => setShowStateModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={states}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
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
                <ThemedText style={styles.modalTitle}>{labels.selectDistrict}</ThemedText>
                <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={districts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
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
                <ThemedText style={styles.modalTitle}>{labels.selectTaluk}</ThemedText>
                <TouchableOpacity onPress={() => setShowTalukModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={taluks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
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
                <ThemedText style={styles.modalTitle}>{labels.selectVillage}</ThemedText>
                <TouchableOpacity onPress={() => setShowVillageModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={villages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                    onPress={() => selectVillage(item)}
                  >
                    <ThemedText style={styles.modalItemText}>{item.village_name}</ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {showHarvestDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={handleHarvestDateChange}
            maximumDate={new Date()}
          />
        )}

      </View>
      </KeyboardAvoidingView>
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
  card: {
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: '#4a5568',
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
  fileUploadContainer: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  uploadedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  uploadedText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#48bb78',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#48bb78',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#48bb78',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    borderRadius: 16,
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
});