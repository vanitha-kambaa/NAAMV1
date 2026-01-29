import FarmerBottomNav from '@/components/farmer-bottom-nav';
import { useSideMenu } from '@/components/SideMenu';
import { ThemedText } from '@/components/themed-text';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

// RemoteImage helper (local fallback)
function RemoteImage({ uri, style, resizeMode }: { uri?: string; style?: any; resizeMode?: any }) {
    const [failed, setFailed] = React.useState(false);
    const src = !uri || failed ? require('../../assets/images/coconut-trees.png') : { uri };
    return <Image source={src} style={style} resizeMode={resizeMode} onError={() => setFailed(true)} />;
}

export default function AdDetail() {
    const { language } = useLanguage();
    const { open: openSideMenu } = useSideMenu();
    const params = useLocalSearchParams();
    const id = params?.id as string | undefined;
    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Loan application modal state
    const [loanModalVisible, setLoanModalVisible] = useState(false);
    const [loanType, setLoanType] = useState<string>('டிராக்டர்');
    const [preferredBrand, setPreferredBrand] = useState<string>('');
    const [minBudget, setMinBudget] = useState<string>('50000');
    const [maxBudget, setMaxBudget] = useState<string>('200000');
    const [expectedPeriod, setExpectedPeriod] = useState<string>('1 மாதத்திற்குள்');
    const [additionalNotes, setAdditionalNotes] = useState<string>('');
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
    const [loanSubmitting, setLoanSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = await AsyncStorage.getItem('authToken');

                let res = await fetch(`${API_CONFIG.BASE_URL}/news-events/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                const json = await res.json();
                if (res.ok && (json?.status === 'success' || json?.success === true) && json?.data) {
                    setData(json.data);
                } else {
                    setError(json?.message || 'Failed to load details');
                }

                // Increment view count
                try {
                    await fetch(`${API_CONFIG.BASE_URL}/upcoming-events/${id}/view`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    });
                } catch (vErr) {
                    console.log('View increment error', vErr);
                }

            } catch (e) {
                console.log('Ad fetch error', e);
                setError('Failed to load ad');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [data?.id]);

    const formatDateIST = (iso?: string) => {
        if (!iso) return '';
        try {
            const locale = language === 'ta' ? 'ta-IN' : 'en-IN';
            const d = new Date(iso);
            return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
        } catch (e) {
            return iso;
        }
    };

    const handleLike = async () => {
        if (!id || !data) return;
        try {
            // Optimistic update
            setData((prev: any) => ({ ...prev, likes: (prev?.likes || 0) + 1 }));

            const token = await AsyncStorage.getItem('authToken');
            await fetch(`${API_CONFIG.BASE_URL}/news-events/${id}/like`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
        } catch (e) {
            console.log('Like error', e);
        }
    };

    const handleShare = async () => {
        if (!id || !data) return;
        try {
            // Optimistic update (coerce to number to avoid string concatenation e.g. "3"+1 => "31")
            setData((prev: any) => ({ ...prev, share: Number(prev?.share ?? 0) + 1 }));

            // Call Share API
            const token = await AsyncStorage.getItem('authToken');
            fetch(`${API_CONFIG.BASE_URL}/news-events/${id}/share`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            }).catch(err => console.log('Share API error', err));

            // Open System Share
            const title = language === 'ta' ? (data.event_name_tamil ?? data.event_name) : (data.event_name ?? '');
            const description = language === 'ta' ? (data.description_tamil ?? data.description) : (data.description ?? '');
            const link = data.read_moreurl ?? '';

            // Format message: Title \n Description \n Link
            const message = `${title}\n${description}\n${link}`.trim();

            await Share.share({
                message: message,
            });

        } catch (e) {
            console.log('Share error', e);
        }
    };

    const submitLoanApplication = async () => {
        try {
            setLoanSubmitting(true);
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'அங்கீகாரம் கிடைக்கவில்லை' : 'Authorization not found');
                return;
            }

            // Map purchase period from Tamil to English
            const purchasePeriodMap: Record<string, string> = {
                '1 மாதத்திற்குள்': 'Wholesale',
                '2-3 மாதங்களில்': 'Retail',
                '3-6 மாதங்களில்': 'Retail',
                '6 மாதங்களுக்கு மேல்': 'Retail',
            };

            // Map category
            const categoryMap: Record<string, string> = {
                'டிராக்டர்': 'Tracktor',
            };

            const purchasePeriod = purchasePeriodMap[expectedPeriod] || 'Wholesale';
            const category = categoryMap[loanType] || 'Tracktor';

            const requestBody = {
                category: category,
                brand: preferredBrand.trim() || '',
                minbudget: parseInt(minBudget) || 0,
                maxbudget: parseInt(maxBudget) || 0,
                purchase: purchasePeriod,
                addtionalnotes: additionalNotes.trim() || '',
            };

            const response = await fetch(`${API_CONFIG.BASE_URL}/adforms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            const json = await response.json().catch(() => null);

            if (response.ok && (json?.status === 'success' || json?.success === true)) {
                Alert.alert(
                    language === 'ta' ? 'வெற்றி' : 'Success',
                    language === 'ta' ? 'உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது' : 'Your application has been submitted successfully',
                    [
                        {
                            text: language === 'ta' ? 'சரி' : 'OK',
                            onPress: () => {
                                setLoanModalVisible(false);
                                setShowTypeDropdown(false);
                                setShowPeriodDropdown(false);
                                // Reset form
                                setPreferredBrand('');
                                setMinBudget('50000');
                                setMaxBudget('200000');
                                setExpectedPeriod('1 மாதத்திற்குள்');
                                setAdditionalNotes('');
                            },
                        },
                    ]
                );
            } else {
                const errorMessage = json?.message || json?.error || (language === 'ta' ? 'விண்ணப்பம் சமர்ப்பிப்பதில் பிழை ஏற்பட்டது' : 'Failed to submit application');
                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', errorMessage);
            }
        } catch (e) {
            console.log('Loan application submit error', e);
            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'விண்ணப்பம் சமர்ப்பிப்பதில் பிழை ஏற்பட்டது' : 'Failed to submit application');
        } finally {
            setLoanSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: language === 'ta' ? 'விளம்பரம்' : 'Ad', headerShown: false }} />

            {/* Top bar */}
            <View style={styles.topAppBar}>
                <TouchableOpacity style={styles.hamburger} onPress={() => openSideMenu()}>
                    <Ionicons name="menu" size={20} color="#ffffff" />
                </TouchableOpacity>
                <Image
                    source={
                        language === 'ta'
                            ? require('../../assets/images/naam-logo-ta.png')
                            : require('../../assets/images/naam-logo-en.png')
                    }
                    style={styles.topAppBarLogo}
                    resizeMode="contain"
                />
                <View style={{ width: 36 }} />
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 24 }} />
            ) : error ? (
                <ThemedText style={{ margin: 16, color: '#dc2626' }}>{error}</ThemedText>
            ) : data ? (
                <View style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
                        <View style={styles.heroWrap}>
                            <TouchableOpacity style={{ position: 'absolute', left: 12, top: 12, zIndex: 20 }} onPress={() => router.back()}>
                                <Ionicons name="arrow-back" size={22} color="#fff" />
                            </TouchableOpacity>

                            <RemoteImage uri={data.image_url && data.image_url.startsWith('http') ? data.image_url : (data.image_url ? `${API_CONFIG.UPLOADS_URL}/news/${data.image_url}` : undefined)} style={styles.heroImage} resizeMode="cover" />
                            <View style={styles.typePill}><ThemedText style={styles.typePillText}>{language === 'ta' ? (data.type_tamil ?? data.type ?? '') : (data.type ?? '')}</ThemedText></View>
                        </View>

                        <View style={styles.container}>
                            <ThemedText style={styles.title}>{language === 'ta' ? (data.event_name_tamil ?? data.event_name) : data.event_name}</ThemedText>
                            {(language === 'ta' ? (data.news_for_tamil ?? data.news_for) : data.news_for) ? (
                                <ThemedText style={styles.subTitle}>{language === 'ta' ? (data.news_for_tamil ?? data.news_for) : (data.news_for ?? '')}</ThemedText>
                            ) : null}

                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}><Ionicons name="calendar" size={16} color="#6b7280" /><ThemedText style={styles.metaText}>{formatDateIST(data.start_date)}</ThemedText></View>
                                <View style={styles.metaItem}><Ionicons name="location" size={16} color="#6b7280" /><ThemedText style={styles.metaText}>{language === 'ta' ? (data.location_tamil ?? data.location) : (data.location ?? '')}</ThemedText></View>
                            </View>

                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}><Ionicons name="person" size={16} color="#6b7280" /><ThemedText style={styles.metaText}>{data.organizer ?? ''}</ThemedText></View>
                            </View>

                            <View style={styles.divider} />

                            <ThemedText style={styles.sectionTitle}>{language === 'ta' ? 'விவரம்' : 'Details'}</ThemedText>
                            <ThemedText style={styles.description}>{language === 'ta' ? (data.description_tamil ?? data.description) : data.description}</ThemedText>

                            {data.read_moreurl ? (
                                <>
                                    <ThemedText style={[styles.sectionTitle, { marginTop: 16 }]}>{language === 'ta' ? 'இணைப்பு' : 'Link'}</ThemedText>
                                    <TouchableOpacity onPress={() => Linking.openURL(data.read_moreurl)}>
                                        <ThemedText style={styles.readMoreLink}>{data.read_moreurl}</ThemedText>
                                    </TouchableOpacity>
                                </>
                            ) : null}

                            <View style={styles.footerStats}>
                                <TouchableOpacity onPress={handleLike} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="heart" size={16} color="#ef4444" />
                                    <ThemedText style={[styles.metaText, { marginLeft: 8 }]}>{data.likes ?? 0}</ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleShare} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
                                    <Ionicons name="share-social" size={16} color="#6b7280" />
                                    <ThemedText style={[styles.metaText, { marginLeft: 8 }]}>{data.share ?? 0}</ThemedText>
                                </TouchableOpacity>

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
                                    <Ionicons name="eye" size={16} color="#6b7280" />
                                    <ThemedText style={[styles.metaText, { marginLeft: 8 }]}>{data.view ?? 0}</ThemedText>
                                </View>
                            </View>

                            {/* Get Offer Button - Logic updated as requested */}
                            {/* Only show Get Offer/Quote logic related button if the text suggests it (e.g. Get Quote, Get Offer), else show Link logic */}

                            {data.button_text && (
                                <TouchableOpacity
                                    style={styles.heroCTA}
                                    onPress={() => {
                                        const buttonText = (data.button_text ?? '').toLowerCase().trim();
                                        if (buttonText === 'get quote' || buttonText === 'விலைப்பட்டியல் பெற' || buttonText.includes('quote') || buttonText.includes('offer')) {
                                            setLoanModalVisible(true);
                                        } else if (data.read_moreurl) {
                                            Linking.openURL(data.read_moreurl);
                                        }
                                    }}
                                >
                                    <ThemedText style={styles.heroCTAText}>{data.button_text ?? (language === 'ta' ? 'விபரம் பெறுங்கள்' : 'Get offer')}</ThemedText>
                                </TouchableOpacity>
                            )}

                        </View>
                    </ScrollView>
                </View>
            ) : null}

            {/* Loan Application Modal */}
            <Modal visible={loanModalVisible} transparent animationType="slide" onRequestClose={() => { setLoanModalVisible(false); setShowTypeDropdown(false); setShowPeriodDropdown(false); }}>
                 <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
                
                <Pressable style={styles.bottomSheetOverlay} onPress={() => { setLoanModalVisible(false); setShowTypeDropdown(false); setShowPeriodDropdown(false); }}>
                    <Pressable style={styles.bottomSheetContent} onPress={() => { }} >
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>{language === 'ta' ? 'டிராக்டர் வாங்க குறைந்த வட்டியில் கடன்' : 'Tractor Loan with Low Interest'}</ThemedText>
                            <TouchableOpacity onPress={() => { setLoanModalVisible(false); setShowTypeDropdown(false); setShowPeriodDropdown(false); }}>
                                <Ionicons name="close" size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                         <KeyboardAwareScrollView 
                    contentContainerStyle={{
                        flexGrow: 1,
                    }}
                    style={{ width: '100%' }}
                    enableOnAndroid
                    keyboardShouldPersistTaps="handled"
                    enableAutomaticScroll={true}><View style={styles.modalBody}>
                       
                        <View style={{ flex: 1 }}>
                            {/* Type Dropdown */}
                            <View style={styles.formField}>
                                <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'வகை' : 'Type'}</ThemedText>
                                <TouchableOpacity style={styles.dropdown} onPress={() => { setShowTypeDropdown(!showTypeDropdown); setShowPeriodDropdown(false); }}>
                                    <ThemedText style={styles.dropdownText}>{loanType}</ThemedText>
                                    <Ionicons name="chevron-down" size={18} color="#64748b" />
                                </TouchableOpacity>
                                {showTypeDropdown && (
                                    <View style={styles.dropdownOptions}>
                                        <TouchableOpacity style={styles.dropdownOption} onPress={() => { setLoanType('டிராக்டர்'); setShowTypeDropdown(false); }}>
                                            <ThemedText>டிராக்டர்</ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Preferred Brand */}
                            <View style={styles.formField}>
                                <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'விருப்ப பிராண்ட்' : 'Preferred Brand'}</ThemedText>
                                <TextInput
                                    style={styles.textInput}
                                    value={preferredBrand}
                                    onChangeText={setPreferredBrand}
                                    placeholder={language === 'ta' ? 'உதா: மகிந்திரா' : 'e.g., Mahindra'}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            {/* Budget Row */}
                            <View style={styles.budgetRow}>
                                <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                                    <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'குறைந்தபட்ச பட்ஜெட்' : 'Minimum Budget'}</ThemedText>
                                    <TextInput
                                        style={styles.textInput}
                                        value={minBudget}
                                        onChangeText={setMinBudget}
                                        keyboardType="numeric"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                                <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
                                    <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'அதிகபட்ச பட்ஜெட்' : 'Maximum Budget'}</ThemedText>
                                    <TextInput
                                        style={styles.textInput}
                                        value={maxBudget}
                                        onChangeText={setMaxBudget}
                                        keyboardType="numeric"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            </View>

                            {/* Expected Purchase Period */}
                            <View style={styles.formField}>
                                <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'வாங்க எதிர்பார்க்கும் காலம்' : 'Expected Purchase Period'}</ThemedText>
                                <TouchableOpacity style={styles.dropdown} onPress={() => { setShowPeriodDropdown(!showPeriodDropdown); setShowTypeDropdown(false); }}>
                                    <ThemedText style={styles.dropdownText}>{expectedPeriod}</ThemedText>
                                    <Ionicons name="chevron-down" size={18} color="#64748b" />
                                </TouchableOpacity>
                                {showPeriodDropdown && (
                                    <View style={styles.dropdownOptions}>
                                        <TouchableOpacity style={styles.dropdownOption} onPress={() => { setExpectedPeriod('1 மாதத்திற்குள்'); setShowPeriodDropdown(false); }}>
                                            <ThemedText>1 மாதத்திற்குள்</ThemedText>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.dropdownOption} onPress={() => { setExpectedPeriod('2-3 மாதங்களில்'); setShowPeriodDropdown(false); }}>
                                            <ThemedText>2-3 மாதங்களில்</ThemedText>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.dropdownOption} onPress={() => { setExpectedPeriod('3-6 மாதங்களில்'); setShowPeriodDropdown(false); }}>
                                            <ThemedText>3-6 மாதங்களில்</ThemedText>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.dropdownOption} onPress={() => { setExpectedPeriod('6 மாதங்களுக்கு மேல்'); setShowPeriodDropdown(false); }}>
                                            <ThemedText>6 மாதங்களுக்கு மேல்</ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Additional Notes */}
                            <View style={styles.formField}>
                                <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'கூடுதல் குறிப்புகள்' : 'Additional Notes'}</ThemedText>
                                <TextInput
                                    style={styles.textArea}
                                    value={additionalNotes}
                                    onChangeText={setAdditionalNotes}
                                    placeholder=""
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                      <TouchableOpacity
                            style={[styles.submitButton, loanSubmitting && styles.submitButtonDisabled]}
                            onPress={submitLoanApplication}
                            disabled={loanSubmitting}
                        >
                            {loanSubmitting ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                                <ThemedText style={styles.submitButtonText}>{language === 'ta' ? 'சமர்ப்பிக்கவும்' : 'Submit'}</ThemedText>
                            )}
                        </TouchableOpacity>
                        </View>
                           </KeyboardAwareScrollView>
                        {/* Submit Button */}
                        
                    </Pressable>
                </Pressable>
               
                 </SafeAreaView>
            </Modal>

            <FarmerBottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    topAppBar: { height: 56, backgroundColor: '#0f6b36', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
    hamburger: { width: 36, alignItems: 'center', justifyContent: 'center' },
    topAppBarTitle: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
    topAppBarLogo: { width: 140, height: 40 },
    heroWrap: { position: 'relative', backgroundColor: '#000' },
    heroImage: { width: '100%', height: 200, opacity: 0.98 },
    typePill: { position: 'absolute', right: 12, top: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    typePillText: { color: '#fff', fontWeight: '700' },
    container: { paddingHorizontal: 16, paddingTop: 12 },
    title: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
    subTitle: { color: '#6b7280', marginBottom: 12 },
    metaRow: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
    metaText: { color: '#6b7280', marginLeft: 8 },
    divider: { height: 1, backgroundColor: '#eef2f6', marginVertical: 12 },
    sectionTitle: { fontWeight: '700', marginBottom: 8 },
    description: { color: '#1f2937', lineHeight: 20 },
    readMoreLink: { color: '#2563eb', textDecorationLine: 'underline' },
    footerStats: { flexDirection: 'row', marginTop: 18, alignItems: 'center' },
    heroCTA: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 24 },
    heroCTAText: { color: '#fff', fontWeight: '700' },
    /* Loan Modal Styles */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modalContent: { width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 12, padding: 20, elevation: 8 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 12 },
    modalBody: { marginBottom: 20 },
    formField: { marginBottom: 16 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#ffffff' },
    dropdownText: { fontSize: 14, color: '#0f172a', flex: 1 },
    dropdownOptions: { marginTop: 4, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#ffffff', elevation: 4, maxHeight: 200 },
    dropdownOption: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    textInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: '#0f172a', backgroundColor: '#ffffff' },
    textArea: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: '#0f172a', backgroundColor: '#ffffff', minHeight: 100 },
    budgetRow: { flexDirection: 'row', marginBottom: 16 },
    submitButton: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    submitButtonDisabled: { backgroundColor: '#94a3b8', opacity: 0.6 },
    submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
    bottomSheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
    },
    bottomSheetContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        elevation: 8,
        alignSelf: 'center',
        maxHeight: '80%',
        flexDirection: 'column',
    },
});
