import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import type {
  Biome,
  BiomeId,
} from '../feature/biome/biome.type';
import type { ExplorationsByBiome } from '../feature/exploration/exploration.type';
import type { OwnedPokemon } from '../feature/user/user.type';
import { POKEMON_GEN5_IMAGES } from '../feature/pokedex/pokemonGen5Images';
import { PokemonTypeBadgeList } from './pokemon-type-badge';

type BiomeSelectorProps = {
  biomes: readonly Biome[];
  selectedBiomeId: BiomeId;
  explorations: ExplorationsByBiome;
  ownedPokemon: OwnedPokemon[];
  onSelect: (biome: Biome) => void;
};

export function BiomeSelector({
  biomes,
  selectedBiomeId,
  explorations,
  ownedPokemon,
  onSelect,
}: BiomeSelectorProps) {
  return (
    <ScrollView
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {biomes.map((biome) => {
        const isSelected =
          biome.id === selectedBiomeId;
        const exploration = explorations[biome.id];
        const travelPokemon = ownedPokemon.find(
          pokemon =>
            pokemon.instanceId ===
            exploration?.travelPokemonId,
        );

        return (
          <Pressable
            key={biome.id}
            accessibilityRole="button"
            accessibilityState={{
              selected: isSelected,
            }}
            onPress={() => onSelect(biome)}
            style={({ pressed }) => [
              styles.card,
              isSelected && styles.selectedCard,
              pressed && styles.pressedCard,
            ]}
          >
            <View style={styles.backgroundFrame}>
              <Image
                source={biome.cardBackground}
                contentFit="cover"
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  styles.cardContent,
                  isSelected && styles.selectedCardContent,
                ]}
              >
                <Text
                  style={[
                    styles.name,
                    isSelected && styles.selectedName,
                  ]}
                >
                  {biome.name}
                </Text>

                <Text
                  numberOfLines={2}
                  style={styles.description}
                >
                  {biome.description}
                </Text>

                <PokemonTypeBadgeList
                  types={biome.typeNames}
                  style={styles.typeList}
                />

                {exploration && travelPokemon && (
                  <View style={styles.explorationStatus}>
                    <Image
                      source={POKEMON_GEN5_IMAGES[travelPokemon.speciesId]}
                      contentFit="contain"
                      style={styles.explorationPokemon}
                    />
                    <Text style={styles.explorationText}>
                      {exploration.status === 'ready'
                        ? '탐험 완료'
                        : '탐험 중'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  card: {
    width: "100%",
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  selectedCard: {
    borderColor: '#ef4444',
    boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.16)',
  },
  pressedCard: {
    opacity: 0.72,
  },
  backgroundFrame: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#91aab4',
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: '#dce8df',
    boxShadow: '0 3px 8px rgba(35, 58, 70, 0.18)',
  },
  cardContent: {
    minHeight: 126,
    gap: 6,
    padding: 14,
    backgroundColor: '#ffffffad',
  },
  selectedCardContent: {
    backgroundColor: '#fff7edbd',
  },
  name: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
  selectedName: {
    color: '#dc2626',
  },
  description: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 17,
  },

  typeList: {
    paddingTop: 10,
  },
  explorationStatus: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
  },
  explorationPokemon: {
    width: 28,
    height: 28,
  },
  explorationText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
});
