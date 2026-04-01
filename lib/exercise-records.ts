import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkAndUpdatePR, type PRCheckResult } from "./pr-tracking";

const EXERCISE_RECORDS_KEY = "exercise_records";

export interface ExerciseSetRecord {
  setNumber: number;
  completedReps: number;
  weight?: number; // in kg
  notes?: string;
  timestamp: string;
}

export interface ExerciseSessionRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  date: string; // YYYY-MM-DD
  sets: ExerciseSetRecord[];
  totalDuration?: number; // in seconds
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseRecordInput {
  exerciseId: string;
  exerciseName: string;
  date: string;
  sets: Omit<ExerciseSetRecord, "timestamp">[];
  totalDuration?: number;
  notes?: string;
}

/**
 * 모든 운동 수행 기록을 가져옵니다.
 */
export async function getExerciseRecords(): Promise<ExerciseSessionRecord[]> {
  try {
    const data = await AsyncStorage.getItem(EXERCISE_RECORDS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("운동 기록 로드 실패:", error);
    return [];
  }
}

/**
 * 특정 운동의 모든 기록을 가져옵니다.
 */
export async function getExerciseRecordsByExerciseId(
  exerciseId: string
): Promise<ExerciseSessionRecord[]> {
  try {
    const records = await getExerciseRecords();
    return records.filter((r) => r.exerciseId === exerciseId).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error("운동별 기록 조회 실패:", error);
    return [];
  }
}

/**
 * 특정 날짜의 모든 기록을 가져옵니다.
 */
export async function getExerciseRecordsByDate(date: string): Promise<ExerciseSessionRecord[]> {
  try {
    const records = await getExerciseRecords();
    return records.filter((r) => r.date === date);
  } catch (error) {
    console.error("날짜별 기록 조회 실패:", error);
    return [];
  }
}

export interface ExerciseRecordWithPR extends ExerciseSessionRecord {
  prCheckResult?: PRCheckResult;
}

/**
 * 새로운 운동 수행 기록을 추가합니다. PR 감지도 함께 수행합니다.
 */
export async function addExerciseRecord(input: ExerciseRecordInput): Promise<ExerciseRecordWithPR> {
  try {
    const records = await getExerciseRecords();
    const now = new Date().toISOString();

    const newRecord: ExerciseSessionRecord = {
      id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: input.exerciseId,
      exerciseName: input.exerciseName,
      date: input.date,
      sets: input.sets.map((set, index) => ({
        ...set,
        setNumber: index + 1,
        timestamp: now,
      })),
      totalDuration: input.totalDuration,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    records.push(newRecord);
    await AsyncStorage.setItem(EXERCISE_RECORDS_KEY, JSON.stringify(records));

    // PR 감지 - 각 세트의 최대 반복 횟수로 확인
    const maxRepsInSession = Math.max(...input.sets.map((s) => s.completedReps));
    const maxWeightInSession = Math.max(
      ...input.sets
        .filter((s) => s.weight)
        .map((s) => s.weight || 0)
    );

    const prCheckResult = await checkAndUpdatePR(
      input.exerciseId,
      input.exerciseName,
      maxRepsInSession,
      maxWeightInSession || undefined,
      newRecord.id
    );

    return {
      ...newRecord,
      prCheckResult,
    };
  } catch (error) {
    console.error("운동 기록 추가 실패:", error);
    throw error;
  }
}

/**
 * 운동 기록을 업데이트합니다.
 */
export async function updateExerciseRecord(
  id: string,
  input: Partial<ExerciseRecordInput>
): Promise<ExerciseSessionRecord | null> {
  try {
    const records = await getExerciseRecords();
    const index = records.findIndex((r) => r.id === id);

    if (index === -1) {
      console.error("기록을 찾을 수 없습니다:", id);
      return null;
    }

    const now = new Date().toISOString();
    const updated: ExerciseSessionRecord = {
      ...records[index],
      ...input,
      sets: input.sets
        ? input.sets.map((set, idx) => ({
            ...set,
            setNumber: idx + 1,
            timestamp: now,
          }))
        : records[index].sets,
      updatedAt: now,
    };

    records[index] = updated;
    await AsyncStorage.setItem(EXERCISE_RECORDS_KEY, JSON.stringify(records));
    return updated;
  } catch (error) {
    console.error("운동 기록 업데이트 실패:", error);
    throw error;
  }
}

/**
 * 운동 기록을 삭제합니다.
 */
export async function deleteExerciseRecord(id: string): Promise<boolean> {
  try {
    const records = await getExerciseRecords();
    const filtered = records.filter((r) => r.id !== id);

    if (filtered.length === records.length) {
      console.warn("삭제할 기록을 찾을 수 없습니다:", id);
      return false;
    }

    await AsyncStorage.setItem(EXERCISE_RECORDS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("운동 기록 삭제 실패:", error);
    throw error;
  }
}

/**
 * 특정 운동의 통계를 계산합니다.
 */
export async function getExerciseStats(exerciseId: string) {
  try {
    const records = await getExerciseRecordsByExerciseId(exerciseId);

    if (records.length === 0) {
      return {
        totalSessions: 0,
        totalSets: 0,
        totalReps: 0,
        averageReps: 0,
        maxReps: 0,
        lastSession: null,
        firstSession: null,
      };
    }

    const allSets = records.flatMap((r) => r.sets);
    const totalReps = allSets.reduce((sum, set) => sum + set.completedReps, 0);
    const maxReps = Math.max(...allSets.map((s) => s.completedReps), 0);

    return {
      totalSessions: records.length,
      totalSets: allSets.length,
      totalReps,
      averageReps: totalReps / allSets.length,
      maxReps,
      lastSession: records[0]?.date || null,
      firstSession: records[records.length - 1]?.date || null,
    };
  } catch (error) {
    console.error("운동 통계 계산 실패:", error);
    throw error;
  }
}

/**
 * 날짜 범위 내의 기록을 가져옵니다.
 */
export async function getExerciseRecordsByDateRange(
  startDate: string,
  endDate: string
): Promise<ExerciseSessionRecord[]> {
  try {
    const records = await getExerciseRecords();
    return records.filter((r) => {
      const recordDate = new Date(r.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return recordDate >= start && recordDate <= end;
    });
  } catch (error) {
    console.error("날짜 범위별 기록 조회 실패:", error);
    return [];
  }
}

/**
 * 모든 운동 기록을 삭제합니다.
 */
export async function clearExerciseRecords(): Promise<void> {
  try {
    await AsyncStorage.removeItem(EXERCISE_RECORDS_KEY);
  } catch (error) {
    console.error("운동 기록 초기화 실패:", error);
    throw error;
  }
}

/**
 * 주간 활동 요약을 가져옵니다.
 */
export async function getWeeklyActivitySummary(
  endDate: string = new Date().toISOString().split("T")[0]
): Promise<Record<string, number>> {
  try {
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);

    const startDateStr = start.toISOString().split("T")[0];
    const records = await getExerciseRecordsByDateRange(startDateStr, endDate);

    const summary: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      summary[dateStr] = records.filter((r) => r.date === dateStr).length;
    }

    return summary;
  } catch (error) {
    console.error("주간 활동 요약 조회 실패:", error);
    throw error;
  }
}
