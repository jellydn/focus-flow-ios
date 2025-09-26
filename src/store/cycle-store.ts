import { createStore } from '@xstate/store';
import { nanoid } from 'nanoid';
import type { CycleProgress } from '@/types/pomodoro-cycle';
import { CYCLE_WORKFLOW } from '@/types/pomodoro-cycle';
import type { SessionType } from '@/types/timer-session';

export interface CycleState {
  cycleId: string | null;
  currentPosition: number;
  totalPositions: number;
  workSessionsCompleted: number;
  shortBreaksCompleted: number;
  longBreakCompleted: boolean;
  isComplete: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
  workSessionIds: string[];
  shortBreakIds: string[];
  longBreakId: string | null;
}

const initialState: CycleState = {
  cycleId: null,
  currentPosition: 1,
  totalPositions: 8,
  workSessionsCompleted: 0,
  shortBreaksCompleted: 0,
  longBreakCompleted: false,
  isComplete: false,
  startedAt: null,
  completedAt: null,
  workSessionIds: [],
  shortBreakIds: [],
  longBreakId: null,
};

export const cycleStore = createStore({
  context: initialState,
  on: {
    startCycle: () => {
      const newState = {
        cycleId: nanoid(),
        currentPosition: 1,
        totalPositions: 8,
        workSessionsCompleted: 0,
        shortBreaksCompleted: 0,
        longBreakCompleted: false,
        isComplete: false,
        startedAt: new Date(),
        completedAt: null,
        workSessionIds: [],
        shortBreakIds: [],
        longBreakId: null,
      };
      console.log('startCycle: returning new state:', newState);
      return newState;
    },

    completeSession: (
      context: CycleState,
      event: { sessionType: SessionType; sessionId?: string },
    ) => {
      const sessionType = event.sessionType;
      const sessionId = event.sessionId || nanoid();

      // Validate session type matches expected position
      const expectedType = CYCLE_WORKFLOW[context.currentPosition - 1];
      if (sessionType !== expectedType) {
        console.warn(`Session type mismatch: expected ${expectedType}, got ${sessionType}`);
        return context; // Don't update if types don't match
      }

      const updates: Partial<CycleState> = {};

      // Record session based on type
      switch (sessionType) {
        case 'work':
          updates.workSessionsCompleted = context.workSessionsCompleted + 1;
          updates.workSessionIds = [...context.workSessionIds, sessionId];
          break;
        case 'shortBreak':
          updates.shortBreaksCompleted = context.shortBreaksCompleted + 1;
          updates.shortBreakIds = [...context.shortBreakIds, sessionId];
          break;
        case 'longBreak':
          updates.longBreakCompleted = true;
          updates.longBreakId = sessionId;
          break;
      }

      // Advance position
      updates.currentPosition = Math.min(context.currentPosition + 1, 8);

      // Check if cycle is complete
      if (
        (updates.workSessionsCompleted || context.workSessionsCompleted) === 4 &&
        (updates.shortBreaksCompleted || context.shortBreaksCompleted) === 3 &&
        (updates.longBreakCompleted || context.longBreakCompleted)
      ) {
        updates.isComplete = true;
      }

      return { ...context, ...updates };
    },

    completeCycle: (context: CycleState) => ({
      ...context,
      completedAt: new Date(),
      isComplete: true,
    }),

    abandonCycle: () => initialState,

    resetCycle: () => initialState,
  },
});

// Helper functions
export const cycleHelpers = {
  getCycleProgress: (state: CycleState): CycleProgress => ({
    currentPosition: state.currentPosition,
    totalPositions: state.totalPositions,
    workSessionsCompleted: state.workSessionsCompleted,
    shortBreaksCompleted: state.shortBreaksCompleted,
    longBreakCompleted: state.longBreakCompleted,
    isComplete: state.isComplete,
  }),

  getNextSessionType: (state: CycleState): SessionType => {
    if (state.isComplete) return 'work'; // Start new cycle
    return CYCLE_WORKFLOW[state.currentPosition - 1] || 'work';
  },

  isCycleComplete: (state: CycleState): boolean => {
    return (
      state.workSessionsCompleted === 4 &&
      state.shortBreaksCompleted === 3 &&
      state.longBreakCompleted
    );
  },

  getCycleStatus: (state: CycleState): 'inactive' | 'active' | 'completed' => {
    if (!state.cycleId) return 'inactive';
    if (state.isComplete) return 'completed';
    return 'active';
  },
};

// Type exports
export type CycleStore = typeof cycleStore;
export type CycleStoreSnapshot = ReturnType<CycleStore['getSnapshot']>;

export default cycleStore;
