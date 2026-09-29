import { Stack } from 'expo-router/stack';

export default function PokemonLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
