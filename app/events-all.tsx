import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiService, EventItem } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EventsAll() {
  const { language } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchEvents = async (isRefresh = false) => {
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

      const data = await apiService.getUpcomingEvents(token);
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert(
        language === 'ta' ? 'பிழை' : 'Error',
        language === 'ta' ? 'நிகழ்வுகளை ஏற்ற முடியவில்லை' : 'Failed to load events'
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
    fetchEvents();
  }, []);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = language === 'ta' 
      ? ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${dayName}, ${day} ${month} • ${displayHours}:${displayMinutes} ${ampm}`;
  };

  const openEventDetail = (event: EventItem) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const closeEventDetail = () => {
    setModalVisible(false);
    setSelectedEvent(null);
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
          title: language === 'ta' ? 'வரவிருக்கும் நிகழ்வுகள்' : 'Upcoming Events',
          headerShown: false,
        }}
      />

      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.greetingContainer}>
            <ThemedText style={styles.greetingText}>
              {language === 'ta' ? 'வரவிருக்கும் நிகழ்வுகள்' : 'Upcoming Events'}
            </ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => {
          const gradientColors = [
            ['#667eea', '#764ba2'],
            ['#48bb78', '#38a169'],
            ['#ed8936', '#dd6b20'],
            ['#f093fb', '#f5576c'],
            ['#4facfe', '#00f2fe'],
          ];
          const colors = gradientColors[index % gradientColors.length];
          
          return (
            <TouchableOpacity
              style={styles.eventCard}
              onPress={() => openEventDetail(item)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.eventCardGradient}
              >
                <View style={styles.eventItem}>
                  <View style={styles.eventBullet} />
                  <View style={styles.eventItemContent}>
                    <ThemedText style={styles.eventItemTitle} numberOfLines={2}>
                      {item.event_name}
                    </ThemedText>
                    <ThemedText style={styles.eventItemDate}>
                      {formatEventDate(item.start_date)}
                    </ThemedText>
                    {item.location && (
                      <View style={styles.eventLocationRow}>
                        <IconSymbol name="location.fill" size={14} color="rgba(255,255,255,0.9)" />
                        <ThemedText style={styles.eventItemLocation} numberOfLines={1}>
                          {item.location}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <IconSymbol name="chevron.right" size={20} color="rgba(255,255,255,0.8)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchEvents(true)} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="calendar" size={48} color="#cbd5e0" />
            <ThemedText style={[styles.emptyText, { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
              {language === 'ta' ? 'நிகழ்வுகள் இல்லை' : 'No events found'}
            </ThemedText>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={closeEventDetail}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeEventDetail}
        >
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalGradient}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle} numberOfLines={2}>
                    {selectedEvent?.event_name}
                  </ThemedText>
                  <TouchableOpacity onPress={closeEventDetail}>
                    <IconSymbol name="xmark.circle.fill" size={28} color="rgba(255,255,255,0.9)" />
                  </TouchableOpacity>
                </View>
                {selectedEvent && (
                  <ScrollView style={styles.modalBody}>
                    <View style={styles.modalInfoRow}>
                      <IconSymbol name="calendar.badge.clock" size={18} color="rgba(255,255,255,0.9)" />
                      <View style={styles.modalInfoContent}>
                        <ThemedText style={styles.modalLabel}>
                          {language === 'ta' ? 'தேதி:' : 'Date:'}
                        </ThemedText>
                        <ThemedText style={styles.modalValue}>
                          {formatEventDate(selectedEvent.start_date)}
                        </ThemedText>
                      </View>
                    </View>
                    {selectedEvent.location && (
                      <View style={styles.modalInfoRow}>
                        <IconSymbol name="location.fill" size={18} color="rgba(255,255,255,0.9)" />
                        <View style={styles.modalInfoContent}>
                          <ThemedText style={styles.modalLabel}>
                            {language === 'ta' ? 'இடம்:' : 'Location:'}
                          </ThemedText>
                          <ThemedText style={styles.modalValue}>
                            {selectedEvent.location}
                          </ThemedText>
                        </View>
                      </View>
                    )}
                    {selectedEvent.description && (
                      <View style={styles.modalDescription}>
                        <ThemedText style={styles.modalDescriptionText}>
                          {selectedEvent.description}
                        </ThemedText>
                      </View>
                    )}
                  </ScrollView>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>
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
    color: '#ffffff',
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  eventCard: {
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
  eventCardGradient: {
    borderRadius: 20,
    padding: 20,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  eventBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  eventItemContent: {
    flex: 1,
  },
  eventItemTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
    color: '#ffffff',
  },
  eventItemDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: 'rgba(255,255,255,0.9)',
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventItemLocation: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    color: '#ffffff',
    lineHeight: 30,
  },
  modalBody: {
    maxHeight: 400,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  modalInfoContent: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 20,
  },
  modalDescription: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  modalDescriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.95)',
  },
});

