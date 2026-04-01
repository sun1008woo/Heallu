import AsyncStorage from "@react-native-async-storage/async-storage";

const CUSTOM_EXERCISES_KEY = "custom_exercises";

export interface CustomExercise {
  id: string;
  name: string;
  description: string;
  sets: number;
  reps: number;
  duration?: number; // in seconds
  restTime: number; // in seconds
  muscleGroups: string[]; // e.g., ["가슴", "삼두"]
  difficulty: "beginner" | "intermediate" | "advanced";
  youtubeVideoId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomExerciseInput {
  name: string;
  description: string;
  sets: number;
  reps: number;
  duration?: number;
  restTime: number;
  muscleGroups: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  youtubeVideoId?: string;
  notes?: string;
}

/**
 * 모든 사용자 정의 운동을 가져옵니다.
 */
export async function getCustomExercises(): Promise<CustomExercise[]> {
  try {
    const data = await AsyncStorage.getItem(CUSTOM_EXERCISES_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("사용자 정의 운동 로드 실패:", error);
    return [];
  }
}

/**
 * 특정 사용자 정의 운동을 가져옵니다.
 */
export async function getCustomExercise(id: string): Promise<CustomExercise | null> {
  try {
    const exercises = await getCustomExercises();
    return exercises.find((e) => e.id === id) || null;
  } catch (error) {
    console.error("사용자 정의 운동 조회 실패:", error);
    return null;
  }
}

/**
 * 새로운 사용자 정의 운동을 추가합니다.
 */
export async function addCustomExercise(input: CustomExerciseInput): Promise<CustomExercise> {
  try {
    const exercises = await getCustomExercises();
    const now = new Date().toISOString();
    const newExercise: CustomExercise = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    exercises.push(newExercise);
    await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(exercises));
    return newExercise;
  } catch (error) {
    console.error("사용자 정의 운동 추가 실패:", error);
    throw error;
  }
}

/**
 * 사용자 정의 운동을 업데이트합니다.
 */
export async function updateCustomExercise(
  id: string,
  input: Partial<CustomExerciseInput>
): Promise<CustomExercise | null> {
  try {
    const exercises = await getCustomExercises();
    const index = exercises.findIndex((e) => e.id === id);

    if (index === -1) {
      console.error("운동을 찾을 수 없습니다:", id);
      return null;
    }

    const now = new Date().toISOString();
    exercises[index] = {
      ...exercises[index],
      ...input,
      updatedAt: now,
    };

    await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(exercises));
    return exercises[index];
  } catch (error) {
    console.error("사용자 정의 운동 업데이트 실패:", error);
    throw error;
  }
}

/**
 * 사용자 정의 운동을 삭제합니다.
 */
export async function deleteCustomExercise(id: string): Promise<boolean> {
  try {
    const exercises = await getCustomExercises();
    const filtered = exercises.filter((e) => e.id !== id);

    if (filtered.length === exercises.length) {
      console.warn("삭제할 운동을 찾을 수 없습니다:", id);
      return false;
    }

    await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("사용자 정의 운동 삭제 실패:", error);
    throw error;
  }
}

/**
 * 근육 그룹으로 사용자 정의 운동을 필터링합니다.
 */
export async function getCustomExercisesByMuscleGroup(
  muscleGroup: string
): Promise<CustomExercise[]> {
  try {
    const exercises = await getCustomExercises();
    return exercises.filter((e) => e.muscleGroups.includes(muscleGroup));
  } catch (error) {
    console.error("근육 그룹별 운동 조회 실패:", error);
    return [];
  }
}

/**
 * 난이도로 사용자 정의 운동을 필터링합니다.
 */
export async function getCustomExercisesByDifficulty(
  difficulty: "beginner" | "intermediate" | "advanced"
): Promise<CustomExercise[]> {
  try {
    const exercises = await getCustomExercises();
    return exercises.filter((e) => e.difficulty === difficulty);
  } catch (error) {
    console.error("난이도별 운동 조회 실패:", error);
    return [];
  }
}

/**
 * 모든 사용자 정의 운동을 삭제합니다.
 */
export async function clearCustomExercises(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CUSTOM_EXERCISES_KEY);
  } catch (error) {
    console.error("사용자 정의 운동 초기화 실패:", error);
    throw error;
  }
}
