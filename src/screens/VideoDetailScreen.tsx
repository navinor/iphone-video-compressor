import React from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { Colors, Spacing, Radii, Typography } from '../constants/theme';
import { S } from '../constants/strings';
import { useVideoLibrary } from '../hooks/useVideoLibrary';
import { formatFileSize, formatDuration, formatResolution } from '../utils/format';
import type { LibraryStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<LibraryStackParamList, 'VideoDetail'>;
type RoutePropType = RouteProp<LibraryStackParamList, 'VideoDetail'>;

export default function VideoDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<RoutePropType>();
  const insets = useSafeAreaInsets();
  const { videos } = useVideoLibrary();

  const asset = videos.find((v) => v.id === params.videoId);
  if (!asset) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Video not found</Text>
      </View>
    );
  }

  const metadata = [
    { label: 'File size', value: formatFileSize(asset.fileSize) },
    { label: 'Resolution', value: `${asset.width}×${asset.height}` },
    { label: 'Duration', value: formatDuration(asset.duration) },
    { label: 'Codec', value: asset.codec ?? 'Unknown' },
    { label: 'Frame rate', value: 'N/A' },
    { label: 'Created', value: new Date(asset.creationTime).toLocaleDateString() },
    { label: 'GPS', value: 'N/A' },
    { label: 'Device', value: 'N/A' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.backButton}>‹ Videos</Text>
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          {asset.filename.length > 20
            ? asset.filename.substring(0, 20) + '…'
            : asset.filename}
        </Text>
        <Text style={styles.ellipsis}>⋯</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: asset.uri }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </View>

        {/* Metadata grid */}
        <View style={styles.metadataGrid}>
          {Array.from({ length: 4 }, (_, rowIdx) => (
            <View key={rowIdx} style={styles.metadataRow}>
              <View style={styles.metadataCell}>
                <Text style={styles.metadataLabel}>{metadata[rowIdx * 2]?.label}</Text>
                <Text style={styles.metadataValue}>{metadata[rowIdx * 2]?.value}</Text>
              </View>
              <View style={styles.metadataCell}>
                <Text style={styles.metadataLabel}>{metadata[rowIdx * 2 + 1]?.label}</Text>
                <Text style={styles.metadataValue}>{metadata[rowIdx * 2 + 1]?.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* View all metadata */}
        <Pressable
          style={styles.viewAllRow}
          onPress={() => navigation.navigate('MetadataDetail', { videoId: asset.id })}
        >
          <Text style={styles.viewAllText}>{S.detailViewAllMetadata}</Text>
        </Pressable>

        {/* Compress button */}
        <Pressable
          style={styles.compressButton}
          onPress={() =>
            navigation.navigate('CompressionSettings', {
              videoIds: [asset.id],
              batch: false,
            })
          }
        >
          <Text style={styles.compressButtonText}>{S.detailCompress}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    height: 44,
  },
  backButton: {
    fontSize: 17,
    color: Colors.accent,
  },
  navTitle: {
    ...Typography.title,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  ellipsis: {
    fontSize: 22,
    color: Colors.accent,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  thumbnailContainer: {
    aspectRatio: 16 / 9,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    borderRadius: Radii.thumbDetail,
    overflow: 'hidden',
    backgroundColor: Colors.placeholderCell,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.50)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: Colors.textPrimary,
    fontSize: 14,
    marginLeft: 2,
  },
  metadataGrid: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
  },
  metadataRow: {
    flexDirection: 'row',
    height: 40,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.separator,
  },
  metadataCell: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  metadataLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  metadataValue: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  viewAllRow: {
    marginHorizontal: Spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.separator,
  },
  viewAllText: {
    fontSize: 15,
    color: Colors.accent,
  },
  compressButton: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
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
