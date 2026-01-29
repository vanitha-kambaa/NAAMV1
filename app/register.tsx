import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, Stack } from 'expo-router';
import { ComponentProps, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiService } from '@/services/api';

const { width } = Dimensions.get('window');



type IconName = ComponentProps<typeof IconSymbol>['name'];

type RegisterWidget = {
  title: string;
  icon: IconName;
  href: '/register/farmer' | '/register/investor' | '/register/service-provider' | '/register/nam-member';
};

export default function RegisterScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDarkMode = colorScheme === 'dark';
  const [farmerFeer, setFarmerFee] = useState<number | null>(null);
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const { t, language, setLanguage } = useLanguage();

  const WIDGETS: RegisterWidget[] = [
    {
      title: t('farmer'),
      icon: 'leaf.fill',
      href: '/register/farmer',
    },
    {
      title: t('investor'),
      icon: 'chart.line.uptrend.xyaxis',
      href: '/register/investor',
    },
    {
      title: t('service_provider'),
      icon: 'wrench.and.screwdriver.fill',
      href: '/register/service-provider',
    },
    {
      title: t('nam_member'),
      icon: 'person.3.fill',
      href: '/register/nam-member',
    },
  ];

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const fee = await apiService.getFees();
        if (fee > 0) {
          setFarmerFee(fee);
        }
      } catch (error) {
        console.error('Error fetching fees:', error);
      }
    };

    fetchFees();
  }, []);

  useEffect(() => {
    if (farmerFee && farmerFee > 0) {
      const blink = () => {
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => blink());
      };
      blink();
    }
  }, [farmerFee, blinkAnim]);

  return (
    <>
      <Stack.Screen options={{ title: t('join_naam'), headerShown: false }} />
      <View style={[styles.screen, { backgroundColor: isDarkMode ? '#0f172a' : '#fff8f1' }]}>
        <TouchableOpacity
          style={[
            styles.languageButton,
            language === 'ta' ? styles.languageButtonEnglish : styles.languageButtonTamil,
          ]}
          onPress={() => setLanguage(language === 'ta' ? 'en' : 'ta')}
        >
          <ThemedText style={styles.languageText}>
            {language === 'ta' ? 'English' : 'தமிழ்'}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <LinearGradient colors={['#b35418', '#682c14']} style={styles.heroIconGradient}>
              <Image
                source={require('@/assets/images/coconut-trees.png')}
                contentFit="contain"
                style={styles.coconutIcon}
              />
            </LinearGradient>
          </View>
          <ThemedText style={styles.heroTitle}>
            {language === 'ta' ? 'உங்கள் கணக்கை உருவாக்கவும்' : 'Create your account'}
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            {language === 'ta' ? 'தொடங்க உங்கள் பாத்திரத்தை தேர்ந்தெடுக்கவும்' : 'Choose your role to get started'}
          </ThemedText>
        </View>

        <View style={styles.grid}>
          {WIDGETS.map((widget) => (
            <Link key={widget.href} href={widget.href} asChild>
              <TouchableOpacity style={styles.roleCard}>
                <View style={styles.simpleIconWrapper}>
                  <View style={styles.simpleIconBackground}>
                    <IconSymbol
                      name={widget.icon}
                      size={32}
                      color={isDarkMode ? '#f7fafc' : '#955628'}
                    />
                  </View>
                </View>
                <ThemedText style={[styles.roleTitle, { color: isDarkMode ? '#f7fafc' : '#7a4524' }]}>
                  {widget.title}
                </ThemedText>
                {widget.title === t('farmer') && farmerFee && farmerFee > 0 && (
                  <Animated.View style={[styles.roleFee, { opacity: blinkAnim }]}>
                    <ThemedText style={styles.roleFeeText}>
                      {t('registration_fee')}
                      {farmerFee}
                    </ThemedText>
                  </Animated.View>
                )}
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  languageButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  languageButtonEnglish: {
    backgroundColor: '#c8671f',
  },
  languageButtonTamil: {
    backgroundColor: '#432616',
  },
  languageText: {
    color: '#fff',
    fontWeight: '600',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIcon: {
    marginBottom: 20,
  },
  heroIconGradient: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDotRow: {
    flexDirection: 'row',
    gap: 6,
  },
  heroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  coconutIcon: {
    width: 56,
    height: 56,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7a4524',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 6,
    color: '#a0795c',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  roleCard: {
    width: (width - 60) / 2,
    borderRadius: 10,
    paddingVertical: 28,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f4ebe3',
    backgroundColor: '#fff',
    shadowColor: '#d9c3b4',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 6,
  },
  simpleIconWrapper: {
    marginBottom: 12,
  },
  simpleIconBackground: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#fff1e4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  roleFee: {
    marginTop: 4,
    backgroundColor: 'rgba(200,103,31,0.1)',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleFeeText: {
    fontSize: 12,
    color: '#c8671f',
    fontWeight: '600',
  },
});