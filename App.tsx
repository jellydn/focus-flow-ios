import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from '@/navigation/AppNavigator';
import { AppStateService } from '@/services/app-state-service';
import { NotificationService } from '@/services/notification-service';

// Configure notifications globally
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  useEffect(() => {
    let notificationService: NotificationService;
    let appStateService: AppStateService;

    const initializeApp = async (): Promise<(() => void) | undefined> => {
      try {
        // Initialize core services
        notificationService = new NotificationService();
        appStateService = new AppStateService();

        await notificationService.initialize();
        appStateService.initialize();

        // Request notification permissions on first launch
        const permissions = await notificationService.requestPermissions();
        if (permissions.status === 'denied' && permissions.canAskAgain) {
          Alert.alert(
            'Notifications',
            'Enable notifications to get alerts when your focus sessions complete.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Enable',
                onPress: () => notificationService.requestPermissions(),
              },
            ],
          );
        }

        // Set up notification response handler
        const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
          notificationService.handleNotificationResponse(response);
        });

        return () => {
          subscription.remove();
        };
      } catch (error) {
        console.error('Failed to initialize app:', error);
        Alert.alert(
          'Initialization Error',
          'The app failed to initialize properly. Some features may not work correctly.',
          [{ text: 'OK' }],
        );
        return undefined;
      }
    };

    const cleanupPromise = initializeApp();

    return () => {
      // Cleanup on unmount
      cleanupPromise.then((cleanup) => {
        if (cleanup) cleanup();
      });

      if (appStateService) {
        appStateService.cleanup();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
