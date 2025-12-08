import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface WaistInputProps {
  onSave: (measurement: number, notes?: string) => Promise<void>;
  initialMeasurement?: number;
  initialNotes?: string;
  editMode?: boolean;
  date: string;
}

export const WaistInput: React.FC<WaistInputProps> = ({
  onSave,
  initialMeasurement,
  initialNotes,
  editMode = false,
  date,
}) => {
  const [measurement, setMeasurement] = useState(initialMeasurement?.toString() || '');
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const handleSave = async () => {
    const measurementNum = parseFloat(measurement);
    
    if (!measurement || isNaN(measurementNum) || measurementNum <= 0) {
      Alert.alert('Invalid Measurement', 'Please enter a valid waist measurement');
      return;
    }

    if (measurementNum > 300) {
      Alert.alert('Invalid Measurement', 'Measurement seems too high. Please check your entry.');
      return;
    }

    setSaving(true);
    try {
      await onSave(measurementNum, notes.trim() || undefined);
      if (!editMode) {
        setMeasurement('');
        setNotes('');
      }
    } catch {
      Alert.alert('Error', 'Failed to save waist measurement');
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

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="defaultSemiBold" style={styles.label}>
        {editMode ? 'Edit Waist' : 'Log Waist'} - {formatDate(date)}
      </ThemedText>
      
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: iconColor }]}
          placeholder="Waist (cm)"
          placeholderTextColor={iconColor}
          keyboardType="decimal-pad"
          value={measurement}
          onChangeText={setMeasurement}
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
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  label: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
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
