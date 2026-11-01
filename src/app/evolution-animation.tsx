
import { Image, ImageBackground } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { POKEMON_GEN5_IMAGES } from "../feature/pokedex/pokemonGen5Images";
import { POKEMON_DATA } from "../feature/pokedex/pokemon.data";
import { dialogueSteps } from "../feature/user/evolutionSteps";
import { DialogueBox2 } from "../components/dialoue-box2";

const PULSE_EASING = Easing.bezier(0.77, 0, 0.175, 1);
const BURST_EASING = Easing.bezier(0.23, 1, 0.32, 1);

// duration은 축소와 확대 각각에 적용된다. 뒤로 갈수록 계속 빨라진다.
const BEATS = [
  { duration: 430, min: 0.94, max: 1.06 },
  { duration: 410, min: 0.935, max: 1.065 },
  { duration: 390, min: 0.93, max: 1.07 },
  { duration: 370, min: 0.925, max: 1.075 },
  { duration: 350, min: 0.92, max: 1.08 },
  { duration: 330, min: 0.91, max: 1.09 },
  { duration: 310, min: 0.9, max: 1.1 },
  { duration: 290, min: 0.89, max: 1.11 },
  { duration: 270, min: 0.88, max: 1.12 },
  { duration: 250, min: 0.87, max: 1.13 },
  { duration: 230, min: 0.86, max: 1.14 },
  { duration: 210, min: 0.85, max: 1.15 },
  { duration: 190, min: 0.84, max: 1.16 },
  { duration: 160, min: 0.83, max: 1.17 },
  { duration: 130, min: 0.82, max: 1.18 },
];

const FRAMES = [
  ...BEATS.flatMap((beat) => [
    { duration: beat.duration, scale: beat.min },
    { duration: beat.duration, scale: beat.max },
  ]),
  { duration: 200, scale: 1 },
];
const FRAME_POSITIONS = [0, ...FRAMES.map((_, index) => index + 1)];
const SCALE_VALUES = [1, ...FRAMES.map((frame) => frame.scale)];
const PARTICLES = [
  { x: -105, y: -45, size: 7 },
  { x: -78, y: -88, size: 5 },
  { x: -30, y: -110, size: 8 },
  { x: 28, y: -105, size: 5 },
  { x: 88, y: -72, size: 7 },
  { x: 112, y: -12, size: 5 },
  { x: 95, y: 62, size: 8 },
  { x: 38, y: 106, size: 5 },
  { x: -24, y: 108, size: 7 },
  { x: -85, y: 72, size: 5 },
  { x: -115, y: 10, size: 6 },
];

function EvolutionParticle({
  burst,
  x,
  y,
  size,
}: {
  burst: SharedValue<number>;
  x: number;
  y: number;
  size: number;
}) {
  const particleStyle = useAnimatedStyle(() => {
    const progress = burst.get();
    return {
      opacity: interpolate(progress, [0, 0.12, 1], [0, 1, 0]),
      transform: [
        { translateX: x * progress },
        { translateY: y * progress },
        { scale: interpolate(progress, [0, 1], [0.6, 1.2]) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.particle, { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }, particleStyle]}
    />
  );
}

export default function EvolutionAnimation() {
  const { fromSpeciesId, toSpeciesId } = useLocalSearchParams<{
    fromSpeciesId: string;
    toSpeciesId: string;
  }>();
  const beforeId = Number(fromSpeciesId);
  const afterId = Number(toSpeciesId);
  const beforeName = POKEMON_DATA.find((pokemon) => pokemon.id === beforeId)?.name ?? "포켓몬";
  const afterName = POKEMON_DATA.find((pokemon) => pokemon.id === afterId)?.name ?? "포켓몬";
  const reduceMotion = useReducedMotion();
  const [aniFinished, setAniFinished] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const frame = useSharedValue(0);
  const burst = useSharedValue(0);

  const [stepIndex, setStepIndex] = useState(0);
  const handleDialoguePress = () => {
    if (stepIndex === 0) {
      if (reduceMotion) setAniFinished(true);
      setStepIndex(reduceMotion ? 2 : 1);
    } else if (stepIndex === 2) {
      router.replace("/(tabs)/home");
    }
  };
  const dialogueMessage = dialogueSteps[stepIndex]?.message || (
    stepIndex === 0
      ? `오잉..? ${beforeName}의 모습이..!`
      : stepIndex === 1
        ? `오잉..? ${beforeName}의 모습이..!`
        : `${beforeName}은 ${afterName}로 진화했다!`
  );

  const pokemonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(frame.get(), FRAME_POSITIONS, SCALE_VALUES) }],
  }));
  const originalStyle = useAnimatedStyle(() => ({
    opacity: Math.floor(frame.get()) >= FRAMES.length - 1 || Math.floor(frame.get()) % 2 === 0 ? 1 : 0,
  }));
  const silhouetteStyle = useAnimatedStyle(() => ({
    opacity: Math.floor(frame.get()) < FRAMES.length - 1 && Math.floor(frame.get()) % 2 === 1 ? 1 : 0,
  }));

  const finishAnimation = useCallback(() => {
    setAniFinished(true);
    setStepIndex(2);
    burst.set(withTiming(1, { duration: 850, easing: BURST_EASING }));
  }, [burst]);

  useEffect(() => {
    if (reduceMotion || stepIndex !== 1) return;

    frame.set(
      withSequence(
        ...FRAMES.slice(0, -1).map((step, index) =>
          withTiming(index + 1, { duration: step.duration, easing: PULSE_EASING }),
        ),
        withTiming(
          FRAMES.length,
          { duration: FRAMES[FRAMES.length - 1].duration, easing: PULSE_EASING },
          (finished) => {
            "worklet";
            if (finished) scheduleOnRN(finishAnimation);
          },
        ),
      ),
    );

    return () => {
      cancelAnimation(frame);
    };
  }, [reduceMotion, stepIndex, replayCount, frame, burst, finishAnimation]);

  const skipEvolution = () => {
    if (aniFinished || stepIndex !== 1) return;
    cancelAnimation(frame);
    frame.set(FRAMES.length);
    finishAnimation();
  };

  return (
    <ImageBackground
      source={require("../../assets/images/platinum-intro/platinum-intro-background-portrait.png")}
      contentFit="cover"
      style={styles.background}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.pokemonFrame, pokemonStyle]}>
          <Animated.View style={[styles.imageLayer, originalStyle]}>
            <Image
              source={POKEMON_GEN5_IMAGES[aniFinished ? afterId : beforeId]}
              contentFit="contain"
              transition={aniFinished ? 500 : 0}
              style={styles.layerImage}
            />
          </Animated.View>
          {!aniFinished && (
            <Animated.View pointerEvents="none" style={[styles.silhouetteLayer, silhouetteStyle]}>
              <Image
                source={POKEMON_GEN5_IMAGES[afterId]}
                contentFit="contain"
                tintColor="#FFFFFF"
                style={styles.silhouetteImage}
              />
            </Animated.View>
          )}
          {!reduceMotion && PARTICLES.map((particle, index) => (
            <EvolutionParticle key={index} burst={burst} {...particle} />
          ))}
        </Animated.View>
        <DialogueBox2
          dialogueId={stepIndex}
          message={dialogueMessage}
          onNext={handleDialoguePress}
          onSkip={stepIndex === 1 ? skipEvolution : undefined}
          canTapNext={stepIndex !== 1}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    bottom: 50,
    paddingHorizontal: 10,
  },
  pokemonFrame: {
    width: "70%",
    maxWidth: 180,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pokemon: {
    width: "50%",
    height: "50%",
  },
  imageLayer: {
    width: "70%",
    height: "70%",
  },
  layerImage: {
    width: "100%",
    height: "100%",
  },
  silhouetteLayer: {
    position: "absolute",
    top: "25%",
    left: "25%",
    width: "50%",
    height: "50%",
  },
  silhouetteImage: {
    width: "100%",
    height: "100%",
  },
  particle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    borderRadius: 100,
    backgroundColor: "#FFFFFF",
  },
  replayButton: {
    position: "absolute",
    bottom: 72,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#1B1B1B",
    backgroundColor: "#E84A4A",
  },
  replayButtonPressed: {
    opacity: 0.75,
  },
  replayButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  caption: {
    marginTop: 24,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    textShadowColor: "#000000",
    textShadowRadius: 5,
    textShadowOffset: { width: 0, height: 2 },
  },
});
