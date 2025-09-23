import { beforeEach, describe, expect, it, vi } from 'vitest';
// This will fail until implementation exists
import { HistoryService } from '@/services/history-service';
import type {
  DailyAggregate,
  HistoryServiceContract,
  SessionHistory,
  WeeklyStats,
} from '@/types/session-history';

describe('HistoryService Contract Tests', () => {
  let historyService: HistoryServiceContract;

  beforeEach(() => {
    vi.clearAllMocks();
    historyService = new HistoryService();
  });

  describe('Session Recording', () => {
    it('should record completed work session', async () => {
      const history = await historyService.recordCompletedSession('work', 1500);

      expect(history).toMatchObject({
        id: expect.any(String),
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
        completedWorkSessions: 1,
        totalFocusTime: 1500,
        completedCycles: 0,
        averageSessionDuration: 1500,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should record multiple work sessions and accumulate stats', async () => {
      await historyService.recordCompletedSession('work', 1500);
      const history = await historyService.recordCompletedSession('work', 1400);

      expect(history).toMatchObject({
        completedWorkSessions: 2,
        totalFocusTime: 2900, // 1500 + 1400
        averageSessionDuration: 1450, // (1500 + 1400) / 2
      });
    });

    it('should not count break sessions in work session count', async () => {
      await historyService.recordCompletedSession('work', 1500);
      await historyService.recordCompletedSession('shortBreak', 300);
      const history = await historyService.recordCompletedSession('longBreak', 900);

      expect(history.completedWorkSessions).toBe(1);
      expect(history.totalFocusTime).toBe(1500); // Only work sessions count
    });

    it('should record completed cycle', async () => {
      const history = await historyService.recordCompletedCycle();

      expect(history.completedCycles).toBeGreaterThanOrEqual(1);
    });

    it('should update existing daily history instead of creating new', async () => {
      const firstHistory = await historyService.recordCompletedSession('work', 1500);
      const secondHistory = await historyService.recordCompletedSession('work', 1500);

      expect(firstHistory.id).toBe(secondHistory.id);
      expect(secondHistory.completedWorkSessions).toBe(2);
    });
  });

  describe('Daily History Retrieval', () => {
    it('should get today history', async () => {
      await historyService.recordCompletedSession('work', 1500);
      const todayHistory = await historyService.getTodayHistory();

      expect(todayHistory).toMatchObject({
        completedWorkSessions: 1,
        totalFocusTime: 1500,
      });
    });

    it('should get history by specific date', async () => {
      const testDate = '2025-09-23';
      // Note: This assumes the service can handle different dates
      const history = await historyService.getHistoryByDate(testDate);

      // Should return null if no data for that date
      expect(history).toBeNull();
    });

    it('should get history range between dates', async () => {
      const startDate = '2025-09-20';
      const endDate = '2025-09-23';
      const historyRange = await historyService.getHistoryRange(startDate, endDate);

      expect(Array.isArray(historyRange)).toBe(true);
    });
  });

  describe('Analytics', () => {
    it('should calculate weekly stats', async () => {
      // Record some sessions
      await historyService.recordCompletedSession('work', 1500);
      await historyService.recordCompletedSession('work', 1500);
      await historyService.recordCompletedCycle();

      const weeklyStats = await historyService.getWeeklyStats();

      expect(weeklyStats).toMatchObject({
        weekStart: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        totalSessions: expect.any(Number),
        totalFocusHours: expect.any(Number),
        averageSessionsPerDay: expect.any(Number),
        bestDay: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        streakDays: expect.any(Number),
      });
    });

    it('should track current streak', async () => {
      await historyService.recordCompletedSession('work', 1500);
      const streak = await historyService.getCurrentStreak();

      expect(typeof streak).toBe('number');
      expect(streak).toBeGreaterThanOrEqual(0);
    });

    it('should calculate total focus time', async () => {
      await historyService.recordCompletedSession('work', 1500);
      await historyService.recordCompletedSession('work', 1200);

      const totalFocusTime = await historyService.getTotalFocusTime();

      expect(totalFocusTime).toBeGreaterThanOrEqual(2700);
    });

    it('should calculate average session duration', async () => {
      await historyService.recordCompletedSession('work', 1500);
      await historyService.recordCompletedSession('work', 1200);

      const avgDuration = await historyService.getAverageSessionDuration();

      expect(avgDuration).toBe(1350); // (1500 + 1200) / 2
    });
  });

  describe('Daily Aggregates', () => {
    it('should get daily aggregates for specified months', async () => {
      const aggregates = await historyService.getDailyAggregates(1);

      expect(Array.isArray(aggregates)).toBe(true);
    });

    it('should create daily aggregate for specific date', async () => {
      const testDate = '2025-09-23';
      const aggregate = await historyService.createDailyAggregate(testDate);

      expect(aggregate).toMatchObject({
        date: testDate,
        sessionsCompleted: expect.any(Number),
        focusTimeMinutes: expect.any(Number),
        cyclesCompleted: expect.any(Number),
        streakDays: expect.any(Number),
      });
    });
  });

  describe('Data Cleanup', () => {
    it('should cleanup old history (>30 days)', async () => {
      await expect(historyService.cleanupOldHistory()).resolves.not.toThrow();
    });

    it('should cleanup old aggregates (>6 months)', async () => {
      await expect(historyService.cleanupOldAggregates()).resolves.not.toThrow();
    });
  });

  describe('Event Handling', () => {
    it('should register onHistoryUpdate callback', () => {
      const callback = vi.fn();

      expect(() => {
        historyService.onHistoryUpdate(callback);
      }).not.toThrow();
    });

    it('should register onStreakUpdate callback', () => {
      const callback = vi.fn();

      expect(() => {
        historyService.onStreakUpdate(callback);
      }).not.toThrow();
    });

    it('should call onHistoryUpdate when session recorded', async () => {
      const callback = vi.fn();
      historyService.onHistoryUpdate(callback);

      const history = await historyService.recordCompletedSession('work', 1500);

      expect(callback).toHaveBeenCalledWith(history);
    });

    it('should call onStreakUpdate when streak changes', async () => {
      const callback = vi.fn();
      historyService.onStreakUpdate(callback);

      await historyService.recordCompletedSession('work', 1500);

      // Should be called when streak increases
      expect(callback).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid date format', async () => {
      await expect(historyService.getHistoryByDate('invalid-date')).rejects.toThrow();
    });

    it('should handle invalid session type', async () => {
      await expect(historyService.recordCompletedSession('invalid' as any, 1500)).rejects.toThrow();
    });

    it('should handle negative duration', async () => {
      await expect(historyService.recordCompletedSession('work', -100)).rejects.toThrow();
    });

    it('should handle invalid date range', async () => {
      await expect(
        historyService.getHistoryRange('2025-09-25', '2025-09-20'), // end before start
      ).rejects.toThrow();
    });
  });

  describe('Data Validation', () => {
    it('should ensure session history dates are in YYYY-MM-DD format', async () => {
      const history = await historyService.recordCompletedSession('work', 1500);

      expect(history.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should ensure numeric fields are non-negative', async () => {
      const history = await historyService.recordCompletedSession('work', 1500);

      expect(history.completedWorkSessions).toBeGreaterThanOrEqual(0);
      expect(history.totalFocusTime).toBeGreaterThanOrEqual(0);
      expect(history.completedCycles).toBeGreaterThanOrEqual(0);
      expect(history.averageSessionDuration).toBeGreaterThanOrEqual(0);
    });

    it('should ensure updatedAt is greater than or equal to createdAt', async () => {
      const history = await historyService.recordCompletedSession('work', 1500);

      expect(history.updatedAt.getTime()).toBeGreaterThanOrEqual(history.createdAt.getTime());
    });
  });
});
