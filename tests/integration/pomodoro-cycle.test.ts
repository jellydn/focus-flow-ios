import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create a stateful mock storage
const mockStorage = new Map<string, string>();

// Mock AsyncStorage BEFORE importing services
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage.get(key) || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      mockStorage.delete(key);
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      mockStorage.clear();
      return Promise.resolve();
    }),
    getAllKeys: vi.fn(() => Promise.resolve(Array.from(mockStorage.keys()))),
    multiGet: vi.fn(() => Promise.resolve([])),
    multiSet: vi.fn(() => Promise.resolve()),
    mergeItem: vi.fn(() => Promise.resolve()),
    multiMerge: vi.fn(() => Promise.resolve()),
    multiRemove: vi.fn(() => Promise.resolve()),
    flushGetRequests: vi.fn(() => Promise.resolve()),
  },
}));

// Now import services after mocking
import { CycleService } from '@/services/cycle-service';
import { HistoryService } from '@/services/history-service';
import { SettingsService } from '@/services/settings-service';
import { TimerService } from '@/services/timer-service';

describe('Complete Pomodoro Cycle Integration Tests', () => {
  let timerService: any;
  let cycleService: any;
  let historyService: any;
  let settingsService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.clear(); // Clear mock storage between tests
    timerService = new TimerService();
    cycleService = new CycleService();
    historyService = new HistoryService();
    settingsService = new SettingsService();
  });

  describe('Full Pomodoro Cycle Flow', () => {
    it('should complete a full 4-work-session cycle with proper transitions', async () => {
      // Start new cycle
      const cycle = await cycleService.startNewCycle();
      expect(cycle.status).toBe('active');

      // Session 1: Work (25 minutes)
      let nextType = await cycleService.getNextSessionType();
      expect(nextType).toBe('work');

      const workDuration = settingsService.getWorkDuration();
      expect(workDuration).toBe(1500); // 25 minutes

      const workSession1 = await timerService.startSession('work', workDuration);
      expect(workSession1.type).toBe('work');
      expect(workSession1.duration).toBe(1500);

      // Simulate session completion
      await timerService.stopSession(); // Manual transition (MVP requirement)
      await historyService.recordCompletedSession('work', workDuration);
      await cycleService.recordSessionCompletion(workSession1.id);

      // Session 2: Short Break (5 minutes)
      nextType = await cycleService.getNextSessionType();
      expect(nextType).toBe('shortBreak');

      const shortBreakDuration = settingsService.getShortBreakDuration();
      expect(shortBreakDuration).toBe(300); // 5 minutes

      const breakSession1 = await timerService.startSession('shortBreak', shortBreakDuration);
      await timerService.stopSession();
      await historyService.recordCompletedSession('shortBreak', shortBreakDuration);
      await cycleService.recordSessionCompletion(breakSession1.id);

      // Verify cycle progress
      let progress = await cycleService.getCycleProgress();
      expect(progress).toMatchObject({
        currentPosition: 3,
        workSessionsCompleted: 1,
        shortBreaksCompleted: 1,
        longBreakCompleted: false,
        isComplete: false,
      });

      // Sessions 3-7: Continue work/break pattern
      for (let i = 2; i <= 4; i++) {
        // Work session
        nextType = await cycleService.getNextSessionType();
        expect(nextType).toBe('work');

        const workSession = await timerService.startSession('work', workDuration);
        await timerService.stopSession();
        await historyService.recordCompletedSession('work', workDuration);
        await cycleService.recordSessionCompletion(workSession.id);

        // Short break (except after 4th work session)
        if (i < 4) {
          nextType = await cycleService.getNextSessionType();
          expect(nextType).toBe('shortBreak');

          const breakSession = await timerService.startSession('shortBreak', shortBreakDuration);
          await timerService.stopSession();
          await historyService.recordCompletedSession('shortBreak', shortBreakDuration);
          await cycleService.recordSessionCompletion(breakSession.id);
        }
      }

      // Session 8: Long Break (15 minutes)
      nextType = await cycleService.getNextSessionType();
      expect(nextType).toBe('longBreak');

      const shouldTakeLongBreak = await cycleService.shouldTakeLongBreak();
      expect(shouldTakeLongBreak).toBe(true);

      const longBreakDuration = settingsService.getLongBreakDuration();
      expect(longBreakDuration).toBe(900); // 15 minutes

      const longBreakSession = await timerService.startSession('longBreak', longBreakDuration);
      await timerService.stopSession();
      await historyService.recordCompletedSession('longBreak', longBreakDuration);
      await cycleService.recordSessionCompletion(longBreakSession.id);

      // Verify cycle completion
      progress = await cycleService.getCycleProgress();
      expect(progress).toMatchObject({
        currentPosition: 8,
        workSessionsCompleted: 4,
        shortBreaksCompleted: 3,
        longBreakCompleted: true,
        isComplete: true,
      });

      // Complete the cycle
      const completedCycle = await cycleService.completeCycle();
      expect(completedCycle.status).toBe('completed');

      // Record cycle completion in history
      await historyService.recordCompletedCycle();

      // Verify history tracking
      const todayHistory = await historyService.getTodayHistory();
      expect(todayHistory.completedWorkSessions).toBe(4);
      expect(todayHistory.completedCycles).toBe(1);
      expect(todayHistory.totalFocusTime).toBe(6000); // 4 * 1500 seconds
    });

    it('should handle manual session transitions correctly (MVP requirement)', async () => {
      await cycleService.startNewCycle();

      // Start work session
      const workSession = await timerService.startSession('work', 1500);
      expect(workSession.status).toBe('running');

      // Manual stop (no automatic transition)
      const stoppedSession = await timerService.stopSession();
      expect(stoppedSession.status).toBe('idle');

      // Record completion manually (user responsibility in MVP)
      await historyService.recordCompletedSession('work', 1500);
      await cycleService.recordSessionCompletion(workSession.id);

      // User must manually start next session
      const nextType = await cycleService.getNextSessionType();
      expect(nextType).toBe('shortBreak');

      // User manually starts break
      const breakSession = await timerService.startSession('shortBreak', 300);
      expect(breakSession.status).toBe('running');
      expect(breakSession.type).toBe('shortBreak');
    });

    it('should persist session state across app lifecycle', async () => {
      await cycleService.startNewCycle();

      // Start work session
      const workSession = await timerService.startSession('work', 1500);

      // Simulate app backgrounding - timer should continue
      const backgroundSession = await timerService.handleBackgroundTimer();
      expect(backgroundSession.status).toMatch(/running|paused/);

      // Session should be recoverable
      const currentSession = await timerService.getCurrentSession();
      expect(currentSession?.id).toBe(workSession.id);

      // Cycle should be maintained
      const currentCycle = await cycleService.getCurrentCycle();
      expect(currentCycle?.status).toBe('active');
    });

    it('should track statistics accurately throughout cycle', async () => {
      const initialHistory = await historyService.getTodayHistory();
      const initialWorkSessions = initialHistory?.completedWorkSessions || 0;

      await cycleService.startNewCycle();

      // Complete 2 work sessions
      for (let i = 1; i <= 2; i++) {
        const workSession = await timerService.startSession('work', 1500);
        await timerService.stopSession();
        await historyService.recordCompletedSession('work', 1500);
        await cycleService.recordSessionCompletion(workSession.id);

        if (i === 1) {
          // Complete first break
          const breakSession = await timerService.startSession('shortBreak', 300);
          await timerService.stopSession();
          await historyService.recordCompletedSession('shortBreak', 300);
          await cycleService.recordSessionCompletion(breakSession.id);
        }
      }

      // Verify incremental tracking
      const updatedHistory = await historyService.getTodayHistory();
      expect(updatedHistory.completedWorkSessions).toBe(initialWorkSessions + 2);
      expect(updatedHistory.totalFocusTime).toBeGreaterThanOrEqual(3000); // At least 2 * 1500

      // Verify cycle progress
      const progress = await cycleService.getCycleProgress();
      expect(progress.workSessionsCompleted).toBe(2);
      expect(progress.shortBreaksCompleted).toBe(1);
    });
  });

  describe('Pause and Resume Flow Integration', () => {
    it('should handle pause/resume during work sessions', async () => {
      await cycleService.startNewCycle();

      // Start work session
      const workSession = await timerService.startSession('work', 1500);
      expect(workSession.status).toBe('running');

      // Pause session
      const pausedSession = await timerService.pauseSession();
      expect(pausedSession.status).toBe('paused');
      expect(pausedSession.remainingTime).toBe(1500);

      // Resume session
      const resumedSession = await timerService.resumeSession();
      expect(resumedSession.status).toBe('running');
      expect(resumedSession.remainingTime).toBe(1500);

      // Complete session
      await timerService.stopSession();
      await historyService.recordCompletedSession('work', 1500);
      await cycleService.recordSessionCompletion(workSession.id);

      // Verify session recorded correctly
      const progress = await cycleService.getCycleProgress();
      expect(progress.workSessionsCompleted).toBe(1);
    });

    it('should maintain pause state across background/foreground transitions', async () => {
      await cycleService.startNewCycle();

      // Start and pause session
      const workSession = await timerService.startSession('work', 1500);
      await timerService.pauseSession();

      // Simulate app backgrounding
      const backgroundSession = await timerService.handleBackgroundTimer();
      expect(backgroundSession.status).toBe('paused');
      expect(backgroundSession.id).toBe(workSession.id);

      // Should remain paused when returning to foreground
      const currentSession = await timerService.getCurrentSession();
      expect(currentSession?.status).toBe('paused');
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should recover gracefully from incomplete cycles', async () => {
      const cycle = await cycleService.startNewCycle();

      // Start some sessions but don't complete cycle
      const workSession = await timerService.startSession('work', 1500);
      await timerService.stopSession();
      await cycleService.recordSessionCompletion(workSession.id);

      // Abandon current cycle
      await cycleService.abandonCycle();

      // Should be able to start new cycle
      const newCycle = await cycleService.startNewCycle();
      expect(newCycle.id).not.toBe(cycle.id);
      expect(newCycle.status).toBe('active');

      const progress = await cycleService.getCycleProgress();
      expect(progress.currentPosition).toBe(1);
      expect(progress.workSessionsCompleted).toBe(0);
    });

    it('should handle session completion without active cycle', async () => {
      // Try to complete session without active cycle
      await expect(cycleService.recordSessionCompletion('invalid-session-id')).rejects.toThrow();

      // Should not affect history
      const history = await historyService.getTodayHistory();
      expect(history.completedWorkSessions).toBe(0);
    });

    it('should validate session types match cycle expectations', async () => {
      await cycleService.startNewCycle();

      // First session should be work
      const nextType = await cycleService.getNextSessionType();
      expect(nextType).toBe('work');

      // Starting wrong session type should be handled gracefully
      const breakSession = await timerService.startSession('shortBreak', 300);

      // Implementation should either prevent this or handle the mismatch
      expect(breakSession).toBeTruthy();
    });
  });

  describe('Settings Integration', () => {
    it('should use current settings for session durations', async () => {
      // Verify fixed durations in MVP
      expect(settingsService.getWorkDuration()).toBe(1500);
      expect(settingsService.getShortBreakDuration()).toBe(300);
      expect(settingsService.getLongBreakDuration()).toBe(900);

      await cycleService.startNewCycle();

      // Start sessions with settings-defined durations
      const workSession = await timerService.startSession(
        'work',
        settingsService.getWorkDuration(),
      );
      expect(workSession.duration).toBe(1500);

      await timerService.stopSession();
      await cycleService.recordSessionCompletion(workSession.id);

      const breakSession = await timerService.startSession(
        'shortBreak',
        settingsService.getShortBreakDuration(),
      );
      expect(breakSession.duration).toBe(300);
    });

    it('should respect notification settings during sessions', async () => {
      const settings = await settingsService.getSettings();
      if (settings.notificationsEnabled) {
        await cycleService.startNewCycle();
        const workSession = await timerService.startSession('work', 1500);

        // Should schedule notification for session completion
        await expect(timerService.scheduleNotification(workSession)).resolves.not.toThrow();
      }
    });
  });
});
