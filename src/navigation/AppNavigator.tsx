import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import TimerScreen from '@/screens/TimerScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import HistoryScreen from '@/screens/HistoryScreen';

export type RootTabParamList = {
  Timer: undefined;
  History: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

// Simple icon component since we're not using icon libraries
const TabIcon = ({ focused, name }: { focused: boolean; name: string }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Timer':
        return '⏰';
      case 'History':
        return '📊';
      case 'Settings':
        return '⚙️';
      default:
        return '⭐';
    }
  };

  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>
        {getIcon(name)}
      </Text>
    </View>
  );
};

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={route.name} />
          ),
          tabBarActiveTintColor: '#E74C3C',
          tabBarInactiveTintColor: '#7F8C8D',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E5E5',
            paddingTop: 8,
            paddingBottom: 8,
            height: 70,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E5E5',
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#2C3E50',
          },
          headerTintColor: '#2C3E50',
        })}
        initialRouteName="Timer"
      >
        <Tab.Screen
          name="Timer"
          component={TimerScreen}
          options={{
            title: 'Focus Flow',
            tabBarLabel: 'Timer',
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: 'Progress',
            tabBarLabel: 'History',
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
  },
});

export default AppNavigator;