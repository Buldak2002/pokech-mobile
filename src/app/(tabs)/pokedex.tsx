import { View, Text, StyleSheet, FlatList } from "react-native"

import { POKEMON_DATA } from "../../feature/pokedex/pokemon.data";
import PokemonCard  from '../../components/pokemonCard';

import { useEffect, useMemo, useState } from "react";
import { appStorage } from "../../storage/appStorage";
import { OwnedPokemon } from "../../feature/user/user.type";

export default function Pokedex() {
  const [collectedPokemon, setCollectedPokemon] = useState<OwnedPokemon[]>([]);

  useEffect(() => {
    const loadPokemon = async () => {
      const gameSave = await appStorage.loadGame();
        
      if(!gameSave) {
          throw new Error("게임 저장 데이터를 찾을 수 없습니다.")
      }

      setCollectedPokemon(gameSave.user.ownedPokemon)
    }
    void loadPokemon();
  },[])

  const collectedSet = useMemo(
    () => new Set(collectedPokemon.map(pokemon => pokemon.speciesId)),
    [collectedPokemon]
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
            extraData={collectedPokemon}
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
