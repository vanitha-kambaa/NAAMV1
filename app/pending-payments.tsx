import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PendingPayment {
  id: number;
  collection_date: string;
  pending_amount: number;
  farmer_name: string;
  farmer_mobile: string;
  payment_status: string;
}

export default function PendingPayments() {
  const { t, language, setLanguage } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const [data, setData] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PendingPayment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async (isRefresh = false) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching investor pending payments...');
      
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('authToken');
      
      console.log('💾 Retrieved from AsyncStorage:');
      console.log('  - User ID:', userId);
      console.log('  - Auth Token:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (!userId || !token) {
        console.log('❌ Missing userId or token, aborting API call');
        router.replace('/');
        return;
      }

      const apiUrl = `${API_CONFIG.BASE_URL}/investor-dashboard/pending-payments/${userId}`;
      console.log('🌐 Making pending payments API request...');
      console.log('📍 API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('📡 API response status:', response.status);
      
      const responseText = await response.text();
      console.log('📄 Raw pending payments response text:', responseText);

      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
        console.log('📋 Parsed pending payments response data:', result);
      } catch (parseError) {
        console.error('❌ Failed to parse pending payments response as JSON:', parseError);
        console.log('📄 Response was not valid JSON, raw text:', responseText);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      if (response.ok && result.status === 'success' && result.data) {
        console.log('✅ Pending payments fetched successfully');
        setData(result.data);
      } else {
        console.log('❌ API failed:', result.message || 'Unknown error');
        setData([]);
      }
    } catch (error) {
      console.error('❌ Error fetching pending payments:', error);
    } finally {
      setLoading(false);
      console.log('🏁 API call completed');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const handleRowPress = (item: PendingPayment) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: t('pending_payments'), headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ThemedText style={styles.backArrow}>←</ThemedText>
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
            <IconSymbol 
              name='creditcard.fill'
              size={60} 
              color="#ffffff" 
              style={styles.headerIcon} 
            />
            <ThemedText style={styles.title}>
              {t('pending_payments')}
            </ThemedText>
            <ThemedText style={styles.subtitle}>{t('detailed_view')}</ThemedText>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>{t('loading')}</ThemedText>
            </View>
          ) : data && data.length > 0 ? (
            <View style={[styles.table, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              {/* Table Header */}
              <View style={[styles.tableHeader, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]}>
                <ThemedText style={[styles.headerText, { flex: 1 }]}>#</ThemedText>
                <ThemedText style={[styles.headerText, { flex: 4 }]}>{t('farmer')}</ThemedText>
                <ThemedText style={[styles.headerText, { flex: 3, textAlign: 'right' }]}>{t('amount')}</ThemedText>
                <ThemedText style={[styles.headerText, { flex: 3, textAlign: 'right' }]}>{t('date')}</ThemedText>
              </View>

              {/* Table Body */}
              <ScrollView showsVerticalScrollIndicator={false}>
                {data.map((item, index) => (
                  <TouchableOpacity key={item.id} style={[styles.tableRow, { borderBottomColor: colorScheme === 'dark' ? '#2d3748' : '#e2e8f0' }]} onPress={() => handleRowPress(item)}>
                    <ThemedText style={[styles.rowText, { flex: 1 }]}>{index + 1}</ThemedText>
                    <ThemedText style={[styles.rowText, { flex: 4 }]} numberOfLines={1}>{item.farmer_name}</ThemedText>
                    <ThemedText style={[styles.rowText, { flex: 3, textAlign: 'right' }]}>₹{item.total_cost}</ThemedText>
                    <ThemedText style={[styles.rowText, { flex: 3, textAlign: 'right' }]}>₹{item.pending_amount}</ThemedText>
                    <ThemedText style={[styles.rowText, { flex: 3, textAlign: 'right' }]}>{formatDate(item.collection_date)}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>{t('no_data_available')}</ThemedText>
            </View>
          )}
        </View>

        {/* Detail Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color="#a0aec0" />
              </TouchableOpacity>
              
              {selectedItem && (
                <>
                  <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>{t('pending_payments')}</ThemedText>
                    <View style={[styles.statusBadge, { backgroundColor: selectedItem.payment_status === 'Pending' ? '#fed7d7' : '#c6f6d5' }]}>
                      <ThemedText style={[styles.statusText, { color: selectedItem.payment_status === 'Pending' ? '#c53030' : '#2f855a' }]}>
                        {selectedItem.payment_status === 'Pending' ? t('pending') : t('paid')}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.modalBody}>
                    <View style={styles.dataRow}>
                      <ThemedText style={styles.label}>{t('farmer')}:</ThemedText>
                      <ThemedText style={styles.value}>{selectedItem.farmer_name}</ThemedText>
                    </View>
                    <View style={styles.dataRow}>
                      <ThemedText style={styles.label}>{t('mobile')}:</ThemedText>
                      <ThemedText style={styles.value}>{selectedItem.farmer_mobile}</ThemedText>
                    </View>
                    <View style={styles.dataRow}>
                      <ThemedText style={styles.label}>{t('date')}:</ThemedText>
                      <ThemedText style={styles.value}>{formatDate(selectedItem.collection_date)}</ThemedText>
                    </View>
                    <View style={styles.dataRow}>
                      <ThemedText style={styles.label}>{t('amount')}:</ThemedText>
                      <ThemedText style={[styles.value, { color: '#667eea', fontSize: 16 }]}>₹{selectedItem.pending_amount}</ThemedText>
                    </View>
                  </View>
                </>
              )}
            </View>
          </BlurView>
        </Modal>
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
    height: '25%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerIcon: {
    marginBottom: 16,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
  },
  table: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a0aec0',
    textTransform: 'uppercase',
  },

  tableRow: {
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  rowText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rowContent: {
    gap: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#2d3748',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
  },
  modalBody: {
    paddingTop: 12,
    gap: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  rowText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
  },
  darkRowText: {
    color: '#cbd5e0',
  },
  darkTableHeader: {
    borderBottomColor: '#2d3748',
  },
  darkTableRow: {
    borderBottomColor: '#2d3748',
  },
});