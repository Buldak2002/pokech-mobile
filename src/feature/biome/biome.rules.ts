import {
  canAppearInField,
  getEvolutionEncounterMultiplier,
} from '../encounter/encounter.rules';
import { POKEMON_DATA } from '../pokedex/pokemon.data';
import type { Pokemon } from '../pokedex/pokemon.type';

import type { Biome } from './biome.type';

export type WeightedPokemonCandidate = {
  pokemon: Pokemon;
  weight: number;
};

export function getBiomePokemonCandidates(
  biome: Biome,
): WeightedPokemonCandidate[] {
  const includedIds = new Set(
    biome.includePokemonIds,
  );

  const excludedIds = new Set(
    biome.excludePokemonIds,
  );

  return POKEMON_DATA.flatMap((pokemon) => {
    if (!canAppearInField(pokemon)) {
      return [];
    }

    if (excludedIds.has(pokemon.id)) {
      return [];
    }

    const typeWeight = Math.max(
      0,
      ...pokemon.types.map(
        (type) => biome.typeWeights[type] ?? 0,
      ),
    );

    const isExplicitlyIncluded =
      includedIds.has(pokemon.id);

    if (
      typeWeight === 0 &&
      !isExplicitlyIncluded
    ) {
      return [];
    }

    const biomeWeight =
      typeWeight > 0 ? typeWeight : 1;

    const evolutionWeight =
      getEvolutionEncounterMultiplier(pokemon);

    const finalWeight =
      biomeWeight * evolutionWeight;

    if (finalWeight <= 0) {
      return [];
    }

    return [
      {
        pokemon,
        weight: finalWeight,
      },
    ];
  });
}

export function selectWeightedPokemon(
  candidates: WeightedPokemonCandidate[],
  random: () => number = Math.random,
): Pokemon | null {
  if (candidates.length === 0) {
    return null;
  }

  const totalWeight = candidates.reduce(
    (total, candidate) =>
      total + candidate.weight,
    0,
  );

  let randomWeight = random() * totalWeight;

  for (const candidate of candidates) {
    randomWeight -= candidate.weight;

    if (randomWeight < 0) {
      return candidate.pokemon;
    }
  }

  return candidates.at(-1)?.pokemon ?? null;
}