import { HeaderNotificationIcon } from '@/components/HeaderNotificationIcon';
import { useSideMenu } from '@/components/SideMenu';
import { ThemedText } from '@/components/themed-text';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HarvestScreen() {
    const { language } = useLanguage();
    const { open: openSideMenu } = useSideMenu();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [data, setData] = useState<any>(null);
    const [isHarvestDataLoading, setIsHarvestDataLoading] = useState(true);

    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddFarmModalOpen, setIsAddFarmModalOpen] = useState(false);
    const [addFarmStep, setAddFarmStep] = useState(1);
    const [locationMode, setLocationMode] = useState<'choice' | 'manual' | 'pincode'>('choice');
    const [pincode, setPincode] = useState('');
    const [newFarmName, setNewFarmName] = useState('');

    // Add-Farm step 2 dropdowns
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedTaluk, setSelectedTaluk] = useState('');
    const [selectedPanchayat, setSelectedPanchayat] = useState('');
    const [selectedVillage, setSelectedVillage] = useState('');
    const [latitude, setLatitude] = useState<string>('');
    const [longitude, setLongitude] = useState<string>('');
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationAddress, setLocationAddress] = useState<string>('');

    // Step 3 fields (land details)
    const [ownershipType, setOwnershipType] = useState<'owned' | 'leased' | ''>('');
    const [landArea, setLandArea] = useState('');
    const [landUnit, setLandUnit] = useState('acre');
    const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
    const [isSavingFarm, setIsSavingFarm] = useState(false);
    const unitOptions = ['hectare', 'acre', 'cent'];

    const getUnitLabel = (u: string) => {
        if (!u) return '';
        if (language === 'ta') {
            switch (u) {
                case 'hectare':
                    return 'ஹெக்டேர்';
                case 'acre':
                    return 'ஏக்கர்';
                case 'cent':
                    return 'சென்ட்';
                default:
                    return u;
            }
        } else {
            switch (u) {
                case 'hectare':
                    return 'Hectare';
                case 'acre':
                    return 'Acre';
                case 'cent':
                    return 'Cent';
                default:
                    return u;
            }
        }
    };

    // Step 4 fields (tree/coconut details)
    const [treeCount, setTreeCount] = useState('');
    const [coconutType, setCoconutType] = useState<'country' | 'hybrid' | 'mixed' | ''>('');
    const [avgTreeAge, setAvgTreeAge] = useState('');
    const [plantingType, setPlantingType] = useState('');
    const [expectedYield, setExpectedYield] = useState('');

    // Validation helpers for Add-Farm steps
    const isStep1Valid = newFarmName.trim().length > 0;
    // Step 2: allow moving to step 3 if any location type and its value is filled
    const isStep2Valid =
        (!!latitude && !!longitude) ||
        (pincode.trim().length === 6) ||
        (selectedState.trim().length > 0) ||
        (selectedDistrict.trim().length > 0) ||
        (selectedTaluk.trim().length > 0) ||
        (selectedPanchayat.trim().length > 0) ||
        (selectedVillage.trim().length > 0);
    const isStep3Valid = !!ownershipType && landArea.trim().length > 0 && !!landUnit;
    const isStep4Valid = treeCount.trim().length > 0 && !!coconutType && avgTreeAge.trim().length > 0 && plantingType.trim().length > 0 && expectedYield.trim().length > 0;

    const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
    const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
    const [isTalukDropdownOpen, setIsTalukDropdownOpen] = useState(false);
    const [isPanchayatDropdownOpen, setIsPanchayatDropdownOpen] = useState(false);
    const [isVillageDropdownOpen, setIsVillageDropdownOpen] = useState(false);

    // Search states for location dropdowns
    const [stateSearch, setStateSearch] = useState('');
    const [districtSearch, setDistrictSearch] = useState('');
    const [talukSearch, setTalukSearch] = useState('');
    const [panchayatSearch, setPanchayatSearch] = useState('');
    const [villageSearch, setVillageSearch] = useState('');

    const [selectedFarm, setSelectedFarm] = useState<any>(null);
    const [isFarmDropdownOpen, setIsFarmDropdownOpen] = useState(false);
    const [farmMenuOpenId, setFarmMenuOpenId] = useState<number | string | null>(null);
    const [editingFarmId, setEditingFarmId] = useState<number | null>(null);
    const [isSavingHarvest, setIsSavingHarvest] = useState(false);

    // Harvest Summary (below My Farm Details) menu and view detail
    const [harvestSummaryMenuOpenId, setHarvestSummaryMenuOpenId] = useState<number | null>(null);
    const [viewHarvestId, setViewHarvestId] = useState<number | null>(null);
    const [viewHarvestDetail, setViewHarvestDetail] = useState<any>(null);
    const [isViewHarvestLoading, setIsViewHarvestLoading] = useState(false);
    const [editingHarvestId, setEditingHarvestId] = useState<number | null>(null);

    // View Farm Modal state
    const [isViewFarmModalOpen, setIsViewFarmModalOpen] = useState(false);
    const [viewFarmData, setViewFarmData] = useState<any>(null);

    // Manage Harvest Schedule modal state
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [scheduleFarm, setScheduleFarm] = useState<any>(null);
    const [scheduleEntries, setScheduleEntries] = useState<Array<{ month: string; notes: string; peak?: boolean }>>([]);
    const [scheduleUseNaam, setScheduleUseNaam] = useState(false);
    // Month dropdown state
    const [scheduleMonthDropdownOpenIndex, setScheduleMonthDropdownOpenIndex] = useState<number | null>(null);

    // Refs and measured layout for rendering dropdown as overlay
    const scheduleButtonRefs = useRef<Array<any>>([]);
    const [scheduleDropdownLayout, setScheduleDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    const toggleScheduleDropdown = (index: number) => {
        const ref = scheduleButtonRefs.current[index];
        if (ref && ref.measureInWindow) {
            ref.measureInWindow((x: number, y: number, width: number, height: number) => {
                setScheduleDropdownLayout({ x, y, width, height });
                setScheduleMonthDropdownOpenIndex(prev => prev === index ? null : index);
            });
        } else {
            setScheduleMonthDropdownOpenIndex(prev => prev === index ? null : index);
            setScheduleDropdownLayout(null);
        }
    };

    const closeScheduleDropdown = () => { setScheduleMonthDropdownOpenIndex(null); setScheduleDropdownLayout(null); };

    const scheduleMonths: Array<{ key: string; ta: string }> = [
        { key: 'January', ta: 'ஜனவரி' },
        { key: 'February', ta: 'பிப்ரவரி' },
        { key: 'March', ta: 'மார்ச்சு' },
        { key: 'April', ta: 'ஏப்ரல்' },
        { key: 'May', ta: 'மே' },
        { key: 'June', ta: 'ஜூன்' },
        { key: 'July', ta: 'ஜூலை' },
        { key: 'August', ta: 'ஆகஸ்ட்' },
        { key: 'September', ta: 'செப்டம்பர்' },
        { key: 'October', ta: 'அக்டோபர்' },
        { key: 'November', ta: 'நவம்பர்' },
        { key: 'December', ta: 'டிசம்பர்' }
    ];

    const openScheduleModal = (farm: any) => {
        setScheduleFarm(farm);
        const entries = (farm?.harvest_schedules || []).map((s: any) => ({ month: s.month || '', notes: s.notes || '', peak: !!s.peak }));
        if (entries.length === 0) entries.push({ month: '', notes: '', peak: false });
        setScheduleEntries(entries);
        setScheduleUseNaam(false);
        setScheduleMonthDropdownOpenIndex(null);
        setIsScheduleModalOpen(true);
    };

    // Change Date modal helpers
    const [isChangeDateModalOpen, setIsChangeDateModalOpen] = useState(false);
    const [changeDateFarm, setChangeDateFarm] = useState<any>(null);
    const [changeDateSelection, setChangeDateSelection] = useState<'yes' | 'no' | ''>('');
    const [changeDateValue, setChangeDateValue] = useState<Date | null>(null);
    const [showChangeDatePicker, setShowChangeDatePicker] = useState(false);
    // Multi-step inside Change Date modal (step 1 = initial question; step 2 = follow-up form)
    const [changeDateStep, setChangeDateStep] = useState<number>(1);
    const [changeDateSaleMethod, setChangeDateSaleMethod] = useState<'count' | 'weight' | ''>('');
    const [changeDateCount, setChangeDateCount] = useState<string>('');
    const [changeDateWeight, setChangeDateWeight] = useState<string>('');
    const [changeDateApproxCount, setChangeDateApproxCount] = useState<string>('');
    const [changeDateAvgPrice, setChangeDateAvgPrice] = useState<string>('');
    // For first-harvest flow (No) — selection for sale type / variety
    const [changeDateFirstHarvestOption, setChangeDateFirstHarvestOption] = useState<string>('');
    const [isSavingChangeDate, setIsSavingChangeDate] = useState(false);

    const openChangeDateModal = (farm: any) => {
        setChangeDateFarm(farm);
        setChangeDateSelection('');
        setChangeDateValue(null);
        setShowChangeDatePicker(false);
        setChangeDateStep(1);
        setChangeDateSaleMethod('');
        setChangeDateCount('');
        setChangeDateWeight('');
        setChangeDateApproxCount('');
        setChangeDateAvgPrice('');
        setChangeDateFirstHarvestOption('');
        setIsChangeDateModalOpen(true);
    };

    const closeChangeDateModal = () => {
        setIsChangeDateModalOpen(false);
        setChangeDateFarm(null);
        setChangeDateSelection('');
        setChangeDateValue(null);
        setShowChangeDatePicker(false);
        setChangeDateStep(1);
        setChangeDateSaleMethod('');
        setChangeDateCount('');
        setChangeDateWeight('');
        setChangeDateApproxCount('');
        setChangeDateAvgPrice('');
        setChangeDateFirstHarvestOption('');
    };

    const handleSaveChangeDate = async () => {
        // If we're on step 1
        if (changeDateStep === 1) {
            if (!changeDateSelection) {
                Alert.alert(language === 'ta' ? 'தேர்வு செய்க' : 'Selection required', language === 'ta' ? 'தயவுசெய்து ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்' : 'Please select an option');
                return;
            }

            // If user answered 'yes', require a date then advance to step 2 to collect sale method
            if (changeDateSelection === 'yes') {
                if (!changeDateValue) {
                    Alert.alert(language === 'ta' ? 'தேதி தேர்வுசெய்யவும்' : 'Select date', language === 'ta' ? 'தயவுசென்று ஒரு தேதி தெரிவுசெய்யவும்' : 'Please select a date');
                    return;
                }

                setChangeDateStep(2);
                return;
            }

            // If 'no', advance to a follow-up form (do not save immediately)
            if (changeDateSelection === 'no') {
                setChangeDateStep(2);
                return;
            }
        }

        // If we're on step 2, validate based on the flow and then save
        if (changeDateStep === 2) {
            if (changeDateSelection === 'yes') {
                if (!changeDateSaleMethod) {
                    Alert.alert(language === 'ta' ? 'தேர்வு செய்க' : 'Selection required', language === 'ta' ? 'தயவுசெய்து ஒரு முறையைத் தேர்ந்தெடுக்கவும்' : 'Please select a method');
                    return;
                }

                if (changeDateSaleMethod === 'count') {
                    if (!changeDateCount || Number(changeDateCount) <= 0) {
                        Alert.alert(language === 'ta' ? 'எண்ணிக்கை தேவை' : 'Count required', language === 'ta' ? 'தயவுசெய்து எண்ணிக்கையை உள்ளிடவும்' : 'Please enter a count');
                        return;
                    }
                    if (!changeDateWeight || Number(changeDateWeight) <= 0) {
                        Alert.alert(language === 'ta' ? 'எடை தேவை' : 'Weight required', language === 'ta' ? 'தயவுசெய்து எடை உள்ளிடவும்' : 'Please enter weight');
                        return;
                    }
                    if (!changeDateAvgPrice || Number(changeDateAvgPrice) <= 0) {
                        Alert.alert(language === 'ta' ? 'விலை தேவை' : 'Price required', language === 'ta' ? 'தயவுசெய்து சராசரி விலையை உள்ளிடவும்' : 'Please enter an average price');
                        return;
                    }

                    // For piece/count flow: after validation, show the 'No' follow-up form (do not save/close)
                    setChangeDateSelection('no');
                    setChangeDateStep(2);
                    setChangeDateFirstHarvestOption('');
                    return;
                } else if (changeDateSaleMethod === 'weight') {
                    if (!changeDateWeight || Number(changeDateWeight) <= 0) {
                        Alert.alert(language === 'ta' ? 'எடை தேவை' : 'Weight required', language === 'ta' ? 'தயவுசெய்து எடை உள்ளிடவும்' : 'Please enter weight');
                        return;
                    }
                    if (!changeDateApproxCount || Number(changeDateApproxCount) <= 0) {
                        Alert.alert(language === 'ta' ? 'எண்ணிக்கை தேவை' : 'Count required', language === 'ta' ? 'தயவுசெய்து எண்ணிக்கையை உள்ளிடவும்' : 'Please enter an approximate count');
                        return;
                    }
                    if (!changeDateAvgPrice || Number(changeDateAvgPrice) <= 0) {
                        Alert.alert(language === 'ta' ? 'விலை தேவை' : 'Price required', language === 'ta' ? 'தயவுசெய்து சராசரி விலையை உள்ளிடவும்' : 'Please enter an average price');
                        return;
                    }

                    // For weight flow: after validation, show the 'No' follow-up form (do not save/close)
                    setChangeDateSelection('no');
                    setChangeDateStep(2);
                    setChangeDateFirstHarvestOption('');
                    return;
                }
            } else if (changeDateSelection === 'no') {
                if (!changeDateFirstHarvestOption) {
                    Alert.alert(language === 'ta' ? 'தேர்வு செய்க' : 'Selection required', language === 'ta' ? 'தயவுசெய்து ஒரு தேர்வைச் செய்யவும்' : 'Please select an option');
                    return;
                }
            }

            // Build payload and call API
            setIsSavingChangeDate(true);
            try {
                const token = await AsyncStorage.getItem('authToken');
                const landId = changeDateFarm?.land_id || changeDateFarm?.farm_id || null;
                const formId = 1;
                const harvestMethod = changeDateSaleMethod === 'count' ? 'piece' : (changeDateSaleMethod === 'weight' ? 'kg' : null);
                const totalWeightKg = (changeDateSaleMethod ? (changeDateWeight ? Number(changeDateWeight) : null) : null);
                const approximateCount = changeDateSaleMethod === 'count' ? (changeDateCount ? Number(changeDateCount) : null) : (changeDateSaleMethod === 'weight' ? (changeDateApproxCount ? Number(changeDateApproxCount) : null) : null);
                const averageRate = changeDateAvgPrice ? Number(changeDateAvgPrice) : null;
                const coconutType = changeDateFirstHarvestOption ? (changeDateFirstHarvestOption === 'green' ? 'green' : (changeDateFirstHarvestOption === 'black' ? 'black' : 'copra')) : (changeDateFarm?.coconut_type || '');

                // compute next harvest date where possible (YYYY-MM-DD)
                let nextDate: Date | null = null;
                if (changeDateSelection === 'no' && changeDateFirstHarvestOption) {
                    const days = changeDateFirstHarvestOption === 'green' ? 40 : (changeDateFirstHarvestOption === 'black' ? 55 : 90);
                    nextDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                } else if (changeDateSelection === 'yes' && changeDateValue) {
                    // default approximate offset for next harvest
                    nextDate = new Date(changeDateValue.getTime() + 40 * 24 * 60 * 60 * 1000);
                }
                const nextHarvestDate = nextDate ? nextDate.toISOString().slice(0, 10) : null;
                const totalCoconut = approximateCount !== null ? approximateCount : null;

                const payload: any = {
                    land_id: landId,
                    form_id: formId,
                    total_weight_kg: totalWeightKg,
                    approximate_count: approximateCount,
                    average_rate: averageRate,
                    next_harvest_date: nextHarvestDate,
                    harvest_method: harvestMethod,
                    total_coconut: totalCoconut,
                    coconut_type: coconutType,
                };

                const res = await fetch(`${API_CONFIG.BASE_URL}/harvest-setups`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(payload)
                });

                const json = await res.json();
                if (res.ok && (json.status === 'success' || json.success)) {
                    Alert.alert(language === 'ta' ? 'வெற்றி' : 'Success', language === 'ta' ? 'தகவல் வெற்றிகரமாக சேமிக்கப்பட்டது' : 'Information saved successfully');
                    closeChangeDateModal();

                    // refresh local data
                    fetchHarvestData();
                } else {
                    const msg = json?.message || json?.detail || (language === 'ta' ? 'சேமிக்க முடியாது' : 'Failed to save');
                    Alert.alert(language === 'ta' ? 'பிழை' : 'Error', msg);
                }
            } catch (err: any) {
                console.error('Error saving change date:', err);
                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்' : 'Failed to save. Please try again');
            } finally {
                setIsSavingChangeDate(false);
            }

            return;
        }
    };

    const addScheduleEntry = () => setScheduleEntries(prev => {
        if (prev.length >= 8) {
            Alert.alert(language === 'ta' ? 'அட்டவணை எல்லை' : 'Limit reached', language === 'ta' ? 'அட்டவணைகளை 8 வரை மட்டுமே சேர்க்கலாம்' : 'You can only add up to 8 schedule entries');
            return prev;
        }
        return [...prev, { month: '', notes: '', peak: false }];
    });
    const removeScheduleEntry = (index: number) => setScheduleEntries(prev => prev.filter((_, i) => i !== index));
    const updateScheduleEntry = (index: number, changes: Partial<{ month: string; notes: string; peak?: boolean }>) => setScheduleEntries(prev => prev.map((e, i) => i === index ? { ...e, ...changes } : e));

    const [isSavingSchedule, setIsSavingSchedule] = useState(false);

    const handleSaveSchedule = async () => {
        // Build payload matching API expectations
        const payload: any = {
            land_id: scheduleFarm?.land_id || null,
            farm_id: scheduleFarm?.farm_id || null,
            schedules: scheduleEntries.map(s => ({ month: s.month, notes: s.notes || '', peak: s.peak ? 1 : 0 }))
        };

        setIsSavingSchedule(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(`${API_CONFIG.BASE_URL}/harvest-schedules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (res.ok && (json.status === 'success' || json.success)) {
                setIsScheduleModalOpen(false);
                Alert.alert(language === 'ta' ? 'வெற்றி' : 'Success', language === 'ta' ? 'அட்டவணை சேமிக்கப்பட்டது' : 'Schedule saved');

                // Refresh data to reflect changes
                fetchHarvestData();
            } else {
                const msg = json?.message || json?.detail || (language === 'ta' ? 'அட்டவணை சேமிக்க முடியவில்லை' : 'Failed to save schedule');
                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', msg);
            }
        } catch (err: any) {
            console.error('Error saving schedule:', err);
            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்' : 'Failed to save. Please try again');
        } finally {
            setIsSavingSchedule(false);
        }
    };
    const [harvestDate, setHarvestDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [greenCount, setGreenCount] = useState('');
    const [blackCount, setBlackCount] = useState('');
    const [copraCount, setCopraCount] = useState('');

    // Add Harvest flow: 1 = Yield update form, 2 = Summary & Submit
    const [addHarvestStep, setAddHarvestStep] = useState<1 | 2>(1);
    const [yieldNoOfCoconut, setYieldNoOfCoconut] = useState('');
    const [yieldAverageWeight, setYieldAverageWeight] = useState('');
    const [yieldSellingPrice, setYieldSellingPrice] = useState('');
    const [yieldHappyWithYield, setYieldHappyWithYield] = useState<'yes' | 'no' | ''>('');
    const [yieldNextHarvestDate, setYieldNextHarvestDate] = useState(new Date());
    const [showYieldNextHarvestPicker, setShowYieldNextHarvestPicker] = useState(false);

    // Coconut Variety Dropdown State
    const [coconutVarietyOptions, setCoconutVarietyOptions] = useState<any[]>([]);
    const [isCoconutVarietyLoading, setIsCoconutVarietyLoading] = useState(false);
    const [isCoconutVarietyDropdownOpen, setIsCoconutVarietyDropdownOpen] = useState(false);
    const [coconutVarietySearch, setCoconutVarietySearch] = useState('');

    useEffect(() => {
        fetchHarvestData();
        fetchStates();
        fetchCoconutVarieties();
    }, []);

    // Fetch address when latitude and longitude are set
    useEffect(() => {
        if (latitude && longitude && locationMode === 'manual') {
            const latNum = parseFloat(latitude);
            const longNum = parseFloat(longitude);
            if (!isNaN(latNum) && !isNaN(longNum)) {
                getAddressFromCoords(latNum, longNum);
            }
        } else {
            setLocationAddress('');
        }
    }, [latitude, longitude, locationMode]);

    const fetchCoconutVarieties = async () => {
        try {
            setIsCoconutVarietyLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(`${API_CONFIG.BASE_URL}/coconut-varieties`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            const json = await res.json();
            if (json.status === 'success') {
                setCoconutVarietyOptions(json.data || []);
            }
        } catch (err) {
            console.error('Error fetching coconut varieties:', err);
        } finally {
            setIsCoconutVarietyLoading(false);
        }
    };

    const fetchStates = async () => {
        try {
            setIsStateLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(`${API_CONFIG.BASE_URL}/states/all`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            const json = await res.json();
            if (json.status === 'success') {
                setStateOptions(json.data?.states || []);
            }
        } catch (err) {
            console.error('Error fetching states:', err);
        } finally {
            setIsStateLoading(false);
        }
    };

    const fetchDistricts = async (stateId: number) => {
        try {
            setIsDistrictLoading(true);
            setDistrictOptions([]);
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(`${API_CONFIG.BASE_URL}/districts/state/${stateId}/all`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            const json = await res.json();
            if (json.status === 'success') {
                setDistrictOptions(json.data?.districts || []);
            }
        } catch (err) {
            console.error('Error fetching districts:', err);
        } finally {
            setIsDistrictLoading(false);
        }
    };


    const fetchHarvestData = async () => {
        try {
            setIsHarvestDataLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                setIsHarvestDataLoading(false);
                return;
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/harvests/menu-data`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const json = await response.json();
            if (json.status === 'success') {
                setData(json.data);
            }
        } catch (error) {
            console.error('Error fetching harvest data:', error);
        } finally {
            setIsHarvestDataLoading(false);
        }
    };

    const formatDate = (dateString: string | Date) => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', options);
    };

    const daysUntil = (dateString: string | null) => {
        if (!dateString) return null;
        const now = new Date();
        const d = new Date(dateString);
        const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getUnitLabelFromApi = (unit: string) => {
        if (!unit) return '';
        const u = unit.toLowerCase();
        if (language === 'ta') {
            if (u.includes('acre')) return 'ஏக்கர்';
            if (u.includes('hectare')) return 'ஹெக்டேர்';
            if (u.includes('cent')) return 'சென்ட்';
            return unit;
        } else {
            return unit;
        }
    };

    // Options (state list fetched from API)
    const [stateOptions, setStateOptions] = useState<any[]>([]);
    const [isStateLoading, setIsStateLoading] = useState(false);

    // Selected state/district ids for dependent fetches
    const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
    const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);

    // District options (fetched per-state)
    const [districtOptions, setDistrictOptions] = useState<any[]>([]);
    const [isDistrictLoading, setIsDistrictLoading] = useState(false);

    useEffect(() => {
        if (selectedStateId) {
            fetchDistricts(selectedStateId);
        }
    }, [selectedStateId]);

    const fetchSubdistricts = async (districtId: number) => {
        try {
            setIsSubdistrictLoading(true);
            setSubdistrictOptions([]);
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(`${API_CONFIG.BASE_URL}/subdistricts/district/${districtId}/all`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            const json = await res.json();
            if (json.status === 'success') {
                setSubdistrictOptions(json.data?.subdistricts || []);
            }
        } catch (err) {
            console.error('Error fetching subdistricts:', err);
        } finally {
            setIsSubdistrictLoading(false);
        }
    };

    useEffect(() => {
        if (selectedDistrictId) {
            fetchSubdistricts(selectedDistrictId);
        }
    }, [selectedDistrictId]);

    // Subdistrict (taluk) options fetched based on district
    const [subdistrictOptions, setSubdistrictOptions] = useState<any[]>([]);
    const [isSubdistrictLoading, setIsSubdistrictLoading] = useState(false);
    const [selectedTalukId, setSelectedTalukId] = useState<number | null>(null);

    // Panchayat options fetched based on selected taluk
    const [panchayatOptions, setPanchayatOptions] = useState<any[]>([]);
    const [isPanchayatLoading, setIsPanchayatLoading] = useState(false);
    const [selectedPanchayatId, setSelectedPanchayatId] = useState<number | null>(null);

    // Village options fetched based on selected panchayat
    const [villageOptions, setVillageOptions] = useState<any[]>([]);
    const [isVillageLoading, setIsVillageLoading] = useState(false);
    const [selectedVillageId, setSelectedVillageId] = useState<number | null>(null);

    const fetchPanchayats = async (subdistrictId: number) => {
        try {
            setIsPanchayatLoading(true);
            setPanchayatOptions([]);
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(`${API_CONFIG.BASE_URL}/panchayats/subdistrict/${subdistrictId}/all`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            const json = await res.json();
            if (json.status === 'success') {
                setPanchayatOptions(json.data?.panchayats || []);
            }
        } catch (err) {
            console.error('Error fetching panchayats:', err);
        } finally {
            setIsPanchayatLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTalukId) {
            fetchPanchayats(selectedTalukId);
        }
    }, [selectedTalukId]);

    const fetchVillages = async (panchayatId: number) => {
        try {
            setIsVillageLoading(true);
            setVillageOptions([]);
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(`${API_CONFIG.BASE_URL}/villages/panchayat/${panchayatId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            const json = await res.json();
            if (json.status === 'success') {
                setVillageOptions(json.data?.villages || []);
            }
        } catch (err) {
            console.error('Error fetching villages:', err);
        } finally {
            setIsVillageLoading(false);
        }
    };

    useEffect(() => {
        if (selectedPanchayatId) {
            fetchVillages(selectedPanchayatId);
        }
    }, [selectedPanchayatId]);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || harvestDate;
        setShowDatePicker(Platform.OS === 'ios');
        setHarvestDate(currentDate);
    };

    const handleYieldNextHarvestDateChange = (event: any, selectedDate?: Date) => {
        const d = selectedDate || yieldNextHarvestDate;
        setShowYieldNextHarvestPicker(Platform.OS === 'ios');
        setYieldNextHarvestDate(d);
    };

    const closeAddHarvestModal = () => {
        setEditingHarvestId(null);
        setAddHarvestStep(1);
        setYieldNoOfCoconut('');
        setYieldAverageWeight('');
        setYieldSellingPrice('');
        setYieldHappyWithYield('');
        setYieldNextHarvestDate(new Date());
        setIsModalOpen(false);
    };

    const handleYieldUpdate = () => {
        if (!yieldNoOfCoconut.trim()) {
            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'தேங்காய் எண்ணிக்கையை உள்ளிடவும்' : 'Please enter No of Coconut');
            return;
        }
        if (!yieldAverageWeight.trim()) {
            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'சராசரி எடையை உள்ளிடவும்' : 'Please enter Average weight');
            return;
        }
        if (!yieldSellingPrice.trim()) {
            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'விற்பனை விலையை உள்ளிடவும்' : 'Please enter Selling Price');
            return;
        }
        if (!yieldHappyWithYield) {
            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'மகிழ்ச்சியான விளைச்சலைத் தேர்ந்தெடுக்கவும்' : 'Please select if you are happy with yield');
            return;
        }
        setAddHarvestStep(2);
    };

    const handleYieldSubmit = () => {
        setGreenCount(yieldNoOfCoconut);
        setBlackCount('0');
        setCopraCount('0');
        setHarvestDate(yieldNextHarvestDate);
        handleSaveHarvest();
    };

    const handleViewHarvest = async (harvest: any) => {
        setHarvestSummaryMenuOpenId(null);
        const harvestId = harvest.id;
        if (!harvestId) {
            setViewHarvestDetail(harvest);
            return;
        }
        setViewHarvestId(harvestId);
        setViewHarvestDetail(null);
        setIsViewHarvestLoading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(`${API_CONFIG.BASE_URL}/harvests/${harvestId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            const json = await res.json();
            if (res.ok && (json.status === 'success' || json.success)) {
                setViewHarvestDetail(json.data ?? json);
            } else {
                const msg = json?.message || json?.detail || (language === 'ta' ? 'விவரங்களை ஏற்ற முடியவில்லை' : 'Failed to load harvest details');
                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', msg);
                setViewHarvestId(null);
            }
        } catch (err: any) {
            console.error('Error fetching harvest detail:', err);
            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'விவரங்களை ஏற்ற முடியவில்லை' : 'Failed to load harvest details');
            setViewHarvestId(null);
        } finally {
            setIsViewHarvestLoading(false);
        }
    };

    const handleEditHarvest = (harvest: any) => {
        setHarvestSummaryMenuOpenId(null);
        const farm = data?.my_farms?.find((f: any) => (f.land_id || f.farm_id) === harvest.land_id);
        if (farm) {
            setEditingHarvestId(harvest.id);
            setSelectedFarm(farm);
            setYieldNoOfCoconut(String(harvest.no_of_coconut ?? harvest.green_coconut ?? ''));
            setYieldAverageWeight(String(harvest.average_weight ?? ''));
            setYieldSellingPrice(String(harvest.price_per_coconut ?? ''));
            setYieldHappyWithYield(harvest.happy_yield === 'Yes' ? 'yes' : harvest.happy_yield === 'No' ? 'no' : '');
            setYieldNextHarvestDate(harvest.next_harvest ? new Date(harvest.next_harvest) : new Date());
            setAddHarvestStep(1);
            setIsModalOpen(true);
        } else {
            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'பண்ணை காணப்படவில்லை' : 'Farm not found');
        }
    };

    const handleDeleteHarvest = async (harvest: any) => {
        setHarvestSummaryMenuOpenId(null);
        const harvestId = harvest?.id;
        if (!harvestId) {
            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'அறுவடை அடையாளம் இல்லை' : 'Harvest id not found');
            return;
        }
        Alert.alert(
            language === 'ta' ? 'அறுவடையை நீக்கு' : 'Delete Harvest',
            language === 'ta' ? 'இந்த அறுவடை பதிவை நீக்க விரும்புகிறீர்களா?' : 'Are you sure you want to delete this harvest record?',
            [
                { text: language === 'ta' ? 'ரத்து' : 'Cancel', style: 'cancel' },
                {
                    text: language === 'ta' ? 'நீக்கு' : 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            const res = await fetch(`${API_CONFIG.BASE_URL}/harvests/${harvestId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                },
                            });
                            const text = await res.text();
                            const json = text ? JSON.parse(text) : {};
                            if (res.ok || res.status === 204) {
                                Alert.alert(language === 'ta' ? 'வெற்றி' : 'Success', language === 'ta' ? 'அறுவடை நீக்கப்பட்டது' : 'Harvest deleted successfully');
                                fetchHarvestData();
                            } else {
                                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', json?.message || (language === 'ta' ? 'நீக்க முடியவில்லை' : 'Failed to delete'));
                            }
                        } catch (err: any) {
                            console.error('Error deleting harvest:', err);
                            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'நீக்க முடியவில்லை' : 'Failed to delete');
                        }
                    },
                },
            ]
        );
    };

    const handleSaveHarvest = async () => {
        if (!editingHarvestId && !selectedFarm) {
            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'தயவுசெய்து பண்ணையைத் தேர்ந்தெடுக்கவும்' : 'Please select a farm');
            return;
        }
        if (!yieldNoOfCoconut.trim() || !yieldAverageWeight.trim() || !yieldSellingPrice.trim() || !yieldHappyWithYield) {
            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'அனைத்து புலங்களையும் நிரப்பவும்' : 'Please fill all yield fields');
            return;
        }

        const harvestDateStr = (d: Date) => d.toISOString().slice(0, 10);
        const token = await AsyncStorage.getItem('authToken');
        setIsSavingHarvest(true);

        try {
            if (editingHarvestId) {
                // PUT /harvests/:id - update existing harvest
                const payload: any = {
                    no_of_coconut: Number(yieldNoOfCoconut) || 0,
                    average_weight: Number(yieldAverageWeight) || 0,
                    price_per_coconut: Number(yieldSellingPrice) || 0,
                    happy_yield: yieldHappyWithYield === 'yes' ? 'Yes' : 'No',
                    next_harvest: harvestDateStr(yieldNextHarvestDate)
                };
                const res = await fetch(`${API_CONFIG.BASE_URL}/harvests/${editingHarvestId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(payload)
                });
                const json = await res.json();
                if (res.ok && (json.status === 'success' || json.success)) {
                    setEditingHarvestId(null);
                    setAddHarvestStep(1);
                    setYieldNoOfCoconut('');
                    setYieldAverageWeight('');
                    setYieldSellingPrice('');
                    setYieldHappyWithYield('');
                    setYieldNextHarvestDate(new Date());
                    setSelectedFarm(null);
                    setIsModalOpen(false);
                    Alert.alert(language === 'ta' ? 'வெற்றி' : 'Success', language === 'ta' ? 'அறுவடை புதுப்பிக்கப்பட்டது. நன்றி!' : 'Harvest updated successfully. Thank you!');
                    fetchHarvestData();
                } else {
                    const msg = json?.message || json?.detail || 'Failed to update harvest';
                    Alert.alert(language === 'ta' ? 'பிழை' : 'Error', msg);
                }
                return;
            }

            // POST - create new harvest
            const landId = selectedFarm.land_id || selectedFarm.farm_id || selectedFarm.id;
            const payload: any = {
                land_id: Number(landId),
                harvest_date: harvestDateStr(new Date()),
                no_of_coconut: Number(yieldNoOfCoconut) || 0,
                average_weight: Number(yieldAverageWeight) || 0,
                price_per_coconut: Number(yieldSellingPrice) || 0,
                happy_yield: yieldHappyWithYield === 'yes' ? 'Yes' : 'No',
                next_harvest: harvestDateStr(yieldNextHarvestDate)
            };
            const res = await fetch(`${API_CONFIG.BASE_URL}/harvests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (res.ok && (json.status === 'success' || json.success)) {
                setGreenCount('');
                setBlackCount('');
                setCopraCount('');
                setSelectedFarm(null);
                setAddHarvestStep(1);
                setYieldNoOfCoconut('');
                setYieldAverageWeight('');
                setYieldSellingPrice('');
                setYieldHappyWithYield('');
                setYieldNextHarvestDate(new Date());
                setIsModalOpen(false);
                Alert.alert(language === 'ta' ? 'வெற்றி' : 'Success', language === 'ta' ? 'அறுவடை விபரங்கள் சேமிக்கப்பட்டது. நன்றி!' : 'Harvest details saved successfully. Thank you!');
                fetchHarvestData();
            } else {
                const msg = json?.message || json?.detail || 'Failed to save harvest';
                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', msg);
            }
        } catch (err: any) {
            console.error('Error saving harvest:', err);
            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்' : 'Failed to save. Please try again');
        } finally {
            setIsSavingHarvest(false);
        }
    };

    const handleDeleteFarm = async (farmId: number) => {
        Alert.alert(
            language === 'ta' ? 'உறுதிப்படுத்தவும்' : 'Confirm Delete',
            language === 'ta' ? 'இந்த பண்ணையை நீக்க விரும்புகிறீர்களா?' : 'Are you sure you want to delete this farm?',
            [
                { text: language === 'ta' ? 'ரத்து' : 'Cancel', style: 'cancel' },
                {
                    text: language === 'ta' ? 'நீக்கு' : 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            const res = await fetch(`${API_CONFIG.BASE_URL}/coconut-farm-details/${farmId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                },
                            });
                            const json = await res.json();
                            if (res.ok && (json.status === 'success' || json.success)) {
                                Alert.alert(language === 'ta' ? 'வெற்றி' : 'Success', language === 'ta' ? 'பண்ணை நீக்கப்பட்டது' : 'Farm deleted successfully');
                                fetchHarvestData();
                            } else {
                                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', json.message || (language === 'ta' ? 'பண்ணையை நீக்க முடியவில்லை' : 'Failed to delete farm'));
                            }
                        } catch (error) {
                            console.error('Delete farm error:', error);
                            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'பண்ணையை நீக்க முடியவில்லை' : 'Failed to delete farm');
                        }
                    }
                }
            ]
        );
    };

    const fetchFarmDetails = async (farmId: number) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(`${API_CONFIG.BASE_URL}/coconut-farm-details/${farmId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const json = await res.json();
            if (res.ok && (json.status === 'success' || json.success)) {
                return json.data;
            } else {
                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', json.message || (language === 'ta' ? 'பண்ணை விவரங்களைப் பெற முடியவில்லை' : 'Failed to fetch farm details'));
                return null;
            }
        } catch (error) {
            console.error('Fetch farm details error:', error);
            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'பண்ணை விவரங்களைப் பெற முடியவில்லை' : 'Failed to fetch farm details');
            return null;
        }
    };

    const handleViewFarm = async (farmId: number) => {
        const details = await fetchFarmDetails(farmId);
        if (details) {
            setViewFarmData(details);
            setIsViewFarmModalOpen(true);
        }
    };

    const handleEditFarm = async (farmId: number) => {
        const details = await fetchFarmDetails(farmId);
        if (details) {
            setEditingFarmId(farmId);
            setNewFarmName(details.land_name || '');

            // Location
            setSelectedStateId(details.state);
            setSelectedState(language === 'ta' ? (details.state_tname || details.state_name) : (details.state_name || details.state_tname));

            setSelectedDistrictId(details.district);
            setSelectedDistrict(language === 'ta' ? (details.district_tname || details.district_name) : (details.district_name || details.district_tname));

            setSelectedTalukId(details.subdistrict);
            setSelectedTaluk(language === 'ta' ? (details.subdistrict_tname || details.subdistrict_name) : (details.subdistrict_name || details.subdistrict_tname));

            setSelectedPanchayatId(details.panchayat);
            setSelectedPanchayat(language === 'ta' ? (details.panchayat_tname || details.panchayat_name) : (details.panchayat_name || details.panchayat_tname));

            setSelectedVillageId(details.village);
            setSelectedVillage(language === 'ta' ? (details.village_tname || details.village_name) : (details.village_name || details.village_tname));

            setLatitude(details.lat || '');
            setLongitude(details.long || '');
            setPincode(details.pincode || '');

            // Land Details
            setOwnershipType(details.ownership_type || '');
            setLandArea(String(details.land_area || ''));

            // Map unit back to dropdown value
            const unit = details.land_areaunit?.toLowerCase() || 'acre';
            const mappedUnit = unit.includes('hectare') ? 'hectare' : (unit.includes('cent') ? 'cent' : 'acre');
            setLandUnit(mappedUnit);

            // Tree Details
            setTreeCount(String(details.no_of_coconut || ''));
            setCoconutType(details.coconut_type || '');
            setAvgTreeAge(String(details.average_of_tree || ''));
            setPlantingType(details.coconut_variety || '');
            // Note: expected_yield might not be in the GET response based on standard fields, but we set it if available
            setExpectedYield(String(details.expected_yield || ''));

            setAddFarmStep(1);
            setIsAddFarmModalOpen(true);

            // Fetch dependent dropdowns to ensure they are populated if user wants to change
            if (details.state) fetchDistricts(details.state);
        }
    };

    const getAddressFromCoords = async (lat: number, long: number) => {
        try {
            const reverseGeocoded = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: long
            });

            if (reverseGeocoded && reverseGeocoded.length > 0) {
                const addr = reverseGeocoded[0];
                // Build address string from available components
                const addressParts = [];
                if (addr.street) addressParts.push(addr.street);
                if (addr.streetNumber) addressParts.push(addr.streetNumber);
                if (addr.district) addressParts.push(addr.district);
                if (addr.subregion) addressParts.push(addr.subregion);
                if (addr.city) addressParts.push(addr.city);
                if (addr.region) addressParts.push(addr.region);
                if (addr.postalCode) addressParts.push(addr.postalCode);
                if (addr.country) addressParts.push(addr.country);

                const addressString = addressParts.length > 0 
                    ? addressParts.join(', ')
                    : (language === 'ta' ? 'முகவரி பெற முடியவில்லை' : 'Address not available');
                
                setLocationAddress(addressString);
            } else {
                setLocationAddress(language === 'ta' ? 'முகவரி பெற முடியவில்லை' : 'Address not available');
            }
        } catch (error) {
            console.log('Error getting address:', error);
            setLocationAddress(language === 'ta' ? 'முகவரி பெற முடியவில்லை' : 'Address not available');
        }
    };

    const processLocationFromCoords = async (lat: number, long: number) => {
        try {
            const reverseGeocoded = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: long
            });

            if (reverseGeocoded && reverseGeocoded.length > 0) {
                const addr = reverseGeocoded[0];
                console.log('Reverse Geocoded Address:', addr);
                if (addr.postalCode) {
                    setPincode(addr.postalCode);
                }
                
                // Get formatted address
                await getAddressFromCoords(lat, long);

                // 1. Match State
                const stateName = addr.region;
                if (stateName) {
                    const matchedState = stateOptions.find((s: any) =>
                        (s.state && s.state.toLowerCase() === stateName.toLowerCase()) ||
                        (s.statet_name && s.statet_name.toLowerCase() === stateName.toLowerCase())
                    );

                    if (matchedState) {
                        const sName = language === 'ta' ? (matchedState.statet_name || matchedState.state) : (matchedState.state || matchedState.statet_name);
                        setSelectedState(sName);
                        setSelectedStateId(matchedState.id);

                        // Fetch Districts
                        const token = await AsyncStorage.getItem('authToken');
                        const distRes = await fetch(`${API_CONFIG.BASE_URL}/districts/state/${matchedState.id}/all`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                            },
                        });
                        const distJson = await distRes.json();
                        if (distJson.status === 'success' && distJson.data?.districts) {
                            setDistrictOptions(distJson.data.districts);

                            // 2. Match District
                            const districtName = addr.subregion || addr.district;
                            if (districtName) {
                                const matchedDistrict = distJson.data.districts.find((d: any) =>
                                    (d.district_name && d.district_name.toLowerCase().includes(districtName.toLowerCase())) ||
                                    (d.district_tname && d.district_tname.toLowerCase().includes(districtName.toLowerCase())) ||
                                    (districtName.toLowerCase().includes(d.district_name.toLowerCase()))
                                );

                                if (matchedDistrict) {
                                    const dName = language === 'ta' ? (matchedDistrict.district_tname || matchedDistrict.district_name) : (matchedDistrict.district_name || matchedDistrict.district_tname);
                                    setSelectedDistrict(dName);
                                    setSelectedDistrictId(matchedDistrict.id);

                                    // Fetch Subdistricts
                                    const subRes = await fetch(`${API_CONFIG.BASE_URL}/subdistricts/district/${matchedDistrict.id}/all`, {
                                        method: 'GET',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                                        },
                                    });
                                    const subJson = await subRes.json();
                                    if (subJson.status === 'success' && subJson.data?.subdistricts) {
                                        setSubdistrictOptions(subJson.data.subdistricts);
                                    }
                                }
                            }
                        }
                    }
                }
                return true;
            }
        } catch (geoError) {
            console.log('Reverse geocoding failed', geoError);
        }
        return false;
    };

    const getCurrentLocation = async () => {
        try {
            setIsGettingLocation(true);

            // Request location permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    language === 'ta' ? 'அனுமதி தேவை' : 'Permission Required',
                    language === 'ta' ? 'இருப்பிட அனுமதி தேவை. தயவுசெய்து அனுமதியை வழங்கவும்.' : 'Location permission is required. Please grant permission in settings.'
                );
                setIsGettingLocation(false);
                return;
            }

            // Get current position
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            // Set latitude and longitude
            setLatitude(location.coords.latitude.toString());
            setLongitude(location.coords.longitude.toString());

            // Clear location dropdown fields initially
            setSelectedState('');
            setSelectedStateId(null);
            setSelectedDistrict('');
            setSelectedDistrictId(null);
            setSelectedTaluk('');
            setSelectedTalukId(null);
            setSelectedPanchayat('');
            setSelectedPanchayatId(null);
            setSelectedVillage('');
            setSelectedVillageId(null);
            setDistrictOptions([]);
            setSubdistrictOptions([]);
            setPanchayatOptions([]);
            setVillageOptions([]);

            // Attempt to reverse geocode and fill fields (optional; we still move to step 3)
            await processLocationFromCoords(location.coords.latitude, location.coords.longitude);
            
            // Fetch address for display in alert
            let addressText = '';
            try {
                const reverseGeocoded = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                });
                if (reverseGeocoded && reverseGeocoded.length > 0) {
                    const addr = reverseGeocoded[0];
                    const addressParts = [];
                    if (addr.street) addressParts.push(addr.street);
                    if (addr.streetNumber) addressParts.push(addr.streetNumber);
                    if (addr.district) addressParts.push(addr.district);
                    if (addr.subregion) addressParts.push(addr.subregion);
                    if (addr.city) addressParts.push(addr.city);
                    if (addr.region) addressParts.push(addr.region);
                    if (addr.postalCode) addressParts.push(addr.postalCode);
                    if (addr.country) addressParts.push(addr.country);
                    addressText = addressParts.length > 0 ? addressParts.join(', ') : '';
                }
            } catch (addrError) {
                console.log('Error getting address for alert:', addrError);
            }
            
            setAddFarmStep(3); // Move to step 3; do not show state/district/village dropdowns

            // Build alert message with address
            const lat = location.coords.latitude.toFixed(6);
            const long = location.coords.longitude.toFixed(6);
            let alertMessage = '';
            
            if (language === 'ta') {
                alertMessage = `இருப்பிடம் பெறப்பட்டது:\n\n`;
                if (addressText) {
                    alertMessage += `முகவரி: ${addressText}\n\n`;
                }
                alertMessage += `அட்சரேகை: ${lat}\nதீர்க்கரேகை: ${long}`;
            } else {
                alertMessage = `Location captured:\n\n`;
                if (addressText) {
                    alertMessage += `Address: ${addressText}\n\n`;
                }
                alertMessage += `Latitude: ${lat}\nLongitude: ${long}`;
            }

            Alert.alert(
                language === 'ta' ? 'வெற்றி' : 'Success',
                alertMessage
            );
        } catch (error: any) {
            console.error('Error getting location:', error);
            Alert.alert(
                language === 'ta' ? 'பிழை' : 'Error',
                language === 'ta' ? 'இருப்பிடத்தை பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'Failed to get location. Please try again.'
            );
        } finally {
            setIsGettingLocation(false);
        }
    };

    const handleSaveFarm = async () => {
        if (!newFarmName.trim()) {
            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'தயவுசெய்து பண்ணை பெயரை உள்ளிடவும்' : 'Please enter farm name');
            return;
        }

        // Build payload matching API expectations
        const unitMap: any = { acre: 'acres', hectare: 'hectare', cent: 'cent' };
        const payload: any = {
            land_name: newFarmName,
            state: selectedStateId ? String(selectedStateId) : '',
            district: selectedDistrictId ? String(selectedDistrictId) : '',
            subdistrict: selectedTalukId ? String(selectedTalukId) : '',
            panchayat: selectedPanchayatId ? String(selectedPanchayatId) : '',
            village: selectedVillageId ? String(selectedVillageId) : '',
            pincode: pincode,
            ownership_type: ownershipType,
            land_area: landArea,
            land_areaunit: unitMap[landUnit] || landUnit,
            no_of_coconut: treeCount,
            coconut_type: coconutType,
            average_of_tree: avgTreeAge,
            coconut_variety: plantingType
        };

        // Add latitude and longitude if available
        if (latitude && longitude) {
            payload.lat = latitude;
            payload.long = longitude;
        }

        // If we're on the final summary step (5), call the coconut-farm-details API
        if (addFarmStep === 5) {
            setIsSavingFarm(true);
            try {
                const token = await AsyncStorage.getItem('authToken');
                const url = editingFarmId
                    ? `${API_CONFIG.BASE_URL}/coconut-farm-details/${editingFarmId}`
                    : `${API_CONFIG.BASE_URL}/coconut-farm-details`;

                console.log('Update Farm Payload:', JSON.stringify(payload, null, 2)); // Log payload
                const res = await fetch(url, {
                    method: editingFarmId ? 'PUT' : 'POST', // Updating farm details use PUT
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(payload)
                });

                const json = await res.json();
                console.log('Update Farm Response:', JSON.stringify(json, null, 2)); // Log response
                if (res.ok && (json.status === 'success' || json.success)) {
                    // Reset form state
                    setNewFarmName('');
                    setSelectedState(''); setSelectedStateId(null); setDistrictOptions([]);
                    setSelectedDistrict(''); setSelectedDistrictId(null); setSubdistrictOptions([]);
                    setSelectedTaluk(''); setSelectedTalukId(null); setPanchayatOptions([]);
                    setSelectedPanchayat(''); setSelectedPanchayatId(null); setVillageOptions([]);
                    setSelectedVillage(''); setSelectedVillageId(null);

                    setOwnershipType(''); setLandArea(''); setLandUnit('acre'); setIsUnitDropdownOpen(false);
                    setTreeCount(''); setCoconutType(''); setAvgTreeAge(''); setPlantingType(''); setExpectedYield('');
                    setLatitude(''); setLongitude(''); setLocationAddress('');
                    setPincode('');
                    setEditingFarmId(null);

                    setIsAddFarmModalOpen(false);
                    setAddFarmStep(1);
                    Alert.alert(language === 'ta' ? 'வெற்றி' : 'Success', language === 'ta' ? (editingFarmId ? 'பண்ணை விவரங்கள் புதுப்பிக்கப்பட்டன' : 'பண்ணை விவரங்கள் சேமிக்கப்பட்டன') : (editingFarmId ? 'Farm details updated successfully' : 'Coconut farm details saved successfully'));

                    // Refresh and redirect to Harvest page
                    fetchHarvestData();
                    router.replace('/harvest');
                } else {
                    const msg = json?.message || json?.detail || 'Failed to save';
                    Alert.alert(language === 'ta' ? 'பிழை' : 'Error', msg);
                }
            } catch (err: any) {
                console.error('Error saving coconut details', err);
                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்' : 'Failed to save. Please try again');
            } finally {
                setIsSavingFarm(false);
            }
            return;
        }

        // Fallback: if not on step 5, just close as before
        console.log('Saving Farm (local):', payload);
        setNewFarmName('');
        setLatitude('');
        setLongitude('');
        setLocationAddress('');
        setIsAddFarmModalOpen(false);
        setAddFarmStep(1);
        Alert.alert(language === 'ta' ? 'வெற்றி' : 'Success', language === 'ta' ? 'பண்ணை சேமிக்கப்பட்டது' : 'Farm saved successfully');
        fetchHarvestData();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Top Standard Header */}
            <View style={styles.topAppBar}>
                <TouchableOpacity style={styles.hamburger} onPress={() => openSideMenu()}>
                    <Ionicons name="menu" size={20} color="#ffffff" />
                </TouchableOpacity>
                <Image
                    source={language === 'ta'
                        ? require('../assets/images/naam-logo-ta.png')
                        : require('../assets/images/naam-logo-en.png')
                    }
                    style={styles.topAppBarLogo}
                    resizeMode="contain"
                />
                <HeaderNotificationIcon />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 80, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                {isHarvestDataLoading ? (
                    <View style={{ flex: 1, minHeight: 280, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }}>
                        <ActivityIndicator size="large" color="#16a34a" />
                        <ThemedText style={{ marginTop: 12, fontSize: 14, color: '#64748b' }}>{language === 'ta' ? 'பொறுத்துக்கொண்டும்...' : 'Loading...'}</ThemedText>
                    </View>
                ) : (
                <>
                {/* Green Banner */}
                <View style={styles.banner}>
                    <ThemedText style={styles.bannerTitle}>{language === 'ta' ? 'எனது அறுவடை' : 'My Harvests'}</ThemedText>
                    <ThemedText style={styles.bannerSubtitle}>
                        {language === 'ta'
                            ? `மொத்தம் ${data?.harvest_history?.length || 0} பதிவுகள்`
                            : `Total ${data?.harvest_history?.length || 0} Records`}
                    </ThemedText>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Ionicons name="cube-outline" size={16} color="#2563eb" />
                            <ThemedText style={styles.statLabel}>{language === 'ta' ? 'அறுவடை செய்யப்பட்ட எண்ணிக்கை' : 'Harvested Quantity'}</ThemedText>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <ThemedText style={styles.statValue}>{data?.total_quantity || 0}</ThemedText>
                        </View>
                    </View>
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Ionicons name="trending-up" size={16} color="#166534" />
                            <ThemedText style={styles.statLabel}>{language === 'ta' ? 'அடுத்த அறுவடை எண்ணிக்கை' : 'Next Harvest'}</ThemedText>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <ThemedText style={styles.statValue}>{data?.current_month_quantity || 0}</ThemedText>
                            <ThemedText style={styles.statSubValue}>{language === 'ta' ? '(தோராயமாக)' : '(approx)'}</ThemedText>
                        </View>
                    </View>
                </View>

                {/* Farm Details Section */}
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleWrap}>
                        <Ionicons name="leaf-outline" size={18} color="#166534" />
                        <ThemedText style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">{language === 'ta' ? 'எனது பண்ணைகள்' : 'My Farm Details'}</ThemedText>
                    </View>
                    <TouchableOpacity style={styles.addFarmButton} onPress={() => { setIsAddFarmModalOpen(true); setAddFarmStep(1); }}>
                        <ThemedText style={styles.addFarmButtonText} numberOfLines={1}>{language === 'ta' ? '+ புதிய பண்ணை' : '+ Add Farm'}</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Dynamic Farm Cards from API */}
                {data?.my_farms && data.my_farms.length > 0 ? (
                    data.my_farms.map((farm: any, idx: number) => {
                        const title = farm.land_name || farm.land_id || `Farm ${idx + 1}`;
                        const taluk = language === 'ta' ? (farm.taluk_tname || farm.taluk_name) : (farm.taluk_name || farm.taluk_tname);
                        const village = language === 'ta' ? (farm.village_tname || farm.village_name) : (farm.village_name || farm.village_tname);
                        const nextHarvest = farm.last_harvest?.next_harvest || null;
                        const isActive = farm.coconut_status === 1 || farm.land_status === 1;
                        const nextHarvestExceeded = nextHarvest ? new Date() > new Date(nextHarvest) : false;
                        // Show Add Harvest when there is no next harvest date, or when next harvest date has passed
                        const showHarvestButton = !nextHarvest || nextHarvestExceeded;
                        const isUpdateYield = !!farm.last_harvest && nextHarvestExceeded;

                        return (
                            <View key={farm.land_id || farm.farm_id || idx} style={[styles.farmCard, idx > 0 && { marginTop: 12 }]}>
                                <View>
                                    <View style={styles.farmHeader}>
                                        <View style={{ flex: 1 }}>
                                            <ThemedText style={styles.farmName}>{title}</ThemedText>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, position: 'relative' }}>
                                            <View style={styles.tag}>
                                                <View style={[styles.tagDot, { backgroundColor: isActive ? '#10b981' : '#94a3b8' }]} />
                                                <ThemedText style={styles.tagText}>{isActive ? (language === 'ta' ? 'பச்சை' : 'Green') : (language === 'ta' ? 'முடக்கப்பட்டது' : 'Inactive')}</ThemedText>
                                            </View>

                                            <TouchableOpacity onPress={(e) => { e?.stopPropagation?.(); setFarmMenuOpenId(farmMenuOpenId === (farm.land_id || farm.farm_id || farm.id) ? null : (farm.land_id || farm.farm_id || farm.id)); }}>
                                                <Ionicons name="ellipsis-vertical" size={22} color="#64748b" />
                                            </TouchableOpacity>
                                            {farmMenuOpenId === (farm.land_id || farm.farm_id || farm.id) && (
                                                <View style={styles.farmMenuDropdown}>
                                                    <TouchableOpacity style={styles.farmMenuItem} onPress={() => { handleViewFarm(farm.id || farm.land_id || farm.farm_id); setFarmMenuOpenId(null); }}>
                                                        <Ionicons name="eye-outline" size={18} color="#3b82f6" />
                                                        <ThemedText style={{ marginLeft: 10, fontSize: 14, color: '#1e293b', fontWeight: '500' }}>{language === 'ta' ? 'பார்க்க' : 'View'}</ThemedText>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={styles.farmMenuItem} onPress={() => { handleEditFarm(farm.id || farm.land_id || farm.farm_id); setFarmMenuOpenId(null); }}>
                                                        <Ionicons name="create-outline" size={18} color="#f59e0b" />
                                                        <ThemedText style={{ marginLeft: 10, fontSize: 14, color: '#1e293b', fontWeight: '500' }}>{language === 'ta' ? 'திருத்து' : 'Edit'}</ThemedText>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={styles.farmMenuItem} onPress={() => { handleDeleteFarm(farm.id || farm.land_id || farm.farm_id); setFarmMenuOpenId(null); }}>
                                                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                                        <ThemedText style={{ marginLeft: 10, fontSize: 14, color: '#ef4444', fontWeight: '500' }}>{language === 'ta' ? 'நீக்கு' : 'Delete'}</ThemedText>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.farmLocRow}>
                                        <Ionicons name="location-outline" size={14} color="#64748b" />
                                        <ThemedText style={styles.farmLoc}>{taluk}{taluk && village ? ', ' : ''}{village}</ThemedText>
                                    </View>

                                    <View style={styles.farmAlertRow}>
                                        <Ionicons name="calendar-outline" size={14} color="#dc2626" />
                                        <ThemedText style={styles.farmAlert}>{nextHarvest ? `${language === 'ta' ? 'அறுவடை செய்ய வேண்டும்' : 'Due for harvest'} ${formatDate(nextHarvest)}` : (language === 'ta' ? 'அட்டவணை இல்லை' : 'No schedule')}</ThemedText>
                                    </View>
                                </View>

                                <View style={{ marginTop: 12 }}>
                                        <View style={styles.smallStatsRow}>
                                            <View style={styles.smallStatBox}>
                                                <ThemedText style={styles.smallStatLabel}>{language === 'ta' ? 'நிலம்' : 'Land'}</ThemedText>
                                                <ThemedText style={styles.smallStatValue}>{farm.land_area} {getUnitLabelFromApi(farm.land_areaunit)}</ThemedText>
                                            </View>
                                            <View style={styles.smallStatBox}>
                                                <ThemedText style={styles.smallStatLabel}>{language === 'ta' ? 'மரங்கள்' : 'Trees'}</ThemedText>
                                                <ThemedText style={styles.smallStatValue}>{farm.no_of_coconut || '-'}</ThemedText>
                                            </View>
                                            <View style={styles.smallStatBox}>
                                                <ThemedText style={styles.smallStatLabel}>{language === 'ta' ? 'வகை' : 'Type'}</ThemedText>
                                                <ThemedText style={styles.smallStatValue}>{farm.ownership_type || '-'}</ThemedText>
                                            </View>
                                        </View>
                                        <ThemedText style={{ color: '#064e3b', fontWeight: '700' }}>{language === 'ta' ? 'அறுவடை அட்டவணை' : 'Harvest Schedule'}</ThemedText>

                                        {farm.last_harvest ? (
                                            <View style={[styles.infoNote, { backgroundColor: '#ecfdf5', borderLeftColor: '#bbf7d0', marginTop: 12 }]}>
                                                <ThemedText style={{ color: '#064e3b', fontWeight: '300', fontSize: 10 }}>{language === 'ta' ? 'கடைசி அறுவடை' : 'Last Harvest'}</ThemedText>
                                                <View style={{ height: 8 }} />
                                                <View style={{ flexDirection: 'row', gap: 6 }}>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', padding: 6, borderRadius: 8 }}>
                                                        <ThemedText style={{ fontWeight: '600', fontSize: 12 }} numberOfLines={1}>{farm.last_harvest.harvest_date ? formatDate(farm.last_harvest.harvest_date) : '-'}</ThemedText>
                                                        <ThemedText style={{ fontSize: 9, color: '#475569' }} numberOfLines={1}>{language === 'ta' ? 'தேதி' : 'Date'}</ThemedText>
                                                    </View>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', padding: 6, borderRadius: 8 }}>
                                                        <ThemedText style={{ fontWeight: '600', fontSize: 12 }} numberOfLines={1}>{farm.last_harvest.no_of_coconut ?? farm.last_harvest.green_coconut ?? '-'}</ThemedText>
                                                        <ThemedText style={{ fontSize: 9, color: '#475569' }} numberOfLines={1}>{language === 'ta' ? 'எண்ணிக்கை' : 'Nos'}</ThemedText>
                                                    </View>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', padding: 6, borderRadius: 8 }}>
                                                        <ThemedText style={{ fontWeight: '600', fontSize: 12 }} numberOfLines={1}>{farm.last_harvest.average_weight != null ? `${farm.last_harvest.average_weight}g` : '-'}</ThemedText>
                                                        <ThemedText style={{ fontSize: 9, color: '#475569' }} numberOfLines={1}>{language === 'ta' ? 'சராசரி எடை/தேங்காய்' : 'Avg.Weight/piece'}</ThemedText>
                                                    </View>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', padding: 6, borderRadius: 8 }}>
                                                        <ThemedText style={{ fontWeight: '600', fontSize: 12 }} numberOfLines={1}>{farm.last_harvest.price_per_coconut != null && farm.last_harvest.price_per_coconut !== '' ? `₹${farm.last_harvest.price_per_coconut}` : '-'}</ThemedText>
                                                        <ThemedText style={{ fontSize: 9, color: '#475569' }} numberOfLines={1}>{language === 'ta' ? 'விலை/தேங்காய்' : 'Price/piece'}</ThemedText>
                                                    </View>
                                                </View>
                                            </View>
                                        ) : (
                                            <ThemedText style={{ color: '#64748b', fontSize: 13, marginTop: 12 }}>{language === 'ta' ? 'கடைசி அறுவடை பதிவு இல்லை' : 'No last harvest recorded'}</ThemedText>
                                        )}

                                        {showHarvestButton && (
                                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                                            <TouchableOpacity style={[styles.nextBtn, { flex: 1, paddingHorizontal: 12, minHeight: 44 }]} onPress={() => { setEditingHarvestId(null); setSelectedFarm(farm); setIsModalOpen(true); }}>
                                                <ThemedText style={[styles.nextBtnText, { textAlign: 'center', fontSize: 14 }]} numberOfLines={1}>{isUpdateYield ? (language === 'ta' ? 'விளைச்சலை புதுப்பி' : 'Update Yield') : (language === 'ta' ? 'அறுவடை சேர்க்க' : 'Add Harvest')}</ThemedText>
                                            </TouchableOpacity>
                                        </View>
                                        )}
                                    </View>
                            </View>
                        );
                    })
                ) : (
                    <View style={styles.farmCardEmpty}>
                        <ThemedText style={{ color: '#64748b', marginBottom: 16 }}>{language === 'ta' ? 'பண்ணைகள் இல்லை' : 'No farms found'}</ThemedText>
                        <TouchableOpacity style={styles.addFarmButton} onPress={() => { setIsAddFarmModalOpen(true); setAddFarmStep(1); }}>
                            <ThemedText style={styles.addFarmButtonText}>{language === 'ta' ? '+ புதிய பண்ணை' : '+ Add Farm'}</ThemedText>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Harvest Summary - below My Farm Details */}
                {data?.harvest_history && data.harvest_history.length > 0 && (
                    <>
                        <View style={[styles.sectionHeaderRow, { marginTop: 24, marginBottom: 12 }]}>
                            <View style={styles.sectionTitleWrap}>
                                <Ionicons name="document-text-outline" size={18} color="#166534" />
                                <ThemedText style={styles.sectionTitle}>{language === 'ta' ? 'அறுவடை சுருக்கம்' : 'Harvest Summary'}</ThemedText>
                            </View>
                        </View>
                        {data.harvest_history.map((harvest: any, index: number) => {
                            const display = (val: any) => (val != null && val !== '' ? String(val) : '-');
                            const isMenuOpen = harvestSummaryMenuOpenId === harvest.id;
                            return (
                                <View key={harvest.id || index} style={[styles.harvestSummaryCard, index > 0 && { marginTop: 12 }]}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <ThemedText style={styles.harvestSummaryFarmName}>{harvest.land_name || (language === 'ta' ? 'பண்ணை' : 'Farm')}</ThemedText>
                                        <View style={{ position: 'relative' }}>
                                            <TouchableOpacity onPress={() => setHarvestSummaryMenuOpenId(isMenuOpen ? null : harvest.id)}>
                                                <Ionicons name="ellipsis-vertical" size={22} color="#64748b" />
                                            </TouchableOpacity>
                                            {isMenuOpen && (
                                                <View style={styles.farmMenuDropdown}>
                                                    <TouchableOpacity style={styles.farmMenuItem} onPress={() => handleEditHarvest(harvest)}>
                                                        <Ionicons name="create-outline" size={18} color="#f59e0b" />
                                                        <ThemedText style={{ marginLeft: 10, fontSize: 14, color: '#1e293b', fontWeight: '500' }}>{language === 'ta' ? 'திருத்து' : 'Edit'}</ThemedText>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={styles.farmMenuItem} onPress={() => handleDeleteHarvest(harvest)}>
                                                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                                        <ThemedText style={{ marginLeft: 10, fontSize: 14, color: '#ef4444', fontWeight: '500' }}>{language === 'ta' ? 'நீக்கு' : 'Delete'}</ThemedText>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.harvestSummaryGrid}>
                                        <View style={styles.harvestSummaryItem}>
                                            <ThemedText style={styles.harvestSummaryLabel}>{language === 'ta' ? 'அறுவடை தேதி' : 'Harvest date'}</ThemedText>
                                            <ThemedText style={styles.harvestSummaryValue}>{harvest.harvest_date ? formatDate(harvest.harvest_date) : '-'}</ThemedText>
                                        </View>
                                        <View style={styles.harvestSummaryItem}>
                                            <ThemedText style={styles.harvestSummaryLabel}>{language === 'ta' ? 'தேங்காய் எண்ணிக்கை' : 'No of coconuts'}</ThemedText>
                                            <ThemedText style={styles.harvestSummaryValue}>{display(harvest.no_of_coconut ?? harvest.green_coconut)}</ThemedText>
                                        </View>
                                        <View style={styles.harvestSummaryItem}>
                                            <ThemedText style={styles.harvestSummaryLabel}>{language === 'ta' ? 'சராசரி எடை/தேங்காய்' : 'Average weight/Piece'}</ThemedText>
                                            <ThemedText style={styles.harvestSummaryValue}>{harvest.average_weight != null ? `${harvest.average_weight}g` : '-'}</ThemedText>
                                        </View>
                                        <View style={styles.harvestSummaryItem}>
                                            <ThemedText style={styles.harvestSummaryLabel}>{language === 'ta' ? 'விலை/தேங்காய்' : 'Price/coconut'}</ThemedText>
                                            <ThemedText style={styles.harvestSummaryValue}>{harvest.price_per_coconut != null && harvest.price_per_coconut !== '' ? `₹${harvest.price_per_coconut}` : '-'}</ThemedText>
                                        </View>
                                        <View style={[styles.harvestSummaryItem, { borderBottomWidth: 0 }]}>
                                            <ThemedText style={styles.harvestSummaryLabel}>{language === 'ta' ? 'அடுத்த அறுவடை' : 'Next harvest'}</ThemedText>
                                            <ThemedText style={styles.harvestSummaryValue}>{harvest.next_harvest ? formatDate(harvest.next_harvest) : '-'}</ThemedText>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}

                {/* Page-level Harvest Schedule Button */}
                {/* <TouchableOpacity style={styles.pageOutlineBtn} onPress={() => {
                    // Open schedule modal for the expanded farm if available, else first farm
                    let farmToOpen = null;
                    if (expandedFarmId && data?.my_farms) {
                        farmToOpen = data.my_farms.find((f: any) => (f.land_id || f.farm_id) === expandedFarmId);
                    }
                    if (!farmToOpen && data?.my_farms && data.my_farms.length > 0) {
                        farmToOpen = data.my_farms[0];
                    }
                    if (farmToOpen) {
                        openScheduleModal(farmToOpen);
                    } else {
                        Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'பண்ணைகள் இல்லை' : 'No farms found');
                    }
                }}>
                    <Ionicons name="calendar-outline" size={18} color="#0369a1" />
                    <ThemedText style={styles.pageOutlineBtnText}>{language === 'ta' ? 'அறுவடை அட்டவணை நிர்வகி' : 'Manage Harvest Schedule'}</ThemedText> 
                </TouchableOpacity>*/}

                {/* Add New Harvest Button */}
                {/*<TouchableOpacity style={styles.addHarvestBtn} onPress={() => setIsModalOpen(true)}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <ThemedText style={styles.addHarvestBtnText}>{language === 'ta' ? 'புதிய அறுவடை சேர்க்க' : 'Add New Harvest'}</ThemedText>
                </TouchableOpacity> */}

                {/* Harvest History */}
                {/* <ThemedText style={styles.historyTitle}>{language === 'ta' ? 'அறுவடை வரலாறு' : 'Harvest History'}</ThemedText>*/}

                {/*{data?.harvest_history?.map((harvest: any, index: number) => (
                    <View key={harvest.id || index} style={[styles.historyCard, index > 0 && { marginTop: 16 }]}>
                        <View style={styles.historyHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={styles.historyIcon}>
                                    <Ionicons name="ellipse" size={24} color="#a8a29e" />
                                </View>
                                <View>
                                    <ThemedText style={styles.historyItemName}>{language === 'ta' ? 'தேங்காய் அறுவடை' : 'Coconut Harvest'}</ThemedText>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                                        <ThemedText style={styles.historyDate}>{formatDate(harvest.harvest_date)}</ThemedText>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.statusBadge}>
                                <ThemedText style={styles.statusText}>Created</ThemedText>
                            </View>
                        </View>

                        <View style={styles.gridRow}>
                            <View style={styles.gridItem}>
                                <ThemedText style={styles.gridLabel}>{language === 'ta' ? 'பச்சை' : 'Green'}</ThemedText>
                                <ThemedText style={styles.gridValue}>{harvest.green_coconut}</ThemedText>
                            </View>
                            <View style={styles.gridItem}>
                                <ThemedText style={styles.gridLabel}>{language === 'ta' ? 'கருப்பு' : 'Black'}</ThemedText>
                                <ThemedText style={styles.gridValue}>{harvest.black_coconut}</ThemedText>
                            </View>
                            <View style={styles.gridItem}>
                                <ThemedText style={styles.gridLabel}>{language === 'ta' ? 'கொப்பரா' : 'Copra'}</ThemedText>
                                <ThemedText style={styles.gridValue}>{harvest.copra}</ThemedText>
                            </View>
                        </View>

                        <View style={styles.infoBox}>
                            <ThemedText style={styles.infoText}>
                                {language === 'ta'
                                    ? `நீங்கள் ${parseInt(harvest.green_coconut || '0') + parseInt(harvest.black_coconut || '0')} தேங்காய்கள் அறுவடை செய்துள்ளீர்கள். விற்றுவிட்டீர்களா?`
                                    : `You have harvested ${parseInt(harvest.green_coconut || '0') + parseInt(harvest.black_coconut || '0')} coconuts. Have you sold them?`}
                            </ThemedText>
                            <TouchableOpacity>
                                <ThemedText style={styles.linkText}>{language === 'ta' ? 'விற்பனை விவரங்களை சேர்க்கவும்' : 'Add sales details'}</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))} */}

                </>
                )}
            </ScrollView>

            {/* Add Harvest Modal - Yield update form then Summary & Submit */}
            <Modal animationType="slide" transparent={true} visible={isModalOpen} onRequestClose={closeAddHarvestModal}>
                <SafeAreaView style={{ flex: 1 }} edges={[]}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <ThemedText style={styles.modalTitle}>
                                        {addHarvestStep === 1
                                            ? (editingHarvestId ? (language === 'ta' ? 'அறுவடை திருத்து' : 'Edit Harvest') : (language === 'ta' ? 'புதிய அறுவடை சேர்க்க' : 'Add New Harvest'))
                                            : (language === 'ta' ? 'சுருக்கம்' : 'Summary')}
                                    </ThemedText>
                                    <TouchableOpacity onPress={closeAddHarvestModal}>
                                        <Ionicons name="close" size={24} color="#64748b" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                                >
                                    {addHarvestStep === 1 ? (
                                        <>
                                            {/* Yield update form */}
                                            <ThemedText style={[styles.inputLabel, { fontSize: 16, fontWeight: '700', marginBottom: 12 }]}>{language === 'ta' ? 'விளைச்சல் புதுப்பிப்பு' : 'Yield update'}</ThemedText>

                                            <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'தேங்காய் எண்ணிக்கை' : 'No of Coconut'}</ThemedText>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                                <TextInput
                                                    style={[styles.input, { flex: 1 }]}
                                                    keyboardType="numeric"
                                                    placeholder="2500"
                                                    value={yieldNoOfCoconut}
                                                    onChangeText={setYieldNoOfCoconut}
                                                />
                                                <ThemedText style={{ marginLeft: 8, color: '#64748b', fontSize: 14 }}>{language === 'ta' ? 'துண்டுகள்' : 'Pieces'}</ThemedText>
                                            </View>

                                            <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'சராசரி எடை' : 'Average weight'}</ThemedText>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                                <TextInput
                                                    style={[styles.input, { flex: 1 }]}
                                                    keyboardType="numeric"
                                                    placeholder="450"
                                                    value={yieldAverageWeight}
                                                    onChangeText={setYieldAverageWeight}
                                                />
                                                <ThemedText style={{ marginLeft: 8, color: '#64748b', fontSize: 14 }}>g/Piece</ThemedText>
                                            </View>

                                            <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'விற்பனை விலை' : 'Selling Price'}</ThemedText>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                                <TextInput
                                                    style={[styles.input, { flex: 1 }]}
                                                    keyboardType="numeric"
                                                    placeholder="25"
                                                    value={yieldSellingPrice}
                                                    onChangeText={setYieldSellingPrice}
                                                />
                                                <ThemedText style={{ marginLeft: 8, color: '#64748b', fontSize: 14 }}>RS/Piece</ThemedText>
                                            </View>

                                            <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'விளைச்சலில் மகிழ்ச்சியா?' : 'Are you happy with yield?'}</ThemedText>
                                            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                                                <TouchableOpacity
                                                    style={[styles.radioCard, yieldHappyWithYield === 'yes' && styles.radioCardSelected]}
                                                    onPress={() => setYieldHappyWithYield('yes')}
                                                >
                                                    <ThemedText style={{ fontWeight: '600', color: yieldHappyWithYield === 'yes' ? '#064e3b' : '#64748b' }}>{language === 'ta' ? 'ஆம்' : 'Yes'}</ThemedText>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.radioCard, yieldHappyWithYield === 'no' && styles.radioCardSelected]}
                                                    onPress={() => setYieldHappyWithYield('no')}
                                                >
                                                    <ThemedText style={{ fontWeight: '600', color: yieldHappyWithYield === 'no' ? '#064e3b' : '#64748b' }}>{language === 'ta' ? 'இல்லை' : 'No'}</ThemedText>
                                                </TouchableOpacity>
                                            </View>

                                            <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'அடுத்த அறுவடை எப்போது திட்டமிடப்பட்டுள்ளது?' : 'When is next harvest Planned?'}</ThemedText>
                                            <TouchableOpacity style={styles.dateInput} onPress={() => setShowYieldNextHarvestPicker(true)}>
                                                <ThemedText style={styles.inputText}>{formatDate(yieldNextHarvestDate)}</ThemedText>
                                                <Ionicons name="calendar-outline" size={20} color="#64748b" />
                                            </TouchableOpacity>
                                            {showYieldNextHarvestPicker && (
                                                <DateTimePicker
                                                    value={yieldNextHarvestDate}
                                                    mode="date"
                                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                    onChange={handleYieldNextHarvestDateChange}
                                                />
                                            )}

                                            <View style={{ height: 20 }} />
                                            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: '#0f6b36' }]} onPress={handleYieldUpdate}>
                                                <ThemedText style={[styles.nextBtnText, { color: '#fff' }]}>{language === 'ta' ? 'சேமி' : 'UPDATE'}</ThemedText>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            {/* Summary & Submit */}
                                            <View style={[styles.infoNote, { backgroundColor: '#ecfdf5', borderLeftColor: '#10b981', marginBottom: 20 }]}>
                                                <ThemedText style={{ color: '#064e3b', fontWeight: '600', marginBottom: 8 }}>{language === 'ta' ? 'சுருக்கம்' : 'Summary'}</ThemedText>
                                                <ThemedText style={{ color: '#0f172a', marginBottom: 4 }}>{language === 'ta' ? 'தேங்காய் எண்ணிக்கை' : 'No of Coconut'}: {yieldNoOfCoconut}</ThemedText>
                                                <ThemedText style={{ color: '#0f172a', marginBottom: 4 }}>{language === 'ta' ? 'சராசரி எடை' : 'Avg weight'}: {yieldAverageWeight}g/piece</ThemedText>
                                                <ThemedText style={{ color: '#0f172a', marginBottom: 4 }}>{language === 'ta' ? 'விலை/துண்டு' : 'Price/Piece'}: {yieldSellingPrice}/piece</ThemedText>
                                                <ThemedText style={{ color: '#0f172a', marginTop: 8 }}>{language === 'ta' ? 'அடுத்த அறுவடை தேதி' : 'Next harvest date'}: {formatDate(yieldNextHarvestDate)}</ThemedText>
                                            </View>

                                            <TouchableOpacity style={[styles.submitBtn, isSavingHarvest && styles.nextBtnDisabled]} disabled={isSavingHarvest} onPress={handleYieldSubmit}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                    {isSavingHarvest ? <ActivityIndicator size="small" color="#fff" /> : null}
                                                    <ThemedText style={styles.submitBtnText}>{isSavingHarvest ? (language === 'ta' ? 'சேமுகிறது...' : 'Saving...') : (language === 'ta' ? 'சமர்ப்பிக்கவும்' : 'Submit')}</ThemedText>
                                                </View>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={{ marginTop: 12, alignSelf: 'center' }} onPress={() => setAddHarvestStep(1)}>
                                                <ThemedText style={{ color: '#0f6b36', fontSize: 14, fontWeight: '600' }}>{language === 'ta' ? '« முந்தையது' : '« Back'}</ThemedText>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </ScrollView>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {/* View Harvest Detail Modal - fetches via GET /harvests/:id */}
            <Modal visible={viewHarvestId !== null || !!viewHarvestDetail} transparent animationType="fade" onRequestClose={() => { setViewHarvestId(null); setViewHarvestDetail(null); setIsViewHarvestLoading(false); }}>
                <View style={[styles.modalOverlay, { justifyContent: 'center', alignItems: 'center', padding: 16 }]}>
                    <View style={[styles.modalContent, { maxHeight: '70%' }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>{language === 'ta' ? 'அறுவடை விவரம்' : 'Harvest Detail'}</ThemedText>
                            <TouchableOpacity onPress={() => { setViewHarvestId(null); setViewHarvestDetail(null); setIsViewHarvestLoading(false); }}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        {isViewHarvestLoading ? (
                            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#16a34a" />
                                <ThemedText style={{ marginTop: 12, fontSize: 14, color: '#64748b' }}>{language === 'ta' ? 'ஏற்றுகிறது...' : 'Loading...'}</ThemedText>
                            </View>
                        ) : viewHarvestDetail ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <ThemedText style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>{viewHarvestDetail.land_name || (language === 'ta' ? 'பண்ணை' : 'Farm')}</ThemedText>
                                <View style={[styles.harvestSummaryGrid, { marginBottom: 0 }]}>
                                    <View style={styles.harvestSummaryItem}>
                                        <ThemedText style={styles.harvestSummaryLabel}>{language === 'ta' ? 'அறுவடை தேதி' : 'Harvest date'}</ThemedText>
                                        <ThemedText style={styles.harvestSummaryValue}>{viewHarvestDetail.harvest_date ? formatDate(viewHarvestDetail.harvest_date) : '-'}</ThemedText>
                                    </View>
                                    <View style={styles.harvestSummaryItem}>
                                        <ThemedText style={styles.harvestSummaryLabel}>{language === 'ta' ? 'தேங்காய் எண்ணிக்கை' : 'No of coconut'}</ThemedText>
                                        <ThemedText style={styles.harvestSummaryValue}>{viewHarvestDetail.no_of_coconut ?? viewHarvestDetail.green_coconut ?? '-'}</ThemedText>
                                    </View>
                                    <View style={styles.harvestSummaryItem}>
                                        <ThemedText style={styles.harvestSummaryLabel}>{language === 'ta' ? 'சராசரி எடை' : 'Average weight'}</ThemedText>
                                        <ThemedText style={styles.harvestSummaryValue}>{viewHarvestDetail.average_weight != null ? `${viewHarvestDetail.average_weight}g` : '-'}</ThemedText>
                                    </View>
                                    <View style={styles.harvestSummaryItem}>
                                        <ThemedText style={styles.harvestSummaryLabel}>{language === 'ta' ? 'விலை/தேங்காய்' : 'Price/coconut'}</ThemedText>
                                        <ThemedText style={styles.harvestSummaryValue}>{viewHarvestDetail.price_per_coconut != null && viewHarvestDetail.price_per_coconut !== '' ? `₹${viewHarvestDetail.price_per_coconut}` : '-'}</ThemedText>
                                    </View>
                                    <View style={[styles.harvestSummaryItem, { borderBottomWidth: 0 }]}>
                                        <ThemedText style={styles.harvestSummaryLabel}>{language === 'ta' ? 'அடுத்த அறுவடை' : 'Next harvest'}</ThemedText>
                                        <ThemedText style={styles.harvestSummaryValue}>{viewHarvestDetail.next_harvest ? formatDate(viewHarvestDetail.next_harvest) : '-'}</ThemedText>
                                    </View>
                                </View>
                                <TouchableOpacity style={[styles.nextBtn, { marginTop: 16, backgroundColor: '#64748b' }]} onPress={() => { setViewHarvestId(null); setViewHarvestDetail(null); setIsViewHarvestLoading(false); }}>
                                    <ThemedText style={[styles.nextBtnText, { color: '#fff' }]}>{language === 'ta' ? 'மூடு' : 'Close'}</ThemedText>
                                </TouchableOpacity>
                            </ScrollView>
                        ) : null}
                    </View>
                </View>
            </Modal>

            {/* Add Farm Modal (Popup matching attached UI) */}
            <Modal animationType="slide" transparent={true} visible={isAddFarmModalOpen} onRequestClose={() => { setIsAddFarmModalOpen(false); setAddFarmStep(1); }}>
                <SafeAreaView style={{ flex: 1 }} edges={[]}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.farmModalOverlay}>
                            <View style={styles.farmModalContent}>
                                <View style={styles.farmModalHeader}>
                                    <ThemedText style={styles.farmModalTitle}>{editingFarmId ? (language === 'ta' ? 'பண்ணை விவரங்களை திருத்த' : 'Edit Farm Details') : (language === 'ta' ? 'பண்ணை விவரங்கள் சேர்க்க' : 'Add Farm Details')}</ThemedText>
                                    <TouchableOpacity onPress={() => { setIsAddFarmModalOpen(false); setAddFarmStep(1); setNewFarmName(''); setSelectedState(''); setSelectedDistrict(''); setSelectedTaluk(''); setSelectedPanchayat(''); setSelectedVillage(''); setTreeCount(''); setCoconutType(''); setAvgTreeAge(''); setPlantingType(''); setExpectedYield(''); setStateSearch(''); setDistrictSearch(''); setTalukSearch(''); setPanchayatSearch(''); setVillageSearch(''); setLatitude(''); setLongitude(''); setLocationAddress(''); setEditingFarmId(null); }}>
                                        <Ionicons name="close" size={24} color="#fff" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.farmModalProgressRow}>
                                    <View style={styles.progressBar}>
                                        <View style={[styles.progressFill, { width: `${(addFarmStep / 5) * 100}%` }]} />
                                    </View>
                                    <ThemedText style={styles.progressText}>{addFarmStep}/5</ThemedText>
                                </View>

                               

                                {/* Step 1: Farm Name */}
                                {addFarmStep === 1 && (
                                    <View style={styles.farmModalBody}>
                                        <View style={styles.farmIconWrap}>
                                            <View style={styles.farmIconCircle}>
                                                <Ionicons name="home-outline" size={28} color="#10b981" />
                                            </View>
                                        </View>

                                        <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'பண்ணை பெயர் *' : 'Farm Name *'}</ThemedText>
                                        <TextInput style={styles.input} value={newFarmName} onChangeText={setNewFarmName} placeholder={language === 'ta' ? 'எ.கா: என் தோட்டம்' : 'Eg. My Farm'} />

                                        <View style={styles.infoNote}>
                                            <ThemedText style={{ color: '#0f172a' }}>
                                                {language === 'ta'
                                                    ? '💡 இந்த தகவல்கள் உங்களுக்கு சிறந்த விலை புரிதலிற்கு மற்றும் விவசாய ஆலோசனைகளை பெற உதவும்'
                                                    : '💡  These details help you get better price recommendations and farming advice'}
                                            </ThemedText>
                                        </View>

                                        <TouchableOpacity style={[styles.nextBtn, !isStep1Valid && styles.nextBtnDisabled]} disabled={!isStep1Valid} onPress={() => { if (isStep1Valid) setAddFarmStep(2); }}>
                                            <ThemedText style={styles.nextBtnText}>{language === 'ta' ? 'அடுத்தது' : 'Next'}</ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Step 2: Location fields */}
                                {addFarmStep === 2 && (
                                    <>
                                    <View>
                                    <View style={styles.modalContainer}>
                                    <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 16, flex: 1 }} >
                                        {locationMode === 'choice' ? (
                                            <View style={{ marginTop: 20 }}>
                                                <ThemedText style={[styles.inputLabel, { textAlign: 'center', marginBottom: 20 }]}>{language === 'ta' ? 'இருப்பிடம் தேர்ந்தெடுக்கவும்' : 'Select Location Method'}</ThemedText>

                                                <TouchableOpacity style={[styles.locationBtn, { marginBottom: 16, padding: 16, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center' }]} onPress={() => setLocationMode('pincode')}>
                                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                                        <Ionicons name="location" size={20} color="#16a34a" />
                                                    </View>
                                                    <ThemedText style={{ fontSize: 16, fontWeight: '500', color: '#334155' }}>{language === 'ta' ? 'பின் கோடு' : 'PIN Code'}</ThemedText>
                                                </TouchableOpacity>

                                                <TouchableOpacity style={[styles.locationBtn, { marginBottom: 16, padding: 16, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center' }]} disabled={isGettingLocation} onPress={async () => {
                                                    await getCurrentLocation();
                                                    // getCurrentLocation moves to step 3; no manual dropdowns
                                                }}>
                                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                                        {isGettingLocation ? <ActivityIndicator size="small" color="#16a34a" /> : <Ionicons name="navigate" size={20} color="#16a34a" />}
                                                    </View>
                                                    <ThemedText style={{ fontSize: 16, fontWeight: '500', color: '#334155' }}>{language === 'ta' ? 'எனது இருப்பிடம்' : 'Use My Location'}</ThemedText>
                                                </TouchableOpacity>

                                                <TouchableOpacity style={[styles.locationBtn, { marginBottom: 16, padding: 16, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center' }]} onPress={() => setLocationMode('manual')}>
                                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                                        <Ionicons name="list" size={20} color="#16a34a" />
                                                    </View>
                                                    <ThemedText style={{ fontSize: 16, fontWeight: '500', color: '#334155' }}>{language === 'ta' ? 'கைமுறை தேர்வு' : 'Manual Selection'}</ThemedText>
                                                </TouchableOpacity>
                                            </View>
                                        ) : locationMode === 'pincode' ? (
                                            <>
                                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }} onPress={() => setLocationMode('choice')}>
                                                    <Ionicons name="arrow-back" size={20} color="#64748b" />
                                                    <ThemedText style={{ color: '#64748b', marginLeft: 8 }}>{language === 'ta' ? 'மீண்டும் செல்க' : 'Back to selection'}</ThemedText>
                                                </TouchableOpacity>

                                                <View style={{ marginTop: 18, alignSelf: 'center', width: '100%', padding: 16, backgroundColor: '#fff', borderRadius: 12, elevation: 2 }}>
                                                    <ThemedText style={{ fontSize: 20, marginBottom: 12, color: '#0f172a', fontWeight: '700' }}>{language === 'ta' ? 'இருப்பிடம் தேர்ந்தெடுக்கவும்' : 'Choose location'}</ThemedText>

                                                    <View>
                                                        <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'பின் கோடு' : 'PIN Code'}</ThemedText>
                                                        <TextInput
                                                            placeholder={'642127'}
                                                            keyboardType="numeric"
                                                            style={styles.input}
                                                            value={pincode}
                                                            onChangeText={(v) => setPincode(v.replace(/[^0-9]/g, ''))}
                                                            maxLength={6}
                                                        />
                                                    </View>

                                                    <TouchableOpacity
                                                        style={[styles.nextBtn, { marginTop: 20 }]}
                                                        onPress={async () => {
                                                            if (!/^[0-9]{6}$/.test(pincode)) {
                                                                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'சரியான 6 இலக்க பின் கோடையை உள்ளிடவும்' : 'Please enter a valid 6-digit pin code');
                                                                return;
                                                            }

                                                            setIsGettingLocation(true);
                                                            try {
                                                                const geocoded = await Location.geocodeAsync(pincode + ', Tamil Nadu, India');
                                                                if (geocoded && geocoded.length > 0) {
                                                                    const { latitude, longitude } = geocoded[0];
                                                                    setLatitude(latitude.toString());
                                                                    setLongitude(longitude.toString());
                                                                    await processLocationFromCoords(latitude, longitude);
                                                                }
                                                                // Pincode is filled (valid 6 digits) — always move to step 3
                                                                setAddFarmStep(3);
                                                            } catch (err) {
                                                                console.log('Geocoding pincode failed', err);
                                                                setAddFarmStep(3);
                                                            }
                                                            setIsGettingLocation(false);
                                                        }}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                            {isGettingLocation ? <ActivityIndicator size="small" color="#fff" /> : null}
                                                            <ThemedText style={styles.nextBtnText}>{language === 'ta' ? 'தொடரவும்' : 'Continue'}</ThemedText>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            </>
                                        ) : (
                                            <>
                                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }} onPress={() => setLocationMode('choice')}>
                                                    <Ionicons name="arrow-back" size={20} color="#64748b" />
                                                    <ThemedText style={{ color: '#64748b', marginLeft: 8 }}>{language === 'ta' ? 'மீண்டும் செல்க' : 'Back to selection'}</ThemedText>
                                                </TouchableOpacity>

                                                {/* Location Icon Removed as per request */}

                                                <ThemedText style={{ marginTop: 8, fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 16 }}>
                                                    {language === 'ta' ? 'உங்கள் இருப்பிட விவரங்களை உள்ளிடவும்' : 'Enter your location details'}
                                                </ThemedText>

                                                {latitude && longitude && (
                                                    <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#ecfdf5', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#10b981' }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                                                            <Ionicons name="location" size={16} color="#059669" style={{ marginTop: 2 }} />
                                                            <View style={{ flex: 1 }}>
                                                                <ThemedText style={{ fontSize: 12, color: '#059669', fontWeight: '600', marginBottom: 4 }}>
                                                                    {language === 'ta' ? 'இருப்பிடம்' : 'Location'}
                                                                </ThemedText>
                                                                {locationAddress ? (
                                                                    <ThemedText style={{ fontSize: 13, color: '#047857', lineHeight: 18 }}>
                                                                        {locationAddress}
                                                                    </ThemedText>
                                                                ) : (
                                                                    <ThemedText style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                                                                        {language === 'ta' ? 'முகவரி பெறுகிறது...' : 'Fetching address...'}
                                                                    </ThemedText>
                                                                )}
                                                                <ThemedText style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                                                                    {latitude}, {longitude}
                                                                </ThemedText>
                                                            </View>
                                                        </View>
                                                    </View>
                                                )}

                                                {/* Pincode Input in Manual Mode */}
                                                <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'பின் கோடு' : 'PIN Code'}</ThemedText>
                                                <TextInput
                                                    placeholder={'642127'}
                                                    keyboardType="numeric"
                                                    style={[styles.input, { marginBottom: 16 }]}
                                                    value={pincode}
                                                    onChangeText={(v) => setPincode(v.replace(/[^0-9]/g, ''))}
                                                    maxLength={6}
                                                />

                                                <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'மாநிலம் *' : 'State *'}</ThemedText>
                                                <TouchableOpacity style={styles.dropdownBtn} onPress={() => { setIsStateDropdownOpen(true); setStateSearch(''); }}>
                                                    <ThemedText style={selectedState ? styles.inputText : styles.placeholderText}>{selectedState || (language === 'ta' ? 'தேர்ந்தெடுக்கவும்' : 'Select...')}</ThemedText>
                                                    <Ionicons name="chevron-down" size={20} color="#64748b" />
                                                </TouchableOpacity>

                                                {/* State Dropdown Modal */}
                                                <Modal visible={isStateDropdownOpen} transparent={true} animationType="fade" onRequestClose={() => { setIsStateDropdownOpen(false); setStateSearch(''); }}>
                                                    <TouchableWithoutFeedback onPress={() => { setIsStateDropdownOpen(false); setStateSearch(''); }}>
                                                        <View style={styles.dropdownModalOverlay}>
                                                            <TouchableWithoutFeedback>
                                                                <View style={styles.dropdownModalContent}>
                                                                    <View style={styles.dropdownModalHeader}>
                                                                        <ThemedText style={styles.dropdownModalTitle}>{language === 'ta' ? 'மாநிலம் தேர்ந்தெடுக்கவும்' : 'Select State'}</ThemedText>
                                                                        <TouchableOpacity onPress={() => { setIsStateDropdownOpen(false); setStateSearch(''); }}>
                                                                            <Ionicons name="close" size={24} color="#64748b" />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                    <TextInput
                                                                        style={styles.dropdownSearchInput}
                                                                        placeholder={language === 'ta' ? 'தேடவும்...' : 'Search...'}
                                                                        value={stateSearch}
                                                                        onChangeText={setStateSearch}
                                                                        autoFocus={true}
                                                                    />
                                                                    <ScrollView style={styles.dropdownModalScroll} showsVerticalScrollIndicator={true}>
                                                                        {isStateLoading && <View style={styles.dropdownItem}><ThemedText style={styles.placeholderText}>{language === 'ta' ? 'பொறுத்துக்கொண்டும்...' : 'Loading...'}</ThemedText></View>}
                                                                        {stateOptions
                                                                            .filter((s: any) => {
                                                                                const label = language === 'ta' ? (s.statet_name || s.state) : (s.state || s.statet_name);
                                                                                return !stateSearch || label.toLowerCase().includes(stateSearch.toLowerCase());
                                                                            })
                                                                            .map((s: any) => {
                                                                                const label = language === 'ta' ? (s.statet_name || s.state) : (s.state || s.statet_name);
                                                                                return (
                                                                                    <TouchableOpacity key={s.id} style={styles.dropdownItem} onPress={() => {
                                                                                        setSelectedState(label);
                                                                                        setSelectedStateId(s.id);
                                                                                        // clear dependent fields
                                                                                        setSelectedDistrict('');
                                                                                        setSelectedDistrictId(null);
                                                                                        setDistrictOptions([]);
                                                                                        // clear location coordinates when dropdown is selected
                                                                                        setLatitude('');
                                                                                        setLongitude('');
                                                                                        setIsStateDropdownOpen(false);
                                                                                        setStateSearch('');
                                                                                    }}>
                                                                                        <ThemedText style={styles.dropdownItemText}>{label}</ThemedText>
                                                                                    </TouchableOpacity>
                                                                                );
                                                                            })}
                                                                        {(!stateOptions || stateOptions.filter((s: any) => {
                                                                            const label = language === 'ta' ? (s.statet_name || s.state) : (s.state || s.statet_name);
                                                                            return !stateSearch || label.toLowerCase().includes(stateSearch.toLowerCase());
                                                                        }).length === 0) && !isStateLoading && <View style={styles.dropdownItem}><ThemedText style={styles.placeholderText}>{language === 'ta' ? 'இவற்றில் ஒன்றும் இல்லை' : 'No states found'}</ThemedText></View>}
                                                                    </ScrollView>
                                                                </View>
                                                            </TouchableWithoutFeedback>
                                                        </View>
                                                    </TouchableWithoutFeedback>
                                                </Modal>

                                                <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'மாவட்டம் *' : 'District *'}</ThemedText>
                                                <TouchableOpacity style={styles.dropdownBtn} onPress={() => { setIsDistrictDropdownOpen(true); setDistrictSearch(''); }}>
                                                    <ThemedText style={selectedDistrict ? styles.inputText : styles.placeholderText}>{selectedDistrict || (language === 'ta' ? 'தேர்ந்தெடுக்கவும்' : 'Select...')}</ThemedText>
                                                    <Ionicons name="chevron-down" size={20} color="#64748b" />
                                                </TouchableOpacity>

                                                {/* District Dropdown Modal */}
                                                <Modal visible={isDistrictDropdownOpen} transparent={true} animationType="fade" onRequestClose={() => { setIsDistrictDropdownOpen(false); setDistrictSearch(''); }}>
                                                    <TouchableWithoutFeedback onPress={() => { setIsDistrictDropdownOpen(false); setDistrictSearch(''); }}>
                                                        <View style={styles.dropdownModalOverlay}>
                                                            <TouchableWithoutFeedback>
                                                                <View style={styles.dropdownModalContent}>
                                                                    <View style={styles.dropdownModalHeader}>
                                                                        <ThemedText style={styles.dropdownModalTitle}>{language === 'ta' ? 'மாவட்டம் தேர்ந்தெடுக்கவும்' : 'Select District'}</ThemedText>
                                                                        <TouchableOpacity onPress={() => { setIsDistrictDropdownOpen(false); setDistrictSearch(''); }}>
                                                                            <Ionicons name="close" size={24} color="#64748b" />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                    <TextInput
                                                                        style={styles.dropdownSearchInput}
                                                                        placeholder={language === 'ta' ? 'தேடவும்...' : 'Search...'}
                                                                        value={districtSearch}
                                                                        onChangeText={setDistrictSearch}
                                                                        autoFocus={true}
                                                                    />
                                                                    <ScrollView style={styles.dropdownModalScroll} showsVerticalScrollIndicator={true}>
                                                                        {isDistrictLoading && <View style={styles.dropdownItem}><ThemedText style={styles.placeholderText}>{language === 'ta' ? 'பொறுத்துக்கொண்டும்...' : 'Loading...'}</ThemedText></View>}
                                                                        {districtOptions
                                                                            .filter((d: any) => {
                                                                                const label = language === 'ta' ? (d.district_tname || d.district_name) : (d.district_name || d.district_tname);
                                                                                return !districtSearch || label.toLowerCase().includes(districtSearch.toLowerCase());
                                                                            })
                                                                            .map((d: any) => {
                                                                                const label = language === 'ta' ? (d.district_tname || d.district_name) : (d.district_name || d.district_tname);
                                                                                return (
                                                                                    <TouchableOpacity key={d.id} style={styles.dropdownItem} onPress={() => {
                                                                                        setSelectedDistrict(label);
                                                                                        setSelectedDistrictId(d.id);
                                                                                        // clear dependent selections
                                                                                        setSelectedTaluk('');
                                                                                        setSelectedTalukId(null);
                                                                                        setSelectedPanchayat('');
                                                                                        setSelectedVillage('');
                                                                                        setSubdistrictOptions([]);
                                                                                        setIsDistrictDropdownOpen(false);
                                                                                        setDistrictSearch('');
                                                                                    }}>
                                                                                        <ThemedText style={styles.dropdownItemText}>{label}</ThemedText>
                                                                                    </TouchableOpacity>
                                                                                );
                                                                            })}
                                                                        {(!districtOptions || districtOptions.filter((d: any) => {
                                                                            const label = language === 'ta' ? (d.district_tname || d.district_name) : (d.district_name || d.district_tname);
                                                                            return !districtSearch || label.toLowerCase().includes(districtSearch.toLowerCase());
                                                                        }).length === 0) && !isDistrictLoading && <View style={styles.dropdownItem}><ThemedText style={styles.placeholderText}>{language === 'ta' ? 'இவற்றில் ஒன்றும் இல்லை' : 'No districts found'}</ThemedText></View>}
                                                                    </ScrollView>
                                                                </View>
                                                            </TouchableWithoutFeedback>
                                                        </View>
                                                    </TouchableWithoutFeedback>
                                                </Modal>

                                                <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'வட்டம்' : 'Taluk'}</ThemedText>
                                                <TouchableOpacity style={styles.dropdownBtn} onPress={() => { setIsTalukDropdownOpen(true); setTalukSearch(''); }}>
                                                    <ThemedText style={selectedTaluk ? styles.inputText : styles.placeholderText}>{selectedTaluk || (language === 'ta' ? 'தேர்ந்தெடுக்கவும்' : 'Select...')}</ThemedText>
                                                    <Ionicons name="chevron-down" size={20} color="#64748b" />
                                                </TouchableOpacity>

                                                {/* Taluk Dropdown Modal */}
                                                <Modal visible={isTalukDropdownOpen} transparent={true} animationType="fade" onRequestClose={() => { setIsTalukDropdownOpen(false); setTalukSearch(''); }}>
                                                    <TouchableWithoutFeedback onPress={() => { setIsTalukDropdownOpen(false); setTalukSearch(''); }}>
                                                        <View style={styles.dropdownModalOverlay}>
                                                            <TouchableWithoutFeedback>
                                                                <View style={styles.dropdownModalContent}>
                                                                    <View style={styles.dropdownModalHeader}>
                                                                        <ThemedText style={styles.dropdownModalTitle}>{language === 'ta' ? 'வட்டம் தேர்ந்தெடுக்கவும்' : 'Select Taluk'}</ThemedText>
                                                                        <TouchableOpacity onPress={() => { setIsTalukDropdownOpen(false); setTalukSearch(''); }}>
                                                                            <Ionicons name="close" size={24} color="#64748b" />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                    <TextInput
                                                                        style={styles.dropdownSearchInput}
                                                                        placeholder={language === 'ta' ? 'தேடவும்...' : 'Search...'}
                                                                        value={talukSearch}
                                                                        onChangeText={setTalukSearch}
                                                                        autoFocus={true}
                                                                    />
                                                                    <ScrollView style={styles.dropdownModalScroll} showsVerticalScrollIndicator={true}>
                                                                        {isSubdistrictLoading && <View style={styles.dropdownItem}><ThemedText style={styles.placeholderText}>{language === 'ta' ? 'பொறுத்துக்கொண்டும்...' : 'Loading...'}</ThemedText></View>}
                                                                        {subdistrictOptions
                                                                            .filter((sd: any) => {
                                                                                const label = language === 'ta' ? (sd.subdistrict_tname || sd.subdistrict_name) : (sd.subdistrict_name || sd.subdistrict_tname);
                                                                                return !talukSearch || label.toLowerCase().includes(talukSearch.toLowerCase());
                                                                            })
                                                                            .map((sd: any) => {
                                                                                const label = language === 'ta' ? (sd.subdistrict_tname || sd.subdistrict_name) : (sd.subdistrict_name || sd.subdistrict_tname);
                                                                                return (
                                                                                    <TouchableOpacity key={sd.id} style={styles.dropdownItem} onPress={() => {
                                                                                        setSelectedTaluk(label);
                                                                                        setSelectedTalukId(sd.id);
                                                                                        // clear downstream selections
                                                                                        setSelectedPanchayat('');
                                                                                        setSelectedPanchayatId(null);
                                                                                        setPanchayatOptions([]);
                                                                                        setSelectedVillage('');
                                                                                        setIsTalukDropdownOpen(false);
                                                                                        setTalukSearch('');
                                                                                    }}>
                                                                                        <ThemedText style={styles.dropdownItemText}>{label}</ThemedText>
                                                                                    </TouchableOpacity>
                                                                                );
                                                                            })}
                                                                        {(!subdistrictOptions || subdistrictOptions.filter((sd: any) => {
                                                                            const label = language === 'ta' ? (sd.subdistrict_tname || sd.subdistrict_name) : (sd.subdistrict_name || sd.subdistrict_tname);
                                                                            return !talukSearch || label.toLowerCase().includes(talukSearch.toLowerCase());
                                                                        }).length === 0) && !isSubdistrictLoading && <View style={styles.dropdownItem}><ThemedText style={styles.placeholderText}>{language === 'ta' ? 'இவற்றில் ஒன்றும் இல்லை' : 'No taluks found'}</ThemedText></View>}
                                                                    </ScrollView>
                                                                </View>
                                                            </TouchableWithoutFeedback>
                                                        </View>
                                                    </TouchableWithoutFeedback>
                                                </Modal>

                                                <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'பஞ்சாயத்து' : 'Panchayat'}</ThemedText>
                                                <TouchableOpacity style={styles.dropdownBtn} onPress={() => { setIsPanchayatDropdownOpen(true); setPanchayatSearch(''); }}>
                                                    <ThemedText style={selectedPanchayat ? styles.inputText : styles.placeholderText}>{selectedPanchayat || (language === 'ta' ? 'தேர்ந்தெடுக்கவும்' : 'Select...')}</ThemedText>
                                                    <Ionicons name="chevron-down" size={20} color="#64748b" />
                                                </TouchableOpacity>

                                                {/* Panchayat Dropdown Modal */}
                                                <Modal visible={isPanchayatDropdownOpen} transparent={true} animationType="fade" onRequestClose={() => { setIsPanchayatDropdownOpen(false); setPanchayatSearch(''); }}>
                                                    <TouchableWithoutFeedback onPress={() => { setIsPanchayatDropdownOpen(false); setPanchayatSearch(''); }}>
                                                        <View style={styles.dropdownModalOverlay}>
                                                            <TouchableWithoutFeedback>
                                                                <View style={styles.dropdownModalContent}>
                                                                    <View style={styles.dropdownModalHeader}>
                                                                        <ThemedText style={styles.dropdownModalTitle}>{language === 'ta' ? 'பஞ்சாயத்து தேர்ந்தெடுக்கவும்' : 'Select Panchayat'}</ThemedText>
                                                                        <TouchableOpacity onPress={() => { setIsPanchayatDropdownOpen(false); setPanchayatSearch(''); }}>
                                                                            <Ionicons name="close" size={24} color="#64748b" />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                    <TextInput
                                                                        style={styles.dropdownSearchInput}
                                                                        placeholder={language === 'ta' ? 'தேடவும்...' : 'Search...'}
                                                                        value={panchayatSearch}
                                                                        onChangeText={setPanchayatSearch}
                                                                        autoFocus={true}
                                                                    />
                                                                    <ScrollView style={styles.dropdownModalScroll} showsVerticalScrollIndicator={true}>
                                                                        {isPanchayatLoading && <View style={styles.dropdownItem}><ThemedText style={styles.placeholderText}>{language === 'ta' ? 'பொறுத்துக்கொண்டும்...' : 'Loading...'}</ThemedText></View>}
                                                                        {panchayatOptions
                                                                            .filter((p: any) => {
                                                                                const label = language === 'ta' ? (p.panchayat_tname || p.panchayat_name) : (p.panchayat_name || p.panchayat_tname);
                                                                                return !panchayatSearch || label.toLowerCase().includes(panchayatSearch.toLowerCase());
                                                                            })
                                                                            .map((p: any) => {
                                                                                const label = language === 'ta' ? (p.panchayat_tname || p.panchayat_name) : (p.panchayat_name || p.panchayat_tname);
                                                                                return (
                                                                                    <TouchableOpacity key={p.id} style={styles.dropdownItem} onPress={() => {
                                                                                        setSelectedPanchayat(label);
                                                                                        setSelectedPanchayatId(p.id);
                                                                                        setSelectedVillage('');
                                                                                        setSelectedVillageId(null);
                                                                                        setVillageOptions([]);
                                                                                        setIsPanchayatDropdownOpen(false);
                                                                                        setPanchayatSearch('');
                                                                                    }}>
                                                                                        <ThemedText style={styles.dropdownItemText}>{label}</ThemedText>
                                                                                    </TouchableOpacity>
                                                                                );
                                                                            })}
                                                                        {(!panchayatOptions || panchayatOptions.filter((p: any) => {
                                                                            const label = language === 'ta' ? (p.panchayat_tname || p.panchayat_name) : (p.panchayat_name || p.panchayat_tname);
                                                                            return !panchayatSearch || label.toLowerCase().includes(panchayatSearch.toLowerCase());
                                                                        }).length === 0) && !isPanchayatLoading && <View style={styles.dropdownItem}><ThemedText style={styles.placeholderText}>{language === 'ta' ? 'இவற்றில் ஒன்றும் இல்லை' : 'No panchayats found'}</ThemedText></View>}
                                                                    </ScrollView>
                                                                </View>
                                                            </TouchableWithoutFeedback>
                                                        </View>
                                                    </TouchableWithoutFeedback>
                                                </Modal>

                                                <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'கிராமம் *' : 'Village *'}</ThemedText>
                                                <TouchableOpacity style={styles.dropdownBtn} onPress={() => { setIsVillageDropdownOpen(true); setVillageSearch(''); }}>
                                                    <ThemedText style={selectedVillage ? styles.inputText : styles.placeholderText}>{selectedVillage || (language === 'ta' ? 'தேர்ந்தெடுக்கவும்' : 'Select...')}</ThemedText>
                                                    <Ionicons name="chevron-down" size={20} color="#64748b" />
                                                </TouchableOpacity>

                                                {/* Village Dropdown Modal */}
                                                <Modal visible={isVillageDropdownOpen} transparent={true} animationType="fade" onRequestClose={() => { setIsVillageDropdownOpen(false); setVillageSearch(''); }}>
                                                    <TouchableWithoutFeedback onPress={() => { setIsVillageDropdownOpen(false); setVillageSearch(''); }}>
                                                        <View style={styles.dropdownModalOverlay}>
                                                            <TouchableWithoutFeedback>
                                                                <View style={styles.dropdownModalContent}>
                                                                    <View style={styles.dropdownModalHeader}>
                                                                        <ThemedText style={styles.dropdownModalTitle}>{language === 'ta' ? 'கிராமம் தேர்ந்தெடுக்கவும்' : 'Select Village'}</ThemedText>
                                                                        <TouchableOpacity onPress={() => { setIsVillageDropdownOpen(false); setVillageSearch(''); }}>
                                                                            <Ionicons name="close" size={24} color="#64748b" />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                    <TextInput
                                                                        style={styles.dropdownSearchInput}
                                                                        placeholder={language === 'ta' ? 'தேடவும்...' : 'Search...'}
                                                                        value={villageSearch}
                                                                        onChangeText={setVillageSearch}
                                                                        autoFocus={true}
                                                                    />
                                                                    <ScrollView style={styles.dropdownModalScroll} showsVerticalScrollIndicator={true}>
                                                                        {isVillageLoading && <View style={styles.dropdownItem}><ThemedText style={styles.placeholderText}>{language === 'ta' ? 'பொறுத்துக்கொண்டும்...' : 'Loading...'}</ThemedText></View>}
                                                                        {villageOptions
                                                                            .filter((v: any) => {
                                                                                const label = language === 'ta' ? (v.village_tname || v.village_name) : (v.village_name || v.village_tname);
                                                                                return !villageSearch || label.toLowerCase().includes(villageSearch.toLowerCase());
                                                                            })
                                                                            .map((v: any) => {
                                                                                const label = language === 'ta' ? (v.village_tname || v.village_name) : (v.village_name || v.village_tname);
                                                                                return (
                                                                                    <TouchableOpacity key={v.id} style={styles.dropdownItem} onPress={() => {
                                                                                        setSelectedVillage(label);
                                                                                        setSelectedVillageId(v.id);
                                                                                        setIsVillageDropdownOpen(false);
                                                                                        setVillageSearch('');
                                                                                    }}>
                                                                                        <ThemedText style={styles.dropdownItemText}>{label}</ThemedText>
                                                                                    </TouchableOpacity>
                                                                                );
                                                                            })}
                                                                        {(!villageOptions || villageOptions.filter((v: any) => {
                                                                            const label = language === 'ta' ? (v.village_tname || v.village_name) : (v.village_name || v.village_tname);
                                                                            return !villageSearch || label.toLowerCase().includes(villageSearch.toLowerCase());
                                                                        }).length === 0) && !isVillageLoading && <View style={styles.dropdownItem}><ThemedText style={styles.placeholderText}>{language === 'ta' ? 'இவற்றில் ஒன்றும் இல்லை' : 'No villages found'}</ThemedText></View>}
                                                                    </ScrollView>
                                                                </View>
                                                            </TouchableWithoutFeedback>
                                                        </View>
                                                    </TouchableWithoutFeedback>
                                                </Modal>

                                                <View style={{ height: 8 }} />
                                            </>
                                        )}
                                    </ScrollView>
                                    {locationMode === 'manual' && (
                                        <View style={styles.footer}>
                                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                                                <TouchableOpacity style={styles.backBtn} onPress={() => setAddFarmStep(1)}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <Ionicons name="chevron-back" size={16} color="#0f172a" />
                                                        <ThemedText style={{ color: '#0f172a', fontWeight: '700' }}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
                                                    </View>
                                                </TouchableOpacity>

                                                <TouchableOpacity style={[styles.nextBtn, { flex: 1 }, !isStep2Valid && styles.nextBtnDisabled]} disabled={!isStep2Valid} onPress={() => { if (isStep2Valid) setAddFarmStep(3); }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                        <ThemedText style={styles.nextBtnText}>{language === 'ta' ? 'அடுத்தது' : 'Next'}</ThemedText>
                                                        <Ionicons name="chevron-forward" size={16} color="#064e3b" />
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                    </View>
                                    </View>
                                    </>
                                )}

                                {/* Step 3: Land details */}
                                {addFarmStep === 3 && (
                                    <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 16 }}>
                                        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
                                            <View style={styles.landIconCircle}>
                                                <Ionicons name="ribbon" size={28} color="#a78bfa" />
                                            </View>
                                        </View>

                                        <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'உரிமை வகை *' : 'Ownership Type *'}</ThemedText>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity
                                                style={[styles.ownershipCard, ownershipType === 'owned' && styles.ownershipCardSelected]}
                                                onPress={() => setOwnershipType('owned')}
                                            >
                                                <View style={{ alignItems: 'center' }}>
                                                    <Ionicons name="home" size={20} color={ownershipType === 'owned' ? '#064e3b' : '#64748b'} />
                                                    <ThemedText style={{ marginTop: 8 }}>{language === 'ta' ? 'சொந்தமான' : 'Owned'}</ThemedText>
                                                </View>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.ownershipCard, ownershipType === 'leased' && styles.ownershipCardSelected]}
                                                onPress={() => setOwnershipType('leased')}
                                            >
                                                <View style={{ alignItems: 'center' }}>
                                                    <Ionicons name="document-text" size={20} color={ownershipType === 'leased' ? '#064e3b' : '#64748b'} />
                                                    <ThemedText style={{ marginTop: 8 }}>{language === 'ta' ? 'குத்தகை' : 'Leased'}</ThemedText>
                                                </View>
                                            </TouchableOpacity>
                                        </View>

                                        <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'நில பரப்பு *' : 'Land Area *'}</ThemedText>
                                        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                            <TextInput style={[styles.input, { flex: 1 }]} keyboardType="numeric" placeholder={language === 'ta' ? 'பரப்பளவு' : 'Area'} value={landArea} onChangeText={setLandArea} />
                                            <TouchableOpacity style={[styles.dropdownBtn, { width: 120 }]} onPress={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}>
                                                <ThemedText style={landUnit ? styles.inputText : styles.placeholderText}>{landUnit ? getUnitLabel(landUnit) : (language === 'ta' ? 'ஹெக்டேர்' : 'Hectare')}</ThemedText>
                                                <Ionicons name="chevron-down" size={20} color="#64748b" />
                                            </TouchableOpacity>
                                        </View>
                                        {isUnitDropdownOpen && (
                                            <View style={styles.dropdownList}>
                                                {unitOptions.map((u) => (
                                                    <TouchableOpacity key={u} style={styles.dropdownItem} onPress={() => { setLandUnit(u); setIsUnitDropdownOpen(false); }}>
                                                        <ThemedText style={styles.dropdownItemText}>{getUnitLabel(u)}</ThemedText>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}

                                        <ThemedText style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{language === 'ta' ? 'ஏக்கர் 0.25 இன் மடங்குகளில் உள்ளிடவும் (எ.கா: 0.25, 0.5, 0.75, 1.0)' : 'Enter in multiples of 0.25 acres (e.g: 0.25, 0.5, 0.75, 1.0)'}</ThemedText>

                                        <View style={[styles.infoNote, { backgroundColor: '#ecfdf5', borderLeftColor: '#bbf7d0', marginTop: 12 }]}>
                                            <ThemedText style={{ color: '#064e3b' }}>{language === 'ta' ? '🌱 துல்லியமான நில பரப்பு தகவல் உங்கள் விளைச்சல் கணிப்புகளை மேம்படுத்துகிறது' : '🌱  Accurate land area information improves your yield predictions'}</ThemedText>
                                        </View>

                                        <View style={{ height: 12 }} />
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity style={styles.backBtn} onPress={() => setAddFarmStep(2)}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Ionicons name="chevron-back" size={16} color="#0f172a" />
                                                    <ThemedText style={{ color: '#0f172a', fontWeight: '700' }}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
                                                </View>
                                            </TouchableOpacity>

                                            <TouchableOpacity style={[styles.nextBtn, { flex: 1 }, !isStep3Valid && styles.nextBtnDisabled]} disabled={!isStep3Valid} onPress={() => { if (isStep3Valid) setAddFarmStep(4); }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                    <ThemedText style={styles.nextBtnText}>{language === 'ta' ? 'அடுத்தது' : 'Next'}</ThemedText>
                                                    <Ionicons name="chevron-forward" size={16} color="#064e3b" />
                                                </View>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={{ height: 12 }} />
                                    </ScrollView>
                                )}

                                {/* Step 4: Tree / Coconut details */}
                                {addFarmStep === 4 && (
                                    <>
                                    <View >
                                    <View style={styles.modalContainer}>
                                    <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 16 ,flex: 1}} >
                                        <ThemedText style={styles.stepSubtitle}>{language === 'ta' ? 'மர விவரங்கள்' : 'Tree Details'}</ThemedText>

                                        <View style={{ height: 8 }} />

                                        <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'தேங்காய் மரங்களின் எண்ணிக்கை *' : 'Number of Coconut Trees *'}</ThemedText>
                                        <TextInput style={styles.input} keyboardType="numeric" placeholder={language === 'ta' ? 'எ.கா: 50' : 'e.g: 50'} value={treeCount} onChangeText={setTreeCount} />

                                        <ThemedText style={[styles.inputLabel, { marginTop: 12 }]}>{language === 'ta' ? 'தேங்காய் வகை *' : 'Coconut Type *'}</ThemedText>
                                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                                            <TouchableOpacity style={[styles.ownershipCard, coconutType === 'country' && styles.ownershipCardSelected]} onPress={() => setCoconutType('country')}>
                                                <View style={{ alignItems: 'center' }}>
                                                    <View style={{ width: 34, height: 34, borderRadius: 18, backgroundColor: '#fde68a', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Ionicons name="ellipse" size={18} color="#b45309" />
                                                    </View>
                                                    <ThemedText style={{ marginTop: 8 }}>{language === 'ta' ? 'நாட்டு' : 'Country'}</ThemedText>
                                                </View>
                                            </TouchableOpacity>

                                            <TouchableOpacity style={[styles.ownershipCard, coconutType === 'hybrid' && styles.ownershipCardSelected]} onPress={() => setCoconutType('hybrid')}>
                                                <View style={{ alignItems: 'center' }}>
                                                    <View style={{ width: 34, height: 34, borderRadius: 18, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Ionicons name="leaf" size={18} color="#047857" />
                                                    </View>
                                                    <ThemedText style={{ marginTop: 8 }}>{language === 'ta' ? 'கலப்பின' : 'Hybrid'}</ThemedText>
                                                </View>
                                            </TouchableOpacity>

                                            <TouchableOpacity style={[styles.ownershipCard, coconutType === 'mixed' && styles.ownershipCardSelected]} onPress={() => setCoconutType('mixed')}>
                                                <View style={{ alignItems: 'center' }}>
                                                    <View style={{ width: 34, height: 34, borderRadius: 18, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Ionicons name="sparkles" size={18} color="#7c3aed" />
                                                    </View>
                                                    <ThemedText style={{ marginTop: 8 }}>{language === 'ta' ? 'கலப்பு' : 'Mixed'}</ThemedText>
                                                </View>
                                            </TouchableOpacity>
                                        </View>

                                        <ThemedText style={[styles.inputLabel, { marginTop: 12 }]}>{language === 'ta' ? 'மரங்களின் சராசரி வயது (ஆண்டுகள்)' : 'Average Age of Trees (years)'}</ThemedText>
                                        <TextInput style={styles.input} keyboardType="numeric" placeholder={language === 'ta' ? 'எ.கா: 10' : 'e.g: 10'} value={avgTreeAge} onChangeText={setAvgTreeAge} />

                                        <ThemedText style={[styles.inputLabel, { marginTop: 12 }]}>{language === 'ta' ? 'தேங்காய் வகை' : 'Coconut Variety'}</ThemedText>
                                        <TouchableOpacity style={styles.dropdownBtn} onPress={() => { setIsCoconutVarietyDropdownOpen(true); setCoconutVarietySearch(''); }}>
                                            <ThemedText style={plantingType ? styles.inputText : styles.placeholderText}>{plantingType || (language === 'ta' ? 'தேர்ந்தெடுக்கவும்' : 'Select...')}</ThemedText>
                                            <Ionicons name="chevron-down" size={20} color="#64748b" />
                                        </TouchableOpacity>

                                        {/* Coconut Variety Dropdown Modal */}
                                        <Modal visible={isCoconutVarietyDropdownOpen} transparent={true} animationType="fade" onRequestClose={() => { setIsCoconutVarietyDropdownOpen(false); setCoconutVarietySearch(''); }}>
                                            <TouchableWithoutFeedback onPress={() => { setIsCoconutVarietyDropdownOpen(false); setCoconutVarietySearch(''); }}>
                                                <View style={styles.dropdownModalOverlay}>
                                                    <TouchableWithoutFeedback>
                                                        <View style={styles.dropdownModalContent}>
                                                            <View style={styles.dropdownModalHeader}>
                                                                <ThemedText style={styles.dropdownModalTitle}>{language === 'ta' ? 'தேங்காய் வகை தேர்ந்தெடுக்கவும்' : 'Select Coconut Variety'}</ThemedText>
                                                                <TouchableOpacity onPress={() => { setIsCoconutVarietyDropdownOpen(false); setCoconutVarietySearch(''); }}>
                                                                    <Ionicons name="close" size={24} color="#64748b" />
                                                                </TouchableOpacity>
                                                            </View>
                                                            <TextInput
                                                                style={styles.dropdownSearchInput}
                                                                placeholder={language === 'ta' ? 'தேடவும்...' : 'Search...'}
                                                                value={coconutVarietySearch}
                                                                onChangeText={setCoconutVarietySearch}
                                                                autoFocus={true}
                                                            />
                                                            <ScrollView style={styles.dropdownModalScroll} showsVerticalScrollIndicator={true}>
                                                                {isCoconutVarietyLoading && <View style={styles.dropdownItem}><ThemedText style={styles.placeholderText}>{language === 'ta' ? 'பொறுத்துக்கொண்டும்...' : 'Loading...'}</ThemedText></View>}
                                                                {coconutVarietyOptions
                                                                    .filter((v: any) => {
                                                                        const label = v.variety;
                                                                        return !coconutVarietySearch || (label && label.toLowerCase().includes(coconutVarietySearch.toLowerCase()));
                                                                    })
                                                                    .map((v: any) => {
                                                                        const label = v.variety;
                                                                        return (
                                                                            <TouchableOpacity key={v.id} style={styles.dropdownItem} onPress={() => {
                                                                                setPlantingType(label);
                                                                                setIsCoconutVarietyDropdownOpen(false);
                                                                                setCoconutVarietySearch('');
                                                                            }}>
                                                                                <ThemedText style={styles.dropdownItemText}>{label}</ThemedText>
                                                                            </TouchableOpacity>
                                                                        );
                                                                    })}
                                                                {(!coconutVarietyOptions || coconutVarietyOptions.filter((v: any) => {
                                                                    const label = v.variety;
                                                                    return !coconutVarietySearch || (label && label.toLowerCase().includes(coconutVarietySearch.toLowerCase()));
                                                                }).length === 0) && !isCoconutVarietyLoading && <View style={styles.dropdownItem}><ThemedText style={styles.placeholderText}>{language === 'ta' ? 'இவற்றில் ஒன்றும் இல்லை' : 'No varieties found'}</ThemedText></View>}
                                                            </ScrollView>
                                                        </View>
                                                    </TouchableWithoutFeedback>
                                                </View>
                                            </TouchableWithoutFeedback>
                                        </Modal>

                                        <ThemedText style={[styles.inputLabel, { marginTop: 12 }]}>{language === 'ta' ? 'மரத்திற்கு எதிர்பார்க்கப்படும் வருடாந்திர விளைச்சல்' : 'Expected Annual Yield per Tree'} </ThemedText>
                                        <TextInput style={styles.input} keyboardType="numeric" placeholder={language === 'ta' ? 'எ.கா: 80' : 'e.g: 80'} value={expectedYield} onChangeText={(text) => setExpectedYield(text.replace(/[^0-9]/g, ''))} />

                                        <View style={[styles.infoNote, { backgroundColor: '#fff7ed', borderLeftColor: '#fde68a', marginTop: 12 }]}>
                                            <ThemedText style={{ color: '#92400e' }}>{language === 'ta' ? '🌴  இந்த தகவல்கள் உங்கள் விளைச்சல் கணிப்புகள் மற்றும் வருமான மதிப்பீடுகளுக்கு பயன்படுத்தப்படும்' : '🌴  This information will be used for yield predictions and income estimates'}</ThemedText>
                                        </View>

                                        <View style={{ height: 12 }} />
                                        

                                        <View style={{ height: 12 }} />
                                    </ScrollView>
                                    <View style={styles.footer}>                                  
<View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
<TouchableOpacity style={styles.backBtn} onPress={() => setAddFarmStep(3)}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="chevron-back" size={16} color="#0f172a" />
        <ThemedText style={{ color: '#0f172a', fontWeight: '700' }}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
    </View>
</TouchableOpacity>

<TouchableOpacity style={[styles.nextBtn, { flex: 1 }, !isStep4Valid && styles.nextBtnDisabled]} disabled={!isStep4Valid} onPress={() => { if (isStep4Valid) setAddFarmStep(5); }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <ThemedText style={styles.nextBtnText}>{language === 'ta' ? 'அடுத்தது' : 'Next'}</ThemedText>
        <Ionicons name="chevron-forward" size={16} color="#064e3b" />
    </View>
</TouchableOpacity>
</View>
</View>

                                    </View>
                                    </View>
                                    </>
                                    

                                )}

                                {/* Step 5: Summary / Review */}
                                {addFarmStep === 5 && (
                                    <>
                                    <View>
                                    <View style={styles.modalContainer}>
                                    <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 16 ,flex: 1}} >
                                        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
                                            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
                                                <Ionicons name="checkmark" size={36} color="#16a34a" />
                                            </View>
                                        </View>

                                        <View style={styles.summaryCard}>
                                            <ThemedText style={{ fontWeight: '700', marginBottom: 8 }}>{language === 'ta' ? 'உங்கள் பண்ணை விவரங்கள்' : 'Your Farm Details'}</ThemedText>

                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'பண்ணை பெயர்:' : 'Farm Name:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{newFarmName}</ThemedText>
                                            </View>

                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'உரிமை:' : 'Ownership:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{ownershipType === 'owned' ? (language === 'ta' ? 'சொந்தமான' : 'Owned') : ownershipType === 'leased' ? (language === 'ta' ? 'குத்தகை' : 'Leased') : ''}</ThemedText>
                                            </View>

                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'பரப்பு:' : 'Area:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{landArea} {getUnitLabel(landUnit)}</ThemedText>
                                            </View>

                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'மரங்கள்:' : 'Trees:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{treeCount}</ThemedText>
                                            </View>

                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'தேங்காய் வகை:' : 'Coconut Type:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{coconutType === 'country' ? (language === 'ta' ? 'நாட்டு' : 'Country') : coconutType === 'hybrid' ? (language === 'ta' ? 'கலப்பின' : 'Hybrid') : coconutType === 'mixed' ? (language === 'ta' ? 'கலப்பு' : 'Mixed') : ''}</ThemedText>
                                            </View>

                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'மர வயது:' : 'Tree Age:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{avgTreeAge ? `${avgTreeAge} ${language === 'ta' ? 'ஆண்டுகள்' : 'yrs'}` : ''}</ThemedText>
                                            </View>

                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'வகை:' : 'Variety:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{plantingType}</ThemedText>
                                            </View>

                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'எதிர்பார்க்கப்படும் விளைச்சல்/மரம்:' : 'Expected Yield/Tree:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{expectedYield}</ThemedText>
                                            </View>
                                        </View>

                                        <View style={{ height: 12 }} />

                                        <View style={styles.estimateCard}>
                                            <ThemedText style={{ color: '#0369a1', fontSize: 12 }}>{language === 'ta' ? 'வருடாந்திர விளைச்சல் மதிப்பீடு/வருடம்' : 'Annual Yield Estimate/Year'}</ThemedText>
                                            <ThemedText style={styles.estimateValue}>{(() => {
                                                const expectedYieldNum = parseInt(expectedYield) * parseInt(treeCount) || 0;
                                                const match = (expectedYieldNum.toString() || '').match(/(\d+[,\d]*)/);
                                                if (match) return parseInt(match[1].replace(/,/g, '')).toLocaleString();
                                                return language === 'ta' ? '0' : '0';
                                            })()} {language === 'ta' ? 'தேங்காய்கள்/வருடம்' : 'nuts/year'}</ThemedText>
                                            <ThemedText style={{ color: '#475569', fontSize: 12, marginTop: 6 }}>{language === 'ta' ? 'மொத்த எதிர்பார்க்கப்படும் வருடாந்திர உற்பத்தி' : 'Total estimated annual production'}</ThemedText>
                                        </View>

                                        <View style={{ height: 10 }} />

                                        <View style={[styles.infoNote, { backgroundColor: '#ecfeff', borderLeftColor: '#bfdbfe' }]}>
                                            <ThemedText style={{ color: '#0f172a', fontSize: 12 }}>{language === 'ta' ? 'உங்கள் பண்ணை சேர்க்கப்பட்ட பிறகு, நீங்கள் அறுவடைகளை பதிவு செய்யலாம் மற்றும் உங்கள் இருப்பிடத்திற்கான துல்லியமான விலைகளைப் பெறலாம்' : " After adding your farm, you can record harvests and get accurate prices for your location"}</ThemedText>
                                        </View>

                                        <View style={{ height: 12 }} />
                                        

                                        <View style={{ height: 12 }} />
                                    </ScrollView>
                                    <View style={styles.footer}>
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity style={styles.backBtn} onPress={() => setAddFarmStep(4)}>
                                                <ThemedText style={{ color: '#0f172a', fontWeight: '700' }}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
                                            </TouchableOpacity>

                                            <TouchableOpacity style={[styles.nextBtn, { flex: 1 }, isSavingFarm && styles.nextBtnDisabled]} disabled={isSavingFarm} onPress={handleSaveFarm}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                    {isSavingFarm ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark-circle" size={18} color="#fff" />}
                                                    <ThemedText style={styles.nextBtnText}>{isSavingFarm ? (language === 'ta' ? 'சேமிக்கிறது...' : 'Saving...') : (editingFarmId ? (language === 'ta' ? 'புதுப்பிக்க' : 'Update Farm') : (language === 'ta' ? 'பண்ணை சேர்க்க' : 'Add Farm'))}</ThemedText>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    </View>
                                    </View>
                                    </>
                                )}
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {/* Manage Harvest Schedule Modal */}
            <Modal animationType="slide" transparent={true} visible={isScheduleModalOpen} onRequestClose={() => setIsScheduleModalOpen(false)}>
                <SafeAreaView style={{ flex: 1 }} edges={[]}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.farmModalOverlay}>
                            <View style={[styles.farmModalContent, { maxHeight: '85%', overflow: 'visible' }]}>
                                <View style={styles.farmModalHeader}>
                                    <ThemedText style={styles.farmModalTitle}>{language === 'ta' ? 'அறுவடை அட்டவணை' : 'Harvest Schedule'}</ThemedText>

                                    <TouchableOpacity onPress={() => setIsScheduleModalOpen(false)}>
                                        <Ionicons name="close" size={24} color="#fff" />
                                    </TouchableOpacity>
                                </View>



                                {language === 'ta' && (
                                    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                                        <ThemedText style={styles.farmModalSubtitle}>உங்கள் வருடாந்திர அறுவடை அட்டவணையை திட்டமிடுங்கள்</ThemedText>
                                    </View>
                                )}

                                <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
                                    <View style={{ marginTop: 12 }}>
                                        <View style={styles.infoNote}>
                                            <ThemedText style={{ color: '#0f172a', fontSize: 12 }}>{language === 'ta' ? 'தேங்காய் அறுவடை பொதுவாக வருடத்திற்கு அதிகபட்சம் 8 முறை நடைபெறும். உச்ச உற்பத்தி காலங்களைக் குறிக்கவும்.' : 'Create or edit upcoming harvest months for this farm.'}</ThemedText>
                                        </View>

                                        <View style={{ height: 12 }} />

                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <ThemedText style={{ fontWeight: '700' }}>{language === 'ta' ? 'அறுவடை மாதங்கள்' : 'Harvest Months'}</ThemedText>
                                            <TouchableOpacity onPress={() => { if (scheduleEntries.length >= 8) { Alert.alert(language === 'ta' ? 'அட்டவணை எல்லை' : 'Limit reached', language === 'ta' ? 'அட்டவணைகளை 8 வரை மட்டுமே சேர்க்கலாம்' : 'You can only add up to 8 schedule entries'); } else { addScheduleEntry(); } }}><ThemedText style={styles.addLink}>+ {language === 'ta' ? 'சேர்' : 'Add'}</ThemedText></TouchableOpacity>
                                        </View>

                                        <View style={{ height: 12 }} />

                                        {scheduleEntries.map((entry, index) => (
                                            <View key={index} style={styles.scheduleEntry}>
                                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                                                    <View style={{ flex: 0.45 }}>
                                                        <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'மாதம்' : 'Month'}</ThemedText>
                                                        <TouchableOpacity ref={el => { scheduleButtonRefs.current[index] = el; }} style={[styles.dropdownBtn, { width: '100%' }]} onPress={() => toggleScheduleDropdown(index)}>
                                                            <ThemedText style={entry.month ? styles.inputText : styles.placeholderText}>{entry.month ? (language === 'ta' ? (scheduleMonths.find(m => m.key === entry.month)?.ta || entry.month) : entry.month) : (language === 'ta' ? 'மாதம் தேர்ந்தெடுக்கவும்' : 'Select month...')}</ThemedText>
                                                            <Ionicons name="chevron-down" size={20} color="#64748b" />
                                                        </TouchableOpacity>
                                                    </View>

                                                    <View style={{ flex: 1 }}>
                                                        <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'குறிப்பு' : 'Notes'}</ThemedText>
                                                        <TextInput style={[styles.input, { minHeight: 40 }]} placeholder={language === 'ta' ? 'குறிப்புகளை உள்ளிடவும்' : 'Optional notes'} value={entry.notes} onChangeText={(t) => updateScheduleEntry(index, { notes: t })} />
                                                    </View>

                                                    <TouchableOpacity style={{ marginLeft: 8, marginTop: 22 }} onPress={() => removeScheduleEntry(index)}>
                                                        <Ionicons name="trash" size={20} color="#ef4444" />
                                                    </TouchableOpacity>
                                                </View>

                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                                    <TouchableOpacity onPress={() => updateScheduleEntry(index, { peak: !entry.peak })} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#94a3b8', backgroundColor: entry.peak ? '#10b981' : '#fff' }} />
                                                        <ThemedText style={{ fontSize: 13 }}>{language === 'ta' ? 'உச்ச உற்பத்தி' : 'Peak month'}</ThemedText>
                                                    </TouchableOpacity>
                                                </View>

                                            </View>
                                        ))}

                                        <View style={{ height: 12 }} />

                                        <View style={[styles.infoNote, { backgroundColor: '#fff7ed', borderLeftColor: '#fde68a' }]}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <TouchableOpacity onPress={() => setScheduleUseNaam(!scheduleUseNaam)} style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#94a3b8', backgroundColor: scheduleUseNaam ? '#10b981' : '#fff' }} />
                                                <ThemedText style={{ color: '#92400e', flex: 1 }}>{language === 'ta' ? 'NAAM மூலம் எனது அறுவடையை விற்க விருப்பம்' : 'Allow NAAM to use this schedule'}</ThemedText>
                                            </View>

                                            {language === 'ta' && (
                                                <ThemedText style={{ color: '#92400e', marginTop: 6, fontSize: 13 }}>NAAM உங்களுக்கு சிறந்த விலையையும் சந்தை வாய்ப்புகளையும் வழங்கும்</ThemedText>
                                            )}
                                        </View>



                                        <View style={{ height: 16 }} />
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity style={styles.backBtn} onPress={() => setIsScheduleModalOpen(false)}>
                                                <ThemedText style={{ color: '#0f172a', fontWeight: '700' }}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.nextBtn, { flex: 1 }, isSavingSchedule && styles.nextBtnDisabled]} disabled={isSavingSchedule} onPress={handleSaveSchedule}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                    {isSavingSchedule ? <ActivityIndicator size="small" color="#fff" /> : null}
                                                    <ThemedText style={styles.nextBtnText}>{language === 'ta' ? 'சேமி' : 'Save'}</ThemedText>
                                                </View>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={{ height: 24 }} />
                                    </View>

                                </ScrollView>

                                {scheduleMonthDropdownOpenIndex !== null && scheduleDropdownLayout && (
                                    <TouchableWithoutFeedback onPress={closeScheduleDropdown}>
                                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
                                            {(() => {
                                                const win = Dimensions.get('window');
                                                const maxH = 180;
                                                const spaceBelow = win.height - (scheduleDropdownLayout.y + scheduleDropdownLayout.height);
                                                const placeBelow = spaceBelow >= 160;
                                                const dropdownHeight = placeBelow ? Math.min(maxH, Math.max(120, spaceBelow - 16)) : Math.min(maxH, Math.max(120, Math.floor(scheduleDropdownLayout.y - 16)));
                                                const top = placeBelow ? (scheduleDropdownLayout.y + scheduleDropdownLayout.height) : Math.max(12, scheduleDropdownLayout.y - dropdownHeight - 8);
                                                const left = Math.max(12, scheduleDropdownLayout.x);
                                                const width = Math.min(scheduleDropdownLayout.width, win.width - 24);
                                                return (
                                                    <View style={[styles.scheduleDropdownList, { position: 'absolute', left, top, width, maxHeight: dropdownHeight }]}>
                                                        <ScrollView style={{ maxHeight: dropdownHeight }} contentContainerStyle={{ paddingVertical: 8 }}>
                                                            {scheduleMonths.map((m) => (
                                                                <TouchableOpacity key={m.key} style={styles.dropdownItem} onPress={() => { updateScheduleEntry(scheduleMonthDropdownOpenIndex, { month: m.key }); closeScheduleDropdown(); }}>
                                                                    <ThemedText style={styles.dropdownItemText}>{language === 'ta' ? m.ta : m.key}</ThemedText>
                                                                </TouchableOpacity>
                                                            ))}
                                                        </ScrollView>
                                                    </View>
                                                );
                                            })()}
                                        </View>
                                    </TouchableWithoutFeedback>
                                )}

                            </View>
                            <View style={styles.farmModalContentFiller} />
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal >

            {/* Change Date Modal (styled to match attached screenshot) */}
            <Modal animationType="slide" transparent={true} visible={isChangeDateModalOpen} onRequestClose={() => closeChangeDateModal()}>
                <SafeAreaView style={{ flex: 1 }} edges={["top","bottom"]}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.farmModalOverlay}>
                            <View style={[styles.farmModalContent, { height: '80%' }]}>
                                <View style={styles.farmModalHeader}>
                                    <ThemedText style={styles.farmModalTitle}>{language === 'ta' ? 'அறுவடை அமைப்பு' : 'Harvest Setup'}</ThemedText>
                                    <TouchableOpacity onPress={() => closeChangeDateModal()}>
                                        <Ionicons name="close" size={24} color="#fff" />
                                    </TouchableOpacity>
                                </View>

                                {/* Subtitle + Progress */}
                                <View style={styles.farmModalProgressRow}>
                                    <View style={styles.progressBar}><View style={[styles.progressFill, { width: changeDateStep === 1 ? '50%' : '100%' }]} /></View>
                                    <ThemedText style={styles.progressText}>{changeDateFarm ? (language === 'ta' ? (changeDateFarm.land_tname || changeDateFarm.land_name || changeDateFarm.land_id) : (changeDateFarm.land_name || changeDateFarm.land_id)) : (language === 'ta' ? 'முதன்மை பண்ணை' : 'Primary Farm')}</ThemedText>
                                </View>

                                <View style={{ height: '80%', flexDirection: 'column', overflow: 'hidden' }}>
                                    <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 16, flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
                                        <View style={{ marginTop: 8 }}>
                                            {changeDateStep === 1 && (
                                                <View style={styles.infoNote}>
                                                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                                                        <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
                                                        <ThemedText style={styles.infoText}>{language === 'ta' ? 'உங்கள் கடைசி அறுவடை பற்றிய தகவல்களை எங்களுக்கு சொல்லுங்கள். இது அடுத்த அறுவடை கணக்கிட உதவும்.' : 'Tell us about your last harvest. This will help us predict your next harvest.'}</ThemedText>
                                                    </View>
                                                </View>
                                            )}

                                            <View style={{ height: 12 }} />

                                            {changeDateStep === 1 ? (
                                                <>
                                                    <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'முன்பு அறுவடை செய்துள்ளீர்களா?' : 'Have you harvested before?'}</ThemedText>

                                                    <TouchableOpacity style={[styles.radioCard, changeDateSelection === 'yes' && styles.radioCardSelected]} onPress={() => setChangeDateSelection('yes')}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                            <View style={{ width: 20, height: 20, borderRadius: 12, borderWidth: 2, borderColor: changeDateSelection === 'yes' ? '#10b981' : '#94a3b8', backgroundColor: changeDateSelection === 'yes' ? '#10b981' : '#fff' }} />
                                                            <ThemedText style={{ fontSize: 15 }}>{language === 'ta' ? 'ஆம், அறுவடை செய்துள்ளேன்' : 'Yes, I have harvested before'}</ThemedText>
                                                        </View>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity style={[styles.radioCard, changeDateSelection === 'no' && styles.radioCardSelected]} onPress={() => { setChangeDateSelection('no'); setChangeDateValue(null); }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                            <View style={{ width: 20, height: 20, borderRadius: 12, borderWidth: 2, borderColor: changeDateSelection === 'no' ? '#10b981' : '#94a3b8', backgroundColor: changeDateSelection === 'no' ? '#10b981' : '#fff' }} />
                                                            <ThemedText style={{ fontSize: 15 }}>{language === 'ta' ? 'இல்லை, இது எனது முதல் அறுவடை' : 'No, this will be my first harvest'}</ThemedText>
                                                        </View>
                                                    </TouchableOpacity>

                                                    <View style={{ height: 12 }} />

                                                    {changeDateSelection !== 'no' && (
                                                        <>
                                                            <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'கடைசியாக எப்போது அறுவடை செய்தீர்கள்?' : 'When did you last harvest?'}</ThemedText>
                                                            <TouchableOpacity style={styles.dateInput} onPress={() => setShowChangeDatePicker(true)}>
                                                                <ThemedText style={styles.inputText}>{changeDateValue ? formatDate(changeDateValue) : (language === 'ta' ? 'dd-mm-yyyy' : 'dd-mm-yyyy')}</ThemedText>
                                                                <Ionicons name="calendar-outline" size={20} color="#64748b" />
                                                            </TouchableOpacity>

                                                            {showChangeDatePicker && (
                                                                <DateTimePicker
                                                                    value={changeDateValue || new Date()}
                                                                    mode="date"
                                                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                                    onChange={(e, d) => { setShowChangeDatePicker(Platform.OS === 'ios'); if (d) setChangeDateValue(d); }}
                                                                />
                                                            )}
                                                        </>
                                                    )}

                                                    <View style={{ height: 12 }} />
                                                </>
                                            ) : (
                                                <>
                                                    {changeDateSelection === 'yes' ? (
                                                        <>
                                                            <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'நீங்கள் அறுவடை எவ்வாறு விற்றீர்கள்?' : 'How did you sell the harvest?'}</ThemedText>

                                                            <TouchableOpacity style={[styles.radioCard, changeDateSaleMethod === 'count' && styles.radioCardSelected, { marginTop: 8 }]} onPress={() => setChangeDateSaleMethod('count')}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                                    <Ionicons name="cube-outline" size={22} color={changeDateSaleMethod === 'count' ? '#0f172a' : '#475569'} />
                                                                    <ThemedText style={{ fontSize: 15 }}>{language === 'ta' ? 'எண்ணிக்கையில்' : 'By count'}</ThemedText>
                                                                </View>
                                                            </TouchableOpacity>

                                                            <TouchableOpacity style={[styles.radioCard, changeDateSaleMethod === 'weight' && styles.radioCardSelected, { marginTop: 8 }]} onPress={() => setChangeDateSaleMethod('weight')}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                                    <Ionicons name="trending-up-outline" size={22} color={changeDateSaleMethod === 'weight' ? '#0f172a' : '#475569'} />
                                                                    <ThemedText style={{ fontSize: 15 }}>{language === 'ta' ? 'எடையில்' : 'By weight'}</ThemedText>
                                                                </View>
                                                            </TouchableOpacity>

                                                            {/* Inputs depending on sale method */}
                                                            {changeDateSaleMethod === 'count' && (
                                                                <>
                                                                    <View style={{ height: 12 }} />
                                                                    <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'எத்தனை தேங்காய்கள்?' : 'How many coconuts?'}</ThemedText>
                                                                    <TextInput style={styles.input} keyboardType="numeric" placeholder={language === 'ta' ? 'உதா: 500' : 'Eg: 500'} value={changeDateCount} onChangeText={setChangeDateCount} />

                                                                    <ThemedText style={[styles.inputLabel, { marginTop: 12 }]}>{language === 'ta' ? 'தோராய எடை (கிராம்)' : 'Approx. Weight/piece (grams)'}</ThemedText>
                                                                    <TextInput style={styles.input} keyboardType="numeric" placeholder={language === 'ta' ? 'உதா: 250' : 'Eg: 250'} value={changeDateWeight} onChangeText={setChangeDateWeight} />

                                                                    <ThemedText style={[styles.inputLabel, { marginTop: 12 }]}>{language === 'ta' ? 'சராசரி விலை (₹/தேங்காய்)' : 'Average price (₹/count)'}</ThemedText>
                                                                    <TextInput style={styles.input} keyboardType="numeric" placeholder={language === 'ta' ? 'உதா: 15.50' : 'Eg: 15.50'} value={changeDateAvgPrice} onChangeText={setChangeDateAvgPrice} />
                                                                </>
                                                            )}

                                                            {changeDateSaleMethod === 'weight' && (
                                                                <>
                                                                    <View style={{ height: 12 }} />
                                                                    <ThemedText style={styles.inputLabel}>{language === 'ta' ? 'தோராய எடை (கிலோ)' : 'Approx. Weight/piece (grams)'}</ThemedText>
                                                                    <TextInput style={styles.input} keyboardType="numeric" placeholder={language === 'ta' ? 'உதா: 250' : 'Eg: 250'} value={changeDateWeight} onChangeText={setChangeDateWeight} />

                                                                    <ThemedText style={[styles.inputLabel, { marginTop: 12 }]}>{language === 'ta' ? 'தோராய எண்ணிக்கை' : 'Approx count(Total)'}</ThemedText>
                                                                    <TextInput style={styles.input} keyboardType="numeric" placeholder={language === 'ta' ? 'உதா: 500' : 'Eg: 500'} value={changeDateApproxCount} onChangeText={setChangeDateApproxCount} />

                                                                    <ThemedText style={[styles.inputLabel, { marginTop: 12 }]}>{language === 'ta' ? 'சராசரி விலை (₹/கிலோ)' : 'Average price (₹/kg)'}</ThemedText>
                                                                    <TextInput style={styles.input} keyboardType="numeric" placeholder={language === 'ta' ? 'உதா: 15.50' : 'Eg: 15.50'} value={changeDateAvgPrice} onChangeText={setChangeDateAvgPrice} />
                                                                </>
                                                            )}

                                                            <View style={{ height: 12 }} />
                                                        </>
                                                    ) : (
                                                        // First-harvest flow options (matching attached UI)
                                                        <>
                                                            <View style={[styles.infoNote, { backgroundColor: '#eef6ff', borderLeftColor: '#c7defd' }]}>
                                                                <ThemedText style={{ color: '#0f172a', fontSize: 13 }}>{language === 'ta' ? 'நீங்கள் எந்த வகையில் விற்பனை செய்யப் போகிறீர்கள்? இங்கு உள்ளவைகளைத் தேர்ந்தெடுக்கவும்.' : 'Choose how you plan to sell your first harvest.'}</ThemedText>
                                                            </View>

                                                            <View style={{ height: 12 }} />

                                                            <ThemedText style={[styles.inputLabel, { marginBottom: 8 }]}>{language === 'ta' ? 'விற்பனை வகை' : 'Sale type'}</ThemedText>

                                                            <TouchableOpacity style={[styles.radioCard, changeDateFirstHarvestOption === 'green' && styles.radioCardSelected]} onPress={() => setChangeDateFirstHarvestOption('green')}>
                                                                <View>
                                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                                        <Ionicons name="ellipse-outline" size={18} color={changeDateFirstHarvestOption === 'green' ? '#0f172a' : '#475569'} />
                                                                        <View style={{ flex: 1 }}>
                                                                            <ThemedText style={{ fontSize: 15 }}>{language === 'ta' ? 'பச்சை தேங்காய்' : 'Green coconut'}</ThemedText>
                                                                            <ThemedText style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>{language === 'ta' ? 'அறுவடை: 35-40 நாட்களுக்கு ஒரு முறை' : 'Harvest: 35-40 days per cycle'}</ThemedText>
                                                                        </View>
                                                                    </View>
                                                                </View>
                                                            </TouchableOpacity>

                                                            <TouchableOpacity style={[styles.radioCard, changeDateFirstHarvestOption === 'black' && styles.radioCardSelected, { marginTop: 8 }]} onPress={() => setChangeDateFirstHarvestOption('black')}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                                    <Ionicons name="egg-outline" size={18} color={changeDateFirstHarvestOption === 'black' ? '#0f172a' : '#475569'} />
                                                                    <View style={{ flex: 1 }}>
                                                                        <ThemedText style={{ fontSize: 15 }}>{language === 'ta' ? 'கருப்பு தேங்காய்' : 'Black/dry coconut'}</ThemedText>
                                                                        <ThemedText style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>{language === 'ta' ? 'அறுவடை: 50-60 நாட்களுக்கு ஒரு முறை' : 'Harvest: 50-60 days per cycle'}</ThemedText>
                                                                    </View>
                                                                </View>
                                                            </TouchableOpacity>

                                                            <TouchableOpacity style={[styles.radioCard, changeDateFirstHarvestOption === 'copra' && styles.radioCardSelected, { marginTop: 8 }]} onPress={() => setChangeDateFirstHarvestOption('copra')}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                                    <Ionicons name="nutrition-outline" size={18} color={changeDateFirstHarvestOption === 'copra' ? '#0f172a' : '#475569'} />
                                                                    <View style={{ flex: 1 }}>
                                                                        <ThemedText style={{ fontSize: 15 }}>{language === 'ta' ? 'கொப்பரா' : 'Copra'}</ThemedText>
                                                                        <ThemedText style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>{language === 'ta' ? 'அறுவடை: 90+ நாட்களுக்கு ஒரு முறை' : 'Harvest: 90+ days per cycle'}</ThemedText>
                                                                    </View>
                                                                </View>
                                                            </TouchableOpacity>

                                                            {changeDateFirstHarvestOption ? (
                                                                <View style={{ borderRadius: 8, padding: 12, backgroundColor: '#ecfdf5', borderLeftWidth: 1, borderLeftColor: '#bbf7d0', marginTop: 12 }}>
                                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                                        <Ionicons name="calendar-outline" size={18} color="#065f46" />
                                                                        <View style={{ flex: 1 }}>
                                                                            <ThemedText style={{ color: '#065f46', fontSize: 13, fontWeight: '600' }}>{language === 'ta' ? 'அடுத்த அறுவடை (தோராயம்)' : 'Next harvest (approx)'}</ThemedText>
                                                                            <ThemedText style={{ color: '#065f46', marginTop: 6 }}>{formatDate(new Date(Date.now() + (changeDateFirstHarvestOption === 'green' ? 40 : (changeDateFirstHarvestOption === 'black' ? 55 : 90)) * 24 * 60 * 60 * 1000))}</ThemedText>
                                                                        </View>
                                                                    </View>
                                                                </View>
                                                            ) : null}

                                                            <View style={{ height: 12 }} />
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </View>
                                    </ScrollView>
                                    <View style={styles.footer}>
                                        {changeDateStep === 1 ? (
                                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                                <TouchableOpacity style={styles.backBtn} onPress={() => closeChangeDateModal()}>
                                                    <ThemedText style={{ color: '#0f172a', fontWeight: '700' }}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
                                                </TouchableOpacity>

                                                <TouchableOpacity style={[styles.nextBtn, { flex: 1 }, (changeDateSelection === '' || (changeDateSelection === 'yes' && !changeDateValue)) && styles.nextBtnDisabled]} disabled={changeDateSelection === '' || (changeDateSelection === 'yes' && !changeDateValue)} onPress={handleSaveChangeDate}>
                                                    <ThemedText style={styles.nextBtnText}>{language === 'ta' ? 'அடுத்தது' : 'Next'}</ThemedText>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <>
                                                {changeDateSelection === 'yes' ? (
                                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                                        <TouchableOpacity style={styles.backBtn} onPress={() => setChangeDateStep(1)}>
                                                            <ThemedText style={{ color: '#0f172a', fontWeight: '700' }}>{language === 'ta' ? 'பின்செல்' : 'Back'}</ThemedText>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity style={[styles.nextBtn, { flex: 1 }, (!changeDateSaleMethod || (changeDateSaleMethod === 'count' && (!changeDateCount || !changeDateWeight || !changeDateAvgPrice)) || (changeDateSaleMethod === 'weight' && (!changeDateWeight || !changeDateApproxCount || !changeDateAvgPrice))) && styles.nextBtnDisabled]} disabled={!changeDateSaleMethod || (changeDateSaleMethod === 'count' && (!changeDateCount || !changeDateWeight || !changeDateAvgPrice)) || (changeDateSaleMethod === 'weight' && (!changeDateWeight || !changeDateApproxCount || !changeDateAvgPrice))} onPress={handleSaveChangeDate}>
                                                            <ThemedText style={styles.nextBtnText}>{language === 'ta' ? 'அடுத்தது' : 'Next'}</ThemedText>
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : (
                                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                                        <TouchableOpacity style={styles.backBtn} onPress={() => setChangeDateStep(1)}>
                                                            <ThemedText style={{ color: '#0f172a', fontWeight: '700' }}>{language === 'ta' ? 'முந்தைய' : 'Back'}</ThemedText>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity style={[styles.nextBtn, { flex: 1 }, !changeDateFirstHarvestOption && styles.nextBtnDisabled]} disabled={!changeDateFirstHarvestOption} onPress={handleSaveChangeDate}>
                                                            <ThemedText style={styles.nextBtnText}>{language === 'ta' ? 'முடி' : 'Finish'}</ThemedText>
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {/* View Farm Modal */}
            <Modal animationType="slide" transparent={true} visible={isViewFarmModalOpen} onRequestClose={() => setIsViewFarmModalOpen(false)}>
                <SafeAreaView style={{ flex: 1 }} edges={[]}>
                    <View style={styles.modalOverlay}>
                        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '100%',paddingBottom:80 }} >
                            <View style={styles.modalHeader}>
                                <ThemedText style={styles.modalTitle}>{language === 'ta' ? 'உங்கள் பண்ணை விவரங்கள்' : 'Your Farm Details'}</ThemedText>
                                <TouchableOpacity onPress={() => setIsViewFarmModalOpen(false)}>
                                    <Ionicons name="close" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {viewFarmData && (
                                    <>
                                        <View style={[styles.summaryCard, { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' }]}>
                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'பண்ணை பெயர்:' : 'Farm Name:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{viewFarmData.land_name || '-'}</ThemedText>
                                            </View>
                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'உரிமை:' : 'Ownership:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{viewFarmData.ownership_type === 'owned' ? (language === 'ta' ? 'சொந்தமான' : 'Owned') : viewFarmData.ownership_type === 'leased' ? (language === 'ta' ? 'குத்தகை' : 'Leased') : '-'}</ThemedText>
                                            </View>
                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'பரப்பு:' : 'Area:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{viewFarmData.land_area} {getUnitLabel(viewFarmData.land_areaunit)}</ThemedText>
                                            </View>
                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'மரங்கள்:' : 'Trees:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{viewFarmData.no_of_coconut || '-'}</ThemedText>
                                            </View>
                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'தேங்காய் வகை:' : 'Coconut Type:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{viewFarmData.coconut_type === 'country' ? (language === 'ta' ? 'நாட்டு' : 'Country') : viewFarmData.coconut_type === 'hybrid' ? (language === 'ta' ? 'கலப்பின' : 'Hybrid') : viewFarmData.coconut_type === 'mixed' ? (language === 'ta' ? 'கலப்பு' : 'Mixed') : '-'}</ThemedText>
                                            </View>
                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'மர வயது:' : 'Tree Age:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{viewFarmData.average_of_tree ? `${viewFarmData.average_of_tree} ${language === 'ta' ? 'ஆண்டுகள்' : 'Years'}` : '-'}</ThemedText>
                                            </View>
                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'வகை:' : 'Variety:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{viewFarmData.coconut_variety || '-'}</ThemedText>
                                            </View>
                                            <View style={styles.summaryRow}>
                                                <ThemedText style={styles.summaryLabel}>{language === 'ta' ? 'எதிர்பார்க்கப்படும் விளைச்சல்/மரம்:' : 'Expected Yield/Tree:'}</ThemedText>
                                                <ThemedText style={styles.summaryValue}>{viewFarmData.expected_yield || '-'}</ThemedText>
                                            </View>
                                        </View>

                                        <View style={{ height: 16 }} />

                                        <View style={[styles.estimateCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                                            <ThemedText style={{ color: '#0369a1', fontSize: 13, fontWeight: '500' }}>{language === 'ta' ? 'வருடாந்திர விளைச்சல் மதிப்பீடு/வருடம்' : 'Annual Yield Estimate/Year'}</ThemedText>
                                            <ThemedText style={{ color: '#0369a1', fontSize: 22, fontWeight: '800', marginTop: 8 }}>
                                                {(() => {
                                                    const treeCount = parseInt(viewFarmData.no_of_coconut) || 0;
                                                    const yieldPerTree = parseInt(viewFarmData.expected_yield) || 0;
                                                    const total = treeCount * yieldPerTree;
                                                    return total ? total.toLocaleString() : '0';
                                                })()} {language === 'ta' ? 'தேங்காய்கள்/வருடம்' : 'Coconuts/year'}
                                            </ThemedText>
                                            <ThemedText style={{ color: '#475569', fontSize: 13, marginTop: 6 }}>{language === 'ta' ? 'மொத்த எதிர்பார்க்கப்படும் வருடாந்திர உற்பத்தி' : 'Total estimated annual production'}</ThemedText>
                                        </View>
                                    </>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </SafeAreaView>
            </Modal >
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8fafc' },
    topAppBar: {
        height: 56, backgroundColor: '#0f6b36', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12
    },
    hamburger: { width: 36, alignItems: 'center', justifyContent: 'center' },
    topAppBarLogo: { height: 40, width: 120, maxWidth: 200 },

    banner: { backgroundColor: '#10b981', paddingVertical: 24, paddingHorizontal: 20 },
    bannerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
    bannerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },

    statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: -20 },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16,
        shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 3
    },
    statHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    statLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
    statValue: { fontSize: 20, fontWeight: '700', color: '#1e293b' },

    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
    sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, flexShrink: 1, minWidth: 0 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginLeft: 8, flexShrink: 1 },
    addLink: { fontSize: 13, color: '#10b981', fontWeight: '600' },
    addFarmButton: { backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, flexShrink: 0, alignSelf: 'center' },
    addFarmButtonText: { fontSize: 14, color: '#ffffff', fontWeight: '700' },
    farmCardEmpty: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', minHeight: 160 },

    farmCard: {
        marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f1f5f9'
    },
    nextBtnDisabled: { backgroundColor: '#94a3b8', opacity: 0.7 },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
      },
    modalContainer: {
        height: '92%',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 16,
        overflow: 'hidden', // 🔥 IMPORTANT
      },
    summaryCard: { backgroundColor: '#ecfdf5', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#bbf7d0' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0, borderBottomColor: 'rgba(0,0,0,0.04)' },
    summaryLabel: { color: '#475569', fontSize: 13 },
    summaryValue: { color: '#0f172a', fontWeight: '700', fontSize: 13 },

    estimateCard: { backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', alignItems: 'flex-start' },
    estimateValue: { color: '#0369a1', fontSize: 20, fontWeight: '800', marginTop: 8 },

    smallStatsRow: { flexDirection: 'row', gap: 12 },
    smallStatBox: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 8, alignItems: 'flex-start', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
    smallStatLabel: { color: '#475569', fontSize: 12 },
    smallStatValue: { color: '#0f172a', fontWeight: '700', marginTop: 6 },
    statSubValue: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '500' },

    /* Schedule modal */
    scheduleEntry: { position: 'relative', backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', marginBottom: 12 },
    scheduleDropdownList: { position: 'absolute', zIndex: 9999, elevation: 10, borderWidth: 1, borderColor: '#e6eef7', backgroundColor: '#fff', borderRadius: 8, maxHeight: 180, marginTop: 8 },
    scheduleDropdownOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 },
    farmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    farmName: { fontSize: 16, fontWeight: '600', color: '#334155' },
    tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, gap: 4 },
    tagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
    tagText: { fontSize: 11, fontWeight: '700', color: '#166534' },
    farmLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
    farmLoc: { fontSize: 13, color: '#64748b' },
    farmAlertRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
    farmAlert: { fontSize: 12, color: '#dc2626', fontWeight: '500' },
    farmMenuDropdown: { position: 'absolute', right: 0, top: 28, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 4, minWidth: 140, elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, zIndex: 100 },
    farmMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14 },
    outlineBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10,
        borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 8, backgroundColor: '#eff6ff', gap: 8
    },
    outlineBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },

    pageOutlineBtn: { backgroundColor: '#eff6ff', borderRadius: 8, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: '#bfdbfe' },
    pageOutlineBtnText: { color: '#0369a1', fontWeight: '700', marginLeft: 8 },

    addHarvestBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981',
        marginHorizontal: 16, marginTop: 16, paddingVertical: 14, borderRadius: 8, gap: 8,
        shadowColor: '#10b981', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4
    },
    addHarvestBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    historyTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
    harvestSummaryCard: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
    harvestSummaryFarmName: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
    harvestSummaryGrid: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 12 },
    harvestSummaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    harvestSummaryLabel: { fontSize: 13, color: '#64748b', flex: 1 },
    harvestSummaryValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    historyCard: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' },
    historyItemName: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
    historyDate: { fontSize: 12, color: '#94a3b8' },
    statusBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
    statusText: { fontSize: 10, color: '#2563eb', fontWeight: '700' },
    gridRow: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16 },
    gridItem: { flex: 1 },
    gridLabel: { fontSize: 11, color: '#64748b', marginBottom: 2 },
    gridValue: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    infoBox: { backgroundColor: '#eff6ff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe' },
    infoText: { fontSize: 12, color: '#2563eb', lineHeight: 18, marginBottom: 4 },
    linkText: { fontSize: 12, color: '#2563eb', fontWeight: '700', textDecorationLine: 'underline' },

    /* Modal Styles */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 12 },
    input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: '#1e293b' },
    dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' },
    inputText: { fontSize: 16, color: '#1e293b' },
    placeholderText: { fontSize: 16, color: '#94a3b8' },
    dropdownList: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, marginTop: 4, maxHeight: 180, backgroundColor: '#fff' },
    dropdownItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    dropdownItemText: { fontSize: 14, color: '#334155' },

    /* Dropdown Modal Styles */
    dropdownModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    dropdownModalContent: { backgroundColor: '#fff', borderRadius: 12, width: '90%', maxWidth: 400, maxHeight: '80%', overflow: 'hidden' },
    dropdownModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    dropdownModalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    dropdownSearchInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: '#1e293b', margin: 16, marginBottom: 8 },
    dropdownModalScroll: { maxHeight: 400 },
    dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
    submitBtn: { backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    /* Add Farm Modal Styles */
    farmModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
    farmModalContent: { width: '90%', maxWidth: 500, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', maxHeight: '90%' },
    farmModalContentFiller: { flex: 1, minHeight: 120, backgroundColor: '#fff' },
    farmModalHeader: { backgroundColor: '#10b981', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    farmModalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    farmModalSubtitle: { color: '#0f172a', fontSize: 10, fontWeight: '600', marginTop: 4 },
    farmModalProgressRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16, gap: 12 },
    progressBar: { flex: 1, height: 8, backgroundColor: '#d1fae5', borderRadius: 6, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#059669' },
    progressText: { fontSize: 12, color: '#059669', fontWeight: '700' },
    stepSubtitle: { paddingHorizontal: 16, fontSize: 14, color: '#0f172a', fontWeight: '700', marginTop: 6, marginBottom: 8 },
    farmModalBody: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 6 },
    farmIconWrap: { alignItems: 'center', marginTop: 12, marginBottom: 12 },
    farmIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
    infoNote: { backgroundColor: '#eff6ff', borderLeftWidth: 4, borderLeftColor: '#c7e6ff', padding: 10, marginTop: 5, borderRadius: 8, fontSize: 8 },
    nextBtn: { justifyContent: 'center',backgroundColor: '#86efac', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 5 },
    nextBtnText: { color: '#064e3b', fontWeight: '700', fontSize: 16 },
footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
    /* Change date specific */
    radioCard: { backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e6e6e6', marginTop: 8 },
    radioCardSelected: { borderColor: '#bbf7d0', backgroundColor: '#ecfdf5' },

    /* Step 2 dropdown extras */
    locationBtn: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    locationIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#ccfbf1',
        alignItems: 'center',
        justifyContent: 'center'
    },
    backBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff' ,justifyContent: 'center'},

    /* Step 3 styles */
    landIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#faf5ff', alignItems: 'center', justifyContent: 'center' },
    ownershipCard: { flex: 1, paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e6e6e6', backgroundColor: '#fff', alignItems: 'center' },
    ownershipCardSelected: { borderColor: '#bbf7d0', backgroundColor: '#ecfdf5' }
});
