import { beforeEach, describe, expect, it, vi } from 'vitest';

// This will fail until implementation exists
import { cycleHelpers, cycleStore } from '@/store/cycle-store';

describe('Cycle State Machine Tests', () => {
  let store: any;

  beforeEach(() => {
    vi.clearAllMocks();
    store = cycleStore;
    // Reset store to initial state
    store.send({ type: 'abandonCycle' });
  });

  describe('Cycle States', () => {
    it('should start in inactive state', () => {
      const state = store.getSnapshot();
      expect(cycleHelpers.getCycleStatus(state)).toBe('inactive');
    });

    it('should transition to active when starting new cycle', () => {
      store.send({ type: 'startCycle' });
      const state = store.getSnapshot();
      expect(cycleHelpers.getCycleStatus(state)).toBe('active');
    });

    it('should track session completion', () => {
      store.send({ type: 'startCycle' });
      store.send({ type: 'completeSession', sessionType: 'work' });

      const state = store.getSnapshot();
      expect(state.workSessionsCompleted).toBe(1);
      expect(state.currentPosition).toBe(2);
    });
  });
});
