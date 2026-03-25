import { Paths, File, Directory } from 'expo-file-system';

const LOCK_EXT = '.lock';

/**
 * On cold boot, scan the documents directory for orphaned .lock files.
 * Each .lock indicates an in-progress encode that was interrupted.
 * Delete both the .lock and its associated partial output file.
 * Completed outputs (no .lock sibling) are never touched.
 */
export async function cleanupOrphanedFiles(): Promise<number> {
  const docDir = Paths.document;
  let cleaned = 0;

  try {
    const dir = new Directory(docDir);
    const items = dir.list();

    // dir.list() returns (File | Directory)[] — extract URIs
    const lockItems = items.filter(
      (item): item is File => item instanceof File && item.uri.endsWith(LOCK_EXT),
    );

    for (const lockItem of lockItems) {
      try {
        const raw = await lockItem.text();
        const lock = JSON.parse(raw) as { outputPath?: string };

        // Delete the corrupt partial output
        if (lock.outputPath) {
          const outputFile = new File(lock.outputPath);
          if (outputFile.exists) {
            outputFile.delete();
            cleaned++;
          }
        }
      } catch {
        // Lock file is itself corrupt; just delete it
      }

      // Always delete the lock file
      if (lockItem.exists) {
        lockItem.delete();
      }
    }

    // Also clean up any stray .tmp files from FFmpeg
    const tmpItems = items.filter(
      (item): item is File =>
        item instanceof File &&
        (item.uri.endsWith('.tmp') || item.uri.includes('ffmpeg_')),
    );
    for (const tmpItem of tmpItems) {
      if (tmpItem.exists) {
        tmpItem.delete();
        cleaned++;
      }
    }
  } catch {
    // If we can't read the directory, fail silently
  }

  return cleaned;
}
