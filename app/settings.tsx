import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
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
import { API_CONFIG, API_ENDPOINTS } from '@/config/api';

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.LOGOUT}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (response.ok) {
                // Clear stored user data
                await AsyncStorage.multiRemove(['authToken', 'userId', 'userRole']);
                router.replace('/');
              } else {
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Network error. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          }
        }
      ]
    );
  };

  const settingsOptions = [
    {
      id: 'profile',
      title: t('profile'),
      icon: 'person.crop.circle.fill',
      onPress: () => router.push('/profile'),
    },
    {
      id: 'landDetails',
      title: language === 'ta' ? 'நில விவரங்கள்' : 'Land Details',
      icon: 'location.north.line.fill',
      onPress: () => router.push('/land-details'),
    },
    {
      id: 'bankDetails',
      title: language === 'ta' ? 'வங்கி விவரங்கள்' : 'Bank Details',
      icon: 'creditcard.fill',
      onPress: () => router.push('/bank-details'),
    },
    {
      id: 'language',
      title: t('language'),
      icon: 'globe.americas.fill',
      onPress: () => setLanguage(language === 'ta' ? 'en' : 'ta'),
      rightText: language === 'ta' ? 'தமிழ்' : 'English',
    },
    {
      id: 'logout',
      title: t('logout'),
      icon: 'power',
      onPress: handleLogout,
      isDestructive: true,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: t('settings'), headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient colors={['#718096', '#4a5568']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ThemedText style={styles.backArrow}>←</ThemedText>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <IconSymbol name="gearshape.fill" size={60} color="#ffffff" style={styles.headerIcon} />
            <ThemedText style={styles.title}>{t('settings')}</ThemedText>
            <ThemedText style={styles.subtitle}>{t('manage_preferences')}</ThemedText>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.settingsContainer}>
            {settingsOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.settingItem,
                  { backgroundColor: colorScheme === 'dark' ? '#1a202c' : '#ffffff' }
                ]}
                onPress={option.onPress}
                disabled={option.id === 'logout' && isLoggingOut}
              >
                <View style={styles.settingLeft}>
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: option.isDestructive ? '#fed7d7' : '#e6fffa' }
                  ]}>
                    <IconSymbol 
                      name={option.icon} 
                      size={20} 
                      color={option.isDestructive ? '#e53e3e' : '#38a169'} 
                    />
                  </View>
                  <ThemedText style={[
                    styles.settingTitle,
                    option.isDestructive && { color: '#e53e3e' }
                  ]}>
                    {option.title}
                  </ThemedText>
                </View>
                <View style={styles.settingRight}>
                  {option.rightText && (
                    <ThemedText style={styles.rightText}>{option.rightText}</ThemedText>
                  )}
                  {option.id === 'logout' && isLoggingOut ? (
                    <ThemedText style={styles.loadingText}>Logging out...</ThemedText>
                  ) : (
                    <IconSymbol name="chevron.right" size={16} color="#a0aec0" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingsContainer: {
    gap: 12,
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightText: {
    fontSize: 14,
    color: '#718096',
  },
  loadingText: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
  },
});