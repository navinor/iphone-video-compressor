import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActionSheetIOS,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, Radii, Typography, Layout } from '../constants/theme';
import { S } from '../constants/strings';
import { ProgressBar } from '../components/ProgressBar';
import { useCompressionJob } from '../hooks/useCompressionJob';
import { formatFileSize, formatETA, formatReduction } from '../utils/format';
import type { LibraryStackParamList, CompressionJob } from '../types';

type NavProp = NativeStackNavigationProp<LibraryStackParamList, 'Progress'>;

export default function ProgressScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { batchJob, currentJobIndex, cancelBatch } = useCompressionJob();

  const jobs = batchJob?.jobs ?? [];
  const doneJobs = jobs.filter((j) => j.status === 'done');
  const totalSaved = doneJobs.reduce(
    (acc, j) => acc + (j.videoAsset.fileSize - (j.outputSize ?? j.videoAsset.fileSize)),
    0,
  );
  const overallProgress = jobs.length > 0
    ? Math.round((doneJobs.length / jobs.length) * 100)
    : 0;
  const currentJob = jobs[currentJobIndex];
  const isComplete = batchJob?.completedAt !== undefined;

  const handleCancel = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [S.batchContinue, S.batchCancelConfirm],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 0,
      },
      (index) => {
        if (index === 1) {
          cancelBatch();
        }
      },
    );
  };

  const renderJob = ({ item }: { item: CompressionJob }) => {
    const statusBg =
      item.status === 'done' ? Colors.statusDoneBg
      : item.status === 'active' ? Colors.statusActiveBg
      : Colors.statusPendingBg;
    const statusColor =
      item.status === 'done' ? Colors.success
      : item.status === 'active' ? Colors.accent
      : Colors.textTertiary;

    return (
      <View style={styles.jobRow}>
        <View style={[styles.statusDot, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusIcon, { color: statusColor }]}>
            {item.status === 'done' ? '✓' : item.status === 'active' ? '◌' : '·'}
          </Text>
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobFilename} numberOfLines={1}>
            {item.videoAsset.filename}
          </Text>
          <Text style={[styles.jobStatus, { color: statusColor }]}>
            {item.status === 'done' && item.outputSize
              ? (() => {
                  const r = formatReduction(item.videoAsset.fileSize, item.outputSize);
                  return `${formatFileSize(item.videoAsset.fileSize)} → ${formatFileSize(item.outputSize)} (−${r.percent}%)`;
                })()
              : item.status === 'active' ? S.batchCompressing
              : S.batchWaiting}
          </Text>
        </View>
        {item.status === 'done' && item.outputSize ? (
          <Text style={styles.jobOutputSize}>{formatFileSize(item.outputSize)}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Text style={styles.largeTitle}>{S.batchTitle}</Text>
        <Text style={styles.subtitle}>
          {isComplete
            ? `${S.batchDone} · ${Math.round(((batchJob?.completedAt ?? 0) - (batchJob?.startedAt ?? 0)) / 1000 / 60)} min`
            : `${doneJobs.length} of ${jobs.length} done`}
        </Text>
      </View>

      {/* Overall progress card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{S.batchOverallProgress}</Text>
        <ProgressBar
          progress={overallProgress}
          color={isComplete ? Colors.success : Colors.accent}
          showLabel
          labelLeft={`${doneJobs.length} / ${jobs.length} files`}
          labelRight={`${overallProgress}%`}
        />
        <View style={styles.cardMeta}>
          <Text style={styles.savedText}>
            {S.batchSavedSoFar(formatFileSize(Math.max(0, totalSaved)))}
          </Text>
          <Text style={styles.presetText}>
            {S.batchPreset(batchJob?.presetName ?? 'Custom')}
          </Text>
        </View>
      </View>

      {/* Current file card */}
      {!isComplete && currentJob ? (
        <View style={styles.card}>
          <Text style={styles.currentFileLabel}>{S.batchCurrentFile}</Text>
          <Text style={styles.currentFilename} numberOfLines={1}>
            {currentJob.videoAsset.filename}
          </Text>
          <ProgressBar
            progress={currentJob.progress}
            showLabel
            labelLeft={`${currentJob.progress}% · frame ${currentJob.currentFrame ?? 0}`}
            labelRight={formatETA(0)}
          />
        </View>
      ) : null}

      {/* Batch complete card */}
      {isComplete ? (
        <View style={styles.completeCard}>
          <Text style={styles.completeLabel}>{S.batchComplete}</Text>
          <Text style={styles.completeText}>
            {`${doneJobs.length} files compressed · ${formatFileSize(Math.max(0, totalSaved))} saved`}
          </Text>
        </View>
      ) : null}

      {/* File queue */}
      <FlatList
        data={jobs}
        renderItem={renderJob}
        keyExtractor={(item) => item.id}
        style={styles.queue}
        contentContainerStyle={styles.queueContent}
      />

      {/* Bottom actions */}
      {isComplete ? (
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable style={styles.saveAllButton}>
            <Text style={styles.saveAllText}>{S.batchSaveAll}</Text>
          </Pressable>
          <Pressable style={styles.shareAllButton}>
            <Text style={styles.shareAllText}>{S.batchShareAll}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>{S.batchCancelButton}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  navBar: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  largeTitle: {
    ...Typography.largeTitle,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.bg2,
    borderRadius: Radii.card,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    padding: 13,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.settingMeta,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  savedText: {
    fontSize: 11,
    color: Colors.success,
  },
  presetText: {
    fontSize: 11,
    color: Colors.queueMeta,
  },
  currentFileLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  currentFilename: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.settingMeta,
    marginBottom: 8,
  },
  completeCard: {
    backgroundColor: Colors.bg2,
    borderRadius: Radii.card,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    padding: 13,
  },
  completeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
    marginBottom: 4,
  },
  completeText: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  queue: {
    flex: 1,
  },
  queueContent: {
    paddingBottom: 20,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: Spacing.base,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.separator,
  },
  statusDot: {
    width: Layout.statusIndicatorSize,
    height: Layout.statusIndicatorSize,
    borderRadius: Layout.statusIndicatorSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  jobInfo: {
    flex: 1,
  },
  jobFilename: {
    fontSize: 12,
    color: Colors.queueText,
  },
  jobStatus: {
    fontSize: 10,
    marginTop: 1,
  },
  jobOutputSize: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  bottomActions: {
    paddingHorizontal: Spacing.base,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: Colors.destructiveBg,
    borderWidth: 0.5,
    borderColor: Colors.destructiveBorder,
    borderRadius: Radii.card,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.destructive,
  },
  saveAllButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.card,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.bg0,
  },
  shareAllButton: {
    borderWidth: 0.5,
    borderColor: Colors.accent,
    borderRadius: Radii.card,
    paddingVertical: 13,
    alignItems: 'center',
  },
  shareAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent,
  },
});
