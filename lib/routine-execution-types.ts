export interface ExerciseProgress {
  exerciseId?: string;
  exerciseName: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  sets?: number;
  reps?: number;
  duration?: number;
  restTime?: number;
}

export interface DailyProgress {
  date: string;
  dayOfWeek: number;
  exercises: ExerciseProgress[];
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
  isCompleted: boolean;
}

export interface RunningRoutine {
  id: string;
  routineName: string;
  routineDifficulty: string;
  startDate: string;
  targetEndDate: string;
  durationWeeks: number;
  daysPerWeek: number;
  dailyProgress: DailyProgress[];
  currentWeek: number;
  currentDay: number;
  overallCompletionPercentage: number;
  totalExercisesCompleted: number;
  totalExercisesPlanned: number;
  status: "active" | "paused" | "completed";
  lastUpdated: string;
}

export interface RoutineExecutionStats {
  totalRoutinesStarted: number;
  totalRoutinesCompleted: number;
  currentActiveRoutines: number;
  totalExercisesCompleted: number;
  weeklyCompletionRate: number;
  longestStreak: number;
  currentStreak: number;
}
