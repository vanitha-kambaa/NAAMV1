import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ComponentProps, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
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

const { width } = Dimensions.get('window');

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
};

export default function FarmerRegister() {
  const [activeTab, setActiveTab] = useState(0);
  const [farmerFee, setFarmerFee] = useState<number | null>(null);
  const [introMode, setIntroMode] = useState(true);
  const [introStep, setIntroStep] = useState(0); // 0 = details, 1 = choose location
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [aadhaarNumberInput, setAadhaarNumberInput] = useState('');
  const { t, language, setLanguage } = useLanguage();

  type IconName = ComponentProps<typeof IconSymbol>['name'];

  const TABS: { id: string; title: string; icon: IconName }[] = [
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
  const [subdistricts, setSubdistricts] = useState<any[]>([]);
  const [selectedSubdistrictId, setSelectedSubdistrictId] = useState<number | null>(null);
  const [showSubdistrictModal, setShowSubdistrictModal] = useState(false);
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
  const [panchayats, setPanchayats] = useState<{ id: number; name: string }[]>([]);
  const [selectedPanchayatId, setSelectedPanchayatId] = useState<number | null>(null);
  const [showPanchayatModal, setShowPanchayatModal] = useState(false);
  const [formData, setFormData] = useState<any>({
    fullName: '',
    mobileNumber: '',
    alternateMobileNumber: '',
    emailId: '',
    address: '',
    village: '',
    panchayat: '',
    subdistrict: '',
    taluk: '',
    district: '',
    state: '',
    pincode: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    aadhaarCard: null,
    aadhaarFront: null,
    aadhaarBack: null,
    aadhaarNumber: '',
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
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo upload state for welcome checklist
  const [uploadPhotos, setUploadPhotos] = useState<Array<string | null>>([null, null, null]);
  const MIN_PHOTOS_REQUIRED = 2;  const colorScheme = useColorScheme() ?? 'light';
  const isDarkMode = colorScheme === 'dark';
  const ownershipTypes = [t('owned'), t('leased'), t('joint_ownership')];
  const irrigationSources = [t('borewell'), t('canal')];
  const soilTypes = [t('sandy'), t('loamy'), t('clayey'), t('laterite')];
  const soilTypeKeys = ['sandy', 'loamy', 'clayey', 'laterite'];
  const irrigationTypes = [t('drip'), t('manual')];
  const accountTypes = [t('savings'), t('current')];
  const paymentCopy = language === 'ta'
    ? {
        gatewayTitle: 'கட்டண நுழைவாயில்',
        title: 'NAAM பதிவு கட்டணம்',
        description: 'உங்கள் விவசாயி பதிவை முடிக்க கட்டணத்தை செலுத்தவும்',
        button: 'இப்போது கட்டணம் செலுத்தவும்',
      }
    : {
        gatewayTitle: 'Payment Gateway',
        title: 'NAAM Registration Fee',
        description: 'Complete your farmer registration by paying the registration fee',
        button: 'Pay Now',
      };

  useEffect(() => {
    fetchStates();
    fetchFees();
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const fetchFees = async () => {
    try {
      const fee = await apiService.getFees();
      if (fee > 0) {
        setFarmerFee(fee);
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
    }
  };

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

  const openStateModal = async () => {
    // Ensure states are loaded before showing the modal
    if (states.length === 0 && !loadingStates) {
      await fetchStates();
    }
    setShowStateModal(true);
  };

  const selectState = async (state: State) => {
    setFormData((prev: any) => ({ ...prev, state: language === 'ta' ? (state.statet_name || state.state) : state.state, district: '', taluk: '', panchayat: '', village: '' }));
    setSelectedStateId(state.id);
    setSelectedDistrictId(null);
    setSelectedTalukId(null);
    setSelectedPanchayatId(null);
    setSelectedVillageId(null);
    setPanchayats([]);
    setDistricts([]);
    setVillages([]);
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
    setFormData((prev: any) => ({ ...prev, district: language === 'ta' ? (district.district_tname || district.district_name) : district.district_name, taluk: '', panchayat: '', village: '', subdistrict: '' }));
    setSelectedDistrictId(district.id);
    // clear downstream selections
    setSelectedTalukId(null);
    setSelectedPanchayatId(null);
    setSelectedVillageId(null);
    setSelectedSubdistrictId(null);
    setTaluks([]);
    setVillages([]);
    setPanchayats([]);
    setSubdistricts([]);
    setShowDistrictModal(false);
    try {
      const taluksData = await apiService.getTaluks(district.id);
      setTaluks(taluksData);
    } catch (error) {
      console.error('❌ Error fetching taluks:', error);
      Alert.alert('Error', 'Failed to load taluks');
    }

    // fetch subdistricts for this district
    try {
      const subs = await apiService.getSubdistricts(district.id);
      setSubdistricts(subs);
    } catch (error) {
      console.error('❌ Error fetching subdistricts:', error);
    }
  };

  const selectTaluk = async (taluk: Taluk) => {
    setFormData((prev: any) => ({ ...prev, taluk: taluk.taluk_name, village: '' }));
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
    setFormData((prev: any) => ({ ...prev, village: village.village_name }));
    setSelectedVillageId(village.id);
    setShowVillageModal(false);
  };

  const selectSubdistrict = (sd: any) => {
    setFormData((prev: any) => ({ ...prev, subdistrict: language === 'ta' ? (sd.subdistrict_tname || sd.subdistrict_code || sd.subdistrict_name) : sd.subdistrict_name, taluk: '', panchayat: '', village: '' }));
    setSelectedSubdistrictId(sd.id);
    // clear downstream
    setSelectedTalukId(null);
    setSelectedPanchayatId(null);
    setSelectedVillageId(null);
    setTaluks([]);
    setVillages([]);
    setPanchayats([]);
    setShowSubdistrictModal(false);
    // optionally load taluks for district (keeps previous behaviour)
    (async () => {
      try {
        const taluksData = await apiService.getTaluks(selectedDistrictId!);
        setTaluks(taluksData);
      } catch (error) {
        console.error('❌ Error fetching taluks after subdistrict selection:', error);
      }
    })();
  };

  const selectLandState = async (state: State) => {
    setFormData((prev: any) => ({ ...prev, landState: language === 'ta' ? (state.statet_name || state.state) : state.state, landDistrict: '' }));
    setSelectedLandStateId(state.id);
    setShowLandStateModal(false);
    try {
      const districtsData = await apiService.getDistricts(state.id);
      setLandDistricts(districtsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load land districts');
    }
  };

  const selectLandDistrict = async (district: District) => {
    setFormData((prev: any) => ({ ...prev, landDistrict: language === 'ta' ? (district.district_tname || district.district_name) : district.district_name, landTaluk: '', landVillage: '' }));
    setSelectedLandDistrictId(district.id);
    // clear downstream land selections
    setSelectedLandTalukId(null);
    setSelectedLandVillageId(null);
    setLandTaluks([]);
    setLandVillages([]);
    setShowLandDistrictModal(false);
    try {
      const taluksData = await apiService.getTaluks(district.id);
      setLandTaluks(taluksData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load land taluks');
    }
  };

  const selectLandTaluk = async (taluk: Taluk) => {
    setFormData((prev: any) => ({ ...prev, landTaluk: taluk.taluk_name, landVillage: '' }));
    setSelectedLandTalukId(taluk.id);
    setShowLandTalukModal(false);
    try {
      const villagesData = await apiService.getVillages(selectedLandDistrictId!, taluk.id);
      setLandVillages(villagesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load land villages');
    }
  };

  const selectLandVillage = (village: Village) => {
    setFormData((prev: any) => ({ ...prev, landVillage: village.village_name }));
    setSelectedLandVillageId(village.id);
    setShowLandVillageModal(false);
  };

  const handlePinCodeSelect = () => {
    setShowPincodeModal(true);
  };

  const handleMyLocation = () => {
    try {
      navigator.geolocation.getCurrentPosition((pos: any) => {
        const { latitude, longitude } = pos.coords;
        updateField('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setIntroMode(false);
        setIntroStep(0);
      }, (err: any) => {
        Alert.alert(t('error'), 'Unable to get location');
      });
    } catch (e) {
      Alert.alert(t('error'), 'Unable to get location');
    }
  };

  const handleChooseFromMap = () => {
    setShowMapModal(true);
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

    console.log('🏦 Starting bank account validation...');
    console.log('📋 Bank details:', {
      accountHolderName: formData.accountHolderName,
      ifscCode: formData.ifscCode,
      accountNumber: formData.accountNumber,
      email: formData.emailId,
      mobile: formData.mobileNumber
    });

    setValidationLoading(true);
    try {
      // Step 1: Create contact
      console.log('📞 Step 1: Creating Razorpay contact...');
      const contactPayload = {
        name: formData.accountHolderName,
        email: formData.emailId || '',
        contact: formData.mobileNumber,
        type: 'vendor',
        reference_id: formData.mobileNumber
      };
      console.log('📤 Contact payload:', JSON.stringify(contactPayload, null, 2));
      
      const contactResponse = await fetch('https://api.razorpay.com/v1/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic cnpwX3Rlc3RfUmNQb3hURHVpa1U1TUs6UThxTU1tcUZ1ZHk1T1RvUFlmeGJyZVNm'
        },
        body: JSON.stringify(contactPayload)
      });
      
      console.log('📡 Contact response status:', contactResponse.status);
      const contactData = await contactResponse.json();
      console.log('📥 Contact response data:', JSON.stringify(contactData, null, 2));
      
      if (!contactResponse.ok) {
        console.error('❌ Contact creation failed:', contactData);
        throw new Error(`Contact creation failed: ${contactData.error?.description || 'Unknown error'}`);
      }
      console.log('✅ Contact created successfully, ID:', contactData.id);

      // Step 2: Create fund account
      console.log('💰 Step 2: Creating fund account...');
      const fundAccountPayload = {
        contact_id: contactData.id,
        account_type: 'bank_account',
        bank_account: {
          name: formData.accountHolderName,
          ifsc: formData.ifscCode,
          account_number: formData.accountNumber
        }
      };
      console.log('📤 Fund account payload:', JSON.stringify(fundAccountPayload, null, 2));
      
      const fundAccountResponse = await fetch('https://api.razorpay.com/v1/fund_accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic cnpwX3Rlc3RfUmNQb3hURHVpa1U1TUs6UThxTU1tcUZ1ZHk1T1RvUFlmeGJyZVNm'
        },
        body: JSON.stringify(fundAccountPayload)
      });
      
      console.log('📡 Fund account response status:', fundAccountResponse.status);
      const fundAccountData = await fundAccountResponse.json();
      console.log('📥 Fund account response data:', JSON.stringify(fundAccountData, null, 2));
      
      if (!fundAccountResponse.ok) {
        console.error('❌ Fund account creation failed:', fundAccountData);
        throw new Error(`Fund account creation failed: ${fundAccountData.error?.description || 'Unknown error'}`);
      }
      console.log('✅ Fund account created successfully, ID:', fundAccountData.id);

      // Step 3: Validate account
      console.log('🔍 Step 3: Validating account...');
      const validationPayload = {
        account_number: "2323230050073818",
        fund_account: { id: fundAccountData.id },
        amount: 100,
        currency: 'INR'
      };
      console.log('📤 Validation payload:', JSON.stringify(validationPayload, null, 2));
      
      const validationResponse = await fetch('https://api.razorpay.com/v1/fund_accounts/validations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic cnpwX3Rlc3RfUmNQb3hURHVpa1U1TUs6UThxTU1tcUZ1ZHk1T1RvUFlmeGJyZVNm'
        },
        body: JSON.stringify(validationPayload)
      });
      
      console.log('📡 Validation response status:', validationResponse.status);
      const validationData = await validationResponse.json();
      console.log('📥 Validation response data:', JSON.stringify(validationData, null, 2));
      
      if (validationResponse.ok && validationData.status === 'created') {
        console.log('✅ Account validation successful!');
        setVerificationStatus(prev => ({ ...prev, accountValidated: true }));
        Alert.alert('Success', 'Account validation successful!', [
          { text: 'OK', onPress: () => setActiveTab(activeTab + 1) }
        ]);
      } else {
        console.error('❌ Account validation failed:', validationData);
        throw new Error(`Account validation failed: ${validationData.error?.description || validationData.status || 'Unknown error'}`);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('💥 Bank validation error:', error);
      console.error('💥 Error message:', message);
      Alert.alert('Validation Failed', `Error: ${message}\n\nPlease check your account details and try again.`);
    } finally {
      setValidationLoading(false);
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
    if (isSubmitting) return;
    console.log('🚀 Starting farmer registration submission...');
    setIsSubmitting(true);
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
      
      console.log('📋 Form data summary:', {
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
      // Aadhaar front/back
      if (formData.aadhaarFront) {
        console.log('✅ Adding Aadhaar front');
        formDataToSend.append('aadhar_front', {
          uri: formData.aadhaarFront,
          type: 'image/jpeg',
          name: 'aadhar_front.jpg'
        } as any);
      }
      if (formData.aadhaarBack) {
        console.log('✅ Adding Aadhaar back');
        formDataToSend.append('aadhar_back', {
          uri: formData.aadhaarBack,
          type: 'image/jpeg',
          name: 'aadhar_back.jpg'
        } as any);
      }
      // Fallback single aadhar copy
      if (formData.aadhaarCard && !formData.aadhaarFront && !formData.aadhaarBack) {
        console.log('✅ Adding Aadhaar card');
        formDataToSend.append('aadhar_copy', {
          uri: formData.aadhaarCard,
          type: 'image/jpeg',
          name: 'aadhar.jpg'
        } as any);
      }
      // Aadhaar number
      if (formData.aadhaarNumber) {
        formDataToSend.append('aadhar_number', formData.aadhaarNumber.toString());
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
      
      formDataToSend.append('role_id', '2'); // Farmer role
      
      // Log FormData contents
      console.log('📦 FormData payload contents:');
      const formIterator = (formDataToSend as any).entries?.();
      if (formIterator) {
        for (const [key, value] of formIterator) {
          if (typeof value === 'object' && value?.uri) {
            console.log(`  ${key}: [FILE] ${value.name} (${value.type})`);
          } else {
            console.log(`  ${key}: ${value}`);
          }
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
      
      if (registerResponse.ok && registerResult.status === 'success' && registerResult.data?.user?.id) {
        console.log('✅ User registration successful, ID:', registerResult.data.user.id);
        
        // Submit land details
        console.log('🌾 Preparing land details submission...');
        const landFormData = new FormData();
        landFormData.append('land_ownership_type', formData.landOwnershipType);
        landFormData.append('total_land_holding', formData.totalLandHolding);
        landFormData.append('irrigation_source', formData.irrigationSource);
        landFormData.append('soil_type', formData.soilType);
        landFormData.append('irrigation_type', formData.irrigationType);
        
        const [lat, lng] = formData.location.split(', ');
        landFormData.append('land_lattitude', lat);
        landFormData.append('land_longitude', lng);
        
        landFormData.append('village', formData.landVillage);
        landFormData.append('taluk', formData.landTaluk);
        landFormData.append('district', formData.landDistrict);
        landFormData.append('state', formData.landState);
        landFormData.append('pincode', formData.landPincode);
        landFormData.append('patta_number', formData.pattaNo);
        landFormData.append('coconut_farm', formData.coconutFarming === 'yes' ? '1' : '0');
        
        console.log('🥥 Coconut farming:', formData.coconutFarming);
        if (formData.coconutFarming === 'yes') {
          console.log('✅ Adding coconut farming details');
          landFormData.append('coconut_area', formData.areaUnderCoconut);
          landFormData.append('no_of_trees', formData.numberOfTrees);
          landFormData.append('trees_age', formData.averageAgeOfTrees);
          landFormData.append('estimated_falling', formData.estimatedCoconuts);
          // Convert date from DD/MM/YYYY to YYYY-MM-DD format
          const harvestDateParts = formData.lastHarvestDate.split('/');
          const formattedHarvestDate = `${harvestDateParts[2]}-${harvestDateParts[1].padStart(2, '0')}-${harvestDateParts[0].padStart(2, '0')}`;
          landFormData.append('last_harvest_date', formattedHarvestDate);
        }
        
        if (formData.geoTaggedPhoto) {
          console.log('✅ Adding geo-tagged photo');
          landFormData.append('geo_photo', {
            uri: formData.geoTaggedPhoto,
            type: 'image/jpeg',
            name: 'geo_photo.jpg'
          } as any);
        }
        
        landFormData.append('user_id', registerResult.data.user.id.toString());
        
        // Log Land FormData contents
        console.log('📦 Land FormData payload contents:');
        const landIterator = (landFormData as any).entries?.();
        if (landIterator) {
          for (const [key, value] of landIterator) {
            if (typeof value === 'object' && value?.uri) {
              console.log(`  ${key}: [FILE] ${value.name} (${value.type})`);
            } else {
              console.log(`  ${key}: ${value}`);
            }
          }
        }
        
        console.log('🌐 Sending land details request to API...');
        console.log('📍 API URL: http://65.0.100.65:8000/api/users/land-details');
        console.log('📤 Request method: POST');
        console.log('📋 Request headers: Content-Type: multipart/form-data');
        
        const landResponse = await fetch('http://65.0.100.65:8000/api/users/land-details', {
          method: 'POST',
          body: landFormData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log('📡 Land details response status:', landResponse.status);
        console.log('📡 Land details response statusText:', landResponse.statusText);
        console.log('📡 Land details response ok:', landResponse.ok);
        console.log('📡 Land details response headers:');
        for (let [key, value] of landResponse.headers.entries()) {
          console.log(`  ${key}: ${value}`);
        }
        
        const landResponseText = await landResponse.text();
        console.log('📄 Raw land response text:', landResponseText);
        
        let landResult;
        try {
          landResult = JSON.parse(landResponseText);
          console.log('📋 Parsed land details response data:', landResult);
        } catch (parseError) {
          console.error('❌ Failed to parse land response as JSON:', parseError);
          console.log('📄 Land response was not valid JSON, raw text:', landResponseText);
          throw new Error(`Invalid JSON response: ${landResponseText}`);
        }
        
        if (landResponse.ok) {
          console.log('✅ Registration completed successfully!');
          
          // Store registration result for later use (in payment success handler)
          const userData = registerResult.data.user;
          const token = registerResult.data.token || registerResult.token;
          setRegistrationResult({ user: userData, token });
          
          // Initiate Razorpay payment
          if (farmerFee && farmerFee > 0) {
            initiatePayment(registerResult.data.user.id, farmerFee);
          } else {
            // No payment required - store user data and redirect to dashboard
            await storeUserData(userData, token);
            Alert.alert(t('registration_successful'), t('welcome_naam'), [
              { text: 'OK', onPress: () => router.replace('/dashboard') }
            ]);
          }
        } else {
          console.error('❌ Land details submission failed:', landResult);
          Alert.alert('Error', `Failed to submit land details: ${landResult.message || 'Unknown error'}`);
        }
      } else {
        console.error('❌ User registration failed:', registerResult);
        Alert.alert('Error', `Registration failed: ${registerResult.message || 'Unknown error'}`);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('💥 Network error during registration:', error);
      Alert.alert('Error', `Network error occurred: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string | null) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
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

  // --- Welcome-photo helpers (for introStep 4) ---
  const pickWelcomePhoto = async (index: number, source: 'camera' | 'gallery') => {
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('error'), 'Camera permission is required.');
          return;
        }
        const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
        if (!res.canceled && (res as any).assets[0]) {
          const uri = (res as any).assets[0].uri;
          setUploadPhotos(prev => { const copy = [...prev]; copy[index] = uri; return copy; });
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('error'), 'Media library permission is required.');
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
        if (!res.canceled && (res as any).assets[0]) {
          const uri = (res as any).assets[0].uri;
          setUploadPhotos(prev => { const copy = [...prev]; copy[index] = uri; return copy; });
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeWelcomePhoto = (index: number) => {
    setUploadPhotos(prev => { const copy = [...prev]; copy[index] = null; return copy; });
  };

  const onWelcomeContinue = () => {
    const photosCount = uploadPhotos.filter(Boolean).length;
    if (photosCount < MIN_PHOTOS_REQUIRED) {
      Alert.alert(t('error'), language === 'ta' ? 'NAAM படங்களுக்கான குறைந்தபட்சம் 2 புகைப்படங்கள் தேவை' : 'Please upload at least 2 photos');
      return;
    }

    // Save uploaded photos to formData fields (use existing fields)
    setFormData((prev: any) => ({ ...prev, passportPhoto: uploadPhotos[0] || prev.passportPhoto, geoTaggedPhoto: uploadPhotos[1] || prev.geoTaggedPhoto, aadhaarCard: uploadPhotos[2] || prev.aadhaarCard }));
    // Proceed to Aadhaar details step
    setIntroStep(5);
  };

  // Aadhaar image helpers
  const pickAadhaarPhoto = async (side: 'front' | 'back', source: 'camera' | 'gallery') => {
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('error'), 'Camera permission is required.');
          return;
        }
        const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
        if (!res.canceled && (res as any).assets[0]) {
          const uri = (res as any).assets[0].uri;
          setFormData((prev: any) => ({ ...prev, aadhaarFront: side === 'front' ? uri : prev.aadhaarFront, aadhaarBack: side === 'back' ? uri : prev.aadhaarBack }));
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('error'), 'Media library permission is required.');
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
        if (!res.canceled && (res as any).assets[0]) {
          const uri = (res as any).assets[0].uri;
          setFormData((prev: any) => ({ ...prev, aadhaarFront: side === 'front' ? uri : prev.aadhaarFront, aadhaarBack: side === 'back' ? uri : prev.aadhaarBack }));
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeAadhaarPhoto = (side: 'front' | 'back') => {
    setFormData((prev: any) => ({ ...prev, aadhaarFront: side === 'front' ? null : prev.aadhaarFront, aadhaarBack: side === 'back' ? null : prev.aadhaarBack }));
  };

  const handleIFSCVerification = (ifscCode: string) => {
    // Simulate IFSC verification
    if (ifscCode.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      setTimeout(() => {
        setVerificationStatus(prev => ({ ...prev, ifscVerified: true }));
        //updateField('bankName', 'State Bank of India');
        //updateField('branchName', 'Main Branch');
      }, 1000);
    } else {
      console.log('Invalid IFSC code');
      setVerificationStatus(prev => ({ ...prev, ifscVerified: false }));
    }
  };

  const handleAccountVerification = (accountNumber: string) => {
    // Simulate account verification
    if (accountNumber.length >= 9 && /^[0-9]+$/.test(accountNumber)) {
      setTimeout(() => {
        setVerificationStatus(prev => ({ ...prev, accountVerified: true }));
       // Alert.alert('Account Verified', 'Account number is valid');
      }, 1000);
    } else {
      setVerificationStatus(prev => ({ ...prev, accountVerified: false }));
    }
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString('en-GB');
      updateField('dateOfBirth', formattedDate);
      const age = calculateAge(selectedDate);
      updateField('age', age);
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
      // If user came from the intro location selector, proceed to the full form
      if (introStep === 1) {
        setIntroMode(false);
        setIntroStep(0);
      }
    }
  };

  const validateTab = (tabIndex: number) => {
    switch (tabIndex) {
      case 0: // Basic Info
        return formData.fullName && formData.mobileNumber && formData.address && 
               formData.state && formData.district && formData.taluk && formData.village && 
               formData.pincode && formData.gender && formData.dateOfBirth;
      case 1: // Land Details
        const basicLandFields = formData.landOwnershipType && formData.totalLandHolding && 
                               formData.irrigationSource && formData.soilType && formData.irrigationType && 
                               formData.location && formData.landState && formData.landDistrict && 
                               formData.landTaluk && formData.landVillage && formData.landPincode && 
                               formData.pattaNo && formData.coconutFarming;
        
        if (formData.coconutFarming === 'yes') {
          return basicLandFields && formData.areaUnderCoconut && formData.numberOfTrees && 
                 formData.averageAgeOfTrees && formData.estimatedCoconuts && formData.lastHarvestDate;
        }
        return basicLandFields;
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
                onPress={() => openStateModal()}
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
                  <View style={[styles.radioButton, { borderColor: formData.gender === 'Male' ? '#48bb78' : '#cbd5e0' }]}>
                    {formData.gender === 'Male' && <View style={styles.radioButtonSelected} />}
                  </View>
                  <ThemedText style={styles.radioText}>{t('male')}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => updateField('gender', 'Female')}
                >
                  <View style={[styles.radioButton, { borderColor: formData.gender === 'Female' ? '#48bb78' : '#cbd5e0' }]}>
                    {formData.gender === 'Female' && <View style={styles.radioButtonSelected} />}
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

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('age')} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.age}
                placeholder={t('age_calculated')}
                keyboardType="numeric"
                maxLength={3}
                editable={false}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>
          </View>
        );
      case 1:
        return (
          <View>
            <ThemedText style={styles.sectionTitle}>{t('land_details')}</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('land_ownership_type')} *</ThemedText>
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
              <ThemedText style={styles.label}>{t('total_land_holding')} *</ThemedText>
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
              <ThemedText style={styles.label}>{t('irrigation_source')} *</ThemedText>
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
              <ThemedText style={styles.label}>{t('soil_type')} *</ThemedText>
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
              <ThemedText style={styles.label}>{t('irrigation_type')} *</ThemedText>
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
              <ThemedText style={styles.label}>{t('location_coordinates')} *</ThemedText>
              <View style={styles.locationContainer}>
                <TextInput
                  style={[styles.locationInput, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                  value={formData.location}
                  onChangeText={(value) => updateField('location', value)}
                  placeholder={t('enter_coordinates')}
                  placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                />
                <TouchableOpacity 
                  style={[styles.mapButton, { backgroundColor: '#48bb78' }]}
                  onPress={() => setShowMapModal(true)}
                >
                  <IconSymbol name="location.fill" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
             <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('state')} *</ThemedText>
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
              <ThemedText style={styles.label}>{t('district')} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => selectedLandStateId ? setShowLandDistrictModal(true) : Alert.alert(t('select_land_state_first'))}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.landDistrict ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.landDistrict || t('select_district')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>
             <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('taluk_block')} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => selectedLandDistrictId ? setShowLandTalukModal(true) : Alert.alert(t('select_land_district_first'))}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.landTaluk ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.landTaluk || t('select_taluk')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('village_panchayat')} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => selectedLandTalukId ? setShowLandVillageModal(true) : Alert.alert(t('select_land_taluk_first'))}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.landVillage ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.landVillage || t('select_village')}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('pincode')} *</ThemedText>
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
              <ThemedText style={styles.label}>{t('geo_tagged_photo')}</ThemedText>
              <View style={styles.fileUploadContainer}>
                {formData.geoTaggedPhoto ? (
                  <View style={[styles.uploadedFile, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f0fff4' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#48bb78" />
                    <ThemedText style={styles.uploadedText}>{t('farm_photo_uploaded')}</ThemedText>
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
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('geoTaggedPhoto', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#48bb78" />
                      <ThemedText style={styles.uploadButtonText}>{t('choose_photo')}</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('patta_no')} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.pattaNo}
                onChangeText={(value) => updateField('pattaNo', value)}
                placeholder={t('enter_patta_number')}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('coconut_farming')} *</ThemedText>
              <View style={styles.radioGroup}>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => updateField('coconutFarming', 'yes')}
                >
                  <View style={[styles.radioButton, { borderColor: formData.coconutFarming === 'yes' ? '#48bb78' : '#cbd5e0' }]}>
                    {formData.coconutFarming === 'yes' && <View style={styles.radioButtonSelected} />}
                  </View>
                  <ThemedText style={styles.radioText}>{t('yes')}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.radioOption}
                  onPress={() => updateField('coconutFarming', 'no')}
                >
                  <View style={[styles.radioButton, { borderColor: formData.coconutFarming === 'no' ? '#48bb78' : '#cbd5e0' }]}>
                    {formData.coconutFarming === 'no' && <View style={styles.radioButtonSelected} />}
                  </View>
                  <ThemedText style={styles.radioText}>{t('no')}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {formData.coconutFarming === 'yes' && (
              <View>
                <ThemedText style={[styles.sectionTitle, { fontSize: 18, marginTop: 20, marginBottom: 16 }]}>{t('coconut_farming_details')}</ThemedText>
                
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{t('coconut_area')} *</ThemedText>
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
                  <ThemedText style={styles.label}>{t('number_of_trees')} *</ThemedText>
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
                  <ThemedText style={styles.label}>{t('average_age_trees')} *</ThemedText>
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
                  <ThemedText style={styles.label}>{t('estimated_coconuts')} *</ThemedText>
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
                  <ThemedText style={styles.label}>{t('last_harvest_date')} *</ThemedText>
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
                      borderColor: verificationStatus.ifscVerified ? '#48bb78' : 'transparent',
                    }
                  ]}
                  value={formData.ifscCode}
                  onChangeText={(value) => {
                    updateField('ifscCode', value.toUpperCase());
                    if (value.length === 11) {
                      handleIFSCVerification(value);
                    }
                  }}
                  placeholder={t('enter_ifsc_code')}
                  maxLength={11}
                  autoCapitalize="characters"
                  placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                />
                {verificationStatus.ifscVerified && (
                  <View style={styles.verifiedBadge}>
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
                      borderColor: verificationStatus.accountVerified ? '#48bb78' : 'transparent',
                    }
                  ]}
                  value={formData.accountNumber}
                  onChangeText={(value) => {
                    updateField('accountNumber', value);
                    if (value.length >= 9) {
                      handleAccountVerification(value);
                    }
                  }}
                  placeholder={t('enter_account_number')}
                  keyboardType="numeric"
                  placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                />
                {verificationStatus.accountVerified && (
                  <View style={styles.verifiedBadge}>
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
              <ThemedText style={styles.label}>{t('upi_id')}</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.upiId}
                onChangeText={(value) => updateField('upiId', value)}
                placeholder={t('enter_upi_id')}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('bank_passbook')} *</ThemedText>
              <View style={styles.fileUploadContainer}>
                {formData.bankPassbook ? (
                  <View style={[styles.uploadedFile, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f0fff4' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#48bb78" />
                    <ThemedText style={styles.uploadedText}>{t('passbook_uploaded')}</ThemedText>
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
                      <IconSymbol name="camera.fill" size={24} color="#48bb78" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('bankPassbook', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#48bb78" />
                      <ThemedText style={styles.uploadButtonText}>{t('choose_photo')}</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {verificationStatus.accountValidated && (
              <View style={[styles.validationSuccess, { backgroundColor: '#f0fff4', borderColor: '#48bb78' }]}>
                <IconSymbol name="checkmark.circle.fill" size={20} color="#48bb78" />
                <ThemedText style={[styles.validationText, { color: '#48bb78' }]}>Account validated successfully!</ThemedText>
              </View>
            )}
          </View>
        );
      case 3:
        return (
          <View>
            <ThemedText style={styles.sectionTitle}>{t('documents')}</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('aadhar_card')} *</ThemedText>
              <View style={styles.fileUploadContainer}>
                {formData.aadhaarCard ? (
                  <View style={[styles.uploadedFile, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f0fff4' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#48bb78" />
                    <ThemedText style={styles.uploadedText}>{t('aadhar_uploaded')}</ThemedText>
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
                      <IconSymbol name="camera.fill" size={24} color="#48bb78" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('aadhaarCard', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#48bb78" />
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
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#48bb78" />
                    <ThemedText style={styles.uploadedText}>{t('pan_uploaded')}</ThemedText>
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
                      <IconSymbol name="camera.fill" size={24} color="#48bb78" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('panCard', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#48bb78" />
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
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#48bb78" />
                    <ThemedText style={styles.uploadedText}>{t('passport_uploaded')}</ThemedText>
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
                      <IconSymbol name="camera.fill" size={24} color="#48bb78" />
                      <ThemedText style={styles.uploadButtonText}>{t('take_photo')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('passportPhoto', 'gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#48bb78" />
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

  const renderIntro = () => { return introStep === 0 ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 80, backgroundColor: isDarkMode ? '#0f172a' : '#ecfdf5' }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introCard}>
            <ThemedText style={styles.introTitle}>{language === 'ta' ? 'புதிய பதிவு' : t('new_registration')}</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('full_name')}</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.fullName}
                onChangeText={(value) => updateField('fullName', value)}
                placeholder={t('enter_full_name')}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('mobile_number')}</ThemedText>
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
              <ThemedText style={styles.label}>{t('preferred_language')}</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setLanguage(language === 'ta' ? 'en' : 'ta')}
              >
                <ThemedText style={[styles.dropdownText, { color: Colors[colorScheme].text }]}>{language === 'ta' ? 'தமிழ்' : 'English'}</ThemedText>
                <IconSymbol name="chevron.down" size={16} color="#4a5568" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={() => {
              if (!formData.fullName) { Alert.alert(t('error'), t('enter_full_name')); return; }
              if (!formData.mobileNumber || formData.mobileNumber.length < 10) { Alert.alert(t('error'), t('enter_mobile_error')); return; }
              setIntroStep(1);
            }}>
              <ThemedText style={styles.continueButtonText}>{language === 'ta' ? 'தொடரவும்' : t('continue')}</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        introStep === 1 ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 80, backgroundColor: isDarkMode ? '#0f172a' : '#ecfdf5' }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.introCard}>
              <ThemedText style={styles.introTitle}>{language === 'ta' ? 'இருப்பிடம் தேர்ந்தெடுக்கவும்' : t('choose_location_title')}</ThemedText>

              <TouchableOpacity style={styles.locationOption} onPress={() => { setPincodeInput(formData.pincode || ''); setIntroStep(2); }}>
                <View style={styles.locationOptionIcon}><IconSymbol name="mappin" size={20} color="#0bb24c" /></View>
                <ThemedText style={styles.locationOptionText}>{t('pin_code')}</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.locationOption} onPress={async () => {
                try {
                  navigator.geolocation.getCurrentPosition((pos: any) => {
                    const { latitude, longitude } = pos.coords;
                    updateField('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                    setIntroMode(false);
                    setIntroStep(0);
                  }, (err: any) => {
                    Alert.alert(t('error'), 'Unable to get location');
                  });
                } catch (e) {
                  Alert.alert(t('error'), 'Unable to get location');
                }
              }}>
                <View style={styles.locationOptionIcon}><IconSymbol name="paperplane" size={20} color="#0bb24c" /></View>
                <ThemedText style={styles.locationOptionText}>{t('my_location')}</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.locationOption} onPress={() => { setIntroMode(true); setIntroStep(7); }}>
                <View style={styles.locationOptionIcon}><IconSymbol name="list.bullet" size={20} color="#0bb24c" /></View>
                <ThemedText style={styles.locationOptionText}>{t('manual_selection')}</ThemedText>
              </TouchableOpacity>

            </View>
          </ScrollView>
        ) : introStep === 2 ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 80, backgroundColor: isDarkMode ? '#0f172a' : '#ecfdf5' }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.introCard}>
              <ThemedText style={styles.locationTitle}>{language === 'ta' ? 'பின் கோடு' : t('pin_code')}</ThemedText>

              <TextInput
                style={styles.pincodeInput}
                keyboardType="number-pad"
                maxLength={6}
                value={pincodeInput}
                onChangeText={setPincodeInput}
                placeholder={language === 'ta' ? 'உதாரணம்: 600001' : t('enter_pincode')}
              />

              <TouchableOpacity style={styles.continueButton} onPress={() => {
                if (!/^\d{6}$/.test(pincodeInput)) { Alert.alert(t('error'), t('enter_pincode')); return; }
                updateField('pincode', pincodeInput);
                // show welcome checklist before moving to full form
                setIntroStep(3);
              }}>
                <ThemedText style={styles.continueButtonText} lightColor="#fff" darkColor="#fff" type="defaultSemiBold">{language === 'ta' ? 'தொடரவும்' : t('continue')}</ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : introStep === 3 ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 80, backgroundColor: isDarkMode ? '#0f172a' : '#ecfdf5' }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.introCard}>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <View style={styles.welcomeAvatar}><ThemedText>👋</ThemedText></View>
              </View>

              <ThemedText style={styles.introTitle}>{language === 'ta' ? `வரவேற்கிறோம், ${formData.fullName || ''}!` : `Welcome, ${formData.fullName || ''}!`}</ThemedText>
              <ThemedText style={styles.welcomeSubtitle}>{language === 'ta' ? 'உங்கள் சுயவிவரத்தை முழுமையாக சில படிகள் மட்டுமே' : 'Complete your profile in a few simple steps'}</ThemedText>

              <View style={{ marginTop: 20 }}>
                <View style={styles.checkItem}>
                  <View style={styles.checkNumber}><ThemedText style={{ color: '#fff', fontWeight: '700' }}>1</ThemedText></View>
                  <ThemedText style={styles.checkText}>{language === 'ta' ? 'புகைப்படம் பதிவேற்றம்' : 'Upload Photo'}</ThemedText>
                </View>

                <View style={styles.checkItem}>
                  <View style={styles.checkNumber}><ThemedText style={{ color: '#fff', fontWeight: '700' }}>2</ThemedText></View>
                  <ThemedText style={styles.checkText}>{language === 'ta' ? 'ஆதார் விவரங்கள்' : 'Aadhaar Details'}</ThemedText>
                </View>

                <View style={styles.checkItem}>
                  <View style={styles.checkNumber}><ThemedText style={{ color: '#fff', fontWeight: '700' }}>3</ThemedText></View>
                  <ThemedText style={styles.checkText}>{language === 'ta' ? 'ஒப்புதல்' : 'Consent'}</ThemedText>
                </View>

                <TouchableOpacity style={styles.continueButton} onPress={() => setIntroStep(4)}>
                  <ThemedText style={styles.continueButtonText} lightColor="#fff" darkColor="#fff" type="defaultSemiBold">{language === 'ta' ? 'தொடரவும்' : t('continue')}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : introStep === 4 ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 80, backgroundColor: isDarkMode ? '#0f172a' : '#ecfdf5' }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.introCard, { maxWidth: 760 }]}> 
              <ThemedText style={styles.introTitle}>{language === 'ta' ? 'உங்கள் புகைப்படங்கள்' : 'Your photos'}</ThemedText>
              <ThemedText style={styles.welcomeSubtitle}>{language === 'ta' ? 'NAAM உடைய அடையாளத்திற்கு 2-3 புகைப்படங்கள் பதிவேற்றவும்' : 'Upload 2-3 photos for your NAAM profile'}</ThemedText>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                {[0,1,2].map(i => (
                  <TouchableOpacity key={`photo-${i}`} style={styles.photoBox} onPress={() => {
                    const options = [] as any[];
                    options.push({ text: language === 'ta' ? 'கேமரா' : 'Take Photo', onPress: () => pickWelcomePhoto(i, 'camera') });
                    options.push({ text: language === 'ta' ? 'படத்தைக் தேர்வு செய்க' : 'Choose from Library', onPress: () => pickWelcomePhoto(i, 'gallery') });
                    if (uploadPhotos[i]) options.push({ text: language === 'ta' ? 'நீக்கு' : 'Remove', onPress: () => removeWelcomePhoto(i), style: 'destructive' });
                    options.push({ text: language === 'ta' ? 'ரத்து செய்' : 'Cancel', style: 'cancel' });
                    Alert.alert('', '', options);
                  }}>
                    {uploadPhotos[i] ? (
                      <Image source={{ uri: uploadPhotos[i]! }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <IconSymbol name="camera.fill" size={28} color="#9aa3ad" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', marginTop: 24, gap: 12 }}>
                <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => setIntroStep(3)}>
                  <ThemedText style={styles.secondaryButtonText}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.continueButton, { flex: 1, opacity: uploadPhotos.filter(Boolean).length >= MIN_PHOTOS_REQUIRED ? 1 : 0.5 }]}
                  onPress={onWelcomeContinue}
                  disabled={uploadPhotos.filter(Boolean).length < MIN_PHOTOS_REQUIRED}
                >
                  <ThemedText style={styles.continueButtonText} lightColor="#fff" darkColor="#fff" type="defaultSemiBold">{language === 'ta' ? 'அடுத்தது' : 'Continue'}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : introStep === 5 ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 80, backgroundColor: isDarkMode ? '#0f172a' : '#ecfdf5' }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.introCard, { maxWidth: 760 }]}> 
              <ThemedText style={styles.introTitle}>{language === 'ta' ? 'ஆதார் விவரங்கள்' : 'Aadhaar details'}</ThemedText>
              <ThemedText style={styles.welcomeSubtitle}>{language === 'ta' ? 'உங்கள் ஆதார் எண் மற்றும் படங்களை பதிவேற்றவும்' : 'Upload your Aadhaar number and photos'}</ThemedText>

              <View style={{ marginTop: 18 }}>
                <ThemedText style={styles.label}>{language === 'ta' ? 'ஆதார் எண்' : 'Aadhaar number'}</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                  placeholder={language === 'ta' ? 'XXXX XXXX XXXX' : 'XXXX XXXX XXXX'}
                  value={aadhaarNumberInput}
                  keyboardType="number-pad"
                  maxLength={14}
                  onChangeText={(v) => {
                    const digits = v.replace(/\D/g, '');
                    const formatted = digits.replace(/(\d{4})(\d{4})(\d{4})/, (m, a, b, c) => `${a} ${b} ${c}`);
                    setAadhaarNumberInput(formatted);
                  }}
                />

                <ThemedText style={[styles.label, { marginTop: 16 }]}>{language === 'ta' ? 'ஆதார் முன்னகக' : 'Aadhaar front'}</ThemedText>
                <TouchableOpacity style={styles.largeUploadBox} onPress={() => {
                  const options = [] as any[];
                  options.push({ text: language === 'ta' ? 'கேமரா' : 'Take Photo', onPress: () => pickAadhaarPhoto('front', 'camera') });
                  options.push({ text: language === 'ta' ? 'படத்தைக் தேர்வு செய்க' : 'Choose from Library', onPress: () => pickAadhaarPhoto('front', 'gallery') });
                  if (formData.aadhaarFront) options.push({ text: language === 'ta' ? 'நீக்கு' : 'Remove', onPress: () => removeAadhaarPhoto('front'), style: 'destructive' });
                  options.push({ text: language === 'ta' ? 'ரத்து செய்' : 'Cancel', style: 'cancel' });
                  Alert.alert('', '', options);
                }}>
                  {formData.aadhaarFront ? (
                    <Image source={{ uri: formData.aadhaarFront }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <IconSymbol name="photo.fill" size={28} color="#9aa3ad" />
                      <ThemedText style={styles.uploadPrompt}>{language === 'ta' ? 'பதிவேற்ற கிளிக் செய்யவும்' : 'Click to upload'}</ThemedText>
                    </View>
                  )}
                </TouchableOpacity>

                <ThemedText style={[styles.label, { marginTop: 16 }]}>{language === 'ta' ? 'ஆதார் பின்பக்கம்' : 'Aadhaar back'}</ThemedText>
                <TouchableOpacity style={styles.largeUploadBox} onPress={() => {
                  const options = [] as any[];
                  options.push({ text: language === 'ta' ? 'கேமரா' : 'Take Photo', onPress: () => pickAadhaarPhoto('back', 'camera') });
                  options.push({ text: language === 'ta' ? 'படத்தைக் தேர்வு செய்க' : 'Choose from Library', onPress: () => pickAadhaarPhoto('back', 'gallery') });
                  if (formData.aadhaarBack) options.push({ text: language === 'ta' ? 'நீக்கு' : 'Remove', onPress: () => removeAadhaarPhoto('back'), style: 'destructive' });
                  options.push({ text: language === 'ta' ? 'ரத்து செய்' : 'Cancel', style: 'cancel' });
                  Alert.alert('', '', options);
                }}>
                  {formData.aadhaarBack ? (
                    <Image source={{ uri: formData.aadhaarBack }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <IconSymbol name="photo.fill" size={28} color="#9aa3ad" />
                      <ThemedText style={styles.uploadPrompt}>{language === 'ta' ? 'பதிவேற்ற கிளிக் செய்யவும்' : 'Click to upload'}</ThemedText>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', marginTop: 24, gap: 12 }}>
                  <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => setIntroStep(4)}>
                    <ThemedText style={styles.secondaryButtonText}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.continueButton, { flex: 1, opacity: (aadhaarNumberInput.replace(/\D/g, '').length === 12 && (formData.aadhaarFront || formData.aadhaarBack)) ? 1 : 0.5 }]}
                    onPress={() => {
                      const digits = aadhaarNumberInput.replace(/\D/g, '');
                      if (!/^\d{12}$/.test(digits)) { Alert.alert(t('error'), language === 'ta' ? 'தயவுசெய்து சரியான ஆதார் எண்ணை உள்ளிடவும்' : 'Please enter a valid Aadhaar number'); return; }
                      if (!formData.aadhaarFront && !formData.aadhaarBack) { Alert.alert(t('error'), language === 'ta' ? 'ஆதார் படங்களை பதிவேற்றவும்' : 'Please upload Aadhaar photos'); return; }
                      setFormData((prev: any) => ({ ...prev, aadhaarNumber: digits }));
                      // Proceed to farm setup / consent step
                      setIntroStep(6);
                    }}
                    disabled={!(aadhaarNumberInput.replace(/\D/g, '').length === 12 && (formData.aadhaarFront || formData.aadhaarBack))}
                  >
                    <ThemedText style={styles.continueButtonText} lightColor="#fff" darkColor="#fff" type="defaultSemiBold">{language === 'ta' ? 'அடுத்தது' : 'Next'}</ThemedText>
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          </ScrollView>
        ) : introStep === 6 ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 80, backgroundColor: isDarkMode ? '#0f172a' : '#ecfdf5' }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.introCard, { maxWidth: 760 }]}> 
              <ThemedText style={styles.introTitle}>{language === 'ta' ? 'பண்ணை அமைப்பு' : 'Farm setup'}</ThemedText>
              <ThemedText style={styles.welcomeSubtitle}>{language === 'ta' ? 'உங்களுக்கு விவசாய நிலம் உள்ளதா?' : 'Do you have farmland?'}</ThemedText>

              <View style={[styles.infoBox, { marginTop: 18, backgroundColor: '#eaf4ff', borderColor: '#cfe7ff' }]}> 
                <ThemedText>{language === 'ta' ? 'நீங்கள் தேவையானால் பின்வர் பண்ணை விவரங்களை சேர்க்கலாம்' : 'You can add farm details later if needed'}</ThemedText>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 24, gap: 12 }}>
                <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => { setIntroMode(false); setIntroStep(0); }}>
                  <ThemedText style={styles.secondaryButtonText}>{language === 'ta' ? 'தவிர்க்கவும்' : 'Skip'}</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.continueButton, { flex: 1 }]}
                  onPress={() => { setIntroMode(false); setIntroStep(0); }}
                >
                  <ThemedText style={styles.continueButtonText} lightColor="#fff" darkColor="#fff" type="defaultSemiBold">{language === 'ta' ? 'முடிக்கவும்' : 'Finish'}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : null
      );
  };

  return (
    <>
      {!isKeyboardVisible && (
          <>
            <View style={styles.header}>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                  <IconSymbol name="chevron.left" size={20} color="#7a4524" />
                </TouchableOpacity>
                {introMode && (
                  <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
                    <ThemedText style={styles.backText}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[
                    styles.languageButton,
                    language === 'ta' ? styles.languageButtonEnglish : styles.languageButtonTamil,
                  ]}
                  onPress={() => setLanguage(language === 'ta' ? 'en' : 'ta')}
                >
                  <ThemedText style={styles.languageText}>
                    {language === 'ta' ? 'English' : 'தமிழ்'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
              {!introMode && (
                <View style={styles.headerContent}>
                  <ThemedText style={styles.title}>{t('farmer_registration')}</ThemedText>
                  <ThemedText style={styles.subtitle}>{t('complete_registration')}</ThemedText>
                  {farmerFee && farmerFee > 0 && (
                    <View style={styles.feeBanner}>
                      <IconSymbol name="indianrupeesign.circle.fill" size={16} color="#c8671f" />
                      <ThemedText style={styles.feeText}>
                        {t('registration_fee')}
                        {farmerFee}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}
            </View>

{ introMode ? renderIntro() : null }

{ !introMode && (
            <View style={styles.tabContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabScroll}
              >
                {TABS.map((tab, index) => {
                  const isActive = activeTab === index;
                const tabContent = (
                  <View style={styles.tabBody}>
                    <IconSymbol
                      name={tab.icon}
                      size={16}
                      color={isActive ? '#ffffff' : '#ad7a53'}
                    />
                      <ThemedText
                        style={[
                          styles.tabLabel,
                          { color: isActive ? '#ffffff' : '#7a4524' },
                        ]}
                      >
                        {tab.title}
                      </ThemedText>
                    </View>
                  );

                  return (
                    <View key={tab.id} style={[styles.tab, { opacity: canNavigateToTab(index) ? 1 : 0.5 }]}>
                      <TouchableOpacity
                        onPress={() => (canNavigateToTab(index) ? setActiveTab(index) : null)}
                        disabled={!canNavigateToTab(index)}
                      >
                        {isActive ? (
                          <LinearGradient colors={['#c8671f', '#5d2b11']} style={styles.tabInner}>
                            {tabContent}
                          </LinearGradient>
                        ) : (
                          <View style={[styles.tabInner, styles.tabInnerInactive]}>
                            {tabContent}
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
            )}
          </>
        )}



          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.formContainer}
          >
            <ScrollView
              style= {styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    borderColor: isDarkMode ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.05)',
                  },
                ]}
              >
                {renderTabContent()}
              </View>
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                styles.secondaryButton,
                { opacity: activeTab > 0 ? 1 : 0.5 },
              ]}
              onPress={activeTab > 0 ? handlePrevious : undefined}
              disabled={activeTab === 0}
            >
              <ThemedText style={styles.secondaryButtonText}>{t('previous')}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  opacity:
                    activeTab === TABS.length - 1
                      ? isNextEnabled && !isSubmitting
                        ? 1
                        : 0.5
                      : isNextEnabled || (activeTab === 2 && !verificationStatus.accountValidated)
                      ? 1
                      : 0.5,
                },
              ]}
              onPress={
                activeTab === TABS.length - 1
                  ? isNextEnabled && !isSubmitting
                    ? handleSubmit
                    : undefined
                  : (isNextEnabled || (activeTab === 2 && !verificationStatus.accountValidated))
                  ? handleNext
                  : undefined
              }
              disabled={
                activeTab === TABS.length - 1
                  ? !isNextEnabled || isSubmitting
                  : !(isNextEnabled || (activeTab === 2 && !verificationStatus.accountValidated))
              }
            >
              <LinearGradient colors={['#c8671f', '#5d2b11']} style={styles.primaryGradient}>
                {activeTab === TABS.length - 1 ? (
                  isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <View style={styles.primaryContent}>
                      <ThemedText style={styles.primaryText}>{t('submit_registration')}</ThemedText>
                      <IconSymbol name="chevron.right" size={16} color="#ffffff" />
                    </View>
                  )
                ) : validationLoading ? (
                  <ThemedText style={styles.primaryText}>Validating...</ThemedText>
                ) : (
                  <View style={styles.primaryContent}>
                    <ThemedText style={styles.primaryText}>
                      {activeTab === 2 && !verificationStatus.accountValidated
                        ? language === 'ta'
                          ? 'கணக்கை சரிபார்க்க'
                          : 'Validate Account'
                        : t('next')}
                    </ThemedText>
                    <IconSymbol name="chevron.right" size={16} color="#ffffff" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
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
              {loadingStates ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator />
                </View>
              ) : states.length === 0 ? (
                <View style={{ padding: 20 }}>
                  <ThemedText>{t('no_data_available')}</ThemedText>
                </View>
              ) : (
                <FlatList
                  data={states}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                      onPress={() => selectState(item)}
                    >
                      <ThemedText style={styles.modalItemText}>{language === 'ta' ? (item.statet_name || item.state) : item.state}</ThemedText>
                    </TouchableOpacity>
                  )}
                />
              )}
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
                    <ThemedText style={styles.modalItemText}>{language === 'ta' ? (item.district_tname || item.district_name) : item.district_name}</ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={showSubdistrictModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{language === 'ta' ? 'உப மாவட்டம்' : 'Select Subdistrict'}</ThemedText>
                <TouchableOpacity onPress={() => setShowSubdistrictModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={subdistricts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}
                    onPress={() => selectSubdistrict(item)}
                  >
                    <ThemedText style={styles.modalItemText}>{language === 'ta' ? (item.subdistrict_tname || item.subdistrict_code || item.subdistrict_name) : item.subdistrict_name}</ThemedText>
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
                <ThemedText style={styles.modalTitle}>{t('select_land_state')}</ThemedText>
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
                    <ThemedText style={styles.modalItemText}>{language === 'ta' ? (item.statet_name || item.state) : item.state}</ThemedText>
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
                <ThemedText style={styles.modalTitle}>{t('select_land_district')}</ThemedText>
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
                    <ThemedText style={styles.modalItemText}>{language === 'ta' ? (item.district_tname || item.district_name) : item.district_name}</ThemedText>
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
                <ThemedText style={styles.modalTitle}>{t('select_land_taluk')}</ThemedText>
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
                <ThemedText style={styles.modalTitle}>{t('select_land_village')}</ThemedText>
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

        {showHarvestDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={handleHarvestDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Pincode modal for selecting location by pin code - full screen with header and card to match design */}
        <Modal visible={showPincodeModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#ecf1f5' : '#ecfdf5' }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 40, paddingBottom: 8 }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={() => setShowPincodeModal(false)}>
                <IconSymbol name="chevron.left" size={20} color={Colors[colorScheme].text} />
                <ThemedText style={[styles.backText, { marginLeft: 6 }]}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
              <View style={[styles.introCard, { backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#ffffff' }] }>
                <ThemedText style={styles.introTitle}>{language === 'ta' ? 'இருப்பிடம் தேர்ந்தெடுக்கவும்' : t('choose_location_title')}</ThemedText>

                <ThemedText style={[styles.label, { marginTop: 6 }]}>{t('pin_code')}</ThemedText>
                <TextInput
                  style={[styles.pincodeInput, { backgroundColor: colorScheme === 'dark' ? '#0b1220' : '#fff', color: Colors[colorScheme].text }]}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={pincodeInput}
                  onChangeText={setPincodeInput}
                  placeholder={t('enter_pincode')}
                  placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
                />

                <TouchableOpacity style={styles.continueButton} onPress={() => {
                  if (!/^\d{6}$/.test(pincodeInput)) { Alert.alert(t('error'), t('enter_pincode')); return; }
                  updateField('pincode', pincodeInput);
                  setShowPincodeModal(false);
                  // Show welcome checklist before proceeding to full form
                  setIntroStep(3);
                }}>
                  <ThemedText style={styles.continueButtonText} lightColor="#fff" darkColor="#fff" type="defaultSemiBold">{language === 'ta' ? 'தொடரவும்' : t('continue')}</ThemedText>
                </TouchableOpacity>

              </View>
            </ScrollView>
          </View>
        </Modal>

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
                <ThemedText style={styles.modalTitle}>{t('select_irrigation_source')}</ThemedText>
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
                <ThemedText style={styles.modalTitle}>{t('select_soil_type')}</ThemedText>
                <TouchableOpacity onPress={() => setShowSoilTypeModal(false)}>
                  <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={soilTypes}
                keyExtractor={(item, index) => `soil-${soilTypeKeys[index]}-${index}`}
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
                        #confirmBtn { position: absolute; bottom: 20px; left: 10px; right: 10px; background: #48bb78; color: white; padding: 15px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; z-index: 1000; }
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
                      style={styles.confirmButton}
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
              <ThemedText style={styles.paymentTitle}>{paymentCopy.gatewayTitle}</ThemedText>
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
                          color: #48bb78;
                          margin: 20px 0;
                        }
                        .pay-button {
                          background: #48bb78;
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
                          background: #38a169;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="payment-container">
                        <h2>${paymentCopy.title}</h2>
                        <div class="amount">₹${paymentData.amount}</div>
                        <p>${paymentCopy.description}</p>
                        <button class="pay-button" onclick="startPayment()">${paymentCopy.button}</button>
                      </div>
                      
                      <script>
                        function startPayment() {
                          const options = {
                            key: 'rzp_test_RcPoxTDuikU5MK',
                            amount: ${paymentData.amount * 100},
                            currency: 'INR',
                            name: 'NAAM Registration',
                            description: 'Farmer Registration Fee',
                            prefill: {
                              name: '${formData.fullName}',
                              email: '${formData.emailId || ''}',
                              contact: '${formData.mobileNumber}'
                            },
                            theme: {
                              color: '#48bb78'
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
      
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#7a4524',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#a0795c',
    textAlign: 'center',
  },
  feeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#d3b9a4',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  feeText: {
    color: '#7a4524',
    fontWeight: '600',
  },
  tabContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  tabScroll: {
    paddingRight: 12,
  },
  tab: {
    marginRight: 8,
  },
  tabInner: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabInnerInactive: {
    borderWidth: 1,
    borderColor: '#f0dfcf',
    backgroundColor: '#fff',
    shadowColor: '#d3b9a4',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  tabBody: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    marginBottom: 12,
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
    color: '#48bb78',
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
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d9c3b4',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  secondaryButtonText: {
    color: '#7a4524',
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  primaryGradient: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryText: {
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
  inputContainer: {
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    backgroundColor: '#48bb78',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
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
    backgroundColor: '#48bb78',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  backButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: '#fff',
    shadowColor: '#d3b9a4',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },
  languageButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#d3b9a4',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  languageButtonEnglish: {
    backgroundColor: '#c8671f',
  },
  languageButtonTamil: {
    backgroundColor: '#432616',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  backText: {
    color: '#7a4524',
    marginLeft: 6,
    fontWeight: '600',
  },
  introCard: {
    width: '100%',
    maxWidth: 760,
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 12,
    padding: 28,
    paddingBottom: 40,
    elevation: 6,
    shadowColor: '#dfeee8',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    alignSelf: 'center',
  },
  introTitle: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    color: '#083b2b',
  },
  locationTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 18,
    color: '#083b2b',
  },
  locationOption: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6edf0',
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: '#fff',
    shadowColor: '#f0f6f5',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  locationOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#ecfdf5',
  },
  locationOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#083b2b',
    fontWeight: '600',
  },
  pincodeInput: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 20,
    textAlign: 'left',
    borderWidth: 1,
    borderColor: '#e6edf0',
    marginTop: 16,
    backgroundColor: '#fff',
    includeFontPadding: false,
  },
  continueButton: {
    marginTop: 20,
    backgroundColor: '#0bb24c',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  /* Welcome checklist styles */
  welcomeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 6,
    fontSize: 14,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fbfdfb',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  checkNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0bb24c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 16,
    color: '#083b2b',
    fontWeight: '600',
  },
  /* Photo upload styles */
  photoBox: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e6e9ec',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeUploadBox: {
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e6e9ec',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 12,
  },
  uploadPrompt: {
    marginTop: 8,
    color: '#9aa3ad',
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#eaf4ff',
    borderWidth: 1,
    borderColor: '#cfe7ff',
  },
  manualDropdownActive: {
    borderColor: '#0bb24c',
    borderWidth: 2,
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
});