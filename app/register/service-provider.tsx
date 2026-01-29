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

import { apiService, District, ServiceCategory, ServiceSubcategory, State, Taluk, Village } from '@/services/api';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ServiceProviderRegister() {
  const [activeTab, setActiveTab] = useState(0);
  const { t, language, setLanguage } = useLanguage();

  const TABS = [
    { id: 'basic', title: t('basic_info'), icon: 'person.crop.circle.fill' },
    { id: 'services', title: t('services'), icon: 'wrench.and.screwdriver.fill' },
    { id: 'bank', title: t('bank_info'), icon: 'building.columns.fill' },
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
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{userId: number, amount: number} | null>(null);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [serviceSubcategories, setServiceSubcategories] = useState<ServiceSubcategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
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
    category: '',
    subcategory: '',
    aadhaarCard: null,
    panCard: null,
    passportPhoto: null,
    accountHolderName: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: '',
    bankPassbook: null,
    upiId: '',
  });

  const [verificationStatus, setVerificationStatus] = useState({
    ifscVerified: false,
    accountVerified: false,
    accountValidated: false,
  });
  const [validationLoading, setValidationLoading] = useState(false);

  const colorScheme = useColorScheme() ?? 'light';
  const isDarkMode = colorScheme === 'dark';
  const headerGradient = isDarkMode
    ? (['#351839', '#861657'] as const)
    : (['#f093fb', '#f5576c'] as const);

  const accountTypes = [t('savings'), t('current')];

  useEffect(() => {
    fetchStates();
    fetchServiceCategories();
  }, []);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const statesData = await apiService.getStates();
      setStates(statesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load states');
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchServiceCategories = async () => {
    try {
      const categoriesData = await apiService.getServiceCategories();
      setServiceCategories(categoriesData);
    } catch (error) {
      console.error('❌ Error fetching service categories:', error);
      Alert.alert('Error', 'Failed to load service categories');
    }
  };

  const fetchServiceSubcategories = async (categoryId: number) => {
    try {
      const subcategoriesData = await apiService.getServiceSubcategories(categoryId);
      setServiceSubcategories(subcategoriesData);
    } catch (error) {
      console.error('❌ Error fetching service subcategories:', error);
      Alert.alert('Error', 'Failed to load service subcategories');
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

  const handleNext = async () => {
    if (activeTab === 2 && !verificationStatus.accountValidated) {
      await validateBankAccount();
      return;
    }
    if (activeTab < TABS.length - 1) {
      setActiveTab(activeTab + 1);
    }
  };

  const validateBankAccount = async () => {
    if (!formData.accountHolderName || !formData.ifscCode || !formData.accountNumber) {
      Alert.alert('Error', 'Please fill all bank details');
      return;
    }

    setValidationLoading(true);
    try {
      const contactResponse = await fetch('https://api.razorpay.com/v1/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic cnpwX3Rlc3RfUmNQb3hURHVpa1U1TUs6UThxTU1tcUZ1ZHk1T1RvUFlmeGJyZVNm'
        },
        body: JSON.stringify({
          name: formData.accountHolderName,
          email: formData.emailId || '',
          contact: formData.mobileNumber,
          type: 'vendor',
          reference_id: formData.mobileNumber
        })
      });
      const contactData = await contactResponse.json();
      
      if (!contactResponse.ok) throw new Error('Contact creation failed');

      const fundAccountResponse = await fetch('https://api.razorpay.com/v1/fund_accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic cnpwX3Rlc3RfUmNQb3hURHVpa1U1TUs6UThxTU1tcUZ1ZHk1T1RvUFlmeGJyZVNm'
        },
        body: JSON.stringify({
          contact_id: contactData.id,
          account_type: 'bank_account',
          bank_account: {
            name: formData.accountHolderName,
            ifsc: formData.ifscCode,
            account_number: formData.accountNumber
          }
        })
      });
      const fundAccountData = await fundAccountResponse.json();
      
      if (!fundAccountResponse.ok) throw new Error('Fund account creation failed');

      const validationResponse = await fetch('https://api.razorpay.com/v1/fund_accounts/validations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic cnpwX3Rlc3RfUmNQb3hURHVpa1U1TUs6UThxTU1tcUZ1ZHk1T1RvUFlmeGJyZVNm'
        },
        body: JSON.stringify({
          account_number: formData.accountNumber,
          fund_account: { id: fundAccountData.id },
          amount: 100,
          currency: 'INR'
        })
      });
      const validationData = await validationResponse.json();
      
      if (validationResponse.ok && validationData.status === 'created') {
        setVerificationStatus(prev => ({ ...prev, accountValidated: true }));
        Alert.alert('Success', 'Account validation successful!', [
          { text: 'OK', onPress: () => setActiveTab(activeTab + 1) }
        ]);
      } else {
        throw new Error('Account validation failed');
      }
    } catch (error) {
      Alert.alert('Validation Failed', 'Please enter correct account details and try again.');
    } finally {
      setValidationLoading(false);
    }
  };

  const handlePrevious = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  const initiatePayment = (userId: number, amount: number) => {
    setPaymentData({ userId, amount });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    if (paymentData) {
      try {
        await fetch('http://65.0.100.65:8000/api/payments/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: paymentData.userId,
            payment_id: paymentId,
            payment_status: 1,
            amount: paymentData.amount,
            currency: 'INR',
            payment_method: 'razorpay'
          })
        });
      } catch (error) {
        console.error('Payment status update failed:', error);
      }
    }
    setShowPaymentModal(false);
    setPaymentData(null);
    router.replace('/dashboard');
  };

  const handlePaymentFailure = async (reason?: string) => {
    if (paymentData) {
      try {
        await fetch('http://65.0.100.65:8000/api/payments/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: paymentData.userId,
            payment_id: `failed_${Date.now()}`,
            payment_status: 0,
            amount: paymentData.amount,
            currency: 'INR',
            payment_method: 'razorpay',
            failure_reason: reason || 'Payment cancelled by user'
          })
        });
      } catch (error) {
        console.error('Payment status update failed:', error);
      }
    }
    setShowPaymentModal(false);
    setPaymentData(null);
    Alert.alert('Payment Failed', 'Payment was not completed. Please try again later.', [
      { text: 'Retry', onPress: () => setShowPaymentModal(true) },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleSubmit = async () => {
    console.log('🚀 Starting service provider registration submission...');
    
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
      
      console.log('📋 Service Provider form data summary:', {
        fullname: formData.fullName,
        mobile_no: formData.mobileNumber,
        state_id: selectedStateId,
        district_id: selectedDistrictId,
        taluk_id: selectedTalukId,
        village: formData.village,
        gender: formData.gender,
        dob: formData.dateOfBirth,
        category: formData.category,
        subcategory: formData.subcategory
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
      
      // Bank details
      console.log('🏦 Adding bank details to form data...');
      formDataToSend.append('account_holder_name', formData.accountHolderName);
      formDataToSend.append('bank_name', formData.bankName);
      formDataToSend.append('branch_name', formData.branchName);
      formDataToSend.append('account_no', formData.accountNumber);
      formDataToSend.append('ifsc_code', formData.ifscCode);
      formDataToSend.append('account_type', formData.accountType);
      formDataToSend.append('upi_id', formData.upiId || '');
      if (formData.bankPassbook) {
        console.log('✅ Adding bank passbook');
        formDataToSend.append('passbook_copy', {
          uri: formData.bankPassbook,
          type: 'image/jpeg',
          name: 'passbook.jpg'
        } as any);
      }
      
      formDataToSend.append('role_id', '4'); // Service Provider role
      
      // Log FormData contents
      console.log('📦 Service Provider FormData payload contents:');
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
      
      if (registerResponse.ok && registerResult.status === 'success' && registerResult.data?.id) {
        console.log('✅ User registration successful, ID:', registerResult.data.id);
        
        // Submit vendor categories
        console.log('🛠️ Preparing service categories submission...');
        const categoryData = {
          categories: [{
            category_id: selectedCategoryId,
            subcategory_id: serviceSubcategories.find(sub => sub.subcategory === formData.subcategory)?.id,
            user_id: registerResult.data.id
          }]
        };
        
        console.log('📋 Service categories data:', categoryData);
        
        console.log('🌐 Sending service categories request to API...');
        console.log('📍 API URL: http://65.0.100.65:8000/api/users/vendor-categories');
        console.log('📤 Request method: POST');
        console.log('📋 Request headers: Content-Type: application/json');
        console.log('📦 Category payload:', JSON.stringify(categoryData, null, 2));
        
        const categoryResponse = await fetch('http://65.0.100.65:8000/api/users/vendor-categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        });
        
        console.log('📡 Service categories response status:', categoryResponse.status);
        console.log('📡 Service categories response statusText:', categoryResponse.statusText);
        console.log('📡 Service categories response ok:', categoryResponse.ok);
        console.log('📡 Service categories response headers:');
        for (let [key, value] of categoryResponse.headers.entries()) {
          console.log(`  ${key}: ${value}`);
        }
        
        const categoryResponseText = await categoryResponse.text();
        console.log('📄 Raw category response text:', categoryResponseText);
        
        let categoryResult;
        try {
          categoryResult = JSON.parse(categoryResponseText);
          console.log('📋 Parsed service categories response data:', categoryResult);
        } catch (parseError) {
          console.error('❌ Failed to parse category response as JSON:', parseError);
          console.log('📄 Category response was not valid JSON, raw text:', categoryResponseText);
          throw new Error(`Invalid JSON response: ${categoryResponseText}`);
        }
        
        if (categoryResponse.ok) {
          console.log('✅ Registration completed successfully!');
          
          // Get fee from API and initiate payment
          const fee = await apiService.getFees();
          if (fee > 0) {
            initiatePayment(registerResult.data.id, fee);
          } else {
            Alert.alert(t('registration_successful'), t('welcome_naam'), [
              { text: 'OK', onPress: () => router.back() }
            ]);
          }
        } else {
          console.error('❌ Service categories submission failed:', categoryResult);
          Alert.alert('Error', `Failed to submit service categories: ${categoryResult.message || 'Unknown error'}`);
        }
      } else {
        console.error('❌ User registration failed:', registerResult);
        Alert.alert('Error', `Registration failed: ${registerResult.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 Network error during registration:', error);
      Alert.alert('Error', `Network error occurred: ${error.message}`);
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

  const handleIFSCVerification = (ifscCode: string) => {
    if (ifscCode.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      setTimeout(() => {
        setVerificationStatus(prev => ({ ...prev, ifscVerified: true }));
        updateField('bankName', 'State Bank of India');
        updateField('branchName', 'Main Branch');
      }, 1000);
    } else {
      setVerificationStatus(prev => ({ ...prev, ifscVerified: false }));
    }
  };

  const handleAccountVerification = (accountNumber: string) => {
    if (accountNumber.length >= 9 && /^[0-9]+$/.test(accountNumber)) {
      setTimeout(() => {
        setVerificationStatus(prev => ({ ...prev, accountVerified: true }));
      }, 1000);
    } else {
      setVerificationStatus(prev => ({ ...prev, accountVerified: false }));
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
      case 1: // Services
        return formData.category && formData.subcategory;
      case 2: // Bank Info
        return formData.accountHolderName && formData.bankName && formData.branchName && 
               formData.ifscCode && formData.accountNumber && formData.accountType && 
               verificationStatus.accountValidated;
      case 3: // Documents
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
                  <View style={[styles.radioButton, { borderColor: formData.gender === 'Male' ? '#f093fb' : '#cbd5e0' }]}>
                    {formData.gender === 'Male' && <View style={[styles.radioButtonSelected, { backgroundColor: '#f093fb' }]} />}
                  </View>
                  <ThemedText style={styles.radioText}>{t('male')}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => updateField('gender', 'Female')}
                >
                  <View style={[styles.radioButton, { borderColor: formData.gender === 'Female' ? '#f093fb' : '#cbd5e0' }]}>
                    {formData.gender === 'Female' && <View style={[styles.radioButtonSelected, { backgroundColor: '#f093fb' }]} />}
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
            <ThemedText style={styles.sectionTitle}>{t('services_offered')}</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('category')} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowCategoryModal(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.category ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.category || t('select_service_category')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('subcategory')} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => selectedCategoryId ? setShowSubcategoryModal(true) : Alert.alert(t('select_category_first'))}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.subcategory ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.subcategory || t('select_subcategory')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>
          </View>
        );
      case 2:
        return (
          <View>
            <ThemedText style={styles.sectionTitle}>{t('documents')}</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('aadhar_card')} *</ThemedText>
              <View style={styles.fileUploadContainer}>
                {formData.aadhaarCard ? (
                  <View style={[styles.uploadedFile, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f0fff4' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#f093fb" />
                    <ThemedText style={[styles.uploadedText, { color: '#f093fb' }]}>{t('aadhar_uploaded')}</ThemedText>
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
                      <IconSymbol name="camera.fill" size={24} color="#f093fb" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('aadhaarCard', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#f093fb" />
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
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#f093fb" />
                    <ThemedText style={[styles.uploadedText, { color: '#f093fb' }]}>{t('pan_uploaded')}</ThemedText>
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
                      <IconSymbol name="camera.fill" size={24} color="#f093fb" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('panCard', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#f093fb" />
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
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#f093fb" />
                    <ThemedText style={[styles.uploadedText, { color: '#f093fb' }]}>{t('passport_uploaded')}</ThemedText>
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
                      <IconSymbol name="camera.fill" size={24} color="#f093fb" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('passportPhoto', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#f093fb" />
                      <ThemedText style={styles.uploadButtonText}>{t('choose_photo')}</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        );
      case 3:
        return (
          <View>
            <ThemedText style={styles.sectionTitle}>{t('bank_details')}</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('account_holder_name')} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.accountHolderName}
                onChangeText={(value) => updateField('accountHolderName', value)}
                placeholder={t('enter_account_holder_name')}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('bank_name')} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.bankName}
                onChangeText={(value) => updateField('bankName', value)}
                placeholder={t('enter_bank_name')}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('branch_name')} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.branchName}
                onChangeText={(value) => updateField('branchName', value)}
                placeholder={t('enter_branch_name')}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('ifsc_code')} *</ThemedText>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa',
                      color: Colors[colorScheme].text,
                      borderColor: verificationStatus.ifscVerified ? '#f093fb' : 'transparent',
                    }
                  ]}
                  value={formData.ifscCode}
                  onChangeText={(value) => {
                    const upperValue = value.toUpperCase();
                    updateField('ifscCode', upperValue);
                    handleIFSCVerification(upperValue);
                  }}
                  placeholder={t('enter_ifsc_code')}
                  maxLength={11}
                  autoCapitalize="characters"
                  placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                />
                {verificationStatus.ifscVerified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: '#f093fb' }]}>
                    <ThemedText style={styles.verifiedText}>✓</ThemedText>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('account_number')} *</ThemedText>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa',
                      color: Colors[colorScheme].text,
                      borderColor: verificationStatus.accountVerified ? '#f093fb' : 'transparent',
                    }
                  ]}
                  value={formData.accountNumber}
                  onChangeText={(value) => {
                    updateField('accountNumber', value);
                    handleAccountVerification(value);
                  }}
                  placeholder={t('enter_account_number')}
                  keyboardType="numeric"
                  placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                />
                {verificationStatus.accountVerified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: '#f093fb' }]}>
                    <ThemedText style={styles.verifiedText}>✓</ThemedText>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('account_type')} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowAccountTypeModal(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.accountType ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.accountType || t('select_account_type')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('bank_passbook')} *</ThemedText>
              <View style={styles.fileUploadContainer}>
                {formData.bankPassbook ? (
                  <View style={[styles.uploadedFile, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f0fff4' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#f093fb" />
                    <ThemedText style={[styles.uploadedText, { color: '#f093fb' }]}>{t('passbook_uploaded')}</ThemedText>
                    <TouchableOpacity onPress={() => updateField('bankPassbook', null)}>
                      <IconSymbol name="xmark.circle.fill" size={20} color="#e53e3e" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadOptions}>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('bankPassbook', 'camera')}
                    >
                      <IconSymbol name="camera.fill" size={24} color="#f093fb" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('bankPassbook', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#f093fb" />
                      <ThemedText style={styles.uploadButtonText}>{t('choose_photo')}</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('upi_id')}</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.upiId}
                onChangeText={(value) => updateField('upiId', value)}
                placeholder={t('enter_upi_id')}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: t('service_provider_registration'), headerShown: false }} />
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#160811' : '#fff4fb' }]}>
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
              <IconSymbol size={62} name="wrench.and.screwdriver.fill" color="#ffffff" />
            </View>
            <ThemedText style={styles.title}>{t('service_provider_registration')}</ThemedText>
            <ThemedText style={styles.subtitle}>{t('complete_registration')}</ThemedText>
          </View>
        </LinearGradient>

        <View style={[styles.tabContainer, { backgroundColor: isDarkMode ? '#231527' : '#ffffff' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            {TABS.map((tab, index) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeTab === index 
                      ? '#f093fb' 
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
                  backgroundColor: isDarkMode ? '#1b0f18' : '#ffffff',
                  borderColor: isDarkMode ? 'rgba(248,191,255,0.15)' : 'rgba(245,87,108,0.1)',
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
              <ThemedText style={[styles.previousButtonText, { color: '#f093fb' }]}>{t('previous')}</ThemedText>
            </TouchableOpacity>

            {activeTab < TABS.length - 1 ? (
              <TouchableOpacity 
                style={[styles.nextButton, { opacity: isNextEnabled ? 1 : 0.5 }]} 
                onPress={isNextEnabled ? handleNext : undefined}
                disabled={!isNextEnabled}
              >
                <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.buttonGradient}>
                  <ThemedText style={styles.nextButtonText}>{t('next')}</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.submitButton, { opacity: isNextEnabled ? 1 : 0.5 }]} 
                onPress={isNextEnabled ? handleSubmit : undefined}
                disabled={!isNextEnabled}
              >
                <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.buttonGradient}>
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

        <Modal visible={showCategoryModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{t('select_service_category')}</ThemedText>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={serviceCategories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                    onPress={() => {
                      updateField('category', item.service_category);
                      updateField('subcategory', '');
                      setSelectedCategoryId(item.id);
                      setShowCategoryModal(false);
                      fetchServiceSubcategories(item.id);
                    }}
                  >
                    <ThemedText style={styles.modalItemText}>{item.service_category}</ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={showSubcategoryModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{t('select_subcategory')}</ThemedText>
                <TouchableOpacity onPress={() => setShowSubcategoryModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={serviceSubcategories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                    onPress={() => {
                      updateField('subcategory', item.subcategory);
                      setShowSubcategoryModal(false);
                    }}
                  >
                    <ThemedText style={styles.modalItemText}>{item.subcategory}</ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={showAccountTypeModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{t('select_account_type')}</ThemedText>
                <TouchableOpacity onPress={() => setShowAccountTypeModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={accountTypes}
                keyExtractor={(item, index) => `account-type-${index}-${item}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                    onPress={() => {
                      updateField('accountType', item);
                      setShowAccountTypeModal(false);
                    }}
                  >
                    <ThemedText style={styles.modalItemText}>{item}</ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={showPaymentModal} animationType="slide">
          <View style={styles.paymentModalContainer}>
            <View style={styles.paymentHeader}>
              <ThemedText style={styles.paymentTitle}>Payment Gateway</ThemedText>
              <TouchableOpacity onPress={() => { setShowPaymentModal(false); setPaymentData(null); }}>
                <IconSymbol name="xmark" size={24} color={Colors[colorScheme].text} />
              </TouchableOpacity>
            </View>
            {paymentData && (
              <WebView
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
                      <style>
                        body { 
                          margin: 0; 
                          padding: 20px; 
                          font-family: Arial, sans-serif;
                          background: #f8f9fa;
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          justify-content: center;
                          min-height: 100vh;
                        }
                        .payment-container {
                          background: white;
                          padding: 30px;
                          border-radius: 12px;
                          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                          text-align: center;
                          max-width: 400px;
                          width: 100%;
                        }
                        .amount {
                          font-size: 32px;
                          font-weight: bold;
                          color: #f093fb;
                          margin: 20px 0;
                        }
                        .pay-button {
                          background: #f093fb;
                          color: white;
                          border: none;
                          padding: 15px 30px;
                          border-radius: 8px;
                          font-size: 18px;
                          font-weight: bold;
                          cursor: pointer;
                          width: 100%;
                          margin-top: 20px;
                        }
                        .pay-button:hover {
                          background: #e879f9;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="payment-container">
                        <h2>NAAM Service Provider Registration Fee</h2>
                        <div class="amount">₹${paymentData.amount}</div>
                        <p>Complete your service provider registration by paying the registration fee</p>
                        <button class="pay-button" onclick="startPayment()">Pay Now</button>
                      </div>
                      
                      <script>
                        function startPayment() {
                          const options = {
                            key: 'rzp_test_RcPoxTDuikU5MK',
                            amount: ${paymentData.amount * 100},
                            currency: 'INR',
                            name: 'NAAM Registration',
                            description: 'Service Provider Registration Fee',
                            prefill: {
                              name: '${formData.fullName}',
                              email: '${formData.emailId || ''}',
                              contact: '${formData.mobileNumber}'
                            },
                            theme: {
                              color: '#f093fb'
                            },
                            handler: function(response) {
                              console.log('Payment Success:', response.razorpay_payment_id);
                              window.ReactNativeWebView.postMessage(JSON.stringify({
                                status: 'success',
                                payment_id: response.razorpay_payment_id
                              }));
                            },
                            modal: {
                              ondismiss: function() {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                  status: 'cancelled'
                                }));
                              }
                            }
                          };
                          
                          const rzp = new Razorpay(options);
                          rzp.open();
                        }
                      </script>
                    </body>
                    </html>
                  `
                }}
                onMessage={(event) => {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.status === 'success') {
                    handlePaymentSuccess(data.payment_id);
                  } else if (data.status === 'cancelled') {
                    handlePaymentFailure();
                  }
                }}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            )}
          </View>
        </Modal>
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
  inputContainer: {
    position: 'relative',
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
  verifiedBadge: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
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
    borderColor: '#f093fb',
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
  paymentModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});