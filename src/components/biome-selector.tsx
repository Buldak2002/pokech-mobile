import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import type {
  Biome,
  BiomeId,
} from '../feature/biome/biome.type';

type BiomeSelectorProps = {
  biomes: readonly Biome[];
  selectedBiomeId: BiomeId;
  onSelect: (biome: Biome) => void;
};

export function BiomeSelector({
  biomes,
  selectedBiomeId,
  onSelect,
}: BiomeSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {biomes.map((biome) => {
        const isSelected =
          biome.id === selectedBiomeId;

        return (
          <Pressable
            key={biome.id}
            accessibilityRole="button"
            accessibilityState={{
              selected: isSelected,
            }}
            onPress={() => onSelect(biome)}
            style={[
              styles.card,
              isSelected && styles.selectedCard,
            ]}
          >
            <Text
              style={[
                styles.name,
                isSelected && styles.selectedName,
              ]}
            >
              {biome.name}
            </Text>

            <Text
              numberOfLines={2}
              style={styles.description}
            >
              {biome.description}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingHorizontal: 20,
  },
  card: {
    width: 140,
    minHeight: 90,
    gap: 6,
    padding: 14,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 18,
    backgroundColor: '#ffffff',
  },
  selectedCard: {
    borderColor: '#ef4444',
    backgroundColor: '#fff7ed',
  },
  name: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
  selectedName: {
    color: '#dc2626',
  },
  description: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 17,
  },
});