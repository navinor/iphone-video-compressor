import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, Radii, Typography, Layout } from '../constants/theme';
import { S } from '../constants/strings';
import { SettingsGroup, SettingRow } from '../components/SettingRow';
import {
  BUILT_IN_PRESETS,
  getUserPresets,
  deleteUserPreset,
  duplicateUserPreset,
} from '../lib/presets';
import type { Preset } from '../types';

const PRESET_ICON_COLORS: Record<string, string> = {
  'discord-10mb': Colors.presetPurple,
  'discord-50mb': Colors.presetPurple,
  'social-media': Colors.presetPink,
  'archive': Colors.presetTeal,
};

export default function PresetsScreen() {
  const insets = useSafeAreaInsets();
  const [userPresets, setUserPresets] = useState<Preset[]>(getUserPresets());
  const [editMode, setEditMode] = useState(false);

  const refreshUserPresets = () => setUserPresets(getUserPresets());

  const handleDeletePreset = (id: string) => {
    Alert.alert(S.presetsDeletePreset, 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteUserPreset(id);
          refreshUserPresets();
        },
      },
    ]);
  };

  const handleDuplicate = (id: string) => {
    duplicateUserPreset(id);
    refreshUserPresets();
  };

  const renderBuiltInPreset = (preset: Preset) => {
    const iconColor = PRESET_ICON_COLORS[preset.id] ?? Colors.accent;
    const summary = `${preset.settings.codec === 'libx265' ? 'H.265' : 'H.264'} · CRF ${preset.settings.crf} · ${preset.settings.resolution}`;

    return (
      <View key={preset.id} style={styles.presetRow}>
        <View style={[styles.presetIcon, { backgroundColor: iconColor }]}>
          <Text style={styles.presetIconText}>
            {preset.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.presetInfo}>
          <Text style={styles.presetName}>{preset.name}</Text>
          <Text style={styles.presetSummary}>{summary}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    );
  };

  const renderUserPreset = (preset: Preset) => {
    const summary = `${preset.settings.codec === 'libx265' ? 'H.265' : 'H.264'} · CRF ${preset.settings.crf} · ${preset.settings.resolution}`;

    return (
      <View key={preset.id} style={styles.presetRow}>
        <View style={[styles.userIcon]}>
          <Text style={styles.userIconText}>{preset.name.charAt(0)}</Text>
        </View>
        <View style={styles.presetInfo}>
          <Text style={styles.presetName}>{preset.name}</Text>
          <Text style={styles.presetSummary}>{summary}</Text>
        </View>
        {editMode ? (
          <Pressable onPress={() => handleDeletePreset(preset.id)}>
            <Text style={styles.deleteAction}>Delete</Text>
          </Pressable>
        ) : (
          <Text style={styles.chevron}>›</Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Text style={styles.largeTitle}>{S.tabPresets}</Text>
        <Pressable hitSlop={8}>
          <Text style={styles.addButton}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => (
          <View>
            {/* Built-in section */}
            <Text style={styles.sectionHeader}>{S.presetsBuiltIn}</Text>
            <View style={styles.presetGroup}>
              {BUILT_IN_PRESETS.map((p, i) => (
                <View key={p.id}>
                  {renderBuiltInPreset(p)}
                  {i < BUILT_IN_PRESETS.length - 1 ? (
                    <View style={styles.separator} />
                  ) : null}
                </View>
              ))}
            </View>

            {/* User presets section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>{S.presetsMyPresets}</Text>
              <Pressable onPress={() => setEditMode(!editMode)}>
                <Text style={styles.editButton}>{S.presetsEdit}</Text>
              </Pressable>
            </View>

            {userPresets.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{S.presetsNoSaved}</Text>
                <Text style={styles.emptySubText}>{S.presetsNoSavedSub}</Text>
              </View>
            ) : (
              <View style={styles.presetGroup}>
                {userPresets.map((p, i) => (
                  <View key={p.id}>
                    {renderUserPreset(p)}
                    {i < userPresets.length - 1 ? (
                      <View style={styles.separator} />
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.scrollContent}
      />
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
  addButton: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.accent,
  },
  scrollContent: {
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: Spacing.base,
  },
  editButton: {
    fontSize: 15,
    color: Colors.accent,
  },
  presetGroup: {
    backgroundColor: Colors.bg2,
    borderRadius: Radii.card,
    marginHorizontal: Spacing.base,
    overflow: 'hidden',
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 13,
    gap: 12,
  },
  separator: {
    height: 0.5,
    backgroundColor: Colors.rowSeparator,
    marginLeft: 13 + Layout.presetCircleSize + 12,
  },
  presetIcon: {
    width: Layout.presetCircleSize,
    height: Layout.presetCircleSize,
    borderRadius: Layout.presetCircleSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetIconText: {
    fontSize: Layout.presetIconSize * 0.6,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  userIcon: {
    width: Layout.presetCircleSize,
    height: Layout.presetCircleSize,
    borderRadius: 8,
    backgroundColor: Colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIconText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  presetSummary: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  chevron: {
    fontSize: 18,
    color: Colors.textTertiary,
  },
  deleteAction: {
    fontSize: 13,
    color: Colors.destructive,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textTertiary,
  },
  emptySubText: {
    fontSize: 13,
    color: Colors.crfHint,
    marginTop: 4,
  },
});
