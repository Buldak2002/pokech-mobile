import { Button, Host } from '@expo/ui';
import { Image } from 'expo-image';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  type ImageStyle,
  Platform,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

export type TrainerThrowCharacter = 'lucas-pt' | 'dawn-pt';

export type TrainerThrowAnimationHandle = {
  play: () => void;
  stop: () => void;
  reset: () => void;
};

type TrainerThrowAnimationProps = {
  character: TrainerThrowCharacter;
  size?: number;
};

type TrainerThrowControlProps = TrainerThrowAnimationProps & {
  buttonLabel?: string;
};

const TRAINER_ASSETS = {
  'lucas-pt': {
    animation: require('../../assets/images/trainer-throw/lucas-pt-throw.png'),
    idle: require('../../assets/images/trainer-throw/lucas-pt-idle.png'),
    name: 'Lucas Pt',
  },
  'dawn-pt': {
    animation: require('../../assets/images/trainer-throw/dawn-pt-throw.png'),
    idle: require('../../assets/images/trainer-throw/dawn-pt-idle.png'),
    name: 'Dawn Pt',
  },
} as const;

const webPixelatedStyle = Platform.OS === 'web'
  ? ({ imageRendering: 'pixelated' } as unknown as ImageStyle)
  : undefined;

export const TrainerThrowAnimation = forwardRef<
  TrainerThrowAnimationHandle,
  TrainerThrowAnimationProps
>(function TrainerThrowAnimation(
  { character, size = 240 },
  forwardedRef,
) {
  const imageRef = useRef<Image | null>(null);
  const operationRef = useRef(0);
  const pendingNativePlayRef = useRef<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [webIsPlaying, setWebIsPlaying] = useState(false);
  const assets = TRAINER_ASSETS[character];

  const remountAfterNativeStop = useCallback(
    (operation: number, shouldPlay: boolean) => {
      const stopPromise = imageRef.current?.stopAnimating();

      void Promise.resolve(stopPromise)
        .catch(() => undefined)
        .then(() => {
          if (operationRef.current !== operation) {
            return;
          }

          pendingNativePlayRef.current = shouldPlay ? operation : null;
          setRevision((value) => value + 1);
        });
    },
    [],
  );

  const play = useCallback(() => {
    const operation = operationRef.current + 1;
    operationRef.current = operation;

    if (Platform.OS === 'web') {
      setWebIsPlaying(true);
      setRevision((value) => value + 1);
      return;
    }

    remountAfterNativeStop(operation, true);
  }, [remountAfterNativeStop]);

  const stop = useCallback(() => {
    operationRef.current += 1;
    pendingNativePlayRef.current = null;

    if (Platform.OS === 'web') {
      setWebIsPlaying(false);
      setRevision((value) => value + 1);
      return;
    }

    void imageRef.current?.stopAnimating().catch(() => undefined);
  }, []);

  const reset = useCallback(() => {
    const operation = operationRef.current + 1;
    operationRef.current = operation;
    pendingNativePlayRef.current = null;

    if (Platform.OS === 'web') {
      setWebIsPlaying(false);
      setRevision((value) => value + 1);
      return;
    }

    remountAfterNativeStop(operation, false);
  }, [remountAfterNativeStop]);

  useImperativeHandle(
    forwardedRef,
    () => ({ play, stop, reset }),
    [play, reset, stop],
  );

  const handleLoad = useCallback(() => {
    if (Platform.OS === 'web' || pendingNativePlayRef.current === null) {
      return;
    }

    pendingNativePlayRef.current = null;
    void imageRef.current?.startAnimating().catch(() => undefined);
  }, []);

  const source = Platform.OS === 'web' && !webIsPlaying
    ? assets.idle
    : assets.animation;

  return (
    <Image
      key={`${character}-${revision}`}
      ref={imageRef}
      source={source}
      autoplay={Platform.OS === 'web' ? undefined : false}
      alt={`${assets.name} throwing animation`}
      allowDownscaling={false}
      cachePolicy="none"
      contentFit="fill"
      onLoad={handleLoad}
      style={[
        { width: size, height: size },
        webPixelatedStyle,
      ]}
      transition={0}
    />
  );
});

export function TrainerThrowControl({
  character,
  size = 240,
  buttonLabel,
}: TrainerThrowControlProps) {
  const animationRef = useRef<TrainerThrowAnimationHandle>(null);
  const assets = TRAINER_ASSETS[character];
  const buttonWidth = Math.min(size, 240);

  return (
    <View style={controlStyles.container}>
      <Text selectable style={controlStyles.label}>
        {assets.name}
      </Text>
      <TrainerThrowAnimation
        ref={animationRef}
        character={character}
        size={size}
      />
      <Host
        matchContents
        style={{ width: buttonWidth } as ViewStyle}
      >
        <Button
          label={buttonLabel ?? `${assets.name} 투척 재생`}
          onPress={() => animationRef.current?.play()}
          variant="filled"
        />
      </Host>
    </View>
  );
}

const controlStyles = {
  container: {
    alignItems: 'center',
    gap: 12,
  } satisfies ViewStyle,
  label: {
    color: '#17211A',
    fontSize: 18,
    fontWeight: '800',
  } satisfies TextStyle,
};
