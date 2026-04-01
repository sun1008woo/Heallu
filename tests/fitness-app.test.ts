import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

import { EXERCISES, WORKOUT_CATEGORIES, getExercisesByCategory, getExerciseById } from "../lib/exercises-data";

describe("Exercise Data", () => {
  it("should have exercises defined", () => {
    expect(EXERCISES.length).toBeGreaterThan(0);
  });

  it("should have workout categories defined", () => {
    expect(WORKOUT_CATEGORIES.length).toBeGreaterThan(0);
  });

  it("should find exercise by id", () => {
    const exercise = getExerciseById("push-up");
    expect(exercise).toBeDefined();
    expect(exercise?.name).toBe("푸시업");
  });

  it("should return undefined for unknown exercise id", () => {
    const exercise = getExerciseById("unknown-exercise");
    expect(exercise).toBeUndefined();
  });

  it("should filter exercises by category", () => {
    const strengthExercises = getExercisesByCategory("strength");
    expect(strengthExercises.length).toBeGreaterThan(0);
    strengthExercises.forEach((ex) => {
      expect(ex.category).toBe("strength");
    });
  });

  it("should have required fields for each exercise", () => {
    EXERCISES.forEach((ex) => {
      expect(ex.id).toBeTruthy();
      expect(ex.name).toBeTruthy();
      expect(ex.category).toBeTruthy();
      expect(ex.difficulty).toMatch(/beginner|intermediate|advanced/);
      expect(ex.muscleGroups.length).toBeGreaterThan(0);
      expect(ex.sets).toBeGreaterThan(0);
      expect(ex.restTime).toBeGreaterThanOrEqual(0);
      expect(ex.instructions.length).toBeGreaterThan(0);
    });
  });
});

describe("Storage Functions", () => {
  it("should return default profile when no data stored", async () => {
    const { getUserProfile } = await import("../lib/storage");
    const profile = await getUserProfile();
    expect(profile).toBeDefined();
    expect(profile.name).toBeTruthy();
    expect(profile.goal).toBeTruthy();
    expect(profile.fitnessLevel).toBeTruthy();
  });

  it("should return empty array for workout sessions when no data", async () => {
    const { getWorkoutSessions } = await import("../lib/storage");
    const sessions = await getWorkoutSessions();
    expect(Array.isArray(sessions)).toBe(true);
  });

  it("should return default stats when no data stored", async () => {
    const { getProgressStats } = await import("../lib/storage");
    const stats = await getProgressStats();
    expect(stats).toBeDefined();
    expect(stats.totalWorkouts).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(Array.isArray(stats.weeklyWorkouts)).toBe(true);
    expect(stats.weeklyWorkouts.length).toBe(7);
  });
});
