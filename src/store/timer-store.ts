import { createStore, from } from '@xstate/store';
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

export const timerStore = from(initialState, {
  startSession: (
    state: TimerState,
    event: { sessionType: SessionType; duration: number; cyclePosition?: number },
  ) => ({
    ...state,
    sessionType: event.sessionType,
    duration: event.duration,
    remainingTime: event.duration,
    cyclePosition: event.cyclePosition || 0,
    startedAt: new Date(),
    completedAt: null,
    pausedAt: null,
    resumedAt: null,
    status: 'running',
  }),

  pauseSession: (state: TimerState) => ({
    ...state,
    pausedAt: new Date(),
    status: 'paused',
  }),

  resumeSession: (state: TimerState) => ({
    ...state,
    resumedAt: new Date(),
    pausedAt: null,
    status: 'running',
  }),

  stopSession: () => ({
    ...initialState,
    status: 'idle',
  }),

  resetSession: (state: TimerState) => ({
    ...state,
    remainingTime: state.duration,
    completedAt: null,
    pausedAt: null,
    resumedAt: null,
    status: 'idle',
  }),

  tick: (state: TimerState, event: { remainingTime: number }) => ({
    ...state,
    remainingTime: event.remainingTime,
  }),

  completeSession: (state: TimerState) => ({
    ...state,
    completedAt: new Date(),
    remainingTime: 0,
    status: 'completed',
  }),
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
