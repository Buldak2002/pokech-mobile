import * as Crypto from "expo-crypto";

import type { OwnedPokemon } from "./user.type";

type CreateOwnedPokemonParams = {
  speciesId: OwnedPokemon["speciesId"];
  level?: number;
};

export function createOwnedPokemon({
  speciesId,
  level = 0,
}: CreateOwnedPokemonParams): OwnedPokemon {
  return {
    instanceId: Crypto.randomUUID(),
    speciesId,
    level,
  };
}