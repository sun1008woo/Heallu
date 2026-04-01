import AsyncStorage from "@react-native-async-storage/async-storage";
import { RunningRoutine, DailyProgress, ExerciseProgress, RoutineExecutionStats } from "./routine-execution-types";
import { WorkoutRoutine } from "./routine-diet-types";

const RUNNING_ROUTINES_KEY = "running_routines";
const ROUTINE_EXECUTION_STATS_KEY = "routine_execution_stats";

/**
 * 저장된 루틴으로부터 새로운 실행 루틴 생성
 */
export function createRunningRoutine(savedRoutineId: string, routine: WorkoutRoutine): RunningRoutine {
  const startDate = new Date();
  const targetEndDate = new Date(startDate);
  targetEndDate.setDate(targetEndDate.getDate() + routine.durationWeeks * 7);

  // Initialize dailyProgress for each day of the routine
  const dailyProgress: DailyProgress[] = [];
  for (let i = 0; i < routine.durationWeeks * 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1; // 0=월요일

    // Get exercises for this day (cycle through dailyWorkouts)
    const dayIndex = i % routine.dailyWorkouts.length;
    const dayWorkout = routine.dailyWorkouts[dayIndex];
    const exercises: ExerciseProgress[] = dayWorkout.exercises.map((ex) => ({
      exerciseName: ex.name,
      completed: false,
    }));

    dailyProgress.push({
      date: dateStr,
      dayOfWeek,
      exercises,
      completedCount: 0,
      totalCount: exercises.length,
      completionPercentage: 0,
      isCompleted: false,
    });
  }

  return {
    id: `running_${Date.now()}`,
    routineName: routine.name,
    routineDifficulty: routine.difficulty,
    startDate: startDate.toISOString(),
    targetEndDate: targetEndDate.toISOString(),
    durationWeeks: routine.durationWeeks,
    daysPerWeek: routine.daysPerWeek,
    dailyProgress,
    currentWeek: 1,
    currentDay: 1,
    overallCompletionPercentage: 0,
    totalExercisesCompleted: 0,
    totalExercisesPlanned: routine.dailyWorkouts.reduce((sum, day) => sum + day.exercises.length, 0),
    status: "active",
    lastUpdated: startDate.toISOString(),
  };
}

/**
 * 실행 중인 루틴 목록 조회
 */
export async function getRunningRoutines(): Promise<RunningRoutine[]> {
  try {
    const data = await AsyncStorage.getItem(RUNNING_ROUTINES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("실행 중인 루틴 목록 조회 실패:", error);
    return [];
  }
}

/**
 * 새로운 루틴 실행 시작
 */
export async function startRoutine(routine: RunningRoutine): Promise<RunningRoutine> {
  try {
    const routines = await getRunningRoutines();
    routines.push(routine);
    await AsyncStorage.setItem(RUNNING_ROUTINES_KEY, JSON.stringify(routines));
    return routine;
  } catch (error) {
    console.error("루틴 시작 실패:", error);
    throw error;
  }
}

/**
 * 특정 루틴 조회
 */
export async function getRunningRoutine(id: string): Promise<RunningRoutine | null> {
  try {
    const routines = await getRunningRoutines();
    return routines.find((r) => r.id === id) || null;
  } catch (error) {
    console.error("루틴 조회 실패:", error);
    return null;
  }
}

/**
 * 루틴 일일 진행 상황 업데이트
 */
export async function updateDailyProgress(
  routineId: string,
  date: string,
  dailyProgress: DailyProgress
): Promise<void> {
  try {
    const routines = await getRunningRoutines();
    const routine = routines.find((r) => r.id === routineId);

    if (!routine) throw new Error("루틴을 찾을 수 없습니다.");

    // 기존 날짜의 진행 상황이 있으면 업데이트, 없으면 추가
    const existingIndex = routine.dailyProgress.findIndex((p) => p.date === date);
    if (existingIndex >= 0) {
      routine.dailyProgress[existingIndex] = dailyProgress;
    } else {
      routine.dailyProgress.push(dailyProgress);
    }

    // 전체 진행률 계산
    updateRoutineStats(routine);
    routine.lastUpdated = new Date().toISOString();

    await AsyncStorage.setItem(RUNNING_ROUTINES_KEY, JSON.stringify(routines));
  } catch (error) {
    console.error("일일 진행 상황 업데이트 실패:", error);
    throw error;
  }
}

/**
 * 운동 완료 상태 토글
 */
export async function toggleExerciseCompletion(
  routineId: string,
  date: string,
  exerciseName: string
): Promise<void> {
  try {
    const routine = await getRunningRoutine(routineId);
    if (!routine) throw new Error("루틴을 찾을 수 없습니다.");

    let dailyProgress = routine.dailyProgress.find((p) => p.date === date);
    if (!dailyProgress) {
      throw new Error("해당 날짜의 진행 상황을 찾을 수 없습니다.");
    }

    const exercise = dailyProgress.exercises.find((e) => e.exerciseName === exerciseName);
    if (!exercise) throw new Error("운동을 찾을 수 없습니다.");

    exercise.completed = !exercise.completed;
    if (exercise.completed) {
      exercise.completedAt = new Date().toISOString();
    } else {
      exercise.completedAt = undefined;
    }

    // 완료 수 업데이트
    dailyProgress.completedCount = dailyProgress.exercises.filter((e) => e.completed).length;
    dailyProgress.completionPercentage = Math.round(
      (dailyProgress.completedCount / dailyProgress.totalCount) * 100
    );
    dailyProgress.isCompleted = dailyProgress.completedCount === dailyProgress.totalCount;

    await updateDailyProgress(routineId, date, dailyProgress);
  } catch (error) {
    console.error("운동 완료 상태 토글 실패:", error);
    throw error;
  }
}

/**
 * 루틴 통계 업데이트
 */
function updateRoutineStats(routine: RunningRoutine): void {
  if (routine.dailyProgress.length === 0) return;

  const completedExercises = routine.dailyProgress.reduce((sum, day) => {
    return sum + day.completedCount;
  }, 0);

  routine.totalExercisesCompleted = completedExercises;

  const totalPlanned = routine.dailyProgress.reduce((sum, day) => {
    return sum + day.totalCount;
  }, 0);

  routine.overallCompletionPercentage =
    totalPlanned > 0 ? Math.round((completedExercises / totalPlanned) * 100) : 0;

  // 현재 주차 계산
  const startDate = new Date(routine.startDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  routine.currentWeek = Math.floor(daysDiff / 7) + 1;
  routine.currentDay = (daysDiff % 7) + 1;
}

/**
 * 루틴 완료 처리
 */
export async function completeRoutine(routineId: string): Promise<void> {
  try {
    const routines = await getRunningRoutines();
    const routine = routines.find((r) => r.id === routineId);

    if (!routine) throw new Error("루틴을 찾을 수 없습니다.");

    routine.status = "completed";
    routine.lastUpdated = new Date().toISOString();

    await AsyncStorage.setItem(RUNNING_ROUTINES_KEY, JSON.stringify(routines));

    // 통계 업데이트
    await updateExecutionStats(routine);
  } catch (error) {
    console.error("루틴 완료 처리 실패:", error);
    throw error;
  }
}

/**
 * 루틴 삭제
 */
export async function deleteRunningRoutine(routineId: string): Promise<void> {
  try {
    const routines = await getRunningRoutines();
    const filtered = routines.filter((r) => r.id !== routineId);
    await AsyncStorage.setItem(RUNNING_ROUTINES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("루틴 삭제 실패:", error);
    throw error;
  }
}

/**
 * 실행 통계 조회
 */
export async function getExecutionStats(): Promise<RoutineExecutionStats> {
  try {
    const data = await AsyncStorage.getItem(ROUTINE_EXECUTION_STATS_KEY);
    return data
      ? JSON.parse(data)
      : {
          totalRoutinesStarted: 0,
          totalRoutinesCompleted: 0,
          currentActiveRoutines: 0,
          totalExercisesCompleted: 0,
          weeklyCompletionRate: 0,
          longestStreak: 0,
          currentStreak: 0,
        };
  } catch (error) {
    console.error("실행 통계 조회 실패:", error);
    return {
      totalRoutinesStarted: 0,
      totalRoutinesCompleted: 0,
      currentActiveRoutines: 0,
      totalExercisesCompleted: 0,
      weeklyCompletionRate: 0,
      longestStreak: 0,
      currentStreak: 0,
    };
  }
}

/**
 * 실행 통계 업데이트
 */
async function updateExecutionStats(completedRoutine: RunningRoutine): Promise<void> {
  try {
    const stats = await getExecutionStats();
    const routines = await getRunningRoutines();

    stats.totalRoutinesCompleted += 1;
    stats.totalExercisesCompleted += completedRoutine.totalExercisesCompleted;
    stats.currentActiveRoutines = routines.filter((r) => r.status === "active").length;

    // 주간 완료율 계산
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const thisWeekProgress = routines
      .flatMap((r) => r.dailyProgress)
      .filter((p) => new Date(p.date) >= thisWeekStart);

    if (thisWeekProgress.length > 0) {
      const completedDays = thisWeekProgress.filter((p) => p.isCompleted).length;
      stats.weeklyCompletionRate = Math.round((completedDays / thisWeekProgress.length) * 100);
    }

    // 연속 완료 일수 계산
    calculateStreaks(routines, stats);

    await AsyncStorage.setItem(ROUTINE_EXECUTION_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error("실행 통계 업데이트 실패:", error);
  }
}

/**
 * 연속 완료 일수 계산
 */
function calculateStreaks(routines: RunningRoutine[], stats: RoutineExecutionStats): void {
  let currentStreak = 0;
  let longestStreak = 0;

  // 모든 루틴의 일일 진행 상황을 날짜순으로 정렬
  const allDailyProgress = routines
    .flatMap((r) => r.dailyProgress)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const progress of allDailyProgress) {
    if (progress.isCompleted) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  stats.currentStreak = currentStreak;
  stats.longestStreak = longestStreak;
}
