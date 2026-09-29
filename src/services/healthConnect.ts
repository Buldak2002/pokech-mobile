import {
  aggregateRecord,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings as openNativeHealthConnectSettings,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from "react-native-health-connect";

export type HealthConnectAvailability =
  | "available"
  | "update-required"
  | "unavailable";

export async function getHealthConnectAvailability(): Promise<HealthConnectAvailability> {
  const status = await getSdkStatus();

  if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
    return "available";
  }

  if (
    status ===
    SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
  ) {
    return "update-required";
  }

  return "unavailable";
}

async function initializeHealthConnect(): Promise<boolean> {
  const availability = await getHealthConnectAvailability();

  if (availability !== "available") {
    return false;
  }

  return initialize();
}

export async function hasStepsReadPermission(): Promise<boolean> {
  const initialized = await initializeHealthConnect();

  if (!initialized) {
    return false;
  }

  const permissions = await getGrantedPermissions();

  return permissions.some(
    (permission) =>
      permission.accessType === "read" &&
      permission.recordType === "Steps",
  );
}

export async function requestStepsReadPermission(): Promise<boolean> {
  const initialized = await initializeHealthConnect();

  if (!initialized) {
    return false;
  }

  const permissions = await requestPermission([
    {
      accessType: "read",
      recordType: "Steps",
    },
  ]);

  return permissions.some(
    (permission) =>
      permission.accessType === "read" &&
      permission.recordType === "Steps",
  );
}

export function openHealthConnectPermissionSettings(): void {
  openNativeHealthConnectSettings();
}

export async function readTodaySteps(): Promise<number> {
  const hasPermission = await hasStepsReadPermission();

  if (!hasPermission) {
    return 0;
  }

  const now = new Date();
  const startOfToday = new Date(now);

  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const result = await aggregateRecord({
    recordType: "Steps",
    timeRangeFilter: {
      operator: "between",
      startTime: startOfToday.toISOString(),
      endTime: startOfTomorrow.toISOString(),
    },
  });

  const rawResult = await readRecords("Steps", {
    timeRangeFilter: {
      operator: "between",
      startTime: startOfToday.toISOString(),
      endTime: startOfTomorrow.toISOString(),
    },
  });

  console.log("HC 집계 결과:", result);
  console.log("HC 원본 레코드 수:", rawResult.records.length);
  console.log(
    "HC 원본 걸음 기록:",
    JSON.stringify(rawResult.records, null, 2),
  );

  return Math.max(0, Math.floor(result.COUNT_TOTAL ?? 0));
}

export async function readStepsBetween(
  startTime: string,
  endTime: string = new Date().toISOString(),
): Promise<number> {
  const hasPermission =
    await hasStepsReadPermission();

  if (!hasPermission) {
    return 0;
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    throw new Error(
      '걸음 조회 시간 형식이 올바르지 않습니다.',
    );
  }

  if (startDate >= endDate) {
    return 0;
  }

  const result = await aggregateRecord({
    recordType: 'Steps',
    timeRangeFilter: {
      operator: 'between',
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    },
  });

  return Math.max(
    0,
    Math.floor(result.COUNT_TOTAL ?? 0),
  );
}