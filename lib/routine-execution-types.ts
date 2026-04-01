/**
 * 루틴 실행 추적 데이터 타입
 * 사용자가 저장된 루틴을 시작했을 때의 진행 상황을 추적합니다.
 */

export interface ExerciseProgress {
  exerciseName: string;
  completed: boolean;
  completedAt?: string; // ISO 8601 형식
  notes?: string;
  sets?: number; // 세트 수
  restTime?: number; // 휴식 시간 (초)
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD 형식
  dayOfWeek: number; // 0-6 (0=월요일)
  exercises: ExerciseProgress[];
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
  isCompleted: boolean;
}

export interface RunningRoutine {
  id: string; // 저장된 루틴의 ID
  routineName: string;
  routineDifficulty: string;
  startDate: string; // ISO 8601 형식
  targetEndDate: string; // 루틴 예상 종료일
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
  weeklyCompletionRate: number; // 0-100
  longestStreak: number; // 연속 완료 일수
  currentStreak: number; // 현재 연속 완료 일수
}
