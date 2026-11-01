import { StyleSheet, View } from 'react-native';

type EmptyPokeballProps = {
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
};

export function EmptyPokeball({
  size = 26,
  strokeWidth = 4,
  color = '#cdd7df',
  backgroundColor = '#edf2f7',
}: EmptyPokeballProps) {
  const centerSize = Math.round(size * 9 / 26);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.ball,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
        },
      ]}
    >
      <View
        style={[
          styles.line,
          {
            width: size - strokeWidth * 0.75,
            height: Math.max(3, strokeWidth - 1),
            backgroundColor: color,
          },
        ]}
      />
      <View
        style={{
          width: centerSize,
          height: centerSize,
          borderRadius: centerSize / 2,
          borderWidth: Math.max(2, Math.round(strokeWidth * 5 / 6)),
          borderColor: color,
          backgroundColor,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ball: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    position: 'absolute',
  },
});
