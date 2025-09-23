import { describe, it, expect, beforeEach, vi } from 'vitest';

// This will fail until implementation exists
import { TimerStateMachine } from '@/store/timer-store';

describe('Timer State Machine Tests', () => {
  let timerStateMachine: any;

  beforeEach(() => {
    vi.clearAllMocks();
    timerStateMachine = new TimerStateMachine();
  });

  describe('State Transitions', () => {
    it('should start in idle state', () => {
      expect(timerStateMachine.getState()).toMatchObject({
        value: 'idle',
      });
    });

    it('should transition from idle to running when starting session', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: 1500 });

      expect(timerStateMachine.getState().value).toBe('running');
    });

    it('should transition from running to paused when pausing', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: 1500 });
      timerStateMachine.send({ type: 'PAUSE' });

      expect(timerStateMachine.getState().value).toBe('paused');
    });

    it('should transition from paused to running when resuming', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: 1500 });
      timerStateMachine.send({ type: 'PAUSE' });
      timerStateMachine.send({ type: 'RESUME' });

      expect(timerStateMachine.getState().value).toBe('running');
    });

    it('should transition from running to completed when timer expires', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: 1500 });
      timerStateMachine.send({ type: 'TIMER_COMPLETE' });

      expect(timerStateMachine.getState().value).toBe('completed');
    });

    it('should transition from any state to idle when stopping', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: 1500 });
      timerStateMachine.send({ type: 'STOP' });

      expect(timerStateMachine.getState().value).toBe('idle');
    });

    it('should transition from any state to idle when resetting', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: 1500 });
      timerStateMachine.send({ type: 'PAUSE' });
      timerStateMachine.send({ type: 'RESET' });

      expect(timerStateMachine.getState().value).toBe('idle');
    });
  });

  describe('State Context', () => {
    it('should store session data in context when starting', () => {
      timerStateMachine.send({
        type: 'START_SESSION',
        sessionType: 'work',
        duration: 1500,
        cyclePosition: 1,
      });

      const context = timerStateMachine.getState().context;
      expect(context).toMatchObject({
        sessionType: 'work',
        duration: 1500,
        remainingTime: 1500,
        cyclePosition: 1,
        startedAt: expect.any(Date),
      });
    });

    it('should preserve remaining time when pausing and resuming', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: 1500 });

      // Simulate some time passing
      timerStateMachine.send({ type: 'TICK', remainingTime: 1400 });
      timerStateMachine.send({ type: 'PAUSE' });

      const pausedContext = timerStateMachine.getState().context;
      expect(pausedContext.remainingTime).toBe(1400);

      timerStateMachine.send({ type: 'RESUME' });
      const resumedContext = timerStateMachine.getState().context;
      expect(resumedContext.remainingTime).toBe(1400);
    });

    it('should reset context when resetting session', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: 1500 });
      timerStateMachine.send({ type: 'TICK', remainingTime: 1400 });
      timerStateMachine.send({ type: 'RESET' });

      const context = timerStateMachine.getState().context;
      expect(context).toMatchObject({
        sessionType: null,
        duration: 0,
        remainingTime: 0,
        cyclePosition: 0,
        startedAt: null,
        completedAt: null,
      });
    });

    it('should update remaining time on tick events', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: 1500 });
      timerStateMachine.send({ type: 'TICK', remainingTime: 1499 });

      const context = timerStateMachine.getState().context;
      expect(context.remainingTime).toBe(1499);
    });

    it('should set completion time when session completes', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: 1500 });
      timerStateMachine.send({ type: 'TIMER_COMPLETE' });

      const context = timerStateMachine.getState().context;
      expect(context.completedAt).toBeInstanceOf(Date);
      expect(context.remainingTime).toBe(0);
    });
  });

  describe('Event Guards', () => {
    it('should not allow pause when in idle state', () => {
      timerStateMachine.send({ type: 'PAUSE' });

      expect(timerStateMachine.getState().value).toBe('idle');
    });

    it('should not allow resume when in idle state', () => {
      timerStateMachine.send({ type: 'RESUME' });

      expect(timerStateMachine.getState().value).toBe('idle');
    });

    it('should not allow timer complete when not running', () => {
      timerStateMachine.send({ type: 'TIMER_COMPLETE' });

      expect(timerStateMachine.getState().value).toBe('idle');
    });

    it('should allow start session from completed state', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: 1500 });
      timerStateMachine.send({ type: 'TIMER_COMPLETE' });
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'shortBreak', duration: 300 });

      expect(timerStateMachine.getState().value).toBe('running');
    });
  });

  describe('Session Types', () => {
    it('should handle work session type', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: 1500 });

      const context = timerStateMachine.getState().context;
      expect(context.sessionType).toBe('work');
    });

    it('should handle short break session type', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'shortBreak', duration: 300 });

      const context = timerStateMachine.getState().context;
      expect(context.sessionType).toBe('shortBreak');
    });

    it('should handle long break session type', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'longBreak', duration: 900 });

      const context = timerStateMachine.getState().context;
      expect(context.sessionType).toBe('longBreak');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid session type gracefully', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'invalid', duration: 1500 });

      // Should remain in idle state or handle error appropriately
      expect(timerStateMachine.getState().value).toBe('idle');
    });

    it('should handle invalid duration gracefully', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: -100 });

      // Should remain in idle state or handle error appropriately
      expect(timerStateMachine.getState().value).toBe('idle');
    });

    it('should handle negative remaining time gracefully', () => {
      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: 1500 });
      timerStateMachine.send({ type: 'TICK', remainingTime: -10 });

      const context = timerStateMachine.getState().context;
      expect(context.remainingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Persistence Integration', () => {
    it('should emit state changes for persistence', () => {
      const stateChangeCallback = vi.fn();
      timerStateMachine.onStateChange(stateChangeCallback);

      timerStateMachine.send({ type: 'START_SESSION', sessionType: 'work', duration: 1500 });

      expect(stateChangeCallback).toHaveBeenCalled();
    });

    it('should restore state from persisted data', () => {
      const persistedState = {
        sessionType: 'work',
        duration: 1500,
        remainingTime: 1200,
        cyclePosition: 2,
        startedAt: new Date(),
        status: 'paused',
      };

      timerStateMachine.restoreState(persistedState);

      const context = timerStateMachine.getState().context;
      expect(context).toMatchObject(persistedState);
    });
  });
});
