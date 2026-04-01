import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createExerciseGoal,
  getExerciseGoals,
  getExerciseGoalsByExerciseId,
  updateGoalProgress,
  getGoalProgress,
  deleteExerciseGoal,
  completeExerciseGoal,
  abandonExerciseGoal,
  getGoalStatistics,
  type ExerciseGoal,
  type GoalInput,
} from "./exercise-goals";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("Exercise Goals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createExerciseGoal", () => {
    it("should create a new exercise goal", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const input: GoalInput = {
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        goalType: "reps",
        targetValue: 20,
        unit: "회",
        period: "weekly",
      };

      const result = await createExerciseGoal(input);

      expect(result.exerciseName).toBe("벤치프레스");
      expect(result.targetValue).toBe(20);
      expect(result.status).toBe("active");
      expect(result.currentValue).toBe(0);
      expect(AsyncStorage.default.setItem).toHaveBeenCalled();
    });

    it("should create goal with end date", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const input: GoalInput = {
        exerciseId: "exercise_1",
        exerciseName: "스쿼트",
        goalType: "weight",
        targetValue: 100,
        unit: "kg",
        period: "monthly",
        endDate: "2026-04-29",
      };

      const result = await createExerciseGoal(input);

      expect(result.endDate).toBe("2026-04-29");
    });
  });

  describe("getExerciseGoals", () => {
    it("should return empty array when no goals exist", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const goals = await getExerciseGoals();

      expect(goals).toEqual([]);
    });

    it("should return saved goals", async () => {
      const mockGoals: ExerciseGoal[] = [
        {
          id: "goal_1",
          exerciseId: "exercise_1",
          exerciseName: "벤치프레스",
          goalType: "reps",
          targetValue: 20,
          currentValue: 15,
          unit: "회",
          period: "weekly",
          status: "active",
          startDate: "2026-03-29",
          progressHistory: [],
          createdAt: "2026-03-29T10:00:00Z",
          updatedAt: "2026-03-29T10:00:00Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockGoals)
      );

      const goals = await getExerciseGoals();

      expect(goals).toHaveLength(1);
      expect(goals[0].exerciseName).toBe("벤치프레스");
    });
  });

  describe("updateGoalProgress", () => {
    it("should update goal progress", async () => {
      const mockGoal: ExerciseGoal = {
        id: "goal_1",
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        goalType: "reps",
        targetValue: 20,
        currentValue: 0,
        unit: "회",
        period: "weekly",
        status: "active",
        startDate: "2026-03-29",
        progressHistory: [],
        createdAt: "2026-03-29T10:00:00Z",
        updatedAt: "2026-03-29T10:00:00Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify([mockGoal])
      );

      const result = await updateGoalProgress("goal_1", 15, "좋은 세션");

      expect(result).not.toBeNull();
      expect(result?.currentValue).toBe(15);
      expect(result?.progressHistory).toHaveLength(1);
    });

    it("should mark goal as completed when target reached", async () => {
      const mockGoal: ExerciseGoal = {
        id: "goal_1",
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        goalType: "reps",
        targetValue: 20,
        currentValue: 0,
        unit: "회",
        period: "weekly",
        status: "active",
        startDate: "2026-03-29",
        progressHistory: [],
        createdAt: "2026-03-29T10:00:00Z",
        updatedAt: "2026-03-29T10:00:00Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify([mockGoal])
      );

      const result = await updateGoalProgress("goal_1", 20);

      expect(result?.status).toBe("completed");
    });
  });

  describe("getGoalProgress", () => {
    it("should calculate progress percentage", async () => {
      const mockGoal: ExerciseGoal = {
        id: "goal_1",
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        goalType: "reps",
        targetValue: 20,
        currentValue: 10,
        unit: "회",
        period: "weekly",
        status: "active",
        startDate: "2026-03-29",
        progressHistory: [{ date: "2026-03-29", value: 10 }],
        createdAt: "2026-03-29T10:00:00Z",
        updatedAt: "2026-03-29T10:00:00Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify([mockGoal])
      );

      const progress = await getGoalProgress("goal_1");

      expect(progress).not.toBeNull();
      expect(progress?.progressPercentage).toBe(50);
      expect(progress?.isCompleted).toBe(false);
    });

    it("should return null if goal not found", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const progress = await getGoalProgress("non_existent");

      expect(progress).toBeNull();
    });
  });

  describe("deleteExerciseGoal", () => {
    it("should delete a goal", async () => {
      const mockGoal: ExerciseGoal = {
        id: "goal_1",
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        goalType: "reps",
        targetValue: 20,
        currentValue: 0,
        unit: "회",
        period: "weekly",
        status: "active",
        startDate: "2026-03-29",
        progressHistory: [],
        createdAt: "2026-03-29T10:00:00Z",
        updatedAt: "2026-03-29T10:00:00Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify([mockGoal])
      );

      const result = await deleteExerciseGoal("goal_1");

      expect(result).toBe(true);
      expect(AsyncStorage.default.setItem).toHaveBeenCalled();
    });

    it("should return false if goal not found", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const result = await deleteExerciseGoal("non_existent");

      expect(result).toBe(false);
    });
  });

  describe("completeExerciseGoal", () => {
    it("should mark goal as completed", async () => {
      const mockGoal: ExerciseGoal = {
        id: "goal_1",
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        goalType: "reps",
        targetValue: 20,
        currentValue: 20,
        unit: "회",
        period: "weekly",
        status: "active",
        startDate: "2026-03-29",
        progressHistory: [],
        createdAt: "2026-03-29T10:00:00Z",
        updatedAt: "2026-03-29T10:00:00Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify([mockGoal])
      );

      const result = await completeExerciseGoal("goal_1");

      expect(result?.status).toBe("completed");
    });
  });

  describe("abandonExerciseGoal", () => {
    it("should mark goal as abandoned", async () => {
      const mockGoal: ExerciseGoal = {
        id: "goal_1",
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        goalType: "reps",
        targetValue: 20,
        currentValue: 10,
        unit: "회",
        period: "weekly",
        status: "active",
        startDate: "2026-03-29",
        progressHistory: [],
        createdAt: "2026-03-29T10:00:00Z",
        updatedAt: "2026-03-29T10:00:00Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify([mockGoal])
      );

      const result = await abandonExerciseGoal("goal_1");

      expect(result?.status).toBe("abandoned");
    });
  });

  describe("getGoalStatistics", () => {
    it("should calculate goal statistics", async () => {
      const mockGoals: ExerciseGoal[] = [
        {
          id: "goal_1",
          exerciseId: "exercise_1",
          exerciseName: "벤치프레스",
          goalType: "reps",
          targetValue: 20,
          currentValue: 20,
          unit: "회",
          period: "weekly",
          status: "completed",
          startDate: "2026-03-29",
          progressHistory: [],
          createdAt: "2026-03-29T10:00:00Z",
          updatedAt: "2026-03-29T10:00:00Z",
        },
        {
          id: "goal_2",
          exerciseId: "exercise_2",
          exerciseName: "스쿼트",
          goalType: "weight",
          targetValue: 100,
          currentValue: 80,
          unit: "kg",
          period: "monthly",
          status: "active",
          startDate: "2026-03-29",
          progressHistory: [],
          createdAt: "2026-03-29T10:00:00Z",
          updatedAt: "2026-03-29T10:00:00Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockGoals)
      );

      const stats = await getGoalStatistics();

      expect(stats.totalGoals).toBe(2);
      expect(stats.activeGoals).toBe(1);
      expect(stats.completedGoals).toBe(1);
      expect(stats.completionRate).toBe(50);
    });
  });

  describe("getExerciseGoalsByExerciseId", () => {
    it("should return active goals for specific exercise", async () => {
      const mockGoals: ExerciseGoal[] = [
        {
          id: "goal_1",
          exerciseId: "exercise_1",
          exerciseName: "벤치프레스",
          goalType: "reps",
          targetValue: 20,
          currentValue: 0,
          unit: "회",
          period: "weekly",
          status: "active",
          startDate: "2026-03-29",
          progressHistory: [],
          createdAt: "2026-03-29T10:00:00Z",
          updatedAt: "2026-03-29T10:00:00Z",
        },
        {
          id: "goal_2",
          exerciseId: "exercise_1",
          exerciseName: "벤치프레스",
          goalType: "weight",
          targetValue: 80,
          currentValue: 0,
          unit: "kg",
          period: "monthly",
          status: "completed",
          startDate: "2026-03-29",
          progressHistory: [],
          createdAt: "2026-03-29T10:00:00Z",
          updatedAt: "2026-03-29T10:00:00Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockGoals)
      );

      const goals = await getExerciseGoalsByExerciseId("exercise_1");

      expect(goals).toHaveLength(1);
      expect(goals[0].status).toBe("active");
    });
  });
});
