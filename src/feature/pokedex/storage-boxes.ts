import type { PokemonType } from './pokemon.type';
import type { PokemonParty } from '../user/user.type';
import { BOX_WALLPAPERS } from './box-wallpapers';

export const STORAGE_BOXES = [
  { id: 'grass', name: '초원', color: '#409966', ...BOX_WALLPAPERS.grass },
  { id: 'water', name: '바다', color: '#348ec5', ...BOX_WALLPAPERS.water },
  { id: 'sand', name: '사막', color: '#ad8b38', ...BOX_WALLPAPERS.sand },
  { id: 'ice', name: '설원', color: '#69aabf', ...BOX_WALLPAPERS.ice },
  { id: 'fire', name: '화산', color: '#c26b5e', ...BOX_WALLPAPERS.fire },
  { id: 'cave', name: '동굴', color: '#88779c', ...BOX_WALLPAPERS.cave },
] as const;

export type StorageBiome = (typeof STORAGE_BOXES)[number]['id'];

const TYPE_BIOME: Record<PokemonType, StorageBiome> = {
  normal: 'grass',
  grass: 'grass',
  bug: 'grass',
  flying: 'grass',
  fairy: 'grass',
  water: 'water',
  ice: 'ice',
  fire: 'fire',
  electric: 'sand',
  ground: 'sand',
  fighting: 'sand',
  dragon: 'sand',
  rock: 'cave',
  steel: 'cave',
  ghost: 'cave',
  dark: 'cave',
  psychic: 'cave',
  poison: 'cave',
};

export function getStorageBiome(types: readonly PokemonType[]): StorageBiome {
  return TYPE_BIOME[types[0]] ?? 'grass';
}

// Moving an existing member swaps slots; a boxed Pokémon replaces one slot.
// The outgoing member stays in ownedPokemon, so it returns to storage automatically.
export function placeInParty(
  party: PokemonParty,
  instanceId: string,
  slot: number,
): PokemonParty {
  if (!Number.isInteger(slot) || slot < 0 || slot >= 6)
    throw new Error('올바른 엔트리 칸을 선택해 주세요.');
  const next = [...party] as PokemonParty;
  const previousSlot = next.indexOf(instanceId);
  if (previousSlot >= 0) next[previousSlot] = next[slot];
  next[slot] = instanceId;
  return next;
}
