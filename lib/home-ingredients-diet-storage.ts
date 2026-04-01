import AsyncStorage from "@react-native-async-storage/async-storage";
import { HomeIngredientsProfile, IngredientsBasedDiet } from "./home-ingredients-diet-types";

const INGREDIENTS_PROFILE_KEY = "home_ingredients_profile";
const INGREDIENTS_DIETS_KEY = "ingredients_based_diets";

export async function saveIngredientsProfile(profile: HomeIngredientsProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(INGREDIENTS_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("재료 프로필 저장 실패:", error);
    throw error;
  }
}

export async function getIngredientsProfile(): Promise<HomeIngredientsProfile | null> {
  try {
    const data = await AsyncStorage.getItem(INGREDIENTS_PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("재료 프로필 조회 실패:", error);
    return null;
  }
}

export async function saveIngredientsDiet(diet: IngredientsBasedDiet): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(INGREDIENTS_DIETS_KEY);
    const diets = existing ? JSON.parse(existing) : [];
    diets.push(diet);
    await AsyncStorage.setItem(INGREDIENTS_DIETS_KEY, JSON.stringify(diets));
  } catch (error) {
    console.error("식단 저장 실패:", error);
    throw error;
  }
}

export async function getIngredientsDiets(): Promise<IngredientsBasedDiet[]> {
  try {
    const data = await AsyncStorage.getItem(INGREDIENTS_DIETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("식단 조회 실패:", error);
    return [];
  }
}

export async function deleteIngredientsDiet(dietId: string): Promise<void> {
  try {
    const diets = await getIngredientsDiets();
    const filtered = diets.filter((d) => d.id !== dietId);
    await AsyncStorage.setItem(INGREDIENTS_DIETS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("식단 삭제 실패:", error);
    throw error;
  }
}
