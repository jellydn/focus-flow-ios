import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CycleProgress as CycleProgressType } from '@/types/pomodoro-cycle';
import type { SessionType } from '@/types/timer-session';

interface CycleProgressProps {
  progress: CycleProgressType;
  nextSessionType: SessionType;
}

export function CycleProgress({ progress, nextSessionType }: CycleProgressProps) {
  const getSessionColor = (type: SessionType): string => {
    switch (type) {
      case 'work':
        return '#E74C3C';
      case 'shortBreak':
        return '#27AE60';
      case 'longBreak':
        return '#3498DB';
      default:
        return '#95A5A6';
    }
  };

  const getSessionIcon = (type: SessionType): string => {
    switch (type) {
      case 'work':
        return '🎯';
      case 'shortBreak':
        return '☕';
      case 'longBreak':
        return '🌟';
      default:
        return '⏰';
    }
  };

  const getNextSessionLabel = (type: SessionType): string => {
    switch (type) {
      case 'work':
        return 'Focus Session';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Session';
    }
  };

  const renderProgressDots = () => {
    const dots = [];

    // Create 8 dots representing the cycle workflow
    const workflow = [
      'work',
      'shortBreak',
      'work',
      'shortBreak',
      'work',
      'shortBreak',
      'work',
      'longBreak',
    ];

    for (let i = 0; i < 8; i++) {
      const position = i + 1;
      const sessionType = workflow[i] as SessionType;
      const isCompleted = position < progress.currentPosition;
      const isCurrent = position === progress.currentPosition;

      let dotColor = '#E5E5E5'; // Default gray
      if (isCompleted) {
        dotColor = getSessionColor(sessionType);
      } else if (isCurrent) {
        dotColor = getSessionColor(sessionType);
      }

      dots.push(
        <View
          key={i}
          style={[
            styles.progressDot,
            {
              backgroundColor: dotColor,
              borderWidth: isCurrent ? 2 : 0,
              borderColor: isCurrent ? dotColor : 'transparent',
              opacity: isCurrent ? 1 : isCompleted ? 0.8 : 0.3,
              transform: [{ scale: isCurrent ? 1.2 : 1 }],
            },
          ]}
        />,
      );
    }

    return dots;
  };

  const nextSessionColor = getSessionColor(nextSessionType);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cycle Progress</Text>
        <Text style={styles.position}>
          {progress.currentPosition} of {progress.totalPositions}
        </Text>
      </View>

      <View style={styles.progressRow}>{renderProgressDots()}</View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{progress.workSessionsCompleted}</Text>
          <Text style={styles.statLabel}>Work Sessions</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{progress.shortBreaksCompleted}</Text>
          <Text style={styles.statLabel}>Short Breaks</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{progress.longBreakCompleted ? 1 : 0}</Text>
          <Text style={styles.statLabel}>Long Break</Text>
        </View>
      </View>

      {!progress.isComplete && (
        <View style={styles.nextSession}>
          <Text style={styles.nextLabel}>Next:</Text>
          <View style={[styles.nextBadge, { backgroundColor: nextSessionColor }]}>
            <Text style={styles.nextIcon}>{getSessionIcon(nextSessionType)}</Text>
            <Text style={styles.nextText}>{getNextSessionLabel(nextSessionType)}</Text>
          </View>
        </View>
      )}

      {progress.isComplete && (
        <View style={styles.completeBadge}>
          <Text style={styles.completeIcon}>🎉</Text>
          <Text style={styles.completeText}>Cycle Complete!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  position: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
    textAlign: 'center',
  },
  nextSession: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  nextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  nextIcon: {
    fontSize: 16,
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  completeIcon: {
    fontSize: 20,
  },
  completeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27AE60',
  },
});

export default CycleProgress;
