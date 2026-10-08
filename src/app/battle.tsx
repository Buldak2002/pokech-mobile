// src/app/battle.tsx
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image as ExpoImage } from 'expo-image'

import { POKEMON_GEN5_IMAGES } from '../../src/feature/pokedex/pokemonGen5Images'
import { POKEMON_DATA } from '../feature/pokedex/pokemon.data';
import { BIOMES } from '../feature/biome/biome.data';
import { StatusBar } from 'expo-status-bar';

import { appStorage } from "../storage/appStorage";
import { obtainPokemon } from "../feature/user/obtain-pokemon";

import { TrainerThrowAnimation, TrainerThrowAnimationHandle } from '../components/trainer-throw-animation';
import { UserGender } from '../feature/user/user.type';
import Animated, { interpolate, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export default function BattleScreen() {
  const { pokemonId, biomeId } =
    useLocalSearchParams<{
      pokemonId: string;
      biomeId: string;
    }>();

  const pokemon = POKEMON_DATA.find(
    item => item.id === Number(pokemonId),
  );
  const biome = BIOMES.find(
    item => item.id === biomeId,
  );

  const [isCapturing, setIsCapturing] = useState(false);
  const [captureMessage, setCaptureMessage] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const [playerName, setPlayerName] = useState<string | null>(null);
  const [playerGender, setPlayerGender] = useState<UserGender | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<'capture' | 'run' | null>(null);
  const trainerRef = useRef<TrainerThrowAnimationHandle>(null)

  useEffect(() => {

    const loadPlayer = async () => {
      
      const gameSave = await appStorage.loadGame();

      if(!gameSave) {
        throw new Error("게임 저장 데이터를 찾을 수 없습니다.")
      }

      setPlayerName(gameSave.user.name);
      setPlayerGender(gameSave.user.gender);
    }
    
    void loadPlayer().catch((error: unknown) => {
      setCaptureError(
        error instanceof Error ? error.message : '게임 저장 데이터를 불러오지 못했습니다.',
      );
    });
  },[])

  const handleCapture = async () => {
    if(
    !pokemon ||
    isCapturing ||
    captureMessage
    ) {
      return;
    }

    try {
      setIsCapturing(true)
      setCaptureError(null)

      trainerRef.current?.play();

      const gameSave = await appStorage.loadGame();
      if(!gameSave) {
        throw new Error("게임 저장 데이터를 찾을 수 없습니다.")
      }
      const result = obtainPokemon({
        user: gameSave.user,
        speciesId: pokemon.id
      })

      await appStorage.saveGame({
        ...gameSave,
        user: result.user
      })

      if(result.isNew) {
        setCaptureMessage(
          `${pokemon.name} 포획 성공!`
        )
      } else {
        setCaptureMessage(
          `${pokemon.name}의 레벨이 ${result.pokemon.level}로 올랐습니다!`
        )
      }
    } catch(error) {
      setCaptureError(
        error instanceof Error ? error.message : "포켓몬 저장에 실패했습니다."
      )
    } finally {
      setIsCapturing(false)
    }

  }

  const handleBack = () => {
    router.replace('/home')
  }

  const handleRun = () => {
    if (isCapturing || captureMessage || captureError) {
      return;
    }

    setCaptureMessage(`${pokemon?.name ?? '야생 포켓몬'}에게서 무사히 도망쳤다!`)
  }

//animation 부분
  const choice = useSharedValue(0);
  // -1: 포획, 0: 기본, 1: 도망

  const selectChoice = (value: -1 | 0 | 1) => {
    choice.set(
      withSpring(value, {
        duration: 400,
        dampingRatio: 1,
        reduceMotion: ReduceMotion.System,
      }),
    );
  };

  const handleChoicePress = (nextChoice: 'capture' | 'run') => {
    if (isCapturing || captureMessage || captureError) {
      return;
    }

    const choiceValue = nextChoice === 'capture' ? -1 : 1;

    if (selectedChoice !== nextChoice) {
      setSelectedChoice(nextChoice);
      selectChoice(choiceValue);
      return;
    }

    if (nextChoice === 'capture') {
      void handleCapture();
      return;
    }

    handleRun();
  };

  const dismissError = () => {
    setCaptureError(null);
    setSelectedChoice(null);
    selectChoice(0);
  };

  const battleMessage = captureError
    ?? captureMessage
    ?? (isCapturing ? `${playerName ?? '트레이너'}는 몬스터볼을 던졌다!` : null);
  const leftPanelStyle = useAnimatedStyle(() => ({
  transform: [
    { translateX: choice.get() * -44 },
    { skewX: '-12deg' },
  ],
}));

  const captureTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(choice.get(), [-1, 0, 1], [1, 0.82, 0.62]),
    transform: [
      {
        scale: interpolate(choice.get(), [-1, 0, 1], [1.16, 1, 0.92]),
      },
    ],
  }));

  const runTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(choice.get(), [-1, 0, 1], [0.62, 0.82, 1]),
    transform: [
      {
        scale: interpolate(choice.get(), [-1, 0, 1], [0.92, 1, 1.16]),
      },
    ],
  }));

  if (!pokemon || !biome) {
    return (
      <View style={styles.container}>
        <Text>전투 정보를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <StatusBar style="dark" />

      <View style={styles.stage}>
        <View style={styles.encounter}>
          <ExpoImage
            source={biome.background}
            contentFit="contain"
            style={styles.platform}
          />

          <View style={styles.pokemonContainer}>
            <ExpoImage
              source={POKEMON_GEN5_IMAGES[pokemon.id]}
              contentFit="contain"
              style={styles.pokemon}
            />

            <Text style={styles.pokemonName}>
              {pokemon.name}
            </Text>

            <Text style={styles.pokemonTypes}>
              {pokemon.types.join(' · ')}
            </Text>
          </View>
        </View>
      </View>

      <View style={{flexDirection: "row"}}>
          {playerGender === 'male' ? 
            <TrainerThrowAnimation ref={trainerRef} character='lucas-pt'/> :
            <TrainerThrowAnimation ref={trainerRef} character='dawn-pt'/>
          }
          <View style={styles.playerName}>
            <Text style={styles.pokemonName}>{playerName}</Text>
          </View>
      </View>
      
      <View style={styles.selection}>
        {battleMessage ? (
          <Pressable 
            style={styles.messagePanel}
            accessibilityRole="button"
            onPress={captureError ? dismissError : handleBack}
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
          <>
            {/* 오른쪽 배경 위에 왼쪽 종이 조각을 겹침 */}
            <Animated.View
              pointerEvents="none"
              style={[styles.capturePanel, leftPanelStyle]}
            />

            <View style={styles.touchLayer}>
              <Pressable
                accessibilityLabel="포획한다"
                accessibilityRole="button"
                accessibilityState={{ selected: selectedChoice === 'capture' }}
                style={styles.choiceButton}
                onPress={() => handleChoicePress('capture')}
              >
                <Animated.Text style={[styles.choiceText, captureTextStyle]}>
                  포획한다
                </Animated.Text>
              </Pressable>

              <Pressable
                accessibilityLabel="도망친다"
                accessibilityRole="button"
                accessibilityState={{ selected: selectedChoice === 'run' }}
                style={styles.choiceButton}
                onPress={() => handleChoicePress('run')}
              >
                <Animated.Text style={[styles.choiceText2, runTextStyle]}>
                  도망친다
                </Animated.Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "stretch"
  },
  stage: {
    flex: 2,
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
  pokemonContainer: {
    zIndex: 1,
    alignItems: 'center',
    gap: 2,
    paddingBottom: 50,
  },
  pokemon: {
    width: 80,
    height: 100,
    top: 20
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
    top: 38
  },
  playerName: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  selection: {
    position: 'relative',
    flex: 1,
    width: '100%',
    overflow: 'hidden',

    backgroundColor: '#ebf2f8bb',
    borderTopWidth: 5,
    borderTopColor: '#000000',
  },

  capturePanel: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    left: -80,
    right: '50%',
    backgroundColor: '#D9493F',
  },

  touchLayer: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },

  choiceButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  choiceText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  choiceText2: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '900',
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
