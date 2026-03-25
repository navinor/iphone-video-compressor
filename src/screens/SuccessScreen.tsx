import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';

import { Colors, Spacing, Radii, Typography } from '../constants/theme';
import { S } from '../constants/strings';
import { formatFileSize, formatReduction } from '../utils/format';
import { useCompressionJob } from '../hooks/useCompressionJob';
import type { LibraryStackParamList } from '../types';

type RoutePropType = RouteProp<LibraryStackParamList, 'Success'>;

export default function SuccessScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RoutePropType>();
  const insets = useSafeAreaInsets();
  const { batchJob } = useCompressionJob();

  const job = batchJob?.jobs.find((j) => j.id === params.jobId);
  if (!job || job.status !== 'done' || !job.outputUri || !job.outputSize) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Job not found</Text>
      </View>
    );
  }

  const reduction = formatReduction(job.videoAsset.fileSize, job.outputSize);

  const handleShare = async () => {
    if (job.outputUri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(job.outputUri);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Handle + Done */}
      <View style={styles.topRow}>
        <View />
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.doneButton}>{S.batchDone}</Text>
        </Pressable>
      </View>

      {/* Before / After comparison */}
      <View style={styles.comparison}>
        <View style={styles.comparisonCol}>
          <Text style={styles.comparisonLabel}>{S.postBefore}</Text>
          <Text style={styles.comparisonValue}>
            {formatFileSize(job.videoAsset.fileSize)}
          </Text>
          <Text style={styles.comparisonMeta}>
            {job.videoAsset.width}×{job.videoAsset.height}
          </Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.comparisonCol}>
          <Text style={styles.comparisonLabel}>{S.postAfter}</Text>
          <Text
            style={[
              styles.comparisonValue,
              { color: reduction.increased ? Colors.destructive : Colors.success },
            ]}
          >
            {formatFileSize(job.outputSize)}
          </Text>
          <Text style={styles.comparisonMeta}>
            {job.videoAsset.width}×{job.videoAsset.height}
          </Text>
        </View>
      </View>

      {/* Reduction badge */}
      <View
        style={[
          styles.badge,
          {
            backgroundColor: reduction.increased
              ? Colors.destructiveBg
              : Colors.successBg,
          },
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            { color: reduction.increased ? Colors.destructive : Colors.success },
          ]}
        >
          {reduction.increased
            ? S.postIncrease(reduction.percent, reduction.saved)
            : S.postReduction(reduction.percent, reduction.saved)}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{S.postSaveToCameraRoll}</Text>
        </Pressable>
        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>{S.postShare}</Text>
        </Pressable>
      </View>

      {/* Discard */}
      <Pressable style={styles.discardRow}>
        <Text style={styles.discardText}>{S.postDiscard}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.sheetBg,
  },
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  doneButton: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent,
  },
  comparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.base,
    gap: 20,
  },
  comparisonCol: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  comparisonMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: Colors.textTertiary,
  },
  badge: {
    alignSelf: 'center',
    marginTop: Spacing.base,
    borderRadius: Radii.chip,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.base,
    gap: 8,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.card,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.bg0,
  },
  shareButton: {
    borderWidth: 0.5,
    borderColor: Colors.accent,
    borderRadius: Radii.card,
    paddingVertical: 13,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent,
  },
  discardRow: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  discardText: {
    fontSize: 13,
    color: Colors.destructive,
  },
});
