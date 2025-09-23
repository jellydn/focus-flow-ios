import AsyncStorage from '@react-native-async-storage/async-storage';
import { nanoid } from 'nanoid';
import type {
  SessionHistory,
  DailyAggregate,
  WeeklyStats,
  HistoryServiceContract,
} from '@/types/session-history';
import type { SessionType } from '@/types/timer-session';

const HISTORY_STORAGE_KEY = '@focusflow:history';
const AGGREGATES_STORAGE_KEY = '@focusflow:aggregates';

export class HistoryService implements HistoryServiceContract {
  private callbacks = {
    onHistoryUpdate: [] as Array<(history: SessionHistory) => void>,
    onStreakUpdate: [] as Array<(streak: number) => void>,
  };

  async recordCompletedSession(type: SessionType, duration: number): Promise<SessionHistory> {
    if (!this.isValidSessionType(type)) {
      throw new Error(`Invalid session type: ${type}`);
    }

    if (duration < 0) {
      throw new Error(`Invalid duration: ${duration}`);
    }

    const today = this.getTodayDateString();
    let todayHistory = await this.getHistoryByDate(today);

    if (!todayHistory) {
      todayHistory = this.createNewDayHistory(today);
    }

    // Only count work sessions for focus time and session counts
    if (type === 'work') {
      todayHistory.completedWorkSessions += 1;
      todayHistory.totalFocusTime += duration;

      // Recalculate average session duration
      todayHistory.averageSessionDuration =
        todayHistory.totalFocusTime / todayHistory.completedWorkSessions;
    }

    todayHistory.updatedAt = new Date();

    await this.saveHistory(todayHistory);

    // Notify callbacks
    this.callbacks.onHistoryUpdate.forEach(callback => {
      callback({ ...todayHistory! });
    });

    return { ...todayHistory };
  }

  async recordCompletedCycle(): Promise<SessionHistory> {
    const today = this.getTodayDateString();
    let todayHistory = await this.getHistoryByDate(today);

    if (!todayHistory) {
      todayHistory = this.createNewDayHistory(today);
    }

    todayHistory.completedCycles += 1;
    todayHistory.updatedAt = new Date();

    await this.saveHistory(todayHistory);

    // Check and update streak
    const newStreak = await this.getCurrentStreak();
    this.callbacks.onStreakUpdate.forEach(callback => {
      callback(newStreak);
    });

    // Notify callbacks
    this.callbacks.onHistoryUpdate.forEach(callback => {
      callback({ ...todayHistory! });
    });

    return { ...todayHistory };
  }

  async getTodayHistory(): Promise<SessionHistory | null> {
    const today = this.getTodayDateString();
    return this.getHistoryByDate(today);
  }

  async getHistoryByDate(date: string): Promise<SessionHistory | null> {
    if (!this.isValidDateFormat(date)) {
      throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
    }

    try {
      const allHistory = await this.loadAllHistory();
      return allHistory.find(h => h.date === date) || null;
    } catch (error) {
      console.error('Failed to get history by date:', error);
      return null;
    }
  }

  async getHistoryRange(startDate: string, endDate: string): Promise<SessionHistory[]> {
    if (!this.isValidDateFormat(startDate) || !this.isValidDateFormat(endDate)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw new Error('Start date must be before or equal to end date');
    }

    try {
      const allHistory = await this.loadAllHistory();
      return allHistory.filter(h => h.date >= startDate && h.date <= endDate);
    } catch (error) {
      console.error('Failed to get history range:', error);
      return [];
    }
  }

  async getWeeklyStats(): Promise<WeeklyStats> {
    const today = new Date();
    const weekStart = this.getWeekStart(today);
    const weekEnd = this.getWeekEnd(today);

    const weekHistory = await this.getHistoryRange(
      weekStart.toISOString().split('T')[0],
      weekEnd.toISOString().split('T')[0]
    );

    const totalSessions = weekHistory.reduce((sum, h) => sum + h.completedWorkSessions, 0);
    const totalFocusHours = weekHistory.reduce((sum, h) => sum + h.totalFocusTime, 0) / 3600;
    const averageSessionsPerDay = totalSessions / 7;

    // Find best day (most work sessions)
    const bestDayHistory = weekHistory.reduce((best, current) =>
      current.completedWorkSessions > best.completedWorkSessions ? current : best,
      weekHistory[0] || { date: weekStart.toISOString().split('T')[0], completedWorkSessions: 0 }
    );

    const streakDays = await this.getCurrentStreak();

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      totalSessions,
      totalFocusHours,
      averageSessionsPerDay,
      bestDay: bestDayHistory.date,
      streakDays,
    };
  }

  async getCurrentStreak(): Promise<number> {
    try {
      const allHistory = await this.loadAllHistory();
      const sortedHistory = allHistory.sort((a, b) => b.date.localeCompare(a.date));

      let streak = 0;
      const today = this.getTodayDateString();
      let checkDate = new Date(today);

      for (const history of sortedHistory) {
        const historyDate = checkDate.toISOString().split('T')[0];

        if (history.date === historyDate && history.completedWorkSessions > 0) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (history.date < historyDate) {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Failed to calculate streak:', error);
      return 0;
    }
  }

  async getTotalFocusTime(): Promise<number> {
    try {
      const allHistory = await this.loadAllHistory();
      return allHistory.reduce((total, h) => total + h.totalFocusTime, 0);
    } catch (error) {
      console.error('Failed to get total focus time:', error);
      return 0;
    }
  }

  async getAverageSessionDuration(): Promise<number> {
    try {
      const allHistory = await this.loadAllHistory();
      const totalSessions = allHistory.reduce((sum, h) => sum + h.completedWorkSessions, 0);
      const totalTime = allHistory.reduce((sum, h) => sum + h.totalFocusTime, 0);

      return totalSessions > 0 ? totalTime / totalSessions : 0;
    } catch (error) {
      console.error('Failed to get average session duration:', error);
      return 0;
    }
  }

  async getDailyAggregates(months: number): Promise<DailyAggregate[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);

    const history = await this.getHistoryRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    return history.map(h => ({
      date: h.date,
      sessionsCompleted: h.completedWorkSessions,
      focusTimeMinutes: Math.round(h.totalFocusTime / 60),
      cyclesCompleted: h.completedCycles,
      streakDays: 0, // Would need to calculate streak for each date
    }));
  }

  async createDailyAggregate(date: string): Promise<DailyAggregate> {
    const history = await this.getHistoryByDate(date);

    return {
      date,
      sessionsCompleted: history?.completedWorkSessions || 0,
      focusTimeMinutes: Math.round((history?.totalFocusTime || 0) / 60),
      cyclesCompleted: history?.completedCycles || 0,
      streakDays: await this.getCurrentStreak(),
    };
  }

  async cleanupOldHistory(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      const cutoffString = cutoffDate.toISOString().split('T')[0];

      const allHistory = await this.loadAllHistory();
      const filteredHistory = allHistory.filter(h => h.date >= cutoffString);

      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('Failed to cleanup old history:', error);
    }
  }

  async cleanupOldAggregates(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 6);
      const cutoffString = cutoffDate.toISOString().split('T')[0];

      const allAggregates = await this.loadAllAggregates();
      const filteredAggregates = allAggregates.filter(a => a.date >= cutoffString);

      await AsyncStorage.setItem(AGGREGATES_STORAGE_KEY, JSON.stringify(filteredAggregates));
    } catch (error) {
      console.error('Failed to cleanup old aggregates:', error);
    }
  }

  onHistoryUpdate(callback: (history: SessionHistory) => void): void {
    this.callbacks.onHistoryUpdate.push(callback);
  }

  onStreakUpdate(callback: (streak: number) => void): void {
    this.callbacks.onStreakUpdate.push(callback);
  }

  private async loadAllHistory(): Promise<SessionHistory[]> {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  }

  private async loadAllAggregates(): Promise<DailyAggregate[]> {
    try {
      const stored = await AsyncStorage.getItem(AGGREGATES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load aggregates:', error);
      return [];
    }
  }

  private async saveHistory(history: SessionHistory): Promise<void> {
    try {
      const allHistory = await this.loadAllHistory();
      const existingIndex = allHistory.findIndex(h => h.id === history.id);

      if (existingIndex >= 0) {
        allHistory[existingIndex] = history;
      } else {
        allHistory.push(history);
      }

      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allHistory));
    } catch (error) {
      console.error('Failed to save history:', error);
      throw error;
    }
  }

  private createNewDayHistory(date: string): SessionHistory {
    return {
      id: nanoid(),
      date,
      completedWorkSessions: 0,
      totalFocusTime: 0,
      completedCycles: 0,
      averageSessionDuration: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private isValidDateFormat(date: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  }

  private isValidSessionType(type: SessionType): boolean {
    return ['work', 'shortBreak', 'longBreak'].includes(type);
  }

  private getWeekStart(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private getWeekEnd(date: Date): Date {
    const end = this.getWeekStart(date);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}