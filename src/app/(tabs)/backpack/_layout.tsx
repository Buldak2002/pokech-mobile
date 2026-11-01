import { Stack } from 'expo-router/stack';

export const unstable_settings = { initialRouteName: 'index' };

export default function BackpackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="pokedex" options={{ title: '도감' }} />
      <Stack.Screen name="party" options={{ title: '포켓몬' }} />
      <Stack.Screen name="items" options={{ title: '지닌 물건' }} />
      <Stack.Screen name="settings" options={{ title: '설정' }} />
      <Stack.Screen name="pokemon/[id]" options={{ title: '포켓몬 정보' }} />
    </Stack>
  );
}
