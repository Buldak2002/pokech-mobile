import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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
import { useHealthSteps } from '../../hooks/useHealthSteps';

const DEFAULT_BIOME = BIOMES[0];

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const stageWidth = Math.min(Math.max(windowWidth - 32, 0), 360);
  const stageHeight = stageWidth * (220 / 360);
  const platformHeight = stageWidth * (768 / 2172);
  const pokemonSize = stageWidth * 0.33;

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

    router.replace({
      pathname: '/battle',
      params: {
        pokemonId: String(pokemon.id),
        biomeId: selectedBiome.id
      }
    })
    setErrorMessage(null);
    setEncounteredPokemon(pokemon);
  };

  //pokemon select 부분
  const { steps } = useHealthSteps();
  const [explorationStartSteps, setExplorationStartSteps] =
    useState<number | null>(null);

  const started = explorationStartSteps != null;

  const progresSteps = started ? Math.min(
    Math.max(0, steps - explorationStartSteps),
    selectedBiome.stepGoal
  ): 0;

  const handleStartExploration = () => {
    setExplorationStartSteps(steps);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        타운 맵
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

      <View style={styles.pokemonContainer}>
        <View
          style={[
            styles.stage,
            { width: stageWidth, height: stageHeight },
          ]}
        >
          <Image
            source={selectedBiome.background}
            resizeMode="contain"
            style={[
              styles.platform,
              { width: stageWidth, height: platformHeight },
            ]}
          />
          <Image
            source={require('../../../assets/images/encounter/mystery-question.gif')}
            resizeMode="contain"
            style={[
              styles.pokemon,
              {
                width: pokemonSize,
                height: pokemonSize,
                bottom: stageHeight * 0.28,
              },
            ]}
          />
        </View>
      </View>

      {errorMessage && (
        <Text style={styles.errorMessage}>
          {errorMessage}
        </Text>
      )}

      <StepGoalCard
        count={progresSteps}
        goal={selectedBiome.stepGoal}
        started={started}
        onStart={handleStartExploration}
        onComplete={handleFindPokemon}
      />

      {(
        <Pressable
          onPress={async () => {
            await appStorage.clearGame();
            router.replace('/');
          }}
        >
          <Text style={styles.resetText}>
            튜토리얼 초기화
          </Text>
        </Pressable>
      )}
    </View>
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
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  platform: {
    zIndex: 0,
  },
  pokemonContainer: {
    zIndex: 1,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 50,
  },
  pokemon: {
    position: 'absolute',
    zIndex: 1,
  },
  pokemonName: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
    top: 45
  },
  pokemonTypes: {
    color: '#4b5563',
    fontSize: 13,
    top: 45
  },
  emptyMessage: {
    zIndex: 1,
    color: '#000000',
    fontSize: 20,
    fontWeight: "700",
    top: 70
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
