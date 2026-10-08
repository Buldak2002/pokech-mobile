import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SelectPokemon } from './selectpokemon';

type StepGoalCardProps = {
  count: number;
  goal: number;
  started: boolean;
  onStart: () => void;
  onComplete: () => void;
};

export function StepGoalCard({
  count,
  goal,
  started,
  onStart,
  onComplete,
}: StepGoalCardProps) {

  const isGoalReached = started && count >= goal;
  const isSearching = started && !isGoalReached;

  const [isSelectPokemonOpen, setIsSelectPokemonOpen] = useState(false);

  //함수
  const handlePress = () => {
    if (!started) {
      setIsSelectPokemonOpen(true);
      return;
    }

    if (isGoalReached) {
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.steps}>
        {count} / {goal}
      </Text>

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
        <View style={styles.myPokemonSelectBox}>

        </View>

        <SelectPokemon
          isPresented={isSelectPokemonOpen}
          onDismiss={() => setIsSelectPokemonOpen(false)}
          find={() => {
            onStart();
            setIsSelectPokemonOpen(false)
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#edf3f3',
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
  myPokemonSelectBox: {
    alignSelf: 'stretch',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d4dddd',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.16)',
  },
});
