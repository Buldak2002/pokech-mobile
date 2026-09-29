import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState } from "react-native";

import {
  getHealthConnectAvailability,
  hasStepsReadPermission,
  openHealthConnectPermissionSettings,
  readTodaySteps,
  requestStepsReadPermission,
} from "../services/healthConnect";

export function useHealthSteps() {
  const [steps, setSteps] = useState(0);
  const [healthConnected, setHealthConnected] = useState<boolean | null>(null);
  const permissionPromptShown = useRef(false);
  const previousHealthConnected = useRef<boolean | null>(null);

  const refreshSteps = useCallback(async () => {
    try {
      const granted = await hasStepsReadPermission();
      setHealthConnected(granted);

      if (!granted) {
        setSteps(0);
        return;
      }

      const todaySteps = await readTodaySteps();
      setSteps(todaySteps);
      console.log("오늘 걸음 수:", todaySteps);
    } catch (error) {
      console.error("걸음 수 불러오기 실패:", error);
    }
  }, []);

  const requestHealthPermission = useCallback(async () => {
    try {
      const granted = await requestStepsReadPermission();
      setHealthConnected(granted);

      if (granted) {
        const todaySteps = await readTodaySteps();
        setSteps(todaySteps);
        console.log("오늘 걸음 수:", todaySteps);
        return;
      }

      Alert.alert(
        "걸음 수 권한이 필요해요",
        "Poketch가 걸음 수를 확인하려면 Health Connect에서 걸음 수 읽기를 허용해야 해요.",
        [
          {
            text: "나중에",
            style: "cancel",
          },
          {
            text: "설정 열기",
            onPress: openHealthConnectPermissionSettings,
          },
        ],
      );
    } catch (error) {
      console.error("걸음 수 권한 요청 실패:", error);
    }
  }, []);

  const showHealthConnectPrompt = useCallback(() => {
    Alert.alert(
      "걸음 수를 연결할까요?",
      "Poketch는 포켓몬 조우 진행도를 계산하기 위해 걸음 수만 읽어요.",
      [
        {
          text: "나중에",
          style: "cancel",
        },
        {
          text: "연결하기",
          onPress: () => {
            void requestHealthPermission();
          },
        },
      ],
    );
  }, [requestHealthPermission]);

  useEffect(() => {
    let mounted = true;

    const setupHealthConnect = async () => {
      const availability = await getHealthConnectAvailability();

      if (availability !== "available") {
        return;
      }

      const granted = await hasStepsReadPermission();

      if (!mounted) {
        return;
      }

      setHealthConnected(granted);

      if (granted) {
        const todaySteps = await readTodaySteps();

        if (mounted) {
          setSteps(todaySteps);
          console.log("오늘 걸음 수:", todaySteps);
        }
      }
    };

    void setupHealthConnect();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshSteps();
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [refreshSteps]);

  useEffect(() => {
    const previous = previousHealthConnected.current;

    if (healthConnected === false && !permissionPromptShown.current) {
      permissionPromptShown.current = true;
      showHealthConnectPrompt();
    }

    if (previous === false && healthConnected === true) {
      Alert.alert(
        "걸음 수 연결 완료!",
        "이제 Poketch에서 걸음 수를 확인할 수 있어요.",
      );
    }

    if (healthConnected === true) {
      permissionPromptShown.current = false;
    }

    previousHealthConnected.current = healthConnected;
  }, [healthConnected, showHealthConnectPrompt]);

  return {
    steps,
    healthConnected,
    refreshSteps,
  };
}
