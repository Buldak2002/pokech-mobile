import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { BiomeSelector } from '../../components/biome-selector';
import { StepGoalCard } from '../../components/StepGoalCard';
import { BIOMES } from '../../feature/biome/biome.data';
import {
  getBiomePokemonCandidates,
  selectWeightedPokemon,
} from '../../feature/biome/biome.rules';
import type { Biome } from '../../feature/biome/biome.type';
import type { Pokemon } from '../../feature/pokedex/pokemon.type';
import { appStorage } from '../../storage/appStorage';

const TEST_STEP_COUNT = 0;
const TEST_STEP_GOAL = 0;

const DEFAULT_BIOME = BIOMES[0];

export default function HomeScreen() {
  const [selectedBiome, setSelectedBiome] =
    useState<Biome>(DEFAULT_BIOME);

  const [
    encounteredPokemon,
    setEncounteredPokemon,
  ] = useState<Pokemon | null>(null);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const handleSelectBiome = (biome: Biome) => {
    setSelectedBiome(biome);
    setEncounteredPokemon(null);
    setErrorMessage(null);
  };

  const handleFindPokemon = () => {
    const candidates =
      getBiomePokemonCandidates(selectedBiome);

    const pokemon =
      selectWeightedPokemon(candidates);

    console.log(
      '바이옴:',
      selectedBiome.id,
      '후보 수:',
      candidates.length,
      '선택:',
      pokemon?.name,
    );

    if (!pokemon) {
      setEncounteredPokemon(null);
      setErrorMessage(
        '이 바이옴에서 등장할 수 있는 포켓몬이 없습니다.',
      );
      return;
    }

    setErrorMessage(null);
    setEncounteredPokemon(pokemon);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>
        탐색할 바이옴
      </Text>

      <BiomeSelector
        biomes={BIOMES}
        selectedBiomeId={selectedBiome.id}
        onSelect={handleSelectBiome}
      />

      <View style={styles.biomeInformation}>
        <Text style={styles.biomeName}>
          {selectedBiome.name}
        </Text>

        <Text style={styles.biomeDescription}>
          {selectedBiome.description}
        </Text>
      </View>

      <View style={styles.stage}>
        <Image
          source={selectedBiome.background}
          resizeMode="contain"
          style={styles.platform}
        />

        {encounteredPokemon ? (
          <View style={styles.pokemonContainer}>
            <Image
              source={encounteredPokemon.image}
              resizeMode="contain"
              style={styles.pokemon}
            />

            <Text style={styles.pokemonName}>
              {encounteredPokemon.name}
            </Text>

            <Text style={styles.pokemonTypes}>
              {encounteredPokemon.types.join(' · ')}
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyMessage}>
            아직 발견한 포켓몬이 없습니다.
          </Text>
        )}
      </View>

      {errorMessage && (
        <Text style={styles.errorMessage}>
          {errorMessage}
        </Text>
      )}

      <StepGoalCard
        count={TEST_STEP_COUNT}
        goal={TEST_STEP_GOAL}
        onComplete={handleFindPokemon}
      />

      {__DEV__ && (
        <Pressable
          onPress={async () => {
            await appStorage.resetLaunchState();
            router.replace('/');
          }}
        >
          <Text style={styles.resetText}>
            튜토리얼 초기화
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 18,
    paddingTop: 20,
    paddingBottom: 140,
  },
  title: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
  },
  biomeInformation: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 24,
  },
  biomeName: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
  },
  biomeDescription: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 14,
  },
  stage: {
    width: '100%',
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platform: {
    position: 'absolute',
    bottom: 0,
    width: 360,
    height: 220,
  },
  pokemonContainer: {
    zIndex: 1,
    alignItems: 'center',
    gap: 2,
    paddingBottom: 50,
  },
  pokemon: {
    width: 170,
    height: 170,
  },
  pokemonName: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
  },
  pokemonTypes: {
    color: '#4b5563',
    fontSize: 13,
  },
  emptyMessage: {
    zIndex: 1,
    color: '#6b7280',
    fontSize: 14,
  },
  errorMessage: {
    color: '#dc2626',
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  resetText: {
    color: '#6b7280',
    padding: 12,
  },
});