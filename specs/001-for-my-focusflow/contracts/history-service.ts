/**
 * History Service Contract
 * Defines the interface for session history and analytics
 */

export interface SessionHistory {
  id: string;
  date: string; // YYYY-MM-DD format
  completedWorkSessions: number;
  totalFocusTime: number; // seconds
  completedCycles: number;
  averageSessionDuration: number; // seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyAggregate {
  date: string; // YYYY-MM-DD format
  sessionsCompleted: number;
  focusTimeMinutes: number;
  cyclesCompleted: number;
  streakDays: number;
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD format
  totalSessions: number;
  totalFocusHours: number;
  averageSessionsPerDay: number;
  bestDay: string; // YYYY-MM-DD format
  streakDays: number;
}

export interface HistoryServiceContract {
  // Session Recording
  recordCompletedSession(sessionType: 'work' | 'shortBreak' | 'longBreak', duration: number): Promise<SessionHistory>;
  recordCompletedCycle(): Promise<SessionHistory>;

  // Daily History
  getTodayHistory(): Promise<SessionHistory>;
  getHistoryByDate(date: string): Promise<SessionHistory | null>;
  getHistoryRange(startDate: string, endDate: string): Promise<SessionHistory[]>;

  // Analytics
  getWeeklyStats(weekStart?: string): Promise<WeeklyStats>;
  getCurrentStreak(): Promise<number>;
  getTotalFocusTime(): Promise<number>;
  getAverageSessionDuration(): Promise<number>;

  // Aggregates (long-term storage)
  getDailyAggregates(months: number): Promise<DailyAggregate[]>;
  createDailyAggregate(date: string): Promise<DailyAggregate>;

  // Cleanup
  cleanupOldHistory(): Promise<void>; // Remove >30 day old detailed history
  cleanupOldAggregates(): Promise<void>; // Remove >6 month old aggregates

  // Events
  onHistoryUpdate(callback: (history: SessionHistory) => void): void;
  onStreakUpdate(callback: (streak: number) => void): void;
}

export interface HistoryServiceError {
  code: 'INVALID_DATE' | 'STORAGE_ERROR' | 'CALCULATION_ERROR';
  message: string;
  date?: string;
}

export interface RecordSessionRequest {
  sessionType: 'work' | 'shortBreak' | 'longBreak';
  duration: number; // actual duration in seconds
  completedAt?: Date; // defaults to now
}

export interface GetStatsRequest {
  startDate?: string; // YYYY-MM-DD, defaults to 30 days ago
  endDate?: string; // YYYY-MM-DD, defaults to today
  includeIncomplete?: boolean; // include days with 0 sessions
}

// Data retention policies
export const RETENTION_POLICY = {
  detailedHistory: 30, // days
  dailyAggregates: 180, // days (6 months)
  cleanupInterval: 7 // days between cleanup runs
} as const;

export interface HistoryServiceEvents {
  historyUpdated: SessionHistory;
  streakIncreased: { newStreak: number; date: string };
  streakBroken: { lastStreak: number; date: string };
  milestoneReached: {
    type: 'sessions' | 'focusTime' | 'cycles' | 'streak';
    value: number;
    milestone: number;
  };
}