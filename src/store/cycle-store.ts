import { createMachine, assign, interpret } from 'xstate';
import { nanoid } from 'nanoid';
import type { SessionType } from '@/types/timer-session';
import type { PomodorocoCycle, CycleProgress } from '@/types/pomodoro-cycle';
import { CYCLE_WORKFLOW } from '@/types/pomodoro-cycle';

interface CycleContext {
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

type CycleEvent =
  | { type: 'START_CYCLE' }
  | { type: 'COMPLETE_CYCLE' }
  | { type: 'ABANDON_CYCLE' }
  | { type: 'COMPLETE_SESSION'; sessionType: SessionType; sessionId?: string };

const initialContext: CycleContext = {
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

export const cycleMachine = createMachine({
  id: 'cycle',
  initial: 'inactive',
  context: initialContext,
  states: {
    inactive: {
      on: {
        START_CYCLE: {
          target: 'active',
          actions: assign(() => ({
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
          })),
        },
      },
    },
    active: {
      on: {
        COMPLETE_SESSION: {
          actions: assign((context, event) => {
            const sessionType = event.sessionType;
            const sessionId = event.sessionId || nanoid();

            // Validate session type matches expected position
            const expectedType = CYCLE_WORKFLOW[context.currentPosition - 1];
            if (sessionType !== expectedType) {
              console.warn(`Session type mismatch: expected ${expectedType}, got ${sessionType}`);
              return context; // Don't update if types don't match
            }

            let updatedContext = { ...context };

            // Record session based on type
            switch (sessionType) {
              case 'work':
                updatedContext.workSessionsCompleted += 1;
                updatedContext.workSessionIds = [...context.workSessionIds, sessionId];
                break;
              case 'shortBreak':
                updatedContext.shortBreaksCompleted += 1;
                updatedContext.shortBreakIds = [...context.shortBreakIds, sessionId];
                break;
              case 'longBreak':
                updatedContext.longBreakCompleted = true;
                updatedContext.longBreakId = sessionId;
                break;
            }

            // Advance position
            updatedContext.currentPosition = Math.min(context.currentPosition + 1, 8);

            // Check if cycle is complete
            if (
              updatedContext.workSessionsCompleted === 4 &&
              updatedContext.shortBreaksCompleted === 3 &&
              updatedContext.longBreakCompleted
            ) {
              updatedContext.isComplete = true;
            }

            return updatedContext;
          }),
        },
        COMPLETE_CYCLE: {
          target: 'completed',
          actions: assign({
            completedAt: () => new Date(),
          }),
        },
        ABANDON_CYCLE: {
          target: 'inactive',
          actions: assign(initialContext),
        },
        START_CYCLE: {
          target: 'active',
          actions: assign(() => ({
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
          })),
        },
      },
    },
    completed: {
      on: {
        START_CYCLE: {
          target: 'active',
          actions: assign(() => ({
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
          })),
        },
      },
    },
  },
});

export class CycleStateMachine {
  private service: any;
  private progressCallbacks: Array<(progress: CycleProgress) => void> = [];

  constructor() {
    this.service = interpret(cycleMachine);
    this.service.start();

    // Subscribe to state changes for progress updates
    this.service.subscribe((state: any) => {
      if (state.matches('active')) {
        const progress = this.calculateProgress(state.context);
        this.progressCallbacks.forEach(callback => callback(progress));
      }
    });
  }

  send(event: CycleEvent): void {
    this.service.send(event);
  }

  getState(): any {
    return this.service.getSnapshot();
  }

  getNextSessionType(): SessionType {
    const context = this.getState().context;

    if (context.currentPosition <= 8) {
      return CYCLE_WORKFLOW[context.currentPosition - 1];
    }

    return 'work'; // Default fallback
  }

  shouldTakeLongBreak(): boolean {
    const context = this.getState().context;
    return context.currentPosition === 8;
  }

  onProgressUpdate(callback: (progress: CycleProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  restoreCycle(persistedCycle: any): void {
    // Create new machine with restored context
    const restoredMachine = cycleMachine.withContext({
      ...initialContext,
      ...persistedCycle,
    });

    this.service.stop();
    this.service = interpret(restoredMachine);
    this.service.start();

    // Re-subscribe to state changes
    this.service.subscribe((state: any) => {
      if (state.matches('active')) {
        const progress = this.calculateProgress(state.context);
        this.progressCallbacks.forEach(callback => callback(progress));
      }
    });
  }

  stop(): void {
    this.service.stop();
  }

  private calculateProgress(context: CycleContext): CycleProgress {
    return {
      currentPosition: context.currentPosition,
      totalPositions: context.totalPositions,
      workSessionsCompleted: context.workSessionsCompleted,
      shortBreaksCompleted: context.shortBreaksCompleted,
      longBreakCompleted: context.longBreakCompleted,
      isComplete: context.isComplete,
    };
  }
}

export default cycleMachine;