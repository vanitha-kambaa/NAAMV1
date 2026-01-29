import { useSideMenu } from '@/components/SideMenu';
import { ThemedText } from '@/components/themed-text';
import { API_CONFIG } from '@/config/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminScreen() {
  const { open: openSideMenu } = useSideMenu();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'news'>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({ total_members: 0, active_members: 0, news: 0, events: 0, pending: 0, published: 0 });
  // Dashboard API response and pending items
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardPending, setDashboardPending] = useState<Array<any>>([]);
  // Logged in user info for role display
  const [loggedUser, setLoggedUser] = useState<any>(null);

  const ROLE_MAP: Record<number, { en: string; ta: string }> = {
    15: { en: 'Branch Secretary', ta: 'கிளை செயலாளர்' },
    14: { en: 'Union Secretary', ta: 'ஒன்றிய செயலாளர்' },
    13: { en: 'District Secretary', ta: 'மாவட்ட செயலாளர்' },
    12: { en: 'Zonal Secretary', ta: 'மண்டல செயலாளர்' },
    11: { en: 'General Secretary', ta: 'பொது செயலாளர்' },
    7: { en: 'State Leader', ta: 'மாநில தலைவர்' },
    16: { en: 'Member', ta: 'உறுப்பினர்' },
    2: { en: 'Member', ta: 'உறுப்பினர்' },
    3: { en: 'Investor', ta: 'முதலீட்டாளர்' },
    4: { en: 'Service Provider', ta: 'சேவை வழங்குநர்' },
  };

  const loadLoggedUser = async () => {
    try {
      // First try to get from userInfo
      let ud = await AsyncStorage.getItem('userInfo');
      if (ud) {
        setLoggedUser(JSON.parse(ud));
        return;
      }
      // If not found, try userData (from login API response)
      ud = await AsyncStorage.getItem('userData');
      if (ud) {
        setLoggedUser(JSON.parse(ud));
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => { loadLoggedUser(); }, []);

  // Members tab state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRoleFilter, setShowRoleFilter] = useState<boolean>(false);
  const [roleOptions, setRoleOptions] = useState<Array<any>>([
    { id: 0, name: 'All', ta: 'அனைத்து' },
    { id: 1, name: 'Farmer', ta: 'வேளாளர்' },
    { id: 2, name: 'State Admin', ta: 'மாநில தலைவர்' },
    { id: 3, name: 'Service Provider', ta: 'சேவை வழங்குநர்' },
  ]);
  const [selectedRole, setSelectedRole] = useState<number>(0);
  const [members, setMembers] = useState<Array<any>>([]);
  const [membersLoading, setMembersLoading] = useState<boolean>(false);
  const [membersStart, setMembersStart] = useState<number>(0);
  const [membersHasMore, setMembersHasMore] = useState<boolean>(true);
  const [membersFetchingMore, setMembersFetchingMore] = useState<boolean>(false);

  // Posting modal state
  const [postingModalVisible, setPostingModalVisible] = useState<boolean>(false);
  const [postingSelectedMember, setPostingSelectedMember] = useState<any>(null);
  const [postingRoleSelected, setPostingRoleSelected] = useState<number>(16); // Default to Member
  const [showPostingRoleOptions, setShowPostingRoleOptions] = useState<boolean>(false);
  const [postingRemark, setPostingRemark] = useState<string>('');
  const [postingRemovalLoading, setPostingRemovalLoading] = useState<boolean>(false);
  const [locationOptions, setLocationOptions] = useState<Array<{ id: number; name: string; area_id?: number; state_name_tamil?: string }>>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationSearch, setLocationSearch] = useState<string>('');

  // Posting role options - fetched from API
  const [postingRoleOptions, setPostingRoleOptions] = useState<Array<{ id: number; name: string; ta: string }>>([
    { id: 15, name: 'Branch Secretary', ta: 'கிளை செயலாளர்' },
    { id: 14, name: 'Union Secretary', ta: 'ஒன்றிய செயலாளர்' },
    { id: 13, name: 'District Secretary', ta: 'மாவட்ட செயலாளர்' },
    { id: 12, name: 'Zonal Secretary', ta: 'மண்டல செயலாளர்' },
    { id: 11, name: 'General Secretary', ta: 'பொது செயலாளர்' },
    { id: 7, name: 'State Leader', ta: 'மாநில தலைவர்' },
    { id: 16, name: 'Member', ta: 'உறுப்பினர்' },
  ]);

  // whether the current posting modal is for removal (role is not a Farmer)
  const isPostingRemoval = !!(postingSelectedMember && postingSelectedMember.role && postingSelectedMember.role.toLowerCase() !== 'farmer');

  // Create News modal state
  const [createNewsModalVisible, setCreateNewsModalVisible] = useState<boolean>(false);
  const [createNewsTitle, setCreateNewsTitle] = useState<string>('');
  // const [createNewsSubtitle, setCreateNewsSubtitle] = useState<string>(''); // Removed as per request
  const [createNewsContent, setCreateNewsContent] = useState<string>('');
  const [createNewsLocation, setCreateNewsLocation] = useState<string>(''); // Source
  const [createNewsLinks, setCreateNewsLinks] = useState<string>('');
  const [createNewsImage, setCreateNewsImage] = useState<string>('');
  const [createNewsPublishNow, setCreateNewsPublishNow] = useState<boolean>(false);
  const [createNewsType, setCreateNewsType] = useState<'news' | 'event'>('news');
  const [createNewsError, setCreateNewsError] = useState<string>('');
  const [createNewsTargetLevel, setCreateNewsTargetLevel] = useState<'state' | 'district'>('state');
  const [showCreateTargetOptions, setShowCreateTargetOptions] = useState<boolean>(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState<boolean>(false);
  const [showNewsPreview, setShowNewsPreview] = useState<boolean>(false);


  // Create Event modal state
  const [createEventModalVisible, setCreateEventModalVisible] = useState<boolean>(false);
  const [createEventTitle, setCreateEventTitle] = useState<string>('');
  const [createEventDesc, setCreateEventDesc] = useState<string>('');
  const [createEventDate, setCreateEventDate] = useState<string>('');
  const [createEventLocation, setCreateEventLocation] = useState<string>('');
  const [createEventError, setCreateEventError] = useState<string>('');
  const [createEventLoading, setCreateEventLoading] = useState<boolean>(false);


  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (loggedUser?.role_id) {
      fetchRoleOptions();
    }
  }, [loggedUser]);

  const fetchRoleOptions = async () => {
    if (!loggedUser?.role_id) {
      return; // Don't fetch if user role_id is not available
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/role-master/roles/${loggedUser.role_id}/hierarchy`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // API returns { status: "success", data: [...] }
        const roles = data?.data || [];
        if (Array.isArray(roles) && roles.length > 0) {
          // Map API response to the expected format
          // Response has: id, role (English name)
          const mappedRoles = roles.map((roleItem: any) => ({
            id: roleItem.id,
            name: roleItem.role || '',
            ta: roleItem.role_tamil || roleItem.role || '', // Use role as fallback if Tamil not available
          }));

          // Update posting role options
          setPostingRoleOptions(mappedRoles);

          // Update role options for filter (add "All" option at the beginning)
          setRoleOptions([
            { id: 0, name: 'All', ta: 'அனைத்து' },
            ...mappedRoles,
          ]);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch role options', e);
      // Keep default hardcoded options on error
    }
  };

  const fetchMembers = async (start: number = 0, append: boolean = false) => {
    if (append) {
      setMembersFetchingMore(true);
    } else {
      setMembersLoading(true);
      setMembersStart(0);
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      // Use the new API endpoint with start parameter for pagination
      const apiUrl = `${API_CONFIG.BASE_URL}/users/datatable-users?start=${start}&length=50&search=${searchQuery || ''}`;

      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json().catch(() => null);

      const normalize = (it: any) => {
        const id = it.id || it._id || it.user_id || `${Date.now()}-${Math.random()}`;
        const name = it.fullname || it.name || it.user_name || it.first_name || '';
        const mobile = it.mobile_no || it.mobile || it.phone || '';
        const role_id = it.role_id ? Number(it.role_id) : (it.role ? (String(it.role).toLowerCase() === 'farmer' ? 2 : undefined) : undefined);
        const role = it.role_name || it.role || (role_id && ROLE_MAP[role_id] ? (language === 'ta' ? ROLE_MAP[role_id].ta : ROLE_MAP[role_id].en) : '');
        const subdistrict = it.subdistrict_name || it.subdistrict || '';
        const districtName = it.district_display_name || it.district || '';
        const panchayatName = it.panchayat_name || it.panchayat || '';
        const aadhar_verified = Number(it.aadhar_verified ?? it.aadhar_verification ?? 0);
        return {
          id,
          name,
          mobile_no: mobile,
          role_id,
          role,
          role_tamil: it.role_name_tamil || it.role_tamil,
          district: districtName,
          subdistrict: subdistrict,
          panchayat: panchayatName,
          aadhar_verified,
          verified: !!it.verified,
          joined: it.created_at || it.joined || '',
          raw: it,
        };
      };

      if (json && (json.status === 'success' || json.success) && json.data) {
        const items = json.data.members || json.data.items || json.data.list || json.data || [];
        const normalizedItems = (items || []).map(normalize);

        if (append) {
          setMembers((prev) => [...prev, ...normalizedItems]);
        } else {
          setMembers(normalizedItems);
        }

        // Check if there are more items to load
        const total = json.total || json.count || json.data?.total || 0;
        const currentCount = append ? members.length + normalizedItems.length : normalizedItems.length;
        setMembersHasMore(currentCount < total && normalizedItems.length > 0);
        setMembersStart(start + normalizedItems.length);
      } else if (Array.isArray(json)) {
        const normalizedItems = json.map(normalize);
        if (append) {
          setMembers((prev) => [...prev, ...normalizedItems]);
        } else {
          setMembers(normalizedItems);
        }
        setMembersHasMore(json.length === 50); // Assume more if we got a full page
        setMembersStart(start + normalizedItems.length);
      } else {
        if (!append) {
          // fallback mock only on initial load
          setMembers([
            { id: 'm1', name: 'S. Rajesh', mobile_no: '9876543210', role: 'Farmer', role_tamil: 'வேளாளர்', district: 'Tirunelveli', panchayat: 'Panchayat A', verified: true, joined: '2022-08-21' },
            { id: 'm2', name: 'K. Meena', mobile_no: '8765432109', role: 'Service Provider', role_tamil: 'சேவை வழங்குநர்', district: 'Madurai', panchayat: 'Panchayat B', verified: false, joined: '2021-05-12' },
          ]);
        }
        setMembersHasMore(false);
      }
    } catch (e) {
      console.warn('Members fetch failed', e);
      if (!append) {
        setMembers([
          { id: 'm1', name: 'S. Rajesh', mobile_no: '9876543210', role: 'Farmer', role_tamil: 'வேளாளர்', district: 'Tirunelveli', panchayat: 'Panchayat A', verified: true, joined: '2022-08-21' },
          { id: 'm2', name: 'K. Meena', mobile_no: '8765432109', role: 'Service Provider', role_tamil: 'சேவை வழங்குநர்', district: 'Madurai', panchayat: 'Panchayat B', verified: false, joined: '2021-05-12' },
        ]);
      }
      setMembersHasMore(false);
    } finally {
      setMembersLoading(false);
      setMembersFetchingMore(false);
    }
  };

  const loadMoreMembers = () => {
    if (!membersFetchingMore && membersHasMore && !membersLoading) {
      fetchMembers(membersStart, true);
    }
  };

  const membersFiltered = members.filter((m) => {
    if (selectedRole && selectedRole !== 0 && m.role && m.role.toLowerCase().indexOf(roleOptions.find(r => r.id === selectedRole)?.name?.toLowerCase() || '') === -1) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (m.name && m.name.toLowerCase().includes(q)) || (m.mobile_no && m.mobile_no.includes(q));
  });

  // News & Events state
  const [newsList, setNewsList] = useState<Array<any>>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(false);
  const [newsSearch, setNewsSearch] = useState<string>('');
  const [newsTypeFilter, setNewsTypeFilter] = useState<'all' | 'news' | 'event'>('all');
  const [newsStatusFilter, setNewsStatusFilter] = useState<'all' | 'pending' | 'published' | 'rejected'>('all');
  const [showNewsStatusOptions, setShowNewsStatusOptions] = useState<boolean>(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const apiUrl = `${API_CONFIG.BASE_URL}/upcoming-events?page=1&limit=100&search=${newsSearch}`;

      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json().catch(() => null);

      const normalizeItem = (it: any) => {
        const id = it.id || it._id || `${Date.now()}-${Math.random()}`;
        const title = it.title || it.event_name || it.event_name_tamil || (it.description ? (it.description.length > 60 ? it.description.substring(0, 60) + '...' : it.description) : '');
        const subtitle = it.subtitle || it.subtitle_tamil || '';
        const type = (it.type ? String(it.type).toLowerCase() : (it.event_name ? 'event' : 'news'));
        const statusRaw = (it.status !== undefined && it.status !== null) ? String(it.status).toLowerCase() : (it.event_status ? String(it.event_status).toLowerCase() : 'pending');
        const status = (statusRaw === '1' || statusRaw === 'pending') ? 'pending' : (statusRaw === 'published' || statusRaw === '0' || statusRaw === '2' ? 'published' : 'pending');
        const date = it.start_date || it.published_date || it.created_at || it.date || '';
        const excerpt = it.description ? (it.description.length > 140 ? it.description.substring(0, 140) + '...' : it.description) : (it.excerpt || '');
        const content = it.content || it.description || it.excerpt || '';
        const author = it.created_by_name || it.organizer || it.author || '';
        const location = it.location || '';
        const factChecked = it.fact_checked !== undefined ? it.fact_checked : (it.factChecked !== undefined ? it.factChecked : false);
        return { id, title, subtitle, type, status, date, excerpt, content, author, location, factChecked, raw: it };
      };

      if (json && (json.data || Array.isArray(json))) {
        const items = Array.isArray(json) ? json : (json.data.items || json.data.events || json.data || []);
        const normalized = (items || []).map(normalizeItem);
        setNewsList(normalized);
      } else {
        setNewsList([
          { id: 'n1', title: 'Planting season announced', type: 'news', status: 'published', date: '2024-12-01', excerpt: 'Planting season starts next month for selected crops.' },
          { id: 'n2', title: 'Co-op meeting in Pollachi', type: 'event', status: 'pending', date: '2025-01-10', excerpt: 'A cooperative meeting for farmers in the region.' },
        ]);
      }
    } catch (e) {
      console.warn('News fetch failed', e);
      setNewsList([
        { id: 'n1', title: 'Planting season announced', type: 'news', status: 'published', date: '2024-12-01', excerpt: 'Planting season starts next month for selected crops.' },
        { id: 'n2', title: 'Co-op meeting in Pollachi', type: 'event', status: 'pending', date: '2025-01-10', excerpt: 'A cooperative meeting for farmers in the region.' },
      ]);
    } finally {
      setNewsLoading(false);
    }
  };

  const filteredNews = newsList.filter((item) => {
    if (newsTypeFilter !== 'all' && item.type !== newsTypeFilter) return false;
    if (newsStatusFilter !== 'all' && item.status !== newsStatusFilter) return false;
    if (!newsSearch) return true;
    const q = newsSearch.toLowerCase();
    return (item.title && item.title.toLowerCase().includes(q)) || (item.excerpt && item.excerpt.toLowerCase().includes(q));
  });

  const newsCounts = {
    all: newsList.length,
    published: newsList.filter(n => n.status === 'published').length,
    pending: newsList.filter(n => n.status === 'pending').length,
    rejected: newsList.filter(n => n.status === 'rejected').length,
  };

  const pendingNews = newsList.filter(n => n.status === 'pending');
  // Prefer server-provided pending items for the Approvals panel if available
  const pendingItemsToShow = (dashboardPending && dashboardPending.length) ? dashboardPending : pendingNews;

  const formatDateDisplay = (date?: string) => {
    if (!date) return '';
    // If ISO-like with time, take date part
    const dateOnly = String(date).split('T')[0];
    const ymd = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymd) return `${ymd[3]}-${ymd[2]}-${ymd[1]}`;
    // already dd-mm-yyyy
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateOnly)) return dateOnly;
    // Try to parse with Date
    const dt = new Date(date);
    if (!isNaN(dt.getTime())) {
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yyyy = dt.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }
    // fallback: return original
    return String(date);
  };

  const updateEventStatus = async (itemId: string | number, eventStatus: 'Published' | 'Rejected') => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const eventId = itemId;

      const response = await fetch(`${API_CONFIG.BASE_URL}/upcoming-events/${eventId}/event-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          event_status: eventStatus,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = json?.message || json?.error || (language === 'ta' ? 'பிழை ஏற்பட்டது' : 'Failed to update status');
        throw new Error(errorMessage);
      }

      return { success: true, data: json };
    } catch (error: any) {
      console.warn('Update event status failed', error);
      throw error;
    }
  };

  const revokeUserPosting = async (userId: string | number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      const response = await fetch(`${API_CONFIG.BASE_URL}/role-assignments/revoke-user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = json?.message || json?.error || (language === 'ta' ? 'பதவி நீக்குவதில் பிழை ஏற்பட்டது' : 'Failed to remove posting');
        throw new Error(errorMessage);
      }

      return { success: true, data: json };
    } catch (error: any) {
      console.warn('Revoke user posting failed', error);
      throw error;
    }
  };

  const fetchLocationsForRole = async (roleId: number) => {
    try {
      console.log('[fetchLocationsForRole] Starting fetch for role_id:', roleId);
      setLocationLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        console.error('[fetchLocationsForRole] No auth token found');
        setLocationOptions([]);
        setSelectedLocationId(null);
        setPostingRemark('');
        setLocationLoading(false);
        return;
      }

      // Use the new API endpoint
      const apiUrl = `${API_CONFIG.BASE_URL}/locations/${roleId}/list`;

      console.log('[fetchLocationsForRole] API URL:', apiUrl);
      console.log('[fetchLocationsForRole] Request headers:', {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.substring(0, 20)}...`,
      });

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[fetchLocationsForRole] Response status:', response.status);
      console.log('[fetchLocationsForRole] Response ok:', response.ok);

      const json = await response.json().catch((parseError) => {
        console.error('[fetchLocationsForRole] JSON parse error:', parseError);
        return null;
      });

      console.log('[fetchLocationsForRole] Response JSON:', JSON.stringify(json, null, 2));

      if (response.ok && json && json.status === 'success' && json.data) {
        const locationsData = Array.isArray(json.data) ? json.data : [];
        console.log('[fetchLocationsForRole] Parsed locations:', locationsData);
        console.log('[fetchLocationsForRole] Locations count:', locationsData.length);

        // Map the response data to our location format
        // API response has: id, name (English), tname (Tamil)
        const mappedLocations = locationsData.map((loc: any) => ({
          id: loc.id,
          name: language === 'ta' ? (loc.tname || loc.name || '') : (loc.name || ''),
          area_id: loc.id, // Use id as area_id
          state_name_tamil: loc.tname || '',
        }));

        console.log('[fetchLocationsForRole] Mapped locations:', mappedLocations);
        setLocationOptions(mappedLocations);
        // Reset selected location when new options are loaded
        setSelectedLocationId(null);
        setPostingRemark('');

        console.log('[fetchLocationsForRole] Successfully set location options');
      } else {
        console.warn('[fetchLocationsForRole] Response not ok or no data. Status:', response.status, 'JSON:', json);
        setLocationOptions([]);
        setSelectedLocationId(null);
        setPostingRemark('');
      }
    } catch (error: any) {
      console.error('[fetchLocationsForRole] Fetch error:', error);
      console.error('[fetchLocationsForRole] Error message:', error?.message);
      console.error('[fetchLocationsForRole] Error stack:', error?.stack);
      setLocationOptions([]);
      setSelectedLocationId(null);
      setPostingRemark('');
    } finally {
      setLocationLoading(false);
      console.log('[fetchLocationsForRole] Finished loading');
    }
  };

  const assignUserPosting = async (userId: string | number, roleId: number, level: string, area: string, areaId: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      const response = await fetch(`${API_CONFIG.BASE_URL}/role-assignments/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: userId,
          role_id: roleId,
          level: level,
          area: area,
          area_id: areaId,
          location_id: areaId,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = json?.message || json?.error || (language === 'ta' ? 'பதவி வழங்குவதில் பிழை ஏற்பட்டது' : 'Failed to assign posting');
        throw new Error(errorMessage);
      }

      return { success: true, data: json };
    } catch (error: any) {
      console.warn('Assign user posting failed', error);
      throw error;
    }
  };

  const togglePublish = (item: any) => {
    setNewsList((prev) => prev.map((n) => n.id === item.id ? { ...n, status: n.status === 'published' ? 'pending' : 'published' } : n));
  };

  const removeNewsItem = (item: any) => {
    setNewsList((prev) => prev.filter((n) => n.id !== item.id));
  };

  const pickNewsImage = () => {
    Alert.alert(
      language === 'ta' ? 'படம் தேர்வு' : 'Select Image',
      language === 'ta' ? 'மூலத்தைத் தேர்ந்தெடுக்கவும்' : 'Choose source',
      [
        {
          text: language === 'ta' ? 'கேமரா' : 'Camera',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(language === 'ta' ? 'அனுமதி தேவை' : 'Permission required', language === 'ta' ? 'கேமரா அனுமதி தேவை' : 'Camera permission is required');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
              });
              if (!result.canceled && result.assets[0].uri) {
                setCreateNewsImage(result.assets[0].uri);
              }
            } catch (e) {
              console.log('Camera Error:', e);
            }
          }
        },
        {
          text: language === 'ta' ? 'கேலரி' : 'Gallery',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
              });
              if (!result.canceled && result.assets[0].uri) {
                setCreateNewsImage(result.assets[0].uri);
              }
            } catch (e) {
              console.log('Image Picker Error:', e);
            }
          }
        },
        {
          text: language === 'ta' ? 'ரத்து' : 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const validateLink = (url: string) => {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(url);
  };

  const isAdminRole = (loggedUser?.role_id === 21 || loggedUser?.role_id === 22);

  const canSubmit = createNewsTitle.trim().length > 0 && createNewsContent.trim().length > 0 && createNewsLocation.trim().length > 0 && createNewsLinks.trim().length > 0;

  const handleCreateNewsSubmit = (approve: boolean = false) => {
    if (!createNewsTitle.trim()) { setCreateNewsError(language === 'ta' ? 'தலைப்பு தேவை' : 'Title is required'); return; }
    if (!createNewsContent.trim()) { setCreateNewsError(language === 'ta' ? 'உள்ளடக்கம் தேவை' : 'Content is required'); return; }
    if (!createNewsLocation.trim()) { setCreateNewsError(language === 'ta' ? 'மூலம் தேவை' : 'Source is required'); return; }
    if (!createNewsLinks.trim()) { setCreateNewsError(language === 'ta' ? 'இணைப்புகள் தேவை' : 'Links are required'); return; }
    if (!validateLink(createNewsLinks.trim())) { setCreateNewsError(language === 'ta' ? 'சரியான இணைய முகவரியை உள்ளிடவும்' : 'Please enter a valid link URL'); return; }

    const shouldAutoApprove = isAdminRole || approve;

    const newItem = {
      id: `n${Date.now()}`,
      title: createNewsTitle,
      // subtitle: createNewsSubtitle, // Removed
      excerpt: createNewsContent.length > 140 ? createNewsContent.substring(0, 140) + '...' : createNewsContent,
      content: createNewsContent,
      location: createNewsLocation,
      links: createNewsLinks,
      image_uri: createNewsImage,
      type: createNewsType,
      status: shouldAutoApprove ? 'published' : 'pending',
      target_level: createNewsTargetLevel,
      date: new Date().toISOString().split('T')[0],
      author: 'Admin',
      factChecked: shouldAutoApprove, // Auto fact checked if admin approves
    };
    setNewsList(prev => [newItem, ...prev]);
    setStats((prev: any) => ({ ...prev, news: (prev.news || 0) + 1, published: (prev.published || 0) + (shouldAutoApprove ? 1 : 0), pending: (prev.pending || 0) + (shouldAutoApprove ? 0 : 1) }));
    setCreateNewsModalVisible(false);
    Alert.alert(language === 'ta' ? 'செய்தி சேர்க்கப்பட்டது' : 'News added', language === 'ta' ? (shouldAutoApprove ? 'உங்கள் செய்தி வெளியிடப்பட்டது.' : 'உங்கள் செய்தி சேர்க்கப்பட்டது.') : (shouldAutoApprove ? 'Your news item has been published.' : 'Your news item has been added.'));
  };

  const handleCreateEventSubmit = async () => {
    setCreateEventError('');
    if (!createEventTitle.trim()) { setCreateEventError(language === 'ta' ? 'தலைப்பு தேவை' : 'Title is required'); return; }
    if (!createEventDesc.trim()) { setCreateEventError(language === 'ta' ? 'விளக்கம் தேவை' : 'Description is required'); return; }
    if (!createEventDate.trim()) { setCreateEventError(language === 'ta' ? 'தேதி தேவை' : 'Date is required'); return; }
    if (!createEventLocation.trim()) { setCreateEventError(language === 'ta' ? 'இடம் தேவை' : 'Location is required'); return; }

    setCreateEventLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const fd = new FormData();
      // API expects event_name, description, location, start_date, end_date, organizer, status
      fd.append('type', 'Event');
      fd.append('event_name', createEventTitle);
      fd.append('description', createEventDesc);
      fd.append('location', createEventLocation);

      // Accept user-entered date as-is. If format is dd-mm-yyyy, try to convert to yyyy-mm-dd
      const dateInput = createEventDate.trim();
      let startDate = dateInput;
      let endDate = dateInput;
      const ddmmyyyy = dateInput.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (ddmmyyyy) {
        startDate = `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
        endDate = startDate;
      }
      fd.append('start_date', startDate);
      fd.append('end_date', endDate);
      fd.append('organizer', 'Admin');
      fd.append('status', '1');

      console.log('Creating Event - Request:', {
        url: `${API_CONFIG.BASE_URL}/upcoming-events`,
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const res = await fetch(`${API_CONFIG.BASE_URL}/upcoming-events`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const json = await res.json().catch(() => null);
      console.log('Creating Event - Response:', {
        status: res.status,
        ok: res.ok,
        json: json
      });

      if (res.ok) {
        // Use server response if available, otherwise fallback to local item
        const created = json && (json.data || json) ? (json.data || json) : null;
        const newItem = created ? {
          id: created.id || `e${Date.now()}`,
          title: created.event_name || createEventTitle,
          excerpt: created.description ? (created.description.length > 140 ? created.description.substring(0, 140) + '...' : created.description) : createEventDesc,
          content: created.description || createEventDesc,
          location: created.location || createEventLocation,
          type: 'event',
          status: created.status ? (String(created.status) === '1' ? 'pending' : 'published') : 'pending',
          date: created.start_date || startDate,
          author: created.organizer || 'Admin',
        } : {
          id: `e${Date.now()}`,
          title: createEventTitle,
          excerpt: createEventDesc.length > 140 ? createEventDesc.substring(0, 140) + '...' : createEventDesc,
          content: createEventDesc,
          location: createEventLocation,
          type: 'event',
          status: 'pending',
          date: startDate,
          author: 'Admin',
        };

        setNewsList(prev => [newItem, ...prev]);
        setStats((prev: any) => ({ ...prev, events: (prev.events || 0) + 1 }));
        setCreateEventModalVisible(false);
        Alert.alert(language === 'ta' ? 'நிகழ்வு சமர்ப்பிக்கப்பட்டது' : 'Event submitted', language === 'ta' ? 'உங்கள் நிகழ்வு சமர்ப்பிக்கப்பட்டது.' : 'Your event has been submitted for approval.');
      } else {
        const message = (json && (json.message || json.error)) ? (json.message || json.error) : (language === 'ta' ? 'பிழை ஏற்பட்டது' : 'Failed to submit event');
        setCreateEventError(message);
        Alert.alert(language === 'ta' ? 'பிழை' : 'Error', message);
      }
    } catch (e) {
      console.warn('Create event failed', e);
      setCreateEventError(language === 'ta' ? 'சேவை தோல்வியடைந்தது' : 'Service failed');
      Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'சேவை தோல்வியடைந்தது' : 'Service failed');
    } finally {
      setCreateEventLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      // Try the provided admin-dashboard endpoint first, then fall back to other known endpoints
      const endpoints = [
        `${API_CONFIG.BASE_URL}/admin-dashboard/details`,
        `${API_CONFIG.BASE_URL}/admin-dashboard/details`,
      ];

      let json: any = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (!res.ok) continue;
          json = await res.json().catch(() => null);
          if (json && json.data) break;
        } catch (err) {
          // continue to next endpoint
        }
      }

      if (json && json.data) {
        const d = json.data;
        setDashboardData(d);
        // set pending items for approvals
        setDashboardPending(d.pending_news_events || d.pending_news || []);

        setStats((prev: any) => ({
          ...prev,
          total_members: (d.total_members && (d.total_members.count ?? d.total_members)) ?? prev.total_members,
          active_members: (d.total_members && (d.total_members.active ?? d.total_members.active_members)) ?? prev.active_members,
          news: (d.my_news_events && (d.my_news_events.news_added ?? d.my_news_events.news)) ?? (d.news_count ?? prev.news),
          events: (d.my_news_events && (d.my_news_events.events_added ?? d.my_news_events.events)) ?? (d.events_count ?? prev.events),
          pending: (d.my_news_events && (d.my_news_events.pending ?? d.my_news_events.pending_items)) ?? prev.pending,
          published: (d.my_news_events && (d.my_news_events.published ?? d.my_news_events.published_items)) ?? prev.published,
        }));
      }
    } catch (e) {
      console.warn('Admin stats fetch failed', e);
    } finally {
      setLoading(false);
    }
  };

  const roleMapLook = loggedUser?.role_id ? ROLE_MAP[loggedUser.role_id] : undefined;
  const roleLabel = loggedUser?.role_name || (roleMapLook ? (language === 'ta' ? roleMapLook.ta : roleMapLook.en) : (loggedUser?.role || (language === 'ta' ? 'மாநில தலைவர்' : 'State Admin')));
  const headerName = loggedUser?.fullname || loggedUser?.name || (language === 'ta' ? 'மார்கன் குமார்' : 'Admin');

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.hamburger} onPress={() => openSideMenu()}>
          <Ionicons name="menu" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Image
          source={language === 'ta'
            ? require('../../assets/images/naam-logo-ta.png')
            : require('../../assets/images/naam-logo-en.png')
          }
          style={styles.topAppBarLogo}
          resizeMode="contain"
        />
        <View style={{ width: 36 }} />
      </View>

      {/* Header */}
      <View style={styles.headerWrap}>
        <ThemedText style={styles.headerTitle}>{roleLabel}</ThemedText>
        <ThemedText style={styles.headerSubtitle}>{headerName}</ThemedText>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'overview' && styles.tabActive]} onPress={() => setActiveTab('overview')}>
          <Ionicons name="bar-chart" size={18} color={activeTab === 'overview' ? '#065f46' : '#64748b'} style={styles.tabIcon} />
          <ThemedText style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>{language === 'ta' ? 'கண்ணோட்டம்' : 'Dashboard'}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'members' && styles.tabActive]} onPress={() => setActiveTab('members')}>
          <Ionicons name="people" size={18} color={activeTab === 'members' ? '#065f46' : '#64748b'} style={styles.tabIcon} />
          <ThemedText style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>{language === 'ta' ? 'உறுப்பினர்கள்' : 'Members'}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'news' && styles.tabActive]} onPress={() => setActiveTab('news')}>
          <Ionicons name="calendar" size={18} color={activeTab === 'news' ? '#065f46' : '#64748b'} style={styles.tabIcon} />
          <ThemedText numberOfLines={1} ellipsizeMode="tail" style={[styles.tabText, activeTab === 'news' && styles.tabTextActive]}>{language === 'ta' ? 'செய்திகள் & நிகழ்வுகள்' : 'News & Events'}</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            if (activeTab === 'members') {
              loadMoreMembers();
            }
          }
        }}
        scrollEventThrottle={400}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" />
        ) : (
          <>

            {activeTab === 'overview' && (

              <View>
                <ThemedText style={styles.statLabel}>{language === 'ta' ? 'உறுப்பினர் புள்ளிவிவரங்கள்' : 'Member Statistics'}</ThemedText>

                <View style={styles.bigStatsRow}>
                  <TouchableOpacity style={styles.bigStatCard} onPress={() => setActiveTab('members')}>
                    <ThemedText style={styles.statLabel}>{language === 'ta' ? 'மொத்த உறுப்பினர்கள்' : 'Total Members'}</ThemedText>
                    <ThemedText style={styles.statValue}>{stats.total_members}</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.bigStatCard} onPress={() => setActiveTab('members')}>
                    <ThemedText style={styles.statLabel}>{language === 'ta' ? 'செயலில் உள்ளவர்கள்' : 'Active Members'}</ThemedText>
                    <ThemedText style={styles.statValue}>{stats.active_members}</ThemedText>
                  </TouchableOpacity>
                </View>
                <ThemedText style={styles.statLabel}>{language === 'ta' ? 'என் செய்திகள் & நிகழ்வுகள்' : 'My News & Events'}</ThemedText>

                <View style={styles.tilesRow}>
                  <TouchableOpacity style={[styles.tile, { backgroundColor: '#eef2ff', borderColor: '#dbeafe' }]} onPress={() => setActiveTab('news')}>
                    <ThemedText style={styles.tileTitle}>{language === 'ta' ? 'செய்திகள்' : 'News'}</ThemedText>
                    <ThemedText style={styles.tileValue}>{stats.news}</ThemedText>
                    <ThemedText style={styles.tileNote}>{language === 'ta' ? 'சேர்க்கப்பட்டது' : 'Added'}</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.tile, { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' }]} onPress={() => setActiveTab('news')}>
                    <ThemedText style={styles.tileTitle}>{language === 'ta' ? 'நிகழ்வுகள்' : 'Events'}</ThemedText>
                    <ThemedText style={styles.tileValue}>{stats.events}</ThemedText>
                    <ThemedText style={styles.tileNote}>{language === 'ta' ? 'சேர்க்கப்பட்டது' : 'Added'}</ThemedText>
                  </TouchableOpacity>

                  <View style={[styles.tile, { backgroundColor: '#fff7ed', borderColor: '#fde68a' }]}>
                    <ThemedText style={styles.tileTitle}>{language === 'ta' ? 'காத்திருப்பு' : 'Pending'}</ThemedText>
                    <ThemedText style={styles.tileValue}>{stats.pending}</ThemedText>
                    <ThemedText style={styles.tileNote}>{language === 'ta' ? 'ஒப்புதலுக்காக' : 'For approval'}</ThemedText>
                  </View>

                  <View style={[styles.tile, { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' }]}>
                    <ThemedText style={styles.tileTitle}>{language === 'ta' ? 'வெளியிடப்பட்டது' : 'Published'}</ThemedText>
                    <ThemedText style={styles.tileValue}>{stats.published}</ThemedText>
                    <ThemedText style={styles.tileNote}>{language === 'ta' ? 'நிகழ்ச்சிகள்' : 'Items'}</ThemedText>
                  </View>
                </View>

                {/* Approvals Required */}
                <View style={styles.approvalContainer}>
                  <ThemedText style={styles.approvalHeader}>{language === 'ta' ? 'அனுமதி தேவை' : 'Approvals Required'}</ThemedText>
                  <View style={styles.pendingCard}>
                    <View style={styles.pendingHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="warning" size={12} color="#ea580c" />
                        <ThemedText style={styles.pendingTitle}>{pendingNews.length} {language === 'ta' ? 'காத்திருக்கும் பதிவுகள்' : 'Pending Items'}</ThemedText>
                      </View>
                      <TouchableOpacity style={styles.reviewBtn} onPress={() => setActiveTab('news')}>
                        <ThemedText style={styles.reviewBtnText}>{language === 'ta' ? 'மதிப்பாய்வு செய்' : 'Review'}</ThemedText>
                      </TouchableOpacity>
                    </View>

                    <View>
                      {pendingItemsToShow.length ? pendingItemsToShow.slice(0, 5).map((n: any) => {
                        const title = n.title || n.event_name || n.event_name_tamil || (n.description ? (n.description.length > 40 ? n.description.substring(0, 40) + '...' : n.description) : '');
                        const author = n.created_by_name || n.organizer || n.author || '';
                        const date = n.created_at || n.start_date || n.date || '';
                        const type = (n.type ? String(n.type).toLowerCase() : (n.event_status ? String(n.event_status).toLowerCase() : 'news'));
                        return (
                          <TouchableOpacity key={n.id} style={styles.pendingItem} onPress={() => setActiveTab('news')}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name={type === 'event' ? 'calendar' : 'document-text-outline'} size={16} color="#fb923c" />
                              <ThemedText style={styles.pendingItemTitle}>{title}</ThemedText>
                            </View>
                            <ThemedText style={styles.pendingItemMeta}>{(author ? `${author}` : '')}{date ? ` · ${formatDateDisplay(date)}` : ''}</ThemedText>
                          </TouchableOpacity>
                        );
                      }) : (
                        <ThemedText style={{ color: '#64748b' }}>{language === 'ta' ? 'எதுவும் இல்லை' : 'No pending items'}</ThemedText>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'members' && (
              <View>
                <ThemedText style={{ marginBottom: 8 }}>{language === 'ta' ? 'அனைத்து உறுப்பினர்கள்' : 'All Members'}</ThemedText>

                {/* Search + Filters */}
                <View style={{ marginBottom: 12 }}>
                  <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                      <Ionicons name="search" size={18} color="#94a3b8" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder={language === 'ta' ? 'பெயர் அல்லது மொபைல் எண் தேடுக' : 'Search by name or mobile'}
                        value={searchQuery}
                        onChangeText={(text) => {
                          setSearchQuery(text);
                          // Reset pagination and fetch fresh when search changes
                          setMembersStart(0);
                          setMembersHasMore(true);
                        }}
                        onSubmitEditing={() => fetchMembers(0, false)}
                        placeholderTextColor="#94a3b8"
                      />
                      {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={18} color="#94a3b8" /></TouchableOpacity>
                      ) : null}
                    </View>

                    <TouchableOpacity style={styles.filterBtn} onPress={() => setShowRoleFilter(!showRoleFilter)}>
                      <Ionicons name="filter" size={16} color="#065f46" />
                      <ThemedText style={{ color: '#065f46', marginLeft: 8 }}>{language === 'ta' ? 'வடிகட்டு' : 'Filter'}</ThemedText>
                    </TouchableOpacity>
                  </View>

                  {showRoleFilter && (
                    <View style={styles.roleFilterList}>
                      {roleOptions.map((r) => (
                        <TouchableOpacity key={r.id} style={[styles.roleChip, selectedRole === r.id && styles.roleChipActive]} onPress={() => { setSelectedRole(r.id); setShowRoleFilter(false); }}>
                          <ThemedText style={selectedRole === r.id ? { color: '#065f46', fontWeight: '700' } : { color: '#334155' }}>{language === 'ta' ? (r.ta || r.name) : r.name}</ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Member list */}
                <View>
                  <View style={styles.sectionDivider} />
                  {membersLoading ? (
                    <ActivityIndicator size="small" color="#10b981" />
                  ) : (
                    membersFiltered.map((m: any) => (
                      <View key={m.id || m.mobile_no} style={styles.memberCard}>
                        <View style={styles.memberHeader}>
                          <View>
                            <ThemedText style={styles.memberName}>{m.name}</ThemedText>
                            <ThemedText style={styles.memberPhone}>{m.mobile_no}</ThemedText>
                          </View>

                          {m.verified && <View style={styles.verified}><ThemedText style={{ color: '#fff', fontSize: 12 }}>{language === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Verified'}</ThemedText></View>}
                        </View>

                        <View style={styles.memberRow}>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={styles.infoLabel}>{language === 'ta' ? 'பங்கு' : 'Role'}</ThemedText>
                            <ThemedText style={styles.infoValue}>{language === 'ta' ? (m.role_tamil || m.role) : m.role}</ThemedText>
                          </View>

                          <View style={{ flex: 1 }}>
                            <ThemedText style={styles.infoLabel}>{language === 'ta' ? 'மாவட்டம்' : 'District'}</ThemedText>
                            <ThemedText style={styles.infoValue}>{m.district || '-'}</ThemedText>
                          </View>
                        </View>
                        <View style={styles.memberRow}>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={styles.infoLabel}>{language === 'ta' ? 'உப மாவட்டம்' : 'Sub District'}</ThemedText>
                            <ThemedText style={styles.infoValue}>{m.subdistrict || '-'}</ThemedText>
                          </View>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={styles.infoLabel}>{language === 'ta' ? 'பஞ்சாயத்து' : 'Panchayat'}</ThemedText>
                            <ThemedText style={styles.infoValue}>{m.panchayat || '-'}</ThemedText>
                          </View>
                        </View>
                        <View style={styles.memberRow}>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={styles.infoLabel}>{language === 'ta' ? 'ஆதார் சரிபார்ப்பு' : 'Aadhar Verified'}</ThemedText>
                            <ThemedText style={styles.infoValue}>{m.aadhar_verified === 1 ? (language === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Verified') : (language === 'ta' ? 'காத்திருக்கிறது' : 'Pending')}</ThemedText>
                          </View>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={styles.infoLabel}>{language === 'ta' ? 'சேர்ந்த தேதி' : 'Joined Date'}</ThemedText>
                            <ThemedText style={styles.infoValue}>{formatDateDisplay(m.joined)}</ThemedText>
                          </View>
                        </View>

                        <View style={{ height: 8 }} />
                        <View style={styles.memberFooter}>
                          {(m.role_id === 2 || m.role_id === 15) ? (
                            <TouchableOpacity onPress={() => {
                              console.log('[Modal Open] Opening Give Posting modal for member:', m.id, m.name);
                              setPostingSelectedMember(m);
                              setPostingRoleSelected(16);
                              setPostingRemark('');
                              setShowPostingRoleOptions(false);
                              setLocationOptions([]);
                              setSelectedLocationId(null);
                              setShowLocationDropdown(false);
                              setPostingModalVisible(true);
                            }} style={styles.primaryBtn}><ThemedText style={styles.primaryBtnText}>{language === 'ta' ? 'பொறுப்பு வழங்கு' : 'Give Posting'}</ThemedText></TouchableOpacity>
                          ) : (
                            <TouchableOpacity onPress={() => { setPostingSelectedMember(m); setPostingRoleSelected(m.role_id || 16); setPostingRemark(''); setShowPostingRoleOptions(false); setLocationOptions([]); setSelectedLocationId(null); setShowLocationDropdown(false); setPostingModalVisible(true); }} style={styles.removeBtn}>
                              <ThemedText style={styles.removeBtnText}>{language === 'ta' ? 'பதவியை நீக்கு' : 'Remove Posting'}</ThemedText>
                            </TouchableOpacity>
                          )}

                        </View>
                      </View>
                    ))
                  )}
                  {membersFetchingMore && (
                    <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#10b981" />
                    </View>
                  )}
                </View>
              </View>
            )}

            {postingModalVisible && (
              <Modal visible={postingModalVisible} transparent animationType="fade" onRequestClose={() => { setPostingModalVisible(false); setLocationOptions([]); setSelectedLocationId(null); setShowLocationDropdown(false); }}>
                <Pressable style={styles.modalOverlay} onPress={() => { setPostingModalVisible(false); setLocationOptions([]); setSelectedLocationId(null); setShowLocationDropdown(false); }}>
                  <Pressable style={styles.modalContent} onPress={() => { }}>
                    <View style={styles.modalHeader}>
                      <ThemedText style={styles.modalTitle}>{isPostingRemoval ? (language === 'ta' ? 'பொறுப்பு நீக்கு' : 'Remove Posting') : (language === 'ta' ? 'பொறுப்பு வழங்குக' : 'Give Posting')}</ThemedText>
                      <TouchableOpacity onPress={() => { setPostingModalVisible(false); setLocationOptions([]); setSelectedLocationId(null); setShowLocationDropdown(false); }}><Ionicons name="close" size={18} color="#64748b" /></TouchableOpacity>
                    </View>

                    <ThemedText style={styles.modalMember}>{postingSelectedMember ? `${postingSelectedMember.name} - ${postingSelectedMember.mobile_no}` : ''}</ThemedText>

                    {isPostingRemoval ? (
                      <>
                        <ThemedText style={styles.confirmText}>{language === 'ta' ? `நீங்கள் ${postingSelectedMember ? postingSelectedMember.name : ''} அவர்களின் பொறுப்பை நீக்க விரும்புகிறீர்களா?` : `Are you sure you want to remove the posting of ${postingSelectedMember ? postingSelectedMember.name : ''}?`}</ThemedText>

                        <View style={styles.roleDisplay}>
                          <ThemedText style={styles.roleLabel}>{language === 'ta' ? 'தற்போதைய பங்கு:' : 'Current Role'}</ThemedText>
                          <ThemedText style={styles.roleValue}>{postingSelectedMember ? (language === 'ta' ? (postingSelectedMember.role_tamil || postingSelectedMember.role) : postingSelectedMember.role) : ''}</ThemedText>
                        </View>
                      </>
                    ) : (
                      <>
                        <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'பங்கு' : 'Role'}</ThemedText>
                        <TouchableOpacity style={styles.selectBox} onPress={() => setShowPostingRoleOptions(!showPostingRoleOptions)}>
                          <ThemedText>{language === 'ta' ? (postingRoleOptions.find(r => r.id === postingRoleSelected)?.ta || 'உறுப்பினர்') : (postingRoleOptions.find(r => r.id === postingRoleSelected)?.name || 'Member')}</ThemedText>
                          <Ionicons name="chevron-down" size={18} color="#64748b" />
                        </TouchableOpacity>
                        {showPostingRoleOptions && (
                          <View style={styles.selectOptions}>
                            {postingRoleOptions.map((r) => (
                              <TouchableOpacity key={r.id} style={styles.selectOption} onPress={() => {
                                console.log('[Role Selection] Role selected:', r.id, r.name);
                                setPostingRoleSelected(r.id);
                                setShowPostingRoleOptions(false);
                                console.log('[Role Selection] Calling fetchLocationsForRole with role_id:', r.id);
                                fetchLocationsForRole(r.id);
                              }}>
                                <ThemedText>{language === 'ta' ? r.ta : r.name}</ThemedText>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'பகுதி' : 'Location'}</ThemedText>
                        {locationLoading ? (
                          <View style={styles.selectBox}>
                            <ActivityIndicator size="small" color="#64748b" />
                            <ThemedText style={{ marginLeft: 8, color: '#94a3b8' }}>{language === 'ta' ? 'ஏற்றுகிறது...' : 'Loading...'}</ThemedText>
                          </View>
                        ) : (
                          <>
                            <TouchableOpacity
                              style={styles.selectBox}
                              onPress={() => { setShowLocationDropdown(!showLocationDropdown); setShowPostingRoleOptions(false); setLocationSearch(''); }}
                              disabled={locationOptions.length === 0}
                            >
                              <ThemedText style={locationOptions.length === 0 ? { color: '#94a3b8' } : {}}>
                                {selectedLocationId
                                  ? (() => {
                                    const selectedLoc = locationOptions.find(l => l.id === selectedLocationId);
                                    return selectedLoc ? (language === 'ta' ? (selectedLoc.state_name_tamil || selectedLoc.name) : selectedLoc.name) : (postingRemark || (language === 'ta' ? 'இடத்தைத் தேர்ந்தெடுக்கவும்' : 'Select Location'));
                                  })()
                                  : (locationOptions.length === 0
                                    ? (language === 'ta' ? 'பங்கைத் தேர்ந்தெடுத்த பிறகு இடம் கிடைக்கும்' : 'Select role to load locations')
                                    : (language === 'ta' ? 'இடத்தைத் தேர்ந்தெடுக்கவும்' : 'Select Location'))
                                }
                              </ThemedText>
                              <Ionicons name="chevron-down" size={18} color="#64748b" />
                            </TouchableOpacity>
                            {showLocationDropdown && (
                              <View style={styles.selectOptions}>
                                <TextInput
                                  style={styles.dropdownSearchInput}
                                  placeholder={language === 'ta' ? 'இடத்தைத் தேடுங்கள்...' : 'Search location...'}
                                  value={locationSearch}
                                  onChangeText={setLocationSearch}
                                  autoFocus
                                />
                                <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                                  {locationOptions.filter(location => {
                                    const name = language === 'ta' ? (location.state_name_tamil || location.name) : location.name;
                                    return name.toLowerCase().includes(locationSearch.toLowerCase());
                                  }).map((location) => (
                                    <TouchableOpacity
                                      key={location.id}
                                      style={styles.selectOption}
                                      onPress={() => {
                                        setSelectedLocationId(location.id);
                                        setPostingRemark(language === 'ta' ? (location.state_name_tamil || location.name || '') : (location.name || ''));
                                        setShowLocationDropdown(false);
                                        setLocationSearch('');
                                      }}
                                    >
                                      <ThemedText>{language === 'ta' ? (location.state_name_tamil || location.name) : location.name}</ThemedText>
                                    </TouchableOpacity>
                                  ))}
                                  {locationOptions.filter(l => (language === 'ta' ? (l.state_name_tamil || l.name) : l.name).toLowerCase().includes(locationSearch.toLowerCase())).length === 0 && (
                                    <View style={styles.selectOption}><ThemedText style={{ color: '#94a3b8' }}>{language === 'ta' ? 'முடிவுகள் இல்லை' : 'No results found'}</ThemedText></View>
                                  )}
                                </ScrollView>
                              </View>
                            )}
                          </>
                        )}
                        <ThemedText style={styles.helperText}>{language === 'ta' ? 'பஞ்சாயத்து, உப மாவட்டம், மாவட்டம் அல்லது மண்டலம்' : 'Panchayat, Sub-district, District or Zone'}</ThemedText>
                      </>
                    )}

                    <View style={styles.modalFooter}>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPostingModalVisible(false); setLocationOptions([]); setSelectedLocationId(null); setShowLocationDropdown(false); }} disabled={postingRemovalLoading}><ThemedText style={styles.cancelBtnText}>{language === 'ta' ? 'ரத்து' : 'Cancel'}</ThemedText></TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.giveBtn, isPostingRemoval && styles.removeAction, postingRemovalLoading && styles.giveBtnDisabled]}
                        onPress={async () => {
                          if (isPostingRemoval && postingSelectedMember) {
                            try {
                              setPostingRemovalLoading(true);
                              const userId = postingSelectedMember.raw?.id || postingSelectedMember.id;
                              if (!userId) {
                                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'பயனர் ID கிடைக்கவில்லை' : 'User ID not found');
                                return;
                              }
                              await revokeUserPosting(userId);
                              // Update the member list to reflect the change
                              setMembers(prev => prev.map(m =>
                                (m.id === postingSelectedMember.id || m.raw?.id === userId)
                                  ? { ...m, role_id: 2, role: 'Farmer', role_tamil: 'வேளாளர்' }
                                  : m
                              ));
                              setPostingModalVisible(false);
                              setLocationOptions([]);
                              setSelectedLocationId(null);
                              setShowLocationDropdown(false);
                              Alert.alert(language === 'ta' ? 'வெற்றி' : 'Success', language === 'ta' ? 'பதவி நீக்கப்பட்டது' : 'Posting removed successfully');
                            } catch (error: any) {
                              Alert.alert(language === 'ta' ? 'பிழை' : 'Error', error?.message || (language === 'ta' ? 'பதவி நீக்குவதில் பிழை ஏற்பட்டது' : 'Failed to remove posting'));
                            } finally {
                              setPostingRemovalLoading(false);
                            }
                          } else {
                            // Assign posting
                            if (!postingSelectedMember) {
                              Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'உறுப்பினர் தேர்ந்தெடுக்கப்படவில்லை' : 'Member not selected');
                              return;
                            }

                            try {
                              setPostingRemovalLoading(true);

                              const userId = postingSelectedMember.raw?.id || postingSelectedMember.id;
                              if (!userId) {
                                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'பயனர் ID கிடைக்கவில்லை' : 'User ID not found');
                                return;
                              }

                              // Use the selected role_id directly
                              const roleId = postingRoleSelected;

                              if (!roleId || !postingRoleOptions.find(r => r.id === roleId)) {
                                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'செல்லுபடியாகும் பங்கைத் தேர்ந்தெடுக்கவும்' : 'Please select a valid role');
                                return;
                              }

                              // Get area and area_id from selected location or fallback to member data
                              let area = '';
                              let areaId: number | undefined = undefined;

                              if (selectedLocationId) {
                                const selectedLocation = locationOptions.find(l => l.id === selectedLocationId);
                                if (selectedLocation) {
                                  area = selectedLocation.name || '';
                                  areaId = selectedLocation.area_id !== undefined ? Number(selectedLocation.area_id) : selectedLocationId;
                                }
                              }

                              // Fallback to postingRemark or member data if location not selected
                              if (!area) {
                                area = postingRemark.trim() || postingSelectedMember.district || postingSelectedMember.subdistrict || postingSelectedMember.panchayat || '';
                              }

                              if (!area) {
                                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'பகுதி தேவை' : 'Area is required');
                                return;
                              }

                              // If areaId is not set from location, try to extract from member raw data
                              if (!areaId) {
                                const raw = postingSelectedMember.raw || {};
                                if (raw.area_id !== undefined) {
                                  areaId = Number(raw.area_id);
                                } else if (raw.district_id !== undefined) {
                                  areaId = Number(raw.district_id);
                                } else if (raw.subdistrict_id !== undefined) {
                                  areaId = Number(raw.subdistrict_id);
                                } else if (raw.panchayat_id !== undefined) {
                                  areaId = Number(raw.panchayat_id);
                                } else if (raw.id !== undefined && postingSelectedMember.district) {
                                  areaId = Number(raw.id);
                                }
                              }

                              // Determine level - default to "district", can be enhanced later
                              let level = 'district';
                              const areaLower = area.toLowerCase();
                              if (areaLower.includes('panchayat') || postingSelectedMember.panchayat) {
                                level = 'panchayat';
                              } else if (areaLower.includes('sub') || postingSelectedMember.subdistrict) {
                                level = 'subdistrict';
                              } else if (areaLower.includes('zone')) {
                                level = 'zone';
                              }

                              // If area_id is still not found, default to 0 or show error
                              if (areaId === undefined || isNaN(areaId)) {
                                Alert.alert(language === 'ta' ? 'பிழை' : 'Error', language === 'ta' ? 'பகுதி ID கிடைக்கவில்லை. பயனர் தகவல்களை சரிபார்க்கவும்.' : 'Area ID not found. Please check user information.');
                                return;
                              }

                              await assignUserPosting(userId, roleId, level, area, areaId);

                              // Update the member list to reflect the change
                              const selectedRoleOption = postingRoleOptions.find(r => r.id === roleId);
                              const roleFromMap = ROLE_MAP[roleId];
                              const updatedRoleName = roleFromMap ? (language === 'ta' ? roleFromMap.ta : roleFromMap.en) : (selectedRoleOption ? (language === 'ta' ? selectedRoleOption.ta : selectedRoleOption.name) : 'Member');
                              setMembers(prev => prev.map(m =>
                                (m.id === postingSelectedMember.id || m.raw?.id === userId)
                                  ? { ...m, role_id: roleId, role: selectedRoleOption?.name || roleFromMap?.en || 'Member', role_tamil: selectedRoleOption?.ta || roleFromMap?.ta || 'உறுப்பினர்' }
                                  : m
                              ));

                              setPostingModalVisible(false);
                              setLocationOptions([]);
                              setSelectedLocationId(null);
                              setShowLocationDropdown(false);
                              Alert.alert(language === 'ta' ? 'வெற்றி' : 'Success', language === 'ta' ? 'பதவி வழங்கப்பட்டது' : 'Posting assigned successfully');
                            } catch (error: any) {
                              Alert.alert(language === 'ta' ? 'பிழை' : 'Error', error?.message || (language === 'ta' ? 'பதவி வழங்குவதில் பிழை ஏற்பட்டது' : 'Failed to assign posting'));
                            } finally {
                              setPostingRemovalLoading(false);
                            }
                          }
                        }}
                        disabled={postingRemovalLoading}
                      >
                        {postingRemovalLoading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <ThemedText style={styles.giveBtnText}>{isPostingRemoval ? (language === 'ta' ? 'நீக்கு' : 'Remove') : (language === 'ta' ? 'வழங்கு' : 'Give')}</ThemedText>
                        )}
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                </Pressable>
              </Modal>
            )}

            {createNewsModalVisible && (
              <Modal visible={createNewsModalVisible} transparent animationType="fade" onRequestClose={() => { setCreateNewsModalVisible(false); setShowNewsPreview(false); }}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  style={{ flex: 1 }}
                >
                  <Pressable style={styles.modalOverlay} onPress={() => { setCreateNewsModalVisible(false); setShowNewsPreview(false); }}>
                    <Pressable style={styles.modalContent} onPress={() => { }}>
                      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <View style={styles.modalHeader}>
                          <ThemedText style={styles.modalTitle}>{showNewsPreview ? (language === 'ta' ? 'செய்தி முன்னோட்டம்' : 'News Preview') : (language === 'ta' ? 'புதிய செய்தி உருவாக்கு' : 'Create News')}</ThemedText>
                          <TouchableOpacity onPress={() => { setCreateNewsModalVisible(false); setShowNewsPreview(false); }}><Ionicons name="close" size={18} color="#64748b" /></TouchableOpacity>
                        </View>

                        {showNewsPreview ? (
                          <View>
                            <ThemedText style={styles.previewLabel}>{language === 'ta' ? 'தலைப்பு' : 'Title'}</ThemedText>
                            <ThemedText style={styles.previewTitle}>{createNewsTitle}</ThemedText>

                            {createNewsImage ? (
                              <>
                                <ThemedText style={styles.previewLabel}>{language === 'ta' ? 'படம்' : 'Image'}</ThemedText>
                                <Image source={{ uri: createNewsImage }} style={styles.previewImage} resizeMode="cover" />
                              </>
                            ) : null}

                            <ThemedText style={styles.previewLabel}>{language === 'ta' ? 'உள்ளடக்கம்' : 'Content'}</ThemedText>
                            <ThemedText style={styles.previewContent}>{createNewsContent}</ThemedText>

                            <View style={styles.previewMetaContainer}>
                              <View style={styles.previewMetaItem}>
                                <ThemedText style={styles.previewLabel}>{language === 'ta' ? 'மூலம்' : 'Source'}</ThemedText>
                                <ThemedText style={styles.previewValue}>{createNewsLocation}</ThemedText>
                              </View>
                              <View style={styles.previewMetaItem}>
                                <ThemedText style={styles.previewLabel}>{language === 'ta' ? 'இலக்கு' : 'Target'}</ThemedText>
                                <ThemedText style={styles.previewValue}>{createNewsTargetLevel === 'state' ? (language === 'ta' ? 'மாநிலம்' : 'State') : (language === 'ta' ? 'மாவட்டம்' : 'District')}</ThemedText>
                              </View>
                            </View>
                            <View style={styles.previewMetaItem}>
                              <ThemedText style={styles.previewLabel}>{language === 'ta' ? 'இணைப்பு' : 'Link'}</ThemedText>
                              <ThemedText style={styles.previewValue} selectable>{createNewsLinks}</ThemedText>
                            </View>

                            <View style={styles.modalFooter}>
                              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNewsPreview(false)}>
                                <ThemedText style={styles.cancelBtnText}>{language === 'ta' ? 'திருத்து' : 'Edit'}</ThemedText>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.giveBtn} onPress={() => handleCreateNewsSubmit(true)}>
                                <ThemedText style={styles.giveBtnText}>{language === 'ta' ? 'அங்கீகரித்து சமர்ப்பி' : 'Approve and Submit'}</ThemedText>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <>
                            <ThemedText style={{ color: '#64748b', fontSize: 10 }}>{language === 'ta' ? 'உங்கள் அதிகாரப் பகுதிக்கான உள்ளடக்கத்தை உருவாக்கவும். இது மேல் தலைவர் அனுமதிக்குப் பிறகு வெளியிடப்படும்.' : 'Create content for your jurisdiction. It will be published after approval from your superior leader.'}</ThemedText>

                            <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'தலைப்பு *' : 'Title *'}</ThemedText>
                            <TextInput style={styles.modalInput} value={createNewsTitle} onChangeText={setCreateNewsTitle} placeholder={language === 'ta' ? 'செய்தி தலைப்பு' : 'Enter title'} placeholderTextColor="#94a3b8" />

                            {/* Subtitle removed */}

                            <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'உள்ளடக்கம் *' : 'Content *'}</ThemedText>
                            <TextInput style={styles.modalTextarea} value={createNewsContent} onChangeText={setCreateNewsContent} placeholder={language === 'ta' ? 'முழு செய்தி உள்ளடக்கம்' : 'Content'} placeholderTextColor="#94a3b8" multiline />

                            <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'மூலம் *' : 'Source *'}</ThemedText>
                            <TouchableOpacity style={styles.selectBox} onPress={() => setShowSourceDropdown(!showSourceDropdown)}>
                              <ThemedText style={{ color: createNewsLocation ? '#0f172a' : '#94a3b8' }}>{createNewsLocation || (language === 'ta' ? 'மூலத்தை தேர்வு செய்க' : 'Select Source')}</ThemedText>
                              <Ionicons name="chevron-down" size={16} color="#64748b" />
                            </TouchableOpacity>
                            {showSourceDropdown && (
                              <View style={styles.selectOptions}>
                                {['Facebook', 'Twitter', 'Instagram', 'Quora'].map((src) => (
                                  <TouchableOpacity key={src} style={styles.selectOption} onPress={() => { setCreateNewsLocation(src); setShowSourceDropdown(false); }}>
                                    <ThemedText>{src}</ThemedText>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}

                            <ThemedText style={[styles.fieldLabel, { marginTop: 12 }]}>{language === 'ta' ? 'இணைப்பு *' : 'Link *'}</ThemedText>
                            <TextInput style={styles.modalInput} value={createNewsLinks} onChangeText={setCreateNewsLinks} placeholder="https://example.com" placeholderTextColor="#94a3b8" autoCapitalize="none" keyboardType="url" />

                            <ThemedText style={[styles.fieldLabel, { marginTop: 12 }]}>{language === 'ta' ? 'படம்' : 'Image'}</ThemedText>
                            <TouchableOpacity style={styles.imageUploadBtn} onPress={pickNewsImage}>
                              {createNewsImage ? (
                                <Image source={{ uri: createNewsImage }} style={{ width: '100%', height: 150, borderRadius: 8 }} resizeMode="cover" />
                              ) : (
                                <View style={{ alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                                  <Ionicons name="image-outline" size={32} color="#64748b" />
                                  <ThemedText style={{ color: '#64748b', marginTop: 8 }}>{language === 'ta' ? 'படம் பதிவேற்றவும்' : 'Upload Image'}</ThemedText>
                                </View>
                              )}
                            </TouchableOpacity>
                            {createNewsImage ? (
                              <TouchableOpacity onPress={() => setCreateNewsImage('')} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
                                <ThemedText style={{ color: '#ef4444', fontSize: 12 }}>{language === 'ta' ? 'படத்தை நீக்கு' : 'Remove Image'}</ThemedText>
                              </TouchableOpacity>
                            ) : null}


                            <ThemedText style={[styles.fieldLabel, { marginTop: 12 }]}>{language === 'ta' ? 'இலக்கு நிலை' : 'Target Level'}</ThemedText>
                            <TouchableOpacity style={styles.selectBox} onPress={() => setShowCreateTargetOptions(!showCreateTargetOptions)}>
                              <ThemedText>{language === 'ta' ? (createNewsTargetLevel === 'state' ? 'மாநிலம்' : 'மாவட்டம்') : (createNewsTargetLevel === 'state' ? 'State' : 'District')}</ThemedText>
                              <Ionicons name="chevron-down" size={16} color="#64748b" />
                            </TouchableOpacity>
                            {showCreateTargetOptions && (
                              <View style={styles.selectOptions}>
                                <TouchableOpacity style={styles.selectOption} onPress={() => { setCreateNewsTargetLevel('state'); setShowCreateTargetOptions(false); }}>
                                  <ThemedText>{language === 'ta' ? 'மாநிலம்' : 'State'}</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.selectOption} onPress={() => { setCreateNewsTargetLevel('district'); setShowCreateTargetOptions(false); }}>
                                  <ThemedText>{language === 'ta' ? 'மாவட்டம்' : 'District'}</ThemedText>
                                </TouchableOpacity>
                              </View>
                            )}

                            {!isAdminRole && (
                              <View style={styles.checkboxRow}>
                                <TouchableOpacity onPress={() => setCreateNewsPublishNow(!createNewsPublishNow)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#e6eef3', alignItems: 'center', justifyContent: 'center', backgroundColor: createNewsPublishNow ? '#065f46' : '#fff' }}>
                                    {createNewsPublishNow && <Ionicons name="checkmark" size={14} color="#fff" />}
                                  </View>
                                  <ThemedText style={styles.checkboxLabel}>{language === 'ta' ? 'உண்மை சரிபார்ப்பு செய்யப்பட்டது' : 'Fact Checked'}</ThemedText>
                                </TouchableOpacity>
                              </View>
                            )}

                            {createNewsError ? <ThemedText style={styles.errorText}>{createNewsError}</ThemedText> : null}

                            <View style={styles.modalFooter}>
                              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setCreateNewsModalVisible(false); setShowNewsPreview(false); }}><ThemedText style={styles.cancelBtnText}>{language === 'ta' ? 'ரத்து' : 'Cancel'}</ThemedText></TouchableOpacity>

                              {isAdminRole ? (
                                <TouchableOpacity style={[styles.giveBtn, !canSubmit && styles.giveBtnDisabled]} disabled={!canSubmit} onPress={() => {
                                  if (!createNewsTitle.trim()) { setCreateNewsError(language === 'ta' ? 'தலைப்பு தேவை' : 'Title is required'); return; }
                                  if (!createNewsContent.trim()) { setCreateNewsError(language === 'ta' ? 'உள்ளடக்கம் தேவை' : 'Content is required'); return; }
                                  if (!createNewsLocation.trim()) { setCreateNewsError(language === 'ta' ? 'மூலம் தேவை' : 'Source is required'); return; }
                                  if (!createNewsLinks.trim()) { setCreateNewsError(language === 'ta' ? 'இணைப்புகள் தேவை' : 'Links are required'); return; }
                                  if (!validateLink(createNewsLinks.trim())) { setCreateNewsError(language === 'ta' ? 'சரியான இணைய முகவரியை உள்ளிடவும்' : 'Please enter a valid link URL'); return; }
                                  setCreateNewsError('');
                                  setShowNewsPreview(true);
                                }}>
                                  <ThemedText style={styles.giveBtnText}>{language === 'ta' ? 'முன்னோட்டம்' : 'Preview'}</ThemedText>
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity style={[styles.giveBtn, !canSubmit && styles.giveBtnDisabled]} disabled={!canSubmit} onPress={() => handleCreateNewsSubmit(false)}><ThemedText style={styles.giveBtnText}>{language === 'ta' ? 'அமர்ந்து அனுப்பு' : 'Submit for Approval'}</ThemedText></TouchableOpacity>
                              )}

                            </View>
                          </>
                        )}
                      </ScrollView>
                    </Pressable>
                  </Pressable>
                </KeyboardAvoidingView>
              </Modal>
            )}
            {createEventModalVisible && (
              <Modal visible={createEventModalVisible} transparent animationType="fade" onRequestClose={() => setCreateEventModalVisible(false)}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  style={{ flex: 1 }}
                >
                  <Pressable style={styles.modalOverlay} onPress={() => setCreateEventModalVisible(false)}>
                    <Pressable style={styles.modalContent} onPress={() => { }}>
                      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <View style={styles.modalHeader}>
                          <ThemedText style={styles.modalTitle}>{language === 'ta' ? 'புதிய நிகழ்வு உருவாக்கு' : 'Create New Event'}</ThemedText>
                          <TouchableOpacity onPress={() => setCreateEventModalVisible(false)}><Ionicons name="close" size={18} color="#64748b" /></TouchableOpacity>
                        </View>

                        <ThemedText style={{ color: '#64748b', marginBottom: 12 }}>{language === 'ta' ? 'உங்கள் அதிகாரப் பகுதிக்கான உள்ளடக்கத்தை உருவாக்கவும். இது மேல் தலைவர் அனுமதிக்குப் பிறகு வெளியிடப்படும்.' : 'Create content for your jurisdiction. It will be published after approval from your superior leader.'}</ThemedText>

                        <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'தலைப்பு *' : 'Title *'}</ThemedText>
                        <TextInput style={styles.modalInput} value={createEventTitle} onChangeText={setCreateEventTitle} placeholder={language === 'ta' ? 'தலைப்பு' : 'Event title'} placeholderTextColor="#94a3b8" />

                        <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'விளக்கம் *' : 'Description *'}</ThemedText>
                        <TextInput style={styles.modalTextarea} value={createEventDesc} onChangeText={setCreateEventDesc} placeholder={language === 'ta' ? 'விளக்கம்' : 'Event details'} placeholderTextColor="#94a3b8" multiline />

                        <View style={styles.dateRow}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'தேதி *' : 'Date *'}</ThemedText>
                            <View style={styles.inputWithIcon}>
                              <TextInput style={styles.dateInputInner} value={createEventDate} onChangeText={setCreateEventDate} placeholder={language === 'ta' ? 'dd-mm-yyyy' : 'dd-mm-yyyy'} placeholderTextColor="#94a3b8" />
                              <Ionicons name="calendar-outline" size={18} color="#64748b" style={{ marginLeft: 10 }} />
                            </View>
                          </View>

                          <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fieldLabel}>{language === 'ta' ? 'இடம் *' : 'Location *'}</ThemedText>
                            <View style={styles.inputWithIcon}>
                              <TextInput style={styles.dateInputInner} value={createEventLocation} onChangeText={setCreateEventLocation} placeholder={language === 'ta' ? 'Event location' : 'Event location'} placeholderTextColor="#94a3b8" />
                              <Ionicons name="location-outline" size={18} color="#64748b" style={{ marginLeft: 10 }} />
                            </View>
                          </View>
                        </View>

                        {createEventError ? <ThemedText style={styles.errorText}>{createEventError}</ThemedText> : null}

                        <View style={styles.modalFooter}>
                          <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateEventModalVisible(false)}><ThemedText style={styles.cancelBtnText}>{language === 'ta' ? 'ரத்து' : 'Cancel'}</ThemedText></TouchableOpacity>
                          <TouchableOpacity style={[styles.cancelBtn, (createEventLoading || !createEventTitle.trim() || !createEventDesc.trim() || !createEventDate.trim() || !createEventLocation.trim()) && styles.giveBtnDisabled]} disabled={createEventLoading || !createEventTitle.trim() || !createEventDesc.trim() || !createEventDate.trim() || !createEventLocation.trim()} onPress={() => handleCreateEventSubmit()}>
                            {createEventLoading ? <ActivityIndicator size="small" color="#fff" /> : <ThemedText style={styles.giveBtnText}>{language === 'ta' ? 'சமர்ப்பிக்கவும்' : 'Submit for Approval'}</ThemedText>}
                          </TouchableOpacity>
                        </View>
                      </ScrollView>
                    </Pressable>
                  </Pressable>
                </KeyboardAvoidingView>
              </Modal>
            )}

            {activeTab === 'news' && (
              <View style={styles.newsContainer}>
                <View style={{ marginBottom: 8 }}>
                  <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>{language === 'ta' ? 'செய்திகள் & நிகழ்வுகள்' : 'News & Events'}</ThemedText>

                  <View style={{ flexDirection: 'row', marginTop: 8, justifyContent: 'flex-end' }}>
                    <TouchableOpacity style={styles.ctaOutline} onPress={() => { setCreateNewsModalVisible(true); setCreateNewsType('news'); setCreateNewsTitle(''); setCreateNewsContent(''); setCreateNewsLocation(''); setCreateNewsLinks(''); setCreateNewsImage(''); setCreateNewsPublishNow(false); setCreateNewsError(''); setCreateNewsTargetLevel('state'); setShowCreateTargetOptions(false); setShowNewsPreview(false); }}>
                      <Ionicons name="add" size={14} color="#1e40af" />

                      <ThemedText style={{ color: '#1e40af', marginLeft: 8 }}>{language === 'ta' ? 'செய்தி உருவாக்கு' : 'Create News'}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ctaPrimary} onPress={() => { setCreateEventModalVisible(true); setCreateEventTitle(''); setCreateEventDesc(''); setCreateEventDate(''); setCreateEventLocation(''); setCreateEventError(''); }}>
                      <Ionicons name="calendar" size={14} color="#fff" />
                      <ThemedText style={{ color: '#fff', marginLeft: 8 }}>{language === 'ta' ? 'நிகழ்வு உருவாக்கு' : 'Create Event'}</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Filters & summary row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.selectBox} onPress={() => setNewsTypeFilter(newsTypeFilter === 'all' ? 'news' : 'all')}>
                      <ThemedText style={{ color: '#334155' }}>{language === 'ta' ? 'வகை: ' : 'Category: '}{newsTypeFilter === 'all' ? (language === 'ta' ? 'அனைத்து' : 'All') : newsTypeFilter === 'news' ? (language === 'ta' ? 'செய்தி' : 'News') : (language === 'ta' ? 'நிகழ்வு' : 'Event')}</ThemedText>
                      <Ionicons name="chevron-down" size={16} color="#64748b" />
                    </TouchableOpacity>

                    <View style={{ width: 12 }} />

                    <View>
                      <TouchableOpacity style={styles.selectBox} onPress={() => setShowNewsStatusOptions(!showNewsStatusOptions)}>
                        <ThemedText style={{ color: '#334155' }}>{language === 'ta' ? 'Filter: ' : 'Filter: '}{newsStatusFilter === 'all' ? (language === 'ta' ? 'அனைத்து' : 'All') : newsStatusFilter === 'published' ? (language === 'ta' ? 'வெளியிடப்பட்டது' : 'Published') : (language === 'ta' ? 'ஒப்புதல்\'க்கு காத்திருக்கும்' : 'Pending Approval')}</ThemedText>
                        <Ionicons name="chevron-down" size={16} color="#64748b" />
                        <View style={styles.countBadge}><ThemedText>{newsCounts.all}</ThemedText></View>
                      </TouchableOpacity>

                      {showNewsStatusOptions && (
                        <View style={[styles.selectOptions, styles.newsFilterDropdown]}>
                          <TouchableOpacity style={styles.newsFilterOption} onPress={() => { setNewsStatusFilter('all'); setShowNewsStatusOptions(false); }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                              <ThemedText style={styles.newsFilterOptionLabel}>{language === 'ta' ? 'அனைத்து' : 'All'}</ThemedText>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <ThemedText style={styles.newsFilterOptionCount}>{newsCounts.all}</ThemedText>
                              {newsStatusFilter === 'all' && <Ionicons name="checkmark" size={16} color="#065f46" style={{ marginLeft: 8 }} />}
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.newsFilterOption} onPress={() => { setNewsStatusFilter('published'); setShowNewsStatusOptions(false); }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                              <ThemedText style={styles.newsFilterOptionLabel}>{language === 'ta' ? 'வெளியிடப்பட்டது' : 'Published'}</ThemedText>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <ThemedText style={styles.newsFilterOptionCount}>{newsCounts.published}</ThemedText>
                              {newsStatusFilter === 'published' && <Ionicons name="checkmark" size={16} color="#065f46" style={{ marginLeft: 8 }} />}
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.newsFilterOption} onPress={() => { setNewsStatusFilter('pending'); setShowNewsStatusOptions(false); }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="time-outline" size={16} color="#f59e0b" />
                              <ThemedText style={styles.newsFilterOptionLabel}>{language === 'ta' ? 'ஒப்புதல் காத்திருப்பு' : 'Pending Approval'}</ThemedText>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <ThemedText style={styles.newsFilterOptionCount}>{newsCounts.pending}</ThemedText>
                              {newsStatusFilter === 'pending' && <Ionicons name="checkmark" size={16} color="#065f46" style={{ marginLeft: 8 }} />}
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.newsFilterOption} onPress={() => { setNewsStatusFilter('rejected'); setShowNewsStatusOptions(false); }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="close-circle" size={16} color="#ef4444" />
                              <ThemedText style={styles.newsFilterOptionLabel}>{language === 'ta' ? 'நிராகரிக்கப்பட்டது' : 'Rejected'}</ThemedText>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <ThemedText style={styles.newsFilterOptionCount}>{newsCounts.rejected}</ThemedText>
                              {newsStatusFilter === 'rejected' && <Ionicons name="checkmark" size={16} color="#065f46" style={{ marginLeft: 8 }} />}
                            </View>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>


                </View>

                {/* List */}
                <View>
                  {newsLoading ? (
                    <ActivityIndicator size="small" color="#10b981" />
                  ) : (
                    filteredNews.length ? (
                      filteredNews.map((n) => (
                        <View key={n.id} style={styles.newsCardLarge}>
                          {/* Header: Title with status badge */}
                          <View style={styles.newsCardHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                              <ThemedText style={styles.newsTitle}>{n.title}</ThemedText>
                              <View style={[styles.statusBadgeLight, { marginLeft: 8 }]}>
                                <ThemedText style={styles.statusBadgeTextLight}>
                                  {n.status === 'published' ? (language === 'ta' ? 'வெளியிடப்பட்டது' : 'Published') :
                                    n.status === 'rejected' ? (language === 'ta' ? 'நிராகரிக்கப்பட்டது' : 'Rejected') :
                                      (language === 'ta' ? 'காத்திருப்பு' : 'Pending')}
                                </ThemedText>
                              </View>
                            </View>
                          </View>

                          {/* Source below title */}
                          {n.location && (
                            <View style={{ marginTop: 8, marginBottom: 12 }}>
                              <ThemedText style={styles.sourceText}>
                                {language === 'ta' ? 'மூலம்: ' : 'Source: '}{n.read_moreurl}
                              </ThemedText>
                            </View>
                          )}

                          {/* Content Section */}
                          <ThemedText style={styles.contentHeading}>{language === 'ta' ? 'உள்ளடக்கம்' : 'Content'}</ThemedText>
                          <ThemedText style={styles.newsContent}>{n.content || n.excerpt}</ThemedText>

                          {/* Two-column metadata */}
                          <View style={styles.metadataContainer}>
                            <View style={styles.metadataColumn}>
                              {n.subtitle && (
                                <View style={styles.metadataItem}>
                                  <ThemedText style={styles.metadataLabel}>{language === 'ta' ? 'துணை தலைப்பு' : 'Subheader'}</ThemedText>
                                  <ThemedText style={styles.metadataValue}>{n.subtitle}</ThemedText>
                                </View>
                              )}
                              {n.location && (
                                <View style={styles.metadataItem}>
                                  <ThemedText style={styles.metadataLabel}>{language === 'ta' ? 'பகுதி: ' : 'Area: '}</ThemedText>
                                  <ThemedText style={styles.metadataValue}>{n.location}</ThemedText>
                                </View>
                              )}
                              <View style={styles.metadataItem}>
                                <ThemedText style={styles.metadataLabel}>{language === 'ta' ? 'உருவாக்கியவர்' : 'Created By'}</ThemedText>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                  <Ionicons name="person-outline" size={16} color="#64748b" />
                                  <ThemedText style={[styles.metadataValue, { marginLeft: 6 }]}>{n.author || '—'}</ThemedText>
                                </View>
                              </View>
                              {n.target_level && (
                                <View style={styles.metadataItem}>
                                  <ThemedText style={styles.metadataLabel}>{language === 'ta' ? 'இலக்கு நிலை' : 'Target Level'}</ThemedText>
                                  <ThemedText style={styles.metadataValue}>
                                    {language === 'ta' ?
                                      (n.target_level === 'state' ? 'மாநிலம்' : n.target_level === 'district' ? 'மாவட்டம்' : n.target_level.toUpperCase()) :
                                      (n.target_level === 'state' ? 'State' : n.target_level === 'district' ? 'District' : n.target_level.toUpperCase())}
                                  </ThemedText>
                                </View>
                              )}
                            </View>

                            <View style={styles.metadataColumn}>
                              <View style={styles.metadataItem}>
                                <ThemedText style={styles.metadataLabel}>{language === 'ta' ? 'உண்மை சரிபார்ப்பு' : 'Fact Checked'}</ThemedText>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                  {n.factChecked ? (
                                    <>
                                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                      <ThemedText style={[styles.metadataValue, { marginLeft: 6, color: '#10b981' }]}>Yes</ThemedText>
                                    </>
                                  ) : (
                                    <>
                                      <Ionicons name="close-circle" size={16} color="#ef4444" />
                                      <ThemedText style={[styles.metadataValue, { marginLeft: 6, color: '#ef4444' }]}>No</ThemedText>
                                    </>
                                  )}
                                </View>
                              </View>
                              <View style={styles.metadataItem}>
                                <ThemedText style={styles.metadataLabel}>{language === 'ta' ? 'உருவாக்கப்பட்ட தேதி' : 'Created On'}</ThemedText>
                                <ThemedText style={styles.metadataValue}>{formatDateDisplay(n.published_date || n.date)}</ThemedText>
                              </View>

                            </View>
                          </View>

                          {/* Approve/Reject buttons in separate row */}
                          {n.status === 'pending' && loggedUser && (() => {
                            const createdById = n.raw?.created_by ?? n.raw?.created_by_id ?? null;
                            const createdByIsCurrent = createdById !== null ? (Number(createdById) === Number(loggedUser.id)) : ((n.author && (n.author === (loggedUser.fullname || loggedUser.name))));
                            if (!createdByIsCurrent) {
                              const itemId = n.raw?.id || n.id;
                              return (
                                <View style={styles.approvalButtonRow}>
                                  <TouchableOpacity style={styles.publishBtn} onPress={async () => {
                                    Alert.alert(language === 'ta' ? 'வெளியீடு' : 'Publish', language === 'ta' ? 'இந்த பதிவை வெளியிட வேண்டுமா?' : 'Publish this item?', [
                                      { text: language === 'ta' ? 'ரத்து' : 'Cancel', style: 'cancel' },
                                      {
                                        text: language === 'ta' ? 'வெளியிடு' : 'Publish', onPress: async () => {
                                          try {
                                            await updateEventStatus(itemId, 'Published');
                                            // Update UI on success
                                            setNewsList(prev => prev.map(x => x.id === n.id ? { ...x, status: 'published' } : x));
                                            setStats((prev: any) => ({ ...prev, published: (prev.published || 0) + 1, pending: Math.max(0, (prev.pending || 1) - 1) }));
                                            setDashboardPending(prev => prev.filter((p: any) => String(p.id) !== String(n.raw?.id ?? n.id)));
                                            Alert.alert(language === 'ta' ? 'வெளியிடப்பட்டது' : 'Published', language === 'ta' ? 'பதிவு வெளியிடப்பட்டது' : 'Item published');
                                          } catch (error: any) {
                                            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', error?.message || (language === 'ta' ? 'வெளியீட்டில் பிழை ஏற்பட்டது' : 'Failed to publish item'));
                                          }
                                        }
                                      }
                                    ]);
                                  }}>
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                    <ThemedText style={styles.publishBtnText}>{language === 'ta' ? 'வெளியிடு' : 'Publish'}</ThemedText>
                                  </TouchableOpacity>

                                  <TouchableOpacity style={styles.rejectBtn} onPress={async () => {
                                    Alert.alert(language === 'ta' ? 'நிராகரி' : 'Reject', language === 'ta' ? 'இந்த பதிவை நிராகரிக்க வேண்டுமா?' : 'Reject this item?', [
                                      { text: language === 'ta' ? 'ரத்து' : 'Cancel', style: 'cancel' },
                                      {
                                        text: language === 'ta' ? 'நிராகரி' : 'Reject', onPress: async () => {
                                          try {
                                            await updateEventStatus(itemId, 'Rejected');
                                            // Update UI on success
                                            setNewsList(prev => prev.map(x => x.id === n.id ? { ...x, status: 'rejected' } : x));
                                            setStats((prev: any) => ({ ...prev, pending: Math.max(0, (prev.pending || 1) - 1) }));
                                            setDashboardPending(prev => prev.filter((p: any) => String(p.id) !== String(n.raw?.id ?? n.id)));
                                            Alert.alert(language === 'ta' ? 'நிராகரிக்கப்பட்டது' : 'Rejected', language === 'ta' ? 'பதிவு நிராகரிக்கப்பட்டது' : 'Item rejected');
                                          } catch (error: any) {
                                            Alert.alert(language === 'ta' ? 'பிழை' : 'Error', error?.message || (language === 'ta' ? 'நிராகரிப்பதில் பிழை ஏற்பட்டது' : 'Failed to reject item'));
                                          }
                                        }
                                      }
                                    ]);
                                  }}>
                                    <Ionicons name="close" size={16} color="#ef4444" />
                                    <ThemedText style={styles.rejectBtnText}>{language === 'ta' ? 'நிராகரி' : 'Reject'}</ThemedText>
                                  </TouchableOpacity>
                                </View>
                              );
                            }
                            return null;
                          })()}
                        </View>
                      ))
                    ) : (
                      <View style={styles.infoBox}><ThemedText>{language === 'ta' ? 'எதுவும் இல்லை' : 'No items found.'}</ThemedText></View>
                    )
                  )}
                </View>
              </View>
            )}

          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  topAppBar: { height: 56, backgroundColor: '#0f6b36', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  hamburger: { width: 36, alignItems: 'center', justifyContent: 'center' },
  topAppBarTitle: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  topAppBarLogo: { height: 40, width: 120, maxWidth: 200 },
  headerWrap: { backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 22, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  headerTitle: { fontSize: 22, color: '#fff', fontWeight: '700', marginBottom: 6 },
  headerSubtitle: { color: '#d7fbe6', marginBottom: 6 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#eef2f6', flexWrap: 'nowrap' },
  tabItem: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 8 },
  tabIcon: { marginBottom: 6 },
  tabText: { color: '#64748b', textAlign: 'center', fontSize: 13 },
  tabActive: { backgroundColor: '#ecfdf5', borderBottomWidth: 3, borderBottomColor: '#bbf7d0' },
  tabTextActive: { color: '#065f46', fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 18 },
  bigStatsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  bigStatCard: { flexBasis: '48%', minWidth: 140, backgroundColor: '#fff', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#eef2f6', marginBottom: 12 },
  statLabel: { color: '#64748b', fontSize: 13, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  tilesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  tile: { width: '48%', minWidth: 140, padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  tileTitle: { color: '#2563eb', fontWeight: '700', marginBottom: 8 },
  tileValue: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  tileNote: { color: '#2563eb', marginTop: 8 },
  infoBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#eef2f6' },

  searchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#eef2f6' },
  searchInput: { marginLeft: 8, flex: 1, height: 34 },
  filterBtn: { marginLeft: 12, flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#bbf7d0' },
  roleFilterList: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  roleChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  roleChipActive: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },

  memberCard: { backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eef2f6', marginBottom: 12 },
  memberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberName: { fontWeight: '700', fontSize: 15 },
  memberPhone: { color: '#64748b' },
  verified: { backgroundColor: '#10b981', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  memberRow: { flexDirection: 'row', marginTop: 8 },
  infoLabel: { color: '#94a3b8', fontSize: 12 },
  infoValue: { fontWeight: '700', color: '#0f172a', marginTop: 2 },
  memberFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  primaryBtn: { backgroundColor: '#065f46', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  primaryBtnText: { color: '#ffffff', fontWeight: '700' },
  sectionDivider: { height: 1, backgroundColor: '#e6eef3', marginVertical: 12, borderRadius: 1 },

  /* Modal styles */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', alignItems: 'center', justifyContent: 'center', padding: 12 },
  modalContent: { width: '100%', maxWidth: 520, maxHeight: '90%', backgroundColor: '#fff', borderRadius: 8, padding: 16, elevation: 6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', flex: 1, marginRight: 8 },
  modalMember: { color: '#64748b', marginBottom: 12 },
  fieldLabel: { color: '#64748b', marginBottom: 6, fontSize: 13, fontWeight: '600' },
  selectBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e6eef3', borderRadius: 8, backgroundColor: '#fff' },
  dropdownSearchInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e6eef3',
    fontSize: 16,
  },
  selectOptions: { borderWidth: 1, borderColor: '#e6eef3', borderRadius: 8, marginTop: 4, backgroundColor: '#fff' },
  selectOption: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalInput: { borderWidth: 1, borderColor: '#e6eef3', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', marginTop: 4 },
  modalTextarea: { borderWidth: 1, borderColor: '#e6eef3', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', marginTop: 4, height: 100, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', marginTop: 8 },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6eef3', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 6 },
  dateInputInner: { flex: 1, height: 40 },
  helperText: { color: '#94a3b8', fontSize: 12, marginTop: 6 },
  checkboxRow: { marginTop: 12 },
  checkboxLabel: { marginLeft: 10, color: '#334155', flex: 1 },
  errorText: { color: '#ef4444', marginTop: 8 },
  giveBtnDisabled: { backgroundColor: '#94a3b8' },
  modalFooter: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#f1f5f9' },
  cancelBtnText: { color: '#334155', fontWeight: '600' },
  giveBtn: { backgroundColor: '#065f46', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  giveBtnText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  removeBtn: { borderWidth: 1, borderColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#fff' },
  removeBtnText: { color: '#ef4444', fontWeight: '700' },
  removeAction: { backgroundColor: '#ef4444' },

  confirmText: { color: '#334155', marginBottom: 12 },
  roleDisplay: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e6eef3', padding: 12, borderRadius: 8 },
  roleLabel: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  roleValue: { fontWeight: '700', color: '#0f172a' },

  /* News styles */
  newsChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2f6' },
  newsChipActive: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },

  /* Approvals */
  approvalContainer: { marginTop: 18 },
  approvalHeader: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  pendingCard: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fde8c7', padding: 12, borderRadius: 8 },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  pendingTitle: { marginLeft: 8, fontWeight: '300', fontSize: 12, color: '#ea580c' },
  reviewBtn: { backgroundColor: '#ff7a18', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  reviewBtnText: { color: '#fff', fontWeight: '300', fontSize: 12 },
  pendingItem: { backgroundColor: '#fff', borderRadius: 6, padding: 10, marginBottom: 8 },
  pendingItemTitle: { marginLeft: 10, fontWeight: '700' },
  pendingItemMeta: { color: '#64748b', fontSize: 12, marginTop: 4 },
  newsFilterDropdown: { marginTop: 8, minWidth: 240, borderWidth: 1, borderColor: '#e6eef3', borderRadius: 8, backgroundColor: '#fff', elevation: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 },
  newsFilterOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  newsFilterOptionLabel: { marginLeft: 8, color: '#334155' },
  newsFilterOptionCount: { color: '#64748b', fontWeight: '700', marginLeft: 8 },



  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },

  /* Small approval buttons */
  approvalButtonRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  smallPrimaryBtn: { backgroundColor: '#065f46', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, marginRight: 8 },
  smallPrimaryBtnText: { color: '#fff', fontWeight: '700' },
  smallDangerBtn: { backgroundColor: '#ef4444', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  smallDangerBtnText: { color: '#fff', fontWeight: '700' },
  publishBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e40af', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, gap: 8 },
  publishBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ef4444', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, gap: 8 },
  rejectBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
  metricsRow: { flexDirection: 'row', alignItems: 'center' },
  newsActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btnOutline: { borderWidth: 1, borderColor: '#e6eef3', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#fff' },
  btnPrimary: { backgroundColor: '#065f46', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnDanger: { borderWidth: 1, borderColor: '#fdecea', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#fff' },
  filterActive: { borderColor: '#bbf7d0', backgroundColor: '#ecfdf5' },

  /* status & labels */
  statusBadgeDark: { marginLeft: 10, backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  statusBadgeLight: { backgroundColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeTextLight: { color: '#374151', fontSize: 12, fontWeight: '600' },
  sectionLabel: { color: '#64748b', marginTop: 8, marginBottom: 6, fontSize: 13, fontWeight: '700' },

  /* news card details */
  newsTitle: { fontWeight: '700', fontSize: 18, color: '#0f172a' },
  newsExcerpt: { color: '#64748b', marginTop: 8, marginBottom: 8 },
  newsContent: { color: '#334155', marginTop: 8, marginBottom: 16, lineHeight: 22 },
  sourceText: { color: '#64748b', fontSize: 14 },
  contentHeading: { color: '#0f172a', fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  newsDetailsRow: { flexDirection: 'row', marginTop: 10 },
  detailLabel: { color: '#64748b', fontSize: 12 },
  detailValue: { fontWeight: '700', color: '#0f172a', marginTop: 4 },

  /* Metadata styles */
  metadataContainer: { flexDirection: 'row', marginTop: 16, gap: 16 },
  metadataColumn: { flex: 1 },
  metadataItem: { marginBottom: 12 },
  metadataLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  metadataValue: { color: '#0f172a', fontSize: 14, fontWeight: '600' },

  /* CTAs */
  ctaOutline: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#c7d2fe', marginRight: 8, backgroundColor: '#fff' },
  ctaPrimary: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#10b981', marginLeft: 8 },
  countBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8, alignItems: 'center', justifyContent: 'center' },

  newsContainer: { width: '100%', maxWidth: 980, alignSelf: 'center' },
  searchBoxNews: { maxWidth: 420, alignSelf: 'flex-end' },

  /* Larger card layout */
  newsCardLarge: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2f6', borderRadius: 10, padding: 18, marginBottom: 12 },
  newsCardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  titleMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  imageUploadBtn: { borderWidth: 1, borderColor: '#e6eef3', borderStyle: 'dashed', borderRadius: 8, padding: 4, marginTop: 8, minHeight: 150, justifyContent: 'center', backgroundColor: '#f8fafc' },
  /* Preview styles */
  previewLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' },
  previewTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  previewImage: { width: '100%', height: 180, borderRadius: 8, marginBottom: 12, backgroundColor: '#f1f5f9' },
  previewContent: { fontSize: 15, color: '#334155', lineHeight: 22, marginBottom: 16 },
  previewMetaContainer: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  previewMetaItem: { flex: 1 },
  previewValue: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
});
