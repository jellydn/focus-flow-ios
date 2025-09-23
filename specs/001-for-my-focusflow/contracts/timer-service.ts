/**
 * Timer Service Contract
 * Defines the interface for timer management operations
 */

export interface TimerSession {
  id: string;
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number; // seconds
  remainingTime: number; // seconds
  status: 'idle' | 'running' | 'paused' | 'completed';
  startedAt: Date | null;
  completedAt: Date | null;
  cyclePosition: number; // 1-4 for work sessions
}

export interface TimerServiceContract {
  // Session Management
  startSession(type: TimerSession['type'], duration: number): Promise<TimerSession>;
  pauseSession(): Promise<TimerSession>;
  resumeSession(): Promise<TimerSession>;
  stopSession(): Promise<TimerSession>;
  resetSession(): Promise<TimerSession>;

  // State Queries
  getCurrentSession(): Promise<TimerSession | null>;
  getSessionStatus(): Promise<TimerSession['status']>;
  getRemainingTime(): Promise<number>;

  // Background Operations
  scheduleNotification(session: TimerSession): Promise<void>;
  cancelNotifications(): Promise<void>;
  handleBackgroundTimer(): Promise<TimerSession>;

  // Events
  onSessionComplete(callback: (session: TimerSession) => void): void;
  onSessionTick(callback: (remainingTime: number) => void): void;
  onSessionStateChange(callback: (session: TimerSession) => void): void;
}

export interface TimerServiceError {
  code: 'INVALID_DURATION' | 'SESSION_NOT_FOUND' | 'INVALID_STATE' | 'NOTIFICATION_ERROR';
  message: string;
  session?: TimerSession;
}

// Input validation schemas
export interface StartSessionRequest {
  type: TimerSession['type'];
  duration: number; // Must be 600-5400 for work, 300-1800 for short break, 600-2700 for long break
  cyclePosition?: number; // 1-4, required for work sessions
}

export interface TimerServiceEvents {
  sessionStarted: TimerSession;
  sessionPaused: TimerSession;
  sessionResumed: TimerSession;
  sessionCompleted: TimerSession;
  sessionStopped: TimerSession;
  sessionTick: { session: TimerSession; remainingTime: number };
}
