import type {
  CompressionSettings,
  Preset,
  VideoAsset,
} from '../types';
import { getJSON, setJSON, StorageKeys } from './storage';

// ──────────────────────────── Default Settings ────────────────────────────

export const DEFAULT_SETTINGS: CompressionSettings = {
  codec: 'libx264',
  crf: 23,
  presetSpeed: 'medium',
  resolution: 'original',
  bitrateMode: 'crf',
  audioCodec: 'aac',
  audioBitrate: '128k',
  frameRate: 'original',
  pixelFormat: 'yuv420p',
  hardwareAccel: false,
  extraFlags: '',
};

// ──────────────────────────── Built-in presets ────────────────────────────

export const BUILT_IN_PRESETS: Preset[] = [
  {
    id: 'discord-10mb',
    name: 'Discord 10MB',
    builtIn: true,
    settings: {
      ...DEFAULT_SETTINGS,
      codec: 'libx264',
      resolution: '720p',
      bitrateMode: 'cbr',
      audioBitrate: '128k',
      presetSpeed: 'medium',
    },
  },
  {
    id: 'discord-50mb',
    name: 'Discord 50MB',
    builtIn: true,
    settings: {
      ...DEFAULT_SETTINGS,
      codec: 'libx264',
      resolution: '1080p',
      bitrateMode: 'cbr',
      audioBitrate: '128k',
      presetSpeed: 'medium',
    },
  },
  {
    id: 'social-media',
    name: 'Social Media',
    builtIn: true,
    settings: {
      ...DEFAULT_SETTINGS,
      codec: 'libx264',
      crf: 23,
      resolution: '1080p',
      frameRate: '30',
      audioBitrate: '128k',
      pixelFormat: 'yuv420p',
    },
  },
  {
    id: 'archive',
    name: 'Archive',
    builtIn: true,
    settings: {
      ...DEFAULT_SETTINGS,
      codec: 'libx265',
      crf: 22,
      resolution: 'original',
      frameRate: 'original',
      audioBitrate: '192k',
      presetSpeed: 'veryslow',
    },
  },
];

// ──────────────────────────── Discord Bitrate Calculation ────────────────────────────

export function calculateDiscordBitrate(
  durationSeconds: number,
  targetSizeMB: number,
  audioBitrateKbps: number = 128,
): { videoBitrate: number; maxRate: number; bufferSize: number } {
  if (durationSeconds <= 0) {
    return { videoBitrate: 0, maxRate: 0, bufferSize: 0 };
  }
  const targetSizeBits = targetSizeMB * 1024 * 1024 * 8;
  const audioBits = audioBitrateKbps * 1000 * durationSeconds;
  const videoBits = targetSizeBits - audioBits;
  const videoBitrate = Math.max(0, Math.floor(videoBits / durationSeconds));

  return {
    videoBitrate,
    maxRate: Math.floor(videoBitrate * 1.5),
    bufferSize: Math.floor(videoBitrate * 2),
  };
}

/**
 * Given a Discord preset ID and a video asset, return the
 * fully resolved settings with dynamic bitrate.
 */
export function resolveDiscordPreset(
  presetId: 'discord-10mb' | 'discord-50mb',
  asset: VideoAsset,
): CompressionSettings {
  const base = BUILT_IN_PRESETS.find((p) => p.id === presetId)!.settings;
  const targetMB = presetId === 'discord-10mb' ? 9.5 : 48;
  const audioBitrateKbps = parseInt(base.audioBitrate, 10) || 128;
  const { videoBitrate, maxRate, bufferSize } = calculateDiscordBitrate(
    asset.duration,
    targetMB,
    audioBitrateKbps,
  );

  return {
    ...base,
    bitrateMode: 'cbr',
    targetBitrate: videoBitrate,
    extraFlags: `-maxrate ${maxRate} -bufsize ${bufferSize}`,
  };
}

// ──────────────────────────── User Presets CRUD ────────────────────────────

export function getUserPresets(): Preset[] {
  return getJSON<Preset[]>(StorageKeys.userPresets) ?? [];
}

export function saveUserPreset(preset: Preset): void {
  const existing = getUserPresets();
  const idx = existing.findIndex((p) => p.id === preset.id);
  if (idx >= 0) {
    existing[idx] = preset;
  } else {
    existing.push(preset);
  }
  setJSON(StorageKeys.userPresets, existing);
}

export function deleteUserPreset(id: string): void {
  const existing = getUserPresets().filter((p) => p.id !== id);
  setJSON(StorageKeys.userPresets, existing);
}

export function duplicateUserPreset(id: string): Preset | undefined {
  const existing = getUserPresets();
  const source = existing.find((p) => p.id === id);
  if (!source) return undefined;
  const copy: Preset = {
    ...source,
    id: `${source.id}-${Date.now()}`,
    name: `${source.name} (copy)`,
    builtIn: false,
  };
  existing.push(copy);
  setJSON(StorageKeys.userPresets, existing);
  return copy;
}

export function reorderUserPresets(ids: string[]): void {
  const existing = getUserPresets();
  const ordered = ids
    .map((id) => existing.find((p) => p.id === id))
    .filter(Boolean) as Preset[];
  setJSON(StorageKeys.userPresets, ordered);
}

// ──────────────────────────── All Presets ────────────────────────────

export function getAllPresets(): Preset[] {
  return [...BUILT_IN_PRESETS, ...getUserPresets()];
}
