import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AddBankDetailsPage() {
  const { language } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const [loading, setLoading] = useState(false);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
  
  const [formData, setFormData] = useState({
    accountHolderName: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: '',
    upiId: '',
    bankPassbook: null as string | null,
  });

  const [verificationStatus, setVerificationStatus] = useState({
    ifscVerified: false,
    accountVerified: false,
  });

  const getLabels = () => {
    if (language === 'ta') {
      return {
        addBankDetails: 'வங்கி விவரங்கள் சேர்க்கவும்',
        accountHolderName: 'கணக்கு வைத்திருப்பவர் பெயர்',
        bankName: 'வங்கி பெயர்',
        branchName: 'கிளை பெயர்',
        accountNumber: 'கணக்கு எண்',
        ifscCode: 'IFSC குறியீடு',
        accountType: 'கணக்கு வகை',
        upiId: 'UPI ஐடி',
        bankPassbook: 'வங்கி பாஸ்புக்',
        savings: 'சேமிப்பு',
        current: 'நடப்பு',
        selectAccountType: 'கணக்கு வகையைத் தேர்ந்தெடுக்கவும்',
        enterAccountHolderName: 'கணக்கு வைத்திருப்பவர் பெயரை உள்ளிடவும்',
        enterBankName: 'வங்கி பெயரை உள்ளிடவும்',
        enterBranchName: 'கிளை பெயரை உள்ளிடவும்',
        enterAccountNumber: 'கணக்கு எண்ணை உள்ளிடவும்',
        enterIfscCode: 'IFSC குறியீட்டை உள்ளிடவும்',
        enterUpiId: 'UPI ஐடியை உள்ளிடவும்',
        takePhoto: 'புகைப்படம் எடுக்கவும்',
        choosePhoto: 'புகைப்படத்தைத் தேர்ந்தெடுக்கவும்',
        passbookUploaded: 'பாஸ்புக் பதிவேற்றப்பட்டது',
        submit: 'சமர்ப்பிக்கவும்',
        cancel: 'ரத்து செய்யவும்',
        back: 'பின்செல்',
        required: 'தேவையான',
        optional: 'விருப்பமான'
      };
    } else {
      return {
        addBankDetails: 'Add Bank Details',
        accountHolderName: 'Account Holder Name',
        bankName: 'Bank Name',
        branchName: 'Branch Name',
        accountNumber: 'Account Number',
        ifscCode: 'IFSC Code',
        accountType: 'Account Type',
        upiId: 'UPI ID',
        bankPassbook: 'Bank Passbook',
        savings: 'Savings',
        current: 'Current',
        selectAccountType: 'Select Account Type',
        enterAccountHolderName: 'Enter account holder name',
        enterBankName: 'Enter bank name',
        enterBranchName: 'Enter branch name',
        enterAccountNumber: 'Enter account number',
        enterIfscCode: 'Enter IFSC code',
        enterUpiId: 'Enter UPI ID',
        takePhoto: 'Take Photo',
        choosePhoto: 'Choose Photo',
        passbookUploaded: 'Passbook uploaded',
        submit: 'Submit',
        cancel: 'Cancel',
        back: 'Back',
        required: 'Required',
        optional: 'Optional'
      };
    }
  };

  const labels = getLabels();
  const accountTypes = [labels.savings, labels.current];

  const updateField = (field: string, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImagePicker = async (source: 'camera' | 'gallery') => {
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
        updateField('bankPassbook', result.assets[0].uri);
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
        //updateField('bankName', 'State Bank of India');
        //updateField('branchName', 'Main Branch');
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

  const validateForm = () => {
    return formData.accountHolderName && 
           formData.bankName && 
           formData.branchName && 
           formData.accountNumber && 
           formData.ifscCode && 
           formData.accountType &&
           verificationStatus.ifscVerified &&
           verificationStatus.accountVerified;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fill all required fields and verify your account details.');
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
      formDataToSend.append('account_holder_name', formData.accountHolderName);
      formDataToSend.append('bank_name', formData.bankName);
      formDataToSend.append('branch_name', formData.branchName);
      formDataToSend.append('account_no', formData.accountNumber);
      formDataToSend.append('ifsc_code', formData.ifscCode);
      formDataToSend.append('account_type', formData.accountType.toLowerCase());
      formDataToSend.append('upi_id', formData.upiId || '');
      
      if (formData.bankPassbook) {
        formDataToSend.append('passbook_copy', {
          uri: formData.bankPassbook,
          type: 'image/jpeg',
          name: 'passbook.jpg'
        } as any);
      }

      const payloadData = {
        user_id: user.id.toString(),
        account_holder_name: formData.accountHolderName,
        bank_name: formData.bankName,
        branch_name: formData.branchName,
        account_no: formData.accountNumber,
        ifsc_code: formData.ifscCode,
        account_type: formData.accountType.toLowerCase(),
        upi_id: formData.upiId || '',
        passbook_copy: formData.bankPassbook ? 'file_attached' : 'no_file'
      };

      console.log('Add Bank Details API - Request:', {
        url: `${API_CONFIG.BASE_URL}/bank-info`,
        userId: user.id,
        method: 'POST',
        headers: { Authorization: `Bearer ${token?.substring(0, 20)}...` },
        payload: payloadData,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}/bank-info`, {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      console.log('Add Bank Details API - Response:', {
        status: response.status,
        statusText: response.statusText,
        responseData: result,
        timestamp: new Date().toISOString()
      });

      if (response.ok && result.status === 'success') {
        console.log('=== ADD BANK ACCOUNT SUCCESS ===');
        console.log('Request Payload:', payloadData);
        console.log('Response Data:', result);
        console.log('Bank Account Added:', {
          accountHolder: formData.accountHolderName,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          timestamp: new Date().toISOString()
        });
        console.log('=== END ADD BANK ACCOUNT SUCCESS ===');
        Alert.alert('Success', 'Bank details added successfully!', [
          { text: 'OK', onPress: () => router.replace('/bank-details?refresh=true') }
        ]);
      } else {
        console.log('=== ADD BANK ACCOUNT FAILED ===');
        console.log('Request Payload:', payloadData);
        console.log('Response Data:', result);
        console.log('=== END ADD BANK ACCOUNT FAILED ===');
        Alert.alert('Error', result.message || 'Failed to add bank details');
      }
    } catch (error) {
      console.error('Add Bank Details API - Error:', {
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
      <Stack.Screen options={{ title: labels.addBankDetails, headerShown: false }} />
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
              <ThemedText style={styles.label}>{labels.accountHolderName} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.accountHolderName}
                onChangeText={(value) => updateField('accountHolderName', value)}
                placeholder={labels.enterAccountHolderName}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.bankName} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.bankName}
                onChangeText={(value) => updateField('bankName', value)}
                placeholder={labels.enterBankName}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.branchName} *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.branchName}
                onChangeText={(value) => updateField('branchName', value)}
                placeholder={labels.enterBranchName}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.ifscCode} *</ThemedText>
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
                  placeholder={labels.enterIfscCode}
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
              <ThemedText style={styles.label}>{labels.accountNumber} *</ThemedText>
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
                  placeholder={labels.enterAccountNumber}
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
              <ThemedText style={styles.label}>{labels.accountType} *</ThemedText>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                onPress={() => setShowAccountTypeModal(true)}
              >
                <ThemedText style={[styles.dropdownText, { color: formData.accountType ? Colors[colorScheme].text : (colorScheme === 'dark' ? '#a0aec0' : '#718096') }]}>
                  {formData.accountType || labels.selectAccountType}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.upiId}</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa', color: Colors[colorScheme].text }]}
                value={formData.upiId}
                onChangeText={(value) => updateField('upiId', value)}
                placeholder={labels.enterUpiId}
                placeholderTextColor={colorScheme === 'dark' ? '#a0aec0' : '#718096'}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{labels.bankPassbook} *</ThemedText>
              <View style={styles.fileUploadContainer}>
                {formData.bankPassbook ? (
                  <View style={[styles.uploadedFile, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f0fff4' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#48bb78" />
                    <ThemedText style={styles.uploadedText}>{labels.passbookUploaded}</ThemedText>
                    <TouchableOpacity onPress={() => updateField('bankPassbook', null)}>
                      <IconSymbol name="xmark.circle.fill" size={20} color="#e53e3e" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadOptions}>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('camera')}
                    >
                      <IconSymbol name="camera.fill" size={24} color="#48bb78" />
                      <ThemedText style={styles.uploadButtonText}>{labels.takePhoto}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.uploadButton, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f8f9fa' }]}
                      onPress={() => handleImagePicker('gallery')}
                    >
                      <IconSymbol name="photo.fill" size={24} color="#48bb78" />
                      <ThemedText style={styles.uploadButtonText}>{labels.choosePhoto}</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

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

        <Modal visible={showAccountTypeModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{labels.selectAccountType}</ThemedText>
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