import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import type { TimerSession } from '@/types/timer-session';

const BACKGROUND_TIMER_TASK = 'background-timer';

interface BackgroundTaskOptions {
  sessionId: string;
  startTime: number;
  duration: number;
  sessionType: string;
}

export class BackgroundTimerService {
  private isTaskRegistered = false;
  private taskOptions: BackgroundTaskOptions | null = null;
  private isLowPowerMode = false;

  async initialize(): Promise<void> {
    try {
      await this.registerBackgroundTask();
      await this.configureBackgroundFetch();
    } catch (error) {
      console.error('Failed to initialize background timer:', error);
    }
  }

  async startBackgroundTask(session: TimerSession): Promise<void> {
    if (!this.isTaskRegistered) {
      await this.initialize();
    }

    this.taskOptions = {
      sessionId: session.id,
      startTime: Date.now(),
      duration: session.duration,
      sessionType: session.type,
    };

    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TIMER_TASK, {
        minimumInterval: 15000, // 15 seconds minimum interval
        stopOnTerminate: false,
        startOnBoot: false,
      });
    } catch (error) {
      console.error('Failed to start background task:', error);
    }
  }

  async stopTask(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TIMER_TASK);
    } catch (error) {
      console.error('Failed to stop background task:', error);
    }

    // Always clear task options, even if unregistration fails
    this.taskOptions = null;
  }

  async isTaskActive(): Promise<boolean> {
    // Task is active if we have task options stored
    // This is the primary indicator of whether we have an active background task
    return this.taskOptions !== null;
  }

  async getTaskOptions(): Promise<BackgroundTaskOptions | null> {
    return this.taskOptions;
  }

  async isLowPowerModeActive(): Promise<boolean> {
    return this.isLowPowerMode;
  }

  async handleLowPowerMode(enabled: boolean): Promise<void> {
    this.isLowPowerMode = enabled;

    if (this.taskOptions) {
      // Adjust background task behavior for low power mode
      this.taskOptions = {
        ...this.taskOptions,
        reducedActivity: enabled,
      } as any;
    }
  }

  async calculateElapsedTime(startTime: Date): Promise<number> {
    const now = Date.now();
    const startTimestamp = startTime.getTime();
    return Math.floor((now - startTimestamp) / 1000);
  }

  async simulateTaskFailure(): Promise<void> {
    // For testing - simulate a background task failure
    await this.stopTask();
    this.taskOptions = null;
  }

  private async registerBackgroundTask(): Promise<void> {
    try {
      if (!TaskManager.isTaskDefined(BACKGROUND_TIMER_TASK)) {
        TaskManager.defineTask(BACKGROUND_TIMER_TASK, async ({ error }) => {
          if (error) {
            console.error('Background task error:', error);
            return BackgroundFetch.BackgroundFetchResult.Failed;
          }

          try {
            // Update timer state based on elapsed time
            const now = Date.now();
            const options = this.taskOptions;

            if (!options) {
              return BackgroundFetch.BackgroundFetchResult.NoData;
            }

            const elapsedSeconds = Math.floor((now - options.startTime) / 1000);
            const remainingTime = Math.max(0, options.duration - elapsedSeconds);

            // Store the updated timer state for when app becomes active
            await this.persistBackgroundState({
              sessionId: options.sessionId,
              elapsedTime: elapsedSeconds,
              remainingTime,
              backgroundedAt: options.startTime,
            });

            return BackgroundFetch.BackgroundFetchResult.NewData;
          } catch (taskError) {
            console.error('Background task execution error:', taskError);
            return BackgroundFetch.BackgroundFetchResult.Failed;
          }
        });

        this.isTaskRegistered = true;
      }
    } catch (error) {
      console.error('Failed to register background task:', error);
      throw error;
    }
  }

  private async configureBackgroundFetch(): Promise<void> {
    try {
      const status = await BackgroundFetch.getStatusAsync();

      if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
        console.warn('Background fetch is disabled');
        return;
      }

      await BackgroundFetch.setMinimumIntervalAsync(15000); // 15 seconds
    } catch (error) {
      console.error('Failed to configure background fetch:', error);
    }
  }

  private async persistBackgroundState(state: any): Promise<void> {
    try {
      // This would integrate with the persistence service
      // For now, just log the state update
      console.log('Background state update:', state);
    } catch (error) {
      console.error('Failed to persist background state:', error);
    }
  }
}

export default BackgroundTimerService;
