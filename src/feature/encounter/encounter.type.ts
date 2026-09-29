export type FleeWeight = 1 | 2 | 3 | 4 | 5;

export type PokemonEncounter = {
  pokemonId: number;
  fleeWeight: FleeWeight;
  failedCaptureAttempts: number;
};

export type FailedCaptureResult = {
  encounter: PokemonEncounter;
  fled: boolean;
};
