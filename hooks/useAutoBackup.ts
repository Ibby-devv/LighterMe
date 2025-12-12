import { createAutoBackup, shouldCreateAutoBackup } from '@/services/exportService';
import { isAutoBackupEnabled } from '@/services/storageService';
import { useEffect, useRef } from 'react';

/**
 * Hook to handle auto-backup on app launch
 * Checks if backup is needed and creates one silently in the background
 */
export function useAutoBackup() {
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only check once per app launch
    if (hasChecked.current) return;
    hasChecked.current = true;

    const performAutoBackupCheck = async () => {
      try {
        // Check if auto-backup is enabled
        const enabled = await isAutoBackupEnabled();
        if (!enabled) return;

        // Check if we need a backup today
        //const needsBackup = await shouldCreateAutoBackup();
        //if (!needsBackup) return;

        // Create backup silently
        await createAutoBackup();
        console.log('Auto-backup completed successfully');
      } catch (error) {
        console.error('Auto-backup check failed:', error);
        // Silent failure - don't bother the user
      }
    };

    // Run check after a short delay to not block app startup
    const timer = setTimeout(performAutoBackupCheck, 2000);

    return () => clearTimeout(timer);
  }, []);
}
