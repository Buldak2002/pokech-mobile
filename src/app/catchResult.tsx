import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { POKEMON_DATA } from '../feature/pokedex/pokemon.data';
import { StatusBar } from 'expo-status-bar';
import { POKEMON_GEN5_IMAGES } from '../feature/pokedex/pokemonGen5Images';
import { EmptyPokeball } from '../components/empty-pokeball';
import Animated, { FadeIn, Keyframe, ReduceMotion } from 'react-native-reanimated';

const CAPTURED_BALL_SIZE = 270;
const titleEnter = new Keyframe({
  0: { transform: [{ scale: 0.9 }] },
  45: { transform: [{ scale: 1.22 }] },
  100: { transform: [{ scale: 1 }] },
}).duration(1300).reduceMotion(ReduceMotion.System);
const capturedEnter = FadeIn.duration(450)
  .delay(900)
  .reduceMotion(ReduceMotion.System);
const pokemonEnter = FadeIn.duration(650)
  .delay(1150)
  .reduceMotion(ReduceMotion.System);
const travelerEnter = FadeIn.duration(500)
  .delay(1800)
  .reduceMotion(ReduceMotion.System);
const ExitResult = FadeIn.duration(500)
  .delay(2300)
  .reduceMotion(ReduceMotion.System);

const levelUpText = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 24}]},
  20: { opacity: 1, transform: [{ translateY: 0}]},
  60: { opacity: 1, transform: [{ translateY: -48}]},
  100: { opacity: 1, transform: [{ translateY: -100}]},
      
})
  .duration(850)
  .delay(2650)
  .reduceMotion(ReduceMotion.System)

export default function CatchResultScreen() {
  const {
    capturedSpeciesId,
    capturedLevel,
    leveledSpeciesId,
    leveledLevel,
    isNew,
  } = useLocalSearchParams<{
    capturedSpeciesId: string;
    capturedLevel: string;
    leveledSpeciesId: string;
    leveledLevel: string;
    isNew: string;
  }>();

  //이름 가져오기
  const capturedPokemon = POKEMON_DATA.find(
    item => item.id === Number(capturedSpeciesId),
  );
  const leveledPokemon = POKEMON_DATA.find(
    item => item.id === Number(leveledSpeciesId),
  );
  //이미지
  const capturedImage = capturedPokemon
    ? POKEMON_GEN5_IMAGES[capturedPokemon.id]
    : undefined;
  const leveldPokemon = leveledPokemon
    ? POKEMON_GEN5_IMAGES[leveledPokemon.id]
    : undefined;

  return (
    <SafeAreaView style={styles.container}>

      <StatusBar style="dark" />
      
      <View
        style={styles.content}
      >
        <View style={styles.result}>
          <View style={styles.titleGroup}>
            <Animated.View entering={titleEnter}>
              <Text style={styles.title}>포획 성공!</Text>
            </Animated.View>
            <Text style={styles.subtitle}>
              {isNew === 'true'
                ? '도감에 새롭게 등록되었어요!'
                : '새로운 개체를 포획했어요!'}
            </Text>
          </View>

          <Animated.View 
            entering={capturedEnter}
            style={styles.pokemonRow}
          >
            {capturedImage && (
              <View style={styles.capturedArtwork}>
                <View style={styles.pokeballBackground}>
                  <EmptyPokeball
                    size={CAPTURED_BALL_SIZE}
                    strokeWidth={12}
                    color="#e7eef3"
                    backgroundColor="#ffffff"
                  />
                </View>
                <Animated.View entering={pokemonEnter} style={styles.pokemonImage}>
                  <Image
                    source={capturedImage}
                    contentFit="contain"
                    style={styles.pokemonImage}
                  />
                </Animated.View>

                <View style={{top: 40}}>
                  <Text style={styles.pokemonName}>
                    {capturedPokemon?.name ?? '포켓몬'} · Lv. {capturedLevel}
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>

          <Animated.View 
            entering={travelerEnter}
            style={styles.leveldUpRow}
          >
            { leveldPokemon && (
              <Image
                source={leveldPokemon}
                contentFit='contain'
                style={[styles.pokemonImage, {width: 80, height: 80}]}
              >

              </Image>
            )}
            <Text style={styles.rowLabel}>탐험 포켓몬</Text>
            <Text style={[styles.pokemonName, {fontSize: 18}]}>
              {leveledPokemon?.name ?? '포켓몬'} · Lv. {leveledLevel}
            </Text>

            <Animated.View
              entering={levelUpText}
              style={styles.levelUpFloat}
            >
              <Text style={styles.levelUpText}>Level Up!</Text>
            </Animated.View>
          </Animated.View>
        </View>
        
        <Animated.View
          entering={ExitResult}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="결과 확인하고 홈으로 돌아가기"
            onPress={() => router.replace('/home')}
            style={styles.resultBottom}
          >
            <Text style={{fontWeight: "700", color:"white", fontSize: 20}}>완료</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafb',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 32,
    padding: 20,
  },
  result: {
    gap: 12,
    paddingTop: 28,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    color: '#000000',
    fontSize: 40,
    fontWeight: '700',
  },
  titleGroup: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    color: '#70808e',
    fontSize: 16,
    fontWeight: '700',
    paddingBottom: 12,
  },
  pokemonRow: {
    gap: 5,
    top: 30,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5ebef',
    width: 250,
    height: 250,
    borderRadius: 175,
    borderCurve: 'continuous',
    backgroundColor: '#ffffff',
    alignItems: "center",
    justifyContent: 'center'
  },
  leveldUpRow: {
    paddingTop: 80,
    gap: 5,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: 'center'
  },
  pokemonImage: {
    width: 120,
    height: 120,
  },
  capturedArtwork: {
    width: CAPTURED_BALL_SIZE,
    height: CAPTURED_BALL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pokeballBackground: {
    position: 'absolute',
  },
  rowLabel: {
    color: '#7b8995',
    fontSize: 12,
    fontWeight: '700',
  },
  pokemonName: {
    color: '#172c43',
    fontSize: 20,
    fontWeight: '700',
  },
  resultBottom: {
    width: 200,
    height: 75,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: 'center',
    backgroundColor: '#e75050',
    boxShadow:
      '0 0 4px rgba(0, 0, 0, 0.12), 0 5px 10px rgba(0, 0, 0, 0.16)',
    marginBottom: 20,
    alignSelf: 'center'
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  levelUpText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: '#aa270f',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  levelUpFloat: {
    position: 'absolute',
    bottom: 35,
    alignSelf: "center",
    pointerEvents: "none",
    opacity: 1
  }
});
