import type { BiomeId } from '../biome/biome.type';
import type { PokemonEncounter } from '../encounter/encounter.type';
import type { PokemonInstanceId } from '../user/user.type';

export type ActiveBattle = {
  id: string;
  biomeId: BiomeId;
  travelPokemonId: PokemonInstanceId;
  encounter: PokemonEncounter;
};

let activeBattle: ActiveBattle | null = null;

export function beginActiveBattle(
  battle: Omit<ActiveBattle, 'id'>,
): ActiveBattle {
  const nextBattle: ActiveBattle = {
    ...battle,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };

  activeBattle = nextBattle;
  return nextBattle;
}

export function getActiveBattle(
  battleId: string | undefined,
): ActiveBattle | null {
  if (!battleId || activeBattle?.id !== battleId) {
    return null;
  }

  return activeBattle;
}

export function updateActiveBattleEncounter(
  battleId: string,
  encounter: PokemonEncounter,
): ActiveBattle | null {
  if (activeBattle?.id !== battleId) {
    return null;
  }

  activeBattle = {
    ...activeBattle,
    encounter,
  };

  return activeBattle;
}

export function endActiveBattle(
  battleId: string,
): void {
  if (activeBattle?.id === battleId) {
    activeBattle = null;
  }
}
