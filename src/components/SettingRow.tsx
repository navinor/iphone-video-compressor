import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Colors, Layout, Radii } from '../constants/theme';

// ──────────────────────────── Tappable Row ────────────────────────────

interface SettingRowProps {
  label: string;
  value?: string;
  valueColor?: string;
  onPress?: () => void;
  showChevron?: boolean;
  isLast?: boolean;
}

export function SettingRow({
  label,
  value,
  valueColor = Colors.textPrimary,
  onPress,
  showChevron = true,
  isLast = false,
}: SettingRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, !isLast && styles.rowBorder]}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        {value ? (
          <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
        ) : null}
        {onPress && showChevron ? (
          <Text style={styles.chevron}>›</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ──────────────────────────── Toggle Row ────────────────────────────

interface ToggleRowProps {
  label: string;
  value: boolean;
  onToggle: (val: boolean) => void;
  isLast?: boolean;
}

export function ToggleRow({ label, value, onToggle, isLast = false }: ToggleRowProps) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text style={[styles.toggleText, { color: value ? Colors.accent : Colors.textTertiary }]}>
          {value ? 'on' : 'off'}
        </Text>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: Colors.bg3, true: Colors.accent }}
          thumbColor={Colors.textPrimary}
          style={styles.switch}
        />
      </View>
    </View>
  );
}

// ──────────────────────────── Group Container ────────────────────────────

interface SettingsGroupProps {
  children: React.ReactNode;
}

export function SettingsGroup({ children }: SettingsGroupProps) {
  return <View style={styles.group}>{children}</View>;
}

// ──────────────────────────── Styles ────────────────────────────

const styles = StyleSheet.create({
  group: {
    backgroundColor: Colors.bg2,
    borderRadius: Radii.card,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  row: {
    minHeight: Layout.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  rowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.rowSeparator,
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: Colors.settingLabel,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 13,
    textAlign: 'right',
  },
  chevron: {
    fontSize: 16,
    color: Colors.textTertiary,
    marginLeft: 2,
  },
  toggleText: {
    fontSize: 13,
    marginRight: 8,
  },
  switch: {
    transform: [{ scale: 0.8 }],
  },
});
