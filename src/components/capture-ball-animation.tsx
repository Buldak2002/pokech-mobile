import { Image } from 'expo-image';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { type ImageStyle, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { BallName } from '../feature/items/item.type';

type Point = { x: number; y: number };

export type CaptureBallAnimationHandle = {
  play: (
    ballId: BallName,
    start: Point,
    target: Point,
    landing: Point,
    captured: boolean,
    onHit: () => void,
  ) => Promise<void>;
  reset: () => void;
};

const SPRITE_SIZE = 64;
const SPRITE_SCALE = SPRITE_SIZE / 190;
const SHEET_WIDTH = 770 * SPRITE_SCALE;
const SHEET_HEIGHT = 2041 * SPRITE_SCALE;
const COLUMN_ORIGINS: Record<BallName, number> = {
  'master-ball': 0,
  'ultra-ball': 190,
  'great-ball': 382,
  'poke-ball': 572,
};
const ROW_ORIGINS = [0, 193, 375, 557, 739, 921, 1106, 1287, 1474, 1651, 1826];

const MOVE_EASING = Easing.bezier(0.77, 0, 0.175, 1);
const WAIT_EASING = Easing.linear;
const webPixelatedStyle = Platform.OS === 'web'
  ? ({ imageRendering: 'pixelated' } as unknown as ImageStyle)
  : undefined;

function wait(duration: number) {
  return new Promise<void>(resolve => setTimeout(resolve, duration));
}

export const CaptureBallAnimation = forwardRef<CaptureBallAnimationHandle>(
  function CaptureBallAnimation(_props, forwardedRef) {
    const [ballId, setBallId] = useState<BallName | null>(null);
    const [row, setRow] = useState(0);
    const operationRef = useRef(0);
    const reducedMotion = useReducedMotion();

    const startX = useSharedValue(0);
    const startY = useSharedValue(0);
    const targetX = useSharedValue(0);
    const targetY = useSharedValue(0);
    const landingX = useSharedValue(0);
    const landingY = useSharedValue(0);
    const flight = useSharedValue(0);
    const drop = useSharedValue(0);
    const shake = useSharedValue(0);
    const opacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
      const progress = flight.get();
      const landingProgress = drop.get();
      const arc = reducedMotion ? 0 : Math.sin(Math.PI * progress) * 48;
      const scale = reducedMotion ? 0.72 : 1.08 - progress * 0.34 - landingProgress * 0.12;

      return {
        opacity: opacity.get(),
        transform: [
          {
            translateX:
              startX.get() + (targetX.get() - startX.get()) * progress
              + (landingX.get() - targetX.get()) * landingProgress
              + shake.get() * 7,
          },
          {
            translateY:
              startY.get() + (targetY.get() - startY.get()) * progress
              - arc + (landingY.get() - targetY.get()) * landingProgress,
          },
          { rotateZ: `${shake.get() * 12}deg` },
          { scale },
        ],
      };
    });

    const reset = useCallback(() => {
      operationRef.current += 1;
      cancelAnimation(flight);
      cancelAnimation(drop);
      cancelAnimation(shake);
      cancelAnimation(opacity);
      setBallId(null);
    }, [drop, flight, opacity, shake]);

    const play = useCallback(
      async (
        nextBallId: BallName,
        start: Point,
        target: Point,
        landing: Point,
        captured: boolean,
        onHit: () => void,
      ) => {
        const operation = operationRef.current + 1;
        operationRef.current = operation;
        startX.set(start.x - SPRITE_SIZE / 2);
        startY.set(start.y - SPRITE_SIZE / 2);
        targetX.set(target.x - SPRITE_SIZE / 2);
        targetY.set(target.y - SPRITE_SIZE / 2);
        landingX.set(landing.x - SPRITE_SIZE / 2);
        landingY.set(landing.y - SPRITE_SIZE / 2);
        flight.set(0);
        drop.set(0);
        shake.set(0);
        opacity.set(1);
        setRow(0);
        setBallId(nextBallId);

        // Let the sprite mount before the UI-thread flight starts.
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        if (operation !== operationRef.current) return;

        await new Promise<void>(resolve => {
          flight.set(withTiming(1, {
            duration: reducedMotion ? 150 : 500,
            easing: MOVE_EASING,
            reduceMotion: ReduceMotion.System,
          }, () => scheduleOnRN(resolve)));
        });
        if (operation !== operationRef.current) return;

        onHit();
        setRow(1);
        await wait(reducedMotion ? 80 : 160);
        if (operation !== operationRef.current) return;
        setRow(0);

        await new Promise<void>(resolve => {
          drop.set(withTiming(1, {
            duration: reducedMotion ? 100 : 240,
            easing: MOVE_EASING,
            reduceMotion: ReduceMotion.System,
          }, () => scheduleOnRN(resolve)));
        });
        if (operation !== operationRef.current) return;

        if (!reducedMotion) {
          await new Promise<void>(resolve => {
            shake.set(withRepeat(withSequence(
              withTiming(-1, { duration: 110, easing: WAIT_EASING }),
              withTiming(1, { duration: 220, easing: WAIT_EASING }),
              withTiming(0, { duration: 110, easing: WAIT_EASING }),
            ), 3, false, () => scheduleOnRN(resolve)));
          });
        }
        if (operation !== operationRef.current) return;

        if (!captured) {
          setRow(1);
          await wait(reducedMotion ? 80 : 220);
        } else {
          await wait(reducedMotion ? 80 : 260);
        }
        if (operation !== operationRef.current) return;

        await new Promise<void>(resolve => {
          opacity.set(withTiming(0, {
            duration: 150,
            reduceMotion: ReduceMotion.System,
          }, () => scheduleOnRN(resolve)));
        });
        if (operation === operationRef.current) setBallId(null);
      },
      [drop, flight, landingX, landingY, opacity, reducedMotion, shake, startX, startY, targetX, targetY],
    );

    useImperativeHandle(forwardedRef, () => ({ play, reset }), [play, reset]);

    if (!ballId) return null;

    return (
      <Animated.View pointerEvents="none" style={[styles.ball, animatedStyle]}>
        <View style={styles.spriteViewport}>
          <Image
            source={require('../../assets/items/capture-balls-sprite.png')}
            contentFit="fill"
            allowDownscaling={false}
            style={[
              styles.spriteSheet,
              {
                left: -COLUMN_ORIGINS[ballId] * SPRITE_SCALE,
                top: -ROW_ORIGINS[row] * SPRITE_SCALE,
              },
              webPixelatedStyle,
            ]}
          />
        </View>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  ball: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    zIndex: 20,
  },
  spriteViewport: {
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    overflow: 'hidden',
  },
  spriteSheet: {
    position: 'absolute',
    width: SHEET_WIDTH,
    height: SHEET_HEIGHT,
  },
});
