import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WaistInput } from '@/components/WaistInput';
import { WeeklyStatsCard } from '@/components/WeeklyStatsCard';
import { WeekNavigator } from '@/components/WeekNavigator';
import { WeightEntryItem } from '@/components/WeightEntryItem';
import { WeightInput } from '@/components/WeightInput';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useWaistLog } from '@/hooks/useWaistLog';
import { useWeeklyAnalytics } from '@/hooks/useWeeklyAnalytics';
import { useWeightLog } from '@/hooks/useWeightLog';
import { getWaistEntriesForWeek, getWeightEntriesForWeek, isSameWeek } from '@/services/storageService';
import { WaistEntry, WeightEntry } from '@/types/data';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  const {
    stats,
    currentWeekStart,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    refresh: refreshStats,
  } = useWeeklyAnalytics();

  const { editEntry: editWeight, removeEntry: deleteWeight } = useWeightLog();
  const { editEntry: editWaist, removeEntry: deleteWaist } = useWaistLog();

  const [weekEntries, setWeekEntries] = useState<WeightEntry[]>([]);
  const [waistEntries, setWaistEntries] = useState<WaistEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [editingWaist, setEditingWaist] = useState<WaistEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWaistEditModal, setShowWaistEditModal] = useState(false);

  const isCurrentWeek = isSameWeek(new Date(currentWeekStart), new Date());

  // Load entries for the selected week
  const loadWeekEntries = useCallback(async () => {
    const entries = await getWeightEntriesForWeek(currentWeekStart);
    setWeekEntries(entries);
    const waist = await getWaistEntriesForWeek(currentWeekStart);
    setWaistEntries(waist);
  }, [currentWeekStart]);

  useEffect(() => {
    loadWeekEntries();
  }, [loadWeekEntries]);

  // Reload data when screen comes into focus (e.g., after logging in Home tab)
  useFocusEffect(
    useCallback(() => {
      loadWeekEntries();
      refreshStats();
    }, [loadWeekEntries, refreshStats])
  );

  const handleEdit = useCallback((entry: WeightEntry) => {
    setEditingEntry(entry);
    setShowEditModal(true);
  }, []);

  const handleSaveEdit = useCallback(async (weight: number, notes?: string) => {
    if (editingEntry) {
      await editWeight(editingEntry.id, { weight, notes });
      setShowEditModal(false);
      setEditingEntry(null);
      await loadWeekEntries();
      refreshStats();
    }
  }, [editingEntry, editWeight, loadWeekEntries, refreshStats]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteWeight(id);
    await loadWeekEntries();
    refreshStats();
  }, [deleteWeight, loadWeekEntries, refreshStats]);

  const handleEditWaist = useCallback((entry: WaistEntry) => {
    setEditingWaist(entry);
    setShowWaistEditModal(true);
  }, []);

  const handleSaveWaistEdit = useCallback(async (measurement: number, notes?: string) => {
    if (editingWaist) {
      await editWaist(editingWaist.id, { measurement, notes });
      setShowWaistEditModal(false);
      setEditingWaist(null);
      await loadWeekEntries();
      refreshStats();
    }
  }, [editingWaist, editWaist, loadWeekEntries, refreshStats]);

  const handleDeleteWaist = useCallback(async (id: string) => {
    Alert.alert(
      'Delete Waist Entry',
      'Are you sure you want to delete this waist measurement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWaist(id);
            await loadWeekEntries();
            refreshStats();
          },
        },
      ]
    );
  }, [deleteWaist, loadWeekEntries, refreshStats]);

  const renderWeightEntry = useCallback(({ item }: { item: WeightEntry }) => {
    const isMin = stats?.weightMin !== null && item.weight === stats?.weightMin;
    const isMax = stats?.weightMax !== null && item.weight === stats?.weightMax;

    return (
      <WeightEntryItem
        entry={item}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isMinWeight={isMin}
        isMaxWeight={isMax}
      />
    );
  }, [stats, handleEdit, handleDelete]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.header}>
          Weekly History
        </ThemedText>

        <WeekNavigator
          weekStart={currentWeekStart}
          onPrevious={goToPreviousWeek}
          onNext={goToNextWeek}
          onToday={goToCurrentWeek}
          isCurrentWeek={isCurrentWeek}
        />

        {stats && stats.weightCount > 0 && (
          <>
            <WeeklyStatsCard stats={stats} />

            <ThemedView style={styles.entriesSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Weight Entries
              </ThemedText>
              <FlatList
                data={weekEntries}
                renderItem={renderWeightEntry}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.listContent}
              />
            </ThemedView>
          </>
        )}

        {!stats || stats.weightCount === 0 && (
          <ThemedView style={styles.emptyCard}>
            <ThemedText style={[styles.emptyText, { color: iconColor }]}>
              No weight entries for this week.
            </ThemedText>
          </ThemedView>
        )}

        {waistEntries.length > 0 && (
          <ThemedView style={styles.entriesSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Waist Measurements
            </ThemedText>
            {waistEntries.map((entry) => (
              <ThemedView key={entry.id} style={styles.waistEntryCard}>
                <View style={styles.waistEntryContent}>
                  <View style={styles.waistLeftSection}>
                    <ThemedText type="defaultSemiBold" style={styles.waistDate}>
                      {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </ThemedText>
                    {entry.notes && (
                      <ThemedText style={[styles.waistNotes, { color: iconColor }]} numberOfLines={1}>
                        {entry.notes}
                      </ThemedText>
                    )}
                  </View>

                  <View style={styles.waistActions}>
                    <TouchableOpacity onPress={() => handleEditWaist(entry)} style={styles.waistIconButton}>
                      <ThemedText style={[styles.waistIcon, { color: tintColor }]}>✎</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteWaist(entry.id)} style={styles.waistIconButton}>
                      <ThemedText style={[styles.waistIcon, { color: '#e74c3c' }]}>✕</ThemedText>
                    </TouchableOpacity>
                  </View>

                  <ThemedText type="title" style={[styles.waistValue, { color: tintColor }]}>
                    {entry.measurement.toFixed(1)} cm
                  </ThemedText>
                </View>
              </ThemedView>
            ))}
          </ThemedView>
        )}
        </ThemedView>

        {/* Edit Modal */}
        <Modal
          visible={showEditModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowEditModal(false)}>
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">Edit Weight Entry</ThemedText>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <ThemedText style={[styles.closeButton, { color: iconColor }]}>✕</ThemedText>
                </TouchableOpacity>
              </View>
              {editingEntry && (
                <>
                  <WeightInput
                    onSave={handleSaveEdit}
                    date={editingEntry.date}
                    editMode
                    initialWeight={editingEntry.weight}
                    initialNotes={editingEntry.notes}
                  />
                  <TouchableOpacity
                    onPress={() => setShowEditModal(false)}
                    style={styles.cancelButton}>
                    <ThemedText style={[styles.cancelButtonText, { color: iconColor }]}>
                      Cancel
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </ThemedView>
          </View>
        </Modal>

        {/* Waist Edit Modal */}
        <Modal
          visible={showWaistEditModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowWaistEditModal(false)}>
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">Edit Waist Measurement</ThemedText>
                <TouchableOpacity onPress={() => setShowWaistEditModal(false)}>
                  <ThemedText style={[styles.closeButton, { color: iconColor }]}>✕</ThemedText>
                </TouchableOpacity>
              </View>
              {editingWaist && (
                <>
                  <WaistInput
                    onSave={handleSaveWaistEdit}
                    date={editingWaist.date}
                    editMode
                    initialMeasurement={editingWaist.measurement}
                    initialNotes={editingWaist.notes}
                  />
                  <TouchableOpacity
                    onPress={() => setShowWaistEditModal(false)}
                    style={styles.cancelButton}>
                    <ThemedText style={[styles.cancelButtonText, { color: iconColor }]}>
                      Cancel
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}
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
  entriesSection: {
    gap: 8,
  },
  sectionTitle: {
    marginBottom: 6,
    lineHeight: 24,
  },
  listContent: {
    gap: 0,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
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
    fontWeight: '300',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  waistEntryCard: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  waistEntryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waistLeftSection: {
    flex: 1,
    gap: 2,
  },
  waistDate: {
    fontSize: 14,
    lineHeight: 18,
  },
  waistNotes: {
    fontSize: 11,
    lineHeight: 14,
  },
  waistValue: {
    fontSize: 22,
    lineHeight: 26,
  },
  waistActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  waistIconButton: {
    padding: 4,
  },
  waistIcon: {
    fontSize: 18,
    lineHeight: 18,
  },
});
