import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function FarmerLogin() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const { t, language } = useLanguage();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;

  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const canRequestOtp = mobileNumber.length === 10;
  const isDisabled = otpSent ? otpDigits.join('').length !== 6 : !mobileNumber;

  const digitRefs = useRef<Array<TextInput | null>>([]);

  // Request OTP endpoint (use BASE_URL from config)
  const REQUEST_OTP_URL = `${API_CONFIG.BASE_URL}/users/login/request-otp`;
  // Verify OTP endpoint (use BASE_URL from config)
  const VERIFY_OTP_URL = `${API_CONFIG.BASE_URL}/users/login/verify-otp`;

  const handleSendOtp = async () => {
    if (!mobileNumber) {
      Alert.alert(t('error'), t('enter_mobile_error'));
      return;
    }

    try {
      const response = await fetch(REQUEST_OTP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_no: mobileNumber }),
      });
      const data = await response.json();

      // API may return { status, message, data: { mobile_no, otp } }
      const otpStr = data?.data?.otp ?? data?.otp; // be defensive

      if (response.ok && otpStr) {
        // Prefill OTP digits for testing
        const digits = String(otpStr).padEnd(6, '0').slice(0, 6).split('');
        setOtpDigits(digits);
        setOtp(digits.join(''));
        setOtpSent(true);
        setSecondsRemaining(30); // start countdown (30s)
        // focus first input
        setTimeout(() => digitRefs.current[0]?.focus(), 200);
      } else {
        Alert.alert(t('error'), data?.message || 'Failed to send OTP');
      }
    } catch (e) {
      Alert.alert(t('error'), 'Network error. Please try again.');
    }
  };

  // Timer for resend countdown
  useEffect(() => {
    if (!otpSent) return;
    if (secondsRemaining <= 0) return;
    const id = setInterval(() => {
      setSecondsRemaining((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [otpSent, secondsRemaining]);

  const handleLogin = async (otpValue?: string) => {
    if (!otpSent) {
      handleSendOtp();
      return;
    }

    const otpToVerify = otpValue ?? otp ?? otpDigits.join('');
    if (!otpToVerify || otpToVerify.length !== 6) {
      Alert.alert(t('error'), t('enter_otp_error'));
      return;
    }

    try {
      const response = await fetch(VERIFY_OTP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_no: mobileNumber, otp: otpToVerify }),
      });
      const data = await response.json();

      if (response.ok && data?.status === 'success') {
        // store token and user info
        if (data.data?.token) await AsyncStorage.setItem('authToken', data.data.token);
        let roleName = 'farmer';
        if (data.data?.farmer) {
          await AsyncStorage.setItem('userId', String(data.data.farmer.id));
          roleName = data.data.farmer.role_id === 2 ? 'farmer' : data.data.farmer.role_id === 3 ? 'investor' : data.data.farmer.role_id === 4 ? 'serviceProvider' : 'farmer';
          await AsyncStorage.setItem('userRole', roleName);
          await AsyncStorage.setItem('userData', JSON.stringify(data.data.farmer));
          await AsyncStorage.setItem('UserInfo', String(data.data.farmer.farmer));
        } else if (data.data?.user) {
          await AsyncStorage.setItem('userId', String(data.data.user.id));
          roleName = data.data.user.role_id === 2 ? 'farmer' : data.data.user.role_id === 3 ? 'investor' : data.data.user.role_id === 4 ? 'serviceProvider' : 'farmer';
          await AsyncStorage.setItem('userRole', roleName);
          await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));
          await AsyncStorage.setItem('UserInfo', String(data.data.user.farmer));
        }
        // Store profile_images if available
        if (data.data?.profile_images && Array.isArray(data.data.profile_images)) {
          await AsyncStorage.setItem('profile_images', JSON.stringify(data.data.profile_images));
        }
        // Navigate to farmer-specific dashboard for farmers, otherwise the default dashboard
        if (roleName === 'farmer') {
          router.replace('/dashboard-farmer');
        } else {
          router.replace('/dashboard-farmer');
        }
      } else {
        Alert.alert(t('error'), data?.message || 'Invalid OTP');
        setOtp('');
        setOtpDigits(['', '', '', '', '', '']);
      }
    } catch (e) {
      Alert.alert(t('error'), 'Network error. Please try again.');
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
          <KeyboardAwareScrollView contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center', // 👈 CENTER vertically
        alignItems: 'center',     // 👈 CENTER horizontally (optional)
      }}
      style={{ width: '100%' }}
      enableOnAndroid
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
            
            {!otpSent && (
              <>
                <ThemedText style={styles.label}>{language === 'ta' ? 'மொபைல் எண்' : 'Mobile number'}</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder={'9876543210'}
                  keyboardType="phone-pad"
                  value={mobileNumber}
                  onChangeText={(v) => { setMobileNumber(v.replace(/[^0-9]/g, '')); setErrorMessage(''); }}
                  maxLength={10}
                  placeholderTextColor="#9ca3af"
                />

                <TouchableOpacity
                  style={[styles.otpButton, !canRequestOtp && styles.otpButtonDisabled]}
                  onPress={handleSendOtp}
                  disabled={!canRequestOtp}
                >
                  <ThemedText style={[styles.otpButtonText, !canRequestOtp && styles.otpButtonTextDisabled]}>{language === 'ta' ? 'OTP பெறுக' : 'Get OTP'}</ThemedText>
                </TouchableOpacity>
              </>
            )}

              {otpSent && (
                <View style={{ marginTop: 12, width: '100%', alignItems: 'center' }}>
                  <ThemedText style={[styles.otpTitle]}>{language === 'ta' ? 'OTP உள்ளிடவும்' : 'Enter OTP'}</ThemedText>
                  <ThemedText style={[styles.otpSubtitle]}>{language === 'ta' ? `${mobileNumber} க்கு OTP அனுப்பப்பட்டது` : `OTP sent to ${mobileNumber}`}</ThemedText>

                  <View style={styles.otpBoxesRow}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TextInput
                        key={i}
                        ref={(ref) => { digitRefs.current[i] = ref; }}
                        style={styles.otpBox}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={otpDigits[i]}
                        onChangeText={(ch) => {
                          const c = ch.replace(/[^0-9]/g, '');
                          const next = [...otpDigits];
                          next[i] = c;
                          setOtpDigits(next);
                          if (c && i < 5) {
                            digitRefs.current[i + 1]?.focus();
                          }
                          // update combined otp for verification
                          setOtp(next.join(''));
                        }}
                        placeholder=" "
                        placeholderTextColor="#b3b3b3"
                        textAlign="center"
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.confirmButton, isDisabled && styles.confirmButtonDisabled]}
                    onPress={() => {
                      // join digits and verify
                      const joined = otpDigits.join('');
                      setOtp(joined);
                      handleLogin(joined);
                    }}
                    disabled={isDisabled}
                  >
                    <ThemedText style={[styles.confirmButtonText, isDisabled && styles.confirmButtonTextDisabled]}>{language === 'ta' ? 'சமர்ப்பிக்கவும்' : 'Confirm'}</ThemedText>
                  </TouchableOpacity>

                  {secondsRemaining > 0 ? (
                    <Text style={styles.resendCopy}>{language === 'ta' ? `${secondsRemaining} வினாடிகளில் மீண்டும் அனுப்பவும்` : `Resend available in ${secondsRemaining}s`}</Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp} style={{ marginTop: 8 }}>
                      <Text style={[styles.resendCopy, { textDecorationLine: 'underline' }]}>{language === 'ta' ? 'OTP ஐ மீண்டும் அனுப்புக' : 'Resend OTP'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

            </View>
          </KeyboardAwareScrollView>
        </View>
      </View>
    </>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topRow: {
    paddingTop: 44,
    paddingHorizontal: isSmallScreen ? 14 : 16,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 8,
    color: '#274241',
    fontSize: isSmallScreen ? 14 : 16,
  },
  cardWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isSmallScreen ? 14 : 18,
    paddingBottom: isSmallScreen ? 60 : 80,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: isSmallScreen ? 10 : 12,
    padding: isSmallScreen ? 18 : 22,
    alignItems: 'stretch',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
  title: {
    fontSize: isSmallScreen ? 20 : 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: isSmallScreen ? 16 : 18,
    color: '#083b2b',
  },
  label: {
    fontSize: isSmallScreen ? 13 : 14,
    marginBottom: 8,
    color: '#3b3b3b',
  },
  input: {
    height: isSmallScreen ? 44 : 48,
    borderRadius: isSmallScreen ? 10 : 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: isSmallScreen ? 12 : 14,
    backgroundColor: '#fff',
    marginBottom: 12,
    color: '#111827',
    fontSize: isSmallScreen ? 15 : 16,
  },
  otpButton: {
    height: isSmallScreen ? 48 : 52,
    borderRadius: isSmallScreen ? 10 : 12,
    backgroundColor: '#0bb24c',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  otpButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  otpButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: isSmallScreen ? 15 : 16,
  },
  otpButtonTextDisabled: {
    color: '#fff',
    opacity: 0.9,
  },

  /* OTP entry styles */
  otpTitle: {
    fontSize: isSmallScreen ? 20 : 22,
    fontWeight: '700',
    color: '#083b2b',
    marginBottom: 8,
  },
  otpSubtitle: {
    color: '#6b6b6b',
    marginBottom: 14,
    fontSize: isSmallScreen ? 13 : 14,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
    marginBottom: isSmallScreen ? 16 : 18,
    paddingHorizontal: isSmallScreen ? 8 : 16,
    gap: isSmallScreen ? 6 : 8,
  },
  otpBox: {
    width: isSmallScreen ? 48 : 54,
    height: isSmallScreen ? 48 : 54,
    borderRadius: isSmallScreen ? 10 : 12,
    borderWidth: 2,
    borderColor: '#e6e6e9',
    textAlign: 'center',
    fontSize: isSmallScreen ? 18 : 20,
    backgroundColor: '#fff',
    flex: 1,
    maxWidth: isSmallScreen ? 48 : 54,
  },
  confirmButton: {
    width: '100%',
    height: isSmallScreen ? 52 : 56,
    borderRadius: isSmallScreen ? 14 : 16,
    backgroundColor: '#0bb24c',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  confirmButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: isSmallScreen ? 16 : 18,
  },
  confirmButtonTextDisabled: {
    color: '#fff',
    opacity: 0.9,
  },
  resendCopy: {
    marginTop: 12,
    color: '#6b6b6b',
  },
});