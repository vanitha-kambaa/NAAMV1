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
  View,
} from 'react-native';

import { apiService, District, State, Taluk, Village } from '@/services/api';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NAMMemberRegister() {
  const [activeTab, setActiveTab] = useState(0);
  const { t, language, setLanguage } = useLanguage();

  const TABS = [
    { id: 'basic', title: t('basic_info'), icon: 'person.crop.circle.fill' },
    { id: 'documents', title: t('documents'), icon: 'doc.text.fill' },
  ];
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showTalukModal, setShowTalukModal] = useState(false);
  const [showVillageModal, setShowVillageModal] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedTalukId, setSelectedTalukId] = useState<number | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    alternateMobileNumber: '',
    emailId: '',
    address: '',
    village: '',
    taluk: '',
    district: '',
    state: '',
    pincode: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    aadhaarCard: null,
    panCard: null,
    passportPhoto: null,
  });

  const colorScheme = useColorScheme() ?? 'light';
  const isDarkMode = colorScheme === 'dark';
  const headerGradient = isDarkMode
    ? (['#062c4c', '#0b4d68'] as const)
    : (['#4facfe', '#00f2fe'] as const);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const statesData = await apiService.getStates();
      setStates(statesData);
    } catch (error) {
      console.error('❌ Error fetching states:', error);
      Alert.alert('Error', 'Failed to load states');
    } finally {
      setLoadingStates(false);
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
      console.error('❌ Error fetching districts:', error);
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
      console.error('❌ Error fetching taluks:', error);
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
      console.error('❌ Error fetching villages:', error);
      Alert.alert('Error', 'Failed to load villages');
    }
  };

  const selectVillage = (village: Village) => {
    setFormData(prev => ({ ...prev, village: village.village_name }));
    setSelectedVillageId(village.id);
    setShowVillageModal(false);
  };

  const handleNext = () => {
    if (activeTab < TABS.length - 1) {
      setActiveTab(activeTab + 1);
    }
  };

  const handlePrevious = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('🚀 Starting NAM member registration submission...');
    
    try {
      const formDataToSend = new FormData();
      
      // Basic info
      console.log('📝 Adding basic info to form data...');
      formDataToSend.append('fullname', formData.fullName);
      formDataToSend.append('mobile_no', formData.mobileNumber);
      formDataToSend.append('alternate_mobile_no', formData.alternateMobileNumber || '');
      formDataToSend.append('email_id', formData.emailId || '');
      formDataToSend.append('address', formData.address);
      formDataToSend.append('state', selectedStateId?.toString() || '');
      formDataToSend.append('district', selectedDistrictId?.toString() || '');
      formDataToSend.append('taluk', selectedTalukId?.toString() || '');
      formDataToSend.append('village', selectedVillageId?.toString() || '');
      formDataToSend.append('pincode', formData.pincode);
      formDataToSend.append('gender', formData.gender.toLowerCase());
      formDataToSend.append('dob', formData.dateOfBirth);
      formDataToSend.append('age', formData.age);
      
      console.log('📋 NAM Member form data summary:', {
        fullname: formData.fullName,
        mobile_no: formData.mobileNumber,
        state_id: selectedStateId,
        district_id: selectedDistrictId,
        taluk_id: selectedTalukId,
        village: formData.village,
        gender: formData.gender,
        dob: formData.dateOfBirth
      });
      
      // Documents
      console.log('📄 Adding documents to form data...');
      if (formData.aadhaarCard) {
        console.log('✅ Adding Aadhaar card');
        formDataToSend.append('aadhar_copy', {
          uri: formData.aadhaarCard,
          type: 'image/jpeg',
          name: 'aadhar.jpg'
        } as any);
      }
      if (formData.panCard) {
        console.log('✅ Adding PAN card');
        formDataToSend.append('pan_copy', {
          uri: formData.panCard,
          type: 'image/jpeg',
          name: 'pan.jpg'
        } as any);
      }
      if (formData.passportPhoto) {
        console.log('✅ Adding passport photo');
        formDataToSend.append('passport_photo', {
          uri: formData.passportPhoto,
          type: 'image/jpeg',
          name: 'passport.jpg'
        } as any);
      }
      
      formDataToSend.append('role_id', '5'); // NAM Member role
      
      // Log FormData contents
      console.log('📦 NAM Member FormData payload contents:');
      for (let [key, value] of formDataToSend.entries()) {
        if (typeof value === 'object' && value.uri) {
          console.log(`  ${key}: [FILE] ${value.name} (${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      console.log('🌐 Sending registration request to API...');
      console.log('📍 API URL: http://65.0.100.65:8000/api/users/register');
      console.log('📤 Request method: POST');
      console.log('📋 Request headers: Content-Type: multipart/form-data');
      
      const registerResponse = await fetch('http://65.0.100.65:8000/api/users/register', {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('📡 Registration response status:', registerResponse.status);
      console.log('📡 Registration response statusText:', registerResponse.statusText);
      console.log('📡 Registration response ok:', registerResponse.ok);
      console.log('📡 Registration response headers:');
      for (let [key, value] of registerResponse.headers.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      const responseText = await registerResponse.text();
      console.log('📄 Raw response text:', responseText);
      
      let registerResult;
      try {
        registerResult = JSON.parse(responseText);
        console.log('📋 Parsed registration response data:', registerResult);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        console.log('📄 Response was not valid JSON, raw text:', responseText);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      if (registerResponse.ok && registerResult.status === 'success') {
        console.log('✅ NAM Member registration completed successfully!');
        Alert.alert(t('registration_successful'), t('welcome_naam'), [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        console.error('❌ NAM Member registration failed:', registerResult);
        Alert.alert(t('error'), `Registration failed: ${registerResult.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 Network error during NAM Member registration:', error);
      Alert.alert(t('error'), `Network error occurred: ${error.message}`);
    }
  };

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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString('en-GB');
      const age = new Date().getFullYear() - selectedDate.getFullYear();
      updateField('dateOfBirth', formattedDate);
      updateField('age', age.toString());
    }
  };

  const validateTab = (tabIndex: number) => {
    switch (tabIndex) {
      case 0: // Basic Info
        return formData.fullName && formData.mobileNumber && formData.address && 
               formData.state && formData.district && formData.taluk && formData.village && 
               formData.pincode && formData.gender && formData.dateOfBirth;
      case 1: // Documents
        return formData.aadhaarCard && formData.passportPhoto;
      default:
        return false;
    }
  };

  const isNextEnabled = validateTab(activeTab);

  const canNavigateToTab = (targetTab: number) => {
    for (let i = 0; i < targetTab; i++) {
      if (!validateTab(i)) {
        return false;
      }
    }
    return true;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <View>
            <ThemedText style={styles.sectionTitle}>{t('basic_information')}</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('full_name')} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.fullName}
                onChangeText={(value) => updateField('fullName', value)}
                placeholder={t('enter_full_name')}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('mobile_number')} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.mobileNumber}
                onChangeText={(value) => updateField('mobileNumber', value)}
                placeholder={t('enter_mobile_number')}
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('alternate_mobile')}</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.alternateMobileNumber}
                onChangeText={(value) => updateField('alternateMobileNumber', value)}
                placeholder={t('enter_mobile_number')}
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('email_id')}</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.emailId}
                onChangeText={(value) => updateField('emailId', value)}
                placeholder={t('enter_email')}
                keyboardType="email-address"
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('address')} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text, height: 80 }]}
                value={formData.address}
                onChangeText={(value) => updateField('address', value)}
                placeholder={t('enter_address')}
                multiline
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>
             <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('state')} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowStateModal(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.state ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.state || t('select_state')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('district')} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => selectedStateId ? setShowDistrictModal(true) : Alert.alert(t('select_state_first'))}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.district ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.district || t('select_district')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('taluk_block')} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => selectedDistrictId ? setShowTalukModal(true) : Alert.alert(t('select_district_first'))}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.taluk ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.taluk || t('select_taluk')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>


            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('village_panchayat')} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => selectedTalukId ? setShowVillageModal(true) : Alert.alert(t('select_taluk_first'))}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.village ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.village || t('select_village')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

          
           

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('pincode')} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.pincode}
                onChangeText={(value) => updateField('pincode', value)}
                placeholder={t('enter_pincode')}
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('gender')} *</ThemedText>
              <View style={styles.radioGroup}>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => updateField('gender', 'Male')}
                >
                  <View style={[styles.radioButton, { borderColor: formData.gender === 'Male' ? '#4facfe' : '#cbd5e0' }]}>
                    {formData.gender === 'Male' && <View style={[styles.radioButtonSelected, { backgroundColor: '#4facfe' }]} />}
                  </View>
                  <ThemedText style={styles.radioText}>{t('male')}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => updateField('gender', 'Female')}
                >
                  <View style={[styles.radioButton, { borderColor: formData.gender === 'Female' ? '#4facfe' : '#cbd5e0' }]}>
                    {formData.gender === 'Female' && <View style={[styles.radioButtonSelected, { backgroundColor: '#4facfe' }]} />}
                  </View>
                  <ThemedText style={styles.radioText}>{t('female')}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('date_of_birth')} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowDatePicker(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.dateOfBirth ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.dateOfBirth || t('select_dob')}
                </ThemedText>
                <IconSymbol name="calendar" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('age')} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.age}
                onChangeText={(value) => updateField('age', value)}
                placeholder={t('enter_age')}
                keyboardType="numeric"
                maxLength={3}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>
          </View>
        );
      case 1:
        return (
          <View>
            <ThemedText style={styles.sectionTitle}>{t('documents')}</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('aadhar_card')} *</ThemedText>
              <View style={styles.fileUploadContainer}>
                {formData.aadhaarCard ? (
                  <View style={[styles.uploadedFile, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f0fff4' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#4facfe" />
                    <ThemedText style={[styles.uploadedText, { color: '#4facfe' }]}>{t('aadhar_uploaded')}</ThemedText>
                    <TouchableOpacity onPress={() => updateField('aadhaarCard', null)}>
                      <IconSymbol name="xmark.circle.fill" size={20} color="#e53e3e" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadOptions}>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('aadhaarCard', 'camera')}
                    >
                      <IconSymbol name="camera.fill" size={24} color="#4facfe" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('aadhaarCard', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#4facfe" />
                      <ThemedText style={styles.uploadButtonText}>{t('choose_photo')}</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('pan_card')}</ThemedText>
              <View style={styles.fileUploadContainer}>
                {formData.panCard ? (
                  <View style={[styles.uploadedFile, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f0fff4' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#4facfe" />
                    <ThemedText style={[styles.uploadedText, { color: '#4facfe' }]}>{t('pan_uploaded')}</ThemedText>
                    <TouchableOpacity onPress={() => updateField('panCard', null)}>
                      <IconSymbol name="xmark.circle.fill" size={20} color="#e53e3e" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadOptions}>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('panCard', 'camera')}
                    >
                      <IconSymbol name="camera.fill" size={24} color="#4facfe" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('panCard', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#4facfe" />
                      <ThemedText style={styles.uploadButtonText}>{t('choose_photo')}</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('passport_photo')} *</ThemedText>
              <View style={styles.fileUploadContainer}>
                {formData.passportPhoto ? (
                  <View style={[styles.uploadedFile, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f0fff4' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#4facfe" />
                    <ThemedText style={[styles.uploadedText, { color: '#4facfe' }]}>{t('passport_uploaded')}</ThemedText>
                    <TouchableOpacity onPress={() => updateField('passportPhoto', null)}>
                      <IconSymbol name="xmark.circle.fill" size={20} color="#e53e3e" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadOptions}>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('passportPhoto', 'camera')}
                    >
                      <IconSymbol name="camera.fill" size={24} color="#4facfe" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('passportPhoto', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#4facfe" />
                      <ThemedText style={styles.uploadButtonText}>{t('choose_photo')}</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: t('nam_member_registration'), headerShown: false }} />
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#031123' : '#f1f9ff' }]}>
        <LinearGradient colors={headerGradient} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.languageButton}
            onPress={() => setLanguage(language === 'ta' ? 'en' : 'ta')}
          >
            <ThemedText style={styles.languageText}>
              {language === 'ta' ? 'English' : 'தமிழ்'}
            </ThemedText>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.heroIconWrapper}>
              <View style={styles.heroIconGlow} />
              <IconSymbol size={62} name="person.3.fill" color="#ffffff" />
            </View>
            <ThemedText style={styles.title}>{t('nam_member_registration')}</ThemedText>
            <ThemedText style={styles.subtitle}>{t('complete_registration')}</ThemedText>
          </View>
        </LinearGradient>

        <View style={[styles.tabContainer, { backgroundColor: isDarkMode ? '#0f1f2d' : '#ffffff' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            {TABS.map((tab, index) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeTab === index 
                      ? '#4facfe' 
                      : colorScheme === 'dark' ? '#2d3748' : '#f8f9fa',
                    opacity: canNavigateToTab(index) ? 1 : 0.5
                  }
                ]}
                onPress={() => canNavigateToTab(index) ? setActiveTab(index) : null}
                disabled={!canNavigateToTab(index)}
              >
                <IconSymbol 
                  name={tab.icon} 
                  size={16} 
                  color={activeTab === index ? '#ffffff' : '#718096'} 
                />
                <ThemedText 
                  style={[
                    styles.tabText,
                    { color: activeTab === index ? '#ffffff' : '#718096' }
                  ]}
                >
                  {tab.title}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.formContainer}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDarkMode ? '#0f1c2b' : '#ffffff',
                  borderColor: isDarkMode ? 'rgba(148, 197, 255, 0.18)' : 'rgba(79,172,254,0.15)',
                },
              ]}
            >
              {renderTabContent()}
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.previousButton, { opacity: activeTab > 0 ? 1 : 0.5 }]} 
              onPress={activeTab > 0 ? handlePrevious : undefined}
              disabled={activeTab === 0}
            >
              <ThemedText style={[styles.previousButtonText, { color: '#4facfe' }]}>{t('previous')}</ThemedText>
            </TouchableOpacity>

            {activeTab < TABS.length - 1 ? (
              <TouchableOpacity 
                style={[styles.nextButton, { opacity: isNextEnabled ? 1 : 0.5 }]} 
                onPress={isNextEnabled ? handleNext : undefined}
                disabled={!isNextEnabled}
              >
                <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.buttonGradient}>
                  <ThemedText style={styles.nextButtonText}>{t('next')}</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.submitButton, { opacity: isNextEnabled ? 1 : 0.5 }]} 
                onPress={isNextEnabled ? handleSubmit : undefined}
                disabled={!isNextEnabled}
              >
                <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.buttonGradient}>
                  <ThemedText style={styles.submitButtonText}>{t('submit_registration')}</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>

        <Modal visible={showStateModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{t('select_state')}</ThemedText>
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
                <ThemedText style={styles.modalTitle}>{t('select_district')}</ThemedText>
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
                <ThemedText style={styles.modalTitle}>{t('select_taluk')}</ThemedText>
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
                <ThemedText style={styles.modalTitle}>{t('select_village')}</ThemedText>
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

        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroIconGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ scale: 1.2 }],
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  tabContainer: {
    marginTop: -28,
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
  },
  tabScroll: {
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  formContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  card: {
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 32,
    marginBottom: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 18,
    color: '#1e293b',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    color: '#475569',
  },
  input: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 0,
    fontSize: 14,
    lineHeight: 18,
    borderWidth: 1,
    borderColor: 'transparent',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  dropdown: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 14,
    flex: 1,
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
    alignItems: 'stretch',
  },
  previousButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4facfe',
    alignItems: 'center',
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  nextButton: {
    flex: 1,
    borderRadius: 16,
    marginLeft: 16,
  },
  submitButton: {
    flex: 1,
    borderRadius: 16,
    marginLeft: 16,
  },
  buttonGradient: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
  radioGroup: {
    flexDirection: 'row',
    gap: 20,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioText: {
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  languageButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    zIndex: 1,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});