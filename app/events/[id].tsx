import FarmerBottomNav from '@/components/farmer-bottom-nav';
import { useSideMenu } from '@/components/SideMenu';
import { ThemedText } from '@/components/themed-text';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// RemoteImage helper (local fallback)
function RemoteImage({ uri, style, resizeMode }: { uri?: string; style?: any; resizeMode?: any }) {
  const [failed, setFailed] = React.useState(false);
  const src = !uri || failed ? require('../../assets/images/coconut-trees.png') : { uri };
  return <Image source={src} style={style} resizeMode={resizeMode} onError={() => setFailed(true)} />;
}

export default function EventDetail() {
  const { language } = useLanguage();
  const { open: openSideMenu } = useSideMenu();
  const params = useLocalSearchParams();
  const id = params?.id as string | undefined;
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await AsyncStorage.getItem('authToken');

        // Try fetching from news-events first (as requested for ads), if not found/error, it might be fine or we might want to fallback.
        // But since the IDs might overlap or be unique across tables, we should probably respect the source.
        // For now, let's use the requested endpoint for this "view" if it's generic, or stick to a logic.
        // The user specifically gave `http://65.0.100.65:8000/api/news-events/8`.
        // Let's use `news-events` if it's the standard for this detail view now, or check generic.
        // Since `upcoming-events` was used before, I will try `news-events` as primary if that's the new direction, or maybe try both.
        // Let's try `news-events` first as per user request for "ad details".
        let res = await fetch(`${API_CONFIG.BASE_URL}/news-events/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        // If 404, maybe try upcoming-events (backward compatibility if IDs differ?)
        // But let's assume news-events is the correct one for now as per instruction.
        if (res.status === 404) {
          res = await fetch(`${API_CONFIG.BASE_URL}/upcoming-events/${id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
        }

        const json = await res.json();
        if (res.ok && (json?.status === 'success' || json?.success === true) && json?.data) {
          setData(json.data);
        } else {
          setError(json?.message || 'Failed to load details');
        }

        // Increment view count
        try {
          await fetch(`${API_CONFIG.BASE_URL}/upcoming-events/${id}/view`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
        } catch (vErr) {
          console.log('View increment error', vErr);
        }

      } catch (e) {
        console.log('Event fetch error', e);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [data?.id]);

  const formatDateIST = (iso?: string) => {
    if (!iso) return '';
    try {
      const locale = language === 'ta' ? 'ta-IN' : 'en-IN';
      const d = new Date(iso);
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
    } catch (e) {
      return iso;
    }
  };

  const handleLike = async () => {
    if (!id || !data) return;
    try {
      // Optimistic update
      setData((prev: any) => ({ ...prev, likes: (prev?.likes || 0) + 1 }));

      const token = await AsyncStorage.getItem('authToken');
      await fetch(`${API_CONFIG.BASE_URL}/upcoming-events/${id}/like`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (e) {
      console.log('Like error', e);
      // Revert on error (optional, keeping simple for now)
    }
  };

  const handleShare = async () => {
    if (!id || !data) return;
    try {
      // Optimistic update (coerce to number to avoid string concatenation e.g. "3"+1 => "31")
      setData((prev: any) => ({ ...prev, share: Number(prev?.share ?? 0) + 1 }));

      // Call Share API
      const token = await AsyncStorage.getItem('authToken');
      fetch(`${API_CONFIG.BASE_URL}/upcoming-events/${id}/share`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }).catch(err => console.log('Share API error', err));

      // Open System Share
      const title = language === 'ta' ? (data.event_name_tamil ?? data.event_name) : (data.event_name ?? '');
      const description = language === 'ta' ? (data.description_tamil ?? data.description) : (data.description ?? '');
      const link = data.read_moreurl || data.link_url || '';

      const message = `${title}\n${description}\n${link}`.trim();

      await Share.share({
        message: message,
      });

    } catch (e) {
      console.log('Share error', e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: language === 'ta' ? 'செய்தி' : 'News', headerShown: false }} />

      {/* Top bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.hamburger} onPress={() => openSideMenu()}>
          <Ionicons name="menu" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Image
          source={
            language === 'ta'
              ? require('../../assets/images/naam-logo-ta.png')
              : require('../../assets/images/naam-logo-en.png')
          }
          style={styles.topAppBarLogo}
          resizeMode="contain"
        />
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : error ? (
        <ThemedText style={{ margin: 16, color: '#dc2626' }}>{error}</ThemedText>
      ) : data ? (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
            <View style={styles.heroWrap}>
              <TouchableOpacity style={{ position: 'absolute', left: 12, top: 12, zIndex: 20 }} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>

              <RemoteImage uri={data.image_url && data.image_url.startsWith('http') ? data.image_url : (data.image_url ? `${API_CONFIG.UPLOADS_URL}/news/${data.image_url}` : undefined)} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.typePill}><ThemedText style={styles.typePillText}>{language === 'ta' ? (data.type_tamil ?? data.type ?? '') : (data.type ?? '')}</ThemedText></View>
            </View>

            <View style={styles.container}>
              <ThemedText style={styles.title}>{language === 'ta' ? (data.event_name_tamil ?? data.event_name) : data.event_name}</ThemedText>
              {(language === 'ta' ? (data.news_for_tamil ?? data.news_for) : data.news_for) ? (
                <ThemedText style={styles.subTitle}>{language === 'ta' ? (data.news_for_tamil ?? data.news_for) : (data.news_for ?? '')}</ThemedText>
              ) : null}

              <View style={styles.metaRow}>
                <View style={styles.metaItem}><Ionicons name="calendar" size={16} color="#6b7280" /><ThemedText style={styles.metaText}>{formatDateIST(data.start_date)}</ThemedText></View>
                <View style={styles.metaItem}><Ionicons name="location" size={16} color="#6b7280" /><ThemedText style={styles.metaText}>{language === 'ta' ? (data.location_tamil ?? data.location) : (data.location ?? '')}</ThemedText></View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}><Ionicons name="person" size={16} color="#6b7280" /><ThemedText style={styles.metaText}>{data.organizer ?? ''}</ThemedText></View>
              </View>

              <View style={styles.divider} />

              <ThemedText style={styles.sectionTitle}>{language === 'ta' ? 'விவரம்' : 'Details'}</ThemedText>
              <ThemedText style={styles.description}>{language === 'ta' ? (data.description_tamil ?? data.description) : data.description}</ThemedText>

              {data.read_moreurl ? (
                <>
                  <ThemedText style={[styles.sectionTitle, { marginTop: 16 }]}>{language === 'ta' ? 'மேலும் படிக்க' : 'Read more'}</ThemedText>
                  <TouchableOpacity onPress={() => Linking.openURL(data.read_moreurl)}>
                    <ThemedText style={styles.readMoreLink}>{data.read_moreurl}</ThemedText>
                  </TouchableOpacity>
                </>
              ) : null}

              <View style={styles.footerStats}>
                <TouchableOpacity onPress={handleLike} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="heart" size={16} color="#ef4444" />
                  <ThemedText style={[styles.metaText, { marginLeft: 8 }]}>{data.likes ?? 0}</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleShare} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
                  <Ionicons name="share-social" size={16} color="#6b7280" />
                  <ThemedText style={[styles.metaText, { marginLeft: 8 }]}>{data.share ?? 0}</ThemedText>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
                  <Ionicons name="eye" size={16} color="#6b7280" />
                  <ThemedText style={[styles.metaText, { marginLeft: 8 }]}>{data.view ?? 0}</ThemedText>
                </View>
              </View>

            </View>
          </ScrollView>
        </View>
      ) : null}
      <FarmerBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  topAppBar: { height: 56, backgroundColor: '#0f6b36', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  hamburger: { width: 36, alignItems: 'center', justifyContent: 'center' },
  topAppBarTitle: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  topAppBarLogo: { width: 140, height: 40 },
  heroWrap: { position: 'relative', backgroundColor: '#000' },
  heroImage: { width: '100%', height: 200, opacity: 0.98 },
  typePill: { position: 'absolute', right: 12, top: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  typePillText: { color: '#fff', fontWeight: '700' },
  container: { paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  subTitle: { color: '#6b7280', marginBottom: 12 },
  metaRow: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  metaText: { color: '#6b7280', marginLeft: 8 },
  divider: { height: 1, backgroundColor: '#eef2f6', marginVertical: 12 },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },
  description: { color: '#1f2937', lineHeight: 20 },
  readMoreLink: { color: '#2563eb', textDecorationLine: 'underline' },
  footerStats: { flexDirection: 'row', marginTop: 18, alignItems: 'center' },
});