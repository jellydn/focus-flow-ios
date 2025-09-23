import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { SessionType } from '@/types/timer-session';

interface ProgressRingProps {
  progress: number; // 0 to 1
  size: number;
  strokeWidth: number;
  sessionType: SessionType;
  backgroundColor?: string;
}

export function ProgressRing({
  progress,
  size,
  strokeWidth,
  sessionType,
  backgroundColor = '#E5E5E5',
}: ProgressRingProps) {
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

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke dash array for progress
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - progress);

  const progressColor = getSessionColor(sessionType);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
});

export default ProgressRing;
