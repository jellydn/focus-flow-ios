import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TimerServiceContract, TimerSession } from '@/types/timer-session';

// This will fail until implementation exists
import { TimerService } from '@/services/timer-service';

describe('TimerService Contract Tests', () => {
  let timerService: TimerServiceContract;

  beforeEach(() => {
    vi.clearAllMocks();
    timerService = new TimerService();
  });

  describe('Session Management', () => {
    it('should start a work session with 25 minutes (1500 seconds)', async () => {
      const session = await timerService.startSession('work', 1500);

      expect(session).toMatchObject({
        type: 'work',
        duration: 1500,
        remainingTime: 1500,
        status: 'running',
        startedAt: expect.any(Date),
        completedAt: null,
      });
      expect(session.id).toBeTruthy();
    });

    it('should start a short break session with 5 minutes (300 seconds)', async () => {
      const session = await timerService.startSession('shortBreak', 300);

      expect(session).toMatchObject({
        type: 'shortBreak',
        duration: 300,
        remainingTime: 300,
        status: 'running',
      });
    });

    it('should start a long break session with 15 minutes (900 seconds)', async () => {
      const session = await timerService.startSession('longBreak', 900);

      expect(session).toMatchObject({
        type: 'longBreak',
        duration: 900,
        remainingTime: 900,
        status: 'running',
      });
    });

    it('should pause a running session', async () => {
      await timerService.startSession('work', 1500);
      const pausedSession = await timerService.pauseSession();

      expect(pausedSession.status).toBe('paused');
    });

    it('should resume a paused session', async () => {
      await timerService.startSession('work', 1500);
      await timerService.pauseSession();
      const resumedSession = await timerService.resumeSession();

      expect(resumedSession.status).toBe('running');
    });

    it('should stop a session and set status to idle', async () => {
      await timerService.startSession('work', 1500);
      const stoppedSession = await timerService.stopSession();

      expect(stoppedSession.status).toBe('idle');
    });

    it('should reset a session to initial state', async () => {
      await timerService.startSession('work', 1500);
      const resetSession = await timerService.resetSession();

      expect(resetSession).toMatchObject({
        status: 'idle',
        remainingTime: resetSession.duration,
        startedAt: null,
        completedAt: null,
      });
    });
  });

  describe('State Queries', () => {
    it('should return current session when one exists', async () => {
      const startedSession = await timerService.startSession('work', 1500);
      const currentSession = await timerService.getCurrentSession();

      expect(currentSession).toEqual(startedSession);
    });

    it('should return null when no session exists', async () => {
      const currentSession = await timerService.getCurrentSession();

      expect(currentSession).toBeNull();
    });

    it('should return session status', async () => {
      await timerService.startSession('work', 1500);
      const status = await timerService.getSessionStatus();

      expect(status).toBe('running');
    });

    it('should return remaining time', async () => {
      await timerService.startSession('work', 1500);
      const remainingTime = await timerService.getRemainingTime();

      expect(remainingTime).toBe(1500);
    });
  });

  describe('Background Operations', () => {
    it('should schedule notification for session completion', async () => {
      const session = await timerService.startSession('work', 1500);

      await expect(timerService.scheduleNotification(session)).resolves.not.toThrow();
    });

    it('should cancel all notifications', async () => {
      await expect(timerService.cancelNotifications()).resolves.not.toThrow();
    });

    it('should handle background timer state', async () => {
      await timerService.startSession('work', 1500);
      const backgroundSession = await timerService.handleBackgroundTimer();

      expect(backgroundSession).toBeTruthy();
      expect(backgroundSession.status).toMatch(/running|paused|completed/);
    });
  });

  describe('Event Handling', () => {
    it('should register onSessionComplete callback', () => {
      const callback = vi.fn();

      expect(() => {
        timerService.onSessionComplete(callback);
      }).not.toThrow();
    });

    it('should register onSessionTick callback', () => {
      const callback = vi.fn();

      expect(() => {
        timerService.onSessionTick(callback);
      }).not.toThrow();
    });

    it('should register onSessionStateChange callback', () => {
      const callback = vi.fn();

      expect(() => {
        timerService.onSessionStateChange(callback);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid session type', async () => {
      await expect(
        timerService.startSession('invalid' as any, 1500)
      ).rejects.toThrow();
    });

    it('should throw error when pausing non-existent session', async () => {
      await expect(timerService.pauseSession()).rejects.toThrow();
    });

    it('should throw error when resuming non-existent session', async () => {
      await expect(timerService.resumeSession()).rejects.toThrow();
    });
  });
});