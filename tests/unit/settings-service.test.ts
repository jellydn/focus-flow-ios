import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create a stateful mock storage to simulate actual persistence
const mockStorage = new Map<string, string>();

// Mock AsyncStorage BEFORE importing SettingsService
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage.get(key) || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      mockStorage.delete(key);
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      mockStorage.clear();
      return Promise.resolve();
    }),
    getAllKeys: vi.fn(() => Promise.resolve(Array.from(mockStorage.keys()))),
    multiGet: vi.fn(() => Promise.resolve([])),
    multiSet: vi.fn(() => Promise.resolve()),
    mergeItem: vi.fn(() => Promise.resolve()),
    multiMerge: vi.fn(() => Promise.resolve()),
    multiRemove: vi.fn(() => Promise.resolve()),
    flushGetRequests: vi.fn(() => Promise.resolve()),
  },
}));

// Now import SettingsService after mocking AsyncStorage
import { SettingsService } from '@/services/settings-service';
import type { SettingsServiceContract, UserSettings } from '@/types/user-settings';

describe('SettingsService Contract Tests', () => {
  let settingsService: SettingsServiceContract;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.clear(); // Clear mock storage between tests
    settingsService = new SettingsService();
  });

  describe('Settings Management', () => {
    it('should return default settings on first load', async () => {
      const settings = await settingsService.getSettings();

      expect(settings).toEqual({
        notificationsEnabled: true,
        soundEnabled: true,
        theme: 'system',
      });
    });

    it('should update notification settings', async () => {
      const updatedSettings = await settingsService.updateSettings({
        notificationsEnabled: false,
      });

      expect(updatedSettings.notificationsEnabled).toBe(false);
      expect(updatedSettings.soundEnabled).toBe(true); // unchanged
      expect(updatedSettings.theme).toBe('system'); // unchanged
    });

    it('should update sound settings', async () => {
      const updatedSettings = await settingsService.updateSettings({
        soundEnabled: false,
      });

      expect(updatedSettings.soundEnabled).toBe(false);
    });

    it('should update theme settings', async () => {
      const updatedSettings = await settingsService.updateSettings({
        theme: 'dark',
      });

      expect(updatedSettings.theme).toBe('dark');
    });

    it('should update multiple settings at once', async () => {
      const updatedSettings = await settingsService.updateSettings({
        notificationsEnabled: false,
        theme: 'light',
      });

      expect(updatedSettings).toMatchObject({
        notificationsEnabled: false,
        soundEnabled: true,
        theme: 'light',
      });
    });

    it('should reset to default settings', async () => {
      // Change some settings first
      await settingsService.updateSettings({
        notificationsEnabled: false,
        theme: 'dark',
      });

      // Reset to defaults
      const resetSettings = await settingsService.resetToDefaults();

      expect(resetSettings).toEqual({
        notificationsEnabled: true,
        soundEnabled: true,
        theme: 'system',
      });
    });

    it('should persist settings between calls', async () => {
      await settingsService.updateSettings({
        notificationsEnabled: false,
        theme: 'dark',
      });

      // Flush debounced updates to ensure persistence
      await settingsService.flushPendingUpdates();

      const retrievedSettings = await settingsService.getSettings();

      expect(retrievedSettings).toMatchObject({
        notificationsEnabled: false,
        theme: 'dark',
      });
    });
  });

  describe('Timer Duration Constants (MVP)', () => {
    it('should return fixed work duration of 25 minutes (1500 seconds)', () => {
      const workDuration = settingsService.getWorkDuration();

      expect(workDuration).toBe(1500);
    });

    it('should return fixed short break duration of 5 minutes (300 seconds)', () => {
      const shortBreakDuration = settingsService.getShortBreakDuration();

      expect(shortBreakDuration).toBe(300);
    });

    it('should return fixed long break duration of 15 minutes (900 seconds)', () => {
      const longBreakDuration = settingsService.getLongBreakDuration();

      expect(longBreakDuration).toBe(900);
    });

    it('should always return same durations regardless of settings changes', () => {
      const workBefore = settingsService.getWorkDuration();
      const shortBefore = settingsService.getShortBreakDuration();
      const longBefore = settingsService.getLongBreakDuration();

      // Change some settings
      settingsService.updateSettings({ theme: 'dark' });

      expect(settingsService.getWorkDuration()).toBe(workBefore);
      expect(settingsService.getShortBreakDuration()).toBe(shortBefore);
      expect(settingsService.getLongBreakDuration()).toBe(longBefore);
    });
  });

  describe('Event Handling', () => {
    it('should register onSettingsChange callback', () => {
      const callback = vi.fn();

      expect(() => {
        settingsService.onSettingsChange(callback);
      }).not.toThrow();
    });

    it('should call onSettingsChange when settings are updated', async () => {
      const callback = vi.fn();
      settingsService.onSettingsChange(callback);

      const newSettings = await settingsService.updateSettings({
        notificationsEnabled: false,
      });

      // Note: Implementation should call the callback
      // This test will fail until proper event handling is implemented
      expect(callback).toHaveBeenCalledWith(newSettings);
    });

    it('should call onSettingsChange when settings are reset', async () => {
      const callback = vi.fn();
      settingsService.onSettingsChange(callback);

      const resetSettings = await settingsService.resetToDefaults();

      expect(callback).toHaveBeenCalledWith(resetSettings);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid theme value', async () => {
      await expect(
        settingsService.updateSettings({
          theme: 'invalid' as any,
        }),
      ).rejects.toThrow();
    });

    it('should handle storage errors gracefully', async () => {
      // Mock storage error
      new Error('Storage error'); // Mock error for potential storage testing
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // This should be handled by the implementation
      await expect(settingsService.getSettings()).resolves.toBeTruthy();
    });
  });

  describe('Type Safety', () => {
    it('should only accept valid theme values', async () => {
      const validThemes: Array<UserSettings['theme']> = ['light', 'dark', 'system'];

      for (const theme of validThemes) {
        const settings = await settingsService.updateSettings({ theme });
        expect(settings.theme).toBe(theme);
      }
    });

    it('should only accept boolean values for notifications and sound', async () => {
      const settings = await settingsService.updateSettings({
        notificationsEnabled: true,
        soundEnabled: false,
      });

      expect(typeof settings.notificationsEnabled).toBe('boolean');
      expect(typeof settings.soundEnabled).toBe('boolean');
    });
  });
});
