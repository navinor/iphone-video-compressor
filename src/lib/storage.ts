import { createMMKV } from 'react-native-mmkv';

// react-native-mmkv v4 exports createMMKV() factory function.
// v4 ships as a Nitro Module with react-native-nitro-modules as a peer dep.
export const storage = createMMKV({
  id: 'video-compressor-storage',
});

// ── Typed helpers ──

export function getJSON<T>(key: string): T | undefined {
  const raw = storage.getString(key);
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function setJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

// ── Storage keys ──

export const StorageKeys = {
  userPresets: 'user_presets',
  history: 'history',
  videoToolboxAvailable: 'videotoolbox_available',
  gpsApproximationBehavior: 'gps_approximation_behavior',
  lastSortMode: 'last_sort_mode',
} as const;
