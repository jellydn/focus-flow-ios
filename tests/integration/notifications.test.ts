import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest';

// Create a stateful mock storage
const mockStorage = new Map<string, string>();

// Create mock notification storage
const mockNotifications = new Map<string, any>();
const mockDeliveredNotifications: any[] = [];

// Mock AsyncStorage BEFORE importing services
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage.get(key) || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      mockStorage.delete(key);
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      mockStorage.clear();
      return Promise.resolve();
    }),
    getAllKeys: vi.fn(() => Promise.resolve(Array.from(mockStorage.keys()))),
    multiGet: vi.fn(() => Promise.resolve([])),
    multiSet: vi.fn(() => Promise.resolve()),
    mergeItem: vi.fn(() => Promise.resolve()),
    multiMerge: vi.fn(() => Promise.resolve()),
    multiRemove: vi.fn(() => Promise.resolve()),
    flushGetRequests: vi.fn(() => Promise.resolve()),
  },
}));

// Mock Expo Notifications BEFORE importing services
vi.mock('expo-notifications', () => ({
  setNotificationHandler: vi.fn(),
  requestPermissionsAsync: vi.fn(() => Promise.resolve({
    status: 'granted',
    canAskAgain: true,
  })),
  getPermissionsAsync: vi.fn(() => Promise.resolve({
    status: 'granted',
    canAskAgain: true,
  })),
  scheduleNotificationAsync: vi.fn((notification) => {
    const id = notification.identifier || `notification-${Date.now()}`;
    const trigger = {
      ...notification.trigger,
      date: new Date(Date.now() + (notification.trigger.seconds * 1000)),
    };
    mockNotifications.set(id, {
      identifier: id,
      content: notification.content,
      trigger: trigger,
    });
    return Promise.resolve(id);
  }),
  cancelScheduledNotificationAsync: vi.fn((id) => {
    mockNotifications.delete(id);
    return Promise.resolve();
  }),
  cancelAllScheduledNotificationsAsync: vi.fn(() => {
    mockNotifications.clear();
    return Promise.resolve();
  }),
  getAllScheduledNotificationsAsync: vi.fn(() =>
    Promise.resolve(Array.from(mockNotifications.values()))
  ),
  getPresentedNotificationsAsync: vi.fn(() =>
    Promise.resolve([...mockDeliveredNotifications])
  ),
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
  },
}));

// Now import services after mocking AsyncStorage
import { NotificationService } from '@/services/notification-service';
import { SettingsService } from '@/services/settings-service';
import { TimerService } from '@/services/timer-service';

describe('Notification Scheduling Integration Tests', () => {
  let notificationService: any;
  let timerService: any;
  let settingsService: any;

  beforeEach(() => {
    // Clear all state before each test
    vi.clearAllMocks();
    vi.clearAllTimers();
    mockStorage.clear();
    mockNotifications.clear();
    mockDeliveredNotifications.length = 0;

    // Reset fake timers
    vi.useFakeTimers();

    // Create fresh service instances
    notificationService = new NotificationService();
    timerService = new TimerService();
    settingsService = new SettingsService();
  });

  afterEach(() => {
    vi.useRealTimers(); // Restore real timers after each test
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
      // Mock denied permissions at the Expo Notifications level
      const Notifications = await import('expo-notifications');
      const originalMock = (Notifications.getPermissionsAsync as any).getMockImplementation();

      (Notifications.getPermissionsAsync as any).mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
      });

      const session = await timerService.startSession('work', 1500);

      // Should not throw error when permissions denied
      await expect(notificationService.scheduleSessionCompletion(session)).resolves.not.toThrow();

      // Should gracefully skip notification scheduling
      const scheduledNotifications = await notificationService.getAllScheduledNotifications();
      expect(scheduledNotifications).toHaveLength(0);

      // Restore original mock for subsequent tests
      (Notifications.getPermissionsAsync as any).mockImplementation(originalMock);
    });
  });

  describe('Session Completion Notifications', () => {
    it('should schedule notification for work session completion', async () => {
      // Ensure notifications are enabled
      notificationService.updateSettings({ notificationsEnabled: true });

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
      notificationService.updateSettings({ notificationsEnabled: true });

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
      notificationService.updateSettings({ notificationsEnabled: true });

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
      notificationService.updateSettings({ notificationsEnabled: true });

      const session = await timerService.startSession('work', 1500);
      session.cyclePosition = 5; // 5th session = 3rd work session (ceil(5/2) = 3)

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

      notificationService.updateSettings({ notificationsEnabled: true });

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
      notificationService.updateSettings({ notificationsEnabled: true });

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
      await timerService.startSession('work', 1500);
      const pausedSession = await timerService.pauseSession();

      // Should not schedule notification for paused session
      await notificationService.scheduleSessionCompletion(pausedSession);

      const notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(0);
    });
  });

  describe('Notification Cancellation', () => {
    it('should cancel notification when session is stopped', async () => {
      notificationService.updateSettings({ notificationsEnabled: true });

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
      notificationService.updateSettings({ notificationsEnabled: true });

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
      const settings = await settingsService.updateSettings({ notificationsEnabled: false });

      // Update notification service with settings
      notificationService.updateSettings(settings);

      const session = await timerService.startSession('work', 1500);
      await notificationService.scheduleSessionCompletion(session);

      // Should not schedule notification when disabled
      const notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(0);
    });

    it('should respect sound settings', async () => {
      const settings = await settingsService.updateSettings({ soundEnabled: false });
      notificationService.updateSettings(settings);

      const session = await timerService.startSession('work', 1500);
      await notificationService.scheduleSessionCompletion(session);

      const notifications = await notificationService.getAllScheduledNotifications();
      if (notifications.length > 0) {
        const notification = notifications[0];
        expect(notification.content.sound).toBeFalsy();
      }
    });

    it('should use sound when enabled', async () => {
      const settings = await settingsService.updateSettings({ soundEnabled: true });
      notificationService.updateSettings(settings);

      const session = await timerService.startSession('work', 1500);
      await notificationService.scheduleSessionCompletion(session);

      const notifications = await notificationService.getAllScheduledNotifications();
      if (notifications.length > 0) {
        const notification = notifications[0];
        expect(notification.content.sound).toBeTruthy();
      }
    });

    it('should update notification behavior when settings change', async () => {
      notificationService.updateSettings({ notificationsEnabled: true });

      const session = await timerService.startSession('work', 1500);

      // Initially enabled
      let settings = await settingsService.updateSettings({ notificationsEnabled: true });
      notificationService.updateSettings(settings);
      await notificationService.scheduleSessionCompletion(session);

      let notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(1);

      // Disable notifications
      settings = await settingsService.updateSettings({ notificationsEnabled: false });
      notificationService.updateSettings(settings);
      await notificationService.updateNotificationPreferences();

      // Should cancel existing notifications
      notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(0);
    });
  });

  describe('Background Notification Delivery', () => {
    it('should deliver notifications when app is backgrounded', async () => {
      notificationService.updateSettings({ notificationsEnabled: true });

      const session = await timerService.startSession('work', 5); // 5 seconds for testing
      await notificationService.scheduleSessionCompletion(session);

      // Simulate app going to background and notification delivery
      vi.advanceTimersByTime(6000); // 6 seconds

      // Simulate notification being delivered by copying from scheduled to delivered
      const scheduledNotifications = await notificationService.getAllScheduledNotifications();
      if (scheduledNotifications.length > 0) {
        mockDeliveredNotifications.push({
          request: {
            identifier: scheduledNotifications[0].identifier,
            content: scheduledNotifications[0].content,
          },
        });
      }

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
      // Mock console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock Expo Notifications scheduling failure
      const Notifications = await import('expo-notifications');
      const originalScheduleMock = (Notifications.scheduleNotificationAsync as any).getMockImplementation();
      (Notifications.scheduleNotificationAsync as any).mockRejectedValue(new Error('Notification scheduling failed'));

      const session = await timerService.startSession('work', 1500);

      // Should not throw error
      await expect(notificationService.scheduleSessionCompletion(session)).resolves.not.toThrow();

      // Should log error but continue functioning
      expect(consoleSpy).toHaveBeenCalled();

      // Restore mocks
      (Notifications.scheduleNotificationAsync as any).mockImplementation(originalScheduleMock);
      consoleSpy.mockRestore();
    });

    it('should handle permission changes during app lifecycle', async () => {
      const Notifications = await import('expo-notifications');
      const originalMock = (Notifications.getPermissionsAsync as any).getMockImplementation();

      // Start with permissions granted
      (Notifications.getPermissionsAsync as any).mockResolvedValue({
        status: 'granted',
      });

      const session = await timerService.startSession('work', 1500);
      await notificationService.scheduleSessionCompletion(session);

      // Permissions revoked while app running
      (Notifications.getPermissionsAsync as any).mockResolvedValue({
        status: 'denied',
      });

      // Should handle gracefully when checking permissions later
      const canSchedule = await notificationService.canScheduleNotifications();
      expect(canSchedule).toBe(false);

      // Should cancel existing notifications
      await notificationService.handlePermissionChange();
      const notifications = await notificationService.getAllScheduledNotifications();
      expect(notifications).toHaveLength(0);

      // Restore original mock for subsequent tests
      (Notifications.getPermissionsAsync as any).mockImplementation(originalMock);
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
