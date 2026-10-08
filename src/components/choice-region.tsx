import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image as ExpoImage } from "expo-image";

import { Pokemon } from "../feature/pokedex/pokemon.type";
import { POKEMON_DATA } from "../feature/pokedex/pokemon.data";

type RegionSelectionProps = {
  onSelect: (pokemon: Pokemon) => void;
};

const REGIONS = [
  {
    id: "kanto",
    name: "관동지방",
    generation: "1세대",
    starterIds: [1, 4, 7],
  },
  {
    id: "johto",
    name: "성도지방",
    generation: "2세대",
    starterIds: [152, 155, 158],
  },
  {
    id: "hoenn",
    name: "호연지방",
    generation: "3세대",
    starterIds: [252, 255, 258],
  },
  {
    id: "sinnoh",
    name: "신오지방",
    generation: "4세대",
    starterIds: [387, 390, 393],
  },
  {
    id: "unova",
    name: "하나지방",
    generation: "5세대",
    starterIds: [495, 498, 501],
  },
] as const;


type RegionId = (typeof REGIONS)[number]["id"];


export function RegionSelection ({onSelect}: RegionSelectionProps) {
    
  const [selectionRegionId, setSelectionRegionId] = useState<RegionId | null>(null);
 
  const selectionRegion = REGIONS.find((region) => region.id === selectionRegionId);
  const startPokemon = selectionRegion ? 
    selectionRegion.starterIds.map((pokemonId) =>
      POKEMON_DATA.find(
        (pokemon) => pokemon.id === pokemonId,
      )
    )
    .filter(
      (pokemon): pokemon is Pokemon => 
        pokemon !== undefined
    )
    : [];
  
  if(!selectionRegion) {
    return (
      <View style={styles.container}>
        <View style={styles.regionGrid}>
        {REGIONS.map((region) => (
          <Pressable
            key={region.id}
            onPress={() =>
              setSelectionRegionId(region.id)
            }
            style={({ pressed }) => [
              styles.regionButton,
              pressed && styles.pressed,
            ]}
          >
              <Text style={styles.generation}>
                {region.generation}
              </Text>
              <Text style={styles.regionName}>
                {region.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      
    )
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {selectionRegion.name}의 스타팅 포켓몬
      </Text>

      <Text style={styles.description}>
        함께 모험할 포켓몬을 선택해 주세요.
      </Text>

      <View style={styles.starterRow}>
        {startPokemon.map((pokemon) => (
          <Pressable
            key={pokemon.id}
            onPress={() => onSelect(pokemon)}
            style={({ pressed }) => [
              styles.starterCard,
              pressed && styles.pressed,
            ]}
          >
            <ExpoImage
              source={pokemon.image}
              contentFit="contain"
              style={styles.pokemonImage}
            />

            <Text style={styles.pokemonName}>
              {pokemon.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => setSelectionRegionId(null)}
        style={styles.backButton}
      >
        <View style={{top: 100}}>
          <Text style={styles.backButtonText}>
            ← 지방 다시 선택
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 18,
  },

  title: {
    color: "#28261d",
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },

  description: {
    color: "#5b563f",
    fontSize: 15,
    fontWeight: "600",
  },

  regionGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },

  regionButton: {
    width: "46%",
    minHeight: 78,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,

    backgroundColor: "rgba(255, 255, 238, 0.96)",
    borderWidth: 3,
    borderColor: "#5b563f",
    borderRadius: 14,
    borderCurve: "continuous",
  },

  generation: {
    color: "#8a7021",
    fontSize: 14,
    fontWeight: "700",
  },

  regionName: {
    color: "#28261d",
    fontSize: 18,
    fontWeight: "800",
  },

  starterRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },

  starterCard: {
    flex: 1,
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    gap: 8,

    backgroundColor: "rgba(255, 255, 238, 0.96)",
    borderWidth: 3,
    borderColor: "#5b563f",
    borderRadius: 14,
    borderCurve: "continuous",
  },

  pokemonImage: {
    width: 92,
    height: 110,
  },

  pokemonName: {
    color: "#28261d",
    fontSize: 15,
    fontWeight: "800",
  },

  backButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  backButtonText: {
    color: "#665c39",
    fontSize: 20,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});