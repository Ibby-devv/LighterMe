import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { WeightEntry } from '@/types/data';
import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

interface WeightEntryItemProps {
  entry: WeightEntry;
  onEdit: (entry: WeightEntry) => void;
  onDelete: (id: string) => void;
  isMinWeight?: boolean;
  isMaxWeight?: boolean;
}

export const WeightEntryItem = React.memo<WeightEntryItemProps>(({
  entry,
  onEdit,
  onDelete,
  isMinWeight = false,
  isMaxWeight = false,
}) => {
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  const formatDate = (dateString: string) => {
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this weight entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(entry.id),
        },
      ]
    );
  };

  const getBadgeColor = () => {
    if (isMinWeight) return '#2ecc71';
    if (isMaxWeight) return '#e74c3c';
    return null;
  };

  const badgeColor = getBadgeColor();
  return (
    <ThemedView style={[styles.container, badgeColor && { borderLeftWidth: 4, borderLeftColor: badgeColor }]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <ThemedText type="defaultSemiBold" style={styles.date}>
            {formatDate(entry.date)}
          </ThemedText>
          {entry.notes && (
            <ThemedText style={[styles.notes, { color: iconColor }]} numberOfLines={1}>
              {entry.notes}
            </ThemedText>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(entry)} style={styles.iconButton}>
            <ThemedText style={[styles.icon, { color: tintColor }]}>✎</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
            <ThemedText style={[styles.icon, { color: '#e74c3c' }]}>✕</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.weightSection}>
          <ThemedText type="title" style={[styles.weight, { color: tintColor }]}>
            {entry.weight.toFixed(1)}
          </ThemedText>
          <ThemedText style={[styles.unit, { color: iconColor }]}>kg</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
});

WeightEntryItem.displayName = 'WeightEntryItem';

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leftSection: {
    flex: 1,
    gap: 2,
  },
  date: {
    fontSize: 14,
    lineHeight: 18,
  },
  notes: {
    fontSize: 11,
    lineHeight: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
  },
  icon: {
    fontSize: 18,
    lineHeight: 18,
  },
  weightSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  weight: {
    fontSize: 22,
    lineHeight: 26,
  },
  unit: {
    fontSize: 12,
  },
});
