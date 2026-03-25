import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { cleanupOrphanedFiles } from './src/lib/cleanup';
import { configureBackgroundExecution } from './src/lib/background';
import { checkVideoToolboxSupport } from './src/lib/ffmpeg';

export default function App() {
  useEffect(() => {
    // Cold boot initialization
    (async () => {
      // 1. Clean up orphaned lock files and corrupt partial outputs
      const cleaned = await cleanupOrphanedFiles();
      if (cleaned > 0) {
        console.log(`[Cleanup] Removed ${cleaned} orphaned files`);
      }

      // 2. Configure background execution
      configureBackgroundExecution();

      // 3. Cache VideoToolbox availability
      await checkVideoToolboxSupport();
    })();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
