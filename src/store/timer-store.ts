import { assign, createMachine, interpret } from 'xstate';
import type { SessionStatus, SessionType, TimerSession } from '@/types/timer-session';

interface TimerContext {
  sessionType: SessionType | null;
  duration: number;
  remainingTime: number;
  cyclePosition: number;
  startedAt: Date | null;
  completedAt: Date | null;
  pausedAt?: Date;
  resumedAt?: Date;
}

type TimerEvent =
  | { type: 'START_SESSION'; sessionType: SessionType; duration: number; cyclePosition?: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'STOP' }
  | { type: 'RESET' }
  | { type: 'TICK'; remainingTime: number }
  | { type: 'TIMER_COMPLETE' };

const initialContext: TimerContext = {
  sessionType: null,
  duration: 0,
  remainingTime: 0,
  cyclePosition: 0,
  startedAt: null,
  completedAt: null,
};

export const timerMachine = createMachine({
  id: 'timer',
  initial: 'idle',
  context: initialContext,
  states: {
    idle: {
      on: {
        START_SESSION: {
          target: 'running',
          actions: assign((context, event) => ({
            sessionType: event.sessionType,
            duration: event.duration,
            remainingTime: event.duration,
            cyclePosition: event.cyclePosition || 0,
            startedAt: new Date(),
            completedAt: null,
            pausedAt: undefined,
            resumedAt: undefined,
          })),
          cond: (context, event) =>
            event.duration > 0 && ['work', 'shortBreak', 'longBreak'].includes(event.sessionType),
        },
      },
    },
    running: {
      on: {
        PAUSE: {
          target: 'paused',
          actions: assign({
            pausedAt: () => new Date(),
          }),
        },
        STOP: {
          target: 'idle',
          actions: assign(initialContext),
        },
        RESET: {
          target: 'idle',
          actions: assign(initialContext),
        },
        TICK: {
          actions: assign((context, event) => ({
            remainingTime: Math.max(0, event.remainingTime),
          })),
        },
        TIMER_COMPLETE: {
          target: 'completed',
          actions: assign({
            remainingTime: 0,
            completedAt: () => new Date(),
          }),
        },
        START_SESSION: {
          target: 'running',
          actions: assign((context, event) => ({
            sessionType: event.sessionType,
            duration: event.duration,
            remainingTime: event.duration,
            cyclePosition: event.cyclePosition || 0,
            startedAt: new Date(),
            completedAt: null,
            pausedAt: undefined,
            resumedAt: undefined,
          })),
          cond: (context, event) =>
            event.duration > 0 && ['work', 'shortBreak', 'longBreak'].includes(event.sessionType),
        },
      },
    },
    paused: {
      on: {
        RESUME: {
          target: 'running',
          actions: assign({
            resumedAt: () => new Date(),
          }),
        },
        STOP: {
          target: 'idle',
          actions: assign(initialContext),
        },
        RESET: {
          target: 'idle',
          actions: assign(initialContext),
        },
        START_SESSION: {
          target: 'running',
          actions: assign((context, event) => ({
            sessionType: event.sessionType,
            duration: event.duration,
            remainingTime: event.duration,
            cyclePosition: event.cyclePosition || 0,
            startedAt: new Date(),
            completedAt: null,
            pausedAt: undefined,
            resumedAt: undefined,
          })),
          cond: (context, event) =>
            event.duration > 0 && ['work', 'shortBreak', 'longBreak'].includes(event.sessionType),
        },
      },
    },
    completed: {
      on: {
        START_SESSION: {
          target: 'running',
          actions: assign((context, event) => ({
            sessionType: event.sessionType,
            duration: event.duration,
            remainingTime: event.duration,
            cyclePosition: event.cyclePosition || 0,
            startedAt: new Date(),
            completedAt: null,
            pausedAt: undefined,
            resumedAt: undefined,
          })),
          cond: (context, event) =>
            event.duration > 0 && ['work', 'shortBreak', 'longBreak'].includes(event.sessionType),
        },
        RESET: {
          target: 'idle',
          actions: assign(initialContext),
        },
      },
    },
  },
});

export class TimerStateMachine {
  private service: any;
  private stateChangeCallbacks: Array<(state: any) => void> = [];

  constructor() {
    this.service = interpret(timerMachine);
    this.service.start();

    // Subscribe to state changes
    this.service.subscribe((state: any) => {
      this.stateChangeCallbacks.forEach((callback) => callback(state));
    });
  }

  send(event: TimerEvent): void {
    this.service.send(event);
  }

  getState(): any {
    return this.service.getSnapshot();
  }

  onStateChange(callback: (state: any) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  restoreState(persistedState: any): void {
    // Create new machine with restored context
    const restoredMachine = timerMachine.withContext({
      ...initialContext,
      ...persistedState,
    });

    this.service.stop();
    this.service = interpret(restoredMachine);
    this.service.start();

    // Re-subscribe to state changes
    this.service.subscribe((state: any) => {
      this.stateChangeCallbacks.forEach((callback) => callback(state));
    });
  }

  stop(): void {
    this.service.stop();
  }
}

export default timerMachine;
