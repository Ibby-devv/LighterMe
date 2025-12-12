import { getDocumentAsync } from 'expo-document-picker';
import { File } from 'expo-file-system';
import type { BackupData } from './exportService';

/**
 * Opens file picker, reads backup file, and validates its structure
 */
export async function pickAndReadBackupFile(): Promise<BackupData | null> {
  try {
    const result = await getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    // Read file content
    const file = new File(result.assets[0].uri);
    const fileContent = await file.text();
    const data = JSON.parse(fileContent);

    // Validate basic structure
    if (!data.version || !Array.isArray(data.weightEntries) || !Array.isArray(data.waistEntries)) {
      throw new Error('Invalid backup file format');
    }

    return data as BackupData;
  } catch (error) {
    console.error('Import error:', error);
    if (error instanceof SyntaxError) {
      throw new Error('The backup file is not valid JSON. Please select a valid LighterMe backup file.');
    }
    throw new Error('Failed to read backup file. Please ensure it is a valid LighterMe backup.');
  }
}

/**
 * Reads an auto-backup file directly by URI
 */
export async function readAutoBackupFile(uri: string): Promise<BackupData> {
  try {
    const file = new File(uri);
    const fileContent = await file.text();
    const data = JSON.parse(fileContent);

    // Validate basic structure
    if (!data.version || !Array.isArray(data.weightEntries) || !Array.isArray(data.waistEntries)) {
      throw new Error('Invalid backup file format');
    }

    return data as BackupData;
  } catch (error) {
    console.error('Error reading auto-backup:', error);
    if (error instanceof SyntaxError) {
      throw new Error('The backup file is corrupted.');
    }
    throw new Error('Failed to read auto-backup file.');
  }
}

/**
 * Validates backup data structure and content
 */
export function validateBackupData(data: BackupData): boolean {
  try {
    // Check weight entries
    if (!data.weightEntries.every(entry => 
      entry.id && 
      entry.date && 
      typeof entry.weight === 'number' &&
      entry.weight > 0 &&
      entry.createdAt &&
      entry.updatedAt
    )) {
      return false;
    }

    // Check waist entries
    if (!data.waistEntries.every(entry => 
      entry.id && 
      entry.date && 
      typeof entry.measurement === 'number' &&
      entry.measurement > 0 &&
      entry.createdAt &&
      entry.updatedAt
    )) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}
