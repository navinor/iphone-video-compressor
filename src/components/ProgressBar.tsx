import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors, Layout, Radii } from '../constants/theme';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  showLabel?: boolean;
  labelLeft?: string;
  labelRight?: string;
}

export function ProgressBar({
  progress,
  color = Colors.accent,
  height = Layout.progressBarHeight,
  showLabel = false,
  labelLeft,
  labelRight,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${clampedProgress}%`, { duration: 300 }),
  }));

  return (
    <View>
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: color, height },
            animatedStyle,
          ]}
        />
      </View>
      {showLabel && (labelLeft || labelRight) ? (
        <View style={styles.labelRow}>
          {labelLeft ? <Text style={styles.labelText}>{labelLeft}</Text> : null}
          {labelRight ? <Text style={styles.labelTextRight}>{labelRight}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.bg3,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 3,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  labelText: {
    fontSize: 11,
    color: Colors.queueMeta,
  },
  labelTextRight: {
    fontSize: 11,
    color: Colors.queueMeta,
    textAlign: 'right',
  },
});
