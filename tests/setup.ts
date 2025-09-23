// Vitest setup file for React Native testing
import { vi } from 'vitest';

// React Native environment globals
global.__DEV__ = true;
(globalThis as any).__DEV__ = true;

// Setup DOM environment with proper window implementation
const mockLocalStorage = {
  getItem: vi.fn().mockImplementation((_key: string) => null),
  setItem: vi.fn().mockImplementation((_key: string, _value: string) => {}),
  removeItem: vi.fn().mockImplementation((_key: string) => {}),
  clear: vi.fn().mockImplementation(() => {}),
  key: vi.fn().mockImplementation((_index: number) => null),
  length: 0,
};

// Set up window globally before any imports happen
(global as any).window = {
  localStorage: mockLocalStorage,
};

// Also ensure it's available as a direct global
(global as any).localStorage = mockLocalStorage;

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
  AppState: {
    currentState: 'active',
    addEventListener: vi.fn(),
  },
}));

// Mock AsyncStorage with proper implementation
const mockAsyncStorage = {
  getItem: vi.fn(() => Promise.resolve(null)),
  setItem: vi.fn(() => Promise.resolve()),
  removeItem: vi.fn(() => Promise.resolve()),
  clear: vi.fn(() => Promise.resolve()),
  getAllKeys: vi.fn(() => Promise.resolve([])),
  multiGet: vi.fn(() => Promise.resolve([])),
  multiSet: vi.fn(() => Promise.resolve()),
};

vi.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Expo modules
vi.mock('expo-notifications', () => ({
  getPermissionsAsync: vi.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: vi.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: vi.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: vi.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: vi.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: vi.fn(() => Promise.resolve([])),
  getPresentedNotificationsAsync: vi.fn(() => Promise.resolve([])),
  setNotificationHandler: vi.fn(),
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
    CALENDAR: 'calendar',
    LOCATION: 'location',
    PUSH: 'push',
  },
}));

vi.mock('expo-task-manager', () => ({
  defineTask: vi.fn(),
  startTaskAsync: vi.fn(),
  stopTaskAsync: vi.fn(),
  getTaskOptionsAsync: vi.fn(),
  isTaskDefined: vi.fn(() => false),
}));

vi.mock('expo-background-fetch', () => ({
  startAsync: vi.fn(() => Promise.resolve()),
  stopAsync: vi.fn(() => Promise.resolve()),
  getStatusAsync: vi.fn(() => Promise.resolve('available')),
  setMinimumIntervalAsync: vi.fn(() => Promise.resolve()),
  BackgroundFetchStatus: {
    Available: 'available',
    Denied: 'denied',
    Restricted: 'restricted',
  },
  BackgroundFetchResult: {
    NewData: 'newData',
    NoData: 'noData',
    Failed: 'failed',
  },
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

// Mock console methods for testing
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
  info: vi.fn(),
};
