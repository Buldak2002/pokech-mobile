import type {
  OwnedPokemon,
  PokemonInstanceId,
  User,
} from './user.type';

type LevelUpOwnedPokemonResult = {
  user: User;
  pokemon: OwnedPokemon;
};

export function levelUpOwnedPokemon(
  user: User,
  pokemonId: PokemonInstanceId,
  amount = 1,
): LevelUpOwnedPokemonResult {
  const target = user.ownedPokemon.find(
    pokemon => pokemon.instanceId === pokemonId,
  );

  if (!target) {
    throw new Error(
      '탐험에 참가한 포켓몬을 찾을 수 없습니다.',
    );
  }

  const leveledPokemon: OwnedPokemon = {
    ...target,
    level: Math.min(100, target.level + amount),
  };

  return {
    user: {
      ...user,
      ownedPokemon: user.ownedPokemon.map(pokemon =>
        pokemon.instanceId === pokemonId
          ? leveledPokemon
          : pokemon,
      ),
    },
    pokemon: leveledPokemon,
  };
}
