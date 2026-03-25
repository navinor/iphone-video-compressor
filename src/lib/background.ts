// @ts-nocheck — FFmpegKit fork types are incomplete
import { FFmpegKitConfig } from '@apescoding/ffmpeg-kit-react-native';

/**
 * Configure background execution support.
 *
 * expo-keep-awake prevents the screen from sleeping.
 * FFmpegKitConfig.enableBackgroundExecution() tells the FFmpegKit
 * session to continue when the app enters background.
 *
 * The BGTaskSchedulerPermittedIdentifiers are registered via the
 * Expo Config Plugin in src/native/BackgroundTaskPlugin/withBackgroundTask.js.
 * The task identifier is: com.warhax.videocompressor.compression
 *
 * iOS 26 aggressively suspends background processes. This module
 * configures the FFmpegKit session timeout and failed-session handler.
 */

const SESSION_TIMEOUT_SECONDS = 1800; // 30 minutes

export function configureBackgroundExecution(): void {
  // Allow FFmpeg sessions to continue when app is backgrounded
  FFmpegKitConfig.enableBackgroundExecution();

  // Set a generous session timeout for long encodes
  FFmpegKitConfig.setSessionTimeout(SESSION_TIMEOUT_SECONDS);

  // Handle sessions that fail due to background suspension
  FFmpegKitConfig.setSessionFailedHandler((session: any) => {
    const failTrace = session.getFailStackTrace?.();
    if (failTrace?.includes('background') || failTrace?.includes('suspend')) {
      console.warn('[Background] Session was suspended by iOS:', failTrace);
    }
  });
}
