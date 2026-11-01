import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  GameSave,
  PokemonSpeciesId,
  User,
} from "../feature/user/user.type";
import { STORAGE_KEYS } from "./keys";

type StoredUser = Omit<User, 'registeredPokemonIds'> & {
  registeredPokemonIds?: PokemonSpeciesId[];
};

type StoredGameSave = Omit<GameSave, 'schemaVersion' | 'user'> & {
  schemaVersion?: number;
  user: StoredUser;
};

function migrateGameSave(storedGame: StoredGameSave): GameSave {
  const registeredPokemonIds = [
    ...new Set([
      ...(storedGame.user.registeredPokemonIds ?? []),
      ...storedGame.user.ownedPokemon.map(
        pokemon => pokemon.speciesId,
      ),
    ]),
  ];

  return {
    ...storedGame,
    schemaVersion: 2,
    user: {
      ...storedGame.user,
      registeredPokemonIds,
    },
  };
}

export const appStorage = {
  async saveGame(gameSave: GameSave): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.GAME_SAVE,
      JSON.stringify(gameSave),
    );
  },

  async loadGame(): Promise<GameSave | null> {
    const savedValue = await AsyncStorage.getItem(
      STORAGE_KEYS.GAME_SAVE,
    );

    if (!savedValue) {
      return null;
    }

    try {
      const storedGame = JSON.parse(savedValue) as StoredGameSave;
      return migrateGameSave(storedGame);
    } catch {
      return null;
    }
  },

  async clearGame(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.GAME_SAVE);
  },
};
