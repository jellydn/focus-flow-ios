export type SessionType = 'work' | 'shortBreak' | 'longBreak';

export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'corrupted';

export interface TimerSession {
  id: string;
  type: SessionType;
  duration: number; // in seconds
  remainingTime: number; // in seconds
  status: SessionStatus;
  cyclePosition?: number;
  startedAt: Date | null;
  completedAt: Date | null;
  pausedAt: Date | null;
  resumedAt: Date | null;
}

export interface TimerServiceContract {
  // Session management
  startSession(type: SessionType, duration: number): Promise<TimerSession>;
  pauseSession(): Promise<TimerSession>;
  resumeSession(): Promise<TimerSession>;
  stopSession(): Promise<TimerSession>;
  resetSession(): Promise<TimerSession>;

  // State queries
  getCurrentSession(): Promise<TimerSession | null>;
  getSessionStatus(): Promise<SessionStatus>;
  getRemainingTime(): Promise<number>;

  // Background operations
  scheduleNotification(session: TimerSession): Promise<void>;
  cancelNotifications(): Promise<void>;
  handleBackgroundTimer(): Promise<TimerSession>;

  // Event handlers
  onSessionComplete(callback: (session: TimerSession) => void): void;
  onSessionTick(callback: (remainingTime: number) => void): void;
  onSessionStateChange(callback: (session: TimerSession) => void): void;
}
