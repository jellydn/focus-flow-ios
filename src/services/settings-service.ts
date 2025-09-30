import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SettingsServiceContract, Theme, UserSettings } from '@/types/user-settings';
import { DEFAULT_SETTINGS, TIMER_DURATIONS } from '@/types/user-settings';

const STORAGE_KEY = '@focusflow:settings';

export class SettingsService implements SettingsServiceContract {
  private currentSettings: UserSettings = { ...DEFAULT_SETTINGS };
  private callbacks: Array<(settings: UserSettings) => void> = [];
  private debounceTimeout: NodeJS.Timeout | null = null;
  private pendingUpdates: Partial<UserSettings> | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // Load settings asynchronously on initialization
    this.initializeSettings();
  }

  private async initializeSettings(): Promise<void> {
    await this.loadSettings();
    this.isInitialized = true;
  }

  async getSettings(): Promise<UserSettings> {
    // Wait for initialization to complete if it's still in progress
    if (!this.isInitialized) {
      await this.waitForInitialization();
    }

    return { ...this.currentSettings };
  }

  private async waitForInitialization(): Promise<void> {
    // Simple polling approach to wait for initialization
    while (!this.isInitialized) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const storedSettings = await AsyncStorage.getItem(STORAGE_KEY);

      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        // Validate and sanitize the stored settings
        this.currentSettings = this.validateSettings(parsed);
      } else {
        this.currentSettings = { ...DEFAULT_SETTINGS };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.currentSettings = { ...DEFAULT_SETTINGS };
    }
  }

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    // Validate and sanitize the updates
    const sanitizedUpdates = this.validateUpdates(updates);

    // Merge with current settings
    const newSettings: UserSettings = {
      ...this.currentSettings,
      ...sanitizedUpdates,
    };

    // Validate the complete settings object
    const validatedSettings = this.validateSettings(newSettings);

    // Update in memory immediately
    this.currentSettings = validatedSettings;

    // Notify callbacks immediately for responsive UI
    this.callbacks.forEach((callback) => {
      callback({ ...validatedSettings });
    });

    // Debounce storage writes to reduce I/O
    this.debouncedSave(validatedSettings);

    return { ...validatedSettings };
  }

  private debouncedSave(settings: UserSettings): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.pendingUpdates = settings;

    this.debounceTimeout = setTimeout(async () => {
      if (this.pendingUpdates) {
        try {
          await this.saveToStorageWithRetry(STORAGE_KEY, JSON.stringify(this.pendingUpdates));
        } catch (error) {
          console.error('Failed to persist debounced settings:', error);
        }
        this.pendingUpdates = null;
        this.debounceTimeout = null;
      }
    }, 300); // 300ms debounce delay
  }

  async resetToDefaults(): Promise<UserSettings> {
    try {
      await this.saveToStorageWithRetry(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));

      this.currentSettings = { ...DEFAULT_SETTINGS };

      // Notify callbacks
      this.callbacks.forEach((callback) => {
        callback({ ...DEFAULT_SETTINGS });
      });

      return { ...DEFAULT_SETTINGS };
    } catch (error) {
      console.error('Failed to reset settings:', error);

      // Reset in memory even if persistence fails
      this.currentSettings = { ...DEFAULT_SETTINGS };

      // Still notify callbacks for memory updates
      this.callbacks.forEach((callback) => {
        callback({ ...DEFAULT_SETTINGS });
      });

      return { ...DEFAULT_SETTINGS };
    }
  }

  getWorkDuration(): number {
    return TIMER_DURATIONS.WORK;
  }

  getShortBreakDuration(): number {
    return TIMER_DURATIONS.SHORT_BREAK;
  }

  getLongBreakDuration(): number {
    return TIMER_DURATIONS.LONG_BREAK;
  }

  onSettingsChange(callback: (settings: UserSettings) => void): void {
    this.callbacks.push(callback);
  }

  private validateSettings(settings: any): UserSettings {
    return {
      notificationsEnabled: this.validateBoolean(
        settings.notificationsEnabled,
        DEFAULT_SETTINGS.notificationsEnabled,
      ),
      soundEnabled: this.validateBoolean(settings.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
      theme: this.validateTheme(settings.theme, DEFAULT_SETTINGS.theme),
    };
  }

  private validateUpdates(updates: Partial<UserSettings>): Partial<UserSettings> {
    const sanitized: Partial<UserSettings> = {};

    if (updates.theme !== undefined) {
      if (this.isValidTheme(updates.theme)) {
        sanitized.theme = updates.theme;
      } else {
        throw new Error(`Invalid theme: ${updates.theme}`);
      }
    }

    if (updates.notificationsEnabled !== undefined) {
      // Sanitize instead of throwing error
      sanitized.notificationsEnabled = this.validateBoolean(
        updates.notificationsEnabled,
        DEFAULT_SETTINGS.notificationsEnabled,
      );
    }

    if (updates.soundEnabled !== undefined) {
      // Sanitize instead of throwing error
      sanitized.soundEnabled = this.validateBoolean(
        updates.soundEnabled,
        DEFAULT_SETTINGS.soundEnabled,
      );
    }

    // Check for null/undefined values - only throw for explicitly invalid inputs
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        throw new Error(`Invalid value for ${key}: ${value}`);
      }
    });

    return sanitized;
  }

  private validateBoolean(value: any, defaultValue: boolean): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    // Convert string representations to boolean
    if (typeof value === 'string') {
      if (value === 'true') return true;
      if (value === 'false') return false;
    }

    // Convert number representations to boolean
    if (typeof value === 'number') {
      return value > 0;
    }

    return defaultValue;
  }

  private validateTheme(value: any, defaultValue: Theme): Theme {
    if (this.isValidTheme(value)) {
      return value;
    }

    return defaultValue;
  }

  private isValidTheme(value: any): value is Theme {
    return ['light', 'dark', 'system'].includes(value);
  }

  private async saveToStorageWithRetry(
    key: string,
    value: string,
    maxRetries: number = 3,
  ): Promise<void> {
    let attemptCount = 0;

    while (attemptCount < maxRetries) {
      try {
        await AsyncStorage.setItem(key, value);
        return; // Success
      } catch (error) {
        attemptCount++;
        if (attemptCount >= maxRetries) {
          throw error; // Final failure after all retries
        }
        // Wait briefly before retry
        await new Promise((resolve) => setTimeout(resolve, 100 * attemptCount));
      }
    }
  }

  async flushPendingUpdates(): Promise<void> {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    if (this.pendingUpdates) {
      try {
        await this.saveToStorageWithRetry(STORAGE_KEY, JSON.stringify(this.pendingUpdates));
      } catch (error) {
        console.error('Failed to flush pending settings:', error);
        throw error;
      } finally {
        this.pendingUpdates = null;
      }
    }
  }
}
