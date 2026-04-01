import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCustomExercises,
  addCustomExercise,
  updateCustomExercise,
  deleteCustomExercise,
  getCustomExercisesByMuscleGroup,
  getCustomExercisesByDifficulty,
  clearCustomExercises,
  type CustomExercise,
  type CustomExerciseInput,
} from "./custom-exercises";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("Custom Exercises", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCustomExercises", () => {
    it("should return empty array when no exercises exist", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const exercises = await getCustomExercises();

      expect(exercises).toEqual([]);
    });

    it("should return saved exercises", async () => {
      const mockExercises: CustomExercise[] = [
        {
          id: "custom_1",
          name: "덤벨 벤치프레스",
          description: "가슴 운동",
          sets: 3,
          reps: 8,
          restTime: 120,
          muscleGroups: ["가슴"],
          difficulty: "intermediate",
          createdAt: "2026-03-29T10:00:00.000Z",
          updatedAt: "2026-03-29T10:00:00.000Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockExercises)
      );

      const exercises = await getCustomExercises();

      expect(exercises).toHaveLength(1);
      expect(exercises[0].name).toBe("덤벨 벤치프레스");
    });
  });

  describe("addCustomExercise", () => {
    it("should add a new exercise", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const input: CustomExerciseInput = {
        name: "스쿼트",
        description: "다리 운동",
        sets: 4,
        reps: 10,
        restTime: 90,
        muscleGroups: ["다리"],
        difficulty: "beginner",
      };

      const result = await addCustomExercise(input);

      expect(result.name).toBe("스쿼트");
      expect(result.id).toMatch(/^custom_/);
      expect(result.createdAt).toBeDefined();
      expect(AsyncStorage.default.setItem).toHaveBeenCalled();
    });
  });

  describe("updateCustomExercise", () => {
    it("should update an existing exercise", async () => {
      const mockExercises: CustomExercise[] = [
        {
          id: "custom_1",
          name: "덤벨 벤치프레스",
          description: "가슴 운동",
          sets: 3,
          reps: 8,
          restTime: 120,
          muscleGroups: ["가슴"],
          difficulty: "intermediate",
          createdAt: "2026-03-29T10:00:00.000Z",
          updatedAt: "2026-03-29T10:00:00.000Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockExercises)
      );

      const result = await updateCustomExercise("custom_1", { sets: 4 });

      expect(result).not.toBeNull();
      expect(result?.sets).toBe(4);
      expect(AsyncStorage.default.setItem).toHaveBeenCalled();
    });

    it("should return null if exercise not found", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const result = await updateCustomExercise("non_existent", { sets: 5 });

      expect(result).toBeNull();
    });
  });

  describe("deleteCustomExercise", () => {
    it("should delete an exercise", async () => {
      const mockExercises: CustomExercise[] = [
        {
          id: "custom_1",
          name: "덤벨 벤치프레스",
          description: "가슴 운동",
          sets: 3,
          reps: 8,
          restTime: 120,
          muscleGroups: ["가슴"],
          difficulty: "intermediate",
          createdAt: "2026-03-29T10:00:00.000Z",
          updatedAt: "2026-03-29T10:00:00.000Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockExercises)
      );

      const result = await deleteCustomExercise("custom_1");

      expect(result).toBe(true);
      expect(AsyncStorage.default.setItem).toHaveBeenCalled();
    });

    it("should return false if exercise not found", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const result = await deleteCustomExercise("non_existent");

      expect(result).toBe(false);
    });
  });

  describe("getCustomExercisesByMuscleGroup", () => {
    it("should filter exercises by muscle group", async () => {
      const mockExercises: CustomExercise[] = [
        {
          id: "custom_1",
          name: "벤치프레스",
          description: "가슴 운동",
          sets: 3,
          reps: 8,
          restTime: 120,
          muscleGroups: ["가슴"],
          difficulty: "intermediate",
          createdAt: "2026-03-29T10:00:00.000Z",
          updatedAt: "2026-03-29T10:00:00.000Z",
        },
        {
          id: "custom_2",
          name: "스쿼트",
          description: "다리 운동",
          sets: 4,
          reps: 10,
          restTime: 90,
          muscleGroups: ["다리"],
          difficulty: "beginner",
          createdAt: "2026-03-29T10:00:00.000Z",
          updatedAt: "2026-03-29T10:00:00.000Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockExercises)
      );

      const result = await getCustomExercisesByMuscleGroup("가슴");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("벤치프레스");
    });
  });

  describe("getCustomExercisesByDifficulty", () => {
    it("should filter exercises by difficulty", async () => {
      const mockExercises: CustomExercise[] = [
        {
          id: "custom_1",
          name: "벤치프레스",
          description: "가슴 운동",
          sets: 3,
          reps: 8,
          restTime: 120,
          muscleGroups: ["가슴"],
          difficulty: "intermediate",
          createdAt: "2026-03-29T10:00:00.000Z",
          updatedAt: "2026-03-29T10:00:00.000Z",
        },
        {
          id: "custom_2",
          name: "스쿼트",
          description: "다리 운동",
          sets: 4,
          reps: 10,
          restTime: 90,
          muscleGroups: ["다리"],
          difficulty: "beginner",
          createdAt: "2026-03-29T10:00:00.000Z",
          updatedAt: "2026-03-29T10:00:00.000Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockExercises)
      );

      const result = await getCustomExercisesByDifficulty("beginner");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("스쿼트");
    });
  });

  describe("clearCustomExercises", () => {
    it("should clear all exercises", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");

      await clearCustomExercises();

      expect(AsyncStorage.default.removeItem).toHaveBeenCalledWith("custom_exercises");
    });
  });

  describe("CustomExerciseInput Type", () => {
    it("should create valid exercise input", () => {
      const input: CustomExerciseInput = {
        name: "덤벨 컬",
        description: "이두 운동",
        sets: 3,
        reps: 12,
        restTime: 60,
        muscleGroups: ["이두"],
        difficulty: "beginner",
        youtubeVideoId: "dQw4w9WgXcQ",
        notes: "천천히 수행",
      };

      expect(input.name).toBe("덤벨 컬");
      expect(input.sets).toBe(3);
      expect(input.youtubeVideoId).toBeDefined();
    });
  });
});
