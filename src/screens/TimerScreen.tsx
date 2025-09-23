import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import CycleProgress from '@/components/CycleProgress';
import ProgressRing from '@/components/ProgressRing';
import TimerControls from '@/components/TimerControls';
import TimerDisplay from '@/components/TimerDisplay';
import { CycleService } from '@/services/cycle-service';
import { NotificationService } from '@/services/notification-service';
import { SettingsService } from '@/services/settings-service';
import { TimerService } from '@/services/timer-service';
import type { CycleProgress as CycleProgressType } from '@/types/pomodoro-cycle';
import type { SessionStatus, SessionType, TimerSession } from '@/types/timer-session';

export function TimerScreen() {
  const [currentSession, setCurrentSession] = useState<TimerSession | null>(null);
  const [cycleProgress, setCycleProgress] = useState<CycleProgressType | null>(null);
  const [nextSessionType, setNextSessionType] = useState<SessionType>('work');
  const [isLoading, setIsLoading] = useState(true);

  // Services
  const [timerService] = useState(() => new TimerService());
  const [cycleService] = useState(() => new CycleService());
  const [settingsService] = useState(() => new SettingsService());
  const [notificationService] = useState(() => new NotificationService());

  const updateNextSessionType = useCallback(async () => {
    try {
      const nextType = await cycleService.getNextSessionType();
      setNextSessionType(nextType);
    } catch (error) {
      console.error('Failed to get next session type:', error);
    }
  }, [cycleService]);

  const getSessionCompleteMessage = useCallback(
    (completed: SessionType, next: SessionType): string => {
      if (completed === 'work') {
        return next === 'longBreak'
          ? "Excellent work! Time for a long break - you've earned it!"
          : 'Great focus! Time for a short break.';
      }

      if (completed === 'longBreak') {
        return "Refreshed and ready! Let's start a new Pomodoro cycle.";
      }

      return 'Break time over! Ready to get back to work?';
    },
    [],
  );

  const handleSessionComplete = useCallback(
    async (session: TimerSession) => {
      try {
        // Record session completion in cycle
        await cycleService.recordSessionCompletion(session.id);

        // Show completion notification
        const nextType = await cycleService.getNextSessionType();
        const message = getSessionCompleteMessage(session.type, nextType);

        Alert.alert('Session Complete! ✨', message, [{ text: 'Continue', onPress: () => {} }]);
      } catch (error) {
        console.error('Failed to handle session completion:', error);
      }
    },
    [cycleService, getSessionCompleteMessage],
  );

  const startNewCycle = useCallback(async () => {
    try {
      await cycleService.startNewCycle();
      const progress = await cycleService.getCycleProgress();
      setCycleProgress(progress);
      await updateNextSessionType();
    } catch (error) {
      console.error('Failed to start new cycle:', error);
    }
  }, [cycleService, updateNextSessionType]);

  const setupEventListeners = useCallback(() => {
    // Timer events
    timerService.onSessionStateChange((session: TimerSession) => {
      setCurrentSession(session);
    });

    timerService.onSessionTick((remainingTime: number) => {
      setCurrentSession((prev) => (prev ? { ...prev, remainingTime } : null));
    });

    timerService.onSessionComplete((session: TimerSession) => {
      handleSessionComplete(session);
    });

    // Cycle events
    cycleService.onProgressUpdate((progress: CycleProgressType) => {
      setCycleProgress(progress);
      updateNextSessionType();
    });

    cycleService.onCycleComplete(() => {
      Alert.alert(
        'Cycle Complete! 🎉',
        "Great job! You've completed a full Pomodoro cycle. Ready to start a new one?",
        [
          { text: 'Take a Break', style: 'cancel' },
          { text: 'Start New Cycle', onPress: startNewCycle },
        ],
      );
    });
  }, [timerService, cycleService, handleSessionComplete, startNewCycle, updateNextSessionType]);

  const getSessionDuration = useCallback(
    (type: SessionType): number => {
      switch (type) {
        case 'work':
          return settingsService.getWorkDuration();
        case 'shortBreak':
          return settingsService.getShortBreakDuration();
        case 'longBreak':
          return settingsService.getLongBreakDuration();
        default:
          return 1500;
      }
    },
    [settingsService],
  );

  // Initialize services and load current state
  const initializeServices = useCallback(async () => {
    try {
      setIsLoading(true);

      // Initialize notification service
      await notificationService.initialize();

      // Load current session
      const session = await timerService.getCurrentSession();
      setCurrentSession(session);

      // Load or start cycle
      let cycle = await cycleService.getCurrentCycle();
      if (!cycle) {
        cycle = await cycleService.startNewCycle();
      }

      const progress = await cycleService.getCycleProgress();
      setCycleProgress(progress);

      const nextType = await cycleService.getNextSessionType();
      setNextSessionType(nextType);

      // Setup event listeners
      setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize services:', error);
      Alert.alert('Error', 'Failed to initialize timer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [timerService, cycleService, notificationService, setupEventListeners]);

  const startSession = useCallback(async () => {
    try {
      const duration = getSessionDuration(nextSessionType);
      const cyclePos = cycleProgress?.currentPosition || 1;

      const session = await timerService.startSession(nextSessionType, duration);

      // Update session with cycle position
      session.cyclePosition = cyclePos;

      // Schedule notification
      await notificationService.scheduleSessionCompletion(session);

      setCurrentSession(session);
    } catch (error) {
      console.error('Failed to start session:', error);
      Alert.alert('Error', 'Failed to start timer. Please try again.');
    }
  }, [timerService, notificationService, nextSessionType, cycleProgress, getSessionDuration]);

  const pauseSession = useCallback(async () => {
    try {
      const session = await timerService.pauseSession();
      setCurrentSession(session);
    } catch (error) {
      console.error('Failed to pause session:', error);
    }
  }, [timerService]);

  const resumeSession = useCallback(async () => {
    try {
      const session = await timerService.resumeSession();
      setCurrentSession(session);
    } catch (error) {
      console.error('Failed to resume session:', error);
    }
  }, [timerService]);

  const stopSession = useCallback(async () => {
    try {
      await timerService.stopSession();
      await notificationService.cancelAllNotifications();
      setCurrentSession(null);
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
  }, [timerService, notificationService]);

  const resetSession = useCallback(async () => {
    try {
      const session = await timerService.resetSession();
      await notificationService.cancelAllNotifications();
      setCurrentSession(session);
    } catch (error) {
      console.error('Failed to reset session:', error);
    }
  }, [timerService, notificationService]);

  const calculateProgress = (): number => {
    if (!currentSession) return 0;
    return 1 - currentSession.remainingTime / currentSession.duration;
  };

  const getSessionStatus = (): SessionStatus => {
    if (!currentSession) return 'idle';
    return currentSession.status;
  };

  // Initialize on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      initializeServices();
    }, [initializeServices]),
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.timerSection}>
          <View style={styles.progressRingContainer}>
            <ProgressRing
              progress={calculateProgress()}
              size={280}
              strokeWidth={8}
              sessionType={currentSession?.type || nextSessionType}
            />
            <View style={styles.timerDisplayOverlay}>
              <TimerDisplay
                remainingTime={currentSession?.remainingTime || getSessionDuration(nextSessionType)}
                sessionType={currentSession?.type || nextSessionType}
                isRunning={getSessionStatus() === 'running'}
                isPaused={getSessionStatus() === 'paused'}
              />
            </View>
          </View>

          <TimerControls
            status={getSessionStatus()}
            sessionType={currentSession?.type || nextSessionType}
            onStart={startSession}
            onPause={pauseSession}
            onResume={resumeSession}
            onStop={stopSession}
            onReset={resetSession}
          />
        </View>

        {cycleProgress && (
          <CycleProgress progress={cycleProgress} nextSessionType={nextSessionType} />
        )}
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  timerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  progressRingContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  timerDisplayOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TimerScreen;
