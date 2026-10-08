import type { Pokemon } from "../pokedex/pokemon.type";

export type UserGender = 'male' | 'female';

export type PokemonInstanceId = string;

export type OwnedPokemon = {
    instanceId: PokemonInstanceId;
    speciesId: Pokemon['id'];
    level: number;
}

export type PokemonParty = [
    PokemonInstanceId | null,
    PokemonInstanceId | null,
    PokemonInstanceId | null,
    PokemonInstanceId | null,
    PokemonInstanceId | null,
    PokemonInstanceId | null,
];

export type User = {
    name: string;
    gender: UserGender;
    ownedPokemon: OwnedPokemon[];
    party: PokemonParty; 
}

export type GameSave = {
    schemaVersion: 1,
    tutorialCompleted: boolean;
    user: User;
}
