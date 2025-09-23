import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { SessionStatus, SessionType } from '@/types/timer-session';

interface TimerControlsProps {
  status: SessionStatus;
  sessionType?: SessionType;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export function TimerControls({
  status,
  sessionType,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  disabled = false,
}: TimerControlsProps) {
  const getSessionColor = (type?: SessionType): string => {
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

  const primaryColor = getSessionColor(sessionType);

  const renderPrimaryButton = () => {
    switch (status) {
      case 'idle':
        return (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: primaryColor }]}
            onPress={onStart}
            disabled={disabled}
          >
            <Text style={styles.primaryButtonText}>Start</Text>
          </TouchableOpacity>
        );
      case 'running':
        return (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#F39C12' }]}
            onPress={onPause}
            disabled={disabled}
          >
            <Text style={styles.primaryButtonText}>Pause</Text>
          </TouchableOpacity>
        );
      case 'paused':
        return (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: primaryColor }]}
            onPress={onResume}
            disabled={disabled}
          >
            <Text style={styles.primaryButtonText}>Resume</Text>
          </TouchableOpacity>
        );
      case 'completed':
        return (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: primaryColor }]}
            onPress={onStart}
            disabled={disabled}
          >
            <Text style={styles.primaryButtonText}>Start New</Text>
          </TouchableOpacity>
        );
      default:
        return (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#BDC3C7' }]}
            disabled={true}
          >
            <Text style={styles.primaryButtonText}>--</Text>
          </TouchableOpacity>
        );
    }
  };

  const renderSecondaryButtons = () => {
    if (status === 'idle') {
      return null;
    }

    return (
      <View style={styles.secondaryButtons}>
        <TouchableOpacity
          style={[styles.secondaryButton, styles.stopButton]}
          onPress={onStop}
          disabled={disabled}
        >
          <Text style={styles.secondaryButtonText}>Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, styles.resetButton]}
          onPress={onReset}
          disabled={disabled}
        >
          <Text style={styles.secondaryButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.primaryControls}>{renderPrimaryButton()}</View>

      {renderSecondaryButtons()}

      {status === 'completed' && (
        <View style={styles.completionMessage}>
          <Text style={styles.completionText}>
            {sessionType === 'work'
              ? '🎉 Great focus! Time for a break.'
              : '✨ Break complete! Ready to focus?'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  primaryControls: {
    marginBottom: 20,
  },
  primaryButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 50,
    minWidth: 160,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  stopButton: {
    borderColor: '#E74C3C',
    backgroundColor: 'transparent',
  },
  resetButton: {
    borderColor: '#95A5A6',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495E',
  },
  completionMessage: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  completionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#2C3E50',
    fontWeight: '500',
  },
});

export default TimerControls;
