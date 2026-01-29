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

interface CollectionItem {
  id: number;
  collection_date: string;
  collection_count: number;
  quallity_status: string;
  price_per_coconut: number;
  total_cost: number;
  pending_cost: number | null;
  payment_status: string;
  farmer_name: string;
  farmer_mobile: string;
  investor_name: string;
  patta_number: string | null;
  land_lattitude: number | null;
  land_longitude: number | null;
}

interface CollectionHistoryData {
  collections: CollectionItem[];
  total: number;
  totalCoconuts: number;
  totalAmount: number;
  pendingAmount: number;
}

export default function CoconutSold() {
  const { language } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<CollectionHistoryData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [investorId, setInvestorId] = useState<number | null>(null);

  const loadCredentials = useCallback(async () => {
    const storedUserId = await AsyncStorage.getItem('userId');
    const storedToken = await AsyncStorage.getItem('authToken');
    const storedUserData = await AsyncStorage.getItem('userData');
    
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
    
    // Try to get investor_id from user data if available
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        if (userData.investor_id) {
          setInvestorId(userData.investor_id);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, [language, router]);

  const fetchCoconutSold = useCallback(async (isRefresh = false) => {
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

      const result = await apiService.getCollectionHistory(
        farmerId,
        investorId,
        0,
        100, // Get more records
        token
      );

      if (result.success) {
        const collections = result.data || [];
        const totalCoconuts = collections.reduce((sum: number, item: CollectionItem) => sum + item.collection_count, 0);
        const totalAmount = collections.reduce((sum: number, item: CollectionItem) => sum + item.total_cost, 0);
        const pendingAmount = collections.reduce((sum: number, item: CollectionItem) => sum + (item.total_cost || 0), 0);

        setData({
          collections,
          total: result.total,
          totalCoconuts,
          totalAmount,
          pendingAmount,
        });
      } else {
        Alert.alert(
          language === 'ta' ? 'பிழை' : 'Error',
          result.message || (language === 'ta' ? 'தரவை ஏற்ற முடியவில்லை' : 'Failed to load data')
        );
      }
    } catch (error) {
      console.error('Error fetching coconut sold data:', error);
      Alert.alert(
        language === 'ta' ? 'பிழை' : 'Error',
        language === 'ta' ? 'நெட்வொர்க் பிழை' : 'Network error'
      );
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [userId, token, investorId, language]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  useEffect(() => {
    if (userId && token) {
      fetchCoconutSold();
    }
  }, [userId, token, fetchCoconutSold]);

  useFocusEffect(
    useCallback(() => {
      if (userId && token) {
        fetchCoconutSold(true);
      }
    }, [userId, token, fetchCoconutSold])
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
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

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#f8f9fa' }]}>
      <Stack.Screen
        options={{
          title: language === 'ta' ? 'தேங்காய் விற்பனை' : 'Coconut Sold',
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
              {language === 'ta' ? 'தேங்காய் விற்பனை' : 'Coconut Sold'}
            </ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchCoconutSold(true)} />}
      >
        {data && (
          <>
            <View style={styles.summaryCards}>
              <View style={[styles.summaryCard, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#ffffff' }]}>
                <IconSymbol name="leaf.fill" size={32} color="#48bb78" />
                <ThemedText style={[styles.summaryValue, { color: colorScheme === 'dark' ? '#f7fafc' : '#1a202c' }]}>
                  {data.totalCoconuts || '0'}
                </ThemedText>
                <ThemedText style={[styles.summaryLabel, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                  {language === 'ta' ? 'மொத்த தேங்காய்கள்' : 'Total Coconuts'}
                </ThemedText>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#ffffff' }]}>
                <IconSymbol name="creditcard.fill" size={32} color="#ed8936" />
                <ThemedText style={[styles.summaryValue, { color: colorScheme === 'dark' ? '#f7fafc' : '#1a202c' }]}>
                  {formatCurrency(data.pendingAmount || 0)}
                </ThemedText>
                <ThemedText style={[styles.summaryLabel, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                  {language === 'ta' ? 'நிலுவை தொகை' : 'Pending Amount'}
                </ThemedText>
              </View>
            </View>

            {data.collections && data.collections.length > 0 ? (
              <View style={styles.listContainer}>
                <ThemedText style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#f7fafc' : '#1a202c' }]}>
                  {language === 'ta' ? 'விற்பனை வரலாறு' : 'Sales History'}
                </ThemedText>
                {data.collections.map((collection) => (
                  <View
                    key={collection.id}
                    style={[styles.collectionCard, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#ffffff' }]}
                  >
                    <View style={styles.collectionHeader}>
                      <View style={styles.collectionInfo}>
                        <ThemedText style={[styles.collectionCount, { color: colorScheme === 'dark' ? '#f7fafc' : '#1a202c' }]}>
                          {collection.collection_count} {language === 'ta' ? 'தேங்காய்கள்' : 'Coconuts'}
                        </ThemedText>
                        <ThemedText style={[styles.collectionQuality, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                          {language === 'ta' ? 'தரம்' : 'Quality'}: {collection.quallity_status}
                        </ThemedText>
                        {collection.investor_name && (
                          <ThemedText style={[styles.collectionInvestor, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                            {language === 'ta' ? 'முதலீட்டாளர்' : 'Investor'}: {collection.investor_name}
                          </ThemedText>
                        )}
                      </View>
                      <ThemedText style={[styles.collectionAmount, { color: '#48bb78' }]}>
                        {formatCurrency(collection.total_cost)}
                      </ThemedText>
                    </View>
                    <View style={styles.collectionFooter}>
                      <View>
                        <ThemedText style={[styles.collectionPrice, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                          ₹{collection.price_per_coconut.toFixed(2)} {language === 'ta' ? 'ஒரு தேங்காய்க்கு' : 'per coconut'}
                        </ThemedText>
                        <ThemedText style={[styles.collectionPaymentStatus, { 
                          color: collection.payment_status === 'Paid' ? '#48bb78' : '#ed8936' 
                        }]}>
                          {collection.payment_status}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.collectionDate, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                        {formatDateTime(collection.collection_date)}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol name="leaf.fill" size={48} color="#cbd5e0" />
                <ThemedText style={[styles.emptyText, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                  {language === 'ta' ? 'விற்பனை வரலாறு இல்லை' : 'No sales history found'}
                </ThemedText>
              </View>
            )}
          </>
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
  collectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionCount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  collectionQuality: {
    fontSize: 14,
    fontWeight: '600',
  },
  collectionAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  collectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148,163,184,0.2)',
  },
  collectionPrice: {
    fontSize: 13,
    fontWeight: '600',
  },
  collectionDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  collectionInvestor: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  collectionPaymentStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
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

