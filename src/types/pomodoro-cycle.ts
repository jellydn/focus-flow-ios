import type { SessionType } from './timer-session';

export type CycleStatus = 'inactive' | 'active' | 'completed';

export interface PomodorocoCycle {
  id: string;
  workSessions: string[]; // Session IDs
  shortBreaks: string[]; // Session IDs
  longBreak: string | null; // Session ID
  status: CycleStatus;
  startedAt: Date;
  completedAt: Date | null;
}

export interface CycleProgress {
  currentPosition: number; // 1-8 (position in cycle)
  totalPositions: number; // Always 8 for standard Pomodoro
  workSessionsCompleted: number; // 0-4
  shortBreaksCompleted: number; // 0-3
  longBreakCompleted: boolean;
  isComplete: boolean;
}

export interface CycleServiceContract {
  // Cycle management
  startNewCycle(): Promise<PomodorocoCycle>;
  getCurrentCycle(): Promise<PomodorocoCycle | null>;
  completeCycle(): Promise<PomodorocoCycle>;
  abandonCycle(): Promise<void>;

  // Progress tracking
  getCycleProgress(): Promise<CycleProgress>;
  getNextSessionType(): Promise<SessionType>;
  recordSessionCompletion(sessionId: string): Promise<CycleProgress>;
  shouldTakeLongBreak(): Promise<boolean>;
  getCyclePosition(): Promise<number>;
  canAdvanceToNext(): Promise<boolean>;

  // Event handlers
  onCycleComplete(callback: (cycle: PomodorocoCycle) => void): void;
  onProgressUpdate(callback: (progress: CycleProgress) => void): void;
}

// Standard Pomodoro cycle workflow:
// 1. Work (25 min)
// 2. Short Break (5 min)
// 3. Work (25 min)
// 4. Short Break (5 min)
// 5. Work (25 min)
// 6. Short Break (5 min)
// 7. Work (25 min)
// 8. Long Break (15 min)
export const CYCLE_WORKFLOW: SessionType[] = [
  'work', // Position 1
  'shortBreak', // Position 2
  'work', // Position 3
  'shortBreak', // Position 4
  'work', // Position 5
  'shortBreak', // Position 6
  'work', // Position 7
  'longBreak', // Position 8
] as const;
