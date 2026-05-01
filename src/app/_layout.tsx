import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { Platform } from 'react-native';

import { appTheme, palette } from '@/constants/theme';
import { DATABASE_NAME, initializeDatabaseAsync } from '@/lib/database';
import { LearningAppProvider } from '@/providers/learning-app-provider';

function AppStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.paper },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="world" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  if (Platform.OS === 'web') {
    return (
      <ThemeProvider value={appTheme}>
        <LearningAppProvider>
          <StatusBar style="dark" />
          <AppStack />
        </LearningAppProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={appTheme}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabaseAsync}>
        <LearningAppProvider>
          <StatusBar style="dark" />
          <AppStack />
        </LearningAppProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
