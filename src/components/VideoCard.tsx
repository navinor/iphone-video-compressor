import React, { memo } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Colors, Radii, Typography } from '../constants/theme';
import { formatDuration, formatFileSize, formatResolution } from '../utils/format';
import type { VideoAsset } from '../types';

interface VideoCardProps {
  asset: VideoAsset;
  size: number; // cell width/height in pixels
  selected?: boolean;
  selectMode?: boolean;
  rank?: number; // 1-3 for top 3 largest, undefined otherwise
  onPress?: () => void;
  onLongPress?: () => void;
}

function VideoCardComponent({
  asset,
  size,
  selected = false,
  selectMode = false,
  rank,
  onPress,
  onLongPress,
}: VideoCardProps) {
  const badge = getBadgeLabel(asset);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.container,
        { width: size, height: size },
        selected && styles.selectedBorder,
      ]}
    >
      {/* Thumbnail */}
      <Image
        source={{ uri: asset.uri }}
        style={styles.thumbnail}
        resizeMode="cover"
      />

      {/* Gradient overlay */}
      <View style={styles.gradient} />

      {/* Duration (bottom-left) */}
      <Text style={styles.duration}>{formatDuration(asset.duration)}</Text>

      {/* File size (bottom-right) */}
      <Text style={styles.fileSize}>{formatFileSize(asset.fileSize)}</Text>

      {/* Badge (top-right) */}
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}

      {/* Size rank dot (top-left) */}
      {rank !== undefined && rank <= 3 ? (
        <View style={styles.rankDot} />
      ) : null}

      {/* Selection checkbox (top-left, shown in select mode) */}
      {selectMode ? (
        <View
          style={[
            styles.checkbox,
            selected && styles.checkboxSelected,
          ]}
        >
          {selected ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

export const VideoCard = memo(VideoCardComponent);

function getBadgeLabel(asset: VideoAsset): string | null {
  if (asset.height >= 2160 || asset.width >= 3840) return '4K';
  if (asset.codec?.toLowerCase().includes('hevc') || asset.codec?.toLowerCase().includes('h265'))
    return 'HEVC';
  return null;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: Colors.placeholderCell,
    borderRadius: Radii.thumbGrid,
    overflow: 'hidden',
  },
  selectedBorder: {
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'transparent',
    // RN doesn't support CSS gradients natively, using a semi-transparent overlay
    // In production this would use expo-linear-gradient
    opacity: 1,
  },
  duration: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  fileSize: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    fontSize: 10,
    fontWeight: '500',
    color: Colors.fileSizeText,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.badgeBg,
    borderRadius: Radii.badge,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  rankDot: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.destructive,
  },
  checkbox: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkmark: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: -1,
  },
});
