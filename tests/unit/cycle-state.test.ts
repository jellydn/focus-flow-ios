import { describe, it, expect, beforeEach, vi } from 'vitest';

// This will fail until implementation exists
import { CycleStateMachine } from '@/store/cycle-store';

describe('Cycle State Machine Tests', () => {
  let cycleStateMachine: any;

  beforeEach(() => {
    vi.clearAllMocks();
    cycleStateMachine = new CycleStateMachine();
  });

  describe('Cycle States', () => {
    it('should start in inactive state', () => {
      expect(cycleStateMachine.getState().value).toBe('inactive');
    });

    it('should transition to active when starting new cycle', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });

      expect(cycleStateMachine.getState().value).toBe('active');
    });

    it('should transition to completed when finishing cycle', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });
      cycleStateMachine.send({ type: 'COMPLETE_CYCLE' });

      expect(cycleStateMachine.getState().value).toBe('completed');
    });

    it('should transition from active to inactive when abandoning', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });
      cycleStateMachine.send({ type: 'ABANDON_CYCLE' });

      expect(cycleStateMachine.getState().value).toBe('inactive');
    });

    it('should transition from completed to active when starting new cycle', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });
      cycleStateMachine.send({ type: 'COMPLETE_CYCLE' });
      cycleStateMachine.send({ type: 'START_CYCLE' });

      expect(cycleStateMachine.getState().value).toBe('active');
    });
  });

  describe('Cycle Progress Tracking', () => {
    it('should initialize cycle context when starting', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });

      const context = cycleStateMachine.getState().context;
      expect(context).toMatchObject({
        cycleId: expect.any(String),
        currentPosition: 1,
        totalPositions: 8,
        workSessionsCompleted: 0,
        shortBreaksCompleted: 0,
        longBreakCompleted: false,
        isComplete: false,
        startedAt: expect.any(Date),
        completedAt: null,
      });
    });

    it('should progress through cycle workflow correctly', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });

      // Position 1: Work session
      expect(cycleStateMachine.getState().context.currentPosition).toBe(1);
      cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType: 'work' });

      // Position 2: Short break
      expect(cycleStateMachine.getState().context.currentPosition).toBe(2);
      expect(cycleStateMachine.getState().context.workSessionsCompleted).toBe(1);
      cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType: 'shortBreak' });

      // Position 3: Work session
      expect(cycleStateMachine.getState().context.currentPosition).toBe(3);
      expect(cycleStateMachine.getState().context.shortBreaksCompleted).toBe(1);
      cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType: 'work' });

      // Continue pattern...
      expect(cycleStateMachine.getState().context.workSessionsCompleted).toBe(2);
    });

    it('should track session completion counters correctly', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });

      // Complete 4 work sessions and 3 short breaks
      for (let i = 0; i < 4; i++) {
        cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType: 'work' });
        if (i < 3) {
          cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType: 'shortBreak' });
        }
      }

      const context = cycleStateMachine.getState().context;
      expect(context.workSessionsCompleted).toBe(4);
      expect(context.shortBreaksCompleted).toBe(3);
      expect(context.longBreakCompleted).toBe(false);
    });

    it('should handle long break completion', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });

      // Complete full cycle (7 sessions + long break)
      for (let i = 0; i < 7; i++) {
        const sessionType = i % 2 === 0 ? 'work' : 'shortBreak';
        cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType });
      }

      // Complete long break
      cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType: 'longBreak' });

      const context = cycleStateMachine.getState().context;
      expect(context.longBreakCompleted).toBe(true);
      expect(context.isComplete).toBe(true);
      expect(context.currentPosition).toBe(8);
    });

    it('should determine next session type correctly', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });

      // Position 1: Should be work
      expect(cycleStateMachine.getNextSessionType()).toBe('work');
      cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType: 'work' });

      // Position 2: Should be short break
      expect(cycleStateMachine.getNextSessionType()).toBe('shortBreak');
      cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType: 'shortBreak' });

      // Continue through cycle...
      expect(cycleStateMachine.getNextSessionType()).toBe('work');
    });

    it('should indicate long break at position 8', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });

      // Complete 7 sessions to reach position 8
      for (let i = 0; i < 7; i++) {
        const sessionType = i % 2 === 0 ? 'work' : 'shortBreak';
        cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType });
      }

      expect(cycleStateMachine.getNextSessionType()).toBe('longBreak');
      expect(cycleStateMachine.shouldTakeLongBreak()).toBe(true);
    });

    it('should not indicate long break before position 8', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });

      // Complete only 3 sessions
      for (let i = 0; i < 3; i++) {
        const sessionType = i % 2 === 0 ? 'work' : 'shortBreak';
        cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType });
      }

      expect(cycleStateMachine.shouldTakeLongBreak()).toBe(false);
    });
  });

  describe('Cycle Workflow Validation', () => {
    it('should follow exact Pomodoro workflow pattern', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });

      const expectedWorkflow = [
        'work', // Position 1
        'shortBreak', // Position 2
        'work', // Position 3
        'shortBreak', // Position 4
        'work', // Position 5
        'shortBreak', // Position 6
        'work', // Position 7
        'longBreak', // Position 8
      ];

      for (let i = 0; i < expectedWorkflow.length; i++) {
        expect(cycleStateMachine.getNextSessionType()).toBe(expectedWorkflow[i]);
        cycleStateMachine.send({
          type: 'COMPLETE_SESSION',
          sessionType: expectedWorkflow[i],
        });
      }

      expect(cycleStateMachine.getState().context.isComplete).toBe(true);
    });

    it('should reset cycle context when starting new cycle', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });

      // Complete some sessions
      cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType: 'work' });
      cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType: 'shortBreak' });

      // Start new cycle
      cycleStateMachine.send({ type: 'START_CYCLE' });

      const context = cycleStateMachine.getState().context;
      expect(context).toMatchObject({
        currentPosition: 1,
        workSessionsCompleted: 0,
        shortBreaksCompleted: 0,
        longBreakCompleted: false,
        isComplete: false,
        completedAt: null,
      });
    });
  });

  describe('Session Recording', () => {
    it('should record session IDs for tracking', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });

      cycleStateMachine.send({
        type: 'COMPLETE_SESSION',
        sessionType: 'work',
        sessionId: 'work-session-1',
      });

      const context = cycleStateMachine.getState().context;
      expect(context.workSessionIds).toContain('work-session-1');
    });

    it('should separate work and break session IDs', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });

      cycleStateMachine.send({
        type: 'COMPLETE_SESSION',
        sessionType: 'work',
        sessionId: 'work-1',
      });

      cycleStateMachine.send({
        type: 'COMPLETE_SESSION',
        sessionType: 'shortBreak',
        sessionId: 'break-1',
      });

      const context = cycleStateMachine.getState().context;
      expect(context.workSessionIds).toContain('work-1');
      expect(context.shortBreakIds).toContain('break-1');
    });

    it('should record long break session ID separately', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });

      // Fast forward to long break
      for (let i = 0; i < 7; i++) {
        const sessionType = i % 2 === 0 ? 'work' : 'shortBreak';
        cycleStateMachine.send({
          type: 'COMPLETE_SESSION',
          sessionType,
          sessionId: `session-${i + 1}`,
        });
      }

      cycleStateMachine.send({
        type: 'COMPLETE_SESSION',
        sessionType: 'longBreak',
        sessionId: 'long-break-1',
      });

      const context = cycleStateMachine.getState().context;
      expect(context.longBreakId).toBe('long-break-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid session type during completion', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });
      cycleStateMachine.send({
        type: 'COMPLETE_SESSION',
        sessionType: 'invalid',
      });

      // Should remain in current position
      expect(cycleStateMachine.getState().context.currentPosition).toBe(1);
    });

    it('should handle session completion when cycle not active', () => {
      cycleStateMachine.send({
        type: 'COMPLETE_SESSION',
        sessionType: 'work',
      });

      // Should remain in inactive state
      expect(cycleStateMachine.getState().value).toBe('inactive');
    });

    it('should handle completion beyond cycle end', () => {
      cycleStateMachine.send({ type: 'START_CYCLE' });

      // Complete full cycle
      for (let i = 0; i < 8; i++) {
        const sessionType = i === 7 ? 'longBreak' : i % 2 === 0 ? 'work' : 'shortBreak';
        cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType });
      }

      // Try to complete another session
      cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType: 'work' });

      // Should automatically transition to completed state
      expect(cycleStateMachine.getState().value).toBe('completed');
    });
  });

  describe('Persistence Integration', () => {
    it('should emit cycle progress for persistence', () => {
      const progressCallback = vi.fn();
      cycleStateMachine.onProgressUpdate(progressCallback);

      cycleStateMachine.send({ type: 'START_CYCLE' });
      cycleStateMachine.send({ type: 'COMPLETE_SESSION', sessionType: 'work' });

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPosition: 2,
          workSessionsCompleted: 1,
        }),
      );
    });

    it('should restore cycle state from persisted data', () => {
      const persistedCycle = {
        cycleId: 'test-cycle-1',
        currentPosition: 5,
        workSessionsCompleted: 3,
        shortBreaksCompleted: 2,
        longBreakCompleted: false,
        startedAt: new Date(),
      };

      cycleStateMachine.restoreCycle(persistedCycle);

      const context = cycleStateMachine.getState().context;
      expect(context).toMatchObject(persistedCycle);
    });
  });
});
