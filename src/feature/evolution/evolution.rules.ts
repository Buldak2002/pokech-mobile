import type {
  PokemonInstanceId,
  PokemonSpeciesId,
  User,
} from '../user/user.type';
import { EVOLUTION_RULES } from './evolution.data';

export function getEvolutionCandidates(user: User) {
  return user.ownedPokemon.flatMap((pokemon) =>
    EVOLUTION_RULES
      .filter((rule) => rule.fromSpeciesId === pokemon.speciesId)
      .map((rule) => ({ pokemon, rule })),
  );
}

export function getLevelEligibleEvolutions(user: User) {
  return getEvolutionCandidates(user).filter(
    ({ pokemon, rule }) => pokemon.level >= rule.requiredLevel,
  );
}

export function getAvailableEvolutions(user: User) {
  return getLevelEligibleEvolutions(user).filter(({ rule }) => {
    if (rule.method === 'level') {
        return true;
    }

    if (!rule.requiredItemId) {
      return false;
    }

    const quantity =
      user.ownedItems.find(
        (item) => item.itemId === rule.requiredItemId,
      )?.quantity ?? 0;

    return quantity > 0;
  });
}

export function findAvailableEvolution(
    user: User,
    pokemonId: PokemonInstanceId,
    toSpeciesId: PokemonSpeciesId
) {
    return getAvailableEvolutions(user).find(
        ({ pokemon, rule }) => 
            pokemon.instanceId === pokemonId &&
        rule.toSpeciesId === toSpeciesId
    )
}

export function evolvePokemon(
  user: User,
  pokemonId: PokemonInstanceId,
  toSpeciesId: PokemonSpeciesId,
): User {
  const selected = findAvailableEvolution(
    user,
    pokemonId,
    toSpeciesId,
  );

  if (!selected) {
    throw new Error('이 포켓몬은 현재 선택한 형태로 진화할 수 없습니다.');
  }

  const requiredItemId = selected.rule.requiredItemId;

  return {
    ...user,
    ownedPokemon: user.ownedPokemon.map((pokemon) =>
      pokemon.instanceId === pokemonId
        ? { ...pokemon, speciesId: toSpeciesId }
        : pokemon,
    ),
    registeredPokemonIds: user.registeredPokemonIds.includes(toSpeciesId)
      ? user.registeredPokemonIds
      : [...user.registeredPokemonIds, toSpeciesId],
    ownedItems: requiredItemId
      ? user.ownedItems.map((item) =>
          item.itemId === requiredItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
      : user.ownedItems,
  };
}
