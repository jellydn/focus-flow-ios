import { beforeEach, describe, expect, it, vi } from 'vitest';
// This will fail until implementation exists
import { CycleService } from '@/services/cycle-service';
import type { CycleServiceContract } from '@/types/pomodoro-cycle';

describe('CycleService Contract Tests', () => {
  let cycleService: CycleServiceContract;

  beforeEach(() => {
    vi.clearAllMocks();
    cycleService = new CycleService();
  });

  describe('Cycle Management', () => {
    it('should start a new Pomodoro cycle', async () => {
      const cycle = await cycleService.startNewCycle();

      expect(cycle).toMatchObject({
        id: expect.any(String),
        workSessions: [],
        shortBreaks: [],
        longBreak: null,
        status: 'active',
        startedAt: expect.any(Date),
        completedAt: null,
      });
    });

    it('should return current active cycle', async () => {
      const startedCycle = await cycleService.startNewCycle();
      const currentCycle = await cycleService.getCurrentCycle();

      expect(currentCycle).toEqual(startedCycle);
    });

    it('should return null when no active cycle exists', async () => {
      const currentCycle = await cycleService.getCurrentCycle();

      expect(currentCycle).toBeNull();
    });

    it('should complete a cycle', async () => {
      await cycleService.startNewCycle();
      const completedCycle = await cycleService.completeCycle();

      expect(completedCycle).toMatchObject({
        status: 'completed',
        completedAt: expect.any(Date),
      });
    });

    it('should abandon a cycle', async () => {
      await cycleService.startNewCycle();

      // Should not throw when abandoning an active cycle
      await cycleService.abandonCycle();

      const currentCycle = await cycleService.getCurrentCycle();
      expect(currentCycle).toBeNull();
    });
  });

  describe('Progress Tracking', () => {
    it('should return initial cycle progress', async () => {
      await cycleService.startNewCycle();
      const progress = await cycleService.getCycleProgress();

      expect(progress).toMatchObject({
        currentPosition: 1,
        totalPositions: 8,
        workSessionsCompleted: 0,
        shortBreaksCompleted: 0,
        longBreakCompleted: false,
        isComplete: false,
      });
    });

    it('should return work as next session type initially', async () => {
      await cycleService.startNewCycle();
      const nextType = await cycleService.getNextSessionType();

      expect(nextType).toBe('work');
    });

    it('should progress through cycle workflow: work → shortBreak → work → shortBreak → work → shortBreak → work → longBreak', async () => {
      await cycleService.startNewCycle();

      // Position 1: work
      expect(await cycleService.getNextSessionType()).toBe('work');
      await cycleService.recordSessionCompletion('session1');

      // Position 2: shortBreak
      expect(await cycleService.getNextSessionType()).toBe('shortBreak');
      await cycleService.recordSessionCompletion('session2');

      // Position 3: work
      expect(await cycleService.getNextSessionType()).toBe('work');
      await cycleService.recordSessionCompletion('session3');

      // Position 4: shortBreak
      expect(await cycleService.getNextSessionType()).toBe('shortBreak');
      await cycleService.recordSessionCompletion('session4');

      // Position 5: work
      expect(await cycleService.getNextSessionType()).toBe('work');
      await cycleService.recordSessionCompletion('session5');

      // Position 6: shortBreak
      expect(await cycleService.getNextSessionType()).toBe('shortBreak');
      await cycleService.recordSessionCompletion('session6');

      // Position 7: work
      expect(await cycleService.getNextSessionType()).toBe('work');
      await cycleService.recordSessionCompletion('session7');

      // Position 8: longBreak
      expect(await cycleService.getNextSessionType()).toBe('longBreak');
    });

    it('should update progress when session completed', async () => {
      await cycleService.startNewCycle();

      const progress = await cycleService.recordSessionCompletion('workSession1');

      expect(progress).toMatchObject({
        currentPosition: 2,
        workSessionsCompleted: 1,
        shortBreaksCompleted: 0,
        longBreakCompleted: false,
        isComplete: false,
      });
    });

    it('should indicate when long break should be taken', async () => {
      await cycleService.startNewCycle();

      // Complete 4 work sessions and 3 short breaks
      for (let i = 1; i <= 7; i++) {
        await cycleService.recordSessionCompletion(`session${i}`);
      }

      const shouldTakeLongBreak = await cycleService.shouldTakeLongBreak();
      expect(shouldTakeLongBreak).toBe(true);
    });

    it('should not indicate long break before completing 4 work sessions', async () => {
      await cycleService.startNewCycle();

      // Complete only 2 work sessions and 1 short break
      for (let i = 1; i <= 3; i++) {
        await cycleService.recordSessionCompletion(`session${i}`);
      }

      const shouldTakeLongBreak = await cycleService.shouldTakeLongBreak();
      expect(shouldTakeLongBreak).toBe(false);
    });

    it('should track cycle position correctly', async () => {
      await cycleService.startNewCycle();

      expect(await cycleService.getCyclePosition()).toBe(1);

      await cycleService.recordSessionCompletion('session1');
      expect(await cycleService.getCyclePosition()).toBe(2);

      await cycleService.recordSessionCompletion('session2');
      expect(await cycleService.getCyclePosition()).toBe(3);
    });

    it('should indicate when can advance to next session', async () => {
      await cycleService.startNewCycle();

      const canAdvance = await cycleService.canAdvanceToNext();
      expect(canAdvance).toBe(true);
    });
  });

  describe('Event Handling', () => {
    it('should register onCycleComplete callback', () => {
      const callback = vi.fn();

      expect(() => {
        cycleService.onCycleComplete(callback);
      }).not.toThrow();
    });

    it('should register onProgressUpdate callback', () => {
      const callback = vi.fn();

      expect(() => {
        cycleService.onProgressUpdate(callback);
      }).not.toThrow();
    });

    it('should call onProgressUpdate when session completed', async () => {
      const callback = vi.fn();
      cycleService.onProgressUpdate(callback);

      await cycleService.startNewCycle();
      const progress = await cycleService.recordSessionCompletion('session1');

      expect(callback).toHaveBeenCalledWith(progress);
    });

    it('should call onCycleComplete when cycle finished', async () => {
      const callback = vi.fn();
      cycleService.onCycleComplete(callback);

      await cycleService.startNewCycle();
      const completedCycle = await cycleService.completeCycle();

      expect(callback).toHaveBeenCalledWith(completedCycle);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when recording session without active cycle', async () => {
      await expect(cycleService.recordSessionCompletion('session1')).rejects.toThrow();
    });

    it('should throw error when completing non-existent cycle', async () => {
      await expect(cycleService.completeCycle()).rejects.toThrow();
    });

    it('should throw error when abandoning non-existent cycle', async () => {
      await expect(cycleService.abandonCycle()).rejects.toThrow();
    });

    it('should throw error for invalid session ID', async () => {
      await cycleService.startNewCycle();

      await expect(cycleService.recordSessionCompletion('')).rejects.toThrow();
    });
  });

  describe('Cycle Completion', () => {
    it('should mark cycle as complete after all 8 sessions', async () => {
      await cycleService.startNewCycle();

      // Complete all 8 sessions (4 work + 3 short breaks + 1 long break)
      for (let i = 1; i <= 8; i++) {
        await cycleService.recordSessionCompletion(`session${i}`);
      }

      const progress = await cycleService.getCycleProgress();
      expect(progress.isComplete).toBe(true);
    });

    it('should track all session types correctly in completed cycle', async () => {
      await cycleService.startNewCycle();

      // Complete full cycle
      for (let i = 1; i <= 8; i++) {
        await cycleService.recordSessionCompletion(`session${i}`);
      }

      const progress = await cycleService.getCycleProgress();
      expect(progress).toMatchObject({
        workSessionsCompleted: 4,
        shortBreaksCompleted: 3,
        longBreakCompleted: true,
        isComplete: true,
      });
    });
  });
});
