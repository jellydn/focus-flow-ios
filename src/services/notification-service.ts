import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import type { TimerSession } from '@/types/timer-session';
import type { UserSettings } from '@/types/user-settings';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationPermissions {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain?: boolean;
}

export class NotificationService {
  private permissionStatus: NotificationPermissions | null = null;
  private settings: UserSettings | null = null;

  async initialize(): Promise<void> {
    try {
      this.permissionStatus = await this.getPermissions();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  async requestPermissions(): Promise<NotificationPermissions> {
    try {
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
          allowDisplayInCarPlay: false,
          allowCriticalAlerts: false,
          provideAppNotificationSettings: false,
          allowProvisional: false,
        },
      });

      this.permissionStatus = {
        status: status as 'granted' | 'denied' | 'undetermined',
        canAskAgain,
      };

      return this.permissionStatus;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return { status: 'denied' };
    }
  }

  async getPermissions(): Promise<NotificationPermissions> {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();

      this.permissionStatus = {
        status: status as 'granted' | 'denied' | 'undetermined',
        canAskAgain,
      };

      return this.permissionStatus;
    } catch (error) {
      console.error('Failed to get notification permissions:', error);
      return { status: 'denied' };
    }
  }

  async canScheduleNotifications(): Promise<boolean> {
    const permissions = await this.getPermissions();
    return permissions.status === 'granted' && this.areNotificationsEnabled();
  }

  async scheduleSessionCompletion(session: TimerSession): Promise<void> {
    try {
      const canSchedule = await this.canScheduleNotifications();

      if (!canSchedule) {
        console.log('Cannot schedule notifications: permissions denied or notifications disabled');
        return;
      }

      if (session.status === 'paused') {
        console.log('Not scheduling notification for paused session');
        return;
      }

      if (!session.id || session.duration <= 0 || session.remainingTime <= 0) {
        console.log('Not scheduling notification for invalid session data');
        return;
      }

      const scheduledTime = new Date(Date.now() + session.remainingTime * 1000);
      const content = this.createNotificationContent(session);

      await Notifications.scheduleNotificationAsync({
        identifier: `session-${session.id}`,
        content,
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: session.remainingTime,
          repeats: false,
        },
      });

      console.log(`Notification scheduled for ${scheduledTime.toISOString()}`);
    } catch (error) {
      console.error('Failed to schedule session completion notification:', error);
    }
  }

  async cancelSessionNotification(sessionId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(`session-${sessionId}`);
    } catch (error) {
      console.error('Failed to cancel session notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async getAllScheduledNotifications(): Promise<any[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  async getDeliveredNotifications(): Promise<any[]> {
    try {
      return await Notifications.getPresentedNotificationsAsync();
    } catch (error) {
      console.error('Failed to get delivered notifications:', error);
      return [];
    }
  }

  async handleNotificationResponse(response: any): Promise<void> {
    try {
      // Handle notification tap - could navigate to appropriate screen
      console.log('Notification response:', response);
    } catch (error) {
      console.error('Failed to handle notification response:', error);
    }
  }

  async updateNotificationPreferences(): Promise<void> {
    // Cancel existing notifications if notifications are disabled
    if (!this.areNotificationsEnabled()) {
      await this.cancelAllNotifications();
    }
  }

  async handlePermissionChange(): Promise<void> {
    const permissions = await this.getPermissions();

    if (permissions.status === 'denied') {
      // Cancel all notifications if permissions are revoked
      await this.cancelAllNotifications();
    }
  }

  async simulateNotificationTap(): Promise<any> {
    // For testing purposes
    return {
      actionIdentifier: 'default',
      notification: {
        request: {
          content: {
            title: 'Test Notification',
            body: 'Test body',
          },
        },
      },
    };
  }

  async scheduleNotificationAsync(notification: any): Promise<string> {
    // Mock implementation for testing
    return Notifications.scheduleNotificationAsync(notification);
  }

  updateSettings(settings: UserSettings): void {
    this.settings = settings;
  }

  private createNotificationContent(session: TimerSession): any {
    const soundEnabled = this.settings?.soundEnabled ?? true;

    switch (session.type) {
      case 'work':
        return {
          title: 'Work Session Complete! 🎉',
          body: this.getWorkCompletionMessage(session),
          sound: soundEnabled,
          data: {
            sessionId: session.id,
            sessionType: session.type,
          },
        };

      case 'shortBreak':
        return {
          title: 'Break Complete! ☕',
          body: 'Time to get back to work and stay focused!',
          sound: soundEnabled,
          data: {
            sessionId: session.id,
            sessionType: session.type,
          },
        };

      case 'longBreak':
        return {
          title: 'Long Break Complete! 🌟',
          body: 'Great job! Ready to start a new cycle?',
          sound: soundEnabled,
          data: {
            sessionId: session.id,
            sessionType: session.type,
          },
        };

      default:
        return {
          title: 'Session Complete',
          body: 'Your timer session has finished.',
          sound: soundEnabled,
          data: {
            sessionId: session.id,
            sessionType: session.type,
          },
        };
    }
  }

  private getWorkCompletionMessage(session: TimerSession): string {
    if (session.cyclePosition) {
      const position = session.cyclePosition;
      if (position <= 6) {
        return `Great focus! Time for a short break. (${Math.ceil(position / 2)} of 4 work sessions)`;
      } else {
        return "Excellent work! Time for a long break - you've earned it!";
      }
    }

    return 'Time for a well-deserved break!';
  }

  private areNotificationsEnabled(): boolean {
    return this.settings?.notificationsEnabled ?? true;
  }
}

export default NotificationService;
