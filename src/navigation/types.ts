import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

// Root Tab Navigator Parameter List
export type RootTabParamList = {
  Timer: undefined;
  History: undefined;
  Settings: undefined;
};

// Navigation prop types for each screen
export type TimerScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Timer'>;
export type HistoryScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'History'>;
export type SettingsScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Settings'>;

// Route prop types for each screen
export type TimerScreenRouteProp = RouteProp<RootTabParamList, 'Timer'>;
export type HistoryScreenRouteProp = RouteProp<RootTabParamList, 'History'>;
export type SettingsScreenRouteProp = RouteProp<RootTabParamList, 'Settings'>;

// Combined navigation and route props for screens
export type TimerScreenProps = {
  navigation: TimerScreenNavigationProp;
  route: TimerScreenRouteProp;
};

export type HistoryScreenProps = {
  navigation: HistoryScreenNavigationProp;
  route: HistoryScreenRouteProp;
};

export type SettingsScreenProps = {
  navigation: SettingsScreenNavigationProp;
  route: SettingsScreenRouteProp;
};

// Helper type for getting navigation prop from any tab screen
export type RootTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList>,
  any
>;

// Tab screen names as union type
export type TabScreenName = keyof RootTabParamList;

// Navigation action types
export type NavigationAction =
  | { type: 'NAVIGATE_TO_TIMER' }
  | { type: 'NAVIGATE_TO_HISTORY' }
  | { type: 'NAVIGATE_TO_SETTINGS' };

// Route configuration type
export interface TabRouteConfig {
  name: TabScreenName;
  title: string;
  icon: string;
  headerShown?: boolean;
}

// Default tab configurations
export const TAB_ROUTES: TabRouteConfig[] = [
  {
    name: 'Timer',
    title: 'Focus Flow',
    icon: '⏰',
    headerShown: true,
  },
  {
    name: 'History',
    title: 'Progress',
    icon: '📊',
    headerShown: true,
  },
  {
    name: 'Settings',
    title: 'Settings',
    icon: '⚙️',
    headerShown: true,
  },
];

export default RootTabParamList;
