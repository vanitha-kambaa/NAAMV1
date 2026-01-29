import FarmerBottomNav from '@/components/farmer-bottom-nav';
import { useSideMenu } from '@/components/SideMenu';
import { ThemedText } from '@/components/themed-text';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LeaderScreen() {
  const { language } = useLanguage();
  const { open: openSideMenu } = useSideMenu();

  const [landingData, setLandingData] = React.useState<any | null>(null);
  const [isLandingLoading, setIsLandingLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchLanding = async () => {
      setIsLandingLoading(true);
      try {
        const token = await AsyncStorage.getItem('authToken');
        const res = await fetch(`${API_CONFIG.BASE_URL}/landing/data`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        if (json?.status === 'success') {
          setLandingData(json.data);
        } else {
          setLandingData(null);
        }
      } catch (err) {
        console.error('Error fetching landing data:', err);
        setLandingData(null);
      } finally {
        setIsLandingLoading(false);
      }
    };

    fetchLanding();
  }, []);

  const handleEmail = () => {
    Linking.openURL('mailto:contact@naam.org'); // Placeholder email
  }; 

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Standard Header */}
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

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        {/* Blue Banner */}
        <View style={styles.banner}>
          <ThemedText style={styles.bannerTitle}>{language === 'ta' ? 'தலைமை குழு' : 'Leadership Team'}</ThemedText>
          <ThemedText style={styles.bannerSubtitle}>{language === 'ta' ? 'NAAM அமைப்பின் தலைவர்கள்' : 'Leaders of NAAM organization'}</ThemedText>
        </View>

        {/* Profile Card */}
        <View style={styles.cardContainer}>
          {landingData?.reporting_details && landingData.reporting_details.length > 0 ? (
            landingData.reporting_details.map((leader: any, idx: number) => (
              <View key={leader.id || idx} style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Ionicons name="person-outline" size={32} color="#2563eb" />
                  </View>
                  <View style={styles.tag}>
                    <ThemedText style={styles.tagText}>{language === 'ta' ? (leader.state_name_tamil || leader.state_name || 'State') : (leader.state_name || 'State')}</ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.name}>{language === 'ta' ? (leader.fullname_tamil || leader.fullname) : (leader.fullname)}</ThemedText>
                <ThemedText style={styles.role}>{language === 'ta' ? (leader.role_name_tamil || leader.role_name) : (leader.role_name)}</ThemedText> 

                <ThemedText style={styles.description}>
                  {language === 'ta'
                    ? [leader.address, leader.pincode, leader.state_name_tamil].filter(Boolean).join(' • ')
                    : [leader.address, leader.pincode, leader.state_name].filter(Boolean).join(' • ')}
                </ThemedText>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => leader.mobile_no ? Linking.openURL(`whatsapp://send?phone=91${leader.mobile_no}`) : Alert.alert('No number', 'Mobile number not available')}>
                    <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                    <ThemedText style={[styles.actionBtnText, { color: '#25D366' }]}>{language === 'ta' ? 'வாட்ஸ்அப்' : 'WhatsApp'}</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => leader.email_id ? Linking.openURL(`mailto:${leader.email_id}`) : handleEmail()}>
                    <Ionicons name="mail-outline" size={16} color="#475569" />
                    <ThemedText style={[styles.actionBtnText, { color: '#475569' }]}>{language === 'ta' ? 'மின்னஞ்சல்' : 'Email'}</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Ionicons name="person-outline" size={32} color="#2563eb" />
                </View>
                <View style={styles.tag}>
                  <ThemedText style={styles.tagText}>{language === 'ta' ? 'மாநிலம்' : 'State'}</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.name}>{language === 'ta' ? 'கார்த்திக் ராஜன்' : 'Karthik Rajan'}</ThemedText>
              <ThemedText style={styles.role}>{language === 'ta' ? 'மாநில தலைவர்' : 'State President'}</ThemedText>

              <ThemedText style={styles.description}>
                {language === 'ta'
                  ? 'தமிழ்நாடு விவசாயிகள் இயக்கத்தின் மாநில தலைவர். 20 ஆண்டுகள் விவசாய அனுபவம்.'
                  : 'State President of Tamil Nadu Farmers Movement. 20 years of farming experience.'}
              </ThemedText>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`whatsapp://send?phone=919876543210`)}>
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                  <ThemedText style={[styles.actionBtnText, { color: '#25D366' }]}>{language === 'ta' ? 'வாட்ஸ்அப்' : 'WhatsApp'}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleEmail}>
                  <Ionicons name="mail-outline" size={16} color="#475569" />
                  <ThemedText style={[styles.actionBtnText, { color: '#475569' }]}>{language === 'ta' ? 'மின்னஞ்சல்' : 'Email'}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* About Section */}
        <View style={styles.aboutContainer}>
          <View style={styles.aboutCard}>
            <ThemedText style={styles.aboutTitle}>{language === 'ta' ? 'NAAM பற்றி' : 'About NAAM'}</ThemedText>
            <ThemedText style={styles.aboutDesc}>
              {language === 'ta'
                ? (landingData?.abouts && landingData.abouts.length > 0 ? landingData.abouts[0].about_content_tamil : 'தேசிய விவசாய இயக்கம் (NAAM) விவசாயிகளின் நலனுக்காக அர்ப்பணிக்கப்பட்ட ஒரு சமூக இயக்கம். சிறந்த விலை, நவீன தொழில்நுட்பம், மற்றும் அரசு திட்டங்களை விவசாயிகளுக்கு கொண்டு வருவதே எங்கள் நோக்கம்.')
                : (landingData?.abouts && landingData.abouts.length > 0 ? landingData.abouts[0].about_content : 'National Agricultural Movement (NAAM) is a social movement dedicated to the welfare of farmers. Our goal is to bring better prices, modern technology, and government schemes to farmers.')}
            </ThemedText>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{landingData?.statistics ? String(landingData.statistics.total_farmers) : '10k+'}</ThemedText>
                <ThemedText style={styles.statLabel}>{language === 'ta' ? 'உறுப்பினர்கள்' : 'Members'}</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{landingData?.statistics ? String(landingData.statistics.total_panchayats) : '50+'}</ThemedText>
                <ThemedText style={styles.statLabel}>{language === 'ta' ? 'பஞ்சாயத்துகள்' : 'Panchayats'}</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{landingData?.statistics ? String(landingData.statistics.total_districts) : '5+'}</ThemedText>
                <ThemedText style={styles.statLabel}>{language === 'ta' ? 'மாவட்டங்கள்' : 'Districts'}</ThemedText>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      <FarmerBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  topAppBar: {
    height: 56,
    backgroundColor: '#0f6b36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12
  },
  hamburger: { width: 36, alignItems: 'center', justifyContent: 'center' },
  topAppBarLogo: { height: 40, width: 120, maxWidth: 200 },

  banner: {
    backgroundColor: '#2563eb', // Blue header
    paddingTop: 32,
    paddingBottom: 64, // Extra padding for overlap
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  bannerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  bannerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  cardContainer: {
    paddingHorizontal: 16,
    marginTop: -40, // overlap banner
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarContainer: { alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center',
    marginBottom: -10, zIndex: 1
  },
  tag: {
    backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, marginTop: 4,
    borderWidth: 1, borderColor: '#bfdbfe', zIndex: 2
  },
  tagText: { color: '#2563eb', fontSize: 10, fontWeight: '700' },

  name: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 12 },
  role: { fontSize: 14, color: '#2563eb', fontWeight: '600', marginBottom: 12 },
  description: { textAlign: 'center', color: '#64748b', fontSize: 13, lineHeight: 20, marginBottom: 20 },

  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9',
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, gap: 6
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },

  aboutContainer: { paddingHorizontal: 16, marginBottom: 20 },
  aboutCard: {
    backgroundColor: '#f0fdf4', // Light green
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  aboutTitle: { fontSize: 16, fontWeight: '700', color: '#166534', marginBottom: 8 },
  aboutDesc: { fontSize: 13, color: '#15803d', lineHeight: 20, marginBottom: 20 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, padding: 16 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#e2e8f0' },
});
