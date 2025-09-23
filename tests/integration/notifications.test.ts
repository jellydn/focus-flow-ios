import { beforeEach, describe, expect, it, vi } from 'vitest';

// This will fail until implementation exists
import { NotificationService } from '@/services/notification-service';
import { SettingsService } from '@/services/settings-service';
import { TimerService } from '@/services/timer-service';

describe('Notification Scheduling Integration Tests', () => {
  let notificationService: any;
  let timerService: any;
  let settingsService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    notificationService = new NotificationService();
    timerService = new TimerService();
    settingsService = new SettingsService();

    // Mock Expo Notifications
    vi.clearAllMocks();
  });

  describe('Notification Permissions', () => {
    it('should request notification permissions on first use', async () => {
      const permissions = await notificationService.requestPermissions();

      expect(permissions).toMatchObject({
        status: expect.stringMatching(/granted|denied/),
        canAskAgain: expect.any(Boolean),
      });
    });

    it('should check existing notification permissions', async () => {
      const permissions = await notificationService.getPermissions();

      expect(permissions).toMatchObject({
        status: expect.stringMatching(/granted|denied|undetermined/),
      });
    });

    it('should handle denied permissions gracefully', async () => {
      // Mock denied permissions
      vi.mocked(notificationService.getPermissions).mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
      });

      const session = await timerService.startSession('work', 1500);

      // Should not throw error when permissions denied
      await expect(notificationService.scheduleSessionCompletion(session)).resolves.not.toThrow();

      // Should gracefully skip notification scheduling
      const scheduledNotifications = await notificationService.getAllScheduledNotifications();
      expect(scheduledNotifications).toHaveLength(0);
    });
  });

  describe('Session Completion Notifications', () => {
    it('should schedule notification for work session completion', async () => {
      const session = await timerService.startSession('work', 1500);

      await notificationService.scheduleSessionCompletion(session);

      const scheduledNotifications = await notificationService.getAllScheduledNotifications();
      expect(scheduledNotifications).toHaveLength(1);

      const notification = scheduledNotifications[0];
      expect(notification.content).toMatchObject({
        title: expect.stringContaining('Work Session Complete'),
        body: expect.stringContaining('break'),
      });

      // Should be scheduled for 25 minutes from now
      const scheduledDate = new Date(notification.trigger.date);
      const expectedDate = new Date(Date.now() + 1500 * 1000);
      expect(Math.abs(scheduledDate.getTime() - expectedDate.getTime())).toBeLessThan(1000);
    });

    it('should schedule notification for break completion', async () => {
      const session = await timerService.startSession('shortBreak', 300);

      await notificationService.scheduleSessionCompletion(session);

      const scheduledNotifications = await notificationService.getAllScheduledNotifications();
      const notification = scheduledNotifications[0];

      expect(notification.content).toMatchObject({
        title: expect.stringContaining('Break Complete'),
        body: expect.stringContaining('work'),
      });
    });

    it('should schedule notification for long break completion', async () => {
      const session = await timerService.startSession('longBreak', 900);

      await notificationService.scheduleSessionCompletion(session);

      const scheduledNotifications = await notificationService.getAllScheduledNotifications();
      const notification = scheduledNotifications[0];

      expect(notification.content).toMatchObject({
        title: expect.stringContaining('Long Break Complete'),
        body: expect.stringContaining('new cycle'),
      });
    });

    it('should include cycle position in work session notifications', async () => {
      const session = await timerService.startSession('work', 1500);
      session.cyclePosition = 3;

      await notificationService.scheduleSessionCompletion(session);

      const scheduledNotifications = await notificationService.getAllScheduledNotifications();
      const notification = scheduledNotifications[0];

      expect(notification.content.body).toMatch(/3.*4/); // Should mention 3 of 4
    });
  });

  describe('Notification Content and Timing', () => {
    it('should use appropriate notification content for different session types', async () => {
      const testCases = [
        {
          sessionType: 'work',
          expectedTitle: 'Work Session Complete',
          expectedBodyPattern: /time for.*break/i,
        },
        {
          sessionType: 'shortBreak',
          expectedTitle: 'Break Complete',
          expectedBodyPattern: /back to work/i,
        },
        {
          sessionType: 'longBreak',
          expectedTitle: 'Long Break Complete',
          expectedBodyPattern: /new cycle/i,
        },
      ];

      for (const testCase of testCases) {
        const session = await timerService.startSession(testCase.sessionType as any, 300);
        await notificationService.scheduleSessionCompletion(session);

        const notifications = await notificationService.getAllScheduledNotifications();
        const notification = notifications.find((n) =>
          n.content.title.includes(testCase.expectedTitle),
        );

        expect(notification).toBeTruthy();
        expect(notification!.content.body).toMatch(testCase.expectedBodyPattern);

        await notificationService.cancelAllNotifications();
      }
    });

    it('should calculate correct notification timing', async () => {
      const startTime = Date.now();
      const duration = 1200; // 20 minutes

      const session = await timerService.startSession('work', duration);
      await notificationService.scheduleSessionCompletion(session);

      const notifications = await notificationService.getAllScheduledNotifications();
      const notification = notifications[0];

      const scheduledTime = new Date(notification.trigger.date).getTime();
      const expectedTime = startTime + duration * 1000;

      // Should be within 1 second of expected time
      expect(Math.abs(scheduledTime - expectedTime)).toBeLessThan(1000);
    });

    it('should handle notification scheduling for paused sessions', async () => {
      const session = await timerService.startSession('work', 1500);
      await timerService.pauseSession();

      // Should not schedule notification for paused session
      await notificationService.scheduleSessionCompletion(session);

      const notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(0);
    });
  });

  describe('Notification Cancellation', () => {
    it('should cancel notification when session is stopped', async () => {
      const session = await timerService.startSession('work', 1500);
      await notificationService.scheduleSessionCompletion(session);

      // Verify notification was scheduled
      let notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(1);

      // Stop session and cancel notification
      await timerService.stopSession();
      await notificationService.cancelSessionNotification(session.id);

      // Verify notification was cancelled
      notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(0);
    });

    it('should cancel notification when session is reset', async () => {
      const session = await timerService.startSession('work', 1500);
      await notificationService.scheduleSessionCompletion(session);

      await timerService.resetSession();
      await notificationService.cancelSessionNotification(session.id);

      const notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(0);
    });

    it('should cancel all notifications when requested', async () => {
      // Schedule multiple notifications
      for (let i = 0; i < 3; i++) {
        const session = await timerService.startSession('work', 1500 + i * 100);
        await notificationService.scheduleSessionCompletion(session);
      }

      let notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications.length).toBeGreaterThan(0);

      await notificationService.cancelAllNotifications();

      notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(0);
    });
  });

  describe('Settings Integration', () => {
    it('should respect notification settings', async () => {
      // Disable notifications in settings
      await settingsService.updateSettings({ notificationsEnabled: false });

      const session = await timerService.startSession('work', 1500);
      await notificationService.scheduleSessionCompletion(session);

      // Should not schedule notification when disabled
      const notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(0);
    });

    it('should respect sound settings', async () => {
      await settingsService.updateSettings({ soundEnabled: false });

      const session = await timerService.startSession('work', 1500);
      await notificationService.scheduleSessionCompletion(session);

      const notifications = await notificationService.getAllScheduledNotifications();
      if (notifications.length > 0) {
        const notification = notifications[0];
        expect(notification.content.sound).toBeFalsy();
      }
    });

    it('should use sound when enabled', async () => {
      await settingsService.updateSettings({ soundEnabled: true });

      const session = await timerService.startSession('work', 1500);
      await notificationService.scheduleSessionCompletion(session);

      const notifications = await notificationService.getAllScheduledNotifications();
      if (notifications.length > 0) {
        const notification = notifications[0];
        expect(notification.content.sound).toBeTruthy();
      }
    });

    it('should update notification behavior when settings change', async () => {
      const session = await timerService.startSession('work', 1500);

      // Initially enabled
      await settingsService.updateSettings({ notificationsEnabled: true });
      await notificationService.scheduleSessionCompletion(session);

      let notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(1);

      // Disable notifications
      await settingsService.updateSettings({ notificationsEnabled: false });
      await notificationService.updateNotificationPreferences();

      // Should cancel existing notifications
      notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(0);
    });
  });

  describe('Background Notification Delivery', () => {
    it('should deliver notifications when app is backgrounded', async () => {
      const session = await timerService.startSession('work', 5); // 5 seconds for testing
      await notificationService.scheduleSessionCompletion(session);

      // Simulate app going to background
      vi.advanceTimersByTime(6000); // 6 seconds

      // Notification should be delivered
      const deliveredNotifications = await notificationService.getDeliveredNotifications();
      expect(deliveredNotifications.length).toBeGreaterThan(0);

      const notification = deliveredNotifications[0];
      expect(notification.request.content.title).toContain('Work Session Complete');
    });

    it('should handle notification tap when app is closed', async () => {
      const session = await timerService.startSession('work', 5);
      await notificationService.scheduleSessionCompletion(session);

      // Simulate notification delivery and tap
      vi.advanceTimersByTime(6000);
      const response = await notificationService.simulateNotificationTap();

      expect(response).toMatchObject({
        actionIdentifier: expect.any(String),
        notification: expect.any(Object),
      });

      // App should handle the tap appropriately
      await notificationService.handleNotificationResponse(response);
    });
  });

  describe('Error Handling', () => {
    it('should handle notification scheduling failures gracefully', async () => {
      // Mock notification scheduling failure
      vi.mocked(notificationService.scheduleNotificationAsync).mockRejectedValue(
        new Error('Notification scheduling failed'),
      );

      const session = await timerService.startSession('work', 1500);

      // Should not throw error
      await expect(notificationService.scheduleSessionCompletion(session)).resolves.not.toThrow();

      // Should log error but continue functioning
      expect(vi.mocked(console.error)).toHaveBeenCalled();
    });

    it('should handle permission changes during app lifecycle', async () => {
      // Start with permissions granted
      vi.mocked(notificationService.getPermissions).mockResolvedValue({
        status: 'granted',
      });

      const session = await timerService.startSession('work', 1500);
      await notificationService.scheduleSessionCompletion(session);

      // Permissions revoked while app running
      vi.mocked(notificationService.getPermissions).mockResolvedValue({
        status: 'denied',
      });

      // Should handle gracefully when checking permissions later
      const canSchedule = await notificationService.canScheduleNotifications();
      expect(canSchedule).toBe(false);

      // Should cancel existing notifications
      await notificationService.handlePermissionChange();
      const notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(0);
    });

    it('should handle malformed notification data', async () => {
      const invalidSession = {
        id: '',
        type: 'invalid',
        duration: -100,
      };

      // Should handle invalid data gracefully
      await expect(
        notificationService.scheduleSessionCompletion(invalidSession as any),
      ).resolves.not.toThrow();

      const notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(0);
    });
  });
});
