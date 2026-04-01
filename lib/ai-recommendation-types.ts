export interface RoutineRecommendationRequest {
  goal: "weight_loss" | "muscle_gain" | "endurance" | "flexibility" | "general";
  difficulty: "beginner" | "intermediate" | "advanced";
  daysPerWeek: number;
  durationWeeks: number;
  focusAreas?: string[];
  equipment?: "gym" | "home" | "both";
}

export interface RoutineRecommendation {
  id: string;
  name: string;
  description: string;
  goal: string;
  difficulty: string;
  durationWeeks: number;
  daysPerWeek: number;
  dailyWorkouts: {
    day: string;
    exercises: {
      name: string;
      sets: number;
      reps: number;
      restTime: number;
      youtubeVideoId?: string; // YouTube video ID for form demonstration
    }[];
  }[];
  totalCaloriesBurn: number;
  tips: string[];
  estimatedResults: {
    weightChange: string;
    muscleGain: string;
    timeframe: string;
  };
}
