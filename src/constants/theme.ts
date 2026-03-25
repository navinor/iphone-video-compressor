// Design tokens from the UI System Prompt.
// All values are literal to match the spec exactly.

import { StyleSheet } from 'react-native';

// ──────────────────────────── Colors ────────────────────────────

export const Colors = {
  // Background layers (dark mode)
  bg0: '#000000',
  bg1: '#111111',
  bg2: '#1C1C1E',
  bg3: '#2C2C2E',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textTertiary: '#555555',
  accent: '#4DA6FF',
  success: '#34C759',
  destructive: '#E85D5D',

  // Functional
  placeholderCell: '#1A1A1A',
  chipInactiveBg: 'rgba(255,255,255,0.10)',
  chipInactiveText: '#AAAAAA',
  separator: 'rgba(255,255,255,0.08)',
  cardBorder: 'rgba(255,255,255,0.10)',
  accentBorder: 'rgba(77,166,255,0.25)',
  rowSeparator: 'rgba(255,255,255,0.06)',
  selectionBarBg: 'rgba(17,17,17,0.98)',
  tabBarBg: 'rgba(0,0,0,0.95)',
  dragHandle: 'rgba(255,255,255,0.20)',
  sheetBg: '#1A1A1A',

  // Badges & overlays
  badgeBg: 'rgba(0,0,0,0.50)',
  gradientEnd: 'rgba(0,0,0,0.60)',
  fileSizeText: 'rgba(255,255,255,0.70)',

  // Estimated output
  estBg: 'rgba(77,166,255,0.07)',
  estBorder: 'rgba(77,166,255,0.20)',

  // Destructive
  destructiveBg: 'rgba(232,93,93,0.12)',
  destructiveBorder: 'rgba(232,93,93,0.25)',

  // Success
  successBg: 'rgba(52,199,89,0.12)',

  // Status indicators
  statusDoneBg: 'rgba(52,199,89,0.20)',
  statusActiveBg: 'rgba(77,166,255,0.20)',
  statusPendingBg: 'rgba(255,255,255,0.06)',

  // Thermal
  thermalBg: 'rgba(255,200,0,0.08)',
  thermalText: '#FFD60A',

  // Disabled button
  accentDisabled: 'rgba(77,166,255,0.25)',

  // Slider
  sliderTrack: 'rgba(255,255,255,0.12)',

  // Preset icons
  presetPurple: '#7B61FF',
  presetPink: '#FF6B8A',
  presetTeal: '#2AC3B3',

  // Queue text
  queueText: '#CCCCCC',
  queueMeta: '#666666',
  crfHint: '#444444',
  settingLabel: '#CCCCCC',
  settingMeta: '#E5E5E5',
} as const;

// ──────────────────────────── Typography ────────────────────────────

export const Typography = StyleSheet.create({
  largeTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
    color: Colors.textPrimary,
  },
  title: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
  },
  subhead: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
  },
  caption2: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.textPrimary,
  },
});

// ──────────────────────────── Radii ────────────────────────────

export const Radii = {
  sheet: 20,
  card: 12,
  chip: 20,
  badge: 4,
  thumbGrid: 4,
  thumbDetail: 8,
} as const;

// ──────────────────────────── Spacing ────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
} as const;

// ──────────────────────────── Layout ────────────────────────────

export const Layout = {
  minTapTarget: 44,
  gridGap: 2,
  gridColumns: 3,
  gridOuterPadding: 2,
  chipGap: 6,
  separatorWidth: 0.5,
  rowHeight: 44,
  crfRowHeight: 64,
  selectionBarHeight: 64,
  dragHandleWidth: 36,
  dragHandleHeight: 4,
  sheetHeightPercent: 0.92,
  postSheetHeightPercent: 0.60,
  checkboxSize: 18,
  statusIndicatorSize: 20,
  presetIconSize: 24,
  presetCircleSize: 36,
  sliderTrackHeight: 4,
  sliderThumbSize: 18,
  progressBarHeight: 6,
} as const;
