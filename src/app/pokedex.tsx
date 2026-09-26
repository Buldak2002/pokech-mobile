import { View, Text, StyleSheet, FlatList, Image} from "react-native"

import { POKEMON_DATA } from "../feature/pokedex/pokemon.data";
import PokemonCard  from '../components/pokemonCard';

import { useMemo, useState } from "react";

export default function Pokedex() {

  const [collectedIds, setCollectedIds] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  const collectedSet = useMemo(
    () => new Set(collectedIds),
    [collectedIds]
  )

  return (
        <View style={styles.container}>
          <View style={{alignItems: "center", paddingBottom: 10}}>
            <Text style={styles.pokemonLabel}>포켓몬 도감</Text>
          </View>
          <FlatList
            data={POKEMON_DATA}
            numColumns={3}
            contentContainerStyle={styles.listContent}
            keyExtractor={(item) => String(item.id)}
            extraData={collectedIds}
            renderItem={({ item }) => (
              <PokemonCard
                pokemon={item}
                isCollected={collectedSet.has(item.id)}
              />
            )}
              
          />
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff8f',
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