import { Link, Stack, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginChoice() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDarkMode = colorScheme === 'dark';
  const { t, language } = useLanguage();

  return (
    <>
      <Stack.Screen options={{ title: '', headerShown: false }} />

      <View style={[styles.container, { backgroundColor: isDarkMode ? '#061025' : '#ecfdf5' }]}> 
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={20} color="#274241" />
            <ThemedText style={styles.backText}>{language === 'ta' ? 'பின்னெல்' : 'Back'}</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <ThemedText style={styles.title}>{language === 'ta' ? 'உள்நுழைவு' : 'Login'}</ThemedText>

            <Link href="/login/farmer" asChild>
              <TouchableOpacity style={styles.otpButton}>
                <View style={styles.otpInner}>
                  <IconSymbol name="phone.fill" size={22} color="#fff" />
                  <ThemedText style={styles.otpText}>{language === 'ta' ? 'OTP உடன் உள்நுழைய' : 'Login with OTP'}</ThemedText>
                </View>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity style={styles.pinButton} onPress={() => router.push('/login/pin' as any)}>
              <View style={styles.pinInner}>
                <IconSymbol name="eye.fill" size={20} color="#0bb24c" />
                <ThemedText style={styles.pinText}>{language === 'ta' ? 'PIN உடன் உள்நுழைய' : 'Login with PIN'}</ThemedText>
              </View>
            </TouchableOpacity>

            <Link href="/register/new" asChild>
              <TouchableOpacity style={styles.registerLink}>
                <ThemedText style={styles.registerText}>{language === 'ta' ? 'புதிய பயனரா? பதிவு செய்யவும்' : 'New user? Register'}</ThemedText>
              </TouchableOpacity>
            </Link>

          </View>
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
    padding: 28,
    alignItems: 'center',
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 25,
    color: '#083b2b',
  },
  otpButton: {
    width: '100%',
    backgroundColor: '#0bb24c',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  otpInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  otpText: {
    marginLeft: 10,
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  pinButton: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#0bb24c',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: '#fff',
  },
  pinInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinText: {
    marginLeft: 10,
    color: '#0bb24c',
    fontWeight: '700',
    fontSize: 16,
  },
  registerLink: {
    marginTop: 6,
  },
  registerText: {
    color: '#0bb24c',
  },
});
