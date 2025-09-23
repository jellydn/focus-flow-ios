import { AppState, type AppStateStatus } from 'react-native';
import type { TimerSession } from '@/types/timer-session';

type AppStateChangeCallback = (state: AppStateStatus) => void;

export class AppStateService {
  private currentState: AppStateStatus = 'active';
  private backgroundedAt: Date | null = null;
  private callbacks: AppStateChangeCallback[] = [];
  private subscription: any = null;

  initialize(): void {
    this.currentState = AppState.currentState;

    this.subscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  cleanup(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }

  async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    const previousState = this.currentState;

    // Track when app goes to background
    if (previousState === 'active' && nextAppState === 'background') {
      this.backgroundedAt = new Date();
      console.log('App backgrounded at:', this.backgroundedAt.toISOString());
    }

    // Track when app returns to foreground
    if (previousState === 'background' && nextAppState === 'active') {
      if (this.backgroundedAt) {
        const backgroundDuration = Date.now() - this.backgroundedAt.getTime();
        console.log(`App was backgrounded for ${backgroundDuration}ms`);
      }
      this.backgroundedAt = null;
    }

    this.currentState = nextAppState;

    // Notify all callbacks
    this.callbacks.forEach((callback) => {
      try {
        callback(nextAppState);
      } catch (error) {
        console.error('Error in app state callback:', error);
      }
    });
  }

  async handleLowPowerMode(enabled: boolean): Promise<void> {
    console.log(`Low power mode ${enabled ? 'enabled' : 'disabled'}`);

    // Notify background timer service about low power mode
    // This would be handled by the background timer service
  }

  getCurrentState(): AppStateStatus {
    return this.currentState;
  }

  getBackgroundedAt(): Date | null {
    return this.backgroundedAt;
  }

  getBackgroundDuration(): number | null {
    if (!this.backgroundedAt) {
      return null;
    }

    return Date.now() - this.backgroundedAt.getTime();
  }

  isInBackground(): boolean {
    return this.currentState === 'background';
  }

  addStateChangeListener(callback: AppStateChangeCallback): void {
    this.callbacks.push(callback);
  }

  removeStateChangeListener(callback: AppStateChangeCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  async calculateBackgroundTime(session: TimerSession): Promise<{
    elapsedSeconds: number;
    remainingTime: number;
    isCompleted: boolean;
  }> {
    if (!this.backgroundedAt || !session.startedAt) {
      return {
        elapsedSeconds: 0,
        remainingTime: session.remainingTime,
        isCompleted: false,
      };
    }

    // Calculate time elapsed since session started
    const sessionStartTime = session.startedAt.getTime();
    const currentTime = Date.now();
    const totalElapsedSeconds = Math.floor((currentTime - sessionStartTime) / 1000);

    // Calculate remaining time
    const remainingTime = Math.max(0, session.duration - totalElapsedSeconds);
    const isCompleted = remainingTime <= 0;

    return {
      elapsedSeconds: totalElapsedSeconds,
      remainingTime,
      isCompleted,
    };
  }

  async handleSystemTimeChange(): Promise<void> {
    // Handle cases where system time jumps (user changes time, timezone changes, etc.)
    console.warn('System time change detected - this may affect timer accuracy');

    // Reset background tracking to prevent incorrect calculations
    this.backgroundedAt = null;
  }

  async validateTimeIntegrity(session: TimerSession): Promise<boolean> {
    if (!session.startedAt) {
      return true; // No validation needed for sessions without start time
    }

    const sessionStartTime = session.startedAt.getTime();
    const currentTime = Date.now();
    const elapsedTime = currentTime - sessionStartTime;

    // Check for suspicious time jumps (more than 24 hours)
    const maxReasonableElapsed = 24 * 60 * 60 * 1000; // 24 hours in ms

    if (elapsedTime > maxReasonableElapsed || elapsedTime < 0) {
      console.warn('Suspicious time calculation detected:', {
        sessionStart: session.startedAt.toISOString(),
        currentTime: new Date(currentTime).toISOString(),
        elapsedTime,
      });
      return false;
    }

    return true;
  }

  async recoverFromTimeAnomaly(session: TimerSession): Promise<TimerSession> {
    // When time anomalies are detected, gracefully handle the session
    const isValid = await this.validateTimeIntegrity(session);

    if (!isValid) {
      // Reset session to a safe state
      return {
        ...session,
        remainingTime: Math.max(0, session.remainingTime),
        startedAt: new Date(), // Reset start time to now
      };
    }

    return session;
  }
}

export default AppStateService;
