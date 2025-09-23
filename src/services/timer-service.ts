import { nanoid } from 'nanoid';
import type {
  TimerSession,
  SessionType,
  SessionStatus,
  TimerServiceContract,
} from '@/types/timer-session';

export class TimerService implements TimerServiceContract {
  private currentSession: TimerSession | null = null;
  private timer: NodeJS.Timeout | null = null;
  private callbacks = {
    onComplete: [] as Array<(session: TimerSession) => void>,
    onTick: [] as Array<(remainingTime: number) => void>,
    onStateChange: [] as Array<(session: TimerSession) => void>,
  };

  async startSession(type: SessionType, duration: number): Promise<TimerSession> {
    if (!this.isValidSessionType(type)) {
      throw new Error(`Invalid session type: ${type}`);
    }

    if (duration <= 0) {
      throw new Error(`Invalid duration: ${duration}`);
    }

    // Stop any existing session
    if (this.currentSession) {
      await this.stopSession();
    }

    this.currentSession = {
      id: nanoid(),
      type,
      duration,
      remainingTime: duration,
      status: 'running',
      startedAt: new Date(),
      completedAt: null,
    };

    this.startTimer();
    this.notifyStateChange();

    return { ...this.currentSession };
  }

  async pauseSession(): Promise<TimerSession> {
    if (!this.currentSession) {
      throw new Error('No active session to pause');
    }

    if (this.currentSession.status !== 'running') {
      throw new Error(`Cannot pause session in ${this.currentSession.status} state`);
    }

    this.stopTimer();
    this.currentSession.status = 'paused';
    this.currentSession.pausedAt = new Date();

    this.notifyStateChange();

    return { ...this.currentSession };
  }

  async resumeSession(): Promise<TimerSession> {
    if (!this.currentSession) {
      throw new Error('No session to resume');
    }

    if (this.currentSession.status !== 'paused') {
      throw new Error(`Cannot resume session in ${this.currentSession.status} state`);
    }

    this.currentSession.status = 'running';
    this.currentSession.resumedAt = new Date();
    this.startTimer();

    this.notifyStateChange();

    return { ...this.currentSession };
  }

  async stopSession(): Promise<TimerSession> {
    if (!this.currentSession) {
      throw new Error('No session to stop');
    }

    this.stopTimer();
    this.currentSession.status = 'idle';

    const stoppedSession = { ...this.currentSession };
    this.currentSession = null;

    this.notifyStateChange();

    return stoppedSession;
  }

  async resetSession(): Promise<TimerSession> {
    if (!this.currentSession) {
      throw new Error('No session to reset');
    }

    this.stopTimer();

    this.currentSession = {
      ...this.currentSession,
      status: 'idle',
      remainingTime: this.currentSession.duration,
      startedAt: null,
      completedAt: null,
      pausedAt: undefined,
      resumedAt: undefined,
    };

    this.notifyStateChange();

    return { ...this.currentSession };
  }

  async getCurrentSession(): Promise<TimerSession | null> {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  async getSessionStatus(): Promise<SessionStatus> {
    return this.currentSession?.status || 'idle';
  }

  async getRemainingTime(): Promise<number> {
    return this.currentSession?.remainingTime || 0;
  }

  async scheduleNotification(session: TimerSession): Promise<void> {
    // Implementation will be added when notification service is implemented
    console.log('Scheduling notification for session:', session.id);
  }

  async cancelNotifications(): Promise<void> {
    // Implementation will be added when notification service is implemented
    console.log('Cancelling notifications');
  }

  async handleBackgroundTimer(): Promise<TimerSession> {
    if (!this.currentSession) {
      throw new Error('No session to handle');
    }

    // Calculate elapsed time and update remaining time
    // This will be enhanced with proper background task integration
    return { ...this.currentSession };
  }

  onSessionComplete(callback: (session: TimerSession) => void): void {
    this.callbacks.onComplete.push(callback);
  }

  onSessionTick(callback: (remainingTime: number) => void): void {
    this.callbacks.onTick.push(callback);
  }

  onSessionStateChange(callback: (session: TimerSession) => void): void {
    this.callbacks.onStateChange.push(callback);
  }

  private startTimer(): void {
    if (!this.currentSession) return;

    this.timer = setInterval(() => {
      if (!this.currentSession || this.currentSession.status !== 'running') {
        this.stopTimer();
        return;
      }

      this.currentSession.remainingTime = Math.max(0, this.currentSession.remainingTime - 1);

      // Notify tick callbacks
      this.callbacks.onTick.forEach(callback => {
        callback(this.currentSession!.remainingTime);
      });

      // Check if session is complete
      if (this.currentSession.remainingTime <= 0) {
        this.completeSession();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private completeSession(): void {
    if (!this.currentSession) return;

    this.stopTimer();
    this.currentSession.status = 'completed';
    this.currentSession.completedAt = new Date();

    const completedSession = { ...this.currentSession };

    // Notify completion callbacks
    this.callbacks.onComplete.forEach(callback => {
      callback(completedSession);
    });

    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    if (!this.currentSession) return;

    this.callbacks.onStateChange.forEach(callback => {
      callback({ ...this.currentSession! });
    });
  }

  private isValidSessionType(type: SessionType): boolean {
    return ['work', 'shortBreak', 'longBreak'].includes(type);
  }
}