export interface HomeIngredient {
  name: string;
  category: "채소" | "단백질" | "탄수화물" | "유제품" | "과일" | "기타";
  quantity?: string;
}

export interface HomeIngredientsProfile {
  ingredients: HomeIngredient[];
  dietaryRestrictions?: string[];
  allergies?: string[];
  lastUpdated: string;
}

export interface IngredientsBasedDiet {
  id: string;
  mealPlan: MealPlanDay[];
  recipes: Recipe[];
  shoppingList: ShoppingItem[];
  nutritionSummary: NutritionSummary;
  generatedAt: string;
}

export interface MealPlanDay {
  day: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snack?: Meal;
}

export interface Meal {
  name: string;
  description: string;
  ingredients: string[];
  cookingTime: number;
  difficulty: "쉬움" | "중간" | "어려움";
  tips: string;
}

export interface Recipe {
  name: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  servings: number;
  cookingTime: number;
  nutrition: Nutrition;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface ShoppingItem {
  name: string;
  quantity: string;
  unit: string;
  category: string;
  checked: boolean;
}

export interface NutritionSummary {
  dailyAverageCalories: number;
  dailyAverageProtein: number;
  dailyAverageCarbs: number;
  dailyAverageFat: number;
  weeklyTotalCalories: number;
}
