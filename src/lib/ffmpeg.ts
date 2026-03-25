// @ts-nocheck — FFmpegKit fork types are incomplete for the @apescoding variant
import { FFmpegKit, FFmpegKitConfig, FFprobeKit, ReturnCode } from '@apescoding/ffmpeg-kit-react-native';
import { Paths, File } from 'expo-file-system';
import type { CompressionSettings, VideoAsset, VideoMetadata } from '../types';
import { storage, StorageKeys } from './storage';

// ──────────────────────────── Lock file helpers ────────────────────────────

const LOCK_EXT = '.lock';

function writeLockFile(outputPath: string, sessionId: number): void {
  const lockFile = new File(outputPath + LOCK_EXT);
  lockFile.create();
  lockFile.write(JSON.stringify({
    sessionId,
    outputPath,
    startedAt: Date.now(),
  }));
}

function removeLockFile(outputPath: string): void {
  const lockFile = new File(outputPath + LOCK_EXT);
  if (lockFile.exists) {
    lockFile.delete();
  }
}

// ──────────────────────────── Resolution map ────────────────────────────

const RESOLUTION_MAP: Record<string, { width: number; height: number }> = {
  '4k': { width: 3840, height: 2160 },
  '1080p': { width: 1920, height: 1080 },
  '720p': { width: 1280, height: 720 },
  '480p': { width: 854, height: 480 },
  '360p': { width: 640, height: 360 },
};

// ──────────────────────────── VideoToolbox Gate ────────────────────────────

let _videoToolboxChecked = false;

export async function checkVideoToolboxSupport(): Promise<boolean> {
  if (_videoToolboxChecked) {
    return storage.getBoolean(StorageKeys.videoToolboxAvailable) ?? false;
  }

  try {
    const session = await FFmpegKit.execute('-encoders');
    const output = await session.getOutput();
    const available = output?.includes('h264_videotoolbox') ?? false;
    storage.set(StorageKeys.videoToolboxAvailable, available);
    _videoToolboxChecked = true;
    return available;
  } catch {
    storage.set(StorageKeys.videoToolboxAvailable, false);
    _videoToolboxChecked = true;
    return false;
  }
}

// ──────────────────────────── FFmpeg Command Builder ────────────────────────────

export function buildFFmpegArgs(
  inputPath: string,
  outputPath: string,
  settings: CompressionSettings,
  videoToolboxAvailable: boolean,
): string[] {
  const args: string[] = ['-y', '-i', `"${inputPath}"`];

  // Metadata preservation
  args.push('-map_metadata', '0');
  args.push('-map_metadata:s:v', '0:s:v');
  args.push('-map_metadata:s:a', '0:s:a');
  args.push('-movflags', 'use_metadata_tags');

  // Video codec
  if (settings.codec === 'copy') {
    args.push('-c:v', 'copy');
  } else {
    let videoCodec: string = settings.codec;
    if (settings.hardwareAccel && videoToolboxAvailable) {
      videoCodec = settings.codec === 'libx265'
        ? 'hevc_videotoolbox'
        : 'h264_videotoolbox';
    }
    args.push('-c:v', videoCodec);

    // Quality / bitrate
    if (settings.bitrateMode === 'crf' && !settings.hardwareAccel) {
      args.push('-crf', settings.crf.toString());
    } else if (settings.bitrateMode === 'cbr' && settings.targetBitrate) {
      args.push('-b:v', settings.targetBitrate.toString());
    }

    // Preset speed (not applicable to VideoToolbox)
    if (!settings.hardwareAccel) {
      args.push('-preset', settings.presetSpeed);
    }

    // Resolution
    if (settings.resolution !== 'original') {
      const res = settings.resolution === 'custom' && settings.customResolution
        ? settings.customResolution
        : RESOLUTION_MAP[settings.resolution];
      if (res) {
        args.push('-vf', `scale=${res.width}:${res.height}:force_original_aspect_ratio=decrease,pad=${res.width}:${res.height}:(ow-iw)/2:(oh-ih)/2`);
      }
    }

    // Frame rate
    if (settings.frameRate !== 'original') {
      const fps = settings.frameRate === 'custom' && settings.customFrameRate
        ? settings.customFrameRate.toString()
        : settings.frameRate;
      args.push('-r', fps);
    }

    // Pixel format
    args.push('-pix_fmt', settings.pixelFormat);
  }

  // Audio
  if (settings.audioCodec === 'none') {
    args.push('-an');
  } else if (settings.audioCodec === 'copy') {
    args.push('-c:a', 'copy');
  } else {
    args.push('-c:a', settings.audioCodec);
    if (settings.audioBitrate !== 'copy') {
      args.push('-b:a', settings.audioBitrate);
    }
  }

  // Extra flags
  if (settings.extraFlags.trim()) {
    args.push(...settings.extraFlags.trim().split(/\s+/));
  }

  args.push(`"${outputPath}"`);

  return args;
}

// ──────────────────────────── Run Compression ────────────────────────────

export interface CompressionCallbacks {
  onProgress?: (percent: number, frame: number, speed: number) => void;
  onComplete?: (outputUri: string, outputSize: number) => void;
  onError?: (message: string, logs: string) => void;
  onCancel?: () => void;
}

let _activeSessionId: number | null = null;

export async function compressVideo(
  asset: VideoAsset,
  outputPath: string,
  settings: CompressionSettings,
  callbacks: CompressionCallbacks,
): Promise<void> {
  const vtAvailable = await checkVideoToolboxSupport();
  const args = buildFFmpegArgs(asset.uri, outputPath, settings, vtAvailable);
  const command = args.join(' ');

  // Write lock file before starting
  writeLockFile(outputPath, 0);

  // Enable statistics callback for progress
  FFmpegKitConfig.enableStatisticsCallback((stats: any) => {
    if (!callbacks.onProgress) return;
    const time = stats.getTime();
    const frame = stats.getVideoFrameNumber();
    const speed = stats.getSpeed();
    if (asset.duration > 0 && time > 0) {
      const percent = Math.min(100, Math.round((time / 1000 / asset.duration) * 100));
      callbacks.onProgress(percent, frame, speed);
    }
  });

  const session = await FFmpegKit.execute(command);
  const sessionId = session.getSessionId();
  _activeSessionId = sessionId;

  const returnCode = await session.getReturnCode();

  if (ReturnCode.isSuccess(returnCode)) {
    removeLockFile(outputPath);
    const outputFile = new File(outputPath);
    const outputSize = outputFile.size ?? 0;
    callbacks.onComplete?.(outputPath, outputSize);
  } else if (ReturnCode.isCancel(returnCode)) {
    removeLockFile(outputPath);
    // Clean up partial output
    const partialFile = new File(outputPath);
    if (partialFile.exists) {
      partialFile.delete();
    }
    callbacks.onCancel?.();
  } else {
    removeLockFile(outputPath);
    const logs = await session.getAllLogs();
    const logStr = logs.map((l: any) => l.getMessage()).join('\n');
    callbacks.onError?.('Compression failed', logStr);
  }

  _activeSessionId = null;
}

export function cancelActiveSession(): void {
  if (_activeSessionId !== null) {
    FFmpegKit.cancel(_activeSessionId);
  }
}

// ──────────────────────────── FFprobe Metadata ────────────────────────────

export async function getVideoMetadata(inputPath: string): Promise<VideoMetadata> {
  const session = await FFprobeKit.execute(
    `-print_format json -show_format -show_streams "${inputPath}"`,
  );
  const output = await session.getOutput();
  let parsed: Record<string, any> = {};
  try {
    parsed = JSON.parse(output || '{}');
  } catch {
    // Return empty metadata on parse failure
  }

  const streams = (parsed.streams as Array<Record<string, any>>) ?? [];
  const videoStream = streams.find((s) => s.codec_type === 'video') ?? {};
  const audioStream = streams.find((s) => s.codec_type === 'audio') ?? {};

  const formatTags = (parsed.format as Record<string, any>)?.tags as Record<string, string> ?? {};
  const iso6709 = formatTags['com.apple.quicktime.location.ISO6709'] ?? '';
  const parts = iso6709.split(/[+\-]/).filter(Boolean);
  const gpsLat = parts.length > 0 ? parseFloat(parts[0]!) : NaN;
  const gpsLon = parts.length > 1 ? parseFloat(parts[1]!) : NaN;

  return {
    format: flattenToStrings(parsed.format as Record<string, unknown>),
    videoStream: flattenToStrings(videoStream),
    audioStream: flattenToStrings(audioStream),
    gpsLatitude: isNaN(gpsLat) ? undefined : gpsLat,
    gpsLongitude: isNaN(gpsLon) ? undefined : gpsLon,
    creationDate: formatTags['com.apple.quicktime.creationdate'] ?? formatTags['creation_time'],
    deviceModel: formatTags['com.apple.quicktime.model'],
  };
}

function flattenToStrings(obj: Record<string, unknown> | undefined): Record<string, string> {
  if (!obj) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' || typeof value === 'number') {
      result[key] = String(value);
    }
  }
  return result;
}

// ──────────────────────────── Output Path Generator ────────────────────────────

export function generateOutputPath(originalFilename: string): string {
  const ext = '.mp4';
  const base = originalFilename.replace(/\.[^.]+$/, '');
  const ts = Date.now();
  return `${Paths.document.uri}${base}_compressed_${ts}${ext}`;
}
