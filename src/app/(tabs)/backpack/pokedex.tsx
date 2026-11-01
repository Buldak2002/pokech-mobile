import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { BagPageHeading } from '../../../components/bag-page-heading';

import { POKEMON_DATA } from '../../../feature/pokedex/pokemon.data';
import PokemonCard from '../../../components/pokemonCard';

import { useMemo, useState } from 'react';
import { useBagSave } from '../../../hooks/use-bag-save';
import { BagLoadState } from '../../../components/bag-load-state';

export default function Pokedex() {
  const [selectOwnded, setSelectOwned] = useState(false); 

  const { save, loading, error, retry } = useBagSave();
  const registeredPokemonIds = useMemo(
    () => save?.user.registeredPokemonIds ?? [],
    [save],
  );

  const collectedSet = useMemo(
    () => new Set(registeredPokemonIds),
    [registeredPokemonIds],
  );

  const ownedSpecies = useMemo(
    () => POKEMON_DATA.filter(pokemon => collectedSet.has(pokemon.id)),
    [collectedSet],
  );

  if (loading || error)
    return <BagLoadState loading={loading} error={error} retry={retry} />;
  return (
    <View style={styles.container}>
      <View style={{flexDirection: "row", justifyContent: "space-between"}}>
        <BagPageHeading title="포켓몬 도감" subtitle="포켓몬을 수집하자!"/>
        <Pressable
          onPress={() => setSelectOwned((previous) => !previous)}
          style={selectOwnded ? [styles.ownedToggle, {backgroundColor:"#f37e7e"}] : [styles.ownedToggle, {backgroundColor:"#7ea8f7"}]}
        >
          { selectOwnded ?
              <Text style={{fontSize: 14, fontWeight: "700", color: "white"}}>찾은 포켓몬</Text>
            :
              <Text style={{fontSize: 14, fontWeight: "700", color: "white"}}>전체 포켓몬</Text>
          }
        </Pressable>
      </View>
      { selectOwnded ?
        <FlatList
          data={ownedSpecies}
          numColumns={3}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => String(item.id)}
          extraData={registeredPokemonIds}
          renderItem={({ item }) => (
            <PokemonCard pokemon={item} isCollected={collectedSet.has(item.id)} />
          )}
        /> : 
        <FlatList
          data={POKEMON_DATA}
          numColumns={3}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => String(item.id)}
          extraData={registeredPokemonIds}
          renderItem={({ item }) => (
            <PokemonCard pokemon={item} isCollected={collectedSet.has(item.id)} />
          )}
        />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff8f',
  },
  card: {
    flex: 1,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  pokemon: {
    width: 100,
    height: 100,
  },
  silhouette: {
    tintColor: '#111827',
    opacity: 0.65,
  },
  pokemonLabel: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 14,
  },
  ownedToggle: {
    backgroundColor: "#ffffff",
    borderColor: '#d5dee5',
    justifyContent: 'center',
    alignItems:"center",
    width: 100,
    height: 50,
    padding: 0,
    right: 5,
    bottom: 0,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
    boxShadow: '0 3px 10px rgba(31, 48, 61, 0.5)',
  }
});
