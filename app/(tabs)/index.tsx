import { useWaistLog } from '@/hooks/useWaistLog';
import { useWeeklyAnalytics } from '@/hooks/useWeeklyAnalytics';
import { useWeightLog } from '@/hooks/useWeightLog';
import { toISODateString } from '@/services/storageService';
import { WeightEntry } from '@/types/data';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Keyboard, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [todayDate, setTodayDate] = useState(() => toISODateString(new Date()));
  const [todayEntry, setTodayEntry] = useState<WeightEntry | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Form state
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [saving, setSaving] = useState(false);

  const { addEntry: addWeight, editEntry: editWeight, getEntryForDate } = useWeightLog();
  const { addEntry: addWaist, getEntryForDate: getWaistForDate } = useWaistLog();
  const { stats, refresh: refreshStats } = useWeeklyAnalytics();

  // Load today's entry
  const loadTodayEntry = useCallback(async () => {
    const entry = await getEntryForDate(todayDate);
    setTodayEntry(entry);
    if (entry) {
      setWeight(entry.weight.toString());
    } else {
      setWeight('');
    }

    const waistEntry = await getWaistForDate(todayDate);
    if (waistEntry) {
      setWaist(waistEntry.measurement.toString());
    } else {
      setWaist('');
    }
  }, [getEntryForDate, getWaistForDate, todayDate]);

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

  const handleSaveWeight = useCallback(async () => {
    Keyboard.dismiss();
    
    const weightNum = weight ? parseFloat(weight) : null;
    const waistNum = waist ? parseFloat(waist) : null;

    // Validate that at least one field is filled
    if (!weightNum && !waistNum) {
      Alert.alert('No Data', 'Please enter at least weight or waist measurement');
      return;
    }

    // Validate weight if provided
    if (weightNum !== null) {
      if (isNaN(weightNum) || weightNum <= 0) {
        Alert.alert('Invalid Weight', 'Please enter a valid weight value');
        return;
      }
      if (weightNum > 500) {
        Alert.alert('Invalid Weight', 'Weight seems too high. Please check your entry.');
        return;
      }
    }

    // Validate waist if provided
    if (waistNum !== null) {
      if (isNaN(waistNum) || waistNum <= 0) {
        Alert.alert('Invalid Waist', 'Please enter a valid waist measurement');
        return;
      }
      if (waistNum > 300) {
        Alert.alert('Invalid Waist', 'Waist measurement seems too high. Please check your entry.');
        return;
      }
    }

    setSaving(true);
    try {
      // Save weight if provided
      if (weightNum !== null) {
        if (todayEntry) {
          await editWeight(todayEntry.id, { weight: weightNum });
        } else {
          await addWeight(todayDate, weightNum);
        }
      }

      // Save waist if provided
      if (waistNum !== null) {
        await addWaist(todayDate, waistNum);
      }
      
      const messages = [];
      if (weightNum) messages.push(`Weight: ${weightNum.toFixed(1)} kg`);
      if (waistNum) messages.push(`Waist: ${waistNum.toFixed(1)} cm`);
      
      setSuccessMessage(messages.join(' | '));
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        const isHistoricalEntry = todayDate !== toISODateString(new Date());
        if (isHistoricalEntry) {
          setTodayDate(toISODateString(new Date()));
        }
      }, 2000);
      
      await loadTodayEntry();
      refreshStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  }, [weight, waist, todayEntry, todayDate, editWeight, addWeight, addWaist, loadTodayEntry, refreshStats]);

  const handleDateChange = useCallback((newDate: string) => {
    setTodayDate(newDate);
  }, []);

  const formatChange = (change: number | null) => {
    if (change === null) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)} kg`;
  };

  const formatWaistChange = (change: number | null) => {
    if (change === null) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)} cm`;
  };

  const getChangeColor = (change: number | null) => {
    if (change === null) return '#6B7280';
    return change < 0 ? '#10B981' : change > 0 ? '#EF4444' : '#6B7280';
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = todayDate === toISODateString(new Date());

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const dateString = `${year}-${pad(month)}-${pad(day)}`;
      setTodayDate(dateString);
    }
  };

  const setToday = () => {
    setTodayDate(toISODateString(new Date()));
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setTodayDate(toISODateString(yesterday));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>LighterMe</Text>
          <Text style={styles.subtitle}>Track your progress</Text>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Date Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>📅 Date</Text>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              style={styles.dateInputContainer}
            >
              <Text style={styles.dateInput}>{formatDate(todayDate)}</Text>
            </TouchableOpacity>
            {isToday && (
              <Text style={styles.todayLabel}>Logging for today</Text>
            )}
          </View>

          {/* Weight Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>⚖️ Weight <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={weight}
                onChangeText={setWeight}
                placeholder="Enter weight"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                editable={!saving}
              />
              <View style={styles.picker}>
                <View style={styles.pickerButton}>
                  <Text style={styles.pickerText}>kg</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Waist Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>📏 Waist <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={waist}
                onChangeText={setWaist}
                placeholder="Enter waist"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                editable={!saving}
              />
              <View style={styles.picker}>
                <View style={styles.pickerButton}>
                  <Text style={styles.pickerText}>cm</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (!weight && !waist || saving) && styles.submitButtonDisabled]}
            onPress={handleSaveWeight}
            disabled={(!weight && !waist) || saving}>
            <Text style={styles.submitButtonText}>
              {saving ? 'Saving...' : isToday ? "Log Today's Metrics" : 'Log Metrics'}
            </Text>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.quickActionsLabel}>Quick actions</Text>
            <View style={styles.quickButtonsRow}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={setToday}
              >
                <Text style={styles.quickButtonText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={setYesterday}
              >
                <Text style={styles.quickButtonText}>Yesterday</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Cards - Bottom */}
        {(todayEntry || (stats && stats.weightCount > 0) || (stats && stats.waistMeasurements.length > 0)) && (
          <View style={styles.bottomStatsContainer}>
            {todayEntry && (
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>📅 {isToday ? 'Today' : 'Selected'}</Text>
                </View>
                <Text style={styles.statValue}>
                  {todayEntry.weight.toFixed(1)}{' '}
                  <Text style={styles.statUnit}>kg</Text>
                </Text>
              </View>
            )}

            {stats && stats.weightCount > 0 && (
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>
                    📊 Week Avg ({stats.weightCount})
                  </Text>
                </View>
                <Text style={styles.statValue}>
                  {stats.weightAverage?.toFixed(1) || 'N/A'}{' '}
                  <Text style={styles.statUnit}>kg</Text>
                </Text>
                {stats.weekOverWeekChange !== null && (
                  <Text style={[styles.statChange, { color: getChangeColor(stats.weekOverWeekChange) }]}>
                    {formatChange(stats.weekOverWeekChange)}
                  </Text>
                )}
              </View>
            )}

            {stats && stats.waistMeasurements.length > 0 && (
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>
                    📏 Waist ({stats.waistMeasurements.length})
                  </Text>
                </View>
                <Text style={styles.statValue}>
                  {stats.currentWeekWaist?.toFixed(1) || 'N/A'}{' '}
                  <Text style={styles.statUnit}>cm</Text>
                </Text>
                {stats.waistWeekOverWeekChange !== null && (
                  <Text style={[styles.statChange, { color: getChangeColor(stats.waistWeekOverWeekChange) }]}>
                    {formatWaistChange(stats.waistWeekOverWeekChange)}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(todayDate + 'T00:00:00')}
          mode="date"
          display="default"
          onChange={handleDatePickerChange}
        />
      )}

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Metrics Logged!</Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  scrollContent: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  bottomStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  statUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6B7280',
  },
  statNotes: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statChange: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  optional: {
    fontWeight: 'normal',
    color: '#9CA3AF',
  },
  dateInputContainer: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  dateInput: {
    fontSize: 16,
    color: '#1F2937',
  },
  todayLabel: {
    fontSize: 12,
    color: '#6366F1',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inputFlex: {
    flex: 1,
  },
  picker: {
    minWidth: 80,
  },
  pickerButton: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  waistButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  waistButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  quickActions: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 16,
  },
  quickActionsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

