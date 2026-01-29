import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useColorScheme,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { API_CONFIG } from '@/config/api';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const colorScheme = useColorScheme() ?? 'light';
  const { t, language, setLanguage } = useLanguage();
  const labelColor = colorScheme === 'dark' ? '#f7fafc' : '#2d3748';

  const isDisabled = !mobileNumber || (!otpSent ? false : !otp);
  const canRequestOtp = mobileNumber.length === 10;
  const inputTextColor = colorScheme === 'dark' ? Colors[colorScheme].text : '#432616';

  const handleSendOtp = async () => {
    if (!mobileNumber) {
      Alert.alert(t('error'), t('enter_mobile_error'));
      return;
    }
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/login/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZtFzBj2pjpajC4k5-jD3DyAXPOB1FdkFHvwR1LpBO29XQaUXH259QDlLBXm0sSkYIg_IRMT_BY9xkTu_IGJNuMS2flLYlyfEBIuyqIDStUjAtYRKsWNaN0fXi8EfP1cUVCquB3cxUzU9sGdonELs2jDoafZ7A4ttwasvHcXgvusBcG3y2M6jvhkfiE-Lh9i6EjtgdUxjwWbxp5mCdSRv-SACUFykNJA_btzDFXom2uZY1y0_a80NcGev5L9hJoQq3OXRWykfNBxBQIN48Imopf4sBdEIJ0_JulRF_fYrU4hN5hq7u1AJLK9w0wp3Hap_gvMYaPjlyE4IpLChsmRkpS4O0XEk5ZP8pmO3UNTuMUCvi13JGMHAAyBQoDaK14zyAEdAXN2OiS7ZA2ESYYRrX9Gytb6wYepNJOJsCXwt8XLBKcDD0gdMckEZgqYhtVWAxR_7FRVjWFRNzqTvsQCaIL5cdBTC8S1JAGZ1O2x1FDaYF1LgLHWHOESb9k0NNEw27Hj8vga_HSF6ziYqYG8vufB0NgrZWDjIIrZQEDolCYKt7n6b3xbb_BejhBXTUJFMwP0avy7g_tig-WDiOSVbDnP16deAHrLeokkxKVadRp2OIv7pEmKsPAsqxikv7Bbbs-c7YUU7-8i7Bu_v7dI9DkPdFjBSWFhDrZFKVGsFMKnWuH0n_wsdTMbeig1hn0GTB09T9v_QKRFy_qWnIoX84bOibBPZ-eUMJlvmUbvC52mfWJTI-CkcuqSLEY3I-FP9pOSLPL_L7ulLErZ5vVF4vge8w0Oe3k4mjm9BcSVkJGnVpD0qAg0NSX4IxmuCq3olryloxWZXEECLxMiMDg3SA01KsLFJC0w2dGYKTH8JQ3fknCyoMFVtwQvgMY9FBDFUy4du_EFKVJaKu4CYx6b78IR'
        },
        body: JSON.stringify({
          mobile_no: mobileNumber
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.otp) {
        setOtp(data.otp);
        setOtpSent(true);
      } else {
        Alert.alert(t('error'), data.message || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert(t('error'), 'Network error. Please try again.');
    }
  };

  const handleLogin = async () => {
    if (!otpSent) {
      handleSendOtp();
      return;
    }
    if (!otp) {
      Alert.alert(t('error'), t('enter_otp_error'));
      return;
    }
    
    try {
      console.log('Verifying OTP:', { mobile_no: mobileNumber, otp });
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/login/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': '.Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZtFzBj2pjpajC4k5-jD3DyAXPOB1FdkFHvwR1LpBO29XQaUXH259QDlLBXm0sSkYIg_IRMT_BY9xkTu_IGJNuMS2flLYlyfEBIuyqIDStUjAtYRKsWNaN0fXi8EfP1cUVCquB3cxUzU9sGdonELs2jDoafZ7A4ttwasvHcXgvusBcG3y2M6jvhkfiE-Lh9i6EjtgdUxjwWbxp5mCdSRv-SACUFykNJA_btzDFXom2uZY1y0_a80NcGev5L9hJoQq3OXRWykfNBxBQIN48Imopf4sBdEIJ0_JulRF_fYrU4hN5hq7u1AJLK9w0wp3Hap_gvMYaPjlyE4IpLChsmRkpS4O0XEk5ZP8pmO3UNTuMUCvi13JGMHAAyBQoDaK14zyAEdAXN2OiS7ZA2ESYYRrX9Gytb6wYepNJOJsCXwt8XLBKcDD0gdMckEZgqYhtVWAxR_7FRVjWFRNzqTvsQCaIL5cdBTC8S1JAGZ1O2x1FDaYF1LgLHWHOESb9k0NNEw27Hj8vga_HSF6ziYqYG8vufB0NgrZWDjIIrZQEDolCYKt7n6b3xbb_BejhBXTUJFMwP0avy7g_tig-WDiOSVbDnP16deAHrLeokkxKVadRp2OIv7pEmKsPAsqxikv7Bbbs-c7YUU7-8i7Bu_v7dI9DkPdFjBSWFhDrZFKVGsFMKnWuH0n_wsdTMbeig1hn0GTB09T9v_QKRFy_qWnIoX84bOibBPZ-eUMJlvmUbvC52mfWJTI-CkcuqSLEY3I-FP9pOSLPL_L7ulLErZ5vVF4vge8w0Oe3k4mjm9BcSVkJGnVpD0qAg0NSX4IxmuCq3olryloxWZXEECLxMiMDg3SA01KsLFJC0w2dGYKTH8JQ3fknCyoMFVtwQvgMY9FBDFUy4du_EFKVJaKu4CYx6b78IR'
        },
        body: JSON.stringify({
          mobile_no: mobileNumber,
          otp: otp
        })
      });
      
      const data = await response.json();
      console.log('OTP Verification Response:', { status: response.status, data });
      
      if (response.ok) {
        console.log('Login successful, storing token and navigating to dashboard');
        
        // Store token and user data
        if (data.data.token) {
          await AsyncStorage.setItem('authToken', data.data.token);
          console.log('✅ Token stored');
        }
        if (data.data.user) {
          await AsyncStorage.setItem('userId', data.data.user.id.toString());
          // Map role_id to role name: 2 = farmer, 3 = investor, etc.
          const roleName = data.data.user.role_id === 2 ? 'farmer' : 
                          data.data.user.role_id === 3 ? 'investor' : 
                          data.data.user.role_id === 4 ? 'serviceProvider' : 'farmer';
          await AsyncStorage.setItem('userRole', roleName);
          
          // Store complete user data for profile page
          await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));
          console.log('✅ Complete user data stored:', {
            id: data.data.user.id,
            name: data.data.user.fullname,
            role: roleName,
            mobile: data.data.user.mobile_no
          });
        }
        
        router.replace('/dashboard');
      } else {
        console.log('Login failed:', data.message);
        setErrorMessage(data.message || 'Invalid OTP. Please try again.');
        setOtp('');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(t('error'), 'Network error. Please try again.');
    }
  };

  return (
    <LinearGradient
      colors={colorScheme === 'dark' ? ['#1a365d', '#2d3748'] : ['#fdf7f2', '#fdf2e9']}
      style={styles.screenGradient}
    >
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexGrow}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.centerContainer}>
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#fffdfa' }]}>
              <View style={styles.avatar}>
                <LinearGradient
                  colors={['#b35418', '#682c14']}
                  style={styles.avatarGradient}
                >
                  <Image
                    source={require('@/assets/images/coconut-trees.png')}
                    contentFit="contain"
                    style={styles.coconutIcon}
                  />
                </LinearGradient>
              </View>

              <ThemedText style={styles.title}>{t('welcome_naam')}</ThemedText>
              <ThemedText style={styles.subtitle}>{t('signin_account')}</ThemedText>
              
              <View style={styles.inputWrapper}>
                <View style={styles.iconContainer}>
                  <ThemedText style={styles.iconText}>📞</ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      color: inputTextColor,
                    },
                  ]}
                  placeholder={t('enter_mobile_number')}
                  keyboardType="phone-pad"
                  value={mobileNumber}
                  onChangeText={(text) => {
                    setMobileNumber(text);
                    setErrorMessage('');
                  }}
                  placeholderTextColor="#ab9787"
                  editable={!otpSent}
                  returnKeyType="next"
                  maxLength={10}
                />
                <TouchableOpacity
                  style={[
                    styles.otpButton,
                    otpSent && styles.otpButtonSent,
                    !canRequestOtp && styles.otpButtonDisabled,
                  ]}
                  onPress={handleSendOtp}
                  disabled={!canRequestOtp}
                >
                  <ThemedText style={styles.otpButtonText}>
                    {otpSent ? t('resend_otp') : t('send_otp')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
              {errorMessage && !otpSent ? (
                <View style={styles.feedbackBubble}>
                  <ThemedText style={styles.feedbackText}>⚠ {errorMessage}</ThemedText>
                </View>
              ) : null}

              {otpSent && (
                <>
                  <View style={styles.inputWrapper}>
                    <View style={styles.iconContainer}>
                      <ThemedText style={styles.iconText}>🔐</ThemedText>
                    </View>
                    <TextInput
                      style={[
                        styles.inputField,
                        styles.otpInput,
                        {
                          color: inputTextColor,
                        },
                      ]}
                      placeholder={t('enter_6_digit_otp')}
                      keyboardType="number-pad"
                      value={otp}
                      onChangeText={setOtp}
                      placeholderTextColor="#ab9787"
                      maxLength={6}
                      returnKeyType="done"
                    />
                  </View>
                  <View style={styles.feedbackSuccess}>
                    <ThemedText style={styles.successCopy}>✓ {t('otp_sent')} - OTP: {otp}</ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.signInButton}
                    onPress={handleLogin}
                    disabled={isDisabled}
                  >
                    <LinearGradient
                      colors={isDisabled ? ['#c7b8ac', '#c7b8ac'] : ['#c8671f', '#5d2b11']}
                      style={styles.signInGradient}
                    >
                      <ThemedText style={styles.signInText}>{t('signin')}</ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.footerRow}>
                <ThemedText style={styles.footerCopy}>{t('no_account')}</ThemedText>
                <Link href="/register">
                  <ThemedText style={styles.footerLink}>{t('join_naam')}</ThemedText>
                </Link>
              </View>
              <View style={styles.footerRow}>
                
                <Link href="/login/farmer">
                  <ThemedText style={styles.footerLink}>{t('join_farmer')}</ThemedText>
                </Link>
              </View>

            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screenGradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  flexGrow: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: width > 420 ? 380 : '100%',
    borderRadius: 10,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: '#b07c4a',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 32,
    elevation: 2,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatarGradient: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coconutIcon: {
    width: 50,
    height: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#432616',
  },
  subtitle: {
    textAlign: 'center',
    color: '#a07755',
    marginTop: 8,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#fff5ee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  inputField: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 16,
    height: 48,
  },
  otpButton: {
    backgroundColor: '#c8671f',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  otpButtonSent: {
    backgroundColor: '#54240d',
  },
  otpButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  otpButtonDisabled: {
    opacity: 0.5,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 16,
  },
  feedbackBubble: {
    backgroundColor: '#ffe8e3',
    padding: 12,
    borderRadius: 12,
    borderLeftColor: '#c0392b',
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  feedbackText: {
    color: '#c0392b',
    fontWeight: '600',
  },
  feedbackSuccess: {
    backgroundColor: '#f1faef',
    padding: 12,
    borderRadius: 12,
    borderLeftColor: '#2f855a',
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  successCopy: {
    color: '#2f855a',
    fontWeight: '600',
  },
  signInButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 4,
  },
  signInGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 20,
  },
  signInText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerCopy: {
    color: '#7b6758',
  },
  footerLink: {
    color: '#c8671f',
    fontWeight: '700',
    marginLeft: 6,
  },

  languageButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});