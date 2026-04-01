export type FitnessGoal = "weight_loss" | "muscle_gain" | "endurance" | "flexibility" | "general";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type WorkoutCategory = "strength" | "cardio" | "hiit" | "yoga" | "stretching" | "core";

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";

export type WeightUnit = "kg" | "lb";

export type WorkoutPreference = "bodyweight" | "weights" | "running" | "mixed";

export type AIPersona = "kind_mentor" | "data_analyst" | "gigachad" | "custom";

export interface Exercise {
  id: string;
  name: string;
  category: WorkoutCategory;
  difficulty: DifficultyLevel;
  muscleGroups: string[];
  sets: number;
  reps: number;
  duration?: number; // seconds, for timed exercises
  restTime: number; // seconds
  description: string;
  instructions: string[];
  calories: number; // estimated calories per set
  youtubeVideoId?: string; // YouTube video ID for form demonstration
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO string
  exercises: CompletedExercise[];
  totalDuration: number; // seconds
  totalCalories: number;
  notes?: string;
}

export interface CompletedExercise {
  exerciseId: string;
  exerciseName: string;
  sets: CompletedSet[];
}

export interface CompletedSet {
  reps: number;
  weight?: number; // kg
  duration?: number; // seconds
  completed: boolean;
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  goal: FitnessGoal;
  fitnessLevel: DifficultyLevel;
  gender?: Gender;
  weightUnit?: WeightUnit;
  weeklyWorkoutFrequency?: number;
  workoutPreference?: WorkoutPreference;
  aiPersona?: AIPersona;
  customPersonaPrompt?: string;
  notificationsEnabled: boolean;
  onboardingCompleted?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ProgressStats {
  totalWorkouts: number;
  totalCalories: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  weeklyWorkouts: number[];  // last 7 days
  personalRecords: PersonalRecord[];
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  value: number;
  unit: string;
  date: string;
}
