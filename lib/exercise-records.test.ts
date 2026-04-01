import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getExerciseRecords,
  addExerciseRecord,
  updateExerciseRecord,
  deleteExerciseRecord,
  getExerciseRecordsByExerciseId,
  getExerciseRecordsByDate,
  getExerciseRecordsByDateRange,
  getExerciseStats,
  getWeeklyActivitySummary,
  clearExerciseRecords,
  type ExerciseSessionRecord,
  type ExerciseRecordInput,
} from "./exercise-records";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("Exercise Records", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getExerciseRecords", () => {
    it("should return empty array when no records exist", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const records = await getExerciseRecords();

      expect(records).toEqual([]);
    });

    it("should return saved records", async () => {
      const mockRecords: ExerciseSessionRecord[] = [
        {
          id: "record_1",
          exerciseId: "exercise_1",
          exerciseName: "벤치프레스",
          date: "2026-03-29",
          sets: [
            { setNumber: 1, completedReps: 8, weight: 60, timestamp: "2026-03-29T10:00:00Z" },
          ],
          createdAt: "2026-03-29T10:00:00Z",
          updatedAt: "2026-03-29T10:00:00Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockRecords)
      );

      const records = await getExerciseRecords();

      expect(records).toHaveLength(1);
      expect(records[0].exerciseName).toBe("벤치프레스");
    });
  });

  describe("addExerciseRecord", () => {
    it("should add a new exercise record", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const input: ExerciseRecordInput = {
        exerciseId: "exercise_1",
        exerciseName: "스쿼트",
        date: "2026-03-29",
        sets: [
          { setNumber: 1, completedReps: 10, weight: 100 },
          { setNumber: 2, completedReps: 10, weight: 100 },
        ],
        totalDuration: 600,
      };

      const result = await addExerciseRecord(input);

      expect(result.exerciseName).toBe("스쿼트");
      expect(result.sets).toHaveLength(2);
      expect(result.id).toMatch(/^record_/);
      expect(AsyncStorage.default.setItem).toHaveBeenCalled();
    });
  });

  describe("updateExerciseRecord", () => {
    it("should update an existing record", async () => {
      const mockRecords: ExerciseSessionRecord[] = [
        {
          id: "record_1",
          exerciseId: "exercise_1",
          exerciseName: "벤치프레스",
          date: "2026-03-29",
          sets: [
            { setNumber: 1, completedReps: 8, weight: 60, timestamp: "2026-03-29T10:00:00Z" },
          ],
          createdAt: "2026-03-29T10:00:00Z",
          updatedAt: "2026-03-29T10:00:00Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockRecords)
      );

      const result = await updateExerciseRecord("record_1", {
        sets: [{ setNumber: 1, completedReps: 10, weight: 65 }],
      });

      expect(result).not.toBeNull();
      expect(result?.sets[0].completedReps).toBe(10);
    });

    it("should return null if record not found", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const result = await updateExerciseRecord("non_existent", {
        sets: [{ setNumber: 1, completedReps: 10 }],
      });

      expect(result).toBeNull();
    });
  });

  describe("deleteExerciseRecord", () => {
    it("should delete a record", async () => {
      const mockRecords: ExerciseSessionRecord[] = [
        {
          id: "record_1",
          exerciseId: "exercise_1",
          exerciseName: "벤치프레스",
          date: "2026-03-29",
          sets: [
            { setNumber: 1, completedReps: 8, weight: 60, timestamp: "2026-03-29T10:00:00Z" },
          ],
          createdAt: "2026-03-29T10:00:00Z",
          updatedAt: "2026-03-29T10:00:00Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockRecords)
      );

      const result = await deleteExerciseRecord("record_1");

      expect(result).toBe(true);
      expect(AsyncStorage.default.setItem).toHaveBeenCalled();
    });

    it("should return false if record not found", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const result = await deleteExerciseRecord("non_existent");

      expect(result).toBe(false);
    });
  });

  describe("getExerciseRecordsByExerciseId", () => {
    it("should filter records by exercise id", async () => {
      const mockRecords: ExerciseSessionRecord[] = [
        {
          id: "record_1",
          exerciseId: "exercise_1",
          exerciseName: "벤치프레스",
          date: "2026-03-29",
          sets: [
            { setNumber: 1, completedReps: 8, weight: 60, timestamp: "2026-03-29T10:00:00Z" },
          ],
          createdAt: "2026-03-29T10:00:00Z",
          updatedAt: "2026-03-29T10:00:00Z",
        },
        {
          id: "record_2",
          exerciseId: "exercise_2",
          exerciseName: "스쿼트",
          date: "2026-03-29",
          sets: [
            { setNumber: 1, completedReps: 10, weight: 100, timestamp: "2026-03-29T10:00:00Z" },
          ],
          createdAt: "2026-03-29T10:00:00Z",
          updatedAt: "2026-03-29T10:00:00Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockRecords)
      );

      const result = await getExerciseRecordsByExerciseId("exercise_1");

      expect(result).toHaveLength(1);
      expect(result[0].exerciseName).toBe("벤치프레스");
    });
  });

  describe("getExerciseRecordsByDate", () => {
    it("should filter records by date", async () => {
      const mockRecords: ExerciseSessionRecord[] = [
        {
          id: "record_1",
          exerciseId: "exercise_1",
          exerciseName: "벤치프레스",
          date: "2026-03-29",
          sets: [
            { setNumber: 1, completedReps: 8, weight: 60, timestamp: "2026-03-29T10:00:00Z" },
          ],
          createdAt: "2026-03-29T10:00:00Z",
          updatedAt: "2026-03-29T10:00:00Z",
        },
        {
          id: "record_2",
          exerciseId: "exercise_2",
          exerciseName: "스쿼트",
          date: "2026-03-28",
          sets: [
            { setNumber: 1, completedReps: 10, weight: 100, timestamp: "2026-03-28T10:00:00Z" },
          ],
          createdAt: "2026-03-28T10:00:00Z",
          updatedAt: "2026-03-28T10:00:00Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockRecords)
      );

      const result = await getExerciseRecordsByDate("2026-03-29");

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe("2026-03-29");
    });
  });

  describe("getExerciseStats", () => {
    it("should calculate exercise statistics", async () => {
      const mockRecords: ExerciseSessionRecord[] = [
        {
          id: "record_1",
          exerciseId: "exercise_1",
          exerciseName: "벤치프레스",
          date: "2026-03-29",
          sets: [
            { setNumber: 1, completedReps: 8, weight: 60, timestamp: "2026-03-29T10:00:00Z" },
            { setNumber: 2, completedReps: 8, weight: 60, timestamp: "2026-03-29T10:00:00Z" },
          ],
          createdAt: "2026-03-29T10:00:00Z",
          updatedAt: "2026-03-29T10:00:00Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockRecords)
      );

      const stats = await getExerciseStats("exercise_1");

      expect(stats.totalSessions).toBe(1);
      expect(stats.totalSets).toBe(2);
      expect(stats.totalReps).toBe(16);
      expect(stats.maxReps).toBe(8);
    });

    it("should return zero stats when no records exist", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const stats = await getExerciseStats("exercise_1");

      expect(stats.totalSessions).toBe(0);
      expect(stats.totalSets).toBe(0);
      expect(stats.totalReps).toBe(0);
    });
  });

  describe("getWeeklyActivitySummary", () => {
    it("should return weekly activity summary", async () => {
      const mockRecords: ExerciseSessionRecord[] = [
        {
          id: "record_1",
          exerciseId: "exercise_1",
          exerciseName: "벤치프레스",
          date: "2026-03-29",
          sets: [
            { setNumber: 1, completedReps: 8, weight: 60, timestamp: "2026-03-29T10:00:00Z" },
          ],
          createdAt: "2026-03-29T10:00:00Z",
          updatedAt: "2026-03-29T10:00:00Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(mockRecords)
      );

      const summary = await getWeeklyActivitySummary("2026-03-29");

      expect(Object.keys(summary)).toHaveLength(7);
      expect(summary["2026-03-29"]).toBe(1);
    });
  });

  describe("clearExerciseRecords", () => {
    it("should clear all records", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");

      await clearExerciseRecords();

      expect(AsyncStorage.default.removeItem).toHaveBeenCalledWith("exercise_records");
    });
  });
});
