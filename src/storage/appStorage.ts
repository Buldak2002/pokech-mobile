import AsyncStorage from "@react-native-async-storage/async-storage";

import type { GameSave } from "../feature/user/user.type";
import { STORAGE_KEYS } from "./keys";

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
      return JSON.parse(savedValue) as GameSave;
    } catch {
      return null;
    }
  },

  async clearGame(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.GAME_SAVE);
  },
};
