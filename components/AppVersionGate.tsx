import {
  fetchAppVersionConfig,
  getVersionGateState,
  getStoreUrl,
  type VersionGateState,
} from '@/services/appVersion';
import Constants from 'expo-constants';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { ThemedText } from './themed-text';

export function AppVersionGate() {
  const [state, setState] = useState<VersionGateState>({ type: 'loading' });
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const checkVersion = useCallback(async () => {
    if (Platform.OS === 'web') {
      setState({ type: 'ok' });
      return;
    }
    const currentVersion = Constants.expoConfig?.version ?? Constants.manifest?.version ?? '1.0.0';
    const item = await fetchAppVersionConfig();
    if (!item) {
      setState({ type: 'ok' });
      return;
    }
    const gateState = getVersionGateState(item, currentVersion);
    setState(gateState);
  }, []);

  useEffect(() => {
    checkVersion();
  }, [checkVersion]);

  const handleUpdate = useCallback(() => {
    Linking.openURL(getStoreUrl());
  }, []);

  if (state.type === 'loading' || state.type === 'ok') {
    return null;
  }

  if (state.type === 'maintenance') {
    return (
      <View
        style={[
          styles.overlay,
          { backgroundColor: isDark ? '#0f172a' : '#ecfdf5' },
        ]}
      >
        <View style={[styles.box, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <ThemedText style={styles.title}>Maintenance</ThemedText>
          <ThemedText style={styles.message}>{state.message}</ThemedText>
        </View>
      </View>
    );
  }

  if (state.type === 'update') {
    return (
      <Modal visible transparent animationType="fade" statusBarTranslucent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.updateBox, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <ThemedText style={styles.title}>Update Available</ThemedText>
            <ThemedText style={styles.message}>{state.message}</ThemedText>
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} activeOpacity={0.8}>
              <ThemedText style={styles.updateButtonText}>Update</ThemedText>
            </TouchableOpacity>
            {!state.forceUpdate && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => setState({ type: 'ok' })}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.skipButtonText}>Skip</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 24,
  },
  box: {
    maxWidth: 400,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  updateBox: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  updateButton: {
    marginTop: 20,
    backgroundColor: '#0bb24c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#0bb24c',
    fontWeight: '600',
    fontSize: 15,
  },
});
