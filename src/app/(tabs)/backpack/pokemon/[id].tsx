import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { BagPageHeading } from '../../../../components/bag-page-heading';
import { PokemonTypeBadgeList } from '../../../../components/pokemon-type-badge';

import { POKEMON_DATA } from '../../../../feature/pokedex/pokemon.data';

export default function PokemonDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const pokemon = POKEMON_DATA.find((item) => item.id === Number(id));

  if (!pokemon) {
    return (
      <View style={{ padding: 16 }}>
        <BagPageHeading title="포켓몬 정보" />
        <Text>포켓몬을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 16 }}>
      <BagPageHeading title={pokemon.name} />
      <Text>도감 번호: {pokemon.id}</Text>
      <PokemonTypeBadgeList types={pokemon.types} size="medium" />
    </View>
  );
}
