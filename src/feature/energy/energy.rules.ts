// src/feature/energy/energy.rules.ts

export type StepEnergyState = {
  dateKey: string;
  convertedSteps: number;
};

type EnergyRewardResult = {
  earnedEnergy: number;
  nextState: StepEnergyState;
};

export function calculateStepEnergyReward(
  currentSteps: number,
  currentDateKey: string,
  previousState: StepEnergyState,
): EnergyRewardResult {
  const safeSteps = Math.max(0, Math.floor(currentSteps));

  // 날짜가 바뀌면 오늘 걸음은 0걸음부터 새로 계산
  const convertedSteps =
    previousState.dateKey === currentDateKey
      ? previousState.convertedSteps
      : 0;

  const newSteps = Math.max(0, safeSteps - convertedSteps);
  const completedUnits = Math.floor(newSteps / 100);
  const rewardedSteps = completedUnits * 100;

  return {
    earnedEnergy: completedUnits * 10,
    nextState: {
      dateKey: currentDateKey,
      convertedSteps: convertedSteps + rewardedSteps,
    },
  };
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}