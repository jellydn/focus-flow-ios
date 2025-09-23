import { nanoid } from 'nanoid';
import type {
  PomodorocoCycle,
  CycleProgress,
  CycleServiceContract,
  CycleStatus,
} from '@/types/pomodoro-cycle';
import type { SessionType } from '@/types/timer-session';
import { CYCLE_WORKFLOW } from '@/types/pomodoro-cycle';

export class CycleService implements CycleServiceContract {
  private currentCycle: PomodorocoCycle | null = null;
  private callbacks = {
    onComplete: [] as Array<(cycle: PomodorocoCycle) => void>,
    onProgressUpdate: [] as Array<(progress: CycleProgress) => void>,
  };

  async startNewCycle(): Promise<PomodorocoCycle> {
    this.currentCycle = {
      id: nanoid(),
      workSessions: [],
      shortBreaks: [],
      longBreak: null,
      status: 'active',
      startedAt: new Date(),
      completedAt: null,
    };

    return { ...this.currentCycle };
  }

  async getCurrentCycle(): Promise<PomodorocoCycle | null> {
    return this.currentCycle ? { ...this.currentCycle } : null;
  }

  async completeCycle(): Promise<PomodorocoCycle> {
    if (!this.currentCycle) {
      throw new Error('No active cycle to complete');
    }

    this.currentCycle.status = 'completed';
    this.currentCycle.completedAt = new Date();

    const completedCycle = { ...this.currentCycle };

    // Notify completion callbacks
    this.callbacks.onComplete.forEach(callback => {
      callback(completedCycle);
    });

    return completedCycle;
  }

  async abandonCycle(): Promise<void> {
    if (!this.currentCycle) {
      throw new Error('No active cycle to abandon');
    }

    this.currentCycle = null;
  }

  async getCycleProgress(): Promise<CycleProgress> {
    if (!this.currentCycle) {
      throw new Error('No active cycle');
    }

    const currentPosition = this.calculateCurrentPosition();
    const workSessionsCompleted = this.currentCycle.workSessions.length;
    const shortBreaksCompleted = this.currentCycle.shortBreaks.length;
    const longBreakCompleted = this.currentCycle.longBreak !== null;
    const isComplete = this.isCycleComplete();

    return {
      currentPosition,
      totalPositions: 8,
      workSessionsCompleted,
      shortBreaksCompleted,
      longBreakCompleted,
      isComplete,
    };
  }

  async getNextSessionType(): Promise<SessionType> {
    if (!this.currentCycle) {
      throw new Error('No active cycle');
    }

    const currentPosition = this.calculateCurrentPosition();

    // Position is 1-based, array is 0-based
    return CYCLE_WORKFLOW[currentPosition - 1];
  }

  async recordSessionCompletion(sessionId: string): Promise<CycleProgress> {
    if (!this.currentCycle) {
      throw new Error('No active cycle to record completion');
    }

    if (!sessionId || sessionId.trim() === '') {
      throw new Error('Invalid session ID');
    }

    const currentPosition = this.calculateCurrentPosition();
    const sessionType = CYCLE_WORKFLOW[currentPosition - 1];

    // Record the session based on its type
    switch (sessionType) {
      case 'work':
        this.currentCycle.workSessions.push(sessionId);
        break;
      case 'shortBreak':
        this.currentCycle.shortBreaks.push(sessionId);
        break;
      case 'longBreak':
        this.currentCycle.longBreak = sessionId;
        break;
      default:
        throw new Error(`Invalid session type: ${sessionType}`);
    }

    const progress = await this.getCycleProgress();

    // Auto-complete cycle if all sessions are done
    if (progress.isComplete) {
      await this.completeCycle();
    }

    // Notify progress callbacks
    this.callbacks.onProgressUpdate.forEach(callback => {
      callback(progress);
    });

    return progress;
  }

  async shouldTakeLongBreak(): Promise<boolean> {
    if (!this.currentCycle) {
      return false;
    }

    const currentPosition = this.calculateCurrentPosition();
    return currentPosition === 8;
  }

  async getCyclePosition(): Promise<number> {
    if (!this.currentCycle) {
      return 0;
    }

    return this.calculateCurrentPosition();
  }

  async canAdvanceToNext(): Promise<boolean> {
    if (!this.currentCycle) {
      return false;
    }

    const currentPosition = this.calculateCurrentPosition();
    return currentPosition <= 8;
  }

  onCycleComplete(callback: (cycle: PomodorocoCycle) => void): void {
    this.callbacks.onComplete.push(callback);
  }

  onProgressUpdate(callback: (progress: CycleProgress) => void): void {
    this.callbacks.onProgressUpdate.push(callback);
  }

  private calculateCurrentPosition(): number {
    if (!this.currentCycle) {
      return 0;
    }

    // Calculate position based on completed sessions
    const workSessions = this.currentCycle.workSessions.length;
    const shortBreaks = this.currentCycle.shortBreaks.length;
    const longBreak = this.currentCycle.longBreak ? 1 : 0;

    const totalCompletedSessions = workSessions + shortBreaks + longBreak;

    // Position is 1-based, so add 1 to get the next position
    return totalCompletedSessions + 1;
  }

  private isCycleComplete(): boolean {
    if (!this.currentCycle) {
      return false;
    }

    return (
      this.currentCycle.workSessions.length === 4 &&
      this.currentCycle.shortBreaks.length === 3 &&
      this.currentCycle.longBreak !== null
    );
  }
}