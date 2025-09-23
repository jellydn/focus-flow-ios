import { createStore } from '@xstate/store';
import type { TimerSession, SessionType } from '@/types/timer-session';
import type { PomodorocoCycle } from '@/types/pomodoro-cycle';
import type { UserSettings } from '@/types/user-settings';

export interface AppState {
  timer: {
    session: TimerSession | null;
    isRunning: boolean;
    isPaused: boolean;
  };
  cycle: {
    current: PomodorocoCycle | null;
    position: number;
    totalPositions: number;
  };
  settings: UserSettings;
  background: {
    isActive: boolean;
    backgroundedAt: Date | null;
  };
}

export const initialState: AppState = {
  timer: {
    session: null,
    isRunning: false,
    isPaused: false,
  },
  cycle: {
    current: null,
    position: 0,
    totalPositions: 8,
  },
  settings: {
    notificationsEnabled: true,
    soundEnabled: true,
    theme: 'system',
  },
  background: {
    isActive: false,
    backgroundedAt: null,
  },
};

export const appStore = createStore(initialState, {
  // Timer events
  startSession: {
    timer: (context, event: { session: TimerSession }) => ({
      ...context.timer,
      session: event.session,
      isRunning: true,
      isPaused: false,
    }),
  },

  pauseSession: {
    timer: (context) => ({
      ...context.timer,
      isRunning: false,
      isPaused: true,
    }),
  },

  resumeSession: {
    timer: (context) => ({
      ...context.timer,
      isRunning: true,
      isPaused: false,
    }),
  },

  stopSession: {
    timer: (context) => ({
      ...context.timer,
      session: null,
      isRunning: false,
      isPaused: false,
    }),
  },

  updateSessionTime: {
    timer: (context, event: { remainingTime: number }) => ({
      ...context.timer,
      session: context.timer.session
        ? { ...context.timer.session, remainingTime: event.remainingTime }
        : null,
    }),
  },

  completeSession: {
    timer: (context, event: { completedSession: TimerSession }) => ({
      ...context.timer,
      session: event.completedSession,
      isRunning: false,
      isPaused: false,
    }),
  },

  // Cycle events
  startCycle: {
    cycle: (context, event: { cycle: PomodorocoCycle }) => ({
      ...context.cycle,
      current: event.cycle,
      position: 1,
    }),
  },

  updateCycleProgress: {
    cycle: (context, event: { position: number; cycle: PomodorocoCycle }) => ({
      ...context.cycle,
      current: event.cycle,
      position: event.position,
    }),
  },

  completeCycle: {
    cycle: (context, event: { completedCycle: PomodorocoCycle }) => ({
      ...context.cycle,
      current: event.completedCycle,
    }),
  },

  resetCycle: {
    cycle: () => ({
      current: null,
      position: 0,
      totalPositions: 8,
    }),
  },

  // Settings events
  updateSettings: {
    settings: (_context, event: { settings: UserSettings }) => event.settings,
  },

  // Background events
  enterBackground: {
    background: () => ({
      isActive: true,
      backgroundedAt: new Date(),
    }),
  },

  exitBackground: {
    background: () => ({
      isActive: false,
      backgroundedAt: null,
    }),
  },

  // Hydrate from persistence
  hydrate: (_context, event: { state: AppState }) => event.state,
});

// Selectors
export const selectors = {
  getCurrentSession: (state: AppState) => state.timer.session,
  getTimerStatus: (state: AppState) => {
    if (state.timer.isRunning) return 'running';
    if (state.timer.isPaused) return 'paused';
    if (state.timer.session) return 'idle';
    return 'idle';
  },
  getCurrentCycle: (state: AppState) => state.cycle.current,
  getCyclePosition: (state: AppState) => state.cycle.position,
  getSettings: (state: AppState) => state.settings,
  isInBackground: (state: AppState) => state.background.isActive,
  getBackgroundedAt: (state: AppState) => state.background.backgroundedAt,
} as const;

// Type-safe store interface
export type AppStore = typeof appStore;
export type AppStoreSnapshot = ReturnType<AppStore['getSnapshot']>;

export default appStore;
