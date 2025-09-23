import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SessionType } from '@/types/timer-session';

interface TimerDisplayProps {
  remainingTime: number; // in seconds
  sessionType: SessionType;
  isRunning: boolean;
  isPaused: boolean;
}

export function TimerDisplay({
  remainingTime,
  sessionType,
  isRunning,
  isPaused
}: TimerDisplayProps) {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSessionTitle = (type: SessionType): string => {
    switch (type) {
      case 'work':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Timer';
    }
  };

  const getSessionColor = (type: SessionType): string => {
    switch (type) {
      case 'work':
        return '#E74C3C'; // Red
      case 'shortBreak':
        return '#27AE60'; // Green
      case 'longBreak':
        return '#3498DB'; // Blue
      default:
        return '#95A5A6'; // Gray
    }
  };

  const getStatusText = (): string => {
    if (isPaused) return 'Paused';
    if (isRunning) return 'Running';
    return 'Ready';
  };

  const sessionColor = getSessionColor(sessionType);

  return (
    <View style={styles.container}>
      <View style={styles.sessionHeader}>
        <Text style={[styles.sessionTitle, { color: sessionColor }]}>
          {getSessionTitle(sessionType)}
        </Text>
        <Text style={[styles.statusText, { color: sessionColor }]}>
          {getStatusText()}
        </Text>
      </View>

      <View style={styles.timeContainer}>
        <Text style={[styles.timeDisplay, { color: sessionColor }]}>
          {formatTime(remainingTime)}
        </Text>
      </View>

      <View style={styles.progressIndicator}>
        <View
          style={[
            styles.progressDot,
            { backgroundColor: isRunning ? sessionColor : '#E5E5E5' }
          ]}
        />
        <View
          style={[
            styles.progressDot,
            { backgroundColor: isPaused ? '#F39C12' : '#E5E5E5' }
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  sessionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '400',
    opacity: 0.8,
  },
  timeContainer: {
    marginBottom: 30,
  },
  timeDisplay: {
    fontSize: 72,
    fontWeight: '200',
    fontFamily: 'System',
    letterSpacing: -2,
  },
  progressIndicator: {
    flexDirection: 'row',
    gap: 12,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default TimerDisplay;