import AsyncStorage from "@react-native-async-storage/async-storage";

const GOALS_STORAGE_KEY = "exercise_goals";

export type GoalType = "reps" | "weight" | "duration" | "frequency";
export type GoalPeriod = "weekly" | "monthly" | "yearly";
export type GoalStatus = "active" | "completed" | "abandoned";

export interface ExerciseGoal {
  id: string;
  exerciseId: string;
  exerciseName: string;
  goalType: GoalType; // 목표 유형
  targetValue: number; // 목표값
  currentValue: number; // 현재값
  unit: string; // 단위 (회, kg, 분, 회/주)
  period: GoalPeriod; // 기간
  status: GoalStatus; // 상태
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  progressHistory: ProgressEntry[]; // 진행 이력
  createdAt: string;
  updatedAt: string;
}

export interface ProgressEntry {
  date: string; // YYYY-MM-DD
  value: number;
  note?: string;
}

export interface GoalInput {
  exerciseId: string;
  exerciseName: string;
  goalType: GoalType;
  targetValue: number;
  unit: string;
  period: GoalPeriod;
  startDate?: string;
  endDate?: string;
}

export interface GoalProgress {
  goal: ExerciseGoal;
  progressPercentage: number;
  daysRemaining?: number;
  isCompleted: boolean;
  isOnTrack: boolean;
}

/**
 * 모든 운동 목표를 가져옵니다.
 */
export async function getExerciseGoals(): Promise<ExerciseGoal[]> {
  try {
    const data = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("운동 목표 로드 실패:", error);
    return [];
  }
}

/**
 * 특정 운동의 목표를 가져옵니다.
 */
export async function getExerciseGoalsByExerciseId(exerciseId: string): Promise<ExerciseGoal[]> {
  try {
    const goals = await getExerciseGoals();
    return goals.filter((g) => g.exerciseId === exerciseId && g.status === "active");
  } catch (error) {
    console.error("운동 목표 조회 실패:", error);
    return [];
  }
}

/**
 * 새로운 운동 목표를 생성합니다.
 */
export async function createExerciseGoal(input: GoalInput): Promise<ExerciseGoal> {
  try {
    const goals = await getExerciseGoals();
    const now = new Date().toISOString();
    const today = now.split("T")[0];

    const newGoal: ExerciseGoal = {
      id: `goal_${input.exerciseId}_${Date.now()}`,
      exerciseId: input.exerciseId,
      exerciseName: input.exerciseName,
      goalType: input.goalType,
      targetValue: input.targetValue,
      currentValue: 0,
      unit: input.unit,
      period: input.period,
      status: "active",
      startDate: input.startDate || today,
      endDate: input.endDate,
      progressHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    goals.push(newGoal);
    await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    return newGoal;
  } catch (error) {
    console.error("운동 목표 생성 실패:", error);
    throw error;
  }
}

/**
 * 목표 진행도를 업데이트합니다.
 */
export async function updateGoalProgress(
  goalId: string,
  value: number,
  note?: string
): Promise<ExerciseGoal | null> {
  try {
    const goals = await getExerciseGoals();
    const index = goals.findIndex((g) => g.id === goalId);

    if (index === -1) {
      console.error("목표를 찾을 수 없습니다:", goalId);
      return null;
    }

    const goal = goals[index];
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();

    // 진행 이력에 추가
    const existingEntryIndex = goal.progressHistory.findIndex((p) => p.date === today);
    if (existingEntryIndex !== -1) {
      goal.progressHistory[existingEntryIndex].value = value;
      if (note) goal.progressHistory[existingEntryIndex].note = note;
    } else {
      goal.progressHistory.push({ date: today, value, note });
    }

    // 현재값 업데이트
    goal.currentValue = Math.max(...goal.progressHistory.map((p) => p.value), 0);

    // 목표 달성 확인
    if (goal.currentValue >= goal.targetValue) {
      goal.status = "completed";
    }

    goal.updatedAt = now;
    goals[index] = goal;

    await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    return goal;
  } catch (error) {
    console.error("목표 진행도 업데이트 실패:", error);
    throw error;
  }
}

/**
 * 목표를 업데이트합니다.
 */
export async function updateExerciseGoal(
  goalId: string,
  updates: Partial<ExerciseGoal>
): Promise<ExerciseGoal | null> {
  try {
    const goals = await getExerciseGoals();
    const index = goals.findIndex((g) => g.id === goalId);

    if (index === -1) {
      console.error("목표를 찾을 수 없습니다:", goalId);
      return null;
    }

    const now = new Date().toISOString();
    goals[index] = {
      ...goals[index],
      ...updates,
      updatedAt: now,
    };

    await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    return goals[index];
  } catch (error) {
    console.error("목표 업데이트 실패:", error);
    throw error;
  }
}

/**
 * 목표를 삭제합니다.
 */
export async function deleteExerciseGoal(goalId: string): Promise<boolean> {
  try {
    const goals = await getExerciseGoals();
    const filtered = goals.filter((g) => g.id !== goalId);

    if (filtered.length === goals.length) {
      console.warn("삭제할 목표를 찾을 수 없습니다:", goalId);
      return false;
    }

    await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("목표 삭제 실패:", error);
    throw error;
  }
}

/**
 * 목표 진행도를 계산합니다.
 */
export async function getGoalProgress(goalId: string): Promise<GoalProgress | null> {
  try {
    const goals = await getExerciseGoals();
    const goal = goals.find((g) => g.id === goalId);

    if (!goal) {
      return null;
    }

    const progressPercentage = Math.min(
      (goal.currentValue / goal.targetValue) * 100,
      100
    );

    let daysRemaining: number | undefined;
    if (goal.endDate) {
      const today = new Date();
      const endDate = new Date(goal.endDate);
      daysRemaining = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // 목표 달성 추적 (기간별로 필요한 일일 진행도 계산)
    let isOnTrack = true;
    if (goal.endDate && goal.progressHistory.length > 0) {
      const startDate = new Date(goal.startDate);
      const endDate = new Date(goal.endDate);
      const totalDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const requiredDailyProgress = goal.targetValue / totalDays;
      const actualProgress = goal.currentValue / goal.progressHistory.length;

      isOnTrack = actualProgress >= requiredDailyProgress * 0.9; // 90% 이상 달성하면 추적 중
    }

    return {
      goal,
      progressPercentage,
      daysRemaining,
      isCompleted: goal.status === "completed",
      isOnTrack,
    };
  } catch (error) {
    console.error("목표 진행도 계산 실패:", error);
    throw error;
  }
}

/**
 * 모든 활성 목표의 진행도를 가져옵니다.
 */
export async function getAllGoalProgress(): Promise<GoalProgress[]> {
  try {
    const goals = await getExerciseGoals();
    const progressList: GoalProgress[] = [];

    for (const goal of goals) {
      const progress = await getGoalProgress(goal.id);
      if (progress) {
        progressList.push(progress);
      }
    }

    return progressList;
  } catch (error) {
    console.error("모든 목표 진행도 조회 실패:", error);
    return [];
  }
}

/**
 * 목표를 완료 상태로 표시합니다.
 */
export async function completeExerciseGoal(goalId: string): Promise<ExerciseGoal | null> {
  try {
    return await updateExerciseGoal(goalId, { status: "completed" });
  } catch (error) {
    console.error("목표 완료 실패:", error);
    throw error;
  }
}

/**
 * 목표를 포기 상태로 표시합니다.
 */
export async function abandonExerciseGoal(goalId: string): Promise<ExerciseGoal | null> {
  try {
    return await updateExerciseGoal(goalId, { status: "abandoned" });
  } catch (error) {
    console.error("목표 포기 실패:", error);
    throw error;
  }
}

/**
 * 모든 목표를 삭제합니다.
 */
export async function clearAllGoals(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GOALS_STORAGE_KEY);
  } catch (error) {
    console.error("모든 목표 삭제 실패:", error);
    throw error;
  }
}

/**
 * 기간별 활성 목표를 가져옵니다.
 */
export async function getGoalsByPeriod(period: GoalPeriod): Promise<ExerciseGoal[]> {
  try {
    const goals = await getExerciseGoals();
    return goals.filter((g) => g.period === period && g.status === "active");
  } catch (error) {
    console.error("기간별 목표 조회 실패:", error);
    return [];
  }
}

/**
 * 목표 유형별 통계를 가져옵니다.
 */
export async function getGoalStatistics() {
  try {
    const goals = await getExerciseGoals();
    const activeGoals = goals.filter((g) => g.status === "active");
    const completedGoals = goals.filter((g) => g.status === "completed");
    const abandonedGoals = goals.filter((g) => g.status === "abandoned");

    const completionRate =
      goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0;

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      abandonedGoals: abandonedGoals.length,
      completionRate,
    };
  } catch (error) {
    console.error("목표 통계 조회 실패:", error);
    throw error;
  }
}
