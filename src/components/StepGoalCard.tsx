import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SelectPokemon } from './selectpokemon';
import type {
  OwnedPokemon,
  PokemonInstanceId,
} from '../feature/user/user.type';
import { POKEMON_GEN5_IMAGES } from '../feature/pokedex/pokemonGen5Images';

type StepGoalCardProps = {
  count: number;
  goal: number;
  started: boolean;
  travelPokemon: OwnedPokemon | null;
  assignedPokemonIds: PokemonInstanceId[];
  onStart: (pokemonId: PokemonInstanceId) => Promise<void>;
  onComplete: () => Promise<void> | void;
};

export function StepGoalCard({
  count,
  goal,
  started,
  travelPokemon,
  assignedPokemonIds,
  onStart,
  onComplete,
}: StepGoalCardProps) {

  const isGoalReached = started && count >= goal;
  const isSearching = started && !isGoalReached;

  const [isSelectPokemonOpen, setIsSelectPokemonOpen] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsSelectPokemonOpen(false);
  }, []);

  const handlePokemonConfirm = async (
    pokemonId: PokemonInstanceId,
  ) => {
    try {
      await onStart(pokemonId);
      setIsSelectPokemonOpen(false);
    } catch (error) {
      Alert.alert(
        '탐험을 시작하지 못했습니다.',
        error instanceof Error
          ? error.message
          : '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  //함수
  const handlePress = () => {
    if (!started) {
      setIsSelectPokemonOpen(true);
      return;
    }

    if (isGoalReached) {
      void onComplete();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.steps}>
        {count} / {goal}
      </Text>
      
      <View style={styles.myPokemonSelectBoxLayout}>
        <View style={styles.myPokemonSelectBox}>
          {travelPokemon ? (
            <Image
              source={POKEMON_GEN5_IMAGES[travelPokemon.speciesId]}
              contentFit="contain"
              style={styles.travelPokemonImage}
            />
          ) : (
            <Text style={styles.emptyPokemonText}>?</Text>
          )}
        </View>
      </View>

      <View style={styles.buttonLayout}>
        <Pressable
          disabled={isSearching}
          onPress={handlePress}
          style={({ pressed }) => [
            styles.button,
            isSearching && styles.disabledButton,
            pressed && !isSearching && styles.pressedButton,
          ]}
        >
          <Text style={styles.buttonText}>
            {!started
              ? '포켓몬 찾기'
              : isGoalReached
                ? '포획하기'
                : '포켓몬 찾는 중...'}
          </Text>
        </Pressable>

        <SelectPokemon
          isPresented={isSelectPokemonOpen}
          onDismiss={handleDismiss}
          assignedPokemonIds={assignedPokemonIds}
          onConfirm={(pokemonId) => {
            void handlePokemonConfirm(pokemonId);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    alignItems: 'center',
    gap: 8,
    bottom: 50
  },
  steps: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '700',
  },
  buttonLayout: {
    flexDirection: "row",
    width: 250,
    height: 60,
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#d4dddd',
    boxShadow:
      '0 0 4px rgba(0, 0, 0, 0.12), 0 5px 10px rgba(0, 0, 0, 0.16)',
  },

  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#ef4444',
    borderRadius: 999,
  },
  disabledButton: {
    opacity: 0.4,
  },
  pressedButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  myPokemonSelectBoxLayout: {
    width: 100,
    height: 100,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#d4dddd',
    boxShadow:
      '0 0 4px rgba(0, 0, 0, 0.12), 0 5px 10px rgba(0, 0, 0, 0.16)',

    top: 15,
    zIndex: 1,
  },

  myPokemonSelectBox: {
    width: 85,
    height: 85,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(255, 255, 255)',
    borderRadius: 42.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  travelPokemonImage: {
    width: 78,
    height: 78,
  },
  emptyPokemonText: {
    color: '#94a3b8',
    fontSize: 32,
    fontWeight: '800',
  },
});
