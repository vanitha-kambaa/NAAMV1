import FarmerBottomNav from '@/components/farmer-bottom-nav';
import { useSideMenu } from '@/components/SideMenu';
import { ThemedText } from '@/components/themed-text';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, View as RNView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// react-native-svg has been removed from the project; charting is disabled
const svgAvailable = false;

function PriceTrendChart({ labels, series }: { labels: string[], series: { green: number[], black: number[], copra: number[] } }) {
  // If the SVG native module isn't available, show a helpful fallback
  if (!svgAvailable) {
    return (
      <RNView style={{ paddingVertical: 12, alignItems: 'center' }}>
        <ThemedText style={{ color: '#6b7280', textAlign: 'center' }}>
          Chart is disabled in this build.
        </ThemedText>
      </RNView>
    );
  }

  const width = 740; // rough px width for SVG
  const height = 180;
  const padding = { left: 36, right: 36, top: 12, bottom: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const allValues = [...series.green, ...series.black, ...series.copra].filter(v => !isNaN(v));
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const range = maxV - minV || 1;

  const xFor = (i: number) => padding.left + (i / Math.max(1, labels.length - 1)) * innerW;
  const yFor = (v: number) => padding.top + (1 - (v - minV) / range) * innerH;

  const makePath = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(v)}`).join(' ');


}

type PriceItem = {
  id: number;
  date: string;
  green_coconut_per: string | number;
  black_coconut_per: string | number;
  green_coconut_kg: string | number;
  black_coconut_kg: string | number;
  copra: string | number;
};

const PERIODS: { key: string; label: string }[] = [
  { key: '7-days', label: '7 Days' },
  { key: '30-days', label: '30 Days' },
  { key: '90-days', label: '90 Days' },
  { key: '1-year', label: '1 Year' },
];

export default function PriceHistory() {
  const { t, language } = useLanguage();
  const { open: openSideMenu } = useSideMenu();
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;
  const [period, setPeriod] = useState<string>('7-days');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PriceItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrices(period);
  }, [period]);

  const fetchPrices = async (periodKey: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('authToken');
      const url = `${API_CONFIG.BASE_URL}/coconut-prices/${periodKey}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (res.ok && json?.status === 'success' && Array.isArray(json.data)) {
        // ensure sorted by date desc
        const sorted: PriceItem[] = json.data.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setData(sorted);
      } else {
        setError(json?.message || 'Failed to load price history');
      }
    } catch (e) {
      console.log('Price history fetch error', e);
      setError('Failed to load price history');
    } finally {
      setLoading(false);
    }
  };

  const metricsForField = (field: keyof PriceItem) => {
    const values = data
      .map((d) => Number((d as any)[field]))
      .filter((v) => !isNaN(v));
    if (!values.length) return null;
    const latest = values[0];
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    const previous = values.length > 1 ? values[1] : null;
    const change = previous ? ((latest - previous) / previous) * 100 : 0;
    return { latest, avg, highest, lowest, change };
  };

  const PRODUCTS: { key: string; label: string; field: keyof PriceItem }[] = [
    { key: 'green', label: language === 'ta' ? 'பச்சை தேங்காய்' : 'Green Coconut', field: 'green_coconut_per' },
    { key: 'black', label: language === 'ta' ? 'கருப்பு தேங்காய்' : 'Black Coconut', field: 'black_coconut_per' },
    { key: 'copra', label: language === 'ta' ? 'உலர் தேங்காய் (கொப்பரா)' : 'Copra', field: 'copra' },
  ];

  // Prepare series for chart
  const labels = data.slice().reverse().map((d) => {
    try {
      const dt = new Date(d.date);
      return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    } catch (e) {
      return d.date;
    }
  });

  const series = {
    green: data.slice().reverse().map((d) => Number(d.green_coconut_kg ?? d.green_coconut_per)),
    black: data.slice().reverse().map((d) => Number(d.black_coconut_kg ?? d.black_coconut_per)),
    copra: data.slice().reverse().map((d) => Number(d.copra)),
  };

  const chartDataAvailable = data && data.length > 0 && (series.green.length > 0 || series.black.length > 0 || series.copra.length > 0);

  // Market insights (derived from fetched price series)
  const periodLabel = period === '1-year' ? (language === 'ta' ? '1 ஆண்டு' : '1 year') : period.replace('-', ' ');

  // Trend for green coconut: compare first vs last value in series.green (chronological order)
  let trendText = language === 'ta' ? 'வரைபடதிற்கான போதுமான தரவு இல்லை' : 'Not enough data to determine trend';
  try {
    const g = series.green.filter((v) => Number.isFinite(v));
    if (g.length >= 2) {
      const first = g[0];
      const last = g[g.length - 1];
      const change = ((last - first) / (first || 1)) * 100;
      if (change > 0.5) {
        trendText = language === 'ta' ? `கடந்த ${periodLabel} பச்சை தேங்காய் விலை உயர்ந்துள்ளது` : `Green coconut prices have increased over the last ${periodLabel}`;
      } else if (change < -0.5) {
        trendText = language === 'ta' ? `கடந்த ${periodLabel} பச்சை தேங்காய் விலை குறைந்துள்ளன` : `Green coconut prices have decreased over the last ${periodLabel}`;
      } else {
        trendText = language === 'ta' ? `கடந்த ${periodLabel} பச்சை தேங்காய் விலை மிதமான மாற்றம்` : `Green coconut prices have remained stable over the last ${periodLabel}`;
      }
    }
  } catch (e) {
    /* ignore */
  }

  // Average copra price
  let avgCopraText = language === 'ta' ? 'கொப்பரா சராசரி விலை எண் கிடைக்கவில்லை' : 'Average copra price not available';
  try {
    const c = series.copra.filter((v) => Number.isFinite(v));
    if (c.length) {
      const avg = c.reduce((s, v) => s + v, 0) / c.length;
      const avgFmt = Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
      avgCopraText = language === 'ta' ? `கொப்பரா சராசரி விலை ₹${avgFmt}` : `Average copra price stands at ₹${avgFmt}`;
    }
  } catch (e) {
    /* ignore */
  }

  const renderCard = ({ item }: { item: { key: string; label: string; field: keyof PriceItem } }) => {
    const m = metricsForField(item.field as any);
    if (!m) {
      return (
        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>{item.label}</ThemedText>
          <ThemedText>{language === 'ta' ? 'பாவனைக்கான எட்டல் இல்லை' : 'No data'}</ThemedText>
        </View>
      );
    }
    const changeColor = m.change < 0 ? '#ef4444' : '#10B981';
    const sign = m.change < 0 ? '↘' : '↗';

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <Image source={require('../assets/images/coconut-trees.png')} style={styles.cardImage} />
          <ThemedText style={styles.cardTitle}>{item.label}</ThemedText>
          <ThemedText style={styles.cardPrice}>₹{formatNumber(m.latest)}</ThemedText>
          <ThemedText style={styles.cardAverage}>{language === 'ta' ? 'சராசரி' : 'Average'}</ThemedText>
          <ThemedText style={styles.cardAverageValue}>₹{formatNumber(m.avg)}</ThemedText>
        </View>

        <View style={styles.cardCenter}>
          <ThemedText style={styles.metaLabel}>{language === 'ta' ? 'Highest' : 'Highest'}</ThemedText>
          <ThemedText style={styles.metaValue}>₹{formatNumber(m.highest)}</ThemedText>

          <ThemedText style={[styles.metaLabel, { marginTop: 12 }]}>{language === 'ta' ? 'Lowest' : 'Lowest'}</ThemedText>
          <ThemedText style={styles.metaValue}>₹{formatNumber(m.lowest)}</ThemedText>
        </View>

        <View style={styles.cardRight}>
          <ThemedText style={{ color: changeColor, fontWeight: '700' }}>{sign} {Math.abs(m.change).toFixed(1)}%</ThemedText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Top bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.hamburger} onPress={() => openSideMenu()}>
          <Ionicons name="menu" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Image 
          source={language === 'ta' 
            ? require('../assets/images/naam-logo-ta.png')
            : require('../assets/images/naam-logo-en.png')
          } 
          style={styles.topAppBarLogo}
          resizeMode="contain"
        />
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.headerTitle}>{language === 'ta' ? 'விலை வரலாறு' : 'Price History'}</ThemedText>
            <ThemedText style={styles.headerSubtitle}>{language === 'ta' ? 'தேங்காய் விலை இருப்புகள்' : 'Coconut Price Trends'}</ThemedText>
          </View>
        </View>

        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p.key} style={[styles.periodBtn, period === p.key && styles.periodBtnActive]} onPress={() => setPeriod(p.key)}>
              <ThemedText style={[styles.periodBtnText, period === p.key && styles.periodBtnTextActive]}>{p.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : error ? (
          <ThemedText style={{ margin: 16, color: '#dc2626' }}>{error}</ThemedText>
        ) : (
          <>
            {/* Chart */}
            <View style={{ paddingHorizontal: 12 }}>
              <View style={styles.chartCard}>
                <ThemedText style={styles.chartTitle}>{language === 'ta' ? 'விலை சுழற்சி வரைபடம்' : 'Price Trend Chart'}</ThemedText>
                {chartDataAvailable ? (
                  <View style={{ paddingVertical: 8 }}>
                    <PriceTrendChart labels={labels} series={series} />
                    <View style={styles.legendRow}>
                      <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} /><ThemedText style={styles.legendText}>Black</ThemedText></View>
                      <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} /><ThemedText style={styles.legendText}>Copra</ThemedText></View>
                      <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#10B981' }]} /><ThemedText style={styles.legendText}>Green</ThemedText></View>
                    </View>
                  </View>
                ) : (
                  <ThemedText style={{ color: '#6b7280' }}>{language === 'ta' ? 'வரைபடத்திற்கான போதுமான தரவு இல்லை' : 'Not enough data for chart'}</ThemedText>
                )}
              </View>
            </View>



            <FlatList
              contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
              data={PRODUCTS}
              keyExtractor={(i) => i.key}
              renderItem={renderCard}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              ListFooterComponent={
                <View style={{ paddingHorizontal: 0, marginTop: 12 }}>
                  {/* Market Insights */}
                  <View style={styles.insightsCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View style={styles.insightsIcon}><Ionicons name="bulb" size={16} color="#2563eb" /></View>
                      <ThemedText style={styles.insightsTitle}>{language === 'ta' ? 'சந்தை நுண்ணறிவு' : 'Market Insights'}</ThemedText>
                    </View>
                    <View style={styles.insightsBody}>
                      <ThemedText style={styles.insightItem}>• {trendText}</ThemedText>
                      <ThemedText style={styles.insightItem}>• {avgCopraText}</ThemedText>
                      <ThemedText style={styles.insightItem}>• {language === 'ta' ? 'விலை பரிமாற்றம் பருவ மழை மற்றும் தேவைக்கு ஏற்ப மாறக்கூடும்' : 'Prices may vary due to seasonal rainfall and demand'}</ThemedText>
                      <ThemedText style={styles.insightItem}>• {language === 'ta' ? 'சிறந்த லாபம் பெற உங்கள் அறுவடியை திட்டமிடுங்கள்' : 'Plan your harvest for better profits'}</ThemedText>
                    </View>
                  </View>
                </View>
              }
            />
          </>
        )}
      </View>
      <FarmerBottomNav />
    </SafeAreaView>
  );
}

function formatNumber(n: number) {
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toFixed(1)));
}

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  topAppBar: { 
    height: isSmallScreen ? 52 : 56, 
    backgroundColor: '#0f6b36', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: isSmallScreen ? 10 : 12 
  },
  hamburger: { width: isSmallScreen ? 32 : 36, alignItems: 'center', justifyContent: 'center' },
  topAppBarLogo: { height: 40, width: 120, maxWidth: 200 },
  header: { 
    backgroundColor: '#06b58a', 
    paddingBottom: isSmallScreen ? 10 : 12, 
    paddingTop: isSmallScreen ? 10 : 12, 
    paddingHorizontal: isSmallScreen ? 10 : 12, 
    borderBottomLeftRadius: isSmallScreen ? 8 : 10, 
    borderBottomRightRadius: isSmallScreen ? 8 : 10 
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: isSmallScreen ? 18 : 20 },
  headerSubtitle: { color: 'rgba(255,255,255,0.95)', marginTop: 2, fontSize: isSmallScreen ? 13 : 14 },
  periodRow: { flexDirection: 'row', marginTop: isSmallScreen ? 10 : 12, gap: isSmallScreen ? 6 : 8, flexWrap: 'wrap' },
  periodBtn: { 
    paddingVertical: isSmallScreen ? 6 : 8, 
    paddingHorizontal: isSmallScreen ? 10 : 12, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.4)', 
    backgroundColor: 'transparent',
    marginBottom: isSmallScreen ? 4 : 0,
  },
  periodBtnActive: { backgroundColor: '#fff', borderColor: '#fff' },
  periodBtnText: { color: '#fff', fontWeight: '700', fontSize: isSmallScreen ? 12 : 14 },
  periodBtnTextActive: { color: '#06b58a' },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: isSmallScreen ? 10 : 12, 
    padding: isSmallScreen ? 12 : 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    elevation: 2,
    flexWrap: 'wrap',
  },
  cardLeft: { flex: 1, minWidth: isSmallScreen ? '100%' : 'auto' },
  cardImage: { width: isSmallScreen ? 32 : 36, height: isSmallScreen ? 32 : 36, marginBottom: 8 },
  cardTitle: { fontWeight: '700', marginBottom: 6, fontSize: isSmallScreen ? 14 : 16 },
  cardPrice: { fontSize: isSmallScreen ? 18 : 20, fontWeight: '700', marginBottom: 6, color: '#0b6b38' },
  cardAverage: { fontSize: isSmallScreen ? 11 : 12, color: '#6b7280' },
  cardAverageValue: { fontWeight: '700', marginTop: 4 },
  cardCenter: { alignItems: 'flex-start', paddingHorizontal: 20 },
  metaLabel: { color: '#6b7280' },
  metaValue: { fontWeight: '700', marginTop: 4 },
  cardRight: { marginLeft: 'auto', alignItems: 'flex-end' },

  /* Chart */
  chartCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 2 },
  chartTitle: { fontWeight: '700', marginBottom: 8 },
  chartSvg: { width: '100%', height: 180 },
  legendRow: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { color: '#6b7280' },

  /* Insights */
  insightsCard: { backgroundColor: '#eef6ff', borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#e0efff' },
  insightsIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eef6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#dbeeff', marginRight: 8 },
  insightsTitle: { fontWeight: '700', marginBottom: 6, fontSize: 14 },
  insightsBody: { paddingLeft: 4 },
  insightItem: { marginBottom: 6, color: '#1f2937', fontSize: 13 },
});
