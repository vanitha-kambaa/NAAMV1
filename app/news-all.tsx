import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiService, NewsItem } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewsAll() {
  const { language } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/');
        return;
      }

      const data = await apiService.getNewsEvents(token);
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
      Alert.alert(
        language === 'ta' ? 'பிழை' : 'Error',
        language === 'ta' ? 'செய்திகளை ஏற்ற முடியவில்லை' : 'Failed to load news'
      );
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#f8f9fa' }]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#f8f9fa' }]}>
      <Stack.Screen
        options={{
          title: language === 'ta' ? 'செய்திகள் மற்றும் புதுப்பிப்புகள்' : 'News & Updates',
          headerShown: false,
        }}
      />

      <LinearGradient
        colors={['#f093fb', '#f5576c']}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.greetingContainer}>
            <ThemedText 
              style={styles.greetingText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {language === 'ta' ? 'செய்திகள் மற்றும் புதுப்பிப்புகள்' : 'News & Updates'}
            </ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <FlatList
        data={news}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => {
          const gradientColors: [string, string][] = [
            ['#f093fb', '#f5576c'],
            ['#4facfe', '#00f2fe'],
            ['#43e97b', '#38f9d7'],
            ['#fa709a', '#fee140'],
            ['#30cfd0', '#330867'],
          ];
          const colors: [string, string] = gradientColors[index % gradientColors.length];
          
          return (
            <View style={styles.newsCard}>
              <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.newsCardGradient}
              >
                <View style={styles.newsItem}>
                  <View style={styles.newsItemContent}>
                    <ThemedText style={styles.newsItemTitle} numberOfLines={2}>
                      {item.title}
                    </ThemedText>
                    <View style={styles.newsItemMeta}>
                      <ThemedText style={styles.newsItemSource}>
                        {(item as any).source || 'NAAM'}
                      </ThemedText>
                      <View style={styles.newsItemDivider} />
                      <ThemedText style={styles.newsItemDate}>
                        {formatDate(item.published_date)}
                      </ThemedText>
                    </View>
                    {item.description && (
                      <ThemedText style={styles.newsItemDescription} numberOfLines={3}>
                        {item.description}
                      </ThemedText>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchNews(true)} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="newspaper.fill" size={48} color="#cbd5e0" />
            <ThemedText style={[styles.emptyText, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
              {language === 'ta' ? 'செய்திகள் இல்லை' : 'No news found'}
            </ThemedText>
          </View>
        }
      />
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
  headerGradient: {
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
    paddingVertical: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  greetingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  newsCard: {
    borderRadius: 20,
    marginBottom: 16,
    marginHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    overflow: 'hidden',
  },
  newsCardGradient: {
    borderRadius: 20,
    padding: 20,
  },
  newsItem: {
    marginBottom: 4,
  },
  newsItemContent: {
    flex: 1,
  },
  newsItemTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 24,
    color: '#ffffff',
  },
  newsItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  newsItemSource: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  newsItemDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  newsItemDate: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  newsItemDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.85)',
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

