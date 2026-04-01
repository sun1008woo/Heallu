import AsyncStorage from "@react-native-async-storage/async-storage";
import { SharedRoutineMetadata, ShareLink, RoutineExportData } from "./routine-sharing-types";
import { WorkoutRoutine } from "./routine-diet-types";

const SHARED_ROUTINES_KEY = "shared_routines";
const SHARED_LINKS_KEY = "shared_links";

/**
 * 고유한 공유 코드 생성
 */
function generateShareCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 공유 링크 생성
 */
export async function createShareLink(routine: WorkoutRoutine, creatorName: string): Promise<ShareLink> {
  const shareCode = generateShareCode();
  const fullUrl = `fitness-routine://import/${shareCode}`;

  // QR 코드 데이터 (간단한 텍스트 형식)
  const qrCodeData = fullUrl;

  const shareLink: ShareLink = {
    shortCode: shareCode,
    fullUrl,
    qrCodeData,
  };

  // 공유 메타데이터 저장
  const metadata: SharedRoutineMetadata = {
    id: `shared_${Date.now()}`,
    routineId: routine.id || "",
    routineName: routine.name,
    routineDescription: routine.description || "",
    creatorName,
    createdAt: Date.now(),
    shareCode,
    routineData: routine,
    downloadCount: 0,
    rating: 0,
    tags: [],
  };

  // AsyncStorage에 저장
  const sharedRoutines = await AsyncStorage.getItem(SHARED_ROUTINES_KEY);
  const routines = sharedRoutines ? JSON.parse(sharedRoutines) : [];
  routines.push(metadata);
  await AsyncStorage.setItem(SHARED_ROUTINES_KEY, JSON.stringify(routines));

  return shareLink;
}

/**
 * 공유 코드로 루틴 조회
 */
export async function getRoutineByShareCode(shareCode: string): Promise<SharedRoutineMetadata | null> {
  const sharedRoutines = await AsyncStorage.getItem(SHARED_ROUTINES_KEY);
  if (!sharedRoutines) return null;

  const routines: SharedRoutineMetadata[] = JSON.parse(sharedRoutines);
  return routines.find((r) => r.shareCode === shareCode) || null;
}

/**
 * 공유된 루틴 목록 조회
 */
export async function getSharedRoutines(): Promise<SharedRoutineMetadata[]> {
  const sharedRoutines = await AsyncStorage.getItem(SHARED_ROUTINES_KEY);
  return sharedRoutines ? JSON.parse(sharedRoutines) : [];
}

/**
 * 루틴 익스포트 데이터 생성
 */
export function createExportData(routine: WorkoutRoutine, creatorName: string): RoutineExportData {
  return {
    version: "1.0",
    exportedAt: Date.now(),
    routine,
    metadata: {
      creatorName,
      description: routine.description || "",
      tags: [],
    },
  };
}

/**
 * 루틴 익스포트 JSON 문자열 생성
 */
export function exportRoutineAsJSON(routine: WorkoutRoutine, creatorName: string): string {
  const exportData = createExportData(routine, creatorName);
  return JSON.stringify(exportData, null, 2);
}

/**
 * JSON 데이터에서 루틴 임포트
 */
export function importRoutineFromJSON(jsonData: string): WorkoutRoutine | null {
  try {
    const exportData: RoutineExportData = JSON.parse(jsonData);
    return exportData.routine;
  } catch (error) {
    console.error("Failed to import routine:", error);
    return null;
  }
}

/**
 * 공유된 루틴 다운로드 수 증가
 */
export async function incrementDownloadCount(shareCode: string): Promise<void> {
  const sharedRoutines = await AsyncStorage.getItem(SHARED_ROUTINES_KEY);
  if (!sharedRoutines) return;

  const routines: SharedRoutineMetadata[] = JSON.parse(sharedRoutines);
  const routine = routines.find((r) => r.shareCode === shareCode);
  if (routine) {
    routine.downloadCount += 1;
    await AsyncStorage.setItem(SHARED_ROUTINES_KEY, JSON.stringify(routines));
  }
}

/**
 * 공유된 루틴에 평점 추가
 */
export async function rateSharedRoutine(shareCode: string, rating: number): Promise<void> {
  const sharedRoutines = await AsyncStorage.getItem(SHARED_ROUTINES_KEY);
  if (!sharedRoutines) return;

  const routines: SharedRoutineMetadata[] = JSON.parse(sharedRoutines);
  const routine = routines.find((r) => r.shareCode === shareCode);
  if (routine && rating >= 0 && rating <= 5) {
    routine.rating = rating;
    await AsyncStorage.setItem(SHARED_ROUTINES_KEY, JSON.stringify(routines));
  }
}
