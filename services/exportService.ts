import type { WaistEntry, WeightEntry } from '@/types/data';
import { Directory, File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import {
    getAllWaistEntries,
    getAllWeightEntries,
    getLastBackupDate,
    setLastBackupDate
} from './storageService';

export interface BackupData {
  version: string;
  exportDate: string;
  weightEntries: WeightEntry[];
  waistEntries: WaistEntry[];
}

/**
 * Exports all weight and waist data to a JSON file and shares it
 */
export async function exportAllData(): Promise<void> {
  try {
    // Gather all data
    const weightEntries = await getAllWeightEntries();
    const waistEntries = await getAllWaistEntries();

    // Sort entries by date (oldest to newest)
    const sortedWeightEntries = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date));
    const sortedWaistEntries = [...waistEntries].sort((a, b) => a.date.localeCompare(b.date));

    const backupData: BackupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      weightEntries: sortedWeightEntries,
      waistEntries: sortedWaistEntries,
    };

    // Create file with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `lighterme-backup-${timestamp}.json`;
    const file = new File(Paths.document, fileName);
    
    // Write backup file
    await file.write(JSON.stringify(backupData, null, 2));

    // Share file with user
    if (await isAvailableAsync()) {
      await shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Backup File',
        UTI: 'public.json',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Export error:', error);
    throw new Error('Failed to export data. Please try again.');
  }
}

/**
 * Creates an auto-backup silently in the app's auto-backups directory
 * Does not show share dialog - saves directly to app storage
 */
export async function createAutoBackup(): Promise<void> {
  try {
    // Gather all data
    const weightEntries = await getAllWeightEntries();
    const waistEntries = await getAllWaistEntries();

    // Sort entries by date (oldest to newest)
    const sortedWeightEntries = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date));
    const sortedWaistEntries = [...waistEntries].sort((a, b) => a.date.localeCompare(b.date));

    const backupData: BackupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      weightEntries: sortedWeightEntries,
      waistEntries: sortedWaistEntries,
    };

    // Create auto-backups directory if it doesn't exist
    const autoBackupsDir = new Directory(Paths.document, 'auto-backups');
    if (!autoBackupsDir.exists) {
      autoBackupsDir.create();
    }

    // Create backup file with date
    const date = new Date().toISOString().split('T')[0];
    const fileName = `auto-backup-${date}.json`;
    const file = new File(autoBackupsDir, fileName);
    
    // Write backup file
    await file.write(JSON.stringify(backupData, null, 2));

    // Update last backup date
    await setLastBackupDate(date);

    // Clean up old backups (keep last 7 days)
    await cleanupOldBackups(autoBackupsDir, 7);
  } catch (error) {
    console.error('Auto-backup error:', error);
    // Don't throw - silent failure for auto-backup
  }
}

/**
 * Cleans up old backup files, keeping only the most recent N files
 */
async function cleanupOldBackups(directory: Directory, keepCount: number): Promise<void> {
  try {
    if (!directory.exists) return;

    const files = directory.list()
      .filter(item => item instanceof File && item.name.startsWith('auto-backup-'))
      .sort((a, b) => b.name.localeCompare(a.name)); // Sort newest first

    // Delete files beyond keepCount
    for (let i = keepCount; i < files.length; i++) {
      try {
        files[i].delete();
      } catch (error) {
        console.error(`Failed to delete old backup: ${files[i].name}`, error);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
}

/**
 * Check if an auto-backup is needed today
 */
export async function shouldCreateAutoBackup(): Promise<boolean> {
  try {
    const lastBackupDate = await getLastBackupDate();
    const today = new Date().toISOString().split('T')[0];
    
    // Need backup if never backed up or last backup was not today
    return lastBackupDate !== today;
  } catch (error) {
    console.error('Error checking backup status:', error);
    return false;
  }
}

/**
 * Get list of all auto-backup files
 */
export async function getAutoBackupFiles(): Promise<{ name: string; date: string; uri: string }[]> {
  try {
    const autoBackupsDir = new Directory(Paths.document, 'auto-backups');
    
    if (!autoBackupsDir.exists) {
      return [];
    }

    const files = autoBackupsDir.list()
      .filter(item => item instanceof File && item.name.startsWith('auto-backup-'))
      .map(file => {
        const match = file.name.match(/auto-backup-(\d{4}-\d{2}-\d{2})\.json/);
        const date = match ? match[1] : 'Unknown';
        return {
          name: file.name,
          date,
          uri: file.uri,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // Newest first

    return files;
  } catch (error) {
    console.error('Error getting auto-backup files:', error);
    return [];
  }
}

/**
 * Share an auto-backup file
 */
export async function shareAutoBackup(uri: string): Promise<void> {
  try {
    if (await isAvailableAsync()) {
      await shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'Share Auto-Backup',
        UTI: 'public.json',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error sharing auto-backup:', error);
    throw new Error('Failed to share backup file');
  }
}
