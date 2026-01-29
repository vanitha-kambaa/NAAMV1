import { Link, Stack, useRouter } from 'expo-router';
import { ComponentProps } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLanguage } from '@/contexts/LanguageContext';

type IconName = ComponentProps<typeof IconSymbol>['name'];

export default function FarmerLanding() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDarkMode = colorScheme === 'dark';
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();

  // Responsive sizes based on screen width
  const { width, height } = Dimensions.get('window');
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 414;
  const isLargeScreen = width >= 414;
  
  const logoSize = isSmallScreen ? 64 : isMediumScreen ? 76 : 86;
  const iconBgSize = isSmallScreen ? 28 : isMediumScreen ? 32 : 36;
  const iconSize = isSmallScreen ? 16 : isMediumScreen ? 18 : 20;
  const paddingHorizontal = isSmallScreen ? 14 : isMediumScreen ? 16 : 18;
  const paddingTop = isSmallScreen ? 80 : isMediumScreen ? 90 : 100;

  const FEATURES: { id: string; text: string; icon: IconName }[] = [
    { id: 'price', text: language === 'ta' ? 'தினசரி தேங்காய் விலை புதுப்பிப்புகள்' : 'Daily coconut price updates', icon: 'chart.bar.fill' },
    { id: 'schemes', text: language === 'ta' ? 'அரசு திட்டங்கள் மற்றும் நன்மைகள்' : 'Government schemes and benefits', icon: 'doc.text.fill' },
    { id: 'sell', text: language === 'ta' ? 'அறுவடை பதிவு மற்றும் விற்பனை' : 'Record harvests and sell', icon: 'cart.fill' },
  ];

  return (
    <>
      <Stack.Screen options={{ title: "NAAM", headerShown: false }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.screen, { 
          flexGrow: 1, 
          justifyContent: 'center', 
          paddingBottom: isSmallScreen ? 60 : 80, 
          paddingTop: paddingTop,
          paddingHorizontal: paddingHorizontal,
          backgroundColor: isDarkMode ? '#0f172a' : '#ecfdf5' 
        }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={[
            styles.languageButton,
            language === 'ta' ? styles.languageButtonEnglish : styles.languageButtonTamil,
          ]}
          onPress={() => setLanguage(language === 'ta' ? 'en' : 'ta')}
        >
          <ThemedText style={styles.languageText}>{language === 'ta' ? 'English' : 'தமிழ்'}</ThemedText>
        </TouchableOpacity>

        <View style={styles.headerTop}>
          <Image 
            source={language === 'ta' 
              ? require('../../assets/images/naam-logo-ta.png')
              : require('../../assets/images/naam-logo-en.png')
            } 
            style={styles.logoImage}
            resizeMode="contain"
          />
          {/* <ThemedText style={styles.brandTitle}>NAAM</ThemedText> */}
          <ThemedText style={styles.brandSubtitle}>{language === 'ta' ? 'தேசிய விவசாய இயக்கம்' : 'National Agriculture Movement'}</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>{language === 'ta' ? 'விவசாயிகளின் சமூகத்தில் சேருங்கள்' : 'Join the Farmer Community'}</ThemedText>

          <View style={styles.featureList}>
            {FEATURES.map((f) => (
              <View key={f.id} style={styles.featureRow}>
                <View style={styles.featureIconWrap}>
                  <View style={[styles.featureIconBg, { width: iconBgSize, height: iconBgSize, borderRadius: iconBgSize / 2 }]}>
                    <IconSymbol name={f.icon} size={iconSize} color="#0b6b38" />
                  </View>
                </View>
                <ThemedText style={[styles.featureText, { flex: 1, flexShrink: 1 }]}>{f.text}</ThemedText>
              </View>
            ))}
          </View>

         
 <Link href="/register/new" asChild>
            <TouchableOpacity style={styles.joinButton}>
              <ThemedText style={styles.joinButtonText}>{language === 'ta' ? 'விவசாயியாக சேர' : 'Join as Farmer'} {/* arrow */} ➜</ThemedText>
            </TouchableOpacity>
          </Link>
          {/* Use router.push to navigate to the new login page (avoids Link typing mismatch) */}
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login' as any)}>
            <ThemedText style={styles.loginButtonText}>{language === 'ta' ? 'உள்நுழைவு' : 'Login'}</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
  },
  languageButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    elevation: 5,
    zIndex: 10,
  },
  languageButtonEnglish: {
    backgroundColor: '#ffffff',
  },
  languageButtonTamil: {
    backgroundColor: '#ffffff',
  },
  languageText: {
    color: '#064e3b',
    fontWeight: '600',
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoImage: {
    width: 200,
    height: 120,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0b6b38',
  },
  brandSubtitle: {
    marginTop: 6,
    color: '#1f6f4d',
    fontSize: 14,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    paddingBottom: 40,
    // shadow
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
  cardTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#083b2b',
    paddingHorizontal: 4,
  },
  featureList: {
    marginVertical: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIconWrap: {
    marginRight: 12,
  },
  featureIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    color: '#23312a',
    flexShrink: 1,
  },
  joinButton: {
    marginTop: 14,
    backgroundColor: '#0bb24c',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    marginBottom: 20,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  loginButton: {
    marginTop: 12,
    borderRadius: 32,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0bb24c',
  },
  loginButtonText: {
    color: '#0bb24c',
    fontWeight: '700',
  },
});