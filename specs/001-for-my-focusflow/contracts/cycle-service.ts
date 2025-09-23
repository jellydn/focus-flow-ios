/**
 * Cycle Service Contract
 * Defines the interface for Pomodoro cycle management
 */

export interface PomodorocoCycle {
  id: string;
  workSessions: string[]; // TimerSession IDs
  shortBreaks: string[]; // TimerSession IDs
  longBreak: string | null; // TimerSession ID
  status: 'active' | 'completed';
  startedAt: Date;
  completedAt: Date | null;
}

export interface CycleProgress {
  currentPosition: number; // 1-8 (4 work + 3 short breaks + 1 long break)
  totalPositions: number; // Always 8
  workSessionsCompleted: number; // 0-4
  shortBreaksCompleted: number; // 0-3
  longBreakCompleted: boolean;
  isComplete: boolean;
}

export interface CycleServiceContract {
  // Cycle Management
  startNewCycle(): Promise<PomodorocoCycle>;
  getCurrentCycle(): Promise<PomodorocoCycle | null>;
  completeCycle(): Promise<PomodorocoCycle>;
  abandonCycle(): Promise<void>;

  // Progress Tracking
  getCycleProgress(): Promise<CycleProgress>;
  getNextSessionType(): Promise<'work' | 'shortBreak' | 'longBreak'>;
  recordSessionCompletion(sessionId: string): Promise<CycleProgress>;

  // Cycle Navigation
  canAdvanceToNext(): Promise<boolean>;
  shouldTakeLongBreak(): Promise<boolean>;
  getCyclePosition(): Promise<number>;

  // Events
  onCycleComplete(callback: (cycle: PomodorocoCycle) => void): void;
  onProgressUpdate(callback: (progress: CycleProgress) => void): void;
}

export interface CycleServiceError {
  code: 'NO_ACTIVE_CYCLE' | 'INVALID_SESSION' | 'CYCLE_COMPLETE' | 'STORAGE_ERROR';
  message: string;
  cycleId?: string;
  sessionId?: string;
}

// Cycle workflow definition
export const CYCLE_WORKFLOW = [
  'work', // Position 1
  'shortBreak', // Position 2
  'work', // Position 3
  'shortBreak', // Position 4
  'work', // Position 5
  'shortBreak', // Position 6
  'work', // Position 7
  'longBreak', // Position 8
] as const;

export interface StartCycleRequest {
  autoStart?: boolean; // Whether to start first work session immediately
}

export interface RecordSessionRequest {
  sessionId: string;
  sessionType: 'work' | 'shortBreak' | 'longBreak';
  completedAt: Date;
}

export interface CycleServiceEvents {
  cycleStarted: PomodorocoCycle;
  cycleCompleted: PomodorocoCycle;
  progressUpdated: CycleProgress;
  sessionAdvanced: {
    from: 'work' | 'shortBreak' | 'longBreak';
    to: 'work' | 'shortBreak' | 'longBreak';
    position: number;
  };
}
