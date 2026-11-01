// src/app/battle.tsx
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image as ExpoImage } from 'expo-image'

import { POKEMON_GEN5_IMAGES } from '../../src/feature/pokedex/pokemonGen5Images'
import { POKEMON_DATA } from '../feature/pokedex/pokemon.data';
import { BIOMES } from '../feature/biome/biome.data';
import { ITEM_DATA } from '../feature/items/item-data';
import type { BallName } from '../feature/items/item.type';
import { itemImages } from '../feature/items/item-Images';
import { StatusBar } from 'expo-status-bar';

import { appStorage } from "../storage/appStorage";
import { obtainPokemon } from "../feature/user/obtain-pokemon";
import { levelUpOwnedPokemon } from '../feature/user/level-up-owned-pokemon';
import { consumeBall } from '../feature/items/inventory.rules';
import {
  isCaptureSuccessful,
  resolveFailedCapture,
} from '../feature/encounter/encounter.rules';
import {
  endActiveBattle,
  getActiveBattle,
  updateActiveBattleEncounter,
} from '../feature/battle/active-battle';

import { TrainerThrowAnimation, TrainerThrowAnimationHandle } from '../components/trainer-throw-animation';
import { CaptureBallAnimation, CaptureBallAnimationHandle } from '../components/capture-ball-animation';
import type { User } from '../feature/user/user.type';
import { PokemonTypeBadgeList } from '../components/pokemon-type-badge';
import { SafeAreaView } from 'react-native-safe-area-context';

type WindowBounds = { x: number; y: number; width: number; height: number };

function measureView(view: View | null): Promise<WindowBounds> {
  return new Promise((resolve, reject) => {
    if (!view) {
      reject(new Error('애니메이션 위치를 찾을 수 없습니다.'));
      return;
    }

    view.measureInWindow((x, y, width, height) => {
      if (width === 0 || height === 0) {
        reject(new Error('애니메이션 위치를 찾을 수 없습니다.'));
        return;
      }
      resolve({ x, y, width, height });
    });
  });
}

export default function BattleScreen() {
  const { battleId } = useLocalSearchParams<{
    battleId: string;
  }>();
  const [battle, setBattle] = useState(() =>
    getActiveBattle(battleId),
  );

  const pokemon = POKEMON_DATA.find(
    item => item.id === battle?.encounter.pokemonId,
  );
  const biome = BIOMES.find(
    item => item.id === battle?.biomeId,
  );

  const [isCapturing, setIsCapturing] = useState(false);
  const [captureMessage, setCaptureMessage] = useState<string | null>(
    () => battle ? `야생의 ${pokemon?.name ?? '포켓몬'}가 나타났다...!` : null,
  );
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [battleEnded, setBattleEnded] = useState(false);
  const [showBalls, setShowBalls] = useState(false);
  const [pokemonInBall, setPokemonInBall] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const hasRegisteredPokemon = Boolean(
    pokemon && user?.registeredPokemonIds.includes(pokemon.id),
  );
  const trainerRef = useRef<TrainerThrowAnimationHandle>(null)
  const ballAnimationRef = useRef<CaptureBallAnimationHandle>(null);
  const sceneRef = useRef<View>(null);
  const trainerPositionRef = useRef<View>(null);
  const pokemonPositionRef = useRef<View>(null);
  const platformPositionRef = useRef<View>(null);

  useEffect(() => {
    if (!battle) {
      router.replace('/home');
      return;
    }

    const loadPlayer = async () => {
      
      const gameSave = await appStorage.loadGame();

      if(!gameSave) {
        throw new Error("게임 저장 데이터를 찾을 수 없습니다.")
      }

      setUser(gameSave.user);
    }
    
    void loadPlayer().catch((error: unknown) => {
      setCaptureError(
        error instanceof Error ? error.message : '게임 저장 데이터를 불러오지 못했습니다.',
      );
    });

  }, [battle]);

  useEffect(() => {
    return () => {
      if (battleId) {
        endActiveBattle(battleId);
      }
    };
  }, [battleId]);

  const handleCapture = async (ballId: BallName) => {
    if(
    !battle ||
    !pokemon ||
    isCapturing ||
    captureMessage
    ) {
      return;
    }

    try {
      setIsCapturing(true)
      setCaptureError(null)

      const gameSave = await appStorage.loadGame();
      if(!gameSave) {
        throw new Error("게임 저장 데이터를 찾을 수 없습니다.")
      }

      const currentBattle = getActiveBattle(battle.id);
      if (!currentBattle) {
        throw new Error('종료된 배틀입니다.');
      }

      const selectedBall = ITEM_DATA.find(item => item.id === ballId);
      const quantity = gameSave.user.ownedItems?.find(item => item.itemId === ballId)?.quantity ?? 0;
      if (!selectedBall || quantity <= 0) {
        throw new Error('사용할 수 있는 볼이 없습니다.');
      }

      const [sceneBounds, trainerBounds, pokemonBounds, platformBounds] = await Promise.all([
        measureView(sceneRef.current),
        measureView(trainerPositionRef.current),
        measureView(pokemonPositionRef.current),
        measureView(platformPositionRef.current),
      ]);
      const start = {
        x: trainerBounds.x - sceneBounds.x + trainerBounds.width * 0.7,
        y: trainerBounds.y - sceneBounds.y + trainerBounds.height * 0.42,
      };
      const target = {
        x: pokemonBounds.x - sceneBounds.x + pokemonBounds.width / 2,
        y: pokemonBounds.y - sceneBounds.y + pokemonBounds.height / 2,
      };
      const landing = {
        x: platformBounds.x - sceneBounds.x + platformBounds.width / 2,
        y: platformBounds.y - sceneBounds.y + platformBounds.height * 0.55,
      };

      // 결과를 판정하기 전에 볼 소비를 먼저 저장한다.
      // 이 저장 이후 앱이 종료되어도 사용한 볼은 돌아오지 않는다.
      const userAfterBall = consumeBall(
        gameSave.user,
        selectedBall.id,
      );

      await appStorage.saveGame({
        ...gameSave,
        user: userAfterBall,
      });
      setUser(userAfterBall);

      const captured = isCaptureSuccessful(
        pokemon,
        selectedBall.captrueMultiplier,
      );

      trainerRef.current?.play();
      await ballAnimationRef.current?.play(
        ballId,
        start,
        target,
        landing,
        captured,
        () => setPokemonInBall(true),
      );

      if (!captured) {
        const failedResult = resolveFailedCapture(
          currentBattle.encounter,
        );
        setPokemonInBall(failedResult.fled);

        if (failedResult.fled) {
          endActiveBattle(currentBattle.id);
          setBattleEnded(true);
          setCaptureMessage(
            `${pokemon.name}이 도망쳤다!`,
          );
          return;
        }

        const updatedBattle = updateActiveBattleEncounter(
          currentBattle.id,
          failedResult.encounter,
        );
        setBattle(updatedBattle);
        setBattleEnded(false);
        setCaptureMessage(
          `${pokemon.name}이 ${selectedBall.name}에서 빠져나왔다!`,
        );
        return;
      }

      const captureResult = obtainPokemon({
        user: userAfterBall,
        speciesId: pokemon.id,
        level: pokemon.evolutionStage === 1 ? 20 : 1,
      });

      const levelResult = levelUpOwnedPokemon(
        captureResult.user,
        currentBattle.travelPokemonId,
      );

      await appStorage.saveGame({
        ...gameSave,
        user: levelResult.user,
      });
      setUser(levelResult.user);
      endActiveBattle(currentBattle.id);
      setBattleEnded(true);

      setCaptureMessage(
        `${pokemon.name} 포획 성공! 탐험 포켓몬이 Lv. ${levelResult.pokemon.level}로 올랐다!`,
      )

      router.replace({
        pathname: '/catchResult',
        params: {
          capturedSpeciesId: String(captureResult.pokemon.speciesId),
          capturedLevel: String(captureResult.pokemon.level),
          leveledSpeciesId: String(levelResult.pokemon.speciesId),
          leveledLevel: String(levelResult.pokemon.level),
          isNew: String(captureResult.isNew)
        }
      })

    } catch(error) {
      ballAnimationRef.current?.reset();
      setPokemonInBall(false);
      setCaptureError(
        error instanceof Error ? error.message : "포켓몬 저장에 실패했습니다."
      )
    } finally {
      trainerRef.current?.stop();
      setIsCapturing(false)
    }

  }

  const handleBack = () => {
    if (battleId) {
      endActiveBattle(battleId);
    }
    router.replace('/home')
  }

  const handleRun = () => {
    if (isCapturing || captureMessage || captureError) {
      return;
    }

    if (battleId) {
      endActiveBattle(battleId);
    }
    setBattleEnded(true);
    setCaptureMessage(`${pokemon?.name ?? '야생 포켓몬'}에게서 무사히 도망쳤다!`)
  }

  const dismissError = () => {
    setCaptureError(null);
  };

  const handleMessagePress = () => {
    if (captureError) {
      dismissError();
      return;
    }

    if (battleEnded) {
      handleBack();
      return;
    }

    setCaptureMessage(null);
  };

  const battleMessage = captureError
    ?? captureMessage
    ?? (isCapturing ? `${user?.name ?? '트레이너'}는 몬스터볼을 던졌다!` : null);
  if (!pokemon || !biome) {
    return (
      <View style={styles.container}>
        <Text>전투 정보를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View ref={sceneRef} collapsable={false} style={styles.container}>

      <SafeAreaView
        style={{flex: 1}}
        edges={['bottom']}
      >
        <StatusBar style="dark" />

        <View style={styles.stage}>
          <View style={styles.encounter}>
            <View ref={platformPositionRef} collapsable={false} style={styles.platform}>
              <ExpoImage
                source={biome.background}
                contentFit="contain"
                style={styles.platformImage}
              />
            </View>

            <View style={[styles.pokemonContainer, pokemonInBall && styles.hiddenPokemon]}>
              <View ref={pokemonPositionRef} collapsable={false} style={styles.pokemonPosition}>
                <ExpoImage
                  source={POKEMON_GEN5_IMAGES[pokemon.id]}
                  contentFit="contain"
                  style={styles.pokemon}
                />
              </View>

              <View style={styles.pokemonInfoRow}>
                {hasRegisteredPokemon && (
                  <ExpoImage
                    accessibilityLabel="도감에 등록된 포켓몬"
                    source={itemImages['poke-ball']}
                    contentFit="contain"
                    style={styles.registeredPokemonIcon}
                  />
                )}

                <Text style={[styles.pokemonName, styles.wildPokemonName]}>
                  {pokemon.name}
                </Text>

                <PokemonTypeBadgeList
                  types={pokemon.types}
                  style={[styles.pokemonTypes, styles.wildPokemonTypes]}
                />
              </View>

            </View>
          </View>
        </View>

        <View style={{flexDirection: "row"}}>
            <View ref={trainerPositionRef} collapsable={false}>
              {user?.gender === 'male' ?
                <TrainerThrowAnimation ref={trainerRef} character='lucas-pt'/> :
                <TrainerThrowAnimation ref={trainerRef} character='dawn-pt'/>
              }
            </View>
            <View style={styles.playerName}>
              <Text style={styles.pokemonName}>{user?.name}</Text>
            </View>
        </View>

        <View style={styles.selection}>
          {battleMessage ? (
            <Pressable
              style={styles.messagePanel}
              accessibilityRole="button"
              disabled={isCapturing}
              onPress={handleMessagePress}
            >
              <Text
                accessibilityLiveRegion="polite"
                style={[
                  styles.messageText,
                  captureError ? styles.errorMessageText : null,
                ]}
              >
                {battleMessage}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.actionLayout}>
              <View style={styles.captureContent}>
                {showBalls ? (
                  <View style={styles.ballGrid}>
                    {[0, 1].map(row => (
                      <View key={row} style={styles.ballRow}>
                        {ITEM_DATA.slice(row * 2, row * 2 + 2).map(item => {
                          const quantity = user?.ownedItems?.find(ball => ball.itemId === item.id)?.quantity ?? 0;
                          const disabled = quantity <= 0 || isCapturing;
                          return (
                            <Pressable
                              key={item.id}
                              accessibilityRole="button"
                              accessibilityLabel={`${item.name}, ${quantity}개 보유`}
                              accessibilityState={{ disabled }}
                              disabled={disabled}
                              onPress={() => void handleCapture(item.id)}
                              style={[styles.ballSlot, disabled && styles.emptyBallSlot]}
                            >
                              <ExpoImage
                                source={itemImages[item.id]}
                                contentFit="contain"
                                style={styles.ballImage}
                              />
                              <Text style={styles.ballName}>{item.name}</Text>
                              <Text style={styles.ballQuantity}>×{quantity}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setShowBalls(true)}
                    style={styles.captureArea}
                  >
                    <Text style={styles.areaText}>포획하기</Text>
                  </Pressable>
                )}
              </View>

              <Pressable accessibilityRole="button" onPress={handleRun} style={styles.runArea}>
                <Text style={styles.runText}>도망치기</Text>
              </Pressable>
            </View>
          )}

        </View>
      </SafeAreaView>
      <CaptureBallAnimation ref={ballAnimationRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "stretch",
  },
  stage: {
    flex: 5,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    left: 55,
    paddingBottom: 0
  },
  encounter: {
    width: 300,
    height: 150,
    alignItems: 'center',
  },
  platform: {
    position: 'absolute',
    top: 55,
    width: 300,
    height: 106,
  },
  platformImage: {
    width: '100%',
    height: '100%',
  },
  pokemonContainer: {
    zIndex: 1,
    alignItems: 'center',
    gap: 2,
    paddingBottom: 50,
  },
  pokemonPosition: {
    top: 20,
  },
  hiddenPokemon: {
    opacity: 0,
  },
  pokemon: {
    width: 80,
    height: 100,
  },
  pokemonInfoRow: {
    top: 45,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  registeredPokemonIcon: {
    width: 16,
    height: 16,
  },
  pokemonName: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
    top: 45
  },
  wildPokemonName: {
    top: 0,
  },
  pokemonTypes: {
    top: 47,
    height: 25
  },
  wildPokemonTypes: {
    top: 0,
  },
  playerName: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  selection: {
    flex: 2.5,
    width: '100%',
    minHeight: 190,
    backgroundColor: '#ebf2f8bb',
    borderTopWidth: 5,
    borderTopColor: '#000000',
  },
  actionLayout: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  captureContent: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballGrid: {
    flex: 1,
    width: '100%',
    gap: 8,
  },
  ballRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  ballSlot: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c6d2de',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  emptyBallSlot: {
    opacity: 0.4,
  },
  ballImage: {
    width: 36,
    height: 36,
  },
  ballName: {
    color: '#172c43',
    fontSize: 12,
    fontWeight: '700',
  },
  ballQuantity: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    color: '#526476',
    fontSize: 11,
    fontWeight: '700',
  },
  captureArea: {
    flex: 1,
    width: "80%",
    maxHeight: 150,
    borderRadius: 20,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#ec5c5c",
  },
  runArea: {
    alignSelf: 'center',
    width: '60%',
    maxWidth: 240,
    minHeight: 48,
    borderRadius: 20,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#aaaaaa",
  },
  areaText: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  runText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },

  messagePanel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 24,
    backgroundColor: '#F8FAFC',
  },
  messageText: {
    flex: 1,
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 26,
    textAlign: "center"
  },
  errorMessageText: {
    color: '#B42318',
  },
  messageButton: {
    minWidth: 72,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  messageButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
