import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiService, InvestorFarmer } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

const PAGE_SIZE = 10;

type TabLayout = 'table' | 'card';

export interface InvestorFarmersListProps {
  layout?: TabLayout;
  enableFocusRefresh?: boolean;
  onAddCoconutEntry?: (farmer: InvestorFarmer) => void;
  emptyMessage?: string;
  containerStyle?: object;
  showHeader?: boolean;
  showSearch?: boolean;
}

export const InvestorFarmersList: React.FC<InvestorFarmersListProps> = ({
  layout = 'table',
  enableFocusRefresh = true,
  onAddCoconutEntry,
  emptyMessage = 'No farmers found',
  containerStyle,
  showHeader = false,
  showSearch = true,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const themedColors = useMemo(() => Colors[colorScheme], [colorScheme]);
  const { language } = useLanguage();
  const farmersLabel = language === 'ta' ? 'விவசாயி' : 'Farmer';
  const mobileLabel = language === 'ta' ? 'மொபைல்' : 'Mobile';
  const harvestLabel = language === 'ta' ? 'கடைசி அறுவடை' : 'Last Harvest';
  const locationLabel = language === 'ta' ? 'இடம்' : 'Location';
  const actionLabel = language === 'ta' ? 'நடவடிக்கை' : 'Action';
  const callUnavailable = language === 'ta' ? 'மொபைல் எண் இல்லை' : 'Phone not available';
  const notRecorded = language === 'ta' ? 'பதிவு செய்யப்படவில்லை' : 'Not recorded';
  const locationUnavailable = language === 'ta' ? 'இடம் இல்லை' : 'Location not available';
  const addEntryLabel = language === 'ta' ? 'புதிய பதிவு' : 'Add Entry';
  const viewMapLabel = language === 'ta' ? 'வரைபடத்தில் பார்க்க' : 'View on Map';
  const emptyStateMessage = language === 'ta' ? 'விவசாயிகள் இல்லை' : emptyMessage;
  const emptyStateSub = language === 'ta'
    ? 'உங்கள் முதலீட்டாளர் கணக்கில் எந்த விவசாயிகளும் இணைக்கப்படவில்லை.'
    : 'We could not find any farmers linked to your investor account yet.';
  const retryLabel = language === 'ta' ? 'மீண்டும் முயற்சி' : 'Try again';
  const addEntryAlertTitle = language === 'ta' ? 'தேங்காய் பதிவைச் சேர்க்க' : 'Add coconut entry';
  const addEntryAlertBody = (name?: string | null) =>
    language === 'ta'
      ? `${name || 'இவ்விவசாயிக்காக'} தேங்காய் பதிவைத் தொடங்குங்கள்.`
      : `Begin coconut entry for ${name || 'this farmer'}.`;

  const [farmers, setFarmers] = useState<InvestorFarmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [investorId, setInvestorId] = useState<string | null>(null);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const searchQueryRef = useRef('');

  const loadCredentials = useCallback(async () => {
    try {
      const [token, role, userId] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('userRole'),
        AsyncStorage.getItem('userId'),
      ]);

      if (role !== 'investor') {
        setError('Available for investor accounts only.');
        setLoading(false);
        return;
      }

      if (!token || !userId) {
        setError('Missing authentication details. Please sign in again.');
        setLoading(false);
        return;
      }

      setAuthToken(token);
      setInvestorId(userId);
    } catch (credError) {
      setError('Unable to read saved credentials.');
      setLoading(false);
    }
  }, []);

  const fetchFarmers = useCallback(
    async ({ offset = 0, append = false, isRefresh = false } = {}) => {
      if (!authToken || !investorId) return;

      if (append) {
        setIsFetchingMore(true);
      } else if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await apiService.getInvestorFarmers(Number(investorId), authToken, {
          start: offset,
          length: PAGE_SIZE,
          status: 1,
          search: searchQueryRef.current || undefined,
        });

        setFarmers((prev) => (append ? [...prev, ...response.data] : response.data));
        setTotalAvailable(response.total || response.pagination?.total || response.data.length);
        setError(null);
      } catch (apiError) {
        console.error('Error loading investor farmers:', apiError);
        setError('Unable to load farmers. Please try again.');
      } finally {
        if (append) {
          setIsFetchingMore(false);
        } else if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [authToken, investorId]
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    searchQueryRef.current = text;
    
    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    // Set new timer for debounced search
    const timer = setTimeout(() => {
      fetchFarmers({ offset: 0 });
    }, 500); // 500ms debounce
    
    setSearchDebounceTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  useEffect(() => {
    if (authToken && investorId) {
      fetchFarmers();
    }
  }, [authToken, investorId, fetchFarmers]);

  useFocusEffect(
    enableFocusRefresh
      ? useCallback(() => {
          if (authToken && investorId) {
            fetchFarmers();
          }
        }, [authToken, investorId, fetchFarmers])
      : () => {}
  );

  const handleCall = (phoneNumber?: string | null) => {
    if (!phoneNumber) {
      Alert.alert('Phone number unavailable', 'This farmer does not have a phone number listed.');
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleOpenMap = (latitude?: string | null, longitude?: string | null, name?: string | null) => {
    if (!latitude || !longitude) {
      Alert.alert('Location unavailable', 'No coordinates provided for this farmer.');
      return;
    }

    const label = encodeURIComponent(name || 'NAAM Farmer');
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`
        : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const handleAddEntry = (farmer: InvestorFarmer) => {
    if (!farmer.land_id) {
      Alert.alert(
        language === 'ta' ? 'நில விவரம் இல்லை' : 'Missing land details',
        language === 'ta'
          ? 'இந்த விவசாயிக்கு நிலத்தின் விவரங்கள் சேர்க்கப்படவில்லை.'
          : 'No land details are linked to this farmer yet.'
      );
      return;
    }

    if (onAddCoconutEntry) {
      onAddCoconutEntry(farmer);
      return;
    }

    router.push({
      pathname: '/add-collection-entry',
      params: {
        farmerId: String(farmer.id),
        farmerName: farmer.fullname || '',
        landId: String(farmer.land_id),
      },
    });
  };

  const handleViewCollection = (farmer: InvestorFarmer) => {
    if (!farmer.land_id) {
      Alert.alert(
        language === 'ta' ? 'நில விவரம் இல்லை' : 'Missing land details',
        language === 'ta'
          ? 'இந்த விவசாயிக்கு நில விவரங்கள் இல்லாததால் சேகரிப்பைப் பார்க்க முடியவில்லை.'
          : 'Unable to open collection history without land information.'
      );
      return;
    }

    router.push({
      pathname: '/collection-details',
      params: {
        farmerId: String(farmer.id),
        landId: String(farmer.land_id),
        farmerName: farmer.fullname || '',
      },
    });
  };

  const handleLoadMore = () => {
    if (loading || isFetchingMore) return;
    if (farmers.length >= totalAvailable) return;
    fetchFarmers({ offset: farmers.length, append: true });
  };

  const handleRefresh = () => {
    if (loading) return;
    fetchFarmers({ offset: 0, isRefresh: true });
  };

  const renderTableHeader = () => (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.tableHeader}>
      <ThemedText style={[styles.headerCell, styles.cellName]}>{farmersLabel}</ThemedText>
      <ThemedText style={[styles.headerCell, styles.cellMobile]}>{mobileLabel}</ThemedText>
      <ThemedText style={[styles.headerCell, styles.cellHarvest]}>{harvestLabel}</ThemedText>
      <ThemedText style={[styles.headerCell, styles.cellLocation]}>{locationLabel}</ThemedText>
      <ThemedText style={[styles.headerCell, styles.cellAction]}>{actionLabel}</ThemedText>
    </LinearGradient>
  );

  const renderFarmerRow = ({ item }: { item: InvestorFarmer }) => {
    const formattedHarvestDate = item.last_harvest_date
      ? new Date(item.last_harvest_date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : notRecorded;

    const locationPieces = [item.village_name].filter(Boolean);
    const locationLine = locationPieces.length > 0 
      ? `${locationPieces[0]}.` 
      : locationUnavailable;

    if (layout === 'card') {
      return (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: themedColors.card }]}
          onLongPress={() => handleViewCollection(item)}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.farmerName}>{item.fullname || 'Unnamed Farmer'}</ThemedText>
            </View>
            <View style={styles.headerIcons}>
              {item.land_lattitude && item.land_longitude && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleOpenMap(item.land_lattitude, item.land_longitude, item.fullname)}
                  accessibilityLabel={viewMapLabel}
                >
                  <Ionicons name="location-outline" size={20} color="#3182ce" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.iconButton} onPress={() => handleCall(item.mobile_no)}>
                <Ionicons name="call" size={20} color="#38a169" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={themedColors.gray} style={styles.infoIcon} />
            <ThemedText style={styles.infoText}>{item.mobile_no || callUnavailable}</ThemedText>
          </View>

          <View style={[styles.infoRowWithAction, { marginBottom: 20 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="calendar-outline" size={16} color={themedColors.gray} style={styles.infoIcon} />
              <ThemedText style={styles.infoText}>
                {language === 'ta' ? 'கடைசி அறுவடை: ' : 'Last harvest: '}
                {formattedHarvestDate}
              </ThemedText>
            </View>
            <TouchableOpacity style={styles.addEntryIconButton} onPress={() => handleAddEntry(item)}>
              <Ionicons name="add-circle" size={20} color="#3182ce" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.tableRow, { backgroundColor: themedColors.card }]}>
        <View style={[styles.cell, styles.cellName]}>
          <ThemedText style={styles.cellPrimary} numberOfLines={1}>
            {item.fullname || 'Unnamed'}
          </ThemedText>
          <ThemedText style={styles.cellSecondary}>ID #{item.id}</ThemedText>
        </View>

        <View style={[styles.cell, styles.cellMobile]}>
          <TouchableOpacity style={styles.cellActionInline} onPress={() => handleCall(item.mobile_no)}>
            <Ionicons name="call" size={14} color="#38a169" style={styles.inlineIcon} />
            <ThemedText style={styles.cellPrimary}>{item.mobile_no || 'NA'}</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[styles.cell, styles.cellHarvest]}>
          <ThemedText style={styles.cellPrimary}>{formattedHarvestDate}</ThemedText>
        </View>

        <View style={[styles.cell, styles.cellLocation]}>
          <TouchableOpacity
            style={styles.cellActionInline}
            onPress={() => handleOpenMap(item.land_lattitude, item.land_longitude, item.fullname)}
          >
            <Ionicons name="location-sharp" size={14} color="#ed8936" style={styles.inlineIcon} />
            <ThemedText style={styles.cellPrimary} numberOfLines={1}>
              {locationLine}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[styles.cell, styles.cellAction, styles.tableActions]}>
          {item.land_lattitude && item.land_longitude && (
            <TouchableOpacity
              style={styles.tableIconButton}
              onPress={() => handleOpenMap(item.land_lattitude, item.land_longitude, item.fullname)}
              accessibilityLabel={viewMapLabel}
            >
              <Ionicons name="map" size={18} color="#3182ce" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.tableGhostButton} onPress={() => handleViewCollection(item)}>
            <Ionicons name="eye-outline" size={14} color="#3182ce" />
            <ThemedText style={styles.tableGhostButtonText}>
              {language === 'ta' ? 'சேகரிப்பை காண' : 'View'}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addEntryButtonTable} onPress={() => handleAddEntry(item)}>
            <Ionicons name="add-circle" size={16} color="#fff" />
            <ThemedText style={styles.addEntryButtonText}>{addEntryLabel}</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol name="person.2.circle" size={48} color="#c3dafe" />
      <ThemedText style={styles.emptyTitle}>{emptyStateMessage}</ThemedText>
      {error ? (
        <ThemedText style={styles.emptySubtitle}>{error}</ThemedText>
      ) : (
        <ThemedText style={styles.emptySubtitle}>{emptyStateSub}</ThemedText>
      )}
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchFarmers({ offset: 0 })}>
        <ThemedText style={styles.retryText}>{retryLabel}</ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (loading && farmers.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
      </View>
    );
  }

  const farmersHeaderTitle = language === 'ta' ? 'இணைந்த விவசாயிகள்' : 'Connected Farmers';
  const farmersHeaderSubtitle = language === 'ta'
    ? 'உங்கள் விவசாயிகளுடன் ஒத்துழைக்க, அழைக்க, வரைபடத்தில் காண.'
    : 'Coordinate with your farmers, call them, or plan farm visits.';
  const searchPlaceholder = language === 'ta' ? 'பெயர் அல்லது மொபைல் எண்ணைத் தேடுங்கள்...' : 'Search by name or mobile number...';

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {showHeader && (
        <View style={[styles.modernHeader, { backgroundColor: themedColors.background }]}>
          <View style={styles.headerTop}>
            <View style={styles.greetingContainer}>
              <ThemedText style={[styles.greetingText, { color: themedColors.text }]}>
                {farmersHeaderTitle}
              </ThemedText>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <View style={styles.notificationBadge}>
                <ThemedText style={styles.notificationCount}>8</ThemedText>
              </View>
              <IconSymbol name="bell.fill" size={24} color={themedColors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showSearch && (
        <View style={[styles.searchContainer, { backgroundColor: themedColors.background }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: themedColors.card, borderColor: themedColors.border }]}>
            <Ionicons name="search" size={20} color={themedColors.gray} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: themedColors.text }]}
              placeholder={searchPlaceholder}
              placeholderTextColor={themedColors.gray}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  searchQueryRef.current = '';
                  fetchFarmers({ offset: 0 });
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={themedColors.gray} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <FlatList
        data={farmers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFarmerRow}
        ListHeaderComponent={layout === 'table' ? renderTableHeader : undefined}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          farmers.length === 0
            ? styles.flatListEmptyContainer
            : layout === 'table'
              ? styles.tableListContent
              : styles.cardListContent
        }
        onEndReachedThreshold={0.3}
        onEndReached={handleLoadMore}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#667eea" />}
        ListFooterComponent={
          isFetchingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#667eea" />
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  modernHeader: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 20,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  searchContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148,163,184,0.2)',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 12,
    color: '#f56565',
    textAlign: 'center',
  },
  flatListEmptyContainer: {
    flexGrow: 1,
    padding: 24,
  },
  tableListContent: {
    paddingBottom: 24,
    paddingHorizontal: 12,
  },
  cardListContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginHorizontal: 0,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    marginHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(226,232,240,0.8)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  cell: {
    paddingHorizontal: 8,
  },
  cellName: {
    flex: 1.5,
  },
  cellMobile: {
    flex: 1,
  },
  cellHarvest: {
    flex: 1,
  },
  cellLocation: {
    flex: 1.5,
  },
  cellAction: {
    flex: 0.9,
    alignItems: 'center',
  },
  headerCell: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cellPrimary: {
    fontSize: 14,
    fontWeight: '600',
  },
  cellSecondary: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  cellActionInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineIcon: {
    marginRight: 6,
  },
  addEntryButtonTable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3182ce',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  addEntryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  farmerName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 0,
  },
  farmerId: {
    fontSize: 12,
    color: '#a0aec0',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(72, 187, 120, 0.15)',
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  infoRowWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
    color: '#4a5568',
  },
  addEntryIconButton: {
    padding: 4,
  },
  tableActions: {
    gap: 8,
  },
  tableIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(49,130,206,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableGhostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(49,130,206,0.08)',
  },
  tableGhostButtonText: {
    color: '#3182ce',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#718096',
    marginTop: 6,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#667eea',
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 16,
  },
});

