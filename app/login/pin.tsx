import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PinLogin() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const { t, language } = useLanguage();

  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // PIN is 4 digits — enable login only when mobile is 10 and PIN is exactly 4 digits
  const canLogin = mobileNumber.length === 10 && password.length === 4;

  // Use central BASE_URL from config instead of a static IP
  const PIN_LOGIN_URL = `${API_CONFIG.BASE_URL}/users/login/pin`;

  const handlePinLogin = async () => {
    if (!canLogin) return;
    setLoading(true);
    try {
      const res = await fetch(PIN_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_no: mobileNumber, password }),
      });
      const data = await res.json();
      if (res.ok && data?.status === 'success') {
        if (data.data?.token) await AsyncStorage.setItem('authToken', data.data.token);
        let roleName = 'farmer';
        if (data.data?.user) {
          await AsyncStorage.setItem('userId', String(data.data.user.id));
          roleName = data.data.user.role_id === 2 ? 'farmer' : data.data.user.role_id === 3 ? 'investor' : data.data.user.role_id === 4 ? 'serviceProvider' : 'farmer';
          await AsyncStorage.setItem('userRole', roleName);
          await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));
        }
        // Navigate to farmer-specific dashboard for farmers, otherwise the default dashboard
        if (roleName === 'farmer') {
          router.replace('/dashboard-farmer');
        } else {
          router.replace('/dashboard-farmer');
        }
      } else {
        Alert.alert(t('error'), data?.message || 'Login failed');
      }
    } catch (e) {
      Alert.alert(t('error'), 'Network error. Please try again.'+`${e as Error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: '', headerShown: false }} />

      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#061025' : '#ecfdf5' }]}> 
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={20} color="#274241" />
            <ThemedText style={styles.backText}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.cardWrap}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={styles.card}>
              <ThemedText style={styles.title}>{language === 'ta' ? 'PIN உடன் உள்நுழைய' : 'Login with PIN'}</ThemedText>

              <ThemedText style={styles.label}>{language === 'ta' ? 'மொபைல் எண்' : 'Mobile number'}</ThemedText>
              <TextInput
                style={styles.input}
                placeholder={'9876543210'}
                keyboardType="phone-pad"
                value={mobileNumber}
                onChangeText={(v) => setMobileNumber(v.replace(/[^0-9]/g, ''))}
                maxLength={10}
                placeholderTextColor="#9ca3af"
              />

              <ThemedText style={[styles.label, { marginTop: 6 }]}>{language === 'ta' ? 'PIN' : 'PIN'}</ThemedText>
              <TextInput
                style={styles.input}
                placeholder={'****'}
                keyboardType="number-pad"
                secureTextEntry
                value={password}
                onChangeText={(v) => setPassword(v.replace(/[^0-9]/g, '').slice(0, 4))}
                maxLength={4}
                placeholderTextColor="#9ca3af"
              />

              <TouchableOpacity
                style={[styles.loginButton, !canLogin && styles.loginButtonDisabled]}
                onPress={handlePinLogin}
                disabled={!canLogin || loading}
              >
                <ThemedText style={[styles.loginButtonText, !canLogin && styles.loginButtonTextDisabled]}>{language === 'ta' ? 'உள்நுழைவு' : 'Login'}</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/login/farmer')} style={{ marginTop: 12 }}>
                <ThemedText style={styles.forgotText}>{language === 'ta' ? 'PIN மறந்துவிட்டதா? OTP பயன்படுத்தவும்' : 'Forgot PIN? Use OTP'}</ThemedText>
              </TouchableOpacity>

            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topRow: {
    paddingTop: 44,
    paddingHorizontal: 16,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 8,
    color: '#274241',
  },
  cardWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingBottom: 80,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 22,
    alignItems: 'stretch',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
    color: '#083b2b',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#3b3b3b',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
    color: '#111827',
  },
  loginButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#0bb24c',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  loginButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  loginButtonTextDisabled: {
    color: '#fff',
    opacity: 0.9,
  },
  forgotText: {
    color: '#0bb24c',
    textAlign: 'center',
  },
});