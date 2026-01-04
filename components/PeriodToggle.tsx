import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ComparisonPeriod } from '@/types/data';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface PeriodToggleProps {
  selectedPeriod: ComparisonPeriod;
  onPeriodChange: (period: ComparisonPeriod) => void;
}

export const PeriodToggle: React.FC<PeriodToggleProps> = ({ selectedPeriod, onPeriodChange }) => {
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const iconColor = useThemeColor({}, 'icon');

  const periods: ComparisonPeriod[] = ['1w', '2w', '4w'];

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.label}>Compare to:</ThemedText>
      <View style={styles.toggleContainer}>
        {periods.map((period) => {
          const isSelected = selectedPeriod === period;
          return (
            <TouchableOpacity
              key={period}
              onPress={() => onPeriodChange(period)}
              style={[
                styles.toggleButton,
                {
                  backgroundColor: isSelected ? tintColor : backgroundColor,
                  borderColor: isSelected ? tintColor : iconColor,
                },
              ]}>
              <ThemedText
                style={[
                  styles.toggleText,
                  {
                    color: isSelected ? '#fff' : iconColor,
                  },
                ]}>
                {period}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  label: {
    fontSize: 14,
    opacity: 0.8,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
