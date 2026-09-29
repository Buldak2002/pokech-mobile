import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type StepGoalCardProps = {
  count: number;
  goal: number;
  onComplete: () => void;
};

export function StepGoalCard({
  count,
  goal,
  onComplete,
}: StepGoalCardProps) {
  const isGoalReached = count >= goal;

  return (
    <View style={styles.container}>
      <Text style={styles.steps}>
        {count} / {goal}
      </Text>

      <Pressable
        disabled={!isGoalReached}
        onPress={onComplete}
        style={({ pressed }) => [
          styles.button,
          !isGoalReached &&
            styles.disabledButton,
          pressed &&
            isGoalReached &&
            styles.pressedButton,
        ]}
      >
        <Text style={styles.buttonText}>
          포켓몬 찾기
        </Text>
      </Pressable>
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
    fontSize: 16,
    fontWeight: '700',
  },
  button: {
    minWidth: 160,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: '#ef4444',
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
});