import { createStore } from '@xstate/store';
import type { SessionType } from '@/types/timer-session';

export interface TimerState {
  sessionType: SessionType | null;
  duration: number;
  remainingTime: number;
  cyclePosition: number;
  startedAt: Date | null;
  completedAt: Date | null;
  pausedAt: Date | null;
  resumedAt: Date | null;
  status: 'idle' | 'running' | 'paused' | 'completed';
}

const initialState: TimerState = {
  sessionType: null,
  duration: 0,
  remainingTime: 0,
  cyclePosition: 0,
  startedAt: null,
  completedAt: null,
  pausedAt: null,
  resumedAt: null,
  status: 'idle',
};

export const timerStore = createStore({
  context: initialState,
  on: {
    startSession: (
      context: TimerState,
      event: { sessionType: SessionType; duration: number; cyclePosition?: number },
    ) => ({
      ...context,
      sessionType: event.sessionType,
      duration: event.duration,
      remainingTime: event.duration,
      cyclePosition: event.cyclePosition || 0,
      startedAt: new Date(),
      completedAt: null,
      pausedAt: null,
      resumedAt: null,
      status: 'running' as const,
    }),

    pauseSession: (context: TimerState) => ({
      ...context,
      pausedAt: new Date(),
      status: 'paused' as const,
    }),

    resumeSession: (context: TimerState) => ({
      ...context,
      resumedAt: new Date(),
      pausedAt: null,
      status: 'running' as const,
    }),

    stopSession: () => ({
      ...initialState,
      status: 'idle' as const,
    }),

    resetSession: (context: TimerState) => ({
      ...context,
      remainingTime: context.duration,
      completedAt: null,
      pausedAt: null,
      resumedAt: null,
      status: 'idle' as const,
    }),

    tick: (context: TimerState, event: { remainingTime: number }) => ({
      ...context,
      remainingTime: event.remainingTime,
    }),

    completeSession: (context: TimerState) => ({
      ...context,
      completedAt: new Date(),
      remainingTime: 0,
      status: 'completed' as const,
    }),
  },
});

// Helper functions
export const timerHelpers = {
  getSessionStatus: (state: TimerState): 'idle' | 'running' | 'paused' | 'completed' => {
    return state.status;
  },

  isRunning: (state: TimerState): boolean => {
    return state.status === 'running';
  },

  isPaused: (state: TimerState): boolean => {
    return state.status === 'paused';
  },

  isCompleted: (state: TimerState): boolean => {
    return state.status === 'completed';
  },

  isIdle: (state: TimerState): boolean => {
    return state.status === 'idle';
  },

  getProgress: (state: TimerState): number => {
    if (state.duration === 0) return 0;
    return 1 - state.remainingTime / state.duration;
  },

  getElapsedTime: (state: TimerState): number => {
    if (!state.startedAt) return 0;
    const now = new Date();
    const elapsed = now.getTime() - state.startedAt.getTime();
    return Math.floor(elapsed / 1000);
  },

  getRemainingTimeFormatted: (state: TimerState): string => {
    const minutes = Math.floor(state.remainingTime / 60);
    const seconds = state.remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },
};

// Type exports
export type TimerStore = typeof timerStore;
export type TimerStoreSnapshot = ReturnType<TimerStore['getSnapshot']>;

export default timerStore;
