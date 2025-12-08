import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, Keyboard, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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
    <ThemedView style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          {editMode ? 'Update Weight' : 'Log Weight'} - {formatDate(date)}
        </ThemedText>
        {allowDateChange && (
          <TouchableOpacity
            onPress={isToday() ? () => setShowDatePicker(true) : handleTodayClick}
            style={[styles.dateButton, { borderColor: iconColor }]}>
            <ThemedText style={[styles.dateButtonText, { color: tintColor }]}>
              {isToday() ? 'Change Date' : 'Today'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: iconColor }]}
          placeholder="Weight (kg)"
          placeholderTextColor={iconColor}
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
          editable={!saving}
        />
        
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: tintColor },
            saving && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={saving}>
          <ThemedText style={[styles.saveButtonText, { color: '#fff' }]}>
            {saving ? 'Saving...' : editMode ? 'Update' : 'Log'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.notesInput, { color: textColor, borderColor: iconColor }]}
        placeholder="Notes (optional)"
        placeholderTextColor={iconColor}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={2}
        editable={!saving}
      />

      {showDatePicker && allowDateChange && (
        <DateTimePicker
          value={new Date(date + 'T00:00:00')}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  label: {
    fontSize: 18,
    lineHeight: 24,
    flex: 1,
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
