import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

const QUALITY_OPTIONS = [
  { value: 'good', labelEn: 'Good', labelTa: 'சிறந்த' },
  { value: 'average', labelEn: 'Average', labelTa: 'சராசரி' },
  { value: 'damaged', labelEn: 'Damaged', labelTa: 'சேதமான' },
];

export default function AddCollectionEntry() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const { language, t } = useLanguage();
  const params = useLocalSearchParams<{ farmerId?: string; landId?: string; farmerName?: string }>();

  const farmerId = Number(params.farmerId);
  const landId = Number(params.landId);
  const farmerName = params.farmerName || '';

  const [collectionCount, setCollectionCount] = useState('');
  const [pricePerCoconut, setPricePerCoconut] = useState('');
  const [qualityStatus, setQualityStatus] = useState<'good' | 'average' | 'damaged'>('good');
  const [token, setToken] = useState<string | null>(null);
  const [investorId, setInvestorId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const themedColors = useMemo(() => Colors[colorScheme], [colorScheme]);

  useEffect(() => {
    const loadAuth = async () => {
      const [storedToken, storedInvestorId] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('userId'),
      ]);

      if (!storedToken || !storedInvestorId) {
        Alert.alert(
          language === 'ta' ? 'உள்நுழைவு தேவை' : 'Authentication required',
          language === 'ta'
            ? 'தொடர உள்நுழைவு விவரங்கள் தேவை.'
            : 'Missing login information. Please sign in again.'
        );
        router.back();
        return;
      }

      setToken(storedToken);
      setInvestorId(Number(storedInvestorId));
    };

    loadAuth();
  }, [language, router]);

  const handleSubmit = async () => {
    if (!token || !investorId) {
      Alert.alert('Auth error', 'Unable to find user token.');
      return;
    }

    if (!farmerId || !landId) {
      Alert.alert('Invalid data', 'Farmer or land information is missing.');
      return;
    }

    const countNumber = Number(collectionCount);
    const priceNumber = Number(pricePerCoconut);

    if (Number.isNaN(countNumber) || countNumber <= 0) {
      Alert.alert(language === 'ta' ? 'தவறான எண்ணிக்கை' : 'Invalid count', t('enter_number_trees'));
      return;
    }

    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      Alert.alert(
        language === 'ta' ? 'தவறான விலை' : 'Invalid price',
        language === 'ta' ? 'ஒரு தேங்காய்க்கான விலையை உள்ளிடவும்.' : 'Enter a price per coconut.'
      );
      return;
    }

    try {
      setSubmitting(true);
      await apiService.createCollectionEntry(
        {
          farmer_id: farmerId,
          land_id: landId,
          invester_id: investorId,
          collection_count: countNumber,
          price_per_coconut: priceNumber,
          quallity_status: qualityStatus,
        },
        token
      );

      Alert.alert(
        language === 'ta' ? 'வெற்றிகரமாக சேர்க்கப்பட்டது' : 'Entry added',
        language === 'ta'
          ? 'புதிய தேங்காய் பதிவு வெற்றிகரமாக சேமிக்கப்பட்டது.'
          : 'Coconut collection entry saved successfully.',
        [
          {
            text: language === 'ta' ? 'சரி' : 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        language === 'ta' ? 'பதிவு தோல்வியடைந்தது' : 'Failed to save entry',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const qualityButtonLabel = (value: string) => {
    const option = QUALITY_OPTIONS.find((opt) => opt.value === value);
    if (!option) return value;
    return language === 'ta' ? option.labelTa : option.labelEn;
  };

  return (
    <View style={[styles.container, { backgroundColor: themedColors.background }]}>
      <Stack.Screen
        options={{
          title: language === 'ta' ? 'தேங்காய் பதிவு' : 'Add Coconut Entry',
          presentation: 'modal',
        }}
      />
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <ThemedText style={styles.headerTitle}>
          {language === 'ta' ? 'விவசாயி :' : 'Farmer:'} {farmerName || `#${farmerId}`}
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          {language === 'ta'
            ? 'சேகரிப்பு விவரங்களை நிரப்பவும்.'
            : 'Fill in the collection details below.'}
        </ThemedText>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.formWrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              {language === 'ta' ? 'சேகரிப்பு எண்ணிக்கை' : 'Collection Count'}
            </ThemedText>
            <TextInput
              value={collectionCount}
              onChangeText={setCollectionCount}
              keyboardType="numeric"
              placeholder={language === 'ta' ? 'எண்ணிக்கையை உள்ளிடவும்' : 'Enter count'}
              style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff' }]}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              {language === 'ta' ? 'ஒரு தேங்காய் விலை' : 'Price per Coconut'}
            </ThemedText>
            <TextInput
              value={pricePerCoconut}
              onChangeText={setPricePerCoconut}
              keyboardType="decimal-pad"
              placeholder={language === 'ta' ? 'விலையை உள்ளிடவும்' : 'Enter price'}
              style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff' }]}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              {language === 'ta' ? 'தரம்' : 'Quality'}
            </ThemedText>
            <View style={styles.qualityRow}>
              {QUALITY_OPTIONS.map((option) => {
                const isActive = qualityStatus === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.qualityPill, isActive && styles.qualityPillActive]}
                    onPress={() => setQualityStatus(option.value as typeof qualityStatus)}
                  >
                    <ThemedText style={[styles.qualityPillText, isActive && styles.qualityPillTextActive]}>
                      {language === 'ta' ? option.labelTa : option.labelEn}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.submitButtonText}>
                {language === 'ta' ? 'பதிவு சேமிக்க' : 'Save Entry'}
              </ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  formWrapper: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  qualityPill: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    paddingVertical: 10,
    alignItems: 'center',
  },
  qualityPillActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  qualityPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  qualityPillTextActive: {
    color: '#fff',
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 16,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

