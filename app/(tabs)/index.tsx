import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WaistInput } from '@/components/WaistInput';
import { WeightInput } from '@/components/WeightInput';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useWaistLog } from '@/hooks/useWaistLog';
import { useWeeklyAnalytics } from '@/hooks/useWeeklyAnalytics';
import { useWeightLog } from '@/hooks/useWeightLog';
import { toISODateString } from '@/services/storageService';
import { WeightEntry } from '@/types/data';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const [todayDate, setTodayDate] = useState(() => toISODateString(new Date()));
  const [todayEntry, setTodayEntry] = useState<WeightEntry | null>(null);
  const [showWaistModal, setShowWaistModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);

  const { addEntry: addWeight, editEntry: editWeight, getEntryForDate } = useWeightLog();
  const { addEntry: addWaist } = useWaistLog();
  const { stats, refresh: refreshStats } = useWeeklyAnalytics();

  // Load today's entry
  const loadTodayEntry = useCallback(async () => {
    const entry = await getEntryForDate(todayDate);
    setTodayEntry(entry);
  }, [getEntryForDate, todayDate]);

  useEffect(() => {
    loadTodayEntry();
  }, [loadTodayEntry]);

  // Reload entry when screen comes into focus (e.g., after deleting in History tab)
  useFocusEffect(
    useCallback(() => {
      loadTodayEntry();
      refreshStats();
    }, [loadTodayEntry, refreshStats])
  );

  const handleSaveWeight = useCallback(async (weight: number, notes?: string) => {
    const isHistoricalEntry = todayDate !== toISODateString(new Date());
    
    if (todayEntry) {
      // Update existing entry for this date
      await editWeight(todayEntry.id, { weight, notes });
      Alert.alert('Success', 'Weight updated successfully');
    } else {
      // Add new entry
      await addWeight(todayDate, weight, notes);
      Alert.alert('Success', 'Weight logged successfully');
    }
    await loadTodayEntry();
    refreshStats();
    
    // Return to today after logging historical entry
    if (isHistoricalEntry) {
      setTodayDate(toISODateString(new Date()));
    }
  }, [todayEntry, todayDate, addWeight, editWeight, loadTodayEntry, refreshStats]);

  const handleDateChange = useCallback((newDate: string) => {
    setTodayDate(newDate);
  }, []);

  const handleSaveWaist = useCallback(async (measurement: number, notes?: string) => {
    const isHistoricalEntry = todayDate !== toISODateString(new Date());
    
    await addWaist(todayDate, measurement, notes);
    setShowWaistModal(false);
    Alert.alert('Success', 'Waist measurement logged successfully');
    refreshStats();
    
    // Return to today after logging historical entry
    if (isHistoricalEntry) {
      setTodayDate(toISODateString(new Date()));
    }
  }, [todayDate, addWaist, refreshStats]);

  const handleEditToday = () => {
    if (todayEntry) {
      setEditingEntry(todayEntry);
    }
  };

  const formatChange = (change: number | null) => {
    if (change === null) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)} kg`;
  };

  const getChangeColor = (change: number | null) => {
    if (change === null) return iconColor;
    return change < 0 ? '#2ecc71' : change > 0 ? '#e74c3c' : iconColor;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.header}>
          LighterMe
        </ThemedText>

        {todayDate !== toISODateString(new Date()) && (
          <ThemedView style={[styles.dateNotice, { backgroundColor: tintColor }]}>
            <ThemedText style={[styles.dateNoticeText, { color: '#fff' }]}>
              Viewing {new Date(todayDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </ThemedText>
          </ThemedView>
        )}

        {/* Weight Entry Form */}
        <WeightInput
          onSave={handleSaveWeight}
          date={todayDate}
          editMode={!!todayEntry}
          initialWeight={todayEntry?.weight}
          initialNotes={todayEntry?.notes}
          onDateChange={handleDateChange}
          allowDateChange={true}
        />

        {/* Quick Waist Log Button */}
        <TouchableOpacity
          onPress={() => setShowWaistModal(true)}
          style={[styles.waistButton, { backgroundColor: tintColor }]}>
          <ThemedText style={[styles.waistButtonText, { color: '#fff' }]}>
            Log Waist Measurement
          </ThemedText>
        </TouchableOpacity>

        {/* Weekly Stats */}
        {stats && stats.weightCount > 0 && (
          <ThemedView style={styles.statsCard}>
            <ThemedText type="subtitle" style={styles.statsTitle}>
              This Week
            </ThemedText>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statLabel}>Average</ThemedText>
                <ThemedText type="defaultSemiBold" style={[styles.statValue, { color: tintColor }]}>
                  {stats.weightAverage?.toFixed(1) || 'N/A'} kg
                </ThemedText>
              </View>
              {stats.weekOverWeekChange !== null && (
                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>vs Last Week</ThemedText>
                  <ThemedText
                    type="defaultSemiBold"
                    style={[
                      styles.statValue,
                      { color: getChangeColor(stats.weekOverWeekChange) },
                    ]}>
                    {formatChange(stats.weekOverWeekChange)}
                  </ThemedText>
                </View>
              )}
            </View>
          </ThemedView>
        )}

        {stats && stats.weightCount === 0 && (
          <ThemedView style={styles.emptyCard}>
            <ThemedText style={[styles.emptyText, { color: iconColor }]}>
              No weight entries for this week yet. Start logging your weight above!
            </ThemedText>
          </ThemedView>
        )}
        </ThemedView>

        {/* Waist Measurement Modal */}
        <Modal
          visible={showWaistModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowWaistModal(false)}>
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">Log Waist Measurement</ThemedText>
                <TouchableOpacity onPress={() => setShowWaistModal(false)}>
                  <ThemedText style={[styles.closeButton, { color: iconColor }]}>✕</ThemedText>
                </TouchableOpacity>
              </View>
              <WaistInput onSave={handleSaveWaist} date={todayDate} />
            </ThemedView>
          </View>
        </Modal>
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
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingVertical: 20,
    gap: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 38,
  },
  dateNotice: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateNoticeText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  todayCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  todayWeight: {
    fontSize: 48,
    lineHeight: 56,
    textAlign: 'center',
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  editButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  waistButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  waistButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  statsCard: {
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  statsTitle: {
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 26,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 20,
    lineHeight: 26,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
});
