import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { Colors, Spacing, Radii, Typography } from '../constants/theme';
import { S } from '../constants/strings';
import { SettingsGroup, SettingRow } from '../components/SettingRow';
import { getVideoMetadata } from '../lib/ffmpeg';
import { useVideoLibrary } from '../hooks/useVideoLibrary';
import type { LibraryStackParamList, VideoMetadata } from '../types';

type RoutePropType = RouteProp<LibraryStackParamList, 'MetadataDetail'>;

export default function MetadataDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RoutePropType>();
  const insets = useSafeAreaInsets();
  const { videos } = useVideoLibrary();
  const asset = videos.find((v) => v.id === params.videoId);

  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  const runProbe = async () => {
    if (!asset) return;
    setLoading(true);
    try {
      const md = await getVideoMetadata(asset.uri);
      setMetadata(md);
    } catch {
      // Show empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runProbe();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.backButton}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>{S.detailMetadataTitle}</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* File section */}
        {asset ? (
          <SettingsGroup>
            <SettingRow label="Name" value={asset.filename} showChevron={false} />
            <SettingRow label="Size" value={`${asset.fileSize} bytes`} showChevron={false} />
            <SettingRow
              label="Created"
              value={new Date(asset.creationTime).toLocaleString()}
              showChevron={false}
            />
            <SettingRow
              label="Modified"
              value={new Date(asset.modificationTime).toLocaleString()}
              showChevron={false}
              isLast
            />
          </SettingsGroup>
        ) : null}

        {/* Stream section */}
        {metadata ? (
          <>
            <Text style={styles.sectionHeader}>Video Stream</Text>
            <SettingsGroup>
              {Object.entries(metadata.videoStream).map(([key, value], i, arr) => (
                <SettingRow
                  key={key}
                  label={key}
                  value={value}
                  showChevron={false}
                  isLast={i === arr.length - 1}
                />
              ))}
            </SettingsGroup>

            <Text style={styles.sectionHeader}>Audio Stream</Text>
            <SettingsGroup>
              {Object.entries(metadata.audioStream).map(([key, value], i, arr) => (
                <SettingRow
                  key={key}
                  label={key}
                  value={value}
                  showChevron={false}
                  isLast={i === arr.length - 1}
                />
              ))}
            </SettingsGroup>

            {metadata.gpsLatitude !== undefined && metadata.gpsLongitude !== undefined ? (
              <>
                <Text style={styles.sectionHeader}>Location</Text>
                <SettingsGroup>
                  <SettingRow
                    label="GPS"
                    value={`${metadata.gpsLatitude.toFixed(6)}, ${metadata.gpsLongitude.toFixed(6)}`}
                    showChevron={false}
                    isLast
                  />
                </SettingsGroup>
              </>
            ) : null}
          </>
        ) : null}

        {loading ? (
          <ActivityIndicator style={styles.spinner} color={Colors.accent} />
        ) : null}

        {/* Run FFprobe button */}
        <Pressable style={styles.probeButton} onPress={runProbe}>
          <Text style={styles.probeButtonText}>{S.detailRunFFprobe}</Text>
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    height: 44,
  },
  backButton: {
    fontSize: 24,
    color: Colors.accent,
  },
  navTitle: {
    ...Typography.title,
  },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.base + 4,
    paddingTop: Spacing.base,
    paddingBottom: 6,
  },
  spinner: {
    marginTop: 20,
  },
  probeButton: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    backgroundColor: Colors.bg2,
    borderRadius: Radii.card,
    paddingVertical: 13,
    alignItems: 'center',
  },
  probeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.accent,
  },
});
