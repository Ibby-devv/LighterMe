import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatWeekRange } from '@/services/storageService';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface WeekNavigatorProps {
  weekStart: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  isCurrentWeek?: boolean;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  weekStart,
  onPrevious,
  onNext,
  onToday,
  isCurrentWeek = false,
}) => {
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onPrevious}
          style={styles.navButton}>
          <ThemedText style={[styles.navButtonText, { color: tintColor }]}>‹</ThemedText>
        </TouchableOpacity>

        <View style={styles.weekDisplay}>
          <ThemedText type="defaultSemiBold" style={styles.weekText}>
            {formatWeekRange(weekStart)}
          </ThemedText>
        </View>

        <TouchableOpacity
          onPress={onNext}
          style={styles.navButton}>
          <ThemedText style={[styles.navButtonText, { color: tintColor }]}>›</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.todayButtonContainer}>
        {!isCurrentWeek && (
          <TouchableOpacity
            onPress={onToday}
            style={[styles.todayButton, { backgroundColor: tintColor }]}>
            <ThemedText style={[styles.todayButtonText, { color: '#fff' }]}>
              Go to Current Week
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 32,
    fontWeight: '300',
  },
  weekDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  weekText: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  todayButtonContainer: {
    minHeight: 50,
    justifyContent: 'center',
  },
  todayButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
