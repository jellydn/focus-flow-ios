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
      expect(cycleHelpers.getCycleStatus(state.context)).toBe('inactive');
    });

    it('should transition to active when starting new cycle', () => {
      try {
        console.log('Initial state:', store.getSnapshot());
        console.log('Store object:', store);
        console.log('Store methods:', Object.getOwnPropertyNames(store));
        store.send({ type: 'startCycle' });
        const state = store.getSnapshot();
        console.log('State after startCycle:', state);
        console.log('Cycle status:', cycleHelpers.getCycleStatus(state.context));
        expect(cycleHelpers.getCycleStatus(state.context)).toBe('active');
      } catch (error) {
        console.error('Error in test:', error);
        throw error;
      }
    });

    it('should track session completion', () => {
      store.send({ type: 'startCycle' });
      store.send({ type: 'completeSession', sessionType: 'work', sessionId: 'test-session' });

      const state = store.getSnapshot();
      expect(state.context.workSessionsCompleted).toBe(1);
      expect(state.context.currentPosition).toBe(2);
    });
  });
});
