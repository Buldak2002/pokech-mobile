import type { EvolutionStage, Pokemon } from '../pokedex/pokemon.type';
import type {
  FailedCaptureResult,
  FleeWeight,
  PokemonEncounter,
} from './encounter.type';

export const CAPTURE_MULTIPLIER_BY_EVOLUTION_STAGE: Record<
  EvolutionStage,
  number
> = {
  0: 1,
  1: 0.75,
  2: 0.5,
};

export const FLEE_CHANCE_BY_WEIGHT: Record<FleeWeight, number> = {
  1: 0.05,
  2: 0.1,
  3: 0.2,
  4: 0.35,
  5: 0.5,
};

export function canAppearInField(pokemon: Pokemon): boolean {
  return (
    !pokemon.isLegendary &&
    !pokemon.isMythical &&
    !pokemon.isFinalEvolution
  );
}

export function getEvolutionCaptureMultiplier(
  pokemon: Pokemon,
): number {
  return CAPTURE_MULTIPLIER_BY_EVOLUTION_STAGE[
    pokemon.evolutionStage
  ];
}

export function isCaptureSuccessful(
  pokemon: Pokemon,
  ballMultiplier: number,
  random: () => number = Math.random,
): boolean {
  if (!Number.isFinite(ballMultiplier)) {
    return true;
  }

  const probability = Math.min(
    1,
    (pokemon.captureRate / 255) *
      getEvolutionCaptureMultiplier(pokemon) *
      Math.max(0, ballMultiplier),
  );

  return random() < probability;
}

export function createFleeWeight(
  random: () => number = Math.random,
): FleeWeight {
  return (Math.floor(random() * 5) + 1) as FleeWeight;
}

export function createPokemonEncounter(
  pokemonId: number,
  random: () => number = Math.random,
): PokemonEncounter {
  return {
    pokemonId,
    fleeWeight: createFleeWeight(random),
    failedCaptureAttempts: 0,
  };
}

export function resolveFailedCapture(
  encounter: PokemonEncounter,
  random: () => number = Math.random,
): FailedCaptureResult {
  const nextEncounter = {
    ...encounter,
    failedCaptureAttempts:
      encounter.failedCaptureAttempts + 1,
  };

  return {
    encounter: nextEncounter,
    fled:
      random() <
      FLEE_CHANCE_BY_WEIGHT[encounter.fleeWeight],
  };
}

export const ENCOUNTER_MULTIPLIER_BY_EVOLUTION_STAGE: Record<
  EvolutionStage,
  number
> = {
  0: 1,
  1: 0.25,
  2: 0,
};

export function getEvolutionEncounterMultiplier(
  pokemon: Pokemon,
): number {
  return ENCOUNTER_MULTIPLIER_BY_EVOLUTION_STAGE[
    pokemon.evolutionStage
  ];
}
