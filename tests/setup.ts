// Vitest setup file for React Native testing
import { vi } from 'vitest';

// Mock React Native modules
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: vi.fn((config) => config.ios),
  },
  Dimensions: {
    get: vi.fn(() => ({ width: 375, height: 667 })),
  },
  StyleSheet: {
    create: vi.fn((styles) => styles),
  },
  Alert: {
    alert: vi.fn(),
  },
}));

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  getAllKeys: vi.fn(),
  multiGet: vi.fn(),
  multiSet: vi.fn(),
}));

// Mock Expo modules
vi.mock('expo-notifications', () => ({
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  cancelNotificationAsync: vi.fn(),
  cancelAllScheduledNotificationsAsync: vi.fn(),
}));

vi.mock('expo-task-manager', () => ({
  defineTask: vi.fn(),
  startTaskAsync: vi.fn(),
  stopTaskAsync: vi.fn(),
  getTaskOptionsAsync: vi.fn(),
}));

// Mock navigation
vi.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: vi.fn(),
    goBack: vi.fn(),
  }),
  useFocusEffect: vi.fn(),
}));

// Global test utilities
global.setImmediate = vi.fn((cb) => setTimeout(cb, 0));