import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ActionSheetIOS,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';

import { Colors, Spacing, Radii, Typography } from '../constants/theme';
import { S } from '../constants/strings';
import { getJSON, setJSON, StorageKeys } from '../lib/storage';
import { formatFileSize, formatRelativeDate } from '../utils/format';
import type { HistoryEntry } from '../types';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<HistoryEntry[]>(
    () => getJSON<HistoryEntry[]>(StorageKeys.history) ?? [],
  );

  const refresh = () => setHistory(getJSON<HistoryEntry[]>(StorageKeys.history) ?? []);

  const clearAll = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', S.historyClearAll],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 0,
      },
      (index) => {
        if (index === 1) {
          setJSON(StorageKeys.history, []);
          setHistory([]);
        }
      },
    );
  };

  // Group by date
  const sections = useMemo(() => {
    const groups: Record<string, HistoryEntry[]> = {};
    for (const entry of history) {
      const dateKey = formatRelativeDate(entry.completedAt);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey]!.push(entry);
    }
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [history]);

  const handleShare = async (entry: HistoryEntry) => {
    if (entry.fileExists && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(entry.outputUri);
    }
  };

  const renderEntry = ({ item }: { item: HistoryEntry }) => {
    const isPositive = item.reductionPercent >= 0;

    return (
      <View style={[styles.row, !item.fileExists && styles.rowDisabled]}>
        <View style={styles.thumbnail}>
          {item.fileExists ? (
            <Image
              source={{ uri: item.outputUri }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbnailPlaceholder} />
          )}
        </View>
        <View style={styles.rowInfo}>
          <Text
            style={[
              styles.filename,
              !item.fileExists && styles.filenameDisabled,
            ]}
            numberOfLines={1}
          >
            {item.outputFilename}
          </Text>
          <Text style={styles.rowMeta}>
            {item.fileExists
              ? `${item.presetName} · ${formatFileSize(item.originalSize)} → ${formatFileSize(item.outputSize)}`
              : S.historyFileMoved}
          </Text>
        </View>
        {item.fileExists ? (
          <Text
            style={[
              styles.reduction,
              { color: isPositive ? Colors.success : Colors.destructive },
            ]}
          >
            {isPositive ? '−' : '+'}
            {Math.abs(item.reductionPercent)}%
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Text style={styles.largeTitle}>{S.historyTitle}</Text>
        <Pressable onPress={clearAll} hitSlop={8}>
          <Text style={styles.clearAll}>{S.historyClearAll}</Text>
        </Pressable>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No compression history yet</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          renderItem={({ item: section }) => (
            <View>
              <Text style={styles.sectionHeader}>{section.title}</Text>
              {section.data.map((entry) => (
                <View key={entry.id}>{renderEntry({ item: entry })}</View>
              ))}
            </View>
          )}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.listContent}
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  largeTitle: {
    ...Typography.largeTitle,
  },
  clearAll: {
    fontSize: 15,
    color: Colors.destructive,
  },
  listContent: {
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.separator,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  thumbnail: {
    width: 40,
    height: 28,
    borderRadius: Radii.thumbDetail,
    overflow: 'hidden',
    backgroundColor: Colors.placeholderCell,
  },
  thumbnailImage: {
    width: 40,
    height: 28,
  },
  thumbnailPlaceholder: {
    width: 40,
    height: 28,
    backgroundColor: Colors.bg3,
  },
  rowInfo: {
    flex: 1,
  },
  filename: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  filenameDisabled: {
    color: Colors.textTertiary,
  },
  rowMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  reduction: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textTertiary,
  },
});
