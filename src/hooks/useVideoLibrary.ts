import { useState, useEffect, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import type { VideoAsset, SortMode } from '../types';
import { formatFileSize } from '../utils/format';

/**
 * Hook to load videos from the device camera roll.
 * Returns a sorted, typed array of VideoAsset objects.
 */
export function useVideoLibrary(sortMode: SortMode = 'largest') {
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSize, setTotalSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Photo library access denied');
        setLoading(false);
        return;
      }

      let allAssets: MediaLibrary.Asset[] = [];
      let hasNextPage = true;
      let endCursor: string | undefined;

      while (hasNextPage) {
        const page = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.video,
          first: 500,
          after: endCursor,
          sortBy: [MediaLibrary.SortBy.default],
        });

        allAssets = allAssets.concat(page.assets);
        hasNextPage = page.hasNextPage;
        endCursor = page.endCursor;
      }

      const mapped: VideoAsset[] = allAssets.map((a) => ({
        id: a.id,
        uri: a.uri,
        filename: a.filename,
        duration: a.duration,
        width: a.width,
        height: a.height,
        fileSize: (a as unknown as { fileSize?: number }).fileSize ?? 0,
        creationTime: a.creationTime,
        modificationTime: a.modificationTime,
        mediaType: a.mediaType,
      }));

      setTotalSize(mapped.reduce((acc, v) => acc + v.fileSize, 0));
      setVideos(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Sort
  const sorted = [...videos].sort((a, b) => {
    switch (sortMode) {
      case 'largest':
        return b.fileSize - a.fileSize;
      case 'smallest':
        return a.fileSize - b.fileSize;
      case 'newest':
        return b.creationTime - a.creationTime;
      case 'oldest':
        return a.creationTime - b.creationTime;
      case 'longest':
        return b.duration - a.duration;
      default:
        return 0;
    }
  });

  return {
    videos: sorted,
    loading,
    error,
    totalSize,
    totalSizeFormatted: formatFileSize(totalSize),
    refresh: fetchVideos,
  };
}
