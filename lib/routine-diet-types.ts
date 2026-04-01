export interface WorkoutRoutine {
  id: string;
  name: string;
  description: string;
  goal: string;
  difficulty: string;
  durationWeeks: number;
  daysPerWeek: number;
  dailyWorkouts: DailyWorkout[];
  totalCaloriesBurn: number;
  notes: string;
}

export interface DailyWorkout {
  day: string;
  exercises: RoutineExercise[];
  totalDuration: number;
  totalCalories: number;
}

export interface RoutineExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  duration?: number;
  restTime: number;
  notes: string;
  youtubeVideoId?: string; // YouTube video ID for form demonstration
}

export interface DietPlan {
  id: string;
  name: string;
  description: string;
  goal: string;
  durationDays: number;
  dailyCalories: number;
  macros: {
    protein: number; // grams
    carbs: number;
    fat: number;
  };
  meals: Meal[];
  notes: string;
}

export interface Meal {
  name: string;
  time: string; // e.g., "07:00", "12:00"
  foods: Food[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface Food {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

export interface PersonalizedRecommendation {
  routine: WorkoutRoutine;
  diet: DietPlan;
  tips: string[];
  estimatedResults: {
    weightChange: string;
    muscleGain: string;
    timeframe: string;
  };
}
