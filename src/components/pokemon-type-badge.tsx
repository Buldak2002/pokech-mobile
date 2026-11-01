import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { POKEMON_TYPE_STYLES } from '../feature/pokedex/pokemon-type-style';
import type { PokemonType } from '../feature/pokedex/pokemon.type';

type PokemonTypeBadgeSize = 'small' | 'medium';

type PokemonTypeBadgeProps = {
  type: PokemonType;
  size?: PokemonTypeBadgeSize;
};

type PokemonTypeBadgeListProps = {
  types: readonly PokemonType[];
  size?: PokemonTypeBadgeSize;
  style?: StyleProp<ViewStyle>;
};

export function PokemonTypeBadge({
  type,
  size = 'small',
}: PokemonTypeBadgeProps) {
  const typeStyle = POKEMON_TYPE_STYLES[type];

  return (
    <View
      accessibilityLabel={`${typeStyle.label} 타입`}
      style={[
        styles.badge,
        size === 'medium' ? styles.mediumBadge : styles.smallBadge,
        {
          backgroundColor: typeStyle.backgroundColor,
          borderColor: typeStyle.borderColor,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          size === 'medium' ? styles.mediumLabel : styles.smallLabel,
          { color: typeStyle.textColor },
        ]}
      >
        {typeStyle.label}
      </Text>
    </View>
  );
}

export function PokemonTypeBadgeList({
  types,
  size = 'small',
  style,
}: PokemonTypeBadgeListProps) {
  return (
    <View style={[styles.list, style]}>
      {types.map((type) => (
        <PokemonTypeBadge key={type} type={type} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
  },
  smallBadge: {
    minWidth: 42,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  mediumBadge: {
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    fontWeight: '800',
  },
  smallLabel: {
    fontSize: 11,
  },
  mediumLabel: {
    fontSize: 13,
  },
});
