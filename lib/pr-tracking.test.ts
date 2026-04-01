import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkAndUpdatePR,
  getPRRecords,
  getExercisePR,
  getPRAchievements,
  getExercisePRAchievements,
  markPRCelebrationShown,
  getUnshownPRAchievements,
  getExercisePRStats,
  clearPRRecords,
  deleteExercisePR,
  type PersonalRecord,
  type PRAchievement,
} from "./pr-tracking";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("PR Tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkAndUpdatePR", () => {
    it("should create first PR record", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const result = await checkAndUpdatePR(
        "exercise_1",
        "벤치프레스",
        10,
        60,
        "session_1"
      );

      expect(result.isNewPR).toBe(true);
      expect(result.prRecord).not.toBeUndefined();
      expect(result.prRecord?.maxReps).toBe(10);
      expect(result.prRecord?.maxWeight).toBe(60);
      expect(AsyncStorage.default.setItem).toHaveBeenCalled();
    });

    it("should detect reps improvement", async () => {
      const existingPR: PersonalRecord = {
        id: "pr_1",
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        maxReps: 8,
        maxWeight: 60,
        maxWeightWithReps: 60,
        achievedDate: "2026-03-29",
        achievedSessionId: "session_1",
        totalPRCount: 1,
        createdAt: "2026-03-29T10:00:00Z",
        updatedAt: "2026-03-29T10:00:00Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify([existingPR])
      );

      const result = await checkAndUpdatePR(
        "exercise_1",
        "벤치프레스",
        10,
        60,
        "session_2"
      );

      expect(result.isNewPR).toBe(true);
      expect(result.achievement?.type).toBe("reps");
      expect(result.achievement?.previousRecord).toBe(8);
      expect(result.achievement?.newRecord).toBe(10);
    });

    it("should detect weight improvement", async () => {
      const existingPR: PersonalRecord = {
        id: "pr_1",
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        maxReps: 8,
        maxWeight: 60,
        maxWeightWithReps: 60,
        achievedDate: "2026-03-29",
        achievedSessionId: "session_1",
        totalPRCount: 1,
        createdAt: "2026-03-29T10:00:00Z",
        updatedAt: "2026-03-29T10:00:00Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify([existingPR])
      );

      const result = await checkAndUpdatePR(
        "exercise_1",
        "벤치프레스",
        8,
        70,
        "session_2"
      );

      expect(result.isNewPR).toBe(true);
      expect(result.achievement?.type).toBe("weight");
      expect(result.achievement?.previousRecord).toBe(60);
      expect(result.achievement?.newRecord).toBe(70);
    });

    it("should detect both reps and weight improvement", async () => {
      const existingPR: PersonalRecord = {
        id: "pr_1",
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        maxReps: 8,
        maxWeight: 60,
        maxWeightWithReps: 60,
        achievedDate: "2026-03-29",
        achievedSessionId: "session_1",
        totalPRCount: 1,
        createdAt: "2026-03-29T10:00:00Z",
        updatedAt: "2026-03-29T10:00:00Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify([existingPR])
      );

      const result = await checkAndUpdatePR(
        "exercise_1",
        "벤치프레스",
        10,
        70,
        "session_2"
      );

      expect(result.isNewPR).toBe(true);
      expect(result.achievement?.type).toBe("both");
    });

    it("should not update if no improvement", async () => {
      const existingPR: PersonalRecord = {
        id: "pr_1",
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        maxReps: 10,
        maxWeight: 60,
        maxWeightWithReps: 60,
        achievedDate: "2026-03-29",
        achievedSessionId: "session_1",
        totalPRCount: 1,
        createdAt: "2026-03-29T10:00:00Z",
        updatedAt: "2026-03-29T10:00:00Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify([existingPR])
      );

      const result = await checkAndUpdatePR(
        "exercise_1",
        "벤치프레스",
        8,
        50,
        "session_2"
      );

      expect(result.isNewPR).toBe(false);
      expect(result.achievement).toBeUndefined();
    });
  });

  describe("getPRRecords", () => {
    it("should return empty array when no records exist", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const records = await getPRRecords();

      expect(records).toEqual([]);
    });
  });

  describe("getExercisePR", () => {
    it("should return PR for specific exercise", async () => {
      const mockPR: PersonalRecord = {
        id: "pr_1",
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        maxReps: 10,
        maxWeight: 60,
        maxWeightWithReps: 60,
        achievedDate: "2026-03-29",
        achievedSessionId: "session_1",
        totalPRCount: 1,
        createdAt: "2026-03-29T10:00:00Z",
        updatedAt: "2026-03-29T10:00:00Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify([mockPR])
      );

      const pr = await getExercisePR("exercise_1");

      expect(pr).not.toBeNull();
      expect(pr?.exerciseName).toBe("벤치프레스");
    });

    it("should return null if no PR found", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const pr = await getExercisePR("exercise_1");

      expect(pr).toBeNull();
    });
  });

  describe("markPRCelebrationShown", () => {
    it("should mark achievement as shown", async () => {
      const mockAchievement: PRAchievement = {
        id: "achievement_1",
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        type: "reps",
        previousRecord: 8,
        newRecord: 10,
        achievedDate: "2026-03-29",
        sessionId: "session_1",
        celebrationShown: false,
        createdAt: "2026-03-29T10:00:00Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify([mockAchievement])
      );

      const result = await markPRCelebrationShown("achievement_1");

      expect(result).toBe(true);
      expect(AsyncStorage.default.setItem).toHaveBeenCalled();
    });
  });

  describe("getUnshownPRAchievements", () => {
    it("should return only unshown achievements", async () => {
      const achievements: PRAchievement[] = [
        {
          id: "achievement_1",
          exerciseId: "exercise_1",
          exerciseName: "벤치프레스",
          type: "reps",
          previousRecord: 8,
          newRecord: 10,
          achievedDate: "2026-03-29",
          sessionId: "session_1",
          celebrationShown: false,
          createdAt: "2026-03-29T10:00:00Z",
        },
        {
          id: "achievement_2",
          exerciseId: "exercise_1",
          exerciseName: "벤치프레스",
          type: "weight",
          previousRecord: 60,
          newRecord: 70,
          achievedDate: "2026-03-29",
          sessionId: "session_2",
          celebrationShown: true,
          createdAt: "2026-03-29T10:00:00Z",
        },
      ];

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(achievements)
      );

      const unshown = await getUnshownPRAchievements();

      expect(unshown).toHaveLength(1);
      expect(unshown[0].celebrationShown).toBe(false);
    });
  });

  describe("getExercisePRStats", () => {
    it("should return stats for exercise with PR", async () => {
      const mockPR: PersonalRecord = {
        id: "pr_1",
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        maxReps: 10,
        maxWeight: 60,
        maxWeightWithReps: 60,
        achievedDate: "2026-03-29",
        achievedSessionId: "session_1",
        totalPRCount: 3,
        createdAt: "2026-03-29T10:00:00Z",
        updatedAt: "2026-03-29T10:00:00Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify([mockPR])
      );

      const stats = await getExercisePRStats("exercise_1");

      expect(stats.hasPR).toBe(true);
      expect(stats.maxReps).toBe(10);
      expect(stats.totalAchievements).toBe(3);
    });
  });

  describe("deleteExercisePR", () => {
    it("should delete exercise PR", async () => {
      const mockPR: PersonalRecord = {
        id: "pr_1",
        exerciseId: "exercise_1",
        exerciseName: "벤치프레스",
        maxReps: 10,
        maxWeight: 60,
        maxWeightWithReps: 60,
        achievedDate: "2026-03-29",
        achievedSessionId: "session_1",
        totalPRCount: 1,
        createdAt: "2026-03-29T10:00:00Z",
        updatedAt: "2026-03-29T10:00:00Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify([mockPR])
      );

      const result = await deleteExercisePR("exercise_1");

      expect(result).toBe(true);
      expect(AsyncStorage.default.setItem).toHaveBeenCalled();
    });
  });

  describe("clearPRRecords", () => {
    it("should clear all PR records", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");

      await clearPRRecords();

      expect(AsyncStorage.default.removeItem).toHaveBeenCalledWith("exercise_pr_records");
      expect(AsyncStorage.default.removeItem).toHaveBeenCalledWith("exercise_pr_achievements");
    });
  });
});
