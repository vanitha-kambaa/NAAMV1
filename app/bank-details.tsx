import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface BankDetails {
  id: number;
  user_id: number;
  account_holder_name: string;
  bank_name: string;
  branch_name: string;
  account_no: string;
  ifsc_code: string;
  account_type: string;
  passbook_copy?: string;
  upi_id?: string;
  status: number;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export default function BankDetailsPage() {
  const { language } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const [bankData, setBankData] = useState<BankDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState<BankDetails | null>(null);

  useEffect(() => {
    loadBankDetails();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBankDetails();
    }, [])
  );

  const loadBankDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (!token || !userData) {
        console.log('Bank Details - No auth token or user data, redirecting to login');
        router.replace('/');
        return;
      }

      const user = JSON.parse(userData);
      const apiUrl = `${API_CONFIG.BASE_URL}/bank-info/user/${user.id}`;
      
      console.log('Bank Details API - Request:', {
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
      
      console.log('Bank Details API - Response:', {
        url: apiUrl,
        status: response.status,
        statusText: response.statusText,
        responseData: result,
        dataCount: result.data?.length || 0,
        timestamp: new Date().toISOString()
      });

      if (result.status === 'success') {
        setBankData(result.data);
        console.log('Bank Details - Success: Data loaded successfully', {
          bankCount: result.data.length,
          banks: result.data.map(bank => ({ id: bank.id, bankName: bank.bank_name, isDefault: bank.is_default }))
        });
      } else {
        console.log('Bank Details - Failed: API returned non-success status', result);
      }
    } catch (error) {
      console.error('Bank Details API - Error:', {
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
        bankDetails: 'வங்கி விவரங்கள்',
        accountHolder: 'கணக்கு வைத்திருப்பவர்',
        bankName: 'வங்கி பெயர்',
        branchName: 'கிளை பெயர்',
        accountNumber: 'கணக்கு எண்',
        ifscCode: 'IFSC குறியீடு',
        accountType: 'கணக்கு வகை',
        upiId: 'UPI ஐடி',
        defaultAccount: 'இயல்புநிலை கணக்கு',
        back: 'பின்செல்',
        viewDetails: 'விவரங்கள் பார்க்க',
        savings: 'சேமிப்பு',
        current: 'நடப்பு',
        noData: 'வங்கி விவரங்கள் இல்லை'
      };
    } else {
      return {
        bankDetails: 'Bank Details',
        accountHolder: 'Account Holder',
        bankName: 'Bank Name',
        branchName: 'Branch Name',
        accountNumber: 'Account Number',
        ifscCode: 'IFSC Code',
        accountType: 'Account Type',
        upiId: 'UPI ID',
        defaultAccount: 'Default Account',
        back: 'Back',
        viewDetails: 'View Details',
        savings: 'Savings',
        current: 'Current',
        noData: 'No bank details found'
      };
    }
  };

  const labels = getLabels();

  const handleBankSelect = (bank: BankDetails) => {
    console.log('Bank Details - Bank Selected:', {
      bankId: bank.id,
      bankName: bank.bank_name,
      accountHolder: bank.account_holder_name,
      isDefault: bank.is_default,
      timestamp: new Date().toISOString()
    });
    setSelectedBank(bank);
  };

  const setDefaultAccount = async (bankId: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (!token || !userData) {
        router.replace('/');
        return;
      }

      const user = JSON.parse(userData);
      const apiUrl = `${API_CONFIG.BASE_URL}/bank-info/${bankId}/set-default`;
      
      console.log('Set Default Bank API - Request:', {
        url: apiUrl,
        bankId,
        userId: user.id,
        method: 'PATCH',
        timestamp: new Date().toISOString()
      });

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      const result = await response.json();
      
      console.log('Set Default Bank API - Response:', {
        status: response.status,
        statusText: response.statusText,
        responseData: result,
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        Alert.alert('Success', 'Default account updated successfully!');
        loadBankDetails(); // Refresh the list
      } else {
        Alert.alert('Error', result.message || 'Failed to set default account');
      }
    } catch (error) {
      console.error('Set Default Bank API - Error:', {
        error: error.message,
        bankId,
        timestamp: new Date().toISOString()
      });
      Alert.alert('Error', 'Failed to set default account');
    }
  };

  const confirmSetDefault = (bank: BankDetails) => {
    Alert.alert(
      'Set Default Account',
      `Are you sure you want to set "${bank.bank_name}" as your default account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => setDefaultAccount(bank.id),
          style: 'default'
        }
      ]
    );
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

  if (selectedBank) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: labels.bankDetails, headerShown: false }} />
        <View style={styles.container}>
          <LinearGradient colors={['#48bb78', '#38a169']} style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSelectedBank(null)}>
              <ThemedText style={styles.backArrow}>←</ThemedText>
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <ThemedText style={styles.title}>{labels.bankDetails}</ThemedText>
              <ThemedText style={styles.subtitle}>{selectedBank.bank_name}</ThemedText>
            </View>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.infoContainer}>
              <View style={[styles.infoCard, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
                <View style={styles.infoRow}>
                  <IconSymbol name="person.fill" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.accountHolder}</ThemedText>
                    <ThemedText style={styles.infoValue}>{selectedBank.account_holder_name}</ThemedText>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="building.2.fill" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.bankName}</ThemedText>
                    <ThemedText style={styles.infoValue}>{selectedBank.bank_name}</ThemedText>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="location.fill" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.branchName}</ThemedText>
                    <ThemedText style={styles.infoValue}>{selectedBank.branch_name}</ThemedText>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="number" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.accountNumber}</ThemedText>
                    <ThemedText style={styles.infoValue}>{selectedBank.account_no}</ThemedText>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="textformat.123" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.ifscCode}</ThemedText>
                    <ThemedText style={styles.infoValue}>{selectedBank.ifsc_code}</ThemedText>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="creditcard.fill" size={20} color="#48bb78" />
                  <View style={styles.infoText}>
                    <ThemedText style={styles.infoLabel}>{labels.accountType}</ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {selectedBank.account_type === 'savings' ? labels.savings : labels.current}
                    </ThemedText>
                  </View>
                </View>

                {selectedBank.upi_id && (
                  <View style={styles.infoRow}>
                    <IconSymbol name="qrcode" size={20} color="#48bb78" />
                    <View style={styles.infoText}>
                      <ThemedText style={styles.infoLabel}>{labels.upiId}</ThemedText>
                      <ThemedText style={styles.infoValue}>{selectedBank.upi_id}</ThemedText>
                    </View>
                  </View>
                )}

                {selectedBank.is_default === 1 && (
                  <View style={styles.defaultBadge}>
                    <IconSymbol name="star.fill" size={16} color="#fbbf24" />
                    <ThemedText style={styles.defaultText}>{labels.defaultAccount}</ThemedText>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: labels.bankDetails, headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient colors={['#48bb78', '#38a169']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ThemedText style={styles.backArrow}>←</ThemedText>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <ThemedText style={styles.title}>{labels.bankDetails}</ThemedText>
            <ThemedText style={styles.subtitle}>
              {bankData.length > 0 ? `${bankData.length} accounts found` : labels.noData}
            </ThemedText>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-bank-details')}
          >
            <IconSymbol name="plus.circle.fill" size={20} color="#48bb78" />
            <ThemedText style={styles.addButtonText}>
              {language === 'ta' ? 'சேர்க்கவும்' : 'Add'}
            </ThemedText>
          </TouchableOpacity>

          {bankData.length > 0 ? (
            bankData.map((bank) => (
              <View
                key={bank.id}
                style={[styles.bankCard, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}
              >
                <TouchableOpacity
                  style={styles.bankCardTouchable}
                  onPress={() => handleBankSelect(bank)}
                >
                  <View style={styles.bankCardHeader}>
                    <View style={styles.bankInfo}>
                      <View style={styles.bankTitleRow}>
                        <ThemedText style={styles.bankTitle}>{bank.bank_name}</ThemedText>
                        {bank.is_default === 1 && (
                          <View style={styles.defaultBadgeSmall}>
                            <IconSymbol name="star.fill" size={12} color="#fbbf24" />
                            <ThemedText style={styles.defaultBadgeText}>{labels.defaultAccount}</ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText style={styles.bankSubtitle}>{bank.account_holder_name}</ThemedText>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color="#48bb78" />
                  </View>
                  
                  <View style={styles.bankCardContent}>
                    <View style={styles.bankDetail}>
                      <IconSymbol name="location.fill" size={16} color="#718096" />
                      <ThemedText style={styles.bankDetailText}>{bank.branch_name}</ThemedText>
                    </View>
                    <View style={styles.bankDetail}>
                      <IconSymbol name="creditcard.fill" size={16} color="#718096" />
                      <ThemedText style={styles.bankDetailText}>
                        {bank.account_type === 'savings' ? labels.savings : labels.current}
                      </ThemedText>
                    </View>
                    <View style={styles.bankDetail}>
                      <IconSymbol name="number" size={16} color="#718096" />
                      <ThemedText style={styles.bankDetailText}>****{bank.account_no.slice(-4)}</ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
                
                {bank.is_default !== 1 && (
                  <TouchableOpacity 
                    style={styles.setDefaultIcon}
                    onPress={() => confirmSetDefault(bank)}
                  >
                    <ThemedText style={styles.starIcon}>⭐</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <IconSymbol name="creditcard" size={60} color="#a0aec0" />
              <ThemedText style={styles.emptyText}>{labels.noData}</ThemedText>
            </View>
          )}
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
  bankCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  bankCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  bankTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
  },
  bankSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  bankCardContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bankDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bankDetailText: {
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
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 20,
  },
  defaultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d97706',
  },
  defaultBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#d97706',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#a0aec0',
    marginTop: 16,
    textAlign: 'center',
  },
  bankCardTouchable: {
    flex: 1,
  },
  setDefaultIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    padding: 8,
    backgroundColor: 'rgba(72, 187, 120, 0.1)',
    borderRadius: 20,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    fontSize: 20,
    color: '#48bb78',
  },
});