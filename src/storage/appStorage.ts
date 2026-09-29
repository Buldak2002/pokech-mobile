import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./keys";

export const appStorage = {

  async hasAlreadyLaunched() {
    const value = await AsyncStorage.getItem(
      STORAGE_KEYS.ALREADY_LAUNCHED
    );

    return value === "true";
  },

  async markAsLaunched() {
    await AsyncStorage.setItem(
      STORAGE_KEYS.ALREADY_LAUNCHED,
      "true"
    );
  },

  async resetLaunchState() {
    await AsyncStorage.removeItem(
      STORAGE_KEYS.ALREADY_LAUNCHED
    );
  },

  async getAll() {
    const keys = await AsyncStorage.getAllKeys();
    return AsyncStorage.multiGet(keys);
  },
};
/*
함수	역할	반환값

hasAlreadyLaunched()	튜토리얼 완료 여부 확인	true 또는 false

markAsLaunched()	튜토리얼 완료 기록 저장	없음

resetLaunchState()	튜토리얼 완료 기록 삭제	없음

getAll()	저장된 모든 키와 값 조회	[키, 값] 배열

사용 예시

  async getLaunchState() {
    return AsyncStorage.getItem(
      STORAGE_KEYS.ALREADY_LAUNCHED
    );
  }

  async getSelected() {
    return AsyncStorage.multiGet([
      STORAGE_KEYS.ALREADY_LAUNCHED,
      STORAGE_KEYS.USER_SETTINGS,
    ]);
  }

  const data = await appStorage.getSelected();
  console.log(data);
*/
