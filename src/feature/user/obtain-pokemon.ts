import { createOwnedPokemon } from "./create-owned-pokemon";
import type {
  OwnedPokemon,
  User,
} from "./user.type";

type ObtainPokemonParams = {
  user: User;
  speciesId: OwnedPokemon["speciesId"];
};

type ObtainPokemonResult = {
  user: User;
  pokemon: OwnedPokemon;
  isNew: boolean;
};

export function obtainPokemon({
  user,
  speciesId,
}: ObtainPokemonParams): ObtainPokemonResult {
  const existingPokemon = user.ownedPokemon.find(
    (pokemon) => pokemon.speciesId === speciesId,
  );

  if (existingPokemon) {
    const leveledUpPokemon: OwnedPokemon = {
      ...existingPokemon,
      level: existingPokemon.level + 1,
    };

    const nextOwnedPokemon =
      user.ownedPokemon.map((pokemon) =>
        pokemon.instanceId ===
        existingPokemon.instanceId
          ? leveledUpPokemon
          : pokemon,
      );

    return {
      user: {
        ...user,
        ownedPokemon: nextOwnedPokemon,
      },
      pokemon: leveledUpPokemon,
      isNew: false,
    };
  }

  const newPokemon = createOwnedPokemon({
    speciesId,
  });

  return {
    user: {
      ...user,
      ownedPokemon: [
        ...user.ownedPokemon,
        newPokemon,
      ],
    },
    pokemon: newPokemon,
    isNew: true,
  };
}