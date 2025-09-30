export type Theme = 'light' | 'dark' | 'system';

export interface UserSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  theme: Theme;
}

export interface SettingsServiceContract {
  // Settings management
  getSettings(): Promise<UserSettings>;
  updateSettings(updates: Partial<UserSettings>): Promise<UserSettings>;
  resetToDefaults(): Promise<UserSettings>;

  // Timer duration constants (MVP - fixed durations)
  getWorkDuration(): number; // 1500 seconds (25 minutes)
  getShortBreakDuration(): number; // 300 seconds (5 minutes)
  getLongBreakDuration(): number; // 900 seconds (15 minutes)

  // Internal methods for testing
  flushPendingUpdates(): Promise<void>;

  // Event handlers
  onSettingsChange(callback: (settings: UserSettings) => void): void;
}

export const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  soundEnabled: true,
  theme: 'system',
};

export const TIMER_DURATIONS = {
  WORK: 1500, // 25 minutes
  SHORT_BREAK: 300, // 5 minutes
  LONG_BREAK: 900, // 15 minutes
} as const;
