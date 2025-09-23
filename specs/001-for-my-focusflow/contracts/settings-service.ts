/**
 * Settings Service Contract
 * Defines the interface for user settings management
 */

export interface UserSettings {
  // Note: Timer durations are fixed for MVP (25/5/15 minutes)
  // autoStart features deferred to post-MVP
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface SettingsServiceContract {
  // Settings Management
  getSettings(): Promise<UserSettings>;
  updateSettings(settings: Partial<UserSettings>): Promise<UserSettings>;
  resetToDefaults(): Promise<UserSettings>;

  // Timer Duration Constants (MVP fixed values)
  getWorkDuration(): number; // Always returns 1500 (25 minutes)
  getShortBreakDuration(): number; // Always returns 300 (5 minutes)
  getLongBreakDuration(): number; // Always returns 900 (15 minutes)

  // Events
  onSettingsChange(callback: (settings: UserSettings) => void): void;
}

export interface SettingsServiceError {
  code: 'STORAGE_ERROR' | 'VALIDATION_ERROR';
  message: string;
  field?: keyof UserSettings;
  value?: any;
}

// Default settings values (MVP)
export const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  soundEnabled: true,
  theme: 'system'
};

// Fixed timer durations (MVP constants)
export const TIMER_DURATIONS = {
  work: 1500, // 25 minutes in seconds
  shortBreak: 300, // 5 minutes in seconds
  longBreak: 900 // 15 minutes in seconds
} as const;

export interface UpdateSettingsRequest {
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

export interface SettingsServiceEvents {
  settingsUpdated: UserSettings;
  settingsReset: UserSettings;
  validationError: SettingsServiceError;
}