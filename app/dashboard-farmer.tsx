import FarmerBottomNav from '@/components/farmer-bottom-nav';
import { useSideMenu } from '@/components/SideMenu';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Small helper to render a remote image with a local fallback when it fails to load
function RemoteImage({ uri, style, resizeMode }: { uri?: string; style?: any; resizeMode?: any }) {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    // Reset failed state when URI changes
    setFailed(false);
  }, [uri]);

  const cleanUri = uri?.trim();
  const src = !cleanUri || failed ? require('../assets/images/coconut-trees.png') : { uri: cleanUri };

  return (
    <Image
      source={src}
      style={style}
      resizeMode={resizeMode}
      onError={(error) => {
        console.log('RemoteImage load error:', cleanUri, error.nativeEvent.error);
        setFailed(true);
      }}
      onLoad={() => {
        console.log('RemoteImage loaded successfully:', cleanUri);
        setFailed(false);
      }}
    />
  );
}

export default function FarmerDashboard() {
  const { t, language } = useLanguage();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
  const [unit, setUnit] = useState<'piece' | 'kg'>('piece');
  const [showUnitMenu, setShowUnitMenu] = useState(false);

  const [homeData, setHomeData] = useState<any | null>(null);
  const [loadingHome, setLoadingHome] = useState(false);
  const [pollSelected, setPollSelected] = useState<number | null>(null);
  const [pollSubmitting, setPollSubmitting] = useState(false);
  const [pollSubmitted, setPollSubmitted] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [showInfoBox, setShowInfoBox] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState<number | null>(null);

  // Loan application modal state
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [loanType, setLoanType] = useState<string>('டிராக்டர்');
  const [preferredBrand, setPreferredBrand] = useState<string>('');
  const [minBudget, setMinBudget] = useState<string>('50000');
  const [maxBudget, setMaxBudget] = useState<string>('200000');
  const [expectedPeriod, setExpectedPeriod] = useState<string>('1 மாதத்திற்குள்');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [loanSubmitting, setLoanSubmitting] = useState(false);

  // Ad details modal state
  const [adDetailsModalVisible, setAdDetailsModalVisible] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any>(null);

  // Motivation modal state
  const [motivationModalVisible, setMotivationModalVisible] = useState(false);
  const [quoteLiked, setQuoteLiked] = useState(false);

  const { open: openSideMenu } = useSideMenu();

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingHome(true);
        const token = await AsyncStorage.getItem('authToken');
        if (!token) return;
        const res = await fetch(`${API_CONFIG.BASE_URL}/home`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json();
        if (json?.status === 'success' && json?.data) setHomeData(json.data);
      } catch (e) {
        console.log('Failed to load home:', e);
      } finally {
        setLoadingHome(false);
      }
    };
    load();
  }, []);



  // Reset selection when a new poll is loaded
  useEffect(() => {
    setPollSelected(null);
    setPollSubmitted(false);
    setPollError(null);
  }, [homeData?.polls?.active?.[0]?.id]);

  // Compute profile completion percentage from stored userData
  useEffect(() => {
    const computeCompletion = async () => {
      try {
        const stored = await AsyncStorage.getItem('userData');
        if (!stored) {
          setProfileCompletion(null);
          return;
        }
        const parsed = JSON.parse(stored);
        // server may already return a profile_completion value
        const ud = parsed?.user_details ? parsed.user_details : parsed;
        if (ud && ud.profile_completion) {
          const val = Number(ud.profile_completion);
          if (!Number.isNaN(val)) {
            setProfileCompletion(Math.max(0, Math.min(100, Math.round(val))));
            return;
          }
        }

        // Fields we consider for completion
        const fields = [
          ud?.fullname,
          ud?.passport_photo || ud?.passport_photo,
          ud?.mobile_no,
          ud?.email_id,
          (ud?.address || ud?.village || ud?.taluk),
          ud?.pincode,
          ud?.aadhar_copy || ud?.pan_copy,
          ud?.dob,
        ];
        const total = fields.length;
        const filled = fields.reduce((acc: number, f: any) => acc + (f ? 1 : 0), 0);
        const percent = Math.round((filled / total) * 100);
        setProfileCompletion(percent);
      } catch (e) {
        console.warn('Failed computing profile completion', e);
      }
    };
    computeCompletion();
  }, [homeData]);

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

  const getPriceValue = (keyPiece: string, keyKg: string): string => {
    if (!homeData?.coconut_prices?.today) return '';
    if (unit === 'piece') return String(homeData.coconut_prices.today[keyPiece] ?? '');
    return String(homeData.coconut_prices.today[keyKg] ?? '');
  };

  // Weather notification (from API) — use the first notification if available
  const weatherNotif = homeData?.weather_notifications?.data?.[0] ?? null;
  const infoHead = weatherNotif
    ? (language === 'ta' ? (weatherNotif.head_tamil ?? weatherNotif.head) : (weatherNotif.head ?? ''))
    : (language === 'ta' ? 'இந்த பருவத்திற்கு உரம் இட்டுவிட்டீர்களா?' : 'Have you given fertilizer for this season?');
  const infoDesc = weatherNotif
    ? (language === 'ta' ? (weatherNotif.description_tamil ?? weatherNotif.description) : (weatherNotif.description ?? ''))
    : (language === 'ta' ? 'இந்த வருடம் மழை சீக்கிரமாக வருமென எதிர்பார்க்கப்படுகிறது. உரமிடுவதற்கான சரியான நேரம் இது.' : 'Rain is expected to start early this year. This is the right time to apply fertilizer.');

  // Announcements & ads grouping
  const announcements = homeData?.annoucements?.data ?? [];
  const ads = announcements.filter((a: any) => a.type === 'ad');
  const adsByTarget: Record<string, any[]> = {};
  ads.forEach((ad: any) => {
    const key = ad.target_type || 'All';
    if (!adsByTarget[key]) adsByTarget[key] = [];
    adsByTarget[key].push(ad);
  });

  // Combine events and news into a single list for the News & Events grid
  const newsItems = [
    ...(homeData?.events?.data ?? []),
    ...(homeData?.news?.data ?? []),
  ];

  const submitPoll = async () => {
    if (!pollSelected) return;
    try {
      setPollSubmitting(true);
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      if (!token || !userData) {
        console.log('No auth or user data for poll submit');
        router.replace('/');
        return;
      }
      const user = JSON.parse(userData);
      const pollId = homeData?.polls?.active?.[0]?.id;
      const res = await fetch(`${API_CONFIG.BASE_URL}/polls/${pollId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ polloption_id: pollSelected, user_id: user.id }),
      });
      const json = await res.json();
      if (res.ok && (json.status === 'success' || json.success === true)) {
        setPollSubmitted(true);
        setPollError(null);
      } else {
        console.log('Poll submit failed', json);
        const serverMsg = (json && (json.message || json.error || (typeof json === 'string' ? json : null))) || '';
        const already = /already/i.test(String(serverMsg)) || res.status === 409 || json?.status === 'already_submitted';
        if (already) {
          setPollError('You have already submitted');
        } else if (serverMsg) {
          setPollError(String(serverMsg));
        } else {
          setPollError('Failed to submit poll');
        }
      }
    } catch (e) {
      console.log('Poll submit error', e);
      setPollError('Failed to submit poll');
    } finally {
      setPollSubmitting(false);
    }
  };

  const submitLoanApplication = async () => {
    try {
      setLoanSubmitting(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'அங்கீகாரம் கிடைக்கவில்லை' : 'Authorization not found');
        return;
      }

      // Map purchase period from Tamil to English
      const purchasePeriodMap: Record<string, string> = {
        '1 மாதத்திற்குள்': 'Wholesale',
        '2-3 மாதங்களில்': 'Retail',
        '3-6 மாதங்களில்': 'Retail',
        '6 மாதங்களுக்கு மேல்': 'Retail',
      };

      // Map category
      const categoryMap: Record<string, string> = {
        'டிராக்டர்': 'Tracktor',
      };

      const purchasePeriod = purchasePeriodMap[expectedPeriod] || 'Wholesale';
      const category = categoryMap[loanType] || 'Tracktor';

      const requestBody = {
        category: category,
        brand: preferredBrand.trim() || '',
        minbudget: parseInt(minBudget) || 0,
        maxbudget: parseInt(maxBudget) || 0,
        purchase: purchasePeriod,
        addtionalnotes: additionalNotes.trim() || '',
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/adforms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const json = await response.json().catch(() => null);

      if (response.ok && (json?.status === 'success' || json?.success === true)) {
        Alert.alert(
          language === 'ta' ? 'வெற்றி' : 'Success',
          language === 'ta' ? 'உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது' : 'Your application has been submitted successfully',
          [
            {
              text: language === 'ta' ? 'சரி' : 'OK',
              onPress: () => {
                setLoanModalVisible(false);
                setShowTypeDropdown(false);
                setShowPeriodDropdown(false);
                // Reset form
                setPreferredBrand('');
                setMinBudget('50000');
                setMaxBudget('200000');
                setExpectedPeriod('1 மாதத்திற்குள்');
                setAdditionalNotes('');
              },
            },
          ]
        );
      } else {
        const errorMessage = json?.message || json?.error || (language === 'ta' ? 'விண்ணப்பம் சமர்ப்பிப்பதில் பிழை ஏற்பட்டது' : 'Failed to submit application');
        Alert.alert(language === 'ta' ? 'பிழை' : 'Error', errorMessage);
      }
    } catch (e) {
      console.log('Loan application submit error', e);
      Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'விண்ணப்பம் சமர்ப்பிப்பதில் பிழை ஏற்பட்டது' : 'Failed to submit application');
    } finally {
      setLoanSubmitting(false);
    }
  };

  const handleQuoteInteraction = async (type: 'like' | 'share' | 'view') => {
    try {
      const quoteId = homeData?.motivational_quotes?.active?.[0]?.id;
      if (!quoteId) return;

      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      console.log(`Sending ${type} for quote ${quoteId}`);
      // Use the specific endpoints as requested
      // like: PATCH /motivational-quotes/{id}/like
      // share: PATCH /motivational-quotes/{id}/share
      // view: PATCH /motivational-quotes/{id}/view
      await fetch(`${API_CONFIG.BASE_URL}/motivational-quotes/${quoteId}/${type}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.log(`Error sending ${type} interaction:`, error);
    }
  };

  const handleShareMotivation = async () => {
    const quoteObj = homeData?.motivational_quotes?.active?.[0];
    const quote = quoteObj ? (language === 'ta' ? (quoteObj.quote_text_tamil ?? quoteObj.quote_text) : quoteObj.quote_text) : (language === 'ta' ? 'உங்கள் விவசாயம் தயாரா என்பதை சரிபார்க்க உதவிகள் உள்ளன.' : 'Quick tips to prepare your farm are available.');

    // Check for any link property
    const link = quoteObj?.link || quoteObj?.url || quoteObj?.read_moreurl || '';

    try {
      // Record share action
      handleQuoteInteraction('share');

      let message = `${language === 'ta' ? 'இன்றைய ஊக்க மொழி' : "Today's Motivation"}:\n\n"${quote}"\n\n- NAAM App`;
      if (link) {
        message += `\n${link}`;
      }

      await Share.share({
        message: message,
      });
    } catch (error) {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: t('dashboard'), headerShown: false }} />
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

      {/* Info strip */}
      <View style={styles.infoStripRow}>
        <ThemedText style={styles.infoStripText}>{language === 'ta' ? `உங்கள் சுயவிவரம் ${profileCompletion ?? 0}% முழுமையானது` : `Your profile is ${profileCompletion ?? 0}% complete`}</ThemedText>
        <TouchableOpacity style={styles.infoStripAction} activeOpacity={0.8} onPress={() => router.push('/profile' as any)}>
          <ThemedText style={styles.infoStripActionText}>{language === 'ta' ? 'முழுமையாக்கு' : 'Complete'}</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Price card */}
        <View style={styles.priceCardWrap}>
          <View style={styles.priceCard}>
            <View style={styles.priceCardHeader}>
              <View style={styles.priceCardHeaderLeft}>
                <View style={styles.priceBadge}>
                  <ThemedText>🥥</ThemedText>
                </View>
                <View>
                  <ThemedText style={styles.priceCardTitle}>{language === 'ta' ? 'தேங்காய் விலை' : 'Coconut Rates'}</ThemedText>
                  <ThemedText style={styles.priceCardSubtitle}>{language === 'ta' ? 'இன்றைய விலை' : "Today's Rates"}</ThemedText>
                </View>
              </View>

              <TouchableOpacity style={styles.priceUnitPill} onPress={() => setShowUnitMenu((s) => !s)} activeOpacity={0.8}>
                <ThemedText style={styles.priceUnitText}>{unit === 'piece' ? (language === 'ta' ? 'துண்டு' : 'Piece') : (language === 'ta' ? 'கிலோ' : 'Kg')}</ThemedText>
                <IconSymbol name={showUnitMenu ? 'chevron.up' : 'chevron.down'} size={14} color="#14532d" />
              </TouchableOpacity>

              {showUnitMenu && (
                <>
                  <TouchableOpacity style={styles.unitMenuOverlay} activeOpacity={1} onPress={() => setShowUnitMenu(false)}>
                    <View />
                  </TouchableOpacity>
                  <View style={styles.unitMenu}>
                    <TouchableOpacity style={[styles.unitMenuItem, unit === 'piece' && styles.unitMenuItemActive]} onPress={() => { setUnit('piece'); setShowUnitMenu(false); }}>
                      <ThemedText style={[styles.unitMenuItemText, unit === 'piece' && styles.unitMenuItemTextActive]}>{language === 'ta' ? 'துண்டு' : 'Piece'}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.unitMenuItem, unit === 'kg' && styles.unitMenuItemActive]} onPress={() => { setUnit('kg'); setShowUnitMenu(false); }}>
                      <ThemedText style={[styles.unitMenuItemText, unit === 'kg' && styles.unitMenuItemTextActive]}>{language === 'ta' ? 'கிலோ' : 'Kg'}</ThemedText>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            <View style={styles.priceTilesRow}>
              <View style={styles.priceTile}>
                <ThemedText style={styles.priceTileTitle}>{language === 'ta' ? 'பச்சை தேங்காய்' : 'Green Coconut'}</ThemedText>
                <ThemedText style={styles.priceTileValue}>₹{getPriceValue('green_coconut_per', 'green_coconut_kg') || '--'}</ThemedText>
                <ThemedText style={styles.priceTileUnit}>{unit === 'piece' ? (language === 'ta' ? '/தேங்காய்' : '/nut') : (language === 'ta' ? '/கிலோ' : '/kg')}</ThemedText>
              </View>
              <View style={styles.priceTile}>
                <ThemedText style={styles.priceTileTitle}>{language === 'ta' ? 'கருப்பு தேங்காய்' : 'Black Coconut'}</ThemedText>
                <ThemedText style={styles.priceTileValue}>₹{getPriceValue('black_coconut_per', 'black_coconut_kg') || '--'}</ThemedText>
                <ThemedText style={styles.priceTileUnit}>{unit === 'piece' ? (language === 'ta' ? '/தேங்காய்' : '/nut') : (language === 'ta' ? '/கிலோ' : '/kg')}</ThemedText>
              </View>
              <View style={styles.priceTile}>
                <ThemedText style={styles.priceTileTitle}>{language === 'ta' ? 'உலர் தேங்காய்' : 'Copra Coconut'}</ThemedText>
                <ThemedText style={styles.priceTileValue}>₹{homeData?.coconut_prices?.today?.copra ?? '--'}</ThemedText>
                <ThemedText style={styles.priceTileUnit}>{language === 'ta' ? '/கிலோ' : '/kg'}</ThemedText>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: '#ffffff', marginHorizontal: 12, marginVertical: 8 }} />

            <View style={styles.priceCardFooter}>
              <View style={styles.priceDateWrap}>
                <Ionicons name="calendar" size={16} color="#e6f9ee" />
                <ThemedText style={styles.priceCardDate}> {formatDateIST(homeData?.coconut_prices?.today?.date)}</ThemedText>
              </View>
              <TouchableOpacity style={styles.priceHistoryButton} onPress={() => router.push('/price-history' as any)}>
                <Ionicons name="trending-up" size={16} color="#ffffff" />
                <ThemedText style={[styles.priceHistoryText, { marginLeft: 8 }]}>{language === 'ta' ? 'விலை வரலாறு' : 'Price history'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Blue info box */}
        {showInfoBox && (
          <View style={styles.infoBox}>
            <View style={styles.infoBoxLeftCircle}><Ionicons name="leaf" size={18} color="#2563eb" /></View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.infoBoxTitle}>{infoHead}</ThemedText>
              <ThemedText style={styles.infoBoxText}>{infoDesc}</ThemedText>

              <TouchableOpacity style={styles.infoBoxCloseBtn} onPress={() => setShowInfoBox(false)}>
                <ThemedText style={styles.infoBoxCloseIcon}>✕</ThemedText>
                <ThemedText style={styles.infoBoxCloseText}>{language === 'ta' ? 'முடிக்க' : 'Close'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Poll card */}
        <View style={styles.pollCardWrap}>
          <View style={styles.pollCard}>
            <ThemedText style={styles.pollTitle}>{language === 'ta' ? 'கருத்துக்கணிப்பு' : 'Poll'}</ThemedText>

            {pollSubmitted ? (
              <View style={styles.pollSuccessWrap}>
                <View style={styles.pollSuccessInner}>
                  <View style={styles.pollSuccessCircle}>
                    <Ionicons name="checkmark" size={28} color="#fff" />
                  </View>
                  <ThemedText style={styles.pollSuccessText}>{language === 'ta' ? 'உங்கள் பதில் பதிவுசெய்யப்பட்டது. நன்றி!' : 'Your response has been recorded. Thank you!'}</ThemedText>
                </View>
              </View>
            ) : (
              <>
                {loadingHome ? (
                  <ActivityIndicator size="small" color="#6b46c1" style={{ marginVertical: 12 }} />
                ) : (
                  <ThemedText style={styles.pollQuestion}>{homeData?.polls?.active?.[0] ? (language === 'ta' ? homeData.polls.active[0].question_tamil ?? homeData.polls.active[0].question : homeData.polls.active[0].question) : (language === 'ta' ? 'இந்த பருவத்தில் உங்களின் தேங்காய் விளைச்சல் எப்படி உள்ளது? உங்கள் அனுபவத்த பகிர்ந்து கொள்ளுங்கள்?' : "How's your coconut price situation this month?")}</ThemedText>
                )}
                <ThemedText style={styles.pollInstruction}>{language === 'ta' ? 'உங்கள் அனுபவத்த பகிர்ந்து கொள்ளுங்கள்:' : 'Select an option:'}</ThemedText>
                {homeData?.polls?.active?.length ? (
                  homeData.polls.active[0].options.map((opt: any) => (
                    <TouchableOpacity key={opt.id} style={[styles.pollOption, pollSelected === opt.id && { borderColor: '#10B981', backgroundColor: '#f0fdf4' }]} activeOpacity={0.8} onPress={() => !pollSubmitting && setPollSelected(opt.id)}>
                      <View style={[styles.radio, pollSelected === opt.id && { borderColor: '#10B981', backgroundColor: '#10B981' }]} />
                      <ThemedText style={styles.pollOptionText}>{language === 'ta' ? (opt.option_text_tamil ?? opt.option_text) : opt.option_text}</ThemedText>
                    </TouchableOpacity>
                  ))
                ) : (
                  <ThemedText style={styles.pollQuestion}>{language === 'ta' ? 'தற்போது எந்த கருத்துக் கணிப்பும் இல்லை' : 'There are no active polls at the moment'}</ThemedText>
                )}

                {pollError ? <ThemedText style={styles.pollErrorText}>{pollError}</ThemedText> : null}
                <View style={styles.pollSubmitContainer}>
                  <TouchableOpacity style={pollSelected ? styles.pollSubmitEnabled : styles.pollSubmitDisabled} disabled={!pollSelected || pollSubmitting} onPress={submitPoll}>
                    {pollSubmitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={pollSelected ? styles.pollSubmitTextEnabled : styles.pollSubmitTextDisabled}>{language === 'ta' ? 'பதில் அனுப்பு' : 'Submit Response'}</ThemedText>}
                  </TouchableOpacity>
                </View>
              </>
            )}

          </View>
        </View>

        {/* Announcements & News section */}
        <View style={styles.announcementsWrap}>


          <TouchableOpacity style={styles.announcementBox} activeOpacity={0.85} onPress={() => {
            setMotivationModalVisible(true);
            handleQuoteInteraction('view');
          }}>
            <View style={styles.announcementLeft}><Ionicons name="chatbox-ellipses" size={20} color="#c05621" /></View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.announcementTitle}>{language === 'ta' ? 'இன்றைய ஊக்க மொழி' : "Today's Motivation"}</ThemedText>
              <ThemedText style={styles.motivationalQuote}>{homeData?.motivational_quotes?.active?.[0] ? (language === 'ta' ? (homeData.motivational_quotes.active[0].quote_text_tamil ?? homeData.motivational_quotes.active[0].quote_text) : homeData.motivational_quotes.active[0].quote_text) : (language === 'ta' ? 'உங்கள் விவசாயம் தயாரா என்பதை சரிபார்க்க உதவிகள் உள்ளன.' : 'Quick tips to prepare your farm are available.')}</ThemedText>
            </View>

            <TouchableOpacity style={styles.announcementCTA} onPress={() => {
              setMotivationModalVisible(true);
              handleQuoteInteraction('view');
            }}>
              <Ionicons name="chevron-forward" size={18} color="#c05621" />
            </TouchableOpacity>
          </TouchableOpacity>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}><Ionicons name="megaphone" size={18} color="#2563eb" /></View>
            <ThemedText style={styles.sectionHeaderTitle}>{language === 'ta' ? 'அறிவிப்புகள் & திட்டங்கள்' : 'Announcements & Schemes'}</ThemedText>
          </View>
          {/* Ads grouped by target type (stacked small cards + hero) */}
          {Object.keys(adsByTarget).length > 0 && (
            <View style={styles.adsWrap}>
              {Object.entries(adsByTarget).map(([target, items]) => {
                // Localize certain known target labels
                const targetLabel = (language === 'ta' && String(target).toLowerCase() === 'states') ? 'மாவட்டம்' : (language === 'ta' && String(target).toLowerCase() === 'all users' ? 'அனைத்து பயனர்கள்' : target);

                // hero ad for this target (first item)
                const hero = items[0] as any;

                return (
                  <View key={target} style={styles.adsGroup}>
                    <ThemedText style={styles.adsGroupTitle}>{targetLabel}</ThemedText>



                    {/* hero card for this target */}
                    {hero && (
                      <TouchableOpacity activeOpacity={0.95} style={styles.heroCard} onPress={() => router.push({ pathname: '/ads/[id]', params: { id: String(hero.id) } })}>
                        {hero.image_url && (
                          <RemoteImage uri={hero.image_url && hero.image_url.startsWith('http') ? hero.image_url : (hero.image_url ? `${API_CONFIG.UPLOADS_URL}/news/${hero.image_url}` : undefined)} style={styles.heroImage} resizeMode="cover" />
                        )}
                        <View style={styles.heroContent}>

                          <ThemedText style={styles.heroTitle}>{language === 'ta' ? (hero.title_tamil ?? hero.title) : hero.title}</ThemedText>
                          <ThemedText style={styles.heroSubtitle}>{language === 'ta' ? (hero.description_tamil ?? hero.description) : hero.description}</ThemedText>
                          <TouchableOpacity
                            style={styles.heroCTA}
                            onPress={() => router.push({ pathname: '/ads/[id]', params: { id: String(hero.id) } })}
                          >
                            <ThemedText style={styles.heroCTAText}>{hero.button_text ?? (language === 'ta' ? 'விபரம் பெறுங்கள்' : 'Get offer')}</ThemedText>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    )}

                  </View>
                );
              })}
              <ThemedText style={styles.sectionDivider}>{language === 'ta' ? 'NAAM மூலம் வழங்கப்பட்டது' : 'Provided by NAAM'}</ThemedText>

            </View>
          )}


          <ThemedText style={styles.sectionLabel}>{language === 'ta' ? 'செய்திகள் & நிகழ்வுகள்' : 'News & Events'}</ThemedText>

          <View style={styles.newsGrid}>
            {newsItems.map((ev: any) => (
              <TouchableOpacity key={`news-${ev.id}-${ev.type ?? 'item'}`} style={styles.newsCard} activeOpacity={0.9} onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(ev.id) } })}>
                <View style={{ position: 'relative' }}>
                  <RemoteImage
                    key={`news-img-${ev.id}-${ev.image_url}`}
                    uri={ev.image_url && ev.image_url.startsWith('http')
                      ? ev.image_url.trim()
                      : (ev.image_url ? `${API_CONFIG.UPLOADS_URL}/news/${String(ev.image_url).trim()}` : undefined)}
                    style={styles.newsImage}
                    resizeMode="cover"
                  />
                  <View style={[styles.tagPill, (String(ev.type ?? '').toLowerCase().includes('news') ? { backgroundColor: '#2563eb' } : (String(ev.type ?? '').toLowerCase().includes('event') ? { backgroundColor: '#10B981' } : {}))]}>
                    <ThemedText style={styles.tagPillText}>{language === 'ta' ? (ev.type_tamil ?? ev.type ?? 'செய்தி') : (ev.type ?? 'News')}</ThemedText>
                  </View>
                </View>

                <View style={styles.newsBody}>
                  <ThemedText style={styles.newsTitle}>{language === 'ta' ? (ev.event_name_tamil ?? ev.event_name) : ev.event_name}</ThemedText>

                  <ThemedText numberOfLines={2} style={styles.newsSnippet}>{language === 'ta' ? (ev.description_tamil ?? ev.description ?? '') : (ev.description ?? '')}</ThemedText>

                  <View style={styles.newsMetaRow}>
                    <Ionicons name="calendar" size={14} color="#6b7280" />
                    <ThemedText style={[styles.newsMeta, { marginLeft: 8 }]}>{formatDateIST(ev.start_date)}</ThemedText>
                  </View>

                  <View style={styles.newsMetaRow}>
                    <Ionicons name="location" size={14} color="#6b7280" />
                    <ThemedText style={[styles.newsMeta, { marginLeft: 8 }]}>{language === 'ta' ? (ev.location_tamil ?? ev.location) : (ev.location ?? '')}</ThemedText>
                  </View>

                  <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                      <Ionicons name="heart" size={14} color="#ef4444" />
                      <ThemedText style={[styles.newsMeta, { marginLeft: 6 }]}>{ev.likes ?? 0} Like</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="share-social" size={14} color="#6b7280" />
                      <ThemedText style={[styles.newsMeta, { marginLeft: 6 }]}>{ev.share ?? 0} Share</ThemedText>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick actions */}
          <ThemedText style={styles.sectionLabel}>{language === 'ta' ? 'விரைவு செயல்கள்' : 'Quick Actions'}</ThemedText>
          <View style={styles.quickActionsWrap}>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.85} onPress={() => router.push('/harvest' as any)}>
                <View style={[styles.actionCircle, { backgroundColor: '#e6ffef' }]}>
                  <Ionicons name="add" size={28} color="#059669" />
                </View>
                <ThemedText style={styles.actionLabel}>{language === 'ta' ? 'புதிய அறுவடை' : 'New Harvest'}</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} activeOpacity={0.85} onPress={() => router.push('/price-history' as any)}>
                <View style={[styles.actionCircle, { backgroundColor: '#eaf2ff' }]}>
                  <Ionicons name="trending-up" size={26} color="#2563eb" />
                </View>
                <ThemedText style={styles.actionLabel}>{language === 'ta' ? 'விலை வரலாறு' : 'Price history'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>


        </View>

      </ScrollView>

      {/* Loan Application Modal */}
      <Modal visible={loanModalVisible} transparent animationType="fade" onRequestClose={() => { setLoanModalVisible(false); setShowTypeDropdown(false); setShowPeriodDropdown(false); }}>
        <Pressable style={styles.modalOverlay} onPress={() => { setLoanModalVisible(false); setShowTypeDropdown(false); setShowPeriodDropdown(false); }}>
          <Pressable style={styles.modalContent} onPress={() => { }}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{language === 'ta' ? 'டிராக்டர் வாங்க குறைந்த வட்டியில் கடன்' : 'Tractor Loan with Low Interest'}</ThemedText>
              <TouchableOpacity onPress={() => { setLoanModalVisible(false); setShowTypeDropdown(false); setShowPeriodDropdown(false); }}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Type Dropdown */}
              <View style={styles.formField}>
                <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'வகை' : 'Type'}</ThemedText>
                <TouchableOpacity style={styles.dropdown} onPress={() => { setShowTypeDropdown(!showTypeDropdown); setShowPeriodDropdown(false); }}>
                  <ThemedText style={styles.dropdownText}>{loanType}</ThemedText>
                  <Ionicons name="chevron-down" size={18} color="#64748b" />
                </TouchableOpacity>
                {showTypeDropdown && (
                  <View style={styles.dropdownOptions}>
                    <TouchableOpacity style={styles.dropdownOption} onPress={() => { setLoanType('டிராக்டர்'); setShowTypeDropdown(false); }}>
                      <ThemedText>டிராக்டர்</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Preferred Brand */}
              <View style={styles.formField}>
                <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'விருப்ப பிராண்ட்' : 'Preferred Brand'}</ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={preferredBrand}
                  onChangeText={setPreferredBrand}
                  placeholder={language === 'ta' ? 'உதா: மகிந்திரா' : 'e.g., Mahindra'}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Budget Row */}
              <View style={styles.budgetRow}>
                <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                  <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'குறைந்தபட்ச பட்ஜெட்' : 'Minimum Budget'}</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={minBudget}
                    onChangeText={setMinBudget}
                    keyboardType="numeric"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
                  <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'அதிகபட்ச பட்ஜெட்' : 'Maximum Budget'}</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={maxBudget}
                    onChangeText={setMaxBudget}
                    keyboardType="numeric"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              {/* Expected Purchase Period */}
              <View style={styles.formField}>
                <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'வாங்க எதிர்பார்க்கும் காலம்' : 'Expected Purchase Period'}</ThemedText>
                <TouchableOpacity style={styles.dropdown} onPress={() => { setShowPeriodDropdown(!showPeriodDropdown); setShowTypeDropdown(false); }}>
                  <ThemedText style={styles.dropdownText}>{expectedPeriod}</ThemedText>
                  <Ionicons name="chevron-down" size={18} color="#64748b" />
                </TouchableOpacity>
                {showPeriodDropdown && (
                  <View style={styles.dropdownOptions}>
                    <TouchableOpacity style={styles.dropdownOption} onPress={() => { setExpectedPeriod('1 மாதத்திற்குள்'); setShowPeriodDropdown(false); }}>
                      <ThemedText>1 மாதத்திற்குள்</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dropdownOption} onPress={() => { setExpectedPeriod('2-3 மாதங்களில்'); setShowPeriodDropdown(false); }}>
                      <ThemedText>2-3 மாதங்களில்</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dropdownOption} onPress={() => { setExpectedPeriod('3-6 மாதங்களில்'); setShowPeriodDropdown(false); }}>
                      <ThemedText>3-6 மாதங்களில்</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dropdownOption} onPress={() => { setExpectedPeriod('6 மாதங்களுக்கு மேல்'); setShowPeriodDropdown(false); }}>
                      <ThemedText>6 மாதங்களுக்கு மேல்</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Additional Notes */}
              <View style={styles.formField}>
                <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'கூடுதல் குறிப்புகள்' : 'Additional Notes'}</ThemedText>
                <TextInput
                  style={styles.textArea}
                  value={additionalNotes}
                  onChangeText={setAdditionalNotes}
                  placeholder=""
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loanSubmitting && styles.submitButtonDisabled]}
              onPress={submitLoanApplication}
              disabled={loanSubmitting}
            >
              {loanSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <ThemedText style={styles.submitButtonText}>{language === 'ta' ? 'சமர்ப்பிக்கவும்' : 'Submit'}</ThemedText>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Ad Details Modal */}
      <Modal visible={adDetailsModalVisible} transparent animationType="fade" onRequestClose={() => { setAdDetailsModalVisible(false); setSelectedAd(null); }}>
        <Pressable style={styles.modalOverlay} onPress={() => { setAdDetailsModalVisible(false); setSelectedAd(null); }}>
          <Pressable style={styles.modalContent} onPress={() => { }}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{language === 'ta' ? 'விளம்பர விவரங்கள்' : 'Ad Details'}</ThemedText>
              <TouchableOpacity onPress={() => { setAdDetailsModalVisible(false); setSelectedAd(null); }}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={[styles.modalBody, { maxHeight: 500 }]} showsVerticalScrollIndicator={false}>
              {selectedAd?.image_url && (
                <RemoteImage
                  uri={selectedAd.image_url && selectedAd.image_url.startsWith('http')
                    ? selectedAd.image_url
                    : (selectedAd.image_url ? `${API_CONFIG.UPLOADS_URL}/news/${selectedAd.image_url}` : undefined)}
                  style={styles.adDetailsImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.adDetailsContent}>
                <ThemedText style={styles.adDetailsTitle}>
                  {language === 'ta' ? (selectedAd?.title_tamil ?? selectedAd?.title) : selectedAd?.title}
                </ThemedText>

                <ThemedText style={styles.adDetailsDescription}>
                  {language === 'ta' ? (selectedAd?.description_tamil ?? selectedAd?.description) : selectedAd?.description}
                </ThemedText>

                {selectedAd?.link_url && (
                  <TouchableOpacity
                    style={styles.adDetailsLinkButton}
                    onPress={() => {
                      if (selectedAd.link_url) {
                        Linking.openURL(selectedAd.link_url);
                      }
                    }}
                  >
                    <ThemedText style={styles.adDetailsLinkText}>
                      {language === 'ta' ? 'மேலும் அறிக' : 'Learn More'}
                    </ThemedText>
                    <Ionicons name="open-outline" size={16} color="#2563eb" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Motivation Modal */}
      <Modal visible={motivationModalVisible} transparent animationType="fade" onRequestClose={() => setMotivationModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMotivationModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => { }}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{language === 'ta' ? 'இன்றைய ஊக்க மொழி' : "Today's Motivation"}</ThemedText>
              <TouchableOpacity onPress={() => setMotivationModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Ionicons name="chatbox-ellipses-outline" size={48} color="#c05621" style={{ opacity: 0.2, marginBottom: 16 }} />
                <ThemedText style={[styles.motivationalQuote, { fontSize: 18, textAlign: 'center', lineHeight: 28, color: '#4b5563' }]}>
                  {homeData?.motivational_quotes?.active?.[0] ? (language === 'ta' ? (homeData.motivational_quotes.active[0].quote_text_tamil ?? homeData.motivational_quotes.active[0].quote_text) : homeData.motivational_quotes.active[0].quote_text) : (language === 'ta' ? 'உங்கள் விவசாயம் தயாரா என்பதை சரிபார்க்க உதவிகள் உள்ளன.' : 'Quick tips to prepare your farm are available.')}
                </ThemedText>
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 16, marginTop: 8 }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }} onPress={() => {
                if (!quoteLiked) {
                  setQuoteLiked(true);
                  handleQuoteInteraction('like');
                  Alert.alert(language === 'ta' ? 'நன்றி' : 'Thank you', language === 'ta' ? 'உங்கள் விருப்பம் பதிவு செய்யப்பட்டது' : 'Your like has been recorded');
                }
              }}>
                <Ionicons name={quoteLiked ? "heart" : "heart-outline"} size={24} color="#ef4444" />
                <ThemedText style={{ marginLeft: 8, color: '#4b5563', fontWeight: '600' }}>{language === 'ta' ? 'விருப்பம்' : 'Like'}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }} onPress={handleShareMotivation}>
                <Ionicons name="share-social-outline" size={24} color="#2563eb" />
                <ThemedText style={{ marginLeft: 8, color: '#4b5563', fontWeight: '600' }}>{language === 'ta' ? 'பகிர்' : 'Share'}</ThemedText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Bottom nav (shared) */}
      <FarmerBottomNav />
    </SafeAreaView>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
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
  infoStripRow: {
    backgroundColor: '#fff6e0',
    marginHorizontal: isSmallScreen ? 10 : 12,
    marginTop: isSmallScreen ? 10 : 12,
    paddingVertical: isSmallScreen ? 6 : 8,
    paddingHorizontal: isSmallScreen ? 10 : 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#fff0c7',
    flexWrap: 'wrap',
  },
  infoStripText: { color: '#8a6b00', fontSize: isSmallScreen ? 12 : 14, flex: 1, flexShrink: 1 },
  infoStripAction: { backgroundColor: '#ffe6b3', paddingHorizontal: isSmallScreen ? 8 : 10, paddingVertical: isSmallScreen ? 5 : 6, borderRadius: 8 },
  infoStripActionText: { color: '#8a6b00', fontWeight: '700', fontSize: isSmallScreen ? 11 : 12 },
  content: { paddingHorizontal: isSmallScreen ? 12 : 16, paddingVertical: isSmallScreen ? 12 : 16, alignItems: 'center', paddingBottom: 10 },
  priceCardWrap: { alignItems: 'center', width: '100%' },
  priceCard: { width: '100%', maxWidth: 520, backgroundColor: '#0bb24c', borderRadius: isSmallScreen ? 10 : 12, padding: isSmallScreen ? 12 : 16, elevation: 6 },
  priceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isSmallScreen ? 10 : 12, flexWrap: 'wrap' },
  priceCardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, flexShrink: 1 },
  priceBadge: { width: isSmallScreen ? 30 : 34, height: isSmallScreen ? 30 : 34, borderRadius: isSmallScreen ? 15 : 18, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginRight: isSmallScreen ? 5 : 6 },
  priceCardTitle: { color: '#fff', fontWeight: '700', fontSize: isSmallScreen ? 16 : 18 },
  priceCardMenu: { padding: 6 },
  priceTilesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: isSmallScreen ? 10 : 12, flexWrap: 'wrap' },
  priceTile: {
    flex: 1,
    minWidth: isSmallScreen ? '30%' : '28%',
    backgroundColor: '#fff',
    borderRadius: isSmallScreen ? 8 : 10,
    paddingHorizontal: isSmallScreen ? 8 : 12,
    paddingVertical: isSmallScreen ? 8 : 10,
    marginHorizontal: isSmallScreen ? 3 : 6,
    alignItems: 'center',
    minHeight: isSmallScreen ? 68 : 72,
    marginBottom: isSmallScreen ? 6 : 0,
  },
  priceTileTitle: { color: '#0b6b38', fontSize: isSmallScreen ? 11 : 12, textAlign: 'center' },
  priceTileValue: { color: '#0b6b38', fontWeight: '700', marginTop: isSmallScreen ? 4 : 6, fontSize: isSmallScreen ? 14 : 16 },
  priceTileUnit: { color: '#2d3748', opacity: 0.7, fontSize: isSmallScreen ? 11 : 12, marginTop: 4 },
  priceCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceCardDate: { color: '#e6f9ee' },
  priceHistoryButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ffffff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  priceHistoryText: { color: '#ffffff', fontWeight: '700' },
  priceUnitPill: { backgroundColor: '#f7f38a', borderWidth: 1, borderColor: '#9aa30b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 12 },
  priceUnitText: { color: '#14532d', fontWeight: '700', fontSize: 13 },
  priceCardSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: isSmallScreen ? 11 : 12, marginTop: 2 },
  /* Unit dropdown */
  unitMenuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 },
  unitMenu: { position: 'absolute', top: 42, right: 12, width: 120, backgroundColor: '#ffffff', borderRadius: 8, elevation: 8, shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, zIndex: 10, overflow: 'hidden' },
  unitMenuItem: { paddingVertical: 10, paddingHorizontal: 12 },
  unitMenuItemActive: { backgroundColor: '#1e3a8a' },
  unitMenuItemText: { color: '#0f172a' },
  unitMenuItemTextActive: { color: '#ffffff', fontWeight: '700' },
  unitMenuDivider: { height: 1, backgroundColor: '#e6eef8' },
  priceDateWrap: { flexDirection: 'row', alignItems: 'center' },
  infoBox: { width: '100%', maxWidth: 520, backgroundColor: '#eaf6ff', borderRadius: 14, padding: 16, marginTop: 12, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#dbeeff', elevation: 2 },
  infoBoxLeftCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e6f0ff', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1, borderColor: '#dbeeff' },
  infoBoxTitle: { fontWeight: '700', color: '#1e3a8a', marginBottom: 6, fontSize: 14 },
  infoBoxText: { color: '#1e3a8a', fontSize: 13, lineHeight: 18, writingDirection: 'ltr', textAlign: 'left' },
  infoBoxCloseBtn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cfe6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  infoBoxCloseIcon: { color: '#2563eb', fontWeight: '700', marginRight: 8, fontSize: 14 },
  infoBoxCloseText: { color: '#2563eb', fontWeight: '700', fontSize: 14 },


  pollCardWrap: { alignItems: 'center', marginTop: 18, width: '100%' },
  pollCard: { width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 4 },
  pollTitle: { textAlign: 'left', fontWeight: '300', fontSize: 14, color: '#6b46c1', marginBottom: 6, backgroundColor: '#f3e8ff', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  pollQuestion: { textAlign: 'left', color: '#374151', marginBottom: 12 },
  pollInstruction: { textAlign: 'left', color: '#6b7280', marginBottom: 8, fontSize: 13 },
  pollOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e6eef8', paddingHorizontal: 14, marginBottom: 8, backgroundColor: '#ffffff', width: '100%' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#cbd5e1', marginRight: 12 },
  pollOptionText: { color: '#374151', flex: 1 },
  pollSubmitContainer: { marginTop: 12, width: '100%' },
  pollSubmitDisabled: { backgroundColor: '#d1d5db', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pollSubmitTextDisabled: { color: '#fff', fontWeight: '700' },
  pollSubmitEnabled: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pollSubmitTextEnabled: { color: '#fff', fontWeight: '700' },
  pollErrorText: { color: '#dc2626', marginTop: 8, fontWeight: '700' },
  pollSuccessWrap: { marginTop: 12, backgroundColor: '#f0fdf4', borderRadius: 12, paddingVertical: 24, alignItems: 'center' },
  pollSuccessInner: { alignItems: 'center' },
  pollSuccessCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#ffffff' },
  pollSuccessText: { color: '#065f46', fontWeight: '700', fontSize: 16 },

  /* Announcements & news */
  announcementsWrap: { width: '100%', maxWidth: 520, marginTop: 14 },
  announcementBox: { backgroundColor: '#fff6f0', borderRadius: 10, borderWidth: 1, borderColor: '#ffe6d9', padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  announcementLeft: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff3ec', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#fde1cf' },
  announcementTitle: { fontWeight: '700', color: '#c05621', marginBottom: 4 },
  announcementBody: { color: '#7c2d12', fontSize: 13 },
  announcementCTA: { marginLeft: 8, padding: 6, borderRadius: 8 },
  sectionDivider: { textAlign: 'center', color: '#9ca3af', fontSize: 10, marginVertical: 0 },
  /* Section header */
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  sectionHeaderLeft: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e6f0ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#dbeeff', marginRight: 10 },
  sectionHeaderTitle: { fontWeight: '700', fontSize: 16 },

  /* Ads */
  adsWrap: { marginTop: 12, width: '100%', maxWidth: 520 },
  adsGroup: { marginBottom: 12 },
  adsGroupTitle: { marginBottom: 8, fontSize: 12, color: '#2563eb', fontWeight: '300', backgroundColor: '#e6f0ff', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  smallAnnouncement: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eef6ff', marginBottom: 10 },
  smallAnnouncementTag: { width: 70, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 6, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  smallAnnouncementTagText: { color: '#2563eb', fontWeight: '700' },
  smallAnnouncementTitle: { fontWeight: '700' },
  smallAnnouncementSub: { color: '#6b7280', marginTop: 4 },


  adCard: { width: Math.min(screenWidth - 60, 320), backgroundColor: '#fff', borderRadius: isSmallScreen ? 10 : 12, padding: isSmallScreen ? 6 : 8, flexDirection: 'row', alignItems: 'center', marginRight: isSmallScreen ? 8 : 12, elevation: 2 },
  adImage: { width: isSmallScreen ? 80 : 92, height: isSmallScreen ? 60 : 72, borderRadius: isSmallScreen ? 6 : 8, backgroundColor: '#f3f4f6' },
  adTitle: { fontWeight: '700', fontSize: isSmallScreen ? 13 : 14 },
  adDesc: { color: '#6b7280', marginTop: 6, fontSize: isSmallScreen ? 12 : 13 },
  adCTA: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#0ea5a1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  adCTAText: { color: '#fff', fontWeight: '700' },

  smallCardsList: { flexDirection: 'column', marginBottom: 12 },
  smallCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eef2f6' },
  smallTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginRight: 12 },
  smallTagText: { fontWeight: '700', color: '#0f172a', fontSize: 12 },
  smallCardTitle: { color: '#0f172a', fontSize: 14, flex: 1 },

  heroCard: { width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2f6' },
  heroImage: { width: '100%', height: 160 },
  heroContent: { padding: 12 },
  heroTopRow: { position: 'absolute', right: 12, top: 12, zIndex: 10 },
  heroTag: { backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 5, paddingVertical: 4, borderRadius: 8 },
  heroTagText: { color: '#fff', fontWeight: '300', fontSize: 12 },
  heroTitle: { fontWeight: '700', fontSize: 16, marginBottom: 8 },
  heroSubtitle: { color: '#4b5563', marginBottom: 12 },
  heroCTA: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  heroCTAText: { color: '#fff', fontWeight: '700' },
  newBadge: { backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  newBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  /* Side menu */
  menuOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 80 },
  sideMenu: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 320, backgroundColor: '#fff', zIndex: 90, transform: [{ translateX: -340 }], elevation: 20, paddingTop: 18 },
  sideMenuOpen: { transform: [{ translateX: 0 }] },
  menuHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eef2f6' },
  avatarWrap: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', backgroundColor: '#f3f4f6' },
  avatar: { width: 56, height: 56 },
  userName: { fontWeight: '700', color: '#0f172a' },
  userPhone: { color: '#6b7280', marginTop: 4 },
  progressWrap: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  progressBarBg: { height: 8, backgroundColor: '#eef2f6', borderRadius: 8, overflow: 'hidden', flex: 1 },
  progressBarFill: { height: 8, backgroundColor: '#06b58a' },
  progressPct: { marginLeft: 8, color: '#06b58a', fontWeight: '700' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  menuItemText: { marginLeft: 12, fontWeight: '600' },
  menuSeparator: { height: 1, backgroundColor: '#eef2f6', marginTop: 6, marginBottom: 6 },

  sectionLabel: { marginTop: 8, marginBottom: 8, fontWeight: '700', color: '#1e293b' },
  newsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  newsCard: { width: '48%', backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#eef2f6' },
  newsImage: { width: '100%', height: 110 },
  tagPill: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16, zIndex: 10 },
  tagPillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  newsBody: { padding: 10 },
  newsTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  newsMetaRow: { flexDirection: 'row', marginTop: 8 },
  newsMeta: { color: '#6b7280', fontSize: 12 },
  newsSnippet: { color: '#4b5563', marginTop: 6, fontSize: 12, lineHeight: 16 },

  /* Quick actions */
  quickActionsWrap: { width: '100%', maxWidth: 520, marginTop: 12, marginBottom: 12 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eef2f6' },
  actionCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionLabel: { color: '#0f172a', fontSize: 16, marginTop: 4 },

  noteBox: { width: '100%', maxWidth: 520, marginTop: 12, backgroundColor: '#fff8f0', padding: 12, borderRadius: 10 },
  motivationalQuote: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  noteText: { color: '#8a6b00' },
  bottomNav: { flexDirection: 'row', paddingTop: 12, paddingBottom: 20, paddingHorizontal: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 8, justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#ffffff' },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  navLabel: { fontSize: 12, fontWeight: '500', marginTop: 4 },

  /* Loan Modal Styles */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalContent: { width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 12, padding: 20, elevation: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 12 },
  modalBody: { marginBottom: 20 },
  formField: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#ffffff' },
  dropdownText: { fontSize: 14, color: '#0f172a', flex: 1 },
  dropdownOptions: { marginTop: 4, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#ffffff', elevation: 4, maxHeight: 200 },
  dropdownOption: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  textInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: '#0f172a', backgroundColor: '#ffffff' },
  textArea: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: '#0f172a', backgroundColor: '#ffffff', minHeight: 100 },
  budgetRow: { flexDirection: 'row', marginBottom: 16 },
  submitButton: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  submitButtonDisabled: { backgroundColor: '#94a3b8', opacity: 0.6 },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  /* Ad Details Modal Styles */
  adDetailsImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 16, backgroundColor: '#f3f4f6' },
  adDetailsContent: { paddingBottom: 8 },
  adDetailsTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  adDetailsDescription: { fontSize: 15, color: '#4b5563', lineHeight: 22, marginBottom: 16 },
  adDetailsLinkButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e6f0ff', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#cfe6ff' },
  adDetailsLinkText: { color: '#2563eb', fontWeight: '700', fontSize: 14 }
});