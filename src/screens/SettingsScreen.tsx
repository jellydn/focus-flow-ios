import type React from 'react';
import { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SettingsService } from '@/services/settings-service';
import type { Theme, UserSettings } from '@/types/user-settings';

export function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: true,
    soundEnabled: true,
    theme: 'system',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [settingsService] = useState(() => new SettingsService());

  useEffect(() => {
    loadSettings();
    setupEventListeners();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const currentSettings = await settingsService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setupEventListeners = () => {
    settingsService.onSettingsChange((newSettings: UserSettings) => {
      setSettings(newSettings);
    });
  };

  const updateSetting = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    try {
      await settingsService.updateSettings({ [key]: value });
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
      Alert.alert('Error', `Failed to update ${key}. Please try again.`);
    }
  };

  const resetToDefaults = async () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await settingsService.resetToDefaults();
              Alert.alert('Success', 'Settings have been reset to defaults.');
            } catch (error) {
              console.error('Failed to reset settings:', error);
              Alert.alert('Error', 'Failed to reset settings. Please try again.');
            }
          },
        },
      ],
    );
  };

  const getThemeDisplayName = (theme: Theme): string => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'System';
    }
  };

  const showThemePicker = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];

    Alert.alert('Choose Theme', 'Select your preferred theme:', [
      ...themes.map((theme) => ({
        text: getThemeDisplayName(theme),
        onPress: () => updateSetting('theme', theme),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderSettingRow = (title: string, description: string, content: React.ReactNode) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <View style={styles.settingControl}>{content}</View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>{/* Could add a loading spinner here */}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your Focus Flow experience</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          {renderSettingRow(
            'Enable Notifications',
            'Show notifications when sessions complete',
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => updateSetting('notificationsEnabled', value)}
              trackColor={{ false: '#E5E5E5', true: '#27AE60' }}
              thumbColor="#FFFFFF"
            />,
          )}

          {renderSettingRow(
            'Sound',
            'Play sounds with notifications',
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => updateSetting('soundEnabled', value)}
              disabled={!settings.notificationsEnabled}
              trackColor={{ false: '#E5E5E5', true: '#3498DB' }}
              thumbColor="#FFFFFF"
            />,
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          {renderSettingRow(
            'Theme',
            'Choose your preferred theme',
            <TouchableOpacity style={styles.themeButton} onPress={showThemePicker}>
              <Text style={styles.themeButtonText}>{getThemeDisplayName(settings.theme)}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>,
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timer Durations (MVP)</Text>
          <Text style={styles.mvpNote}>
            In this version, timer durations are fixed to follow the traditional Pomodoro Technique.
            Custom durations will be available in a future update.
          </Text>

          <View style={styles.durationList}>
            <View style={styles.durationItem}>
              <Text style={styles.durationLabel}>Work Session</Text>
              <Text style={styles.durationValue}>25 minutes</Text>
            </View>
            <View style={styles.durationItem}>
              <Text style={styles.durationLabel}>Short Break</Text>
              <Text style={styles.durationValue}>5 minutes</Text>
            </View>
            <View style={styles.durationItem}>
              <Text style={styles.durationLabel}>Long Break</Text>
              <Text style={styles.durationValue}>15 minutes</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Focus Flow v1.0.0</Text>
          <Text style={styles.footerSubtext}>Built with ❤️ for productivity</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  settingControl: {
    alignItems: 'flex-end',
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    minWidth: 80,
  },
  themeButtonText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
    marginRight: 8,
  },
  chevron: {
    fontSize: 16,
    color: '#BDC3C7',
  },
  mvpNote: {
    fontSize: 14,
    color: '#7F8C8D',
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 20,
  },
  durationList: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  durationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  durationLabel: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  durationValue: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '400',
  },
  resetButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#BDC3C7',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#BDC3C7',
  },
});

export default SettingsScreen;
