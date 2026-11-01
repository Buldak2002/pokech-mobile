import type { ImageSourcePropType } from 'react-native';

import type { PokemonType } from '../pokedex/pokemon.type';

export const BIOME_IDS = [
  'grass',
  'city',
  'water',
  'sand',
  'ice',
  'cave'
] as const;

export type BiomeId = (typeof BIOME_IDS)[number];

export type Biome = {
  id: BiomeId;
  name: string;
  description: string;
  stepGoal: number;
  typeNames: PokemonType[];
  typeWeights: Partial<Record<PokemonType, number>>;
  background: ImageSourcePropType;
  cardBackground: ImageSourcePropType;
  includePokemonIds: number[];
  excludePokemonIds: number[];
};
