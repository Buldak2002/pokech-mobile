import { Tabs, usePathname, useRoutePath } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { View } from 'react-native';
import { MenuIcon, type MenuIconName } from '../../components/bag-ui';

function TabIcon({ name, focused }: { name: MenuIconName; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', opacity: focused ? 1 : 0.55 }}>
      <View
        style={{
          position: 'absolute',
          top: -9,
          height: 3,
          width: 44,
          backgroundColor: focused ? '#ef4444' : 'transparent',
        }}
      />
      <MenuIcon name={name} size={name === 'market' ? 36 : 30} />
    </View>
  );
}

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isHome = pathname === '/home';
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      edges={
        isHome
          ? ['left', 'right']
          : ['top', 'left', 'right']
      }
    >
      <StatusBar style="dark" />
      <Tabs
        initialRouteName="home"
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#111827',
          tabBarInactiveTintColor: '#78838e',
          tabBarLabelPosition: 'below-icon',
          tabBarStyle: {
            height: 70 + insets.bottom,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 6),
            backgroundColor: '#f3f6f6',
            borderTopWidth: 0,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.08)',
          },
          tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: '홈',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="market"
          options={{
            title: '상점',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="market" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="backpack"
          options={{
            title: '가방',
            sceneStyle: { backgroundColor: '#ffffff' },
            tabBarIcon: ({ focused }) => (
              <TabIcon name="items" focused={focused} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
