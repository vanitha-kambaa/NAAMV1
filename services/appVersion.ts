import { API_CONFIG } from '@/config/api';
import { Platform } from 'react-native';

export type AppVersionResponseItem = {
  id: number;
  versionCode: string;
  versionDate: string;
  isForceUpdate: string;
  updateMessage: string;
  isAppMaintance: string;
  maintanceMessage: string;
  ios_VersionCode: string;
  ios_versionDate: string;
  ios_isForceUpdate: string;
  ios_isAppMaintance: string;
  created_at: string | null;
  updated_at: string | null;
};

export type AppVersionApiResponse = {
  code: number;
  status: boolean;
  message: string;
  response: AppVersionResponseItem[];
};

export type VersionGateState =
  | { type: 'loading' }
  | { type: 'maintenance'; message: string }
  | { type: 'update'; message: string; forceUpdate: boolean }
  | { type: 'ok' };

const APP_VERSION_LIST_URL = `${API_CONFIG.BASE_URL}/appversion/list`;

/**
 * Parse version string into comparable parts (e.g. "1.0.0" -> [1,0,0], "1.0" -> [1,0]).
 */
function parseVersionParts(v: string): number[] {
  return v.split('.').map((s) => parseInt(s, 10) || 0);
}

/**
 * Returns true if currentVersion is strictly less than requiredVersion.
 */
export function isVersionBelow(currentVersion: string, requiredVersion: string): boolean {
  const cur = parseVersionParts(currentVersion);
  const req = parseVersionParts(requiredVersion);
  const len = Math.max(cur.length, req.length);
  for (let i = 0; i < len; i++) {
    const c = cur[i] ?? 0;
    const r = req[i] ?? 0;
    if (c < r) return true;
    if (c > r) return false;
  }
  return false;
}

export async function fetchAppVersionConfig(): Promise<AppVersionResponseItem | null> {
  try {
    const res = await fetch(APP_VERSION_LIST_URL);
    const data: AppVersionApiResponse = await res.json();
    if (data?.status && data?.response?.length) {
      return data.response[0];
    }
    return null;
  } catch {
    return null;
  }
}

export function getVersionGateState(
  item: AppVersionResponseItem,
  currentVersion: string
): VersionGateState {
  const isAndroid = Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';

  if (isAndroid) {
    const isMaintenance = item.isAppMaintance === 'true';
    if (isMaintenance) {
      return { type: 'maintenance', message: item.maintanceMessage || 'App is under maintenance.' };
    }
    const requiredVersion = item.versionCode;
    if (isVersionBelow(currentVersion, requiredVersion)) {
      return {
        type: 'update',
        message: item.updateMessage || 'A new version is available. Please update.',
        forceUpdate: item.isForceUpdate === 'true',
      };
    }
  }

  if (isIOS) {
    const isMaintenance = item.ios_isAppMaintance === 'true';
    if (isMaintenance) {
      return { type: 'maintenance', message: item.maintanceMessage || 'App is under maintenance.' };
    }
    const requiredVersion = item.ios_VersionCode;
    if (requiredVersion && isVersionBelow(currentVersion, requiredVersion)) {
      return {
        type: 'update',
        message: item.updateMessage || 'A new version is available. Please update.',
        forceUpdate: item.ios_isForceUpdate === 'true',
      };
    }
  }

  return { type: 'ok' };
}

const ANDROID_PACKAGE = 'com.naam.farmers';
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
// Replace with your numeric App Store ID when app is published (e.g. '123456789')
const APP_STORE_ID = '000000000';
const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;

export function getStoreUrl(): string {
  return Platform.OS === 'android' ? PLAY_STORE_URL : APP_STORE_URL;
}
