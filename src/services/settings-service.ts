import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserSettings, SettingsServiceContract, Theme } from '@/types/user-settings';
import { DEFAULT_SETTINGS, TIMER_DURATIONS } from '@/types/user-settings';

const STORAGE_KEY = '@focusflow:settings';

export class SettingsService implements SettingsServiceContract {
  private currentSettings: UserSettings = { ...DEFAULT_SETTINGS };
  private callbacks: Array<(settings: UserSettings) => void> = [];

  async getSettings(): Promise<UserSettings> {
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

    return { ...this.currentSettings };
  }

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    // Validate the updates
    this.validateUpdates(updates);

    // Merge with current settings
    const newSettings: UserSettings = {
      ...this.currentSettings,
      ...updates,
    };

    // Validate the complete settings object
    const validatedSettings = this.validateSettings(newSettings);

    try {
      // Persist to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validatedSettings));

      this.currentSettings = validatedSettings;

      // Notify callbacks
      this.callbacks.forEach((callback) => {
        callback({ ...validatedSettings });
      });

      return { ...validatedSettings };
    } catch (error) {
      console.error('Failed to save settings:', error);

      // Still update in memory even if persistence fails
      this.currentSettings = validatedSettings;

      return { ...validatedSettings };
    }
  }

  async resetToDefaults(): Promise<UserSettings> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));

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

  private validateUpdates(updates: Partial<UserSettings>): void {
    if (updates.theme !== undefined && !this.isValidTheme(updates.theme)) {
      throw new Error(`Invalid theme: ${updates.theme}`);
    }

    if (
      updates.notificationsEnabled !== undefined &&
      typeof updates.notificationsEnabled !== 'boolean'
    ) {
      throw new Error(`Invalid notificationsEnabled: ${updates.notificationsEnabled}`);
    }

    if (updates.soundEnabled !== undefined && typeof updates.soundEnabled !== 'boolean') {
      throw new Error(`Invalid soundEnabled: ${updates.soundEnabled}`);
    }

    // Check for null/undefined values
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        throw new Error(`Invalid value for ${key}: ${value}`);
      }
    });
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
}
