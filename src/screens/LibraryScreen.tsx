import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  ActionSheetIOS,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, Layout, Radii, Typography } from '../constants/theme';
import { S } from '../constants/strings';
import { useVideoLibrary } from '../hooks/useVideoLibrary';
import { VideoCard } from '../components/VideoCard';
import type { LibraryStackParamList, SortMode, VideoAsset } from '../types';

type NavProp = NativeStackNavigationProp<LibraryStackParamList>;
const SORT_OPTIONS: SortMode[] = ['largest', 'newest', 'oldest', 'longest', 'smallest'];
const SORT_LABELS: Record<SortMode, string> = {
  largest: S.sortLargest,
  newest: S.sortNewest,
  oldest: S.sortOldest,
  longest: S.sortLongest,
  smallest: S.sortSmallest,
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LibraryScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const [sortMode, setSortMode] = useState<SortMode>('largest');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { videos, loading, totalSizeFormatted } = useVideoLibrary(sortMode);

  // Grid cell sizing
  const cellSize = Math.floor(
    (SCREEN_WIDTH - Layout.gridOuterPadding * 2 - Layout.gridGap * (Layout.gridColumns - 1)) /
      Layout.gridColumns,
  );

  // Featured cell for "largest" sort
  const showFeatured = sortMode === 'largest' && videos.length > 0;

  const toggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [],
  );

  const enterSelectMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectMode(true);
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(videos.map((v) => v.id)));
  }, [videos]);

  const handleCellPress = useCallback(
    (asset: VideoAsset) => {
      if (selectMode) {
        toggleSelect(asset.id);
      } else {
        navigation.navigate('VideoDetail', { videoId: asset.id });
      }
    },
    [selectMode, toggleSelect, navigation],
  );

  const handleCellLongPress = useCallback(
    (asset: VideoAsset) => {
      if (!selectMode) {
        enterSelectMode();
        toggleSelect(asset.id);
      }
    },
    [selectMode, enterSelectMode, toggleSelect],
  );

  const handleCompress = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length > 0) {
      navigation.navigate('CompressionSettings', { videoIds: ids, batch: ids.length > 1 });
    }
  }, [selectedIds, navigation]);

  const showActionSheet = useCallback(() => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Sort by', 'Select All', 'Deselect All'],
        cancelButtonIndex: 0,
      },
      (index) => {
        if (index === 1) {
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options: ['Cancel', ...SORT_OPTIONS.map((s) => SORT_LABELS[s])],
              cancelButtonIndex: 0,
            },
            (sortIndex) => {
              if (sortIndex > 0) {
                setSortMode(SORT_OPTIONS[sortIndex - 1]!);
              }
            },
          );
        } else if (index === 2) {
          setSelectMode(true);
          selectAll();
        } else if (index === 3) {
          exitSelectMode();
        }
      },
    );
  }, [selectAll, exitSelectMode]);

  // Build the grid data: for "largest" sort, skip the first item (it's featured)
  const gridData = useMemo(() => {
    if (showFeatured) return videos.slice(1);
    return videos;
  }, [videos, showFeatured]);

  const renderCell = useCallback(
    ({ item, index }: { item: VideoAsset; index: number }) => {
      const globalIndex = showFeatured ? index + 1 : index;
      const rank = sortMode === 'largest' ? globalIndex + 1 : undefined;

      return (
        <VideoCard
          asset={item}
          size={cellSize}
          selected={selectedIds.has(item.id)}
          selectMode={selectMode}
          rank={rank}
          onPress={() => handleCellPress(item)}
          onLongPress={() => handleCellLongPress(item)}
        />
      );
    },
    [cellSize, selectedIds, selectMode, sortMode, showFeatured, handleCellPress, handleCellLongPress],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <View style={styles.navTitleRow}>
          <Text style={styles.largeTitle}>
            {selectMode ? S.librarySelected(selectedIds.size) : S.libraryTitle}
          </Text>
          <View style={styles.navActions}>
            <Pressable
              onPress={selectMode ? exitSelectMode : enterSelectMode}
              hitSlop={8}
            >
              <Text style={styles.navButton}>
                {selectMode ? S.libraryDone : S.librarySelect}
              </Text>
            </Pressable>
            <Pressable onPress={showActionSheet} hitSlop={8}>
              <Text style={styles.ellipsis}>⋯</Text>
            </Pressable>
          </View>
        </View>

        {/* Metadata subtitle */}
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle}>
            {S.libraryMeta(videos.length, totalSizeFormatted)}
          </Text>
          {!selectMode ? (
            <Pressable onPress={() => { enterSelectMode(); selectAll(); }}>
              <Text style={styles.batchCompress}>{S.libraryBatchCompress}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Sort Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {SORT_OPTIONS.map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setSortMode(mode)}
            style={[styles.chip, sortMode === mode && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                sortMode === mode && styles.chipTextActive,
              ]}
            >
              {SORT_LABELS[mode]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Empty state */}
      {!loading && videos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{S.libraryNoVideosTitle}</Text>
          <Text style={styles.emptySub}>{S.libraryNoVideosSub}</Text>
        </View>
      ) : null}

      {/* Featured cell + Grid */}
      <FlatList
        data={gridData}
        renderItem={renderCell}
        keyExtractor={(item) => item.id}
        numColumns={Layout.gridColumns}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        ListHeaderComponent={
          showFeatured && videos[0] ? (
            <Pressable
              onPress={() => handleCellPress(videos[0]!)}
              onLongPress={() => handleCellLongPress(videos[0]!)}
            >
              <VideoCard
                asset={videos[0]!}
                size={cellSize * 2 + Layout.gridGap}
                selected={selectedIds.has(videos[0]!.id)}
                selectMode={selectMode}
                rank={1}
              />
            </Pressable>
          ) : null
        }
      />

      {/* Selection action bar */}
      {selectMode ? (
        <View style={[styles.selectionBar, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable onPress={selectAll}>
            <Text style={styles.navButton}>{S.librarySelectAll}</Text>
          </Pressable>
          <Pressable
            onPress={handleCompress}
            disabled={selectedIds.size === 0}
            style={[
              styles.compressButton,
              selectedIds.size === 0 && styles.compressButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.compressButtonText,
                selectedIds.size === 0 && styles.compressButtonTextDisabled,
              ]}
            >
              {S.libraryCompress(selectedIds.size)}
            </Text>
          </Pressable>
        </View>
      ) : null}
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
  navTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  largeTitle: {
    ...Typography.largeTitle,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navButton: {
    fontSize: 15,
    color: Colors.accent,
  },
  ellipsis: {
    fontSize: 22,
    color: Colors.accent,
  },
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  batchCompress: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.accent,
  },
  chipScroll: {
    maxHeight: 36,
  },
  chipRow: {
    paddingLeft: Spacing.base,
    gap: Layout.chipGap,
    paddingRight: Spacing.base,
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
  gridContent: {
    paddingHorizontal: Layout.gridOuterPadding,
    paddingTop: Spacing.sm,
    paddingBottom: 120,
  },
  gridRow: {
    gap: Layout.gridGap,
    marginBottom: Layout.gridGap,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  selectionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Layout.selectionBarHeight,
    backgroundColor: Colors.selectionBarBg,
    borderTopWidth: 0.5,
    borderTopColor: Colors.separator,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
  },
  compressButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.card,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  compressButtonDisabled: {
    backgroundColor: Colors.accentDisabled,
  },
  compressButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.bg0,
  },
  compressButtonTextDisabled: {
    color: Colors.textSecondary,
  },
});
