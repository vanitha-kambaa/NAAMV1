import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PaymentHistoryItem {
  id: number;
  collection_id: number;
  invester_id: number;
  farmer_id: number;
  farmer_ack: number;
  payment_mode: string;
  amount: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  payment_status: string;
  utr_number: string;
  razorpay_payout_id: string | null;
  created_at: string;
  farmer_name: string;
  farmer_mobile: string;
  investor_name: string;
  collection_date: string;
  collection_count: number;
  total_cost: number;
}

export default function PaymentHistory() {
  const { language } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<PaymentHistoryItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [acknowledgingPaymentId, setAcknowledgingPaymentId] = useState<number | null>(null);

  const loadCredentials = useCallback(async () => {
    const storedUserId = await AsyncStorage.getItem('userId');
    const storedToken = await AsyncStorage.getItem('authToken');
    
    if (!storedUserId || !storedToken) {
      Alert.alert(
        language === 'ta' ? 'அங்கீகாரம் தேவை' : 'Authentication required',
        language === 'ta' ? 'தயவுசெய்து மீண்டும் உள்நுழையவும்' : 'Please sign in again'
      );
      router.replace('/');
      return;
    }
    
    setUserId(storedUserId);
    setToken(storedToken);
  }, [language, router]);

  const fetchPaymentHistory = useCallback(async (isRefresh = false) => {
    if (!userId || !token) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const farmerId = parseInt(userId, 10);
      if (isNaN(farmerId)) {
        throw new Error('Invalid farmer ID');
      }

      const result = await apiService.getPaymentHistory(
        farmerId,
        0,
        100, // Get more records
        token
      );

      if (result.success) {
        setData(result.data || []);
      } else {
        Alert.alert(
          language === 'ta' ? 'பிழை' : 'Error',
          result.message || (language === 'ta' ? 'தரவை ஏற்ற முடியவில்லை' : 'Failed to load data')
        );
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      Alert.alert(
        language === 'ta' ? 'பிழை' : 'Error',
        language === 'ta' ? 'நெட்வொர்க் பிழை' : 'Network error'
      );
      setData([]);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [userId, token, language]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  useEffect(() => {
    if (userId && token) {
      fetchPaymentHistory();
    }
  }, [userId, token, fetchPaymentHistory]);

  useFocusEffect(
    useCallback(() => {
      if (userId && token) {
        fetchPaymentHistory(true);
      }
    }, [userId, token, fetchPaymentHistory])
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' ' + date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid' || statusLower === 'completed') {
      return '#38a169';
    } else if (statusLower === 'pending') {
      return '#ed8936';
    }
    return '#718096';
  };

  const getStatusLabel = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid' || statusLower === 'completed') {
      return language === 'ta' ? 'செலுத்தப்பட்டது' : 'Paid';
    } else if (statusLower === 'pending') {
      return language === 'ta' ? 'நிலுவை' : 'Pending';
    } else if (statusLower === 'processing') {
      return language === 'ta' ? 'செயலாக்கப்படுகிறது' : 'Processing';
    } else if (statusLower === 'queued') {
      return language === 'ta' ? 'வரிசையில்' : 'Queued';
    }
    return status;
  };

  const handleAcknowledgePayment = (paymentId: number, amount: string) => {
    Alert.alert(
      language === 'ta' ? 'கட்டணத்தை அங்கீகரிக்கவும்' : 'Acknowledge Payment',
      language === 'ta' 
        ? `நீங்கள் ${formatCurrency(amount)} தொகையை அங்கீகரிக்க விரும்புகிறீர்களா?`
        : `Do you want to acknowledge payment of ${formatCurrency(amount)}?`,
      [
        {
          text: language === 'ta' ? 'ரத்துசெய்' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'ta' ? 'அங்கீகரிக்க' : 'Acknowledge',
          onPress: async () => {
            if (!token) return;
            
            setAcknowledgingPaymentId(paymentId);
            try {
              const result = await apiService.acknowledgePayment(paymentId, token);
              
              if (result.success) {
                Alert.alert(
                  language === 'ta' ? 'வெற்றி' : 'Success',
                  result.message || (language === 'ta' ? 'கட்டணம் வெற்றிகரமாக அங்கீகரிக்கப்பட்டது' : 'Payment acknowledged successfully'),
                  [
                    {
                      text: language === 'ta' ? 'சரி' : 'OK',
                      onPress: () => {
                        // Refresh payment history
                        fetchPaymentHistory(true);
                      }
                    }
                  ]
                );
              } else {
                Alert.alert(
                  language === 'ta' ? 'பிழை' : 'Error',
                  result.message || (language === 'ta' ? 'கட்டணத்தை அங்கீகரிக்க முடியவில்லை' : 'Failed to acknowledge payment')
                );
              }
            } catch (error) {
              console.error('Error acknowledging payment:', error);
              Alert.alert(
                language === 'ta' ? 'பிழை' : 'Error',
                language === 'ta' ? 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.' : 'Something went wrong. Please try again.'
              );
            } finally {
              setAcknowledgingPaymentId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#f8f9fa' }]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#48bb78" />
        </View>
      </SafeAreaView>
    );
  }

  const totalPending = data.reduce((sum: number, item: PaymentHistoryItem) => {
    const status = item.payment_status?.toLowerCase();
    if (status === 'pending' || status === 'processing' || status === 'queued') {
      return sum + parseFloat(item.amount || '0');
    }
    return sum;
  }, 0);
  const paidCount = data.filter((item: PaymentHistoryItem) => {
    const status = item.payment_status?.toLowerCase();
    return status === 'paid' || status === 'completed';
  }).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#f8f9fa' }]}>
      <Stack.Screen
        options={{
          title: language === 'ta' ? 'கட்டண வரலாறு' : 'Payment History',
          headerShown: false,
        }}
      />

      <View style={[styles.modernHeader, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colorScheme === 'dark' ? '#f7fafc' : '#1a202c'} />
          </TouchableOpacity>
          <View style={styles.greetingContainer}>
            <ThemedText style={[styles.greetingText, { color: colorScheme === 'dark' ? '#f7fafc' : '#1a202c' }]}>
              {language === 'ta' ? 'கட்டண வரலாறு' : 'Payment History'}
            </ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPaymentHistory(true)} />}
      >
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#ffffff' }]}>
            <IconSymbol name="creditcard.fill" size={32} color="#ed8936" />
            <ThemedText style={[styles.summaryValue, { color: colorScheme === 'dark' ? '#f7fafc' : '#1a202c' }]}>
              {formatCurrency(totalPending)}
            </ThemedText>
            <ThemedText style={[styles.summaryLabel, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
              {language === 'ta' ? 'மொத்த நிலுவை' : 'Total Pending'}
            </ThemedText>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#ffffff' }]}>
            <IconSymbol name="checkmark.circle.fill" size={32} color="#38a169" />
            <ThemedText style={[styles.summaryValue, { color: colorScheme === 'dark' ? '#f7fafc' : '#1a202c' }]}>
              {paidCount}
            </ThemedText>
            <ThemedText style={[styles.summaryLabel, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
              {language === 'ta' ? 'செலுத்தப்பட்டது' : 'Paid'}
            </ThemedText>
          </View>
        </View>

        {data.length > 0 ? (
          <View style={styles.listContainer}>
            <ThemedText style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#f7fafc' : '#1a202c' }]}>
              {language === 'ta' ? 'கட்டண விவரங்கள்' : 'Payment Details'}
            </ThemedText>
            {data.map((item) => (
              <View
                key={item.id}
                style={[styles.paymentCard, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#ffffff' }]}
              >
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <ThemedText style={[styles.paymentAmount, { color: colorScheme === 'dark' ? '#f7fafc' : '#1a202c' }]}>
                      {formatCurrency(item.amount)}
                    </ThemedText>
                    <ThemedText style={[styles.paymentCount, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                      {item.collection_count} {language === 'ta' ? 'தேங்காய்கள்' : 'Coconuts'}
                    </ThemedText>
                    {item.investor_name && (
                      <ThemedText style={[styles.paymentInvestor, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                        {language === 'ta' ? 'முதலீட்டாளர்' : 'Investor'}: {item.investor_name}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(item.payment_status)}20` },
                      ]}
                    >
                      <ThemedText style={[styles.statusText, { color: getStatusColor(item.payment_status) }]}>
                        {getStatusLabel(item.payment_status)}
                      </ThemedText>
                    </View>
                    {(item.payment_status?.toLowerCase() === 'processing' || item.payment_status?.toLowerCase() === 'queued') && item.farmer_ack === 0 && (
                      <TouchableOpacity
                        style={styles.acknowledgeButton}
                        onPress={() => handleAcknowledgePayment(item.id, item.amount)}
                        disabled={acknowledgingPaymentId === item.id}
                        activeOpacity={0.7}
                      >
                        {acknowledgingPaymentId === item.id ? (
                          <ActivityIndicator size="small" color="#48bb78" />
                        ) : (
                          <IconSymbol name="checkmark.circle.fill" size={24} color="#48bb78" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.paymentDetails}>
                  <View style={styles.paymentDetailRow}>
                    <ThemedText style={[styles.paymentDetailLabel, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                      {language === 'ta' ? 'கட்டண முறை' : 'Payment Mode'}:
                    </ThemedText>
                    <ThemedText style={[styles.paymentDetailValue, { color: colorScheme === 'dark' ? '#f7fafc' : '#1a202c' }]}>
                      {item.payment_mode === 'bank_transfer' ? (language === 'ta' ? 'வங்கி பரிமாற்றம்' : 'Bank Transfer') : item.payment_mode}
                    </ThemedText>
                  </View>
                  {item.bank_name && (
                    <View style={styles.paymentDetailRow}>
                      <ThemedText style={[styles.paymentDetailLabel, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                        {language === 'ta' ? 'வங்கி' : 'Bank'}:
                      </ThemedText>
                      <ThemedText style={[styles.paymentDetailValue, { color: colorScheme === 'dark' ? '#f7fafc' : '#1a202c' }]}>
                        {item.bank_name}
                      </ThemedText>
                    </View>
                  )}
                  {item.utr_number && (
                    <View style={styles.paymentDetailRow}>
                      <ThemedText style={[styles.paymentDetailLabel, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                        {language === 'ta' ? 'UTR எண்' : 'UTR Number'}:
                      </ThemedText>
                      <ThemedText style={[styles.paymentDetailValue, { color: colorScheme === 'dark' ? '#f7fafc' : '#1a202c' }]}>
                        {item.utr_number}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.paymentFooter}>
                  <View style={styles.paymentDateRow}>
                    <ThemedText style={[styles.paymentDateLabel, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                      {language === 'ta' ? 'சேகரிப்பு தேதி:' : 'Collection Date:'}
                    </ThemedText>
                    <ThemedText style={[styles.paymentDate, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                      {formatDate(item.collection_date)}
                    </ThemedText>
                  </View>
                  <View style={styles.paymentDateRow}>
                    <ThemedText style={[styles.paymentDateLabel, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                      {language === 'ta' ? 'கட்டண தேதி:' : 'Payment Date:'}
                    </ThemedText>
                    <ThemedText style={[styles.paymentDate, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                      {formatDateTime(item.created_at)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="creditcard.fill" size={48} color="#cbd5e0" />
            <ThemedText style={[styles.emptyText, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
              {language === 'ta' ? 'கட்டண வரலாறு இல்லை' : 'No payment history found'}
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernHeader: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  greetingContainer: {
    flex: 1,
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  paymentCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentCount: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  paymentInvestor: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 0,
  },
  paymentDetails: {
    marginTop: 2,
    paddingTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148,163,184,0.2)',
  },
  paymentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  paymentDetailLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  paymentDetailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  acknowledgeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(72, 187, 120, 0.1)',
  },
  paymentFooter: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148,163,184,0.2)',
  },
  paymentDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  paymentDateLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  paymentDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
});

