import { useThemeColor } from '@/hooks/use-theme-color';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface WeightInputProps {
  onSave: (weight: number, notes?: string) => Promise<void>;
  initialWeight?: number;
  initialNotes?: string;
  editMode?: boolean;
  date: string;
  onDateChange?: (date: string) => void;
  allowDateChange?: boolean;
}

export const WeightInput: React.FC<WeightInputProps> = ({
  onSave,
  initialWeight,
  initialNotes,
  editMode = false,
  date,
  onDateChange,
  allowDateChange = false,
}) => {
  const [weight, setWeight] = useState(initialWeight?.toString() || '');
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate && onDateChange) {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const dateString = `${year}-${pad(month)}-${pad(day)}`;
      onDateChange(dateString);
    }
  };

  const handleSave = async () => {
    // Dismiss keyboard first
    Keyboard.dismiss();
    
    const weightNum = parseFloat(weight);
    
    if (!weight || isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight value');
      return;
    }

    if (weightNum > 500) {
      Alert.alert('Invalid Weight', 'Weight seems too high. Please check your entry.');
      return;
    }

    setSaving(true);
    try {
      await onSave(weightNum, notes.trim() || undefined);
      if (!editMode) {
        setWeight('');
        setNotes('');
      }
    } catch {
      Alert.alert('Error', 'Failed to save weight entry');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = () => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const day = new Date().getDate();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const todayString = `${year}-${pad(month)}-${pad(day)}`;
    return date === todayString;
  };

  const handleTodayClick = () => {
    if (onDateChange) {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const day = new Date().getDate();
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const todayString = `${year}-${pad(month)}-${pad(day)}`;
      onDateChange(todayString);
    }
  };

  return (
    <View style={styles.container}>
      {/* Date Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>📅 Date</Text>
        <TouchableOpacity 
          onPress={() => allowDateChange && setShowDatePicker(true)}
          style={styles.dateInputContainer}
        >
          <Text style={styles.dateInput}>{formatDate(date)}</Text>
        </TouchableOpacity>
        {isToday() && (
          <Text style={styles.todayLabel}>Logging for today</Text>
        )}
      </View>

      {/* Weight Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          ⚖️ Weight
        </Text>
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

      {/* Notes Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          📝 Notes <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add notes"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={2}
          editable={!saving}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, (!weight || saving) && styles.submitButtonDisabled]}
        onPress={handleSave}
        disabled={!weight || saving}>
        <Text style={styles.submitButtonText}>
          {saving ? 'Saving...' : editMode ? 'Update Weight' : 'Log Weight'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && allowDateChange && (
        <DateTimePicker
          value={new Date(date + 'T00:00:00')}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  optional: {
    color: '#9CA3AF',
  },
  dateInputContainer: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
  },
  dateInput: {
    fontSize: 16,
    color: '#1F2937',
  },
  todayLabel: {
    fontSize: 12,
    color: '#6366F1',
    marginTop: 4,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    color: '#1F2937',
  },
  inputFlex: {
    flex: 1,
  },
  picker: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerButton: {
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  pickerText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
