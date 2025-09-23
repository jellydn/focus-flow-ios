import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { HistoryService } from '@/services/history-service';
import type { SessionHistory, WeeklyStats, DailyAggregate } from '@/types/session-history';

export function HistoryScreen() {
  const [todayHistory, setTodayHistory] = useState<SessionHistory | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [totalFocusTime, setTotalFocusTime] = useState<number>(0);
  const [recentAggregates, setRecentAggregates] = useState<DailyAggregate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [historyService] = useState(() => new HistoryService());

  const loadHistoryData = React.useCallback(async () => {
    try {
      setIsLoading(true);

      // Load today's history
      const today = await historyService.getTodayHistory();
      setTodayHistory(today);

      // Load weekly stats
      const weekly = await historyService.getWeeklyStats();
      setWeeklyStats(weekly);

      // Load current streak
      const streak = await historyService.getCurrentStreak();
      setCurrentStreak(streak);

      // Load total focus time
      const totalTime = await historyService.getTotalFocusTime();
      setTotalFocusTime(totalTime);

      // Load recent daily aggregates (last 7 days)
      const aggregates = await historyService.getDailyAggregates(1);
      setRecentAggregates(aggregates.slice(-7));
    } catch (error) {
      console.error('Failed to load history data:', error);
      Alert.alert('Error', 'Failed to load history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [historyService]);

  // Setup event listeners
  useEffect(() => {
    historyService.onHistoryUpdate(() => {
      loadHistoryData();
    });

    historyService.onStreakUpdate((streak: number) => {
      setCurrentStreak(streak);
    });
  }, [historyService, loadHistoryData]);

  // Reload data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadHistoryData();
    }, [loadHistoryData])
  );

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStreakEmoji = (days: number): string => {
    if (days >= 30) return '🔥🔥🔥';
    if (days >= 14) return '🔥🔥';
    if (days >= 7) return '🔥';
    if (days >= 3) return '⭐';
    return '📅';
  };

  const clearAllHistory = async () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to clear all history data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await historyService.cleanupOldHistory();
              await historyService.cleanupOldAggregates();
              await loadHistoryData();
              Alert.alert('Success', 'History has been cleared.');
            } catch (error) {
              console.error('Failed to clear history:', error);
              Alert.alert('Error', 'Failed to clear history. Please try again.');
            }
          },
        },
      ],
    );
  };

  const renderStatCard = (
    title: string,
    value: string | number,
    subtitle?: string,
    color: string = '#3498DB',
  ) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderRecentDay = (aggregate: DailyAggregate, index: number) => (
    <View key={index} style={styles.dayItem}>
      <Text style={styles.dayDate}>{formatDate(aggregate.date)}</Text>
      <View style={styles.dayStats}>
        <Text style={styles.daySessionCount}>{aggregate.sessionsCompleted}</Text>
        <Text style={styles.daySessionLabel}>sessions</Text>
      </View>
      <Text style={styles.dayFocusTime}>
        {aggregate.focusTimeMinutes > 0 ? `${aggregate.focusTimeMinutes}m` : '--'}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>{/* Could add a loading spinner here */}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>Track your focus journey</Text>
        </View>

        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Work Sessions',
              todayHistory?.completedWorkSessions || 0,
              undefined,
              '#E74C3C',
            )}
            {renderStatCard(
              'Focus Time',
              formatDuration(todayHistory?.totalFocusTime || 0),
              undefined,
              '#27AE60',
            )}
            {renderStatCard('Cycles', todayHistory?.completedCycles || 0, undefined, '#3498DB')}
            {renderStatCard(
              'Streak',
              `${currentStreak} ${getStreakEmoji(currentStreak)}`,
              currentStreak === 1 ? 'day' : 'days',
              '#F39C12',
            )}
          </View>
        </View>

        {/* Weekly Overview */}
        {weeklyStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <View style={styles.weeklyOverview}>
              <View style={styles.weeklyRow}>
                <Text style={styles.weeklyLabel}>Total Sessions</Text>
                <Text style={styles.weeklyValue}>{weeklyStats.totalSessions}</Text>
              </View>
              <View style={styles.weeklyRow}>
                <Text style={styles.weeklyLabel}>Focus Hours</Text>
                <Text style={styles.weeklyValue}>{weeklyStats.totalFocusHours.toFixed(1)}h</Text>
              </View>
              <View style={styles.weeklyRow}>
                <Text style={styles.weeklyLabel}>Daily Average</Text>
                <Text style={styles.weeklyValue}>
                  {weeklyStats.averageSessionsPerDay.toFixed(1)}
                </Text>
              </View>
              <View style={styles.weeklyRow}>
                <Text style={styles.weeklyLabel}>Best Day</Text>
                <Text style={styles.weeklyValue}>{formatDate(weeklyStats.bestDay)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.recentActivity}>
            {recentAggregates.length > 0 ? (
              recentAggregates.map((aggregate, index) => renderRecentDay(aggregate, index))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No activity yet</Text>
                <Text style={styles.emptySubtext}>
                  Start a focus session to see your progress here
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Overall Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Time</Text>
          <View style={styles.overallStats}>
            <View style={styles.overallItem}>
              <Text style={styles.overallValue}>{formatDuration(totalFocusTime)}</Text>
              <Text style={styles.overallLabel}>Total Focus Time</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.clearButton} onPress={clearAllHistory}>
            <Text style={styles.clearButtonText}>Clear All History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#BDC3C7',
  },
  weeklyOverview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  weeklyLabel: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  weeklyValue: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  recentActivity: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayDate: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
    width: 60,
  },
  dayStats: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 16,
  },
  daySessionCount: {
    fontSize: 16,
    color: '#E74C3C',
    fontWeight: '600',
    marginRight: 4,
  },
  daySessionLabel: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  dayFocusTime: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '500',
    width: 50,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BDC3C7',
    textAlign: 'center',
  },
  overallStats: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  overallItem: {
    alignItems: 'center',
  },
  overallValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  overallLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  clearButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HistoryScreen;
