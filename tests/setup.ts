// Setup DOM window IMMEDIATELY - must be first to prevent AsyncStorage errors
// Also set React Native globals first
(global as unknown as { __DEV__: boolean }).__DEV__ = true;
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = true;
const mockStorageSync = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {},
  key: (_index: number) => null,
  length: 0,
};

// Create comprehensive window object with localStorage before ANY imports
(global as unknown as { window: unknown }).window = {
  localStorage: mockStorageSync,
  sessionStorage: mockStorageSync,
  location: { href: 'http://localhost:3000' },
  navigator: { userAgent: 'jsdom' },
  document: {
    createElement: () => ({}),
    documentElement: {},
  },
  console: global.console,
};

// Set globals on globalThis for complete compatibility
(globalThis as unknown as { window: unknown }).window = (
  global as unknown as { window: unknown }
).window;
(globalThis as unknown as { localStorage: unknown }).localStorage = mockStorageSync;
(global as unknown as { localStorage: unknown }).localStorage = mockStorageSync;

// React Native environment globals - define before any imports
(global as unknown as { __DEV__: boolean }).__DEV__ = true;
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = true;
(global as unknown as { process: { env: { NODE_ENV: string } } }).process = {
  env: { NODE_ENV: 'test' },
};

// Import Vitest AFTER setting up all globals
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
  AppState: {
    currentState: 'active',
    addEventListener: vi.fn(),
  },
}));

// Create a comprehensive AsyncStorage mock that doesn't rely on window
const mockAsyncStorage = {
  getItem: vi.fn((_key: string) => Promise.resolve(null)),
  setItem: vi.fn((_key: string, _value: string) => Promise.resolve()),
  removeItem: vi.fn((_key: string) => Promise.resolve()),
  clear: vi.fn(() => Promise.resolve()),
  getAllKeys: vi.fn(() => Promise.resolve([])),
  multiGet: vi.fn((_keys: string[]) => Promise.resolve([])),
  multiSet: vi.fn((_keyValuePairs: [string, string][]) => Promise.resolve()),
  mergeItem: vi.fn((_key: string, _value: string) => Promise.resolve()),
  multiMerge: vi.fn((_keyValuePairs: [string, string][]) => Promise.resolve()),
  multiRemove: vi.fn((_keys: string[]) => Promise.resolve()),
  flushGetRequests: vi.fn(() => Promise.resolve()),
};

// Mock the AsyncStorage module completely to prevent window access
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: mockAsyncStorage,
  __esModule: true,
}));

// Also create a backup mock for any direct imports
(global as unknown as { AsyncStorage: unknown }).AsyncStorage = mockAsyncStorage;

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
(global as unknown as { setImmediate: unknown }).setImmediate = vi.fn((cb: unknown) =>
  setTimeout(cb as () => void, 0),
);

// Mock console methods for testing
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
  info: vi.fn(),
};
