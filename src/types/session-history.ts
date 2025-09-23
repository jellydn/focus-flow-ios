import type { SessionType } from './timer-session';

export interface SessionHistory {
  id: string;
  date: string; // YYYY-MM-DD format
  completedWorkSessions: number;
  totalFocusTime: number; // in seconds
  completedCycles: number;
  averageSessionDuration: number; // in seconds
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
  weekStart: string; // YYYY-MM-DD format (Monday)
  totalSessions: number;
  totalFocusHours: number;
  averageSessionsPerDay: number;
  bestDay: string; // YYYY-MM-DD format
  streakDays: number;
}

export interface HistoryServiceContract {
  // Session recording
  recordCompletedSession(type: SessionType, duration: number): Promise<SessionHistory>;
  recordCompletedCycle(): Promise<SessionHistory>;

  // Daily history retrieval
  getTodayHistory(): Promise<SessionHistory | null>;
  getHistoryByDate(date: string): Promise<SessionHistory | null>;
  getHistoryRange(startDate: string, endDate: string): Promise<SessionHistory[]>;

  // Analytics
  getWeeklyStats(): Promise<WeeklyStats>;
  getCurrentStreak(): Promise<number>;
  getTotalFocusTime(): Promise<number>;
  getAverageSessionDuration(): Promise<number>;

  // Daily aggregates
  getDailyAggregates(months: number): Promise<DailyAggregate[]>;
  createDailyAggregate(date: string): Promise<DailyAggregate>;

  // Data cleanup
  cleanupOldHistory(): Promise<void>; // Remove data >30 days
  cleanupOldAggregates(): Promise<void>; // Remove data >6 months

  // Event handlers
  onHistoryUpdate(callback: (history: SessionHistory) => void): void;
  onStreakUpdate(callback: (streak: number) => void): void;
}