import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SymbolView } from 'expo-symbols';
import { View, StyleSheet } from 'react-native';

import { Colors } from '../constants/theme';
import { S } from '../constants/strings';
import type { RootTabParamList, LibraryStackParamList } from '../types';

import LibraryScreen from '../screens/LibraryScreen';
import VideoDetailScreen from '../screens/VideoDetailScreen';
import MetadataDetailScreen from '../screens/MetadataDetailScreen';
import CompressionSettingsScreen from '../screens/CompressionSettingsScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SuccessScreen from '../screens/SuccessScreen';
import PresetsScreen from '../screens/PresetsScreen';
import HistoryScreen from '../screens/HistoryScreen';

// ──────────────────────────── Navigators ────────────────────────────

const Tab = createBottomTabNavigator<RootTabParamList>();
const LibraryStack = createNativeStackNavigator<LibraryStackParamList>();

// ──────────────────────────── Stack Navigators ────────────────────────────

function LibraryStackNavigator() {
  return (
    <LibraryStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg0 },
      }}
    >
      <LibraryStack.Screen name="Library" component={LibraryScreen} />
      <LibraryStack.Screen name="VideoDetail" component={VideoDetailScreen} />
      <LibraryStack.Screen name="MetadataDetail" component={MetadataDetailScreen} />
      <LibraryStack.Screen name="CompressionSettings" component={CompressionSettingsScreen} />
      <LibraryStack.Screen name="Progress" component={ProgressScreen} />
      <LibraryStack.Screen name="Success" component={SuccessScreen} />
    </LibraryStack.Navigator>
  );
}

// ──────────────────────────── Tab Icon ────────────────────────────

interface TabIconProps {
  symbolName: string;
  focused: boolean;
}

function TabIcon({ symbolName, focused }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <SymbolView
        name={symbolName as any}
        size={18}
        tintColor={focused ? Colors.textPrimary : Colors.textTertiary}
      />
    </View>
  );
}

// ──────────────────────────── App Theme ────────────────────────────

const appTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.bg0,
    card: Colors.bg0,
    border: Colors.separator,
    primary: Colors.accent,
    text: Colors.textPrimary,
  },
};

// ──────────────────────────── Root Navigator ────────────────────────────

export default function AppNavigator() {
  return (
    <NavigationContainer theme={appTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.textPrimary,
          tabBarInactiveTintColor: Colors.textTertiary,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen
          name="LibraryTab"
          component={LibraryStackNavigator}
          options={{
            title: S.tabLibrary,
            tabBarIcon: ({ focused }) => (
              <TabIcon symbolName="square.grid.2x2" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="PresetsTab"
          component={PresetsScreen}
          options={{
            title: S.tabPresets,
            tabBarIcon: ({ focused }) => (
              <TabIcon symbolName="gearshape" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="HistoryTab"
          component={HistoryScreen}
          options={{
            title: S.tabHistory,
            tabBarIcon: ({ focused }) => (
              <TabIcon symbolName="clock.arrow.circlepath" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ──────────────────────────── Styles ────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBarBg,
    borderTopWidth: 0.5,
    borderTopColor: Colors.separator,
    height: 80,
    paddingBottom: 24,
  },
  tabBarLabel: {
    fontSize: 9,
    fontWeight: '400',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
});
