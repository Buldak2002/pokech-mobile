import type { Biome } from '../biome/biome.type';

import type {
  ExplorationSession,
  ExplorationStepSnapshot,
} from './exploration.type';

function normalizeSteps(steps: number): number {
  if (!Number.isFinite(steps)) {
    return 0;
  }

  return Math.max(0, Math.floor(steps));
}

export function startExploration(
  biome: Biome,
  startedAt: Date = new Date(),
): ExplorationSession {
  return {
    biomeId: biome.id,
    stepGoal: biome.stepGoal,
    startedAt: startedAt.toISOString(),
    progressSteps: 0,
    status: 'searching',
  };
}

export function calculateExplorationProgress(
  snapshot: ExplorationStepSnapshot,
): number {
  const healthProgress = normalizeSteps(
    snapshot.healthStepsSinceStart,
  );

  const liveEstimatedProgress =
    normalizeSteps(snapshot.syncedStepsAtLiveStart) +
    normalizeSteps(snapshot.liveStepsSinceLiveStart);

  return Math.max(
    healthProgress,
    liveEstimatedProgress,
  );
}

export function updateExplorationProgress(
  session: ExplorationSession,
  snapshot: ExplorationStepSnapshot,
): ExplorationSession {
  if (session.status === 'ready') {
    return session;
  }

  const calculatedProgress =
    calculateExplorationProgress(snapshot);

  const progressSteps = Math.min(
    calculatedProgress,
    session.stepGoal,
  );

  return {
    ...session,
    progressSteps,
    status:
      progressSteps >= session.stepGoal
        ? 'ready'
        : 'searching',
  };
}