import { beforeEach, describe, expect, it, vi } from 'vitest';

// This will fail until implementation exists
import { timerHelpers, timerStore } from '@/store/timer-store';

describe('Timer State Machine Tests', () => {
  let store: any;

  beforeEach(() => {
    vi.clearAllMocks();
    store = timerStore;
    // Reset store to initial state
    store.send({ type: 'stopSession' });
  });

  describe('Timer States', () => {
    it('should start in idle state', () => {
      const state = store.getSnapshot();
      expect(timerHelpers.getSessionStatus(state)).toBe('idle');
    });

    it('should transition to running when starting session', () => {
      store.send({ type: 'startSession', sessionType: 'work', duration: 1500 });
      const state = store.getSnapshot();
      expect(timerHelpers.getSessionStatus(state)).toBe('running');
    });

    it('should pause and resume correctly', () => {
      store.send({ type: 'startSession', sessionType: 'work', duration: 1500 });
      store.send({ type: 'pauseSession' });

      let state = store.getSnapshot();
      expect(timerHelpers.getSessionStatus(state)).toBe('paused');

      store.send({ type: 'resumeSession' });
      state = store.getSnapshot();
      expect(timerHelpers.getSessionStatus(state)).toBe('running');
    });
  });
});
