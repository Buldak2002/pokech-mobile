// src/hooks/useStepEnergy.ts

import { useEffect, useState } from 'react';

import { calculateStepEnergyReward, getLocalDateKey } from
  '../feature/energy/energy.rules';
import { appStorage } from '../storage/appStorage';
import { useHealthSteps } from './useHealthSteps';

export function useStepEnergy() {
  const { steps, healthConnected } = useHealthSteps();
  const [energy, setEnergy] = useState(0);

  // 100걸음 단위가 바뀔 때만 저장 확인
  const completedStepUnits = Math.floor(steps / 100);

  useEffect(() => {
    async function syncEnergy() {
      const latestSave = await appStorage.loadGame();

      if (!latestSave) return;

      // energy 필드가 없던 이전 저장 데이터도 안전하게 불러온다.
      const savedEnergy = Number.isFinite(latestSave.user.energy)
        ? latestSave.user.energy
        : 0;
      const savedStepEnergy = latestSave.user.stepEnergy ?? {
        dateKey: '',
        convertedSteps: 0,
      };

      // 권한이 없어도 저장된 잔액은 화면에 표시
      setEnergy(savedEnergy);

      if (healthConnected !== true) return;

      const result = calculateStepEnergyReward(
        completedStepUnits * 100,
        getLocalDateKey(),
        savedStepEnergy,
      );

      if (result.earnedEnergy === 0) return;

      const nextSave = {
        ...latestSave,
        user: {
          ...latestSave.user,
          energy: savedEnergy + result.earnedEnergy,
          stepEnergy: result.nextState,
        },
      };

      await appStorage.saveGame(nextSave);
      setEnergy(nextSave.user.energy);
    }

    void syncEnergy();
  }, [completedStepUnits, healthConnected]);

  return {
    steps,
    energy,
    healthConnected,
  };
}
