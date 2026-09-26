import { Color, Stack, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  initialWindowMetrics,
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { StyleSheet, Image } from 'react-native';

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SafeAreaView
        style={{ flex: 1 }}
        edges={['top', 'right', 'left']}
      >
        <StatusBar style="dark" />

        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#060505",
            tabBarInactiveTintColor: "#9ca3af",
            
            tabBarStyle: [
              styles.tabBar,
              {
                bottom: Math.max(insets.bottom, 50),
                marginHorizontal: 16,
              }
            ],
            tabBarLabelStyle: styles.tabBarLabel,
            sceneStyle: styles.container
          }}
        >
          <Tabs.Screen name='index'
            options={{
              title: '홈',
              tabBarIcon: ({ focused }) => (
                <Image
                  source={require('../../assets/items/poke-ball.png')}
                  style={[
                    icons.tabIcons,
                    {
                      opacity: focused ? 1 : 0.5,
                      transform: [
                        {
                          scale: focused ? 1.2 : 1
                        }
                      ]
                    },
                  ]}
                  resizeMode="contain"
                />
              )
            }}
          />
          <Tabs.Screen name='pokedex'
            options={{
              title: '도감',
              tabBarIcon: ({ focused }) => (
              <Image
                source={require('../../assets/items/pokedex.png')}
                style={[
                  icons.tabIcons,
                  {
                    opacity: focused ? 1 : 0.5,
                    transform: [
                      {
                        scale: focused ? 1.2 : 1
                      }
                    ]
                  },
                ]}
                resizeMode="contain"
              />
              )
            }}
          />
          <Tabs.Screen name='market'
            options={{
              title: '상점',
              tabBarIcon: ({ focused }) => (
                <Image
                  source={require('../../assets/items/pokemon-center.png')}
                  style={[
                    icons.tabIcons,
                    {
                      width: 50,
                      height: 50,
                      opacity: focused ? 1 : 0.5,
                      transform: [
                        {
                          scale: focused ? 1.2 : 1
                        }
                      ]
                    },
                  ]}
                  resizeMode="contain"
                />
              )
            }}
          />
          <Tabs.Screen name='backpack'
            options={{
              title: '가방',
              tabBarIcon: ({ focused }) => (
                <Image
                  source={require('../../assets/items/backpag.png')}
                  style={[
                    icons.tabIcons,
                    {
                      width: 27,
                      height: 27,
                      opacity: focused ? 1 : 0.5,
                      transform: [
                        {
                          scale: focused ? 1.2 : 1
                        }
                      ]
                    },
                  ]}
                  resizeMode="contain"
                />
              )
            }}
          />
          <Tabs.Screen
            name='pokemon'
            options={{
              href: null
            }}
          />
        </Tabs>
        
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff8f',
    paddingHorizontal: 20,
    paddingVertical: 20
  },
  tabBar: {
    position: 'absolute',
    height: 80,

    backgroundColor: '#f3f6f6',

    borderRadius: 24,
    borderTopWidth: 0,

    paddingTop: 9,
    paddingBottom: 8,

    // Android 그림자
    elevation: 6,

    // iOS 그림자
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },

  tabBarLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  pokemon: {
    width: 170,
    height: 170,
  },
});

const icons = StyleSheet.create({
  tabIcons: {
    width: 40,
    height: 40
  }
});
