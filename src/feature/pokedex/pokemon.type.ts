import type { ImageSourcePropType } from 'react-native';

export type Pokemon = {
  id: number;
  name: string;
  image: ImageSourcePropType;
  types: PokemonType[];
  evolvesFromId: number | null;
  evolutionStage: EvolutionStage;
  hasNextEvolution: boolean;
  isFinalEvolution: boolean;
  captureRate: number;
  isLegendary: boolean;
  isMythical: boolean;
};

export type EvolutionStage = 0 | 1 | 2;

export type PokemonType =
  (typeof POKEMON_TYPES)[number];

export const POKEMON_TYPES = [
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
  'fire',
  'water',
  'grass',
  'electric',
  'psychic',
  'ice',
  'dragon',
  'dark',
  'fairy',
] as const;
