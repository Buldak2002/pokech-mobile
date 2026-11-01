import type { Pokemon } from "../pokedex/pokemon.type";
import type { ItemId } from '../items/item.type';
import type { ExplorationsByBiome } from "../exploration/exploration.type";

export type UserGender = 'male' | 'female';

export type PokemonInstanceId = string;
export type PokemonSpeciesId = Pokemon['id'];

export type OwnedPokemon = {
    instanceId: PokemonInstanceId;
    speciesId: PokemonSpeciesId;
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

export type OwnedItem = {
    itemId: ItemId;
    quantity: number;
}

export type OwnedItems = OwnedItem[];

export type StepEnergyState = {
  dateKey: string;
  convertedSteps: number;
};

export type User = {
    name: string;
    gender: UserGender;
    ownedPokemon: OwnedPokemon[];
    registeredPokemonIds: PokemonSpeciesId[];
    party: PokemonParty;
    ownedItems: OwnedItems;
    
    energy: number;
    stepEnergy: StepEnergyState;
}

export type GameSave = {
    schemaVersion: 2,
    tutorialCompleted: boolean;
    user: User;
    explorations?: ExplorationsByBiome;
}
