import type { BiomeId } from '../biome/biome.type';

export type ExplorationStatus =
  | 'searching'
  | 'ready';

export type ExplorationSession = {
  biomeId: BiomeId;
  stepGoal: number;
  startedAt: string;
  progressSteps: number;
  status: ExplorationStatus;
};

export type ExplorationStepSnapshot = {
  healthStepsSinceStart: number;
  syncedStepsAtLiveStart: number;
  liveStepsSinceLiveStart: number;
};