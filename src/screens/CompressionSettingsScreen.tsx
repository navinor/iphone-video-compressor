import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  TextInput,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, Radii, Layout, Typography } from '../constants/theme';
import { S } from '../constants/strings';
import { SettingsGroup, SettingRow, ToggleRow } from '../components/SettingRow';
import { useVideoLibrary } from '../hooks/useVideoLibrary';
import { useCompressionJob } from '../hooks/useCompressionJob';
import {
  BUILT_IN_PRESETS,
  getUserPresets,
  DEFAULT_SETTINGS,
  resolveDiscordPreset,
} from '../lib/presets';
import {
  formatFileSize,
  formatDuration,
  formatResolution,
  formatTotalSize,
} from '../utils/format';
import type {
  LibraryStackParamList,
  CompressionSettings as CompressionSettingsType,
  Preset,
} from '../types';

type NavProp = NativeStackNavigationProp<LibraryStackParamList, 'CompressionSettings'>;
type RoutePropType = RouteProp<LibraryStackParamList, 'CompressionSettings'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * Layout.sheetHeightPercent;

const PRESET_CHIPS = [
  ...BUILT_IN_PRESETS.map((p) => ({ id: p.id, name: p.name })),
  { id: 'custom', name: S.presetCustom },
];

export default function CompressionSettingsScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<RoutePropType>();
  const insets = useSafeAreaInsets();
  const { videos } = useVideoLibrary();
  const { startBatch } = useCompressionJob();

  const selectedAssets = useMemo(
    () => videos.filter((v) => params.videoIds.includes(v.id)),
    [videos, params.videoIds],
  );

  const isBatch = params.batch;
  const firstAsset = selectedAssets[0];
  const totalSize = selectedAssets.reduce((acc, v) => acc + v.fileSize, 0);

  const [activePresetId, setActivePresetId] = useState<string>('archive');
  const [settings, setSettings] = useState<CompressionSettingsType>(() => {
    const archivePreset = BUILT_IN_PRESETS.find((p) => p.id === 'archive');
    return archivePreset?.settings ?? DEFAULT_SETTINGS;
  });

  const userPresets = getUserPresets();
  const allChips = [...PRESET_CHIPS, ...userPresets.map((p) => ({ id: p.id, name: p.name }))];

  const selectPreset = useCallback(
    (presetId: string) => {
      setActivePresetId(presetId);

      if (presetId === 'custom') return;

      // Discord presets need dynamic bitrate based on video duration
      if (
        (presetId === 'discord-10mb' || presetId === 'discord-50mb') &&
        firstAsset
      ) {
        setSettings(resolveDiscordPreset(presetId, firstAsset));
        return;
      }

      const allPresets = [...BUILT_IN_PRESETS, ...userPresets];
      const preset = allPresets.find((p) => p.id === presetId);
      if (preset) setSettings(preset.settings);
    },
    [firstAsset, userPresets],
  );

  const updateSetting = <K extends keyof CompressionSettingsType>(
    key: K,
    value: CompressionSettingsType[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setActivePresetId('custom');
  };

  // Estimated output
  const estimatedOutput = useMemo(() => {
    if (!firstAsset) return { size: 0, percent: 0 };
    let ratio = 1;
    if (settings.bitrateMode === 'crf') {
      // Rough estimation: CRF 23 ≈ 50% for H.264, CRF 22 ≈ 40% for H.265
      const baseCRF = settings.codec === 'libx265' ? 28 : 23;
      ratio = Math.max(0.05, Math.min(2, settings.crf / baseCRF));
      if (settings.codec === 'libx265') ratio *= 0.6;
    }
    if (settings.resolution === '1080p' && firstAsset.height > 1080) ratio *= 0.4;
    if (settings.resolution === '720p') ratio *= 0.25;

    const estSize = Math.round(totalSize * ratio);
    const percent = Math.round(((totalSize - estSize) / totalSize) * 100);
    return { size: estSize, percent };
  }, [settings, firstAsset, totalSize]);

  const handleCompress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const presetName =
      allChips.find((c) => c.id === activePresetId)?.name ?? 'Custom';
    startBatch(selectedAssets, settings, presetName);
    navigation.navigate('Progress', { batchJobId: 'current' });
  }, [selectedAssets, settings, activePresetId, allChips, navigation, startBatch]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sheet chrome */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      {/* Top row */}
      <View style={styles.topRow}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>{S.compressCancel}</Text>
        </Pressable>
        <Text style={styles.sheetTitle}>{S.compressTitle}</Text>
        <Pressable>
          <Text style={styles.savePresetButton}>{S.compressSavePreset}</Text>
        </Pressable>
      </View>

      {/* Source metadata */}
      <Text style={styles.sourceMetadata}>
        {isBatch
          ? `${selectedAssets.length} videos selected · ${formatTotalSize(totalSize)} total`
          : firstAsset
            ? `${firstAsset.filename} · ${formatFileSize(firstAsset.fileSize)} · ${formatResolution(firstAsset.width, firstAsset.height)} · ${formatDuration(firstAsset.duration)}`
            : ''}
      </Text>

      {/* Preset chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {allChips.map((chip) => (
          <Pressable
            key={chip.id}
            onPress={() => selectPreset(chip.id)}
            style={[styles.chip, activePresetId === chip.id && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                activePresetId === chip.id && styles.chipTextActive,
              ]}
            >
              {chip.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Group 1: Video */}
        <SettingsGroup>
          <SettingRow
            label={S.settingCodec}
            value={
              settings.codec === 'libx264'
                ? 'H.264'
                : settings.codec === 'libx265'
                  ? 'H.265 (HEVC)'
                  : 'Copy'
            }
            valueColor={settings.codec !== 'libx264' ? Colors.accent : Colors.textPrimary}
          />
          <SettingRow label={S.settingResolution} value={settings.resolution === 'original' ? 'Original' : settings.resolution.toUpperCase()} />
          <SettingRow label={S.settingFrameRate} value={settings.frameRate === 'original' ? 'Original' : `${settings.frameRate} fps`} />
          <SettingRow
            label={S.settingPresetSpeed}
            value={settings.presetSpeed}
            valueColor={
              ['slow', 'slower', 'veryslow'].includes(settings.presetSpeed)
                ? Colors.accent
                : Colors.textPrimary
            }
            isLast
          />
        </SettingsGroup>

        {/* Group 2: Quality */}
        <SettingsGroup>
          {settings.bitrateMode === 'crf' ? (
            <View style={styles.crfRow}>
              <View style={styles.crfHeader}>
                <Text style={styles.crfLabel}>{S.settingQualityCRF}</Text>
                <Text style={styles.crfValue}>{settings.crf}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={51}
                step={1}
                value={settings.crf}
                onValueChange={(v: number) => updateSetting('crf', v)}
                minimumTrackTintColor={Colors.accent}
                maximumTrackTintColor={Colors.sliderTrack}
                thumbTintColor={Colors.textPrimary}
              />
              <View style={styles.crfHints}>
                <Text style={styles.crfHintText}>{S.crfBest}</Text>
                <Text style={styles.crfHintText}>{S.crfWorst}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.bitrateInputRow}>
              <Text style={styles.crfLabel}>Target bitrate (kbps)</Text>
              <TextInput
                style={styles.bitrateInput}
                keyboardType="number-pad"
                value={settings.targetBitrate?.toString() ?? ''}
                onChangeText={(v) =>
                  updateSetting('targetBitrate', parseInt(v, 10) || 0)
                }
                placeholderTextColor={Colors.textTertiary}
                placeholder="e.g. 2000"
              />
            </View>
          )}
          <SettingRow
            label={S.settingBitrateMode}
            value={settings.bitrateMode === 'crf' ? S.bitrateCRF : S.bitrateCBR}
            onPress={() =>
              updateSetting(
                'bitrateMode',
                settings.bitrateMode === 'crf' ? 'cbr' : 'crf',
              )
            }
            isLast
          />
        </SettingsGroup>

        {/* Group 3: Audio */}
        <SettingsGroup>
          <SettingRow
            label={S.settingAudioCodec}
            value={
              settings.audioCodec === 'aac' ? S.audioAAC
                : settings.audioCodec === 'mp3' ? S.audioMP3
                : settings.audioCodec === 'copy' ? S.audioCopy
                : S.audioNone
            }
          />
          <SettingRow
            label={S.settingAudioBitrate}
            value={settings.audioBitrate}
            valueColor={
              settings.audioCodec === 'none' || settings.audioCodec === 'copy'
                ? Colors.textTertiary
                : Colors.textPrimary
            }
            isLast
          />
        </SettingsGroup>

        {/* Group 4: Advanced */}
        <SettingsGroup>
          <SettingRow
            label={S.settingPixelFormat}
            value={settings.pixelFormat === 'yuv420p' ? S.pixelYuv420p : S.pixelYuv444p}
          />
          <ToggleRow
            label={S.settingHardwareAccel}
            value={settings.hardwareAccel}
            onToggle={(v) => updateSetting('hardwareAccel', v)}
          />
          <SettingRow
            label={S.settingExtraFlags}
            value={
              settings.extraFlags.trim()
                ? settings.extraFlags.substring(0, 30)
                : S.none
            }
            valueColor={
              settings.extraFlags.trim() ? Colors.textPrimary : Colors.textTertiary
            }
            isLast
          />
        </SettingsGroup>

        {/* Estimated output card */}
        <View style={styles.estimatedCard}>
          <Text style={styles.estimatedLabel}>{S.compressEstOutput}</Text>
          <View style={styles.estimatedRow}>
            <Text style={styles.estimatedValue}>
              ~{formatFileSize(estimatedOutput.size)}
            </Text>
            <Text
              style={[
                styles.estimatedPercent,
                {
                  color:
                    estimatedOutput.percent >= 0
                      ? Colors.success
                      : Colors.destructive,
                },
              ]}
            >
              ({estimatedOutput.percent >= 0 ? '−' : '+'}
              {Math.abs(estimatedOutput.percent)}%)
            </Text>
          </View>
        </View>

        {/* Compress button */}
        <Pressable style={styles.compressButton} onPress={handleCompress}>
          <Text style={styles.compressButtonText}>
            {isBatch
              ? S.compressBatchButton(selectedAssets.length)
              : S.compressButton}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.sheetBg,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  handle: {
    width: Layout.dragHandleWidth,
    height: Layout.dragHandleHeight,
    borderRadius: 2,
    backgroundColor: Colors.dragHandle,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  cancelButton: {
    fontSize: 15,
    color: Colors.accent,
  },
  sheetTitle: {
    ...Typography.title,
  },
  savePresetButton: {
    fontSize: 15,
    color: Colors.accent,
  },
  sourceMetadata: {
    fontSize: 12,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  chipScroll: {
    maxHeight: 36,
    marginBottom: Spacing.md,
  },
  chipRow: {
    paddingHorizontal: Spacing.base,
    gap: Layout.chipGap,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: Colors.chipInactiveBg,
    borderRadius: Radii.chip,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  chipActive: {
    backgroundColor: Colors.textPrimary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.chipInactiveText,
  },
  chipTextActive: {
    color: Colors.bg0,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  crfRow: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    minHeight: Layout.crfRowHeight,
  },
  crfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crfLabel: {
    fontSize: 13,
    color: Colors.settingLabel,
  },
  crfValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
  },
  slider: {
    marginTop: 8,
    marginHorizontal: -4,
  },
  crfHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  crfHintText: {
    fontSize: 10,
    color: Colors.crfHint,
  },
  bitrateInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 13,
    minHeight: Layout.rowHeight,
  },
  bitrateInput: {
    backgroundColor: Colors.bg3,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: Colors.textPrimary,
    width: 120,
    textAlign: 'right',
  },
  estimatedCard: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    backgroundColor: Colors.estBg,
    borderWidth: 0.5,
    borderColor: Colors.estBorder,
    borderRadius: Radii.card,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  estimatedLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  estimatedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  estimatedValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  estimatedPercent: {
    fontSize: 12,
  },
  compressButton: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    backgroundColor: Colors.accent,
    borderRadius: Radii.card,
    paddingVertical: 13,
    alignItems: 'center',
  },
  compressButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.bg0,
  },
});
