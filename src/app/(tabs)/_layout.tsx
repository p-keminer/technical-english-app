import { Ionicons } from '@expo/vector-icons';
import { router, Tabs, type Href } from 'expo-router';

import { palette } from '@/constants/theme';
import { useLearningApp } from '@/providers/learning-app-provider';

export default function ContentLayout() {
  const { lastUnitRoute } = useLearningApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.navy,
        tabBarInactiveTintColor: '#728296',
        tabBarStyle: {
          backgroundColor: '#FFF6EA',
          borderTopColor: '#C7B08C',
          borderTopWidth: 1.5,
          height: 92,
          paddingTop: 10,
          paddingBottom: 12,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Start',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="unit"
        listeners={{
          tabPress: (event) => {
            if (!lastUnitRoute || lastUnitRoute === '/unit') {
              return;
            }

            event.preventDefault();
            router.replace(lastUnitRoute as Href);
          },
        }}
        options={{
          title: 'Units',
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="vocab"
        options={{
          title: 'Vokabeln',
          tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="review" options={{ href: null }} />
      <Tabs.Screen name="unit/[unitId]" options={{ href: null }} />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Fortschritt',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Setup',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="section/[sectionId]" options={{ href: null }} />
      <Tabs.Screen name="quiz/[unitId]" options={{ href: null }} />
    </Tabs>
  );
}
