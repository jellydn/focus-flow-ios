import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest';

// Create a stateful mock storage to simulate actual persistence
const mockStorage = new Map<string, string>();

// Mock AsyncStorage BEFORE importing any modules
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

// Import after mocking
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsService } from '@/services/settings-service';

describe('Settings Persistence Integration Tests', () => {
  let settingsService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.clear(); // Clear mock storage between tests
    settingsService = new SettingsService();
  });

  describe('Settings Persistence', () => {
    it('should persist settings to AsyncStorage on update', async () => {
      const newSettings = {
        notificationsEnabled: false,
        soundEnabled: false,
        theme: 'dark' as const,
      };

      await settingsService.updateSettings(newSettings);

      // Verify settings were saved to AsyncStorage
      const savedData = await AsyncStorage.getItem('@focusflow:settings');
      expect(savedData).toBeTruthy();

      const parsedSettings = JSON.parse(savedData!);
      expect(parsedSettings).toMatchObject(newSettings);
    });

    it('should load persisted settings on service initialization', async () => {
      // Manually save settings to AsyncStorage
      const persistedSettings = {
        notificationsEnabled: false,
        soundEnabled: true,
        theme: 'light',
      };

      await AsyncStorage.setItem('@focusflow:settings', JSON.stringify(persistedSettings));

      // Create new service instance (simulating app restart)
      const newSettingsService = new SettingsService();
      const loadedSettings = await newSettingsService.getSettings();

      expect(loadedSettings).toMatchObject(persistedSettings);
    });

    it('should use default settings when no persisted data exists', async () => {
      // Ensure AsyncStorage is empty
      await AsyncStorage.clear();

      const newSettingsService = new SettingsService();
      const settings = await newSettingsService.getSettings();

      expect(settings).toEqual({
        notificationsEnabled: true,
        soundEnabled: true,
        theme: 'system',
      });
    });

    it('should handle corrupted settings data gracefully', async () => {
      // Save corrupted data to AsyncStorage
      await AsyncStorage.setItem('@focusflow:settings', 'invalid-json');

      const newSettingsService = new SettingsService();
      const settings = await newSettingsService.getSettings();

      // Should fall back to defaults
      expect(settings).toEqual({
        notificationsEnabled: true,
        soundEnabled: true,
        theme: 'system',
      });
    });

    it('should migrate from old settings format if needed', async () => {
      // Save settings in old format (with extra fields that should be ignored)
      const oldFormatSettings = {
        notificationsEnabled: false,
        soundEnabled: true,
        theme: 'dark',
        customWorkDuration: 1800, // Should be ignored in MVP
        autoStartBreaks: true, // Should be ignored in MVP
        unknownField: 'value', // Should be ignored
      };

      await AsyncStorage.setItem('@focusflow:settings', JSON.stringify(oldFormatSettings));

      const newSettingsService = new SettingsService();
      const settings = await newSettingsService.getSettings();

      // Should only include MVP settings
      expect(settings).toEqual({
        notificationsEnabled: false,
        soundEnabled: true,
        theme: 'dark',
      });

      // Should not include old/unknown fields
      expect(settings).not.toHaveProperty('customWorkDuration');
      expect(settings).not.toHaveProperty('autoStartBreaks');
      expect(settings).not.toHaveProperty('unknownField');
    });
  });

  describe('Cross-Session Persistence', () => {
    it('should maintain settings across app restarts', async () => {
      // Update settings
      await settingsService.updateSettings({
        notificationsEnabled: false,
        theme: 'dark',
      });

      // Simulate app restart by creating new service instances
      const newSettingsService = new SettingsService();
      const restoredSettings = await newSettingsService.getSettings();

      expect(restoredSettings).toMatchObject({
        notificationsEnabled: false,
        soundEnabled: true, // default
        theme: 'dark',
      });
    });

    it('should handle multiple rapid setting changes', async () => {
      // Rapid updates (simulating user quickly changing settings)
      await settingsService.updateSettings({ theme: 'light' });
      await settingsService.updateSettings({ theme: 'dark' });
      await settingsService.updateSettings({ notificationsEnabled: false });
      await settingsService.updateSettings({ soundEnabled: false });

      // Final state should be persisted correctly
      const finalSettings = await settingsService.getSettings();
      expect(finalSettings).toEqual({
        notificationsEnabled: false,
        soundEnabled: false,
        theme: 'dark',
      });

      // Verify persistence
      const savedData = await AsyncStorage.getItem('@focusflow:settings');
      const parsedSettings = JSON.parse(savedData!);
      expect(parsedSettings).toEqual(finalSettings);
    });

    it('should handle partial setting updates correctly', async () => {
      // Set initial state
      await settingsService.updateSettings({
        notificationsEnabled: false,
        soundEnabled: false,
        theme: 'dark',
      });

      // Update only one setting
      await settingsService.updateSettings({
        notificationsEnabled: true,
      });

      const updatedSettings = await settingsService.getSettings();
      expect(updatedSettings).toEqual({
        notificationsEnabled: true, // updated
        soundEnabled: false, // preserved
        theme: 'dark', // preserved
      });
    });
  });

  describe('Storage Error Handling', () => {
    it('should handle AsyncStorage write failures gracefully', async () => {
      // Mock AsyncStorage failure
      (AsyncStorage.setItem as MockedFunction<typeof AsyncStorage.setItem>).mockRejectedValue(
        new Error('Storage quota exceeded'),
      );

      // Should not throw error
      await expect(settingsService.updateSettings({ theme: 'dark' })).resolves.not.toThrow();

      // Should log error
      expect(console.error).toHaveBeenCalled();

      // Settings should still be updated in memory
      const settings = await settingsService.getSettings();
      expect(settings.theme).toBe('dark');
    });

    it('should handle AsyncStorage read failures gracefully', async () => {
      // Mock AsyncStorage read failure
      (AsyncStorage.getItem as MockedFunction<typeof AsyncStorage.getItem>).mockRejectedValue(
        new Error('Storage read failed'),
      );

      const newSettingsService = new SettingsService();
      const settings = await newSettingsService.getSettings();

      // Should fall back to defaults
      expect(settings).toEqual({
        notificationsEnabled: true,
        soundEnabled: true,
        theme: 'system',
      });
    });

    it('should retry failed storage operations', async () => {
      let attemptCount = 0;
      (AsyncStorage.setItem as MockedFunction<typeof AsyncStorage.setItem>).mockImplementation(
        () => {
          attemptCount++;
          if (attemptCount < 3) {
            return Promise.reject(new Error('Temporary failure'));
          }
          return Promise.resolve();
        },
      );

      await settingsService.updateSettings({ theme: 'dark' });

      // Should have retried and eventually succeeded
      expect(attemptCount).toBe(3);
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should validate setting values before persistence', async () => {
      // Try to set invalid theme value
      await expect(settingsService.updateSettings({ theme: 'invalid' as any })).rejects.toThrow();

      // Settings should remain unchanged
      const settings = await settingsService.getSettings();
      expect(settings.theme).toBe('system'); // default
    });

    it('should sanitize input values', async () => {
      // Try to update with non-boolean values
      const updates = {
        notificationsEnabled: 'true' as any, // string instead of boolean
        soundEnabled: 1 as any, // number instead of boolean
      };

      await settingsService.updateSettings(updates);

      const settings = await settingsService.getSettings();

      // Should convert to proper boolean values
      expect(typeof settings.notificationsEnabled).toBe('boolean');
      expect(typeof settings.soundEnabled).toBe('boolean');
      expect(settings.notificationsEnabled).toBe(true);
      expect(settings.soundEnabled).toBe(true);
    });

    it('should reject settings updates with missing required fields', async () => {
      // Try to update with null/undefined values
      await expect(settingsService.updateSettings({ theme: null as any })).rejects.toThrow();

      await expect(settingsService.updateSettings({ theme: undefined as any })).rejects.toThrow();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not create memory leaks with frequent updates', async () => {
      // Perform many setting updates
      for (let i = 0; i < 100; i++) {
        await settingsService.updateSettings({
          theme: i % 2 === 0 ? 'light' : 'dark',
        });
      }

      // Should still function correctly
      const settings = await settingsService.getSettings();
      expect(settings.theme).toMatch(/light|dark/);

      // Should not accumulate excessive data in AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const settingsKeys = allKeys.filter((key) => key.includes('settings'));
      expect(settingsKeys).toHaveLength(1); // Only one settings key
    });

    it('should debounce rapid setting changes to reduce storage writes', async () => {
      vi.clearAllMocks();

      // Rapid consecutive updates
      await Promise.all([
        settingsService.updateSettings({ theme: 'light' }),
        settingsService.updateSettings({ theme: 'dark' }),
        settingsService.updateSettings({ notificationsEnabled: false }),
      ]);

      // Should have fewer storage writes than updates (due to debouncing)
      const setItemCalls = (AsyncStorage.setItem as MockedFunction<typeof AsyncStorage.setItem>)
        .mock.calls.length;
      expect(setItemCalls).toBeLessThan(3);
    });

    it('should limit storage data size', async () => {
      // Update all settings
      await settingsService.updateSettings({
        notificationsEnabled: false,
        soundEnabled: false,
        theme: 'dark',
      });

      const savedData = await AsyncStorage.getItem('@focusflow:settings');
      const dataSize = JSON.stringify(savedData).length;

      // Settings data should be compact (< 1KB)
      expect(dataSize).toBeLessThan(1024);
    });
  });

  describe('Event Integration', () => {
    it('should emit settings change events when persisted', async () => {
      const changeCallback = vi.fn();
      settingsService.onSettingsChange(changeCallback);

      await settingsService.updateSettings({ theme: 'dark' });

      expect(changeCallback).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark' }));
    });

    it('should not emit events for failed persistence', async () => {
      const changeCallback = vi.fn();
      settingsService.onSettingsChange(changeCallback);

      // Mock storage failure
      (AsyncStorage.setItem as MockedFunction<typeof AsyncStorage.setItem>).mockRejectedValue(
        new Error('Failed'),
      );

      await settingsService.updateSettings({ theme: 'dark' });

      // Should not emit event if persistence failed
      expect(changeCallback).not.toHaveBeenCalled();
    });

    it('should emit events when settings are reset', async () => {
      const changeCallback = vi.fn();
      settingsService.onSettingsChange(changeCallback);

      await settingsService.resetToDefaults();

      expect(changeCallback).toHaveBeenCalledWith({
        notificationsEnabled: true,
        soundEnabled: true,
        theme: 'system',
      });
    });
  });
});
