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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';



export default function InvestorRegister() {
  const [activeTab, setActiveTab] = useState(0);
  const { t, language, setLanguage } = useLanguage();

  const TABS = [
    { id: 'basic', title: t('basic_info'), icon: 'person.crop.circle.fill' },
    { id: 'land', title: t('land_details'), icon: 'location.fill' },
    { id: 'bank', title: t('bank_info'), icon: 'building.columns.fill' },
    { id: 'attachment', title: t('documents'), icon: 'doc.text.fill' },
  ];
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [landDistricts, setLandDistricts] = useState<District[]>([]);
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [landTaluks, setLandTaluks] = useState<Taluk[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [landVillages, setLandVillages] = useState<Village[]>([]);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showTalukModal, setShowTalukModal] = useState(false);
  const [showVillageModal, setShowVillageModal] = useState(false);
  const [showLandStateModal, setShowLandStateModal] = useState(false);
  const [showLandDistrictModal, setShowLandDistrictModal] = useState(false);
  const [showLandTalukModal, setShowLandTalukModal] = useState(false);
  const [showLandVillageModal, setShowLandVillageModal] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedLandStateId, setSelectedLandStateId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedLandDistrictId, setSelectedLandDistrictId] = useState<number | null>(null);
  const [selectedTalukId, setSelectedTalukId] = useState<number | null>(null);
  const [selectedLandTalukId, setSelectedLandTalukId] = useState<number | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState<number | null>(null);
  const [selectedLandVillageId, setSelectedLandVillageId] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [showIrrigationSourceModal, setShowIrrigationSourceModal] = useState(false);
  const [showSoilTypeModal, setShowSoilTypeModal] = useState(false);
  const [showIrrigationTypeModal, setShowIrrigationTypeModal] = useState(false);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{userId: number, amount: number} | null>(null);
  const [registrationResult, setRegistrationResult] = useState<{ user: any; token?: string } | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{lat: number, lng: number} | null>(null);
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
    accountHolderName: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: '',
    bankPassbook: null,
    upiId: '',
    landOwnershipType: '',
    totalLandHolding: '',
    irrigationSource: '',
    soilType: '',
    irrigationType: '',
    location: '',
    landVillage: '',
    landTaluk: '',
    landDistrict: '',
    landState: '',
    landPincode: '',
    geoTaggedPhoto: null,
    pattaNo: '',
    coconutFarming: '',
    areaUnderCoconut: '',
    numberOfTrees: '',
    averageAgeOfTrees: '',
    estimatedCoconuts: '',
    lastHarvestDate: '',
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
    ? (['#1b2554', '#312e81'] as const)
    : (['#667eea', '#7f9cf5'] as const);

  const ownershipTypes = [t('owned'), t('leased'), t('joint_ownership')];
  const irrigationSources = [t('borewell'), t('canal')];
  const soilTypes = [t('sandy'), t('loamy'), t('clayey'), t('laterite')];
  const irrigationTypes = [t('drip'), t('manual')];
  const accountTypes = [t('savings'), t('current')];

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    setLoadingStates(true);
    console.log('=== FETCHING STATES ===');
    try {
      const statesData = await apiService.getStates();
      console.log('✅ States loaded successfully:', statesData.length, 'states');
      console.log('States data:', JSON.stringify(statesData, null, 2));
      setStates(statesData);
    } catch (error) {
      console.error('❌ Failed to load states:', error);
      Alert.alert('Error', 'Failed to load states');
    } finally {
      setLoadingStates(false);
    }
  };

  const selectState = async (state: State) => {
    console.log('=== SELECTING STATE ===');
    console.log('Selected state:', state.state, 'ID:', state.id);
    setFormData(prev => ({ ...prev, state: state.state, district: '' }));
    setSelectedStateId(state.id);
    setShowStateModal(false);
    try {
      console.log('Fetching districts for state ID:', state.id);
      const districtsData = await apiService.getDistricts(state.id);
      console.log('✅ Districts loaded successfully:', districtsData.length, 'districts');
      console.log('Districts data:', JSON.stringify(districtsData, null, 2));
      setDistricts(districtsData);
    } catch (error) {
      console.error('❌ Failed to load districts for state:', state.state, error);
      Alert.alert('Error', 'Failed to load districts');
    }
  };

  const selectDistrict = async (district: District) => {
    console.log('=== SELECTING DISTRICT ===');
    console.log('Selected district:', district.district_name, 'ID:', district.id);
    setFormData(prev => ({ ...prev, district: district.district_name, taluk: '' }));
    setSelectedDistrictId(district.id);
    setShowDistrictModal(false);
    try {
      console.log('Fetching taluks for district ID:', district.id);
      const taluksData = await apiService.getTaluks(district.id);
      console.log('✅ Taluks loaded successfully:', taluksData.length, 'taluks');
      console.log('Taluks data:', JSON.stringify(taluksData, null, 2));
      setTaluks(taluksData);
    } catch (error) {
      console.error('❌ Failed to load taluks for district:', district.district_name, error);
      Alert.alert('Error', 'Failed to load taluks');
    }
  };

  const selectTaluk = async (taluk: Taluk) => {
    console.log('=== SELECTING TALUK ===');
    console.log('Selected taluk:', taluk.taluk_name, 'ID:', taluk.id);
    console.log('District ID:', selectedDistrictId);
    setFormData(prev => ({ ...prev, taluk: taluk.taluk_name, village: '' }));
    setSelectedTalukId(taluk.id);
    setShowTalukModal(false);
    try {
      console.log('Fetching villages for district ID:', selectedDistrictId, 'taluk ID:', taluk.id);
      const villagesData = await apiService.getVillages(selectedDistrictId!, taluk.id);
      console.log('✅ Villages loaded successfully:', villagesData.length, 'villages');
      console.log('Villages data:', JSON.stringify(villagesData, null, 2));
      setVillages(villagesData);
    } catch (error) {
      console.error('❌ Failed to load villages for taluk:', taluk.taluk_name, error);
      Alert.alert('Error', 'Failed to load villages');
    }
  };

  const selectVillage = (village: Village) => {
    setFormData(prev => ({ ...prev, village: village.village_name }));
    setSelectedVillageId(village.id);
    setShowVillageModal(false);
  };

  const selectLandState = async (state: State) => {
    console.log('=== SELECTING LAND STATE ===');
    console.log('Selected land state:', state.state, 'ID:', state.id);
    setFormData(prev => ({ ...prev, landState: state.state, landDistrict: '' }));
    setSelectedLandStateId(state.id);
    setShowLandStateModal(false);
    try {
      console.log('Fetching land districts for state ID:', state.id);
      const districtsData = await apiService.getDistricts(state.id);
      console.log('✅ Land districts loaded successfully:', districtsData.length, 'districts');
      console.log('Land districts data:', JSON.stringify(districtsData, null, 2));
      setLandDistricts(districtsData);
    } catch (error) {
      console.error('❌ Failed to load land districts for state:', state.state, error);
      Alert.alert('Error', 'Failed to load land districts');
    }
  };

  const selectLandDistrict = async (district: District) => {
    console.log('=== SELECTING LAND DISTRICT ===');
    console.log('Selected land district:', district.district_name, 'ID:', district.id);
    setFormData(prev => ({ ...prev, landDistrict: district.district_name, landTaluk: '' }));
    setSelectedLandDistrictId(district.id);
    setShowLandDistrictModal(false);
    try {
      console.log('Fetching land taluks for district ID:', district.id);
      const taluksData = await apiService.getTaluks(district.id);
      console.log('✅ Land taluks loaded successfully:', taluksData.length, 'taluks');
      console.log('Land taluks data:', JSON.stringify(taluksData, null, 2));
      setLandTaluks(taluksData);
    } catch (error) {
      console.error('❌ Failed to load land taluks for district:', district.district_name, error);
      Alert.alert('Error', 'Failed to load land taluks');
    }
  };

  const selectLandTaluk = async (taluk: Taluk) => {
    console.log('=== SELECTING LAND TALUK ===');
    console.log('Selected land taluk:', taluk.taluk_name, 'ID:', taluk.id);
    console.log('Land district ID:', selectedLandDistrictId);
    setFormData(prev => ({ ...prev, landTaluk: taluk.taluk_name, landVillage: '' }));
    setSelectedLandTalukId(taluk.id);
    setShowLandTalukModal(false);
    try {
      console.log('Fetching land villages for district ID:', selectedLandDistrictId, 'taluk ID:', taluk.id);
      const villagesData = await apiService.getVillages(selectedLandDistrictId!, taluk.id);
      console.log('✅ Land villages loaded successfully:', villagesData.length, 'villages');
      console.log('Land villages data:', JSON.stringify(villagesData, null, 2));
      setLandVillages(villagesData);
    } catch (error) {
      console.error('❌ Failed to load land villages for taluk:', taluk.taluk_name, error);
      Alert.alert('Error', 'Failed to load land villages');
    }
  };

  const selectLandVillage = (village: Village) => {
    setFormData(prev => ({ ...prev, landVillage: village.village_name }));
    setSelectedLandVillageId(village.id);
    setShowLandVillageModal(false);
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
    console.log('=== BANK VALIDATION STARTED ===');
    console.log('Account Holder Name:', formData.accountHolderName);
    console.log('IFSC Code:', formData.ifscCode);
    console.log('Account Number:', formData.accountNumber);
    console.log('Mobile Number:', formData.mobileNumber);
    console.log('Email:', formData.emailId);
    
    try {
      // Step 1: Create Contact
      const contactPayload = {
        name: formData.accountHolderName,
        email: formData.emailId || '',
        contact: formData.mobileNumber,
        type: 'vendor',
        reference_id: formData.mobileNumber
      };
      console.log('=== STEP 1: Creating Contact ===');
      console.log('Contact Payload:', JSON.stringify(contactPayload, null, 2));
      
      const contactResponse = await fetch('https://api.razorpay.com/v1/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic cnpwX3Rlc3RfUmNQb3hURHVpa1U1TUs6UThxTU1tcUZ1ZHk1T1RvUFlmeGJyZVNm'
        },
        body: JSON.stringify(contactPayload)
      });
      
      console.log('Contact Response Status:', contactResponse.status);
      console.log('Contact Response Headers:', JSON.stringify([...contactResponse.headers.entries()]));
      
      const contactData = await contactResponse.json();
      console.log('Contact Response Data:', JSON.stringify(contactData, null, 2));
      
      if (!contactResponse.ok) {
        console.error('Contact creation failed with status:', contactResponse.status);
        throw new Error(`Contact creation failed: ${JSON.stringify(contactData)}`);
      }
      console.log('✅ Contact created successfully with ID:', contactData.id);

      // Step 2: Create Fund Account
      const fundAccountPayload = {
        contact_id: contactData.id,
        account_type: 'bank_account',
        bank_account: {
          name: formData.accountHolderName,
          ifsc: formData.ifscCode,
          account_number: formData.accountNumber
        }
      };
      console.log('=== STEP 2: Creating Fund Account ===');
      console.log('Fund Account Payload:', JSON.stringify(fundAccountPayload, null, 2));
      
      const fundAccountResponse = await fetch('https://api.razorpay.com/v1/fund_accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic cnpwX3Rlc3RfUmNQb3hURHVpa1U1TUs6UThxTU1tcUZ1ZHk1T1RvUFlmeGJyZVNm'
        },
        body: JSON.stringify(fundAccountPayload)
      });
      
      console.log('Fund Account Response Status:', fundAccountResponse.status);
      console.log('Fund Account Response Headers:', JSON.stringify([...fundAccountResponse.headers.entries()]));
      
      const fundAccountData = await fundAccountResponse.json();
      console.log('Fund Account Response Data:', JSON.stringify(fundAccountData, null, 2));
      
      if (!fundAccountResponse.ok) {
        console.error('Fund account creation failed with status:', fundAccountResponse.status);
        throw new Error(`Fund account creation failed: ${JSON.stringify(fundAccountData)}`);
      }
      console.log('✅ Fund Account created successfully with ID:', fundAccountData.id);

      // Step 3: Validate Account
      const validationPayload = {
        account_number:  "2323230050073818",
        fund_account: { id: fundAccountData.id },
        amount: 100,
        currency: 'INR'
      };
      console.log('=== STEP 3: Validating Account ===');
      console.log('Validation Payload:', JSON.stringify(validationPayload, null, 2));
      
      const validationResponse = await fetch('https://api.razorpay.com/v1/fund_accounts/validations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic cnpwX3Rlc3RfUmNQb3hURHVpa1U1TUs6UThxTU1tcUZ1ZHk1T1RvUFlmeGJyZVNm'
        },
        body: JSON.stringify(validationPayload)
      });
      
      console.log('Validation Response Status:', validationResponse.status);
      console.log('Validation Response Headers:', JSON.stringify([...validationResponse.headers.entries()]));
      
      const validationData = await validationResponse.json();
      console.log('Validation Response Data:', JSON.stringify(validationData, null, 2));
      
      if (validationResponse.ok && validationData.status === 'created') {
        console.log('✅ Account validation successful!');
        setVerificationStatus(prev => ({ ...prev, accountValidated: true }));
        Alert.alert('Success', 'Account validation successful!', [
          { text: 'OK', onPress: () => setActiveTab(activeTab + 1) }
        ]);
      } else {
        console.error('Account validation failed. Status:', validationData.status);
        console.error('Validation error details:', validationData);
        throw new Error(`Account validation failed: ${JSON.stringify(validationData)}`);
      }
    } catch (error) {
      console.error('=== BANK VALIDATION ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Validation Failed', 'Please enter correct account details and try again.');
    } finally {
      setValidationLoading(false);
      console.log('=== BANK VALIDATION COMPLETED ===');
    }
  };

  const handlePrevious = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  // Helper function to store user data in AsyncStorage (similar to login)
  const storeUserData = async (user: any, token?: string) => {
    try {
      // Store token if available
      if (token) {
        await AsyncStorage.setItem('authToken', token);
        console.log('✅ Token stored');
      }
      
      // Store user ID
      if (user?.id) {
        await AsyncStorage.setItem('userId', user.id.toString());
        console.log('✅ User ID stored:', user.id);
      }
      
      // Map role_id to role name: 2 = farmer, 3 = investor, etc.
      if (user?.role_id) {
        const roleName = user.role_id === 2 ? 'farmer' : 
                        user.role_id === 3 ? 'investor' : 
                        user.role_id === 4 ? 'serviceProvider' : 'farmer';
        await AsyncStorage.setItem('userRole', roleName);
        console.log('✅ User role stored:', roleName);
      }
      
      // Store complete user data for profile page
      if (user) {
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        console.log('✅ Complete user data stored:', {
          id: user.id,
          name: user.fullname,
          role: user.role_id === 2 ? 'farmer' : user.role_id === 3 ? 'investor' : 'farmer',
          mobile: user.mobile_no
        });
      }
    } catch (error) {
      console.error('❌ Error storing user data:', error);
    }
  };

  const initiatePayment = (userId: number, amount: number) => {
    setPaymentData({ userId, amount });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    if (paymentData) {
      console.log('=== PAYMENT SUCCESS - UPDATING STATUS ===');
      console.log('Payment ID:', paymentId);
      console.log('User ID:', paymentData.userId);
      console.log('Amount:', paymentData.amount);
      
      const paymentUpdatePayload = {
        user_id: paymentData.userId,
        payment_id: paymentId,
        payment_status: 1,
        amount: paymentData.amount,
        currency: 'INR',
        payment_method: 'razorpay'
      };
      console.log('Payment update payload:', JSON.stringify(paymentUpdatePayload, null, 2));
      
      try {
        const response = await fetch('http://65.0.100.65:8000/api/payments/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentUpdatePayload)
        });
        
        console.log('Payment update response status:', response.status);
        const responseData = await response.json();
        console.log('Payment update response data:', JSON.stringify(responseData, null, 2));
        
        if (response.ok) {
          console.log('✅ Payment status updated successfully');
        } else {
          console.error('❌ Payment status update failed with status:', response.status);
        }
      } catch (error) {
        console.error('❌ Payment status update failed:', error);
      }
    }
    
    // Store user data in AsyncStorage before redirecting
    if (registrationResult) {
      await storeUserData(registrationResult.user, registrationResult.token);
    }
    
    setShowPaymentModal(false);
    setPaymentData(null);
    setRegistrationResult(null);
    router.replace('/dashboard');
  };

  const handlePaymentFailure = async (reason?: string) => {
    if (paymentData) {
      console.log('=== PAYMENT FAILURE - UPDATING STATUS ===');
      console.log('User ID:', paymentData.userId);
      console.log('Amount:', paymentData.amount);
      console.log('Failure reason:', reason);
      
      const paymentFailurePayload = {
        user_id: paymentData.userId,
        payment_id: `failed_${Date.now()}`,
        payment_status: 0,
        amount: paymentData.amount,
        currency: 'INR',
        payment_method: 'razorpay',
        failure_reason: reason || 'Payment cancelled by user'
      };
      console.log('Payment failure payload:', JSON.stringify(paymentFailurePayload, null, 2));
      
      try {
        const response = await fetch('http://65.0.100.65:8000/api/payments/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentFailurePayload)
        });
        
        console.log('Payment failure update response status:', response.status);
        const responseData = await response.json();
        console.log('Payment failure update response data:', JSON.stringify(responseData, null, 2));
        
        if (response.ok) {
          console.log('✅ Payment failure status updated successfully');
        } else {
          console.error('❌ Payment failure status update failed with status:', response.status);
        }
      } catch (error) {
        console.error('❌ Payment failure status update failed:', error);
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
    console.log('=== INVESTOR REGISTRATION STARTED ===');
    
    try {
      const formDataToSend = new FormData();
      
      // Basic info
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
      

      
      // Documents
      if (formData.aadhaarCard) {
        formDataToSend.append('aadhar_copy', {
          uri: formData.aadhaarCard,
          type: 'image/jpeg',
          name: 'aadhar.jpg'
        } as any);
      }
      if (formData.panCard) {
        formDataToSend.append('pan_copy', {
          uri: formData.panCard,
          type: 'image/jpeg',
          name: 'pan.jpg'
        } as any);
      }
      if (formData.passportPhoto) {
        formDataToSend.append('passport_photo', {
          uri: formData.passportPhoto,
          type: 'image/jpeg',
          name: 'passport.jpg'
        } as any);
      }
      
      // Bank details
      formDataToSend.append('account_holder_name', formData.accountHolderName);
      formDataToSend.append('bank_name', formData.bankName);
      formDataToSend.append('branch_name', formData.branchName);
      formDataToSend.append('account_no', formData.accountNumber);
      formDataToSend.append('ifsc_code', formData.ifscCode);
      formDataToSend.append('account_type', formData.accountType);
      formDataToSend.append('upi_id', formData.upiId || '');
      if (formData.bankPassbook) {
        formDataToSend.append('passbook_copy', {
          uri: formData.bankPassbook,
          type: 'image/jpeg',
          name: 'passbook.jpg'
        } as any);
      }
      
      formDataToSend.append('role_id', '3'); // Investor role
      
      console.log('Submitting registration for investor');
      
      const registerResponse = await fetch('http://65.0.100.65:8000/api/users/register', {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const registerResult = await registerResponse.json();
      console.log('Registration status:', registerResponse.status, 'Result:', registerResult.status);
      
      if (registerResponse.ok && registerResult.status === 'success' && registerResult.data?.user?.id) {
        console.log('✅ Registration successful! User ID:', registerResult.data.user.id);
        
        // Check if land details are filled
        const hasLandDetails = formData.landOwnershipType || formData.totalLandHolding || 
                              formData.irrigationSource || formData.soilType || 
                              formData.irrigationType || formData.location || 
                              formData.landVillage || formData.pattaNo || 
                              formData.coconutFarming === 'yes';
        
        // Submit land details only if any land info is provided
        if (hasLandDetails) {
          console.log('Submitting land details');
          
          const landFormData = new FormData();
          landFormData.append('land_ownership_type', formData.landOwnershipType || '');
          landFormData.append('total_land_holding', formData.totalLandHolding || '');
          landFormData.append('irrigation_source', formData.irrigationSource || '');
          landFormData.append('soil_type', formData.soilType || '');
          landFormData.append('irrigation_type', formData.irrigationType || '');
          
          if (formData.location) {
            const [lat, lng] = formData.location.split(', ');
            landFormData.append('land_lattitude', lat);
            landFormData.append('land_longitude', lng);
          }
          
          landFormData.append('village', formData.landVillage || '');
          landFormData.append('taluk', formData.landTaluk || '');
          landFormData.append('district', formData.landDistrict || '');
          landFormData.append('state', formData.landState || '');
          landFormData.append('pincode', formData.landPincode || '');
          landFormData.append('patta_number', formData.pattaNo || '');
          landFormData.append('coconut_farm', formData.coconutFarming === 'yes' ? '1' : '0');
          
          if (formData.coconutFarming === 'yes') {
            landFormData.append('coconut_area', formData.areaUnderCoconut);
            landFormData.append('no_of_trees', formData.numberOfTrees);
            landFormData.append('trees_age', formData.averageAgeOfTrees);
            landFormData.append('estimated_falling', formData.estimatedCoconuts);
            if (formData.lastHarvestDate) {
              const harvestDateParts = formData.lastHarvestDate.split('/');
              const formattedHarvestDate = `${harvestDateParts[2]}-${harvestDateParts[1].padStart(2, '0')}-${harvestDateParts[0].padStart(2, '0')}`;
              landFormData.append('last_harvest_date', formattedHarvestDate);
            }
          }
          
          landFormData.append('user_id', registerResult.data.user.id.toString());
          

          
          const landResponse = await fetch('http://65.0.100.65:8000/api/users/land-details', {
            method: 'POST',
            body: landFormData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          const landResult = await landResponse.json();
          console.log('Land details status:', landResponse.status);
        }
        
        // Store registration result for later use (in payment success handler)
        const userData = registerResult.data.user;
        const token = registerResult.data.token || registerResult.token;
        setRegistrationResult({ user: userData, token });
        
        try {
          const fee = await apiService.getFees();
          if (fee > 0) {
            initiatePayment(registerResult.data.user.id, fee);
          } else {
            // No payment required - store user data and redirect to dashboard
            await storeUserData(userData, token);
            Alert.alert(t('registration_successful'), registerResult.message || t('welcome_naam'), [
              { text: 'OK', onPress: () => router.replace('/dashboard') }
            ]);
          }
        } catch (feeError) {
          // No payment required - store user data and redirect to dashboard
          await storeUserData(userData, token);
          Alert.alert(t('registration_successful'), registerResult.message || t('welcome_naam'), [
            { text: 'OK', onPress: () => router.replace('/dashboard') }
          ]);
        }
      } else {
        console.error('Registration failed:', registerResponse.status);
        const errorMessage = registerResult?.message || 'Registration failed';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error.message);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const updateField = (field: string, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImagePicker = async (field: string, source: 'camera' | 'gallery') => {
    try {
      console.log('=== IMAGE PICKER STARTED ===');
      console.log('Field:', field, 'Source:', source);
      
      let result;
      
      if (source === 'camera') {
        console.log('Requesting camera permissions...');
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        console.log('Camera permission status:', status);
        
        if (status !== 'granted') {
          console.log('Camera permission denied');
          Alert.alert('Permission Required', 'Camera permission is required to take photos');
          return;
        }
        
        console.log('Launching camera...');
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.7,
        });
      } else {
        console.log('Requesting media library permissions...');
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('Gallery permission status:', status);
        
        if (status !== 'granted') {
          console.log('Gallery permission denied');
          Alert.alert('Permission Required', 'Gallery permission is required to select photos');
          return;
        }
        
        console.log('Launching image library...');
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.7,
        });
      }
      
      console.log('Image picker result:', JSON.stringify(result, null, 2));
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Selected image URI:', asset.uri);
        console.log('Image dimensions:', asset.width, 'x', asset.height);
        console.log('Image size:', asset.fileSize, 'bytes');
        
        updateField(field, asset.uri);
        Alert.alert('Success', 'Image selected successfully!');
      } else {
        console.log('Image picker was cancelled or no image selected');
      }
    } catch (error) {
      console.error('=== IMAGE PICKER ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
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

  const handleHarvestDateChange = (event: any, selectedDate?: Date) => {
    setShowHarvestDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString('en-GB');
      updateField('lastHarvestDate', formattedDate);
    }
  };

  const handleLocationSelect = (latitude: number, longitude: number) => {
    setSelectedCoordinates({ lat: latitude, lng: longitude });
  };

  const confirmLocation = () => {
    if (selectedCoordinates) {
      updateField('location', `${selectedCoordinates.lat.toFixed(6)}, ${selectedCoordinates.lng.toFixed(6)}`);
      setShowMapModal(false);
      setSelectedCoordinates(null);
    }
  };

  const validateTab = (tabIndex: number) => {
    switch (tabIndex) {
      case 0: // Basic Info
        return formData.fullName && formData.mobileNumber && formData.address && 
               formData.state && formData.district && formData.taluk && formData.village && 
               formData.pincode && formData.gender && formData.dateOfBirth;
      case 1: // Land Details (Optional for investors, but if coconut farming is yes, fields are required)
        if (formData.coconutFarming === 'yes') {
          return formData.areaUnderCoconut && formData.numberOfTrees && 
                 formData.averageAgeOfTrees && formData.estimatedCoconuts && formData.lastHarvestDate;
        }
        return true;
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
                  <View style={[styles.radioButton, { borderColor: formData.gender === 'Male' ? '#667eea' : '#cbd5e0' }]}>
                    {formData.gender === 'Male' && <View style={[styles.radioButtonSelected, { backgroundColor: '#667eea' }]} />}
                  </View>
                  <ThemedText style={styles.radioText}>{t('male')}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => updateField('gender', 'Female')}
                >
                  <View style={[styles.radioButton, { borderColor: formData.gender === 'Female' ? '#667eea' : '#cbd5e0' }]}>
                    {formData.gender === 'Female' && <View style={[styles.radioButtonSelected, { backgroundColor: '#667eea' }]} />}
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
            <ThemedText style={styles.sectionTitle}>{t('land_details_optional')}</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('land_ownership_type')}</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowOwnershipModal(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.landOwnershipType ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.landOwnershipType || t('select_ownership')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('total_land_holding')}</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.totalLandHolding}
                onChangeText={(value) => updateField('totalLandHolding', value)}
                placeholder={t('enter_total_land')}
                keyboardType="numeric"
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('irrigation_source')}</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowIrrigationSourceModal(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.irrigationSource ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.irrigationSource || t('select_irrigation_source')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('soil_type')}</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowSoilTypeModal(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.soilType ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.soilType || t('select_soil_type')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('irrigation_type')}</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowIrrigationTypeModal(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.irrigationType ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.irrigationType || t('select_irrigation_type')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('location_coordinates')}</ThemedText>
              <View style={styles.locationContainer}>
                <TextInput
                  style={[styles.locationInput, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                  value={formData.location}
                  onChangeText={(value) => updateField('location', value)}
                  placeholder="Enter coordinates"
                  placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                />
                <TouchableOpacity 
                  style={[styles.mapButton, { backgroundColor: '#667eea' }]}
                  onPress={() => setShowMapModal(true)}
                >
                  <IconSymbol name="location.fill" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('state')}</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowLandStateModal(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.landState ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.landState || t('select_state')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('district')}</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => selectedLandStateId ? setShowLandDistrictModal(true) : Alert.alert(t('select_state_first'))}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.landDistrict ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.landDistrict || t('select_district')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('taluk_block')}</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => selectedLandDistrictId ? setShowLandTalukModal(true) : Alert.alert(t('select_district_first'))}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.landTaluk ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.landTaluk || t('select_taluk')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('village_panchayat')}</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => selectedLandTalukId ? setShowLandVillageModal(true) : Alert.alert(t('select_taluk_first'))}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.landVillage ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.landVillage || t('select_village')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('pincode')}</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.landPincode}
                onChangeText={(value) => updateField('landPincode', value)}
                placeholder={t('enter_pincode')}
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('patta_no')}</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.pattaNo}
                onChangeText={(value) => updateField('pattaNo', value)}
                placeholder={t('enter_patta_no')}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('coconut_farming')}</ThemedText>
              <View style={styles.radioGroup}>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => updateField('coconutFarming', 'yes')}
                >
                  <View style={[styles.radioButton, { borderColor: formData.coconutFarming === 'yes' ? '#667eea' : '#cbd5e0' }]}>
                    {formData.coconutFarming === 'yes' && <View style={[styles.radioButtonSelected, { backgroundColor: '#667eea' }]} />}
                  </View>
                  <ThemedText style={styles.radioText}>{t('yes')}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => updateField('coconutFarming', 'no')}
                >
                  <View style={[styles.radioButton, { borderColor: formData.coconutFarming === 'no' ? '#667eea' : '#cbd5e0' }]}>
                    {formData.coconutFarming === 'no' && <View style={[styles.radioButtonSelected, { backgroundColor: '#667eea' }]} />}
                  </View>
                  <ThemedText style={styles.radioText}>{t('no')}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {formData.coconutFarming === 'yes' && (
              <View>
                <ThemedText style={[styles.sectionTitle, { fontSize: 18, marginTop: 20, marginBottom: 16 }]}>{t('coconut_farming_details')}</ThemedText>
                
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{t('area_under_coconut')}</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                    value={formData.areaUnderCoconut}
                    onChangeText={(value) => updateField('areaUnderCoconut', value)}
                    placeholder={t('enter_area_acres')}
                    keyboardType="numeric"
                    placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{t('number_of_trees')}</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                    value={formData.numberOfTrees}
                    onChangeText={(value) => updateField('numberOfTrees', value)}
                    placeholder={t('enter_number_trees')}
                    keyboardType="numeric"
                    placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{t('average_age_trees')}</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                    value={formData.averageAgeOfTrees}
                    onChangeText={(value) => updateField('averageAgeOfTrees', value)}
                    placeholder={t('enter_average_age')}
                    keyboardType="numeric"
                    placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{t('estimated_coconuts')}</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                    value={formData.estimatedCoconuts}
                    onChangeText={(value) => updateField('estimatedCoconuts', value)}
                    placeholder={t('enter_estimated_number')}
                    keyboardType="numeric"
                    placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{t('last_harvest_date')}</ThemedText>
                  <TouchableOpacity 
                    style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                    onPress={() => setShowHarvestDatePicker(true)}
                  >
                    <ThemedText style={[styles.dropdownText, { color: formData.lastHarvestDate ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                      {formData.lastHarvestDate || t('select_harvest_date')}
                    </ThemedText>
                    <IconSymbol name="calendar" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );
      case 2:
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
                      borderColor: verificationStatus.ifscVerified ? '#667eea' : 'transparent',
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
                  <View style={[styles.verifiedBadge, { backgroundColor: '#667eea' }]}>
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
                      borderColor: verificationStatus.accountVerified ? '#667eea' : 'transparent',
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
                  <View style={[styles.verifiedBadge, { backgroundColor: '#667eea' }]}>
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
              <ThemedText style={styles.label}>{t('bank_passbook_copy')} *</ThemedText>
              <View style={styles.fileUploadContainer}>
                {formData.bankPassbook ? (
                  <View style={[styles.uploadedFile, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f0fff4' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#667eea" />
                    <ThemedText style={[styles.uploadedText, { color: '#667eea' }]}>{t('bank_passbook_uploaded')}</ThemedText>
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
                      <IconSymbol name="camera.fill" size={24} color="#667eea" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('bankPassbook', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#667eea" />
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
                placeholder={t('enter_upi_id_optional')}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            {verificationStatus.accountValidated && (
              <View style={[styles.validationSuccess, { backgroundColor: '#f0fff4', borderColor: '#667eea' }]}>
                <IconSymbol name="checkmark.circle.fill" size={20} color="#667eea" />
                <ThemedText style={[styles.validationText, { color: '#667eea' }]}>{t('account_validated_successfully')}</ThemedText>
              </View>
            )}
          </View>
        );
      case 3:
        return (
          <View>
            <ThemedText style={styles.sectionTitle}>{t('documents')}</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('aadhaar_card_copy')} *</ThemedText>
              <View style={styles.fileUploadContainer}>
                {formData.aadhaarCard ? (
                  <View style={[styles.uploadedFile, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f0fff4' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#667eea" />
                    <ThemedText style={[styles.uploadedText, { color: '#667eea' }]}>{t('aadhaar_card_uploaded')}</ThemedText>
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
                      <IconSymbol name="camera.fill" size={24} color="#667eea" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('aadhaarCard', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#667eea" />
                      <ThemedText style={styles.uploadButtonText}>{t('choose_photo')}</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('pan_copy')}</ThemedText>
              <View style={styles.fileUploadContainer}>
                {formData.panCard ? (
                  <View style={[styles.uploadedFile, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f0fff4' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#667eea" />
                    <ThemedText style={[styles.uploadedText, { color: '#667eea' }]}>{t('pan_card_uploaded')}</ThemedText>
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
                      <IconSymbol name="camera.fill" size={24} color="#667eea" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('panCard', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#667eea" />
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
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#667eea" />
                    <ThemedText style={[styles.uploadedText, { color: '#667eea' }]}>{t('passport_photo_uploaded')}</ThemedText>
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
                      <IconSymbol name="camera.fill" size={24} color="#667eea" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('passportPhoto', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#667eea" />
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
      <Stack.Screen options={{ title: t('investor_registration'), headerShown: false }} />
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#050815' : '#f6f7fb' }]}>
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
              <IconSymbol size={62} name="chart.line.uptrend.xyaxis" color="#ffffff" />
            </View>
            <ThemedText style={styles.title}>{t('investor_registration')}</ThemedText>
            <ThemedText style={styles.subtitle}>{t('complete_registration')}</ThemedText>
          </View>
        </LinearGradient>

        <View style={[styles.tabContainer, { backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            {TABS.map((tab, index) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeTab === index 
                      ? '#667eea' 
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
                  backgroundColor: isDarkMode ? '#0d1424' : '#ffffff',
                  borderColor: isDarkMode ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.05)',
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
              <ThemedText style={[styles.previousButtonText, { color: '#667eea' }]}>{t('previous')}</ThemedText>
            </TouchableOpacity>

            {activeTab < TABS.length - 1 ? (
              <TouchableOpacity 
                style={[styles.nextButton, { opacity: (isNextEnabled || (activeTab === 2 && !verificationStatus.accountValidated)) ? 1 : 0.5 }]} 
                onPress={(isNextEnabled || (activeTab === 2 && !verificationStatus.accountValidated)) ? handleNext : undefined}
                disabled={!(isNextEnabled || (activeTab === 2 && !verificationStatus.accountValidated))}
              >
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.buttonGradient}>
                  {validationLoading ? (
                    <ThemedText style={styles.nextButtonText}>{t('validating')}</ThemedText>
                  ) : (
                    <ThemedText style={styles.nextButtonText}>
                      {activeTab === 2 && !verificationStatus.accountValidated ? t('validate_account') : t('next')}
                    </ThemedText>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.submitButton, { opacity: isNextEnabled ? 1 : 0.5 }]} 
                onPress={isNextEnabled ? handleSubmit : undefined}
                disabled={!isNextEnabled}
              >
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.buttonGradient}>
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

        <Modal visible={showLandStateModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{t('select_land_state_title')}</ThemedText>
                <TouchableOpacity onPress={() => setShowLandStateModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={states}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                    onPress={() => selectLandState(item)}
                  >
                    <ThemedText style={styles.modalItemText}>{item.state}</ThemedText>
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

        <Modal visible={showLandDistrictModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{t('select_land_district_title')}</ThemedText>
                <TouchableOpacity onPress={() => setShowLandDistrictModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={landDistricts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                    onPress={() => selectLandDistrict(item)}
                  >
                    <ThemedText style={styles.modalItemText}>{item.district_name}</ThemedText>
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

        <Modal visible={showLandTalukModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{t('select_land_taluk_title')}</ThemedText>
                <TouchableOpacity onPress={() => setShowLandTalukModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={landTaluks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                    onPress={() => selectLandTaluk(item)}
                  >
                    <ThemedText style={styles.modalItemText}>{item.taluk_name}</ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={showLandVillageModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{t('select_land_village_title')}</ThemedText>
                <TouchableOpacity onPress={() => setShowLandVillageModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={landVillages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                    onPress={() => selectLandVillage(item)}
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

        {showHarvestDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={handleHarvestDateChange}
            maximumDate={new Date()}
          />
        )}

        <Modal visible={showOwnershipModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{t('select_ownership')}</ThemedText>
                <TouchableOpacity onPress={() => setShowOwnershipModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={ownershipTypes}
                keyExtractor={(item) => item}
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
                <ThemedText style={styles.modalTitle}>{t('select_irrigation_source')}</ThemedText>
                <TouchableOpacity onPress={() => setShowIrrigationSourceModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={irrigationSources}
                keyExtractor={(item) => item}
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
                <ThemedText style={styles.modalTitle}>{t('select_soil_type')}</ThemedText>
                <TouchableOpacity onPress={() => setShowSoilTypeModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={soilTypes}
                keyExtractor={(item) => item}
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
                <ThemedText style={styles.modalTitle}>{t('select_irrigation_type')}</ThemedText>
                <TouchableOpacity onPress={() => setShowIrrigationTypeModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={irrigationTypes}
                keyExtractor={(item) => item}
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
                keyExtractor={(item) => item}
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

        <Modal visible={showMapModal} animationType="slide">
          <View style={styles.mapModalContainer}>
            <View style={styles.mapHeader}>
              <ThemedText style={styles.mapTitle}>{t('search_select_location')}</ThemedText>
              <TouchableOpacity onPress={() => { setShowMapModal(false); setSelectedCoordinates(null); }}>
                <IconSymbol name="xmark" size={24} color={Colors[colorScheme].text} />
              </TouchableOpacity>
            </View>
            <View style={styles.mapContainer}>
              <WebView
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>
                        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                        #searchContainer { position: absolute; top: 10px; left: 10px; right: 10px; z-index: 1000; }
                        #searchBox { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 16px; }
                        #map { height: 100vh; width: 100%; }
                        #coordsDisplay { position: absolute; bottom: 80px; left: 10px; right: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000; }
                        #confirmBtn { position: absolute; bottom: 20px; left: 10px; right: 10px; background: #667eea; color: white; padding: 15px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; z-index: 1000; }
                      </style>
                    </head>
                    <body>
                      <div id="searchContainer">
                        <input id="searchBox" type="text" placeholder="Search for a location...">
                      </div>
                      <div id="map"></div>
                      <div id="coordsDisplay" style="display: none;">
                        <div>Selected Location:</div>
                        <div id="coordsText"></div>
                      </div>
                      <button id="confirmBtn" style="display: none;" onclick="confirmLocation()">Confirm Location</button>
                      <script>
                        let map, marker, searchBox, selectedCoords;
                        
                        function initMap() {
                          map = new google.maps.Map(document.getElementById('map'), {
                            center: { lat: 12.9716, lng: 77.5946 },
                            zoom: 10
                          });
                          
                          const input = document.getElementById('searchBox');
                          searchBox = new google.maps.places.SearchBox(input);
                          
                          searchBox.addListener('places_changed', function() {
                            const places = searchBox.getPlaces();
                            if (places.length === 0) return;
                            
                            const place = places[0];
                            if (!place.geometry || !place.geometry.location) return;
                            
                            map.setCenter(place.geometry.location);
                            map.setZoom(15);
                            
                            if (marker) marker.setMap(null);
                            marker = new google.maps.Marker({
                              position: place.geometry.location,
                              map: map,
                              draggable: true
                            });
                            
                            updateCoords(place.geometry.location.lat(), place.geometry.location.lng());
                            
                            marker.addListener('dragend', function(e) {
                              updateCoords(e.latLng.lat(), e.latLng.lng());
                            });
                          });
                          
                          map.addListener('click', function(e) {
                            if (marker) marker.setMap(null);
                            marker = new google.maps.Marker({
                              position: e.latLng,
                              map: map,
                              draggable: true
                            });
                            
                            updateCoords(e.latLng.lat(), e.latLng.lng());
                            
                            marker.addListener('dragend', function(e) {
                              updateCoords(e.latLng.lat(), e.latLng.lng());
                            });
                          });
                        }
                        
                        function updateCoords(lat, lng) {
                          selectedCoords = { lat, lng };
                          document.getElementById('coordsText').innerHTML = 
                            'Latitude: ' + lat.toFixed(6) + '<br>Longitude: ' + lng.toFixed(6);
                          document.getElementById('coordsDisplay').style.display = 'block';
                          document.getElementById('confirmBtn').style.display = 'block';
                        }
                        
                        function confirmLocation() {
                          if (selectedCoords) {
                            window.ReactNativeWebView.postMessage(JSON.stringify(selectedCoords));
                          }
                        }
                      </script>
                      <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDVYsG_3cM-lClouzXfvIHCYuJO38SCMCk&libraries=places&callback=initMap"></script>
                    </body>
                    </html>
                  `
                }}
                onMessage={(event) => {
                  const { lat, lng } = JSON.parse(event.nativeEvent.data);
                  handleLocationSelect(lat, lng);
                }}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            </View>
            {selectedCoordinates && (
              <View style={styles.confirmationContainer}>
                <View style={styles.confirmationContent}>
                  <ThemedText style={styles.confirmationTitle}>{t('confirm_location')}</ThemedText>
                  <ThemedText style={styles.confirmationText}>
                    Latitude: {selectedCoordinates.lat.toFixed(6)}{"\n"}
                    Longitude: {selectedCoordinates.lng.toFixed(6)}
                  </ThemedText>
                  <View style={styles.confirmationButtons}>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={() => setSelectedCoordinates(null)}
                    >
                      <ThemedText style={styles.cancelButtonText}>{t('cancel')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.confirmButton, { backgroundColor: '#667eea' }]}
                      onPress={confirmLocation}
                    >
                      <ThemedText style={styles.confirmButtonText}>{t('confirm')}</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
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
                          color: #667eea;
                          margin: 20px 0;
                        }
                        .pay-button {
                          background: #667eea;
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
                          background: #5a67d8;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="payment-container">
                        <h2>NAAM Investor Registration Fee</h2>
                        <div class="amount">₹${paymentData.amount}</div>
                        <p>Complete your investor registration by paying the registration fee</p>
                        <button class="pay-button" onclick="startPayment()">Pay Now</button>
                      </div>
                      
                      <script>
                        function startPayment() {
                          const options = {
                            key: 'rzp_test_RcPoxTDuikU5MK',
                            amount: ${paymentData.amount * 100},
                            currency: 'INR',
                            name: 'NAAM Registration',
                            description: 'Investor Registration Fee',
                            prefill: {
                              name: '${formData.fullName}',
                              email: '${formData.emailId || ''}',
                              contact: '${formData.mobileNumber}'
                            },
                            theme: {
                              color: '#667eea'
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
  },
  radioText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a5568',
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
    borderColor: '#667eea',
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
  locationContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  locationInput: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mapButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
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
  mapContainer: {
    flex: 1,
  },
  selectLocationButton: {
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectLocationText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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

  validationSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    gap: 8,
  },
  validationText: {
    fontSize: 14,
    fontWeight: '600',
  },
});