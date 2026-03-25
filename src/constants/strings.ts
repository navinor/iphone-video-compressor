// Centralized string definitions for the Video Compressor app.

export const S = {
  // App-wide
  appName: 'Video Compressor',

  // Tab Bar
  tabLibrary: 'Library',
  tabPresets: 'Presets',
  tabHistory: 'History',

  // Library Screen
  libraryTitle: 'Videos',
  libraryMeta: (count: number, size: string) => `${count} videos · ${size}`,
  librarySelect: 'Select',
  libraryDone: 'Done',
  librarySelectAll: 'Select All',
  libraryDeselectAll: 'Deselect All',
  libraryBatchCompress: 'Batch compress',
  librarySearchVideos: 'Search videos',
  libraryNoVideosTitle: 'No videos found',
  libraryNoVideosSub: 'Videos from your Camera Roll appear here.',
  librarySelected: (n: number) => `${n} Selected`,
  libraryCompress: (n: number) => `Compress ${n}`,

  // Sort chips
  sortLargest: 'Largest',
  sortNewest: 'Newest',
  sortOldest: 'Oldest',
  sortLongest: 'Longest',
  sortSmallest: 'Smallest',

  // Video Detail
  detailViewAllMetadata: 'View all metadata',
  detailCompress: 'Compress',
  detailMetadataTitle: 'Metadata',
  detailRunFFprobe: 'Run FFprobe',

  // Compression Settings
  compressTitle: 'Compress',
  compressCancel: 'Cancel',
  compressSavePreset: 'Save preset',
  compressButton: 'Compress video',
  compressBatchButton: (n: number) => `Compress ${n} videos`,
  compressEstOutput: 'Estimated output',
  compressEstTime: (min: number) => `~${min} min encode on this device`,

  // Settings Groups
  groupVideo: 'Video',
  groupQuality: 'Quality',
  groupAudio: 'Audio',
  groupAdvanced: 'Advanced',

  // Video Settings
  settingCodec: 'Codec',
  settingResolution: 'Resolution',
  settingFrameRate: 'Frame rate',
  settingPresetSpeed: 'Preset speed',
  settingQualityCRF: 'Quality (CRF)',
  settingBitrateMode: 'Bitrate mode',
  settingAudioCodec: 'Audio codec',
  settingAudioBitrate: 'Audio bitrate',
  settingPixelFormat: 'Pixel format',
  settingHardwareAccel: 'VideoToolbox',
  settingExtraFlags: 'Extra FFmpeg flags',

  // CRF slider
  crfBest: '0  best quality',
  crfWorst: '51  worst quality',

  // Bitrate modes
  bitrateCRF: 'CRF (default)',
  bitrateCBR: 'CBR — enter target bitrate',

  // Audio codec options
  audioAAC: 'AAC (default)',
  audioMP3: 'MP3',
  audioCopy: 'Copy',
  audioNone: 'None',

  // Pixel format options
  pixelYuv420p: 'yuv420p (default)',
  pixelYuv444p: 'yuv444p',

  // Codec descriptions
  codecH264: 'H.264 (libx264)',
  codecH264Desc: 'Widest compatibility, larger files',
  codecH265: 'H.265 / HEVC (libx265)',
  codecH265Desc: 'Smaller files, slower encode',
  codecCopy: 'Copy (passthrough)',
  codecCopyDesc: 'No re-encode, changes container only',

  // Preset speed descriptions
  speedUltrafast: 'ultrafast — fastest encode, largest file',
  speedVeryslow: 'veryslow — smallest file, longest encode time',

  // Presets
  presetDiscord10: 'Discord 10MB',
  presetDiscord50: 'Discord 50MB',
  presetSocial: 'Social Media',
  presetArchive: 'Archive',
  presetCustom: 'Custom',
  presetsBuiltIn: 'Built-in',
  presetsMyPresets: 'My Presets',
  presetsEdit: 'Edit',
  presetsUseThis: 'Use this preset',
  presetsDeletePreset: 'Delete Preset',
  presetsNoSaved: 'No saved presets',
  presetsNoSavedSub: 'Tap + to create one',

  // Batch Progress
  batchTitle: 'Batch',
  batchOverallProgress: 'Overall progress',
  batchCurrentFile: 'Current file',
  batchCompressing: 'compressing...',
  batchWaiting: 'waiting',
  batchDone: 'Done',
  batchComplete: 'Batch complete',
  batchCancelButton: 'Cancel batch',
  batchCancelConfirm: 'Cancel Batch',
  batchContinue: 'Continue',
  batchSaveAll: 'Save all to Camera Roll',
  batchShareAll: 'Share all',
  batchSavedSoFar: (gb: string) => `Saved so far: ${gb}`,
  batchPreset: (name: string) => `Preset: ${name}`,

  // Post-Compression
  postBefore: 'Before',
  postAfter: 'After',
  postSaveToCameraRoll: 'Save to Camera Roll',
  postShare: 'Share...',
  postDiscard: 'Discard compressed file',
  postDiscardConfirm: 'This cannot be undone.',
  postReduction: (pct: number, mb: string) => `−${pct}% · saved ${mb}`,
  postIncrease: (pct: number, mb: string) => `+${pct}% · ${mb} larger`,

  // History
  historyTitle: 'History',
  historyClearAll: 'Clear All',
  historyFileMoved: 'File moved',
  historyToday: 'Today',
  historyYesterday: 'Yesterday',

  // Thermal warning
  thermalWarning: 'Device is warm — encoding has slowed.',

  // GPS Settings
  gpsKeepApproximate: 'Keep approximate',
  gpsStrip: 'Strip',
  gpsAskMe: 'Ask me',

  // Misc
  none: 'none',
  on: 'on',
  off: 'off',
} as const;
