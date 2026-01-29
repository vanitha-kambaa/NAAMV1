import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiService, CollectionDetail } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export default function CollectionDetailsScreen() {
  const { language } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const params = useLocalSearchParams<{ farmerId?: string; landId?: string; farmerName?: string }>();
  const router = useRouter();

  const farmerId = Number(params.farmerId);
  const landId = Number(params.landId);
  const farmerName = params.farmerName || '';

  const [token, setToken] = useState<string | null>(null);
  const [collections, setCollections] = useState<CollectionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CollectionDetail | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const themedColors = useMemo(() => Colors[colorScheme], [colorScheme]);

  const loadAuth = useCallback(async () => {
    const storedToken = await AsyncStorage.getItem('authToken');
    const storedUserId = await AsyncStorage.getItem('userId');
    if (!storedToken) {
      Alert.alert(
        language === 'ta' ? 'அங்கீகாரம் தேவை' : 'Authentication required',
        language === 'ta'
          ? 'சேகரிப்பைப் பார்க்க உள்நுழைவு விவரங்கள் தேவை.'
          : 'Please sign in again to view collection details.'
      );
      return;
    }
    setToken(storedToken);
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, [language]);

  const fetchCollections = useCallback(
    async (isRefresh = false) => {
      if (!token || !farmerId || !landId) {
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await apiService.getCollectionDetails(farmerId, landId, token);
        setCollections(response.data || []);
      } catch (error) {
        Alert.alert(
          language === 'ta' ? 'ஏற்றுதல் தோல்வி' : 'Failed to load',
          error instanceof Error ? error.message : 'Unknown error'
        );
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [token, farmerId, landId, language]
  );

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    if (token) {
      fetchCollections(false);
    }
  }, [token, fetchCollections]);

  const handleMakePayment = async () => {
    if (!selectedEntry || !token || !userId) {
      Alert.alert(
        language === 'ta' ? 'பிழை' : 'Error',
        language === 'ta' ? 'தவறான தகவல்' : 'Invalid information'
      );
      return;
    }

    const amount = selectedEntry.collection_count * selectedEntry.price_per_coconut;
    const paymentMode = amount <= 200000 ? 'NEFT' : 'RTGS';

    setProcessingPayment(true);

    try {
      const result = await apiService.makePayment(
        Number(userId),
        selectedEntry.id,
        farmerId,
        paymentMode,
        amount,
        token
      );

      if (result.success) {
        Alert.alert(
          language === 'ta' ? 'வெற்றி' : 'Success',
          language === 'ta' ? 'கட்டணம் வெற்றிகரமாக செலுத்தப்பட்டது' : 'Payment processed successfully',
          [
            {
              text: language === 'ta' ? 'சரி' : 'OK',
              onPress: () => {
                setPaymentModalVisible(false);
                setSelectedEntry(null);
                fetchCollections(true); // Refresh data
              },
            },
          ]
        );
      } else {
        Alert.alert(
          language === 'ta' ? 'பிழை' : 'Error',
          result.message || (language === 'ta' ? 'கட்டணம் தோல்வியடைந்தது' : 'Payment failed')
        );
      }
    } catch (error) {
      Alert.alert(
        language === 'ta' ? 'பிழை' : 'Error',
        error instanceof Error ? error.message : (language === 'ta' ? 'அறியப்படாத பிழை' : 'Unknown error')
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const openPaymentModal = (entry: CollectionDetail) => {
    setSelectedEntry(entry);
    setPaymentModalVisible(true);
  };

  const totalCount = collections.reduce((sum, entry) => sum + (entry.collection_count || 0), 0);
  const totalValue = collections.reduce(
    (sum, entry) => sum + (entry.collection_count * entry.price_per_coconut || 0),
    0
  );

  const summaryCards = [
    {
      label: language === 'ta' ? 'மொத்த எண்ணிக்கை' : 'Total Count',
      value: totalCount.toString(),
      color: '#48bb78',
    },
    {
      label: language === 'ta' ? 'மொத்த மதிப்பு' : 'Total Value',
      value: `₹${totalValue.toFixed(2)}`,
      color: '#ed8936',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: themedColors.background }]}>
      <Stack.Screen
        options={{
          title: language === 'ta' ? 'சேகரிப்பு விவரங்கள்' : 'Collection Details',
        }}
      />

      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <ThemedText style={styles.headerTitle}>
          {language === 'ta' ? 'விவசாயி :' : 'Farmer:'} {farmerName || `#${farmerId}`}
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          {language === 'ta' ? 'மொத்த சேகரிப்பை காண்க' : 'Review coconut collection history'}
        </ThemedText>
      </LinearGradient>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchCollections(true)} />}
        >
          <View style={styles.summaryRow}>
            {summaryCards.map((card) => (
              <View key={card.label} style={[styles.summaryCard, { backgroundColor: `${card.color}1A` }]}>
                <ThemedText style={styles.summaryValue}>{card.value}</ThemedText>
                <ThemedText style={styles.summaryLabel}>{card.label}</ThemedText>
              </View>
            ))}
          </View>

          {collections.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyTitle}>
                {language === 'ta' ? 'சேகரிப்புகள் இல்லை' : 'No collection entries found'}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.list}>
              {collections.map((entry) => {
                const status = (entry.payment_status || '').toLowerCase();
                const isPending = status === 'pending';
                return (
                  <View key={entry.id} style={[styles.entryCard, { backgroundColor: themedColors.card }]}>
                    <View style={styles.entryRow}>
                      <ThemedText style={styles.entryCount}>{entry.collection_count}</ThemedText>
                      <ThemedText style={styles.entryQuality}>
                        {language === 'ta' ? 'தரம்' : 'Quality'}: {entry.quallity_status}
                      </ThemedText>
                    </View>
                    <View style={styles.entryMeta}>
                      <ThemedText style={styles.entryMetaText}>
                        ₹{entry.price_per_coconut.toFixed(2)} {language === 'ta' ? 'ஒரு தேங்காய்க்கு' : 'per coconut'}
                      </ThemedText>
                      <ThemedText style={styles.entryMetaText}>
                        {language === 'ta' ? 'தேதி: ' : 'Date: '}
                        {new Date(entry.created_at).toLocaleDateString()}
                      </ThemedText>
                    </View>
                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusPill,
                          isPending ? styles.statusPending : styles.statusPaid,
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.statusText,
                            isPending ? styles.statusTextPending : styles.statusTextPaid,
                          ]}
                        >
                          {language === 'ta'
                            ? isPending
                              ? 'நிலுவை'
                              : 'செலுத்தப்பட்டது'
                            : isPending
                              ? 'Pending'
                              : 'Paid'}
                        </ThemedText>
                      </View>
                      {isPending && (
                        <TouchableOpacity
                          style={styles.paymentButton}
                          onPress={() => openPaymentModal(entry)}
                        >
                          <ThemedText style={styles.paymentButtonText}>
                            {language === 'ta' ? 'கட்டணம் செலுத்த' : 'Make Payment'}
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!processingPayment) {
            setPaymentModalVisible(false);
            setSelectedEntry(null);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themedColors.card }]}>
            <ThemedText style={styles.modalTitle}>
              {language === 'ta' ? 'கட்டணம் உறுதிப்படுத்தல்' : 'Confirm Payment'}
            </ThemedText>

            {selectedEntry && (
              <>
                <View style={styles.modalInfoRow}>
                  <ThemedText style={styles.modalLabel}>
                    {language === 'ta' ? 'தொகை:' : 'Amount:'}
                  </ThemedText>
                  <ThemedText style={styles.modalValue}>
                    ₹{(selectedEntry.collection_count * selectedEntry.price_per_coconut).toFixed(2)}
                  </ThemedText>
                </View>

                <View style={styles.modalInfoRow}>
                  <ThemedText style={styles.modalLabel}>
                    {language === 'ta' ? 'கட்டண முறை:' : 'Payment Mode:'}
                  </ThemedText>
                  <ThemedText style={styles.modalValue}>
                    {selectedEntry.collection_count * selectedEntry.price_per_coconut <= 200000
                      ? 'NEFT'
                      : 'RTGS'}
                  </ThemedText>
                </View>

                <View style={styles.modalInfoRow}>
                  <ThemedText style={styles.modalLabel}>
                    {language === 'ta' ? 'தேங்காய் எண்ணிக்கை:' : 'Coconut Count:'}
                  </ThemedText>
                  <ThemedText style={styles.modalValue}>{selectedEntry.collection_count}</ThemedText>
                </View>

                <View style={styles.modalInfoRow}>
                  <ThemedText style={styles.modalLabel}>
                    {language === 'ta' ? 'தேங்காய்க்கு விலை:' : 'Price per Coconut:'}
                  </ThemedText>
                  <ThemedText style={styles.modalValue}>
                    ₹{selectedEntry.price_per_coconut.toFixed(2)}
                  </ThemedText>
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  if (!processingPayment) {
                    setPaymentModalVisible(false);
                    setSelectedEntry(null);
                  }
                }}
                disabled={processingPayment}
              >
                <ThemedText style={styles.modalCancelButtonText}>
                  {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleMakePayment}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <ThemedText style={styles.modalConfirmButtonText}>
                    {language === 'ta' ? 'உறுதிப்படுத்து' : 'Confirm'}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    color: '#1f2933',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#4a5568',
    fontWeight: '600',
  },
  list: {
    gap: 12,
  },
  entryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148,163,184,0.4)',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2933',
  },
  entryQuality: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryMetaText: {
    fontSize: 13,
    color: '#4a5568',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  statusPending: {
    backgroundColor: 'rgba(237, 137, 54, 0.15)',
  },
  statusPaid: {
    backgroundColor: 'rgba(72, 187, 120, 0.15)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextPending: {
    color: '#ed8936',
  },
  statusTextPaid: {
    color: '#38a169',
  },
  paymentButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#667eea',
  },
  paymentButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    color: '#4a5568',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1f2933',
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148,163,184,0.3)',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2933',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#e2e8f0',
  },
  modalCancelButtonText: {
    color: '#4a5568',
    fontWeight: '700',
    fontSize: 16,
  },
  modalConfirmButton: {
    backgroundColor: '#667eea',
  },
  modalConfirmButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});

