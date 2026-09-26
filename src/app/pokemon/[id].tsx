import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { POKEMON_DATA } from '../../feature/pokedex/pokemon.data';

export default function PokemonDetail() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const pokemon = POKEMON_DATA.find(
    (item) => item.id === Number(id),
  );

  if (!pokemon) {
    return <Text>포켓몬을 찾을 수 없습니다.</Text>;
  }

  return (
    <View>
      <Text>{pokemon.name}</Text>
      <Text>도감 번호: {pokemon.id}</Text>
    </View>
  );
}