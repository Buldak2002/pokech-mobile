import { memo } from 'react';
import { Text, StyleSheet, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import type { Pokemon } from '../feature/pokedex/pokemon.type';

type PokemonCardProps = {
  pokemon: Pokemon;
  isCollected: boolean;
};

const PokemonCard = memo(function PokemonCard({
  pokemon,
  isCollected,
}: PokemonCardProps) {
    return (
    <Pressable 
        style={styles.card}
        onPress={() => router.push({
            pathname: '/backpack/pokemon/[id]',
            params: {
                id: String(pokemon.id),
            }
        })}
    >
      <Image
        source={pokemon.image}
        style={[
          styles.pokemon,
          !isCollected && styles.silhouette,
        ]}
        resizeMode="contain"
      />

      <Text>
        {isCollected ? pokemon.name : '???'}
      </Text>
    </Pressable>
  );
});

export default PokemonCard

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  card: {
    flex: 1,
    height: 130,
    alignItems: "center",
    justifyContent: "center"
  },
  listContent: {
    paddingBottom: 160
  },
  pokemon: {
    width: 100,
    height: 100
  },
  silhouette: {
    tintColor: '#111827',
    opacity: 0.65
  },
  pokemonLabel: {
    fontSize: 30,
    fontWeight: "700"
  }
});
