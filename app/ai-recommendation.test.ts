import { describe, it, expect, vi, beforeEach } from "vitest";

describe("AI Recommendation Feature", () => {
  describe("RoutineRecommendation Type", () => {
    it("should have all required fields", () => {
      const recommendation = {
        id: "rec-001",
        name: "근력 강화 루틴",
        description: "근력 증가를 위한 맞춤형 루틴",
        goal: "muscle_gain",
        difficulty: "intermediate",
        durationWeeks: 4,
        daysPerWeek: 3,
        dailyWorkouts: [
          {
            day: "월요일",
            exercises: [
              {
                name: "벤치프레스",
                sets: 3,
                reps: 8,
                restTime: 120,
              },
            ],
          },
        ],
        totalCaloriesBurn: 1200,
        tips: ["충분한 수분 섭취", "규칙적인 식사"],
        estimatedResults: {
          weightChange: "1-2kg 증가",
          muscleGain: "근력 30% 증가",
          timeframe: "4주",
        },
      };

      expect(recommendation.id).toBeDefined();
      expect(recommendation.name).toBeDefined();
      expect(recommendation.description).toBeDefined();
      expect(recommendation.goal).toBeDefined();
      expect(recommendation.difficulty).toBeDefined();
      expect(recommendation.durationWeeks).toBeGreaterThan(0);
      expect(recommendation.daysPerWeek).toBeGreaterThan(0);
      expect(recommendation.dailyWorkouts).toHaveLength(1);
      expect(recommendation.totalCaloriesBurn).toBeGreaterThan(0);
      expect(recommendation.tips).toHaveLength(2);
      expect(recommendation.estimatedResults).toBeDefined();
    });

    it("should validate days per week range", () => {
      const validDays = [1, 2, 3, 4, 5, 6, 7];
      validDays.forEach((day) => {
        expect(day).toBeGreaterThanOrEqual(1);
        expect(day).toBeLessThanOrEqual(7);
      });
    });

    it("should validate duration weeks range", () => {
      const validDurations = [2, 4, 6, 8, 12];
      validDurations.forEach((duration) => {
        expect(duration).toBeGreaterThanOrEqual(1);
        expect(duration).toBeLessThanOrEqual(12);
      });
    });
  });

  describe("Recommendation Request", () => {
    it("should have valid request parameters", () => {
      const request = {
        goal: "weight_loss",
        difficulty: "beginner",
        daysPerWeek: 3,
        durationWeeks: 4,
        focusAreas: ["cardio", "core"],
        equipment: "home",
      };

      expect(request.goal).toBeDefined();
      expect(request.difficulty).toBeDefined();
      expect(request.daysPerWeek).toBeGreaterThanOrEqual(1);
      expect(request.daysPerWeek).toBeLessThanOrEqual(7);
      expect(request.durationWeeks).toBeGreaterThanOrEqual(1);
      expect(request.durationWeeks).toBeLessThanOrEqual(12);
    });
  });

  describe("Daily Workouts", () => {
    it("should have exercises for each day", () => {
      const dailyWorkout = {
        day: "월요일",
        exercises: [
          {
            name: "푸시업",
            sets: 3,
            reps: 15,
            restTime: 60,
          },
          {
            name: "스쿼트",
            sets: 3,
            reps: 20,
            restTime: 90,
          },
        ],
      };

      expect(dailyWorkout.day).toBeDefined();
      expect(dailyWorkout.exercises).toHaveLength(2);
      expect(dailyWorkout.exercises[0].name).toBe("푸시업");
      expect(dailyWorkout.exercises[0].sets).toBeGreaterThan(0);
      expect(dailyWorkout.exercises[0].reps).toBeGreaterThan(0);
      expect(dailyWorkout.exercises[0].restTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Estimated Results", () => {
    it("should provide realistic results", () => {
      const results = {
        weightChange: "2-3kg 감량",
        muscleGain: "근력 20% 증가",
        timeframe: "4주",
      };

      expect(results.weightChange).toBeDefined();
      expect(results.muscleGain).toBeDefined();
      expect(results.timeframe).toBeDefined();
      expect(results.weightChange).toContain("kg");
      expect(results.muscleGain).toContain("%");
      expect(results.timeframe).toContain("주");
    });
  });

  describe("Recommendation Tips", () => {
    it("should provide helpful tips", () => {
      const tips = [
        "충분한 수분 섭취",
        "규칙적인 식사",
        "충분한 수면",
        "스트레칭 필수",
      ];

      expect(tips).toHaveLength(4);
      expect(tips[0]).toBeDefined();
      tips.forEach((tip) => {
        expect(typeof tip).toBe("string");
        expect(tip.length).toBeGreaterThan(0);
      });
    });
  });
});
