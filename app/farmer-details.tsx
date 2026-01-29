import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLanguage } from '@/contexts/LanguageContext';

interface CoconutCollection {
  id: number;
  collection_date: string;
  collection_count: number;
  price_per_coconut: number;
  total_cost: number;
  quality_status: string;
  investor_name: string;
  payment_status: string;
}

interface PendingAmount {
  id: number;
  collection_date: string;
  pending_amount: number;
  investor_name: string;
  investor_mobile: string;
  payment_status: string;
}

interface DetailedSummary {
  coconut_collections: CoconutCollection[];
  pending_amounts: PendingAmount[];
}

export default function FarmerDetails() {
  const { t, language, setLanguage } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const { type } = useLocalSearchParams();
  const [detailedData, setDetailedData] = useState<DetailedSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const years = [2025, 2024, 2023, 2022, 2021];

  useEffect(() => {
    fetchDetailedSummary();
  }, [selectedYear]);

  const fetchDetailedSummary = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching detailed farmer summary...');
      
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('authToken');
      
      console.log('💾 Retrieved from AsyncStorage:');
      console.log('  - User ID:', userId);
      console.log('  - Auth Token:', token ? token.substring(0, 20) + '...' : 'null');
      console.log('  - Selected Year:', selectedYear);
      
      if (!userId || !token) {
        console.log('❌ Missing userId or token, aborting API call');
        return;
      }

      const apiUrl = `https://tlzwdzgp-9000.inc1.devtunnels.ms/api/users/farmer-detailed-summary/${userId}/${selectedYear}`;
      console.log('🌐 Making detailed summary API request...');
      console.log('📍 API URL:', apiUrl);
      console.log('📤 Request method: GET');
      console.log('🔑 Authorization: Bearer', token.substring(0, 20) + '...');
      console.log('📅 Year filter:', selectedYear);
      console.log('👤 Farmer ID:', userId);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('📡 Detailed summary API response status:', response.status);
      console.log('📡 Detailed summary API response statusText:', response.statusText);
      console.log('📡 Detailed summary API response ok:', response.ok);
      console.log('📡 Detailed summary API response headers:');
      for (let [key, value] of response.headers.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      const responseText = await response.text();
      console.log('📄 Raw detailed summary response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('📋 Parsed detailed summary response data:', result);
      } catch (parseError) {
        console.error('❌ Failed to parse detailed summary response as JSON:', parseError);
        console.log('📄 Response was not valid JSON, raw text:', responseText);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      if (response.ok && result.status === 'success') {
        console.log('✅ Detailed summary fetched successfully');
        console.log('🥥 Coconut collections count:', result.data?.coconut_collections?.length || 0);
        console.log('💰 Pending amounts count:', result.data?.pending_amounts?.length || 0);
        console.log('📊 Detailed summary data:', result.data);
        setDetailedData(result.data);
      } else {
        console.log('❌ Detailed summary API failed:', result.message || 'Unknown error');
        console.log('📊 Failed response data:', result);
      }
    } catch (error) {
      console.error('❌ Error fetching detailed summary:', error);
      console.log('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
      console.log('🏁 Detailed summary API call completed');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const isCoconutView = type === 'coconuts';
  const data = isCoconutView ? detailedData?.coconut_collections : detailedData?.pending_amounts;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: isCoconutView ? 'Coconut Collections' : 'Pending Payments', headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient colors={['#48bb78', '#38a169']} style={styles.header}>
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
              name={isCoconutView ? 'circle.fill' : 'creditcard.fill'} 
              size={60} 
              color="#ffffff" 
              style={styles.headerIcon} 
            />
            <ThemedText style={styles.title}>
              {isCoconutView ? t('coconut_collections') : t('pending_payments')}
            </ThemedText>
            <ThemedText style={styles.subtitle}>{t('detailed_view')}</ThemedText>
          </View>
        </LinearGradient>

        <View style={styles.filterContainer}>
          <ThemedText style={styles.filterLabel}>{t('year')}:</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearFilter}>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearButton,
                  selectedYear === year && styles.selectedYearButton
                ]}
                onPress={() => setSelectedYear(year)}
              >
                <ThemedText style={[
                  styles.yearText,
                  selectedYear === year && styles.selectedYearText
                ]}>
                  {year}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>{t('loading')}</ThemedText>
            </View>
          ) : (
            <View style={styles.tableContainer}>
              {data && data.length > 0 ? (
                data.map((item, index) => (
                  <View key={item.id} style={[styles.tableRow, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
                    <View style={styles.rowHeader}>
                      <ThemedText style={styles.rowTitle}>#{index + 1}</ThemedText>
                      <View style={[styles.statusBadge, { backgroundColor: item.payment_status === 'Pending' ? '#fed7d7' : '#c6f6d5' }]}>
                        <ThemedText style={[styles.statusText, { color: item.payment_status === 'Pending' ? '#c53030' : '#2f855a' }]}>
                          {item.payment_status === 'Pending' ? t('pending') : t('paid')}
                        </ThemedText>
                      </View>
                    </View>
                    
                    <View style={styles.rowContent}>
                      <View style={styles.dataRow}>
                        <ThemedText style={styles.label}>{t('date')}:</ThemedText>
                        <ThemedText style={styles.value}>{formatDate(item.collection_date)}</ThemedText>
                      </View>
                      
                      {isCoconutView ? (
                        <>
                          <View style={styles.dataRow}>
                            <ThemedText style={styles.label}>{t('count')}:</ThemedText>
                            <ThemedText style={styles.value}>{(item as CoconutCollection).collection_count}</ThemedText>
                          </View>
                          <View style={styles.dataRow}>
                            <ThemedText style={styles.label}>{t('price_per_coconut')}:</ThemedText>
                            <ThemedText style={styles.value}>₹{(item as CoconutCollection).price_per_coconut}</ThemedText>
                          </View>
                          <View style={styles.dataRow}>
                            <ThemedText style={styles.label}>{t('total_cost')}:</ThemedText>
                            <ThemedText style={styles.value}>₹{(item as CoconutCollection).total_cost}</ThemedText>
                          </View>
                          <View style={styles.dataRow}>
                            <ThemedText style={styles.label}>{t('quality')}:</ThemedText>
                            <ThemedText style={styles.value}>{(item as CoconutCollection).quality_status === 'good' ? t('good') : (item as CoconutCollection).quality_status}</ThemedText>
                          </View>
                        </>
                      ) : (
                        <>
                          <View style={styles.dataRow}>
                            <ThemedText style={styles.label}>{t('amount')}:</ThemedText>
                            <ThemedText style={styles.value}>₹{(item as PendingAmount).pending_amount}</ThemedText>
                          </View>
                          <View style={styles.dataRow}>
                            <ThemedText style={styles.label}>{t('mobile')}:</ThemedText>
                            <ThemedText style={styles.value}>{(item as PendingAmount).investor_mobile}</ThemedText>
                          </View>
                        </>
                      )}
                      
                      <View style={styles.dataRow}>
                        <ThemedText style={styles.label}>{t('investor')}:</ThemedText>
                        <ThemedText style={styles.value}>{item.investor_name}</ThemedText>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>{t('no_data_available')}</ThemedText>
                </View>
              )}
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
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
  },
  tableContainer: {
    gap: 16,
    marginBottom: 30,
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
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#48bb78',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 12,
  },
  yearFilter: {
    flexDirection: 'row',
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  selectedYearButton: {
    backgroundColor: '#48bb78',
  },
  yearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  selectedYearText: {
    color: '#ffffff',
  },
});