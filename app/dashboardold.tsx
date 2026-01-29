import { InvestorFarmersList } from '@/components/investor-farmers-list';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiService, EventItem, NewsItem } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { ComponentProps, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FarmerSummary {
  farmer_id: number;
  total_coconut_count: string;
  pending_amount: string;
}

interface InvestorStats {
  coconut_good_stock: string;
  coconut_damaged_stock: number;
  pending_payment_amount: string;
  pending_payment_count: number;
}

type InvestorTab = 'home' | 'farmers' | 'reports';

type IconName = ComponentProps<typeof IconSymbol>['name'];

type WidgetTile = {
  id: string;
  title: string;
  value: string;
  icon: IconName;
  color: string;
  subtitle?: string;
};

type WidgetMap = Record<'farmer' | 'investor' | 'serviceProvider', WidgetTile[]>;

interface BlinkingIconProps {
  children: React.ReactNode;
}

function BlinkingIcon({ children }: BlinkingIconProps) {
  const opacity = new Animated.Value(1);

  useEffect(() => {
    const blink = () => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => blink());
    };
    blink();
  }, []);

  return (
    <Animated.View style={{ opacity }}>
      {children}
    </Animated.View>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_SPACING = 16;
const NAV_ITEM_MIN_WIDTH = Math.max(60, SCREEN_WIDTH / 4 - 8);

export default function Dashboard() {
  const { t, language, setLanguage } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const [userRole, setUserRole] = useState<string>('farmer');
  const [farmerSummary, setFarmerSummary] = useState<FarmerSummary | null>(null);
  const [investorStats, setInvestorStats] = useState<InvestorStats | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [newsEvents, setNewsEvents] = useState<NewsItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeInvestorTab, setActiveInvestorTab] = useState<InvestorTab>('home');
  const [activeFarmerTab, setActiveFarmerTab] = useState<'home' | 'coconut-sold' | 'payment-history'>('home');
  const eventsFlatListRef = useRef<FlatList>(null);
  const newsFlatListRef = useRef<FlatList>(null);
  const [eventsCurrentIndex, setEventsCurrentIndex] = useState(0);
  const [newsCurrentIndex, setNewsCurrentIndex] = useState(0);
  const [userName, setUserName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [raiseRequestModalVisible, setRaiseRequestModalVisible] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestPriority, setRequestPriority] = useState('medium');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const farmersTabLabel = language === 'ta' ? 'விவசாயிகள்' : 'Farmers';
  const farmersHeaderTitle = language === 'ta' ? 'இணைந்த விவசாயிகள்' : 'Connected Farmers';
  const farmersHeaderSubtitle =
    language === 'ta'
      ? 'உங்கள் விவசாயிகளுடன் ஒத்துழைக்க, அழைக்க, வரைபடத்தில் காண.'
      : 'Coordinate with your farmers, call them, or plan farm visits.';

  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log('📱 Loading user data from AsyncStorage...');
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedUserRole = await AsyncStorage.getItem('userRole');
        const storedToken = await AsyncStorage.getItem('authToken');
        
        console.log('💾 Stored userId:', storedUserId);
        console.log('💾 Stored userRole:', storedUserRole);
        console.log('💾 Stored authToken:', storedToken ? storedToken.substring(0, 20) + '...' : 'null');
        
        // Redirect to login if no token (user not authenticated)
        if (!storedToken) {
          console.log('❌ No auth token found, redirecting to login');
          router.replace('/');
          return;
        }
        
        if (storedUserId) setUserId(storedUserId);
        if (storedUserRole) setUserRole(storedUserRole);
        if (storedToken) setAuthToken(storedToken);
        
        // Load user name
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            setUserName(userData.fullname || userData.name || '');
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
        
        // Fetch farmer summary if user is a farmer and we have token
        if (storedUserRole === 'farmer' && storedUserId && storedToken) {
          console.log('✅ All conditions met, calling fetchFarmerSummary');
          await fetchFarmerSummary(storedUserId, storedToken);
        } else if (storedUserRole === 'investor' && storedUserId && storedToken) {
          console.log('✅ All conditions met, calling fetchInvestorStats');
          await fetchInvestorStats(storedUserId, storedToken);
        } else {
          console.log('❌ Conditions not met for API call:');
          console.log('  - Is farmer?', storedUserRole === 'farmer');
          console.log('  - Is investor?', storedUserRole === 'investor');
          console.log('  - Has userId?', !!storedUserId);
          console.log('  - Has token?', !!storedToken);
        }
        
        // Fetch events data if we have token
        if (storedToken) {
          await fetchEventsData(storedToken);
        }
      } catch (error) {
        console.error('❌ Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  // Auto-scroll for events
  useEffect(() => {
    if (upcomingEvents.length <= 1) return;
    
    const interval = setInterval(() => {
      setEventsCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % upcomingEvents.length;
        setTimeout(() => {
          try {
            eventsFlatListRef.current?.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          } catch {
            // Fallback to scrollToOffset if scrollToIndex fails
            eventsFlatListRef.current?.scrollToOffset({
              offset: nextIndex * (CARD_WIDTH + CARD_SPACING),
              animated: true,
            });
          }
        }, 100);
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [upcomingEvents.length]);

  // Auto-scroll for news
  useEffect(() => {
    if (newsEvents.length <= 1) return;
    
    const interval = setInterval(() => {
      setNewsCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % newsEvents.length;
        setTimeout(() => {
          try {
            newsFlatListRef.current?.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          } catch {
            // Fallback to scrollToOffset if scrollToIndex fails
            newsFlatListRef.current?.scrollToOffset({
              offset: nextIndex * (CARD_WIDTH + CARD_SPACING),
              animated: true,
            });
          }
        }, 100);
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [newsEvents.length]);

  const fetchFarmerSummary = async (farmerId: string, token: string) => {
    try {
      console.log('🌐 Fetching farmer summary...');
      console.log('📍 API URL:', `https://tlzwdzgp-9000.inc1.devtunnels.ms/api/users/farmer-summary/${farmerId}`);
      console.log('📤 Request method: GET');
      console.log('🔑 Authorization: Bearer', token.substring(0, 20) + '...');
      console.log('👤 Farmer ID:', farmerId);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/farmer-summary/${farmerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('📡 Dashboard API response status:', response.status);
      console.log('📡 Dashboard API response statusText:', response.statusText);
      console.log('📡 Dashboard API response ok:', response.ok);
      
      // Check if response has content before parsing
      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        console.warn('⚠️ Farmer Summary API - Empty response');
        return;
      }

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('📋 Dashboard API response data:', result);
      } catch (parseError) {
        console.error('❌ Failed to parse farmer summary response as JSON:', parseError);
        console.log('📄 Response was not valid JSON, raw text:', responseText);
        return;
      }
      
      if (response.ok && result.status === 'success') {
        console.log('✅ Farmer summary fetched successfully');
        console.log('📊 Summary data:', result.data);
        setFarmerSummary(result.data);
      } else {
        console.log('❌ Dashboard API failed:', result.message || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Error fetching farmer summary:', error);
    }
  };

  const fetchInvestorStats = async (investorId: string, token: string) => {
    try {
      console.log('🌐 Fetching investor stats...');
      console.log('📍 API URL:', `https://tlzwdzgp-9000.inc1.devtunnels.ms/api/investor-dashboard/stats/${investorId}`);
      console.log('📤 Request method: GET');
      console.log('🔑 Authorization: Bearer', token.substring(0, 20) + '...');
      console.log('👤 Investor ID:', investorId);
      
      const response = await fetch(`https://tlzwdzgp-9000.inc1.devtunnels.ms/api/investor-dashboard/stats/${investorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('📡 Investor Dashboard API response status:', response.status);
      console.log('📡 Investor Dashboard API response statusText:', response.statusText);
      console.log('📡 Investor Dashboard API response ok:', response.ok);
      
      // Check if response has content before parsing
      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        console.warn('⚠️ Investor Dashboard API - Empty response');
        return;
      }

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('📋 Investor Dashboard API response data:', result);
      } catch (parseError) {
        console.error('❌ Failed to parse investor stats response as JSON:', parseError);
        console.log('📄 Response was not valid JSON, raw text:', responseText);
        return;
      }
      
      if (response.ok && result.status === 'success') {
        console.log('✅ Investor stats fetched successfully');
        console.log('📊 Stats data:', result.data);
        setInvestorStats(result.data);
      } else {
        console.log('❌ Investor Dashboard API failed:', result.message || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Error fetching investor stats:', error);
    }
  };

  const fetchEventsData = async (token: string) => {
    try {
      console.log('📅 Fetching events data...');
      const [upcomingEventsData, newsEventsData] = await Promise.all([
        apiService.getUpcomingEvents(token),
        apiService.getNewsEvents(token)
      ]);
      
      console.log('✅ Upcoming events fetched:', upcomingEventsData.length);
      console.log('✅ News events fetched:', newsEventsData.length);
      
      setUpcomingEvents(upcomingEventsData);
      setNewsEvents(newsEventsData);
    } catch (error) {
      console.error('❌ Error fetching events data:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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

  const handleRaiseRequest = async () => {
    if (!requestTitle.trim() || !requestDescription.trim() || !authToken) {
      Alert.alert(
        language === 'ta' ? 'பிழை' : 'Error',
        language === 'ta' ? 'தயவுசெய்து அனைத்து புலங்களையும் நிரப்பவும்' : 'Please fill in all fields'
      );
      return;
    }

    setSubmittingRequest(true);
    try {
      const result = await apiService.raiseRequest(
        requestTitle.trim(),
        requestDescription.trim(),
        requestPriority,
        authToken
      );

      if (result.success) {
        Alert.alert(
          language === 'ta' ? 'வெற்றி' : 'Success',
          result.message || (language === 'ta' ? 'கோரிக்கை வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது' : 'Request submitted successfully'),
          [
            {
              text: language === 'ta' ? 'சரி' : 'OK',
              onPress: () => {
                setRaiseRequestModalVisible(false);
                setRequestTitle('');
                setRequestDescription('');
                setRequestPriority('medium');
              }
            }
          ]
        );
      } else {
        Alert.alert(
          language === 'ta' ? 'பிழை' : 'Error',
          result.message || (language === 'ta' ? 'கோரிக்கையை சமர்ப்பிக்க முடியவில்லை' : 'Failed to submit request')
        );
      }
    } catch (error) {
      console.error('Error raising request:', error);
      Alert.alert(
        language === 'ta' ? 'பிழை' : 'Error',
        language === 'ta' ? 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.' : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmittingRequest(false);
    }
  };

  const openEventDetail = (event: EventItem) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const closeEventDetail = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  const handleRegister = () => {
    if (selectedEvent?.registration_url) {
      Linking.openURL(selectedEvent.registration_url);
    }
  };

  const widgets: WidgetMap = {
    farmer: [
      { 
        id: 'coconuts', 
        title: t('coconuts_procured'), 
        value: farmerSummary?.total_coconut_count || '0', 
        icon: 'leaf.fill', 
        color: '#48bb78' 
      },
      { 
        id: 'pending', 
        title: t('pending_payment'), 
        value: farmerSummary?.pending_amount ? `₹${farmerSummary.pending_amount}` : '₹0', 
        icon: 'creditcard.fill', 
        color: '#38a169' 
      },
    ],
    investor: [
      {
        id: 'coconuts_stock', 
        title: language === 'ta' ? 'தேங்காய் இருப்பு' : 'Coconuts in Stock', 
        value: (
          Number(investorStats?.coconut_good_stock ?? 0) +
          Number(investorStats?.coconut_damaged_stock ?? 0)
        ).toString(), 
        icon: 'leaf.fill', 
        color: '#667eea',
        subtitle: `Good: ${investorStats?.coconut_good_stock || '0'} | Damaged: ${investorStats?.coconut_damaged_stock || 0}`
      },
      { 
        id: 'pending_payment', 
        title: language === 'ta' ? 'நிலுவை தொகை' : 'Payment Pending', 
        value: investorStats?.pending_payment_amount ? `₹${investorStats.pending_payment_amount}` : '₹0', 
        icon: 'creditcard.fill', 
        color: '#5a67d8',
        subtitle: `${investorStats?.pending_payment_count || 0} payments pending`
      },
    ],
    serviceProvider: [
      { id: 'services', title: t('services_completed'), value: '45', icon: 'wrench.and.screwdriver.fill', color: '#f093fb' },
      { id: 'earnings', title: t('total_earnings'), value: '₹65,000', icon: 'indianrupeesign.circle.fill', color: '#e879f9' },
    ]
  };

  const currentWidgets = widgets[userRole as keyof typeof widgets] || widgets.serviceProvider;
  const isInvestor = userRole === 'investor';

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getWeekDays = () => {
    return language === 'ta' 
      ? ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  };

  const getMonthName = (date: Date) => {
    const months = language === 'ta'
      ? ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()];
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const renderCalendar = () => {
    const weekDays = getWeekDays();
    const days = getDaysInMonth(currentMonth);
    const visibleDays = days.slice(0, 7); // Show first week
    
    return (
      <>
        <View style={styles.calendarHeader}>
          <ThemedText style={[styles.calendarMonth, { color: colorScheme === 'dark' ? '#f7fafc' : '#1a202c' }]}>
            {getMonthName(currentMonth)} {currentMonth.getFullYear()}
          </ThemedText>
        </View>
        <View style={styles.calendarDaysRow}>
          {visibleDays.map((day, index) => {
            if (!day) {
              return <View key={`empty-${index}`} style={styles.calendarDay} />;
            }
            const dayName = weekDays[day.getDay()];
            const dayNumber = day.getDate();
            const isSelected = isSameDay(day, selectedDate);
            
            return (
              <TouchableOpacity
                key={day.getTime()}
                style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
                onPress={() => setSelectedDate(day)}
              >
                <ThemedText style={[styles.calendarDayName, isSelected && styles.calendarDayNameSelected, !isSelected && { color: colorScheme === 'dark' ? '#a0aec0' : '#718096' }]}>
                  {dayName}
                </ThemedText>
                <ThemedText style={[styles.calendarDayNumber, isSelected && styles.calendarDayNumberSelected, !isSelected && { color: colorScheme === 'dark' ? '#f7fafc' : '#2d3748' }]}>
                  {dayNumber}
                </ThemedText>
                {isSelected && <View style={styles.calendarDayDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </>
    );
  };

  const renderHomeContent = () => {
    // Compact farmer-focused layout (top bar, profile progress, price card, info box, poll)
    return (
      <View style={styles.sectionWrapper}>
        {/* Top green app bar */}
        <View style={styles.topAppBar}>
          <TouchableOpacity style={styles.hamburger} activeOpacity={0.7} onPress={() => { /* open menu */ }}>
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

        {/* Yellow info strip */}
        <View style={styles.infoStrip}>
          <ThemedText style={styles.infoStripText}>{language === 'ta' ? 'உங்கள் சுயவிவரம் 85% முழுமையாக்க' : 'Your profile is 85% complete'}</ThemedText>
          <View style={styles.progressWrap}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: '85%' }]} />
            </View>
            <TouchableOpacity style={styles.infoStripAction} activeOpacity={0.8} onPress={() => { /* complete action */ }}>
              <ThemedText style={styles.infoStripActionText}>{language === 'ta' ? 'முழுமையாக்க' : 'Complete'}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ alignItems: 'center', paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

          {/* Price card (daily coconut price) */}
          {userRole === 'farmer' && (
            <View style={styles.priceCardWrap}>
              <View style={styles.priceCard}>
                <View style={styles.priceCardHeader}>
                  <View style={styles.priceCardHeaderLeft}>
                    <View style={styles.priceBadge}>
                      <IconSymbol name="leaf.fill" size={14} color="#ffffff" />
                    </View>
                    <ThemedText style={styles.priceCardTitle}>{language === 'ta' ? 'தேங்காய் விலை' : 'Coconut Price'}</ThemedText>
                  </View>
                  <TouchableOpacity style={styles.priceCardMenu} onPress={() => { /* placeholder */ }}>
                    <IconSymbol name="chevron.down" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.priceTilesRow}>
                  <View style={styles.priceTile}>
                    <ThemedText style={styles.priceTileTitle}>{language === 'ta' ? 'பச்சை தேங்காய்' : 'Green Coconut'}</ThemedText>
                    <ThemedText style={styles.priceTileValue}>₹15.5</ThemedText>
                  </View>
                  <View style={styles.priceTile}>
                    <ThemedText style={styles.priceTileTitle}>{language === 'ta' ? 'சுத்தம் செய்யப்பட்ட' : 'Processed'}</ThemedText>
                    <ThemedText style={styles.priceTileValue}>₹18</ThemedText>
                  </View>
                  <View style={styles.priceTile}>
                    <ThemedText style={styles.priceTileTitle}>{language === 'ta' ? 'தெய்வின் விலை' : 'Bulk (Per Ton)'}</ThemedText>
                    <ThemedText style={styles.priceTileValue}>₹185</ThemedText>
                  </View>
                </View>

                <View style={styles.priceCardFooter}>
                  <ThemedText style={styles.priceCardDate}>30 டிசம்பர் 2025</ThemedText>
                  <TouchableOpacity style={styles.priceHistoryButton} onPress={() => router.push('/price-history' as any) }>
                    <ThemedText style={styles.priceHistoryText}>{language === 'ta' ? 'விலை வரலாறு' : 'Price history'}</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Blue info box */}
          <View style={styles.infoBox}>
            <View style={styles.infoBoxLeft}>
              <IconSymbol name="info.circle" size={20} color="#2b6cb0" />
            </View>
            <ThemedText style={styles.infoBoxText}>{language === 'ta' ? 'இந்த பருவத்துக்கு உற்பத்தி தயாரா? விவரங்களை கற்றுக் கொள்ளுங்கள்.' : 'Is your farm prepared this season? Learn how to get started.'}</ThemedText>
            <TouchableOpacity style={styles.infoBoxClose} activeOpacity={0.8} onPress={() => { /* dismiss */ }}>
              <ThemedText style={{ color: '#2b6cb0' }}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Poll card */}
          <View style={styles.pollCardWrap}>
            <View style={styles.pollCard}>
              <ThemedText style={styles.pollTitle}>{language === 'ta' ? 'கருத்துக்கணிப்பு' : 'Poll'}</ThemedText>
              <ThemedText style={styles.pollQuestion}>{language === 'ta' ? 'இந்த பவர்தத்தில் உங்கள் தேங்காய் விலை நிலைமையே எப்படி உள்ளது?' : "How's your coconut price situation this month?"}</ThemedText>

              {[' மிகவும் நன்றாக உள்ளது', 'நன்றாக உள்ளது', 'சராசிரியாக உள்ளது', 'மோசமாக உள்ளது'].map((opt, i) => (
                <TouchableOpacity key={i} style={styles.pollOption} activeOpacity={0.8}>
                  <View style={styles.radio} />
                  <ThemedText style={styles.pollOptionText}>{language === 'ta' ? opt : opt}</ThemedText>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.pollSubmitDisabled} disabled>
                <ThemedText style={styles.pollSubmitTextDisabled}>{language === 'ta' ? 'பதில் அனுப்பு' : 'Submit'}</ThemedText>
              </TouchableOpacity>

            </View>
          </View>

        </ScrollView>
      </View>
    );
  }


  const renderFarmersContent = () => (
    <View style={styles.sectionWrapper}>
      <View style={styles.tabBody}>
        <InvestorFarmersList layout="card" showSearch={true} />
      </View>
    </View>
  );

  const renderReportsContent = () => (
    <View style={styles.sectionWrapper}>
      <LinearGradient colors={['#5a67d8', '#805ad5']} style={styles.header}>
        <View style={styles.headerContent}>
          <IconSymbol size={60} name="chart.pie.fill" color="#ffffff" style={styles.headerIcon} />
          <ThemedText style={styles.title}>{t('reports')}</ThemedText>
          <ThemedText style={styles.subtitle}>Track payouts and procurement activity.</ThemedText>
        </View>
      </LinearGradient>
      <View style={styles.tabBody}>
        <TouchableOpacity style={styles.tabCard} onPress={() => router.push('/pending-payments')}>
          <IconSymbol name="indianrupeesign.circle.fill" size={32} color="#48bb78" />
          <ThemedText style={styles.tabCardTitle}>Pending Payments</ThemedText>
          <ThemedText style={styles.tabCardSubtitle}>View outstanding farmer payments</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabCard} onPress={() => router.push('/farmer-details?type=coconuts')}>
          <IconSymbol name="leaf.fill" size={32} color="#ed8936" />
          <ThemedText style={styles.tabCardTitle}>Coconut Collections</ThemedText>
          <ThemedText style={styles.tabCardSubtitle}>Monitor latest coconut entries</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActiveContent = () => {
    if (!isInvestor) {
      return renderHomeContent();
    }
    switch (activeInvestorTab) {
      case 'farmers':
        return renderFarmersContent();
      default:
        return renderHomeContent();
    }
  };

  const renderBottomNav = () => {
    const coconutSoldLabel = language === 'ta' ? 'தேங்காய் விற்பனை' : 'Coconut Sold';
    const paymentHistoryLabel = language === 'ta' ? 'கட்டண வரலாறு' : 'Payment History';
    
    const tabs = isInvestor
      ? ([
          { id: 'home', label: t('home'), icon: 'house.fill' as IconName },
          { id: 'farmers', label: farmersTabLabel, icon: 'person.3.fill' as IconName },
          { id: 'settings', label: t('settings'), icon: 'gearshape.fill' as IconName },
        ] as const)
      : (userRole === 'farmer'
        ? ([
            { id: 'home', label: t('home'), icon: 'house' as IconName },
            { id: 'price', label: language === 'ta' ? 'விலை' : 'Prices', icon: 'arrow.up' as IconName },
            { id: 'settings', label: t('settings'), icon: 'person' as IconName },
          ] as const)
        : ([
            { id: 'home', label: t('home'), icon: 'house' as IconName },
            { id: 'coconut-sold', label: coconutSoldLabel, icon: 'cube' as IconName },
            { id: 'payment-history', label: paymentHistoryLabel, icon: 'creditcard' as IconName },
            { id: 'settings', label: t('settings'), icon: 'gearshape' as IconName },
          ] as const)
      );

    return (
      <View style={[styles.bottomNav, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
        {tabs.map((tab, index) => {
          const isActive = isInvestor
            ? tab.id !== 'settings' && activeInvestorTab === tab.id
            : tab.id !== 'settings' && activeFarmerTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.navItem,
                { 
                  minWidth: NAV_ITEM_MIN_WIDTH,
                  maxWidth: SCREEN_WIDTH / tabs.length,
                  paddingHorizontal: tabs.length === 4 ? 4 : 8,
                }
              ]}
              onPress={() => {
                if (tab.id === 'settings') {
                  router.push('/settings');
                  return;
                }
                if (isInvestor) {
                  setActiveInvestorTab(tab.id as InvestorTab);
                } else {
                  if (tab.id === 'coconut-sold') {
                    setActiveFarmerTab('coconut-sold');
                    router.push('/coconut-sold');
                  } else if (tab.id === 'payment-history') {
                    setActiveFarmerTab('payment-history');
                    router.push('/payment-history');
                  } else if (tab.id === 'price') {
                    setActiveFarmerTab('home');
                    router.push('/price-history' as any);
                  } else {
                    setActiveFarmerTab('home');
                  }
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.navIconContainer}>
                <IconSymbol
                  name={tab.icon}
                  size={24}
                  color={isActive ? '#48bb78' : (colorScheme === 'dark' ? '#cbd5e0' : '#718096')}
                />
              </View>
              <ThemedText 
                style={[
                  styles.navLabel, 
                  { 
                    color: isActive ? '#48bb78' : (colorScheme === 'dark' ? '#cbd5e0' : '#718096'),
                    fontSize: tabs.length === 4 ? 11 : 12,
                  }
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: t('dashboard'), headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.flexContent}>{renderActiveContent()}</View>
        {renderBottomNav()}
      </View>

      {/* Event Details Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={closeEventDetail}
      >
        <TouchableOpacity
          style={styles.slideOverlay}
          activeOpacity={1}
          onPress={closeEventDetail}
        >
          <View style={styles.slideContainer}>
            <TouchableOpacity
              style={[styles.slideContent, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.slideHandle} />
              <View style={styles.slideHeader}>
                <ThemedText style={styles.slideTitle}>Event Details</ThemedText>
                <TouchableOpacity onPress={closeEventDetail} style={styles.slideCloseButton}>
                  <IconSymbol name="xmark.circle.fill" size={28} color="#718096" />
                </TouchableOpacity>
              </View>
              {selectedEvent && (
                <ScrollView style={styles.slideBody} showsVerticalScrollIndicator={false}>
                  {selectedEvent.image_url && (
                    <Image source={{ uri: selectedEvent.image_url }} style={styles.slideImage} />
                  )}
                  <ThemedText style={styles.slideEventTitle}>{selectedEvent.event_name}</ThemedText>
                  <View style={styles.slideInfoRow}>
                    <IconSymbol name="calendar" size={16} color={currentWidgets[0].color} />
                    <View style={styles.slideInfoContent}>
                      <ThemedText style={styles.slideInfoLabel}>Date:</ThemedText>
                      <ThemedText style={styles.slideInfoText}>
                        {formatDate(selectedEvent.start_date)} - {formatDate(selectedEvent.end_date)}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.slideInfoRow}>
                    <IconSymbol name="location" size={16} color={currentWidgets[0].color} />
                    <View style={styles.slideInfoContent}>
                      <ThemedText style={styles.slideInfoLabel}>Location:</ThemedText>
                      <ThemedText style={styles.slideInfoText}>{selectedEvent.location}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.slideInfoRow}>
                    <IconSymbol name="person.2" size={16} color={currentWidgets[0].color} />
                    <View style={styles.slideInfoContent}>
                      <ThemedText style={styles.slideInfoLabel}>Organized by:</ThemedText>
                      <ThemedText style={styles.slideInfoText}>{selectedEvent.organizer}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.slideSection}>
                    <ThemedText style={styles.slideSectionTitle}>Description</ThemedText>
                    <ThemedText style={styles.slideDescription}>{selectedEvent.description}</ThemedText>
                  </View>
                </ScrollView>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Raise Request Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={raiseRequestModalVisible}
        onRequestClose={() => setRaiseRequestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.raiseRequestModal, { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1a202c' }]}>
                {language === 'ta' ? 'கோரிக்கையை உயர்த்தவும்' : 'Raise Request'}
              </ThemedText>
              <TouchableOpacity onPress={() => setRaiseRequestModalVisible(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.formLabel, { color: colorScheme === 'dark' ? '#f7fafc' : '#2d3748' }]}>
                  {language === 'ta' ? 'தலைப்பு' : 'Title'} *
                </ThemedText>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f7fafc',
                    color: colorScheme === 'dark' ? '#ffffff' : '#1a202c',
                    borderColor: colorScheme === 'dark' ? '#4a5568' : '#e2e8f0'
                  }]}
                  placeholder={language === 'ta' ? 'கோரிக்கையின் தலைப்பை உள்ளிடவும்' : 'Enter request title'}
                  placeholderTextColor={colorScheme === 'dark' ? '#718096' : '#a0aec0'}
                  value={requestTitle}
                  onChangeText={setRequestTitle}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.formLabel, { color: colorScheme === 'dark' ? '#f7fafc' : '#2d3748' }]}>
                  {language === 'ta' ? 'விளக்கம்' : 'Description'} *
                </ThemedText>
                <TextInput
                  style={[styles.formTextArea, { 
                    backgroundColor: colorScheme === 'dark' ? '#2d3748' : '#f7fafc',
                    color: colorScheme === 'dark' ? '#ffffff' : '#1a202c',
                    borderColor: colorScheme === 'dark' ? '#4a5568' : '#e2e8f0'
                  }]}
                  placeholder={language === 'ta' ? 'கோரிக்கையின் விவரங்களை உள்ளிடவும்' : 'Enter request description'}
                  placeholderTextColor={colorScheme === 'dark' ? '#718096' : '#a0aec0'}
                  value={requestDescription}
                  onChangeText={setRequestDescription}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.formLabel, { color: colorScheme === 'dark' ? '#f7fafc' : '#2d3748' }]}>
                  {language === 'ta' ? 'முன்னுரிமை' : 'Priority'} *
                </ThemedText>
                <View style={styles.priorityContainer}>
                  {['low', 'medium', 'high'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityButton,
                        requestPriority === priority && styles.priorityButtonActive,
                        { 
                          backgroundColor: requestPriority === priority 
                            ? '#667eea' 
                            : (colorScheme === 'dark' ? '#2d3748' : '#f7fafc'),
                          borderColor: colorScheme === 'dark' ? '#4a5568' : '#e2e8f0'
                        }
                      ]}
                      onPress={() => setRequestPriority(priority)}
                    >
                      <ThemedText style={[
                        styles.priorityButtonText,
                        { color: requestPriority === priority ? '#ffffff' : (colorScheme === 'dark' ? '#f7fafc' : '#2d3748') }
                      ]}>
                        {language === 'ta' 
                          ? (priority === 'low' ? 'குறைந்த' : priority === 'medium' ? 'நடுத்தர' : 'உயர்')
                          : priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleRaiseRequest}
                disabled={submittingRequest || !requestTitle.trim() || !requestDescription.trim()}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitButtonGradient}
                >
                  {submittingRequest ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <ThemedText style={styles.submitButtonText}>
                      {language === 'ta' ? 'கோரிக்கையை சமர்ப்பிக்கவும்' : 'Submit Request'}
                    </ThemedText>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  flexContent: {
    flex: 1,
  },
  sectionWrapper: {
    flex: 1,
  },
  header: {
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerIcon: {
    color: '#ffffff',
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
    padding: 8,
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
    paddingBottom: 120,
  },
  topAppBar: {
    height: 56,
    backgroundColor: '#0f6b36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  hamburger: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topAppBarLogo: { height: 40, width: 120, maxWidth: 200 },
  infoStrip: {
    backgroundColor: '#fff6e0',
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#fff0c7',
  },
  infoStripText: {
    color: '#8a6b00',
    fontSize: 14,
  },
  progressWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#fff0c2',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#f6b42d',
  },
  infoStripAction: {
    backgroundColor: '#ffe6b3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoStripActionText: {
    color: '#8a6b00',
    fontWeight: '700',
  },
  infoBox: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#eaf6ff',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoBoxLeft: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBoxText: {
    flex: 1,
    color: '#1e3a8a',
  },
  infoBoxClose: {
    marginLeft: 8,
    padding: 6,
  },
  widgetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 0,
    width: '100%',
  },
  widget: {
    width: '48%', // Use percentage for better responsiveness
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    minHeight: 140,
  },
  widgetGradient: {
    padding: 20,
    borderRadius: 20,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  widgetIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
    flex: 1,
  },
  widgetTitleGradient: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    opacity: 0.95,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  widgetValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  widgetValueGradient: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  widgetSubtitleGradient: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  viewDetailsTextGradient: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    fontWeight: '500',
  },
  widgetSubtitle: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    fontWeight: '500',
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
  },
  modernHeader: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
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
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  raiseRequestIconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  raiseRequestIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  notificationIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#ffffff',
    paddingHorizontal: 4,
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  calendarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  calendarHeader: {
    marginBottom: 16,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  calendarDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarDay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    minWidth: 50,
  },
  calendarDaySelected: {
    backgroundColor: '#667eea',
  },
  calendarDayName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  calendarDayNameSelected: {
    color: '#ffffff',
  },
  calendarDayNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  calendarDayNumberSelected: {
    color: '#ffffff',
  },
  calendarDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    marginTop: 2,
  },
  sectionTitleContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  statisticsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  bottomNav: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: Math.max(10, SCREEN_HEIGHT * 0.015),
    paddingHorizontal: Math.max(8, SCREEN_WIDTH * 0.02),
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    flex: 1,
  },
  navIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  attractiveSection: {
    marginBottom: 24,
  },
  sectionHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  attractiveTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  eventsScrollContainer: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  attractiveEventCard: {
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    overflow: 'hidden',
  },
  eventCardGradient: {
    borderRadius: 20,
    padding: 20,
    minHeight: 160,
  },
  eventCardContent: {
    flex: 1,
  },
  attractiveEventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  attractiveEventDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
    marginBottom: 12,
  },
  attractiveEventInfo: {
    gap: 6,
  },
  eventInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attractiveInfoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  attractiveDateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  newsScrollContainer: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  attractiveNewsCard: {
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    overflow: 'hidden',
  },
  newsCardGradient: {
    borderRadius: 16,
    padding: 18,
    minHeight: 140,
  },
  newsCardContent: {
    flex: 1,
  },
  attractiveNewsHeader: {
    marginBottom: 8,
  },
  newsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  attractiveNewsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  attractiveNewsDesc: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
    marginBottom: 8,
  },
  attractiveNewsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attractiveNewsDate: {
    fontSize: 12,
    color: '#a0aec0',
    fontWeight: '500',
  },
  modernCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  modernCardGradient: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 0,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardTitleGradient: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  newBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardContent: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  eventBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#48bb78',
    marginTop: 6,
  },
  eventBulletGradient: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  eventItemContent: {
    flex: 1,
  },
  eventItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  eventItemTitleGradient: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
    color: '#ffffff',
  },
  eventItemDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  eventItemDateGradient: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
    opacity: 0.9,
  },
  newsItem: {
    marginBottom: 4,
  },
  newsItemContent: {
    flex: 1,
  },
  newsItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  newsItemTitleGradient: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
    color: '#ffffff',
  },
  newsItemSource: {
    fontSize: 13,
    fontWeight: '500',
  },
  newsItemSourceGradient: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
    opacity: 0.85,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  tabBody: {
    flex: 1,
    padding: 20,
  },
  tabCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  tabCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  tabCardSubtitle: {
    fontSize: 13,
    color: '#718096',
  },

  /* Price card styles */
  priceCardWrap: {
    alignItems: 'center',
    marginVertical: 12,
  },
  priceCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#0bb24c',
    borderRadius: 12,
    padding: 16,
    elevation: 6,
  },
  priceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceBadge: {
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  priceCardTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  priceCardMenu: {
    padding: 6
  },
  priceTilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceTile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 6,
    alignItems: 'center',
    minHeight: 72,
  },
  priceTileTitle: {
    color: '#0b6b38',
    fontSize: 12,
  },
  priceTileValue: {
    color: '#0b6b38',
    fontWeight: '700',
    marginTop: 6,
  },
  priceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceCardDate: {
    color: '#e6f9ee',
  },
  priceHistoryButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  priceHistoryText: {
    color: '#0a8a3a',
    fontWeight: '700',
  },

  /* Poll card */
  pollCardWrap: {
    alignItems: 'center',
    marginTop: 18,
  },
  pollCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    elevation: 4,
  },
  pollTitle: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 14,
    color: '#6b46c1',
    marginBottom: 6,
  },
  pollQuestion: {
    textAlign: 'left',
    color: '#374151',
    marginBottom: 12,
  },
  pollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6eef8',
    paddingHorizontal: 14,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 12,
  },
  pollOptionText: {
    color: '#374151',
  },
  pollSubmitDisabled: {
    marginTop: 12,
    backgroundColor: '#d1d5db',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  pollSubmitTextDisabled: {
    color: '#fff',
    fontWeight: '700',
  },
  attractiveNewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  attractiveNewText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginTop: 8,
  },
  quickActionSubtext: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  slideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  slideContent: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 8,
  },
  slideHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  slideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
  },
  slideCloseButton: {
    padding: 4,
  },
  slideBody: {
    padding: 20,
    paddingBottom: 40,
  },
  slideImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  slideEventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 16,
  },
  slideInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  slideInfoContent: {
    flex: 1,
  },
  slideInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 2,
  },
  slideInfoText: {
    fontSize: 14,
    color: '#4a5568',
  },
  slideSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  slideSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  slideDescription: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  raiseRequestModal: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  formTextArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityButtonActive: {
    borderWidth: 2,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
