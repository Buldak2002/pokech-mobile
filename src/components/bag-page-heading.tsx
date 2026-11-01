import { StyleSheet, Text, View } from 'react-native';

type BagPageHeadingProps = {
  title: string;
  subtitle?: string;
};

export function BagPageHeading({ title, subtitle }: BagPageHeadingProps) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4, paddingBottom: 16 },
  title: { color: '#111827', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#657481', fontSize: 14 },
});
