import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
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
import type { PokemonInstanceId, User } from '../../feature/user/user.type';
import type {
  Biome,
  BiomeId,
} from '../../feature/biome/biome.type';
import { appStorage } from '../../storage/appStorage';
import { useHealthSteps } from '../../hooks/useHealthSteps';
import { BottomSheet, RNHostView } from '@expo/ui';
import { ImageBackground } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  ExplorationsByBiome,
  ExplorationSession,
} from '../../feature/exploration/exploration.type';
import {
  isPokemonExploring,
  removeExploration,
  startExploration,
  updateExplorationProgress,
} from '../../feature/exploration/exploration.rules';
import { readStepsBetween } from '../../services/healthConnect';
import { createPokemonEncounter } from '../../feature/encounter/encounter.rules';
import { beginActiveBattle } from '../../feature/battle/active-battle';
import { getLevelEligibleEvolutions } from '../../feature/evolution/evolution.rules';
import { EvolutionSheet } from '../../components/evolution-sheet';
import { pokeballColors } from '../../theme/colors';

const DEFAULT_BIOME = BIOMES[0];

type StepBaselines =
  Partial<Record<BiomeId, number>>;

export default function HomeScreen() {

  const insets = useSafeAreaInsets();

  const [biomeOpen, setBiomeOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { width: windowWidth } = useWindowDimensions();
  const stageWidth = Math.min(Math.max(windowWidth - 32, 0), 360);
  const stageHeight = stageWidth * (220 / 360);
  const platformHeight = stageWidth * (768 / 2172);
  const pokemonSize = stageWidth * 0.33;

  const [selectedBiome, setSelectedBiome] =
    useState<Biome>(DEFAULT_BIOME);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  //바이옴별 포켓몬 선택을 유지하는 변수
  const [explorations, setExplorations] = useState<ExplorationsByBiome>({});
  const [stepBaselines, setStepBaselines] =
    useState<StepBaselines>({});

  const [evolutionOpen, setEvolutionOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const levelEligibleEvolutions = useMemo(
    () => user ? getLevelEligibleEvolutions(user) : [],
    [user],
  );
  const availablePokemonCount = new Set(
    levelEligibleEvolutions.map(({ pokemon }) => pokemon.instanceId),
  ).size;

  const { steps, stepsReady } = useHealthSteps();
  const latestStepsRef = useRef(steps);
  const battleStartingRef = useRef(false);

  useEffect(() => {
    latestStepsRef.current = steps;
  }, [steps]);

  const displayedExplorations = useMemo(() => {
    const next: ExplorationsByBiome = {};

    for (const session of Object.values(explorations)) {
      if (!session) continue;

      const baseline = stepBaselines[session.biomeId];
      const liveSteps = baseline === undefined
        ? 0
        : Math.max(0, steps - baseline);
      const progressSteps = Math.min(
        session.progressSteps + liveSteps,
        session.stepGoal,
      );

      next[session.biomeId] = {
        ...session,
        progressSteps,
        status:
          progressSteps >= session.stepGoal
            ? 'ready'
            : 'searching',
      };
    }

    return next;
  }, [explorations, stepBaselines, steps]);

  const displayedExplorationsRef = useRef(displayedExplorations);
  useEffect(() => {
    displayedExplorationsRef.current = displayedExplorations;
  }, [displayedExplorations]);

  const currentExploration =
    displayedExplorations[selectedBiome.id] ?? null;
  const travelPokemon = user?.ownedPokemon.find(
    pokemon =>
      pokemon.instanceId ===
      currentExploration?.travelPokemonId
  ) ?? null

  const assignedPokemonIds =
    Object.values(explorations)
      .map(session => session?.travelPokemonId)
      .filter(
        (pokemonId): pokemonId is string =>
          pokemonId !== undefined
      )

  const handleSelectBiome = (biome: Biome) => {
    setSelectedBiome(biome);
    setErrorMessage(null);
  };

  const handleFindPokemon = async () => {
    if (!currentExploration || battleStartingRef.current) {
      return;
    }

    if (
      currentExploration.progressSteps <
      currentExploration.stepGoal
    ) {
      return;
    }

    battleStartingRef.current = true;

    try {
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
        setErrorMessage(
          '이 바이옴에서 등장할 수 있는 포켓몬이 없습니다.',
        );
        return;
      }

      const latestSave = await appStorage.loadGame();
      if (!latestSave) {
        setErrorMessage('게임 저장 데이터를 불러오지 못했습니다.');
        return;
      }

      const latestExplorations = latestSave.explorations ?? {};
      const latestSession = latestExplorations[selectedBiome.id];

      if (!latestSession) {
        setErrorMessage('이 바이옴의 탐험 정보를 찾을 수 없습니다.');
        return;
      }

      const nextExplorations = removeExploration(
        latestExplorations,
        selectedBiome.id,
      );

      // 배틀은 저장하지 않는다. 진입 전에 탐험 세션을 제거하므로
      // 앱 프로세스가 종료되면 조우한 포켓몬도 함께 사라진다.
      await appStorage.saveGame({
        ...latestSave,
        explorations: nextExplorations,
      });

      const battle = beginActiveBattle({
        biomeId: selectedBiome.id,
        travelPokemonId: latestSession.travelPokemonId,
        encounter: createPokemonEncounter(pokemon.id),
      });

      setExplorations(nextExplorations);
      setStepBaselines(current => {
        const next = { ...current };
        delete next[selectedBiome.id];
        return next;
      });
      setErrorMessage(null);

      router.replace({
        pathname: '/battle',
        params: {
          battleId: battle.id,
        }
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '배틀을 시작하지 못했습니다.',
      );
    } finally {
      battleStartingRef.current = false;
    }
  };

  const handleStartExploration = async (
    pokemonId: PokemonInstanceId,
  ) => {
    const latestSave = await appStorage.loadGame();

    if (!latestSave) {
      throw new Error('게임 저장 데이터를 찾을 수 없습니다.');
    }

    const latestExplorations = latestSave.explorations ?? {};

    if (latestExplorations[selectedBiome.id]) {
      throw new Error('이 바이옴은 이미 탐험 중입니다.');
    }

    if (isPokemonExploring(latestExplorations, pokemonId)) {
      throw new Error('이 포켓몬은 이미 다른 바이옴을 탐험 중입니다.');
    }

    const ownsPokemon = latestSave.user.ownedPokemon.some(
      pokemon => pokemon.instanceId === pokemonId,
    );

    if (!ownsPokemon) {
      throw new Error('보유하지 않은 포켓몬입니다.');
    }

    const session = startExploration(
      selectedBiome,
      pokemonId,
    );
    const nextExplorations: ExplorationsByBiome = {
      ...latestExplorations,
      [selectedBiome.id]: session,
    };

    await appStorage.saveGame({
      ...latestSave,
      explorations: nextExplorations,
    });

    setUser(latestSave.user);
    setExplorations(nextExplorations);
    setStepBaselines(current => ({
      ...current,
      [selectedBiome.id]: steps,
    }));
  };

  const handleBiomeSelect = (biome: Biome) => {
    handleSelectBiome(biome);
    setBiomeOpen(false);
  };

  const handleOpenEvolutions = async () => {
    try {
      const latestSave = await appStorage.loadGame();
      if (!latestSave) {
        throw new Error('저장 데이터를 찾을 수 없습니다.');
      }

      setUser(latestSave.user);
      setEvolutionOpen(true);
    } catch (error) {
      Alert.alert(
        '진화 목록을 불러오지 못했습니다.',
        error instanceof Error ? error.message : '다시 시도해주세요.',
      );
    }
  };

  useEffect(() => {
    if (!stepsReady) {
      return;
    }

    let cancelled = false;

    const loadHome = async () => {
      const gameSave = await appStorage.loadGame();

      if(!gameSave) {
        Alert.alert("게임 저장 데이터를 불러오지 못했습니다.");
        setIsLoaded(true);
        return;
      }

      const savedSessions = Object.values(
        gameSave.explorations ?? {},
      ).filter(
        (session): session is ExplorationSession =>
          session !== undefined,
      );

      const restoredSessions = await Promise.all(
        savedSessions.map(async session => {
          try {
            const healthStepsSinceStart =
              await readStepsBetween(session.startedAt);
            const progressSteps = Math.min(
              Math.max(
                session.progressSteps,
                healthStepsSinceStart,
              ),
              session.stepGoal,
            );

            return {
              ...session,
              progressSteps,
              status:
                progressSteps >= session.stepGoal
                  ? 'ready' as const
                  : 'searching' as const,
            };
          } catch (error) {
            console.error('탐험 진행도 복원 실패:', error);
            return session;
          }
        }),
      );

      if (cancelled) return;

      const restoredExplorations: ExplorationsByBiome = {};
      const restoredBaselines: StepBaselines = {};
      const syncedSteps = latestStepsRef.current;

      for (const session of restoredSessions) {
        // 지연된 건강 기록으로 기준점을 갱신해도 실시간 진행도를 보존한다.
        const liveSession = displayedExplorationsRef.current[session.biomeId];
        restoredExplorations[session.biomeId] = updateExplorationProgress(
          session,
          {
            healthStepsSinceStart: session.progressSteps,
            syncedStepsAtLiveStart:
              liveSession?.startedAt === session.startedAt
                ? liveSession.progressSteps
                : 0,
            liveStepsSinceLiveStart: 0,
          },
        );
        restoredBaselines[session.biomeId] = syncedSteps;
      }

      setUser(gameSave.user);
      setExplorations(restoredExplorations);
      setStepBaselines(restoredBaselines);
      setIsLoaded(true);

      await appStorage.saveGame({
        ...gameSave,
        explorations: restoredExplorations,
      });
    };

    void loadHome().catch(error => {
      console.error('홈 데이터 복원 실패:', error);
      if (!cancelled) setIsLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [stepsReady]);

  const progressSteps =
    currentExploration?.progressSteps ?? 0;

  return (

    <ImageBackground
      source={selectedBiome.cardBackground}
      contentFit='cover'
      style={{flex: 1}}
      imageStyle={{opacity: 0.4}}
    >
      <View style={[styles.container, {paddingTop: insets.top + 20}]}>
        <View style={styles.homeHeader}>
          <View style={styles.userIterface}>
            <Text style={{fontWeight: "700", fontSize: 15}}>{user?.name ?? ''}</Text>
            <Text style={{fontSize: 13, opacity: 0.7}}>오늘 걸은 걸음 : {steps}</Text>
          </View>
          <Pressable
            onPress={() => setBiomeOpen(true)}
            style={styles.townMapButton}
          >
            <Image
              source={require("../../../assets/items/town-map.png")}
              resizeMode= "contain"
              style={styles.townMapIcon}
            />
            <View style={styles.townMapLabel}>
              <Text style={{fontWeight: "700", fontSize: 14}}>타운 맵</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`진화 확인, 진화 레벨에 도달한 포켓몬 ${availablePokemonCount}마리`}
            onPress={() => void handleOpenEvolutions()}
            style={({ pressed }) => [
              styles.evolutionCoachmark,
              pressed && styles.evolutionCoachmarkPressed,
            ]}
          >
            <View style={styles.evolutionCoachmarkIcon}>
              <Text style={styles.evolutionCoachmarkSparkle}>✦</Text>
            </View>
            <Text numberOfLines={1} style={styles.evolutionCoachmarkText}>
              진화 확인
            </Text>
            <View style={styles.evolutionCoachmarkCount}>
              <Text numberOfLines={1} style={styles.evolutionCoachmarkCountText}>
                {availablePokemonCount}마리
              </Text>
            </View>
          </Pressable>
        </View>

        <BottomSheet
          isPresented={biomeOpen}
          onDismiss={() => setBiomeOpen(false)}
          snapPoints={["full"]}
        >
          <RNHostView>
            <BiomeSelector
              biomes={BIOMES}
              selectedBiomeId={selectedBiome.id}
              explorations={displayedExplorations}
              ownedPokemon={user?.ownedPokemon ?? []}
              onSelect={handleBiomeSelect}
            />
          </RNHostView>
        </BottomSheet>

        <EvolutionSheet
          isOpen={evolutionOpen}
          user={user}
          onDismiss={() => setEvolutionOpen(false)}
          onUserChange={setUser}
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

        {isLoaded ? (
          <StepGoalCard
            count={progressSteps}
            goal={currentExploration?.stepGoal ?? selectedBiome.stepGoal}
            started={currentExploration !== null}
            travelPokemon={travelPokemon}
            assignedPokemonIds={assignedPokemonIds}
            onStart={handleStartExploration}
            onComplete={handleFindPokemon}
          />
        ) : (
          <Text style={styles.resetText}>탐험 정보를 불러오는 중...</Text>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: 18,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20
  },
  homeHeader: {
    width: '100%',
    position: 'relative',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  evolutionCoachmark: {
    position: 'absolute',
    top: 71,
    width: 146,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    backgroundColor: pokeballColors.whiteTranslucent,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: pokeballColors.black,
    borderRadius: 19,
    boxShadow:
      '0 0 4px rgba(0, 0, 0, 0.12), 0 5px 10px rgba(0, 0, 0, 0.16)',
  },
  evolutionCoachmarkPressed: {
    opacity: 0.78,
  },
  evolutionCoachmarkIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: pokeballColors.red,
  },
  evolutionCoachmarkSparkle: {
    color: pokeballColors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  evolutionCoachmarkText: {
    flex: 1,
    color: pokeballColors.black,
    fontSize: 12,
    fontWeight: '800',
  },
  evolutionCoachmarkCount: {
    minWidth: 37,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: pokeballColors.red,
  },
  evolutionCoachmarkCountText: {
    color: pokeballColors.white,
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  userIterface: {
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    boxShadow:
      '0 0 4px rgba(0, 0, 0, 0.12), 0 5px 10px rgba(0, 0, 0, 0.16)',
    borderRadius: 35,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 1,
    right: 20
  },
  title: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  biomeInformation: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 24,
    marginTop: 30,
    top: 30
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
  townMapButton: {
    position: 'relative',
    width: 90,
    height: 68,
  },
  townMapIcon: {
    width: 65,
    height: 65,
    left: 50
  },
  townMapLabel: {
    position: 'absolute',
    right: 5,
    bottom: 8,
    zIndex: 1,
    height: 25,
    padding: 4,
    justifyContent: "center",

    color: '#111827',
    fontSize: 15,
    fontWeight: '800',

    backgroundColor: '#edf3f3',
    boxShadow:
      '0 0 4px rgba(0, 0, 0, 0.12), 0 5px 10px rgba(0, 0, 0, 0.16)',
    borderRadius: 35,
  },
});
