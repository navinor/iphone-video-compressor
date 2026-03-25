// ──────────────────────────── Enums ────────────────────────────

export type VideoCodec = 'libx264' | 'libx265' | 'copy';
export type AudioCodec = 'aac' | 'mp3' | 'copy' | 'none';
export type AudioBitrate = '64k' | '128k' | '192k' | '256k' | 'copy';
export type PixelFormat = 'yuv420p' | 'yuv444p';
export type BitrateMode = 'crf' | 'cbr';
export type GPSApproximationBehavior = 'keep' | 'strip' | 'ask';

export type FFmpegPresetSpeed =
  | 'ultrafast'
  | 'superfast'
  | 'veryfast'
  | 'faster'
  | 'fast'
  | 'medium'
  | 'slow'
  | 'slower'
  | 'veryslow';

export type ResolutionOption =
  | 'original'
  | '4k'
  | '1080p'
  | '720p'
  | '480p'
  | '360p'
  | 'custom';

export type FrameRateOption = 'original' | '60' | '30' | '24' | 'custom';

export type SortMode = 'largest' | 'newest' | 'oldest' | 'longest' | 'smallest';

// ──────────────────────────── Data Models ────────────────────────────

export interface Resolution {
  width: number;
  height: number;
}

export interface CompressionSettings {
  codec: VideoCodec;
  crf: number;
  presetSpeed: FFmpegPresetSpeed;
  resolution: ResolutionOption;
  customResolution?: Resolution;
  bitrateMode: BitrateMode;
  targetBitrate?: number; // kbps, used when bitrateMode === 'cbr'
  audioCodec: AudioCodec;
  audioBitrate: AudioBitrate;
  frameRate: FrameRateOption;
  customFrameRate?: number;
  pixelFormat: PixelFormat;
  hardwareAccel: boolean;
  extraFlags: string;
}

export interface Preset {
  id: string;
  name: string;
  builtIn: boolean;
  settings: CompressionSettings;
}

// ──────────────────────────── Video Asset ────────────────────────────

export interface VideoAsset {
  id: string;
  uri: string;
  filename: string;
  duration: number;       // seconds
  width: number;
  height: number;
  fileSize: number;       // bytes
  creationTime: number;   // unix ms
  modificationTime: number;
  mediaType: string;
  codec?: string;         // from FFprobe, populated lazily
}

// ──────────────────────────── Compression Job ────────────────────────────

export type JobStatus = 'pending' | 'active' | 'done' | 'failed' | 'cancelled';

export interface CompressionJob {
  id: string;
  videoAsset: VideoAsset;
  settings: CompressionSettings;
  status: JobStatus;
  progress: number;           // 0–100
  currentFrame?: number;
  outputUri?: string;
  outputSize?: number;        // bytes
  error?: string;
  ffmpegLogs?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface BatchJob {
  id: string;
  jobs: CompressionJob[];
  presetName?: string;
  startedAt: number;
  completedAt?: number;
}

// ──────────────────────────── History ────────────────────────────

export interface HistoryEntry {
  id: string;
  originalFilename: string;
  originalSize: number;
  outputFilename: string;
  outputSize: number;
  outputUri: string;
  presetName: string;
  reductionPercent: number;
  completedAt: number;
  fileExists: boolean;   // false if user deleted from app storage
}

// ──────────────────────────── Metadata ────────────────────────────

export interface VideoMetadata {
  format: Record<string, string>;
  videoStream: Record<string, string>;
  audioStream: Record<string, string>;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsApproximated?: boolean;
  creationDate?: string;
  deviceModel?: string;
}

// ──────────────────────────── Navigation ────────────────────────────

export type RootTabParamList = {
  LibraryTab: undefined;
  PresetsTab: undefined;
  HistoryTab: undefined;
};

export type LibraryStackParamList = {
  Library: undefined;
  VideoDetail: { videoId: string };
  MetadataDetail: { videoId: string };
  CompressionSettings: { videoIds: string[]; batch: boolean };
  Progress: { batchJobId: string };
  Success: { jobId: string };
};
