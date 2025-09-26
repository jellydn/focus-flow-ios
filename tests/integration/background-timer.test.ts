import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

// Now import services after mocking AsyncStorage
import { AppStateService } from '@/services/app-state-service';
import { BackgroundTimerService } from '@/services/background-timer';
import { TimerService } from '@/services/timer-service';

describe('Background Timer Recovery Integration Tests', () => {
  let timerService: any;
  let backgroundTimerService: any;
  let appStateService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.clear(); // Clear mock storage between tests
    vi.useFakeTimers(); // Enable fake timers for time manipulation
    timerService = new TimerService();
    backgroundTimerService = timerService.getBackgroundTimerService(); // Use the same instance
    appStateService = new AppStateService();
  });

  afterEach(() => {
    vi.useRealTimers(); // Restore real timers after each test
  });

  describe('Background Timer Continuity', () => {
    it('should maintain timer accuracy during background operation', async () => {
      // Start work session
      const _startTime = Date.now();
      const session = await timerService.startSession('work', 1500);
      expect(session.remainingTime).toBe(1500);

      // Simulate app going to background
      await appStateService.handleAppStateChange('background');

      // Mock time passing (5 seconds)
      const backgroundDuration = 5000;
      vi.advanceTimersByTime(backgroundDuration);

      // Simulate app returning to foreground
      await appStateService.handleAppStateChange('active');

      // Timer should have accurate remaining time
      const recoveredSession = await timerService.handleBackgroundTimer();
      const expectedRemaining = 1500 - Math.floor(backgroundDuration / 1000);

      expect(recoveredSession.remainingTime).toBeCloseTo(expectedRemaining, 1);
      expect(Math.abs(recoveredSession.remainingTime - expectedRemaining)).toBeLessThanOrEqual(1);
    });

    it('should handle timer completion during background', async () => {
      // Start short session for testing
      const _session = await timerService.startSession('work', 5); // 5 seconds

      // Simulate app going to background
      await appStateService.handleAppStateChange('background');

      // Mock time passing beyond session duration
      vi.advanceTimersByTime(6000); // 6 seconds

      // Simulate app returning to foreground
      await appStateService.handleAppStateChange('active');

      // Timer should be completed
      const recoveredSession = await timerService.handleBackgroundTimer();
      expect(recoveredSession.status).toBe('completed');
      expect(recoveredSession.remainingTime).toBe(0);
      expect(recoveredSession.completedAt).toBeInstanceOf(Date);
    });

    it('should maintain paused state during background', async () => {
      // Start and pause session
      const _session = await timerService.startSession('work', 1500);
      const pausedSession = await timerService.pauseSession();
      const remainingAtPause = pausedSession.remainingTime;

      // Simulate background/foreground cycle
      await appStateService.handleAppStateChange('background');
      vi.advanceTimersByTime(10000); // 10 seconds
      await appStateService.handleAppStateChange('active');

      // Timer should remain paused with same remaining time
      const recoveredSession = await timerService.handleBackgroundTimer();
      expect(recoveredSession.status).toBe('paused');
      expect(recoveredSession.remainingTime).toBe(remainingAtPause);
    });

    it('should recover correctly from multiple background/foreground cycles', async () => {
      const _session = await timerService.startSession('work', 60); // 60 seconds
      let totalBackgroundTime = 0;

      // Multiple background/foreground cycles
      for (let i = 0; i < 3; i++) {
        await appStateService.handleAppStateChange('background');
        const backgroundTime = 5000; // 5 seconds each
        vi.advanceTimersByTime(backgroundTime);
        totalBackgroundTime += backgroundTime;

        await appStateService.handleAppStateChange('active');
        await timerService.handleBackgroundTimer();
      }

      // Final check
      const finalSession = await timerService.getCurrentSession();
      const expectedRemaining = 60 - Math.floor(totalBackgroundTime / 1000);

      expect(finalSession?.remainingTime).toBeCloseTo(expectedRemaining, 1);
    });
  });

  describe('Background Task Management', () => {
    it('should register background task when starting session', async () => {
      const session = await timerService.startSession('work', 1500);

      // Verify background task is registered
      const isBackgroundTaskActive = await backgroundTimerService.isTaskActive();
      expect(isBackgroundTaskActive).toBe(true);

      // Verify task options are correct
      const taskOptions = await backgroundTimerService.getTaskOptions();
      expect(taskOptions).toMatchObject({
        sessionId: session.id,
        startTime: expect.any(Number),
        duration: 1500,
      });
    });

    it('should unregister background task when session completes', async () => {
      const session = await timerService.startSession('work', 5);
      expect(session.remainingTime).toBe(5); // Verify initial state

      // Wait for completion
      vi.advanceTimersByTime(6000);
      const recoveredSession = await timerService.handleBackgroundTimer();

      // Verify session is actually completed
      expect(recoveredSession.status).toBe('completed');
      expect(recoveredSession.remainingTime).toBe(0);

      // Background task should be cleaned up
      const isBackgroundTaskActive = await backgroundTimerService.isTaskActive();
      expect(isBackgroundTaskActive).toBe(false);
    });

    it('should handle background task interruption gracefully', async () => {
      await timerService.startSession('work', 1500);

      // Simulate system stopping background task
      await backgroundTimerService.stopTask();

      // App should recover and continue timing normally
      await appStateService.handleAppStateChange('active');
      const session = await timerService.handleBackgroundTimer();

      expect(session.status).toMatch(/running|paused|completed/);
    });

    it('should limit background processing to preserve battery', async () => {
      await timerService.startSession('work', 3600); // 1 hour

      // Simulate extended background time
      await appStateService.handleAppStateChange('background');
      vi.advanceTimersByTime(1800000); // 30 minutes

      // Background service should still function but minimize processing
      const session = await timerService.handleBackgroundTimer();
      expect(session).toBeTruthy();

      // Should accurately track time despite extended background
      expect(session.remainingTime).toBeCloseTo(1800, 5); // Within 5 seconds
    });
  });

  describe('State Persistence During Background', () => {
    it('should persist timer state when backgrounded', async () => {
      const session = await timerService.startSession('work', 1500);

      await appStateService.handleAppStateChange('background');

      // Verify state is persisted
      const persistedSession = await timerService.getCurrentSession();
      expect(persistedSession).toEqual(session);
    });

    it('should restore timer state when foregrounded', async () => {
      const session = await timerService.startSession('work', 1500);

      await appStateService.handleAppStateChange('background');
      vi.advanceTimersByTime(10000); // 10 seconds
      await appStateService.handleAppStateChange('active');

      const restoredSession = await timerService.getCurrentSession();
      expect(restoredSession?.id).toBe(session.id);
      expect(restoredSession?.type).toBe(session.type);
      expect(restoredSession?.duration).toBe(session.duration);
    });

    it('should handle app termination and restart', async () => {
      const _session = await timerService.startSession('work', 1500);
      const _startTime = Date.now();

      // Simulate app termination (immediate background)
      await appStateService.handleAppStateChange('background');

      // Simulate app restart after some time
      const restartDelay = 30000; // 30 seconds
      vi.advanceTimersByTime(restartDelay);

      // Create new service instances (simulating app restart)
      const newTimerService = new TimerService();
      const newAppStateService = new AppStateService();

      // Restore from persistence
      await newAppStateService.handleAppStateChange('active');
      const recoveredSession = await newTimerService.handleBackgroundTimer();

      expect(recoveredSession).toBeTruthy();
      if (recoveredSession.status !== 'completed') {
        const expectedRemaining = 1500 - Math.floor(restartDelay / 1000);
        expect(recoveredSession.remainingTime).toBeCloseTo(expectedRemaining, 2);
      }
    });
  });

  describe('System Time Changes', () => {
    it('should handle device time changes gracefully', async () => {
      const _session = await timerService.startSession('work', 1500);
      const startTime = Date.now();

      // Simulate device time jumping forward
      const timeJump = 3600000; // 1 hour
      vi.setSystemTime(startTime + timeJump);

      await appStateService.handleAppStateChange('background');
      await appStateService.handleAppStateChange('active');

      // Timer should detect time anomaly and handle gracefully
      const recoveredSession = await timerService.handleBackgroundTimer();

      // Should either complete session or maintain reasonable remaining time
      expect(recoveredSession.status).toMatch(/running|paused|completed/);
      if (recoveredSession.status !== 'completed') {
        expect(recoveredSession.remainingTime).toBeGreaterThan(0);
        expect(recoveredSession.remainingTime).toBeLessThanOrEqual(1500);
      }
    });

    it('should handle device time jumping backward', async () => {
      const _session = await timerService.startSession('work', 1500);

      // Let some time pass normally
      vi.advanceTimersByTime(10000); // 10 seconds

      // Simulate device time jumping backward
      vi.setSystemTime(Date.now() - 300000); // 5 minutes back

      await appStateService.handleAppStateChange('background');
      await appStateService.handleAppStateChange('active');

      // Timer should handle gracefully without negative time
      const recoveredSession = await timerService.handleBackgroundTimer();
      expect(recoveredSession.remainingTime).toBeGreaterThan(0);
      expect(recoveredSession.remainingTime).toBeLessThanOrEqual(1500);
    });
  });

  describe('Low Power Mode Integration', () => {
    it('should continue timing in low power mode', async () => {
      const _session = await timerService.startSession('work', 1500);

      // Simulate low power mode activation
      await appStateService.handleLowPowerMode(true);
      await appStateService.handleAppStateChange('background');

      vi.advanceTimersByTime(30000); // 30 seconds

      await appStateService.handleAppStateChange('active');

      // Timer should continue working despite low power mode
      const recoveredSession = await timerService.handleBackgroundTimer();
      expect(recoveredSession.remainingTime).toBeCloseTo(1470, 5); // 1500 - 30
    });

    it('should reduce background activity in low power mode', async () => {
      await timerService.startSession('work', 1500);

      // Manually trigger low power mode on background service for testing
      await appStateService.handleLowPowerMode(true);
      await backgroundTimerService.handleLowPowerMode(true);
      const lowPowerState = await backgroundTimerService.isLowPowerModeActive();
      expect(lowPowerState).toBe(true);

      // Background service should adapt its behavior
      const backgroundOptions = await backgroundTimerService.getTaskOptions();
      expect(backgroundOptions.reducedActivity).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from background task failures', async () => {
      await timerService.startSession('work', 1500);

      // Simulate background task failure
      await backgroundTimerService.simulateTaskFailure();

      // App should detect failure and recover
      await appStateService.handleAppStateChange('active');
      const session = await timerService.handleBackgroundTimer();

      expect(session).toBeTruthy();
      expect(session.status).toMatch(/running|paused|completed/);
    });

    it('should handle corrupted timer state gracefully', async () => {
      await timerService.startSession('work', 1500);

      // Simulate state corruption
      await timerService.simulateStateCorruption();

      // Recovery should either restore valid state or reset cleanly
      const session = await timerService.handleBackgroundTimer();

      if (session) {
        expect(session.remainingTime).toBeGreaterThanOrEqual(0);
        expect(session.duration).toBeGreaterThan(0);
        expect(['idle', 'running', 'paused', 'completed']).toContain(session.status);
      } else {
        // Clean reset is acceptable
        const currentSession = await timerService.getCurrentSession();
        expect(currentSession).toBeNull();
      }
    });
  });
});
