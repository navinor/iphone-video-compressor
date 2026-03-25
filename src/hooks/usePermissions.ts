import { useState, useEffect } from 'react';
import * as MediaLibrary from 'expo-media-library';

/**
 * Hook to manage photo library permissions.
 * Returns the current status and a function to request permission.
 */
export function usePermissions() {
  const [status, setStatus] = useState<MediaLibrary.PermissionStatus | null>(null);

  useEffect(() => {
    (async () => {
      const { status: s } = await MediaLibrary.getPermissionsAsync();
      setStatus(s);
    })();
  }, []);

  const request = async (): Promise<boolean> => {
    const { status: s } = await MediaLibrary.requestPermissionsAsync();
    setStatus(s);
    return s === MediaLibrary.PermissionStatus.GRANTED;
  };

  return {
    granted: status === MediaLibrary.PermissionStatus.GRANTED,
    denied: status === MediaLibrary.PermissionStatus.DENIED,
    status,
    request,
  };
}
