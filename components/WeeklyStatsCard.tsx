import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { WeeklyStats } from '@/types/data';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface WeeklyStatsCardProps {
  stats: WeeklyStats;
}

export const WeeklyStatsCard: React.FC<WeeklyStatsCardProps> = ({ stats }) => {
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const formatWeight = (weight: number | null) => {
    return weight !== null ? `${weight.toFixed(1)} kg` : 'N/A';
  };

  const formatWaist = (waist: number | null) => {
    return waist !== null ? `${waist.toFixed(1)} cm` : 'N/A';
  };

  const formatChange = (change: number | null) => {
    if (change === null) return null;
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)} kg`;
  };

  const formatWaistChange = (change: number | null) => {
    if (change === null) return null;
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)} cm`;
  };

  const getChangeColor = (change: number | null) => {
    if (change === null) return iconColor;
    return change < 0 ? '#2ecc71' : change > 0 ? '#e74c3c' : iconColor;
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mainStat}>
        <ThemedText type="subtitle" style={styles.label}>
          Week Average
        </ThemedText>
        <ThemedText type="title" style={[styles.mainValue, { color: tintColor }]}>
          {formatWeight(stats.weightAverage)}
        </ThemedText>
        {stats.weekOverWeekChange !== null && (
          <ThemedText
            style={[
              styles.change,
              { color: getChangeColor(stats.weekOverWeekChange) },
            ]}>
            {formatChange(stats.weekOverWeekChange)} vs last week
          </ThemedText>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statLabel}>Min</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.statValue}>
            {formatWeight(stats.weightMin)}
          </ThemedText>
        </View>

        <View style={[styles.verticalDivider, { backgroundColor: iconColor }]} />

        <View style={styles.statItem}>
          <ThemedText style={styles.statLabel}>Max</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.statValue}>
            {formatWeight(stats.weightMax)}
          </ThemedText>
        </View>

        <View style={[styles.verticalDivider, { backgroundColor: iconColor }]} />

        <View style={styles.statItem}>
          <ThemedText style={styles.statLabel}>Entries</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.statValue}>
            {stats.weightCount}
          </ThemedText>
        </View>
      </View>

      {stats.waistMeasurements.length > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.waistSection}>
            <ThemedText type="subtitle" style={styles.label}>
              Waist Measurement
            </ThemedText>
            <ThemedText type="title" style={[styles.mainValue, { color: tintColor }]}>
              {formatWaist(stats.currentWeekWaist)}
            </ThemedText>
            {stats.waistWeekOverWeekChange !== null && (
              <ThemedText
                style={[
                  styles.change,
                  { color: getChangeColor(stats.waistWeekOverWeekChange) },
                ]}>
                {formatWaistChange(stats.waistWeekOverWeekChange)} vs last week
              </ThemedText>
            )}
            <View style={styles.waistEntries}>
              {stats.waistMeasurements.map((entry) => (
                <ThemedText key={entry.id} style={styles.waistEntry}>
                  {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                  : {entry.measurement.toFixed(1)} cm
                </ThemedText>
              ))}
            </View>
          </View>
        </>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  mainStat: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.8,
  },
  mainValue: {
    fontSize: 40,
    lineHeight: 48,
  },
  change: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    opacity: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 18,
    lineHeight: 24,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    opacity: 0.3,
  },
  waistSection: {
    gap: 8,
    alignItems: 'center',
  },
  waistEntries: {
    gap: 4,
    marginTop: 8,
    alignItems: 'center',
  },
  waistEntry: {
    fontSize: 14,
  },
});
