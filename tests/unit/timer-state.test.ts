import { beforeEach, describe, expect, it, vi } from 'vitest';

// This will fail until implementation exists
import { timerHelpers, timerStore } from '@/store/timer-store';

describe('Timer State Machine Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    timerStore.send('stopSession');
  });

  describe('Timer States', () => {
    it('should start in idle state', () => {
      const snapshot = timerStore.getSnapshot();
      expect(timerHelpers.getSessionStatus(snapshot.context)).toBe('idle');
    });

    it('should transition to running when starting session', () => {
      console.log('Before startSession:', timerStore.getSnapshot().context);
      timerStore.send('startSession', { sessionType: 'work', duration: 1500 });
      const snapshot = timerStore.getSnapshot();
      console.log('After startSession:', snapshot.context);
      expect(timerHelpers.getSessionStatus(snapshot.context)).toBe('running');
    });

    it('should pause and resume correctly', () => {
      timerStore.send('startSession', { sessionType: 'work', duration: 1500 });
      timerStore.send('pauseSession');

      let snapshot = timerStore.getSnapshot();
      expect(timerHelpers.getSessionStatus(snapshot.context)).toBe('paused');

      timerStore.send('resumeSession');
      snapshot = timerStore.getSnapshot();
      expect(timerHelpers.getSessionStatus(snapshot.context)).toBe('running');
    });
  });
});
