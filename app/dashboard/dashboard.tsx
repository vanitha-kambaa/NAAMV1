import FarmerBottomNav from '@/components/farmer-bottom-nav';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function FarmerDashboard() {
  const { language } = useLanguage();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.hamburger} onPress={() => { /* open menu */ }}>
          <Ionicons name="menu" size={20} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.topAppBarTitle}>NAAM</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      {/* Info strip */}
      <View style={styles.infoStripRow}>
        <ThemedText style={styles.infoStripText}>{language === 'ta' ? 'உங்கள் சுயவிவரம் 85% முழுமையாக்க' : 'Your profile is 85% complete'}</ThemedText>
        <TouchableOpacity style={styles.infoStripAction} activeOpacity={0.8} onPress={() => { /* complete action */ }}>
          <ThemedText style={styles.infoStripActionText}>{language === 'ta' ? 'முழுமையாக்க' : 'Complete'}</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Price card */}
        <View style={styles.priceCardWrap}>
          <View style={styles.priceCard}>
            <View style={styles.priceCardHeader}>
              <View style={styles.priceCardHeaderLeft}>
                <View style={styles.priceBadge}>
                  <IconSymbol name="leaf.fill" size={14} color="#ffffff" />
                </View>
                <ThemedText style={styles.priceCardTitle}>{language === 'ta' ? 'தேங்காய் விலை' : 'Coconut Price'}</ThemedText>
              </View>
              <TouchableOpacity style={styles.priceCardMenu} onPress={() => { /* placeholder */ }}>
                <IconSymbol name="chevron.down" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.priceTilesRow}>
              <View style={styles.priceTile}>
                <ThemedText style={styles.priceTileTitle}>{language === 'ta' ? 'பச்சை தேங்காய்' : 'Green Coconut'}</ThemedText>
                <ThemedText style={styles.priceTileValue}>₹15.5</ThemedText>
              </View>
              <View style={styles.priceTile}>
                <ThemedText style={styles.priceTileTitle}>{language === 'ta' ? 'சுத்தம் செய்யப்பட்ட' : 'Processed'}</ThemedText>
                <ThemedText style={styles.priceTileValue}>₹18</ThemedText>
              </View>
              <View style={styles.priceTile}>
                <ThemedText style={styles.priceTileTitle}>{language === 'ta' ? 'தொகுதி (பேர்டன்)' : 'Bulk (Per Ton)'}</ThemedText>
                <ThemedText style={styles.priceTileValue}>₹185</ThemedText>
              </View>
            </View>

            <View style={styles.priceCardFooter}>
              <ThemedText style={styles.priceCardDate}>30 டிசம்பர் 2025</ThemedText>
              <TouchableOpacity style={styles.priceHistoryButton} onPress={() => router.push('/price-history' as any)}>
                <ThemedText style={styles.priceHistoryText}>{language === 'ta' ? 'விலை வரலாறு' : 'Price history'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Blue info box */}
        <View style={styles.infoBox}>
          <View style={styles.infoBoxLeft}><IconSymbol name="info.circle" size={18} color="#2b6cb0" /></View>
          <ThemedText style={styles.infoBoxText}>{language === 'ta' ? 'இந்த பருவத்துக்கு உற்பத்தி தயாரா? விவரங்களை கற்றுக் கொள்ளுங்கள்.' : 'Is your farm prepared this season? Learn how to get started.'}</ThemedText>
          <TouchableOpacity style={styles.infoBoxClose} onPress={() => {}}>
            <ThemedText style={{ color: '#2b6cb0' }}>✕</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Poll card */}
        <View style={styles.pollCardWrap}>
          <View style={styles.pollCard}>
            <ThemedText style={styles.pollTitle}>{language === 'ta' ? 'கருத்துக்கணிப்பு' : 'Poll'}</ThemedText>
            <ThemedText style={styles.pollQuestion}>{language === 'ta' ? 'இந்த பவர்தத்தில் உங்கள் தேங்காய் விலை நிலைமையே எப்படி உள்ளது?' : "How's your coconut price situation this month?"}</ThemedText>

            {[(language === 'ta' ? 'மிகவும் நன்றாக உள்ளது' : 'Very Good'), (language === 'ta' ? 'நன்றாக உள்ளது' : 'Good'), (language === 'ta' ? 'சராசிரியாக உள்ளது' : 'Average'), (language === 'ta' ? 'மோசமாக உள்ளது' : 'Poor')].map((opt, i) => (
              <TouchableOpacity key={i} style={styles.pollOption} activeOpacity={0.8}>
                <View style={styles.radio} />
                <ThemedText style={styles.pollOptionText}>{opt}</ThemedText>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.pollSubmitDisabled} disabled>
              <ThemedText style={styles.pollSubmitTextDisabled}>{language === 'ta' ? 'பதில் அனுப்பு' : 'Submit'}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer note */}
        <View style={styles.noteBox}>
          <ThemedText style={styles.noteText}>{language === 'ta' ? 'உங்கள் விவசாயம் தயாரா என்பதை சரிபார்க்க உதவிகள் உள்ளன.' : 'Quick tips to prepare your farm are available.'}</ThemedText>
        </View>
      </ScrollView>

      {/* Bottom nav (shared) */}
      <FarmerBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  topAppBar: { height: 56, backgroundColor: '#0f6b36', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  hamburger: { width: 36, alignItems: 'center', justifyContent: 'center' },
  topAppBarTitle: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  infoStripRow: { backgroundColor: '#fff6e0', marginHorizontal: 12, marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#fff0c7' },
  infoStripText: { color: '#8a6b00', fontSize: 14 },
  infoStripAction: { backgroundColor: '#ffe6b3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  infoStripActionText: { color: '#8a6b00', fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingVertical: 16, alignItems: 'center', paddingBottom: 140 },
  priceCardWrap: { alignItems: 'center', width: '100%' },
  priceCard: { width: '100%', maxWidth: 520, backgroundColor: '#0bb24c', borderRadius: 12, padding: 16, elevation: 6 },
  priceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  priceCardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  priceBadge: { width: 34, height: 34, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  priceCardTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },
  priceCardMenu: { padding: 6 },
  priceTilesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceTile: { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: 6, alignItems: 'center', minHeight: 72 },
  priceTileTitle: { color: '#0b6b38', fontSize: 12 },
  priceTileValue: { color: '#0b6b38', fontWeight: '700', marginTop: 6 },
  priceCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceCardDate: { color: '#e6f9ee' },
  priceHistoryButton: { backgroundColor: '#ffffff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  priceHistoryText: { color: '#0a8a3a', fontWeight: '700' },
  infoBox: { width: '100%', maxWidth: 520, backgroundColor: '#eaf6ff', borderRadius: 10, padding: 12, marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  infoBoxLeft: { width: 36, alignItems: 'center', justifyContent: 'center' },
  infoBoxText: { flex: 1, color: '#1e3a8a' },
  infoBoxClose: { marginLeft: 8, padding: 6 },
  pollCardWrap: { alignItems: 'center', marginTop: 18 },
  pollCard: { width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 12, padding: 18, elevation: 4 },
  pollTitle: { textAlign: 'center', fontWeight: '700', fontSize: 14, color: '#6b46c1', marginBottom: 6 },
  pollQuestion: { textAlign: 'left', color: '#374151', marginBottom: 12 },
  pollOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e6eef8', paddingHorizontal: 14, marginBottom: 8, backgroundColor: '#ffffff' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#cbd5e1', marginRight: 12 },
  pollOptionText: { color: '#374151' },
  pollSubmitDisabled: { marginTop: 12, backgroundColor: '#d1d5db', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  pollSubmitTextDisabled: { color: '#fff', fontWeight: '700' },
  noteBox: { width: '100%', maxWidth: 520, marginTop: 12, backgroundColor: '#fff8f0', padding: 12, borderRadius: 10 },
  noteText: { color: '#8a6b00' },
  bottomNav: { flexDirection: 'row', paddingTop: 12, paddingBottom: 20, paddingHorizontal: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 8, justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#ffffff' },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  navLabel: { fontSize: 12, fontWeight: '500', marginTop: 4 }
});