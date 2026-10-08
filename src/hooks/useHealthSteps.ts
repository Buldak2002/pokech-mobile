import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  AppState,
} from 'react-native';

import {
  getHealthConnectAvailability,
  hasStepsReadPermission,
  openHealthConnectPermissionSettings,
  readTodaySteps,
  requestStepsReadPermission,
  type HealthConnectAvailability,
} from '../services/healthConnect';
import { Pedometer } from 'expo-sensors';

export function useHealthSteps() {
  const [healthSteps, setHealthSteps] = useState(0);
  const [sensorSteps, setSensorSteps] = useState(0);
  const [healthBaseline, setHealthBaseline] =
    useState(0);
  const [sensorBaseline, setSensorBaseline] =
    useState(0);

  const latestSensorStepsRef = useRef(0);
  const latestDisplayedStepsRef = useRef(0);

  const [healthConnected, setHealthConnected] =
    useState<boolean | null>(null);
  const [availability, setAvailability] =
    useState<HealthConnectAvailability | null>(null);

  const permissionPromptShown = useRef(false);
  const previousHealthConnected =
    useRef<boolean | null>(null);

  const sensorDelta = Math.max(
    0,
    sensorSteps - sensorBaseline,
  );

  const steps = Math.max(
    healthSteps,
    healthBaseline + sensorDelta,
  );

  useEffect(() => {
    latestDisplayedStepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    if (healthConnected === true) {
      console.log('현재 표시 걸음 수:', steps);
    }
  }, [healthConnected, steps]);

  useEffect(() => {
    if (healthConnected !== true) {
      return;
    }

    let subscription: ReturnType<
      typeof Pedometer.watchStepCount
    > | null = null;
    let cancelled = false;

    async function subscribeToPedometer() {
      try {
        const available =
          await Pedometer.isAvailableAsync();

        if (!available || cancelled) {
          return;
        }

        const permission =
          await Pedometer.requestPermissionsAsync();

        if (!permission.granted || cancelled) {
          return;
        }

        latestSensorStepsRef.current = 0;
        setSensorBaseline(0);
        setSensorSteps(0);

        const nextSubscription =
          Pedometer.watchStepCount(
            ({ steps: currentSteps }) => {
              latestSensorStepsRef.current =
                currentSteps;
              setSensorSteps(currentSteps);
            },
          );

        if (cancelled) {
          nextSubscription.remove();
          return;
        }

        subscription = nextSubscription;
      } catch (error) {
        console.error(
          '실시간 걸음 수 구독 실패:',
          error,
        );
      }
    }

    void subscribeToPedometer();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [healthConnected]);

  const refreshSteps = useCallback(async () => {
    try {
      const currentAvailability =
        await getHealthConnectAvailability();

      setAvailability(currentAvailability);

      if (currentAvailability !== 'available') {
        setHealthConnected(false);
        setHealthSteps(0);
        setHealthBaseline(0);
        setSensorBaseline(0);
        setSensorSteps(0);
        latestSensorStepsRef.current = 0;
        return;
      }

      const granted = await hasStepsReadPermission();

      setHealthConnected(granted);

      if (!granted) {
        setHealthSteps(0);
        setHealthBaseline(0);
        setSensorBaseline(0);
        setSensorSteps(0);
        latestSensorStepsRef.current = 0;
        return;
      }

      const todaySteps = await readTodaySteps();
      const nextBaseline = Math.max(
        todaySteps,
        latestDisplayedStepsRef.current,
      );

      setHealthBaseline(nextBaseline);
      setSensorBaseline(latestSensorStepsRef.current);
      setHealthSteps(todaySteps);
      console.log('오늘 걸음 수:', todaySteps);
    } catch (error) {
      console.error('걸음 수 불러오기 실패:', error);
    }
  }, []);

  const requestHealthPermission = useCallback(async () => {
    try {
      const currentAvailability =
        await getHealthConnectAvailability();

      setAvailability(currentAvailability);

      if (currentAvailability !== 'available') {
        Alert.alert(
          'Health Connect를 사용할 수 없어요',
          currentAvailability === 'update-required'
            ? 'Health Connect를 최신 버전으로 업데이트해 주세요.'
            : '이 기기에서는 Health Connect를 사용할 수 없어요.',
        );
        return;
      }

      const granted =
        await requestStepsReadPermission();

      setHealthConnected(granted);

      if (granted) {
        await refreshSteps();
        return;
      }

      Alert.alert(
        '걸음 수 권한이 필요해요',
        '서울콕이 걸음 수를 확인할 수 있도록 Health Connect에서 읽기 권한을 허용해 주세요.',
        [
          {
            text: '나중에',
            style: 'cancel',
          },
          {
            text: '설정 열기',
            onPress: openHealthConnectPermissionSettings,
          },
        ],
      );
    } catch (error) {
      console.error('걸음 수 권한 요청 실패:', error);
    }
  }, [refreshSteps]);

  const showHealthConnectPrompt = useCallback(() => {
    Alert.alert(
      '걸음 수를 연결할까요?',
      '서울콕은 진행도를 계산하기 위해 걸음 수만 읽어요.',
      [
        {
          text: '나중에',
          style: 'cancel',
        },
        {
          text: '연결하기',
          onPress: () => {
            void requestHealthPermission();
          },
        },
      ],
    );
  }, [requestHealthPermission]);

  useEffect(() => {
    const initialRefresh = setTimeout(() => {
      void refreshSteps();
    }, 0);

    const subscription = AppState.addEventListener(
      'change',
      (nextState) => {
        if (nextState === 'active') {
          void refreshSteps();
        }
      },
    );

    return () => {
      clearTimeout(initialRefresh);
      subscription.remove();
    };
  }, [refreshSteps]);

  useEffect(() => {
    const previous =
      previousHealthConnected.current;

    if (
      availability === 'available' &&
      healthConnected === false &&
      !permissionPromptShown.current
    ) {
      permissionPromptShown.current = true;
      showHealthConnectPrompt();
    }

    if (
      previous === false &&
      healthConnected === true
    ) {
      Alert.alert(
        '걸음 수 연결 완료!',
        '이제 서울콕에서 오늘의 걸음 수를 확인할 수 있어요.',
      );
    }

    if (healthConnected === true) {
      permissionPromptShown.current = false;
    }

    previousHealthConnected.current =
      healthConnected;
  }, [
    availability,
    healthConnected,
    showHealthConnectPrompt,
  ]);

  return {
    steps,
    healthConnected,
    availability,
    refreshSteps,
    requestHealthPermission,
  };
}
