import AsyncStorage from "@react-native-async-storage/async-storage";
import { WorkoutRoutine, DietPlan } from "./routine-diet-types";

export interface SavedRoutine {
  id: string;
  routine: WorkoutRoutine;
  savedAt: string;
  name: string;
}

export interface SavedDiet {
  id: string;
  diet: DietPlan;
  savedAt: string;
  name: string;
}

const SAVED_ROUTINES_KEY = "saved_routines";
const SAVED_DIETS_KEY = "saved_diets";

// ===== Routine Functions =====

export async function getSavedRoutines(): Promise<SavedRoutine[]> {
  try {
    const data = await AsyncStorage.getItem(SAVED_ROUTINES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("루틴 목록 조회 실패:", error);
    return [];
  }
}

export async function saveRoutine(routine: WorkoutRoutine): Promise<SavedRoutine> {
  try {
    const routines = await getSavedRoutines();
    const id = Date.now().toString();
    const savedRoutine: SavedRoutine = {
      id,
      routine,
      savedAt: new Date().toISOString(),
      name: `${routine.name} - ${new Date().toLocaleDateString("ko-KR")}`,
    };
    routines.push(savedRoutine);
    await AsyncStorage.setItem(SAVED_ROUTINES_KEY, JSON.stringify(routines));
    return savedRoutine;
  } catch (error) {
    console.error("루틴 저장 실패:", error);
    throw error;
  }
}

export async function deleteRoutine(id: string): Promise<void> {
  try {
    const routines = await getSavedRoutines();
    const filtered = routines.filter((r) => r.id !== id);
    await AsyncStorage.setItem(SAVED_ROUTINES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("루틴 삭제 실패:", error);
    throw error;
  }
}

export async function updateRoutineName(id: string, name: string): Promise<void> {
  try {
    const routines = await getSavedRoutines();
    const routine = routines.find((r) => r.id === id);
    if (routine) {
      routine.name = name;
      await AsyncStorage.setItem(SAVED_ROUTINES_KEY, JSON.stringify(routines));
    }
  } catch (error) {
    console.error("루틴 이름 수정 실패:", error);
    throw error;
  }
}

// ===== Diet Functions =====

export async function getSavedDiets(): Promise<SavedDiet[]> {
  try {
    const data = await AsyncStorage.getItem(SAVED_DIETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("식단 목록 조회 실패:", error);
    return [];
  }
}

export async function saveDiet(diet: DietPlan): Promise<SavedDiet> {
  try {
    const diets = await getSavedDiets();
    const id = Date.now().toString();
    const savedDiet: SavedDiet = {
      id,
      diet,
      savedAt: new Date().toISOString(),
      name: `${diet.name} - ${new Date().toLocaleDateString("ko-KR")}`,
    };
    diets.push(savedDiet);
    await AsyncStorage.setItem(SAVED_DIETS_KEY, JSON.stringify(diets));
    return savedDiet;
  } catch (error) {
    console.error("식단 저장 실패:", error);
    throw error;
  }
}

export async function deleteDiet(id: string): Promise<void> {
  try {
    const diets = await getSavedDiets();
    const filtered = diets.filter((d) => d.id !== id);
    await AsyncStorage.setItem(SAVED_DIETS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("식단 삭제 실패:", error);
    throw error;
  }
}

export async function updateDietName(id: string, name: string): Promise<void> {
  try {
    const diets = await getSavedDiets();
    const diet = diets.find((d) => d.id === id);
    if (diet) {
      diet.name = name;
      await AsyncStorage.setItem(SAVED_DIETS_KEY, JSON.stringify(diets));
    }
  } catch (error) {
    console.error("식단 이름 수정 실패:", error);
    throw error;
  }
}
