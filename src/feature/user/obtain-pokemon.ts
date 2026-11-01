import { createOwnedPokemon } from "./create-owned-pokemon";
import type {
  OwnedPokemon,
  User,
} from "./user.type";

type ObtainPokemonParams = {
  user: User;
  speciesId: OwnedPokemon["speciesId"];
  level?: number;
};

type ObtainPokemonResult = {
  user: User;
  pokemon: OwnedPokemon;
  isNew: boolean;
};

export function obtainPokemon({
  user,
  speciesId,
  level
}: ObtainPokemonParams): ObtainPokemonResult {
  const isNew = !user.registeredPokemonIds.includes(
    speciesId,
  );

  const newPokemon = createOwnedPokemon({
    speciesId,
    level,
  });

  return {
    user: {
      ...user,
      ownedPokemon: [
        ...user.ownedPokemon,
        newPokemon,
      ],
      registeredPokemonIds: isNew
        ? [...user.registeredPokemonIds, speciesId]
        : user.registeredPokemonIds,
    },
    pokemon: newPokemon,
    isNew,
  };
}
