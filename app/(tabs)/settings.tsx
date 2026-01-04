import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  exportAllData,
  getAutoBackupFiles,
  shareAutoBackup,
} from "@/services/exportService";
import {
  pickAndReadBackupFile,
  readAutoBackupFile,
  validateBackupData,
} from "@/services/importService";
import {
  clearAllData,
  getLastBackupDate,
  importAllData,
  isAutoBackupEnabled,
  setAutoBackupEnabled,
} from "@/services/storageService";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const iconColor = useThemeColor({}, "icon");
  const [isLoading, setIsLoading] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabledState] = useState(false);
  const [lastBackupDate, setLastBackupDateState] = useState<string | null>(
    null
  );
  const [autoBackupCount, setAutoBackupCount] = useState(0);

  // Load auto-backup settings on mount
  useEffect(() => {
    loadAutoBackupSettings();
  }, []);

  const loadAutoBackupSettings = async () => {
    try {
      const enabled = await isAutoBackupEnabled();
      const lastDate = await getLastBackupDate();
      const files = await getAutoBackupFiles();
      setAutoBackupEnabledState(enabled);
      setLastBackupDateState(lastDate);
      setAutoBackupCount(files.length);
    } catch (error) {
      console.error("Failed to load auto-backup settings:", error);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      await exportAllData();
      Alert.alert(
        "Success",
        "Your data has been exported successfully. Save the file to a safe location."
      );
    } catch (error) {
      Alert.alert(
        "Export Failed",
        error instanceof Error
          ? error.message
          : "An error occurred while exporting data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    Alert.alert(
      "Import Data",
      "This will replace all existing data with the data from your backup file. Make sure you have a current backup before proceeding.\n\nContinue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              const data = await pickAndReadBackupFile();

              if (!data) {
                setIsLoading(false);
                return; // User canceled
              }

              if (!validateBackupData(data)) {
                Alert.alert(
                  "Invalid File",
                  "The backup file appears to be corrupted or invalid. Please select a valid LighterMe backup file."
                );
                setIsLoading(false);
                return;
              }

              // Clear existing data and import new data
              await clearAllData();
              await importAllData(data.weightEntries, data.waistEntries);

              Alert.alert(
                "Import Successful",
                `Imported ${data.weightEntries.length} weight entries and ${
                  data.waistEntries.length
                } waist measurements.\n\nExported on: ${new Date(
                  data.exportDate
                ).toLocaleDateString()}`
              );
            } catch (error) {
              Alert.alert(
                "Import Failed",
                error instanceof Error
                  ? error.message
                  : "An error occurred while importing data"
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleAutoBackup = async (value: boolean) => {
    try {
      await setAutoBackupEnabled(value);
      setAutoBackupEnabledState(value);
      if (value) {
        Alert.alert(
          "Auto-Backup Enabled",
          "Your data will be backed up automatically once per day when you open the app."
        );
      }
    } catch (error) {
      console.error("Failed to toggle auto-backup:", error);
      Alert.alert("Error", "Failed to update auto-backup setting");
    }
  };

  const handleRestoreFromAutoBackup = async () => {
    try {
      const files = await getAutoBackupFiles();
      if (files.length === 0) {
        Alert.alert(
          "No Auto-Backups",
          "No automatic backups have been created yet."
        );
        return;
      }

      const fileList = files.map((f) => `${f.date}`);
      Alert.alert(
        "Restore from Auto-Backup",
        `Select a backup to restore:\n\n${fileList.join(
          "\n"
        )}\n\n⚠️ This will replace all current data!`,
        [
          ...files.map((file) => ({
            text: file.date,
            onPress: () => confirmAndRestore(file.uri, file.date),
            style: "default" as const,
          })),
          { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error("Failed to load auto-backups:", error);
      Alert.alert("Error", "Failed to load auto-backups");
    }
  };

  const confirmAndRestore = async (uri: string, date: string) => {
    Alert.alert(
      "Confirm Restore",
      `Restore backup from ${date}?\n\nThis will replace all current data. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);

              // Read and validate the auto-backup
              const data = await readAutoBackupFile(uri);

              if (!validateBackupData(data)) {
                Alert.alert(
                  "Invalid Backup",
                  "The backup file appears to be corrupted."
                );
                return;
              }

              // Clear and restore data
              await clearAllData();
              await importAllData(data.weightEntries, data.waistEntries);

              Alert.alert(
                "Restore Successful",
                `Restored ${data.weightEntries.length} weight entries and ${data.waistEntries.length} waist measurements from ${date}.`
              );

              // Reload backup settings to update UI
              await loadAutoBackupSettings();
            } catch (error) {
              console.error("Restore failed:", error);
              Alert.alert(
                "Restore Failed",
                error instanceof Error ? error.message : "An error occurred"
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleViewAutoBackups = async () => {
    try {
      const files = await getAutoBackupFiles();
      if (files.length === 0) {
        Alert.alert(
          "No Auto-Backups",
          "No automatic backups have been created yet."
        );
        return;
      }

      const fileList = files.map((f) => `${f.date}`);
      Alert.alert(
        "Auto-Backup Files",
        `${files.length} backup(s) available:\n\n${fileList.join(
          "\n"
        )}\n\nTap on a date to share that backup.`,
        [
          ...files.map((file) => ({
            text: file.date,
            onPress: () => shareAutoBackup(file.uri),
          })),
          { text: "Close", style: "cancel" },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error("Failed to view auto-backups:", error);
      Alert.alert("Error", "Failed to load auto-backups");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedView style={styles.content}>
          <ThemedText type="title" style={styles.header}>
            Settings
          </ThemedText>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Auto-Backup
            </ThemedText>
            <ThemedText
              style={[styles.sectionDescription, { color: iconColor }]}
            >
              Automatically backup your data once per day when you open the app.
              Backups are stored locally and kept for 7 days.
            </ThemedText>

            <View style={styles.switchRow}>
              <ThemedText style={styles.switchLabel}>
                Enable Auto-Backup
              </ThemedText>
              <Switch
                value={autoBackupEnabled}
                onValueChange={handleToggleAutoBackup}
                trackColor={{ false: "#767577", true: tintColor }}
                thumbColor="#f4f3f4"
              />
            </View>

            {autoBackupEnabled && lastBackupDate && (
              <ThemedText style={[styles.infoText, { color: iconColor }]}>
                Last backup:{" "}
                {new Date(lastBackupDate).toLocaleString("en-AU", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {autoBackupCount > 0 &&
                  ` • ${autoBackupCount} backup(s) stored`}
              </ThemedText>
            )}

            {autoBackupEnabled && autoBackupCount > 0 && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.flexButton,
                    { backgroundColor: tintColor },
                  ]}
                  onPress={handleRestoreFromAutoBackup}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.buttonText}>
                      ↩️ Restore
                    </ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.flexButton,
                    styles.tertiaryButton,
                    { borderColor: iconColor },
                  ]}
                  onPress={handleViewAutoBackups}
                >
                  <ThemedText style={[styles.buttonText, { color: iconColor }]}>
                    📋 Share
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Manual Backup
            </ThemedText>
            <ThemedText
              style={[styles.sectionDescription, { color: iconColor }]}
            >
              Export your data to create a backup file, or import data from a
              previous backup. The backup file is in JSON format and can be
              saved to your device or cloud storage.
            </ThemedText>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: tintColor }]}
              onPress={handleExport}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>
                  📤 Export All Data
                </ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                { borderColor: tintColor },
              ]}
              onPress={handleImport}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={tintColor} />
              ) : (
                <ThemedText style={[styles.buttonText, { color: tintColor }]}>
                  📥 Import Data
                </ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              About
            </ThemedText>
            <ThemedText style={[styles.aboutText, { color: iconColor }]}>
              LighterMe - Weight & Waist Tracker{"\n"}
              Version 1.0.0
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText style={[styles.warningText, { color: iconColor }]}>
              ⚠️ Important: Always keep your backup files in a safe location.
              Importing a backup will permanently replace all current data.
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  content: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingVertical: 20,
    gap: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
    lineHeight: 38,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    lineHeight: 24,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  tertiaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  flexButton: {
    flex: 1,
  },
});
