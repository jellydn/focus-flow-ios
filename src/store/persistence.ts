import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState } from './index';

const PERSISTENCE_KEY = '@focusflow:app-state';
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

export class PersistenceService {
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceDelay = 500; // 500ms debounce

  async saveState(state: AppState): Promise<void> {
    return this.withRetry(async () => {
      try {
        const serializedState = JSON.stringify(state, this.dateReplacer);
        await AsyncStorage.setItem(PERSISTENCE_KEY, serializedState);
      } catch (error) {
        console.error('Failed to save app state:', error);
        throw error;
      }
    });
  }

  async loadState(): Promise<AppState | null> {
    return this.withRetry(async () => {
      try {
        const serializedState = await AsyncStorage.getItem(PERSISTENCE_KEY);

        if (!serializedState) {
          return null;
        }

        const parsedState = JSON.parse(serializedState, this.dateReviver);
        return this.validateAndSanitizeState(parsedState);
      } catch (error) {
        console.error('Failed to load app state:', error);
        // Return null instead of throwing to allow app to start with initial state
        return null;
      }
    });
  }

  saveStateDebounced(state: AppState): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.saveState(state).catch(error => {
        console.error('Debounced save failed:', error);
      });
    }, this.debounceDelay);
  }

  async clearState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PERSISTENCE_KEY);
    } catch (error) {
      console.error('Failed to clear app state:', error);
      throw error;
    }
  }

  async migrateFromOldFormat(): Promise<void> {
    // Migration logic for older app versions would go here
    // For now, just ensure we're using the latest format
    const currentState = await this.loadState();
    if (currentState) {
      await this.saveState(currentState);
    }
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    attempts: number = RETRY_ATTEMPTS
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (i < attempts - 1) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  private validateAndSanitizeState(state: any): AppState | null {
    try {
      // Basic structure validation
      if (!state || typeof state !== 'object') {
        return null;
      }

      // Validate timer state
      const timer = {
        session: state.timer?.session || null,
        isRunning: Boolean(state.timer?.isRunning),
        isPaused: Boolean(state.timer?.isPaused),
      };

      // Validate cycle state
      const cycle = {
        current: state.cycle?.current || null,
        position: Number(state.cycle?.position) || 0,
        totalPositions: Number(state.cycle?.totalPositions) || 8,
      };

      // Validate settings
      const settings = {
        notificationsEnabled: Boolean(state.settings?.notificationsEnabled ?? true),
        soundEnabled: Boolean(state.settings?.soundEnabled ?? true),
        theme: this.validateTheme(state.settings?.theme) || 'system',
      };

      // Validate background state
      const background = {
        isActive: Boolean(state.background?.isActive),
        backgroundedAt: state.background?.backgroundedAt instanceof Date
          ? state.background.backgroundedAt
          : null,
      };

      return {
        timer,
        cycle,
        settings,
        background,
      };
    } catch (error) {
      console.error('State validation failed:', error);
      return null;
    }
  }

  private validateTheme(theme: any): 'light' | 'dark' | 'system' | null {
    if (['light', 'dark', 'system'].includes(theme)) {
      return theme;
    }
    return null;
  }

  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }
}

export default PersistenceService;