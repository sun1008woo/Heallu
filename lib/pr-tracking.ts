import AsyncStorage from "@react-native-async-storage/async-storage";

const PR_STORAGE_KEY = "exercise_pr_records";
const PR_ACHIEVEMENTS_KEY = "exercise_pr_achievements";

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  maxReps: number;
  maxWeight?: number; // in kg
  maxWeightWithReps?: number; // weight at which max reps was achieved
  achievedDate: string;
  achievedSessionId: string;
  totalPRCount: number; // total number of PR achievements
  createdAt: string;
  updatedAt: string;
}

export interface PRAchievement {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: "reps" | "weight" | "both"; // type of PR achieved
  previousRecord: number;
  newRecord: number;
  achievedDate: string;
  sessionId: string;
  celebrationShown: boolean;
  createdAt: string;
}

export interface PRCheckResult {
  isNewPR: boolean;
  achievement?: PRAchievement;
  prRecord?: PersonalRecord;
  improvementPercentage?: number;
}

/**
 * 모든 PR 기록을 가져옵니다.
 */
export async function getPRRecords(): Promise<PersonalRecord[]> {
  try {
    const data = await AsyncStorage.getItem(PR_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("PR 기록 로드 실패:", error);
    return [];
  }
}

/**
 * 특정 운동의 PR을 가져옵니다.
 */
export async function getExercisePR(exerciseId: string): Promise<PersonalRecord | null> {
  try {
    const records = await getPRRecords();
    return records.find((r) => r.exerciseId === exerciseId) || null;
  } catch (error) {
    console.error("운동 PR 조회 실패:", error);
    return null;
  }
}

/**
 * 새로운 운동 기록이 PR인지 확인하고 업데이트합니다.
 */
export async function checkAndUpdatePR(
  exerciseId: string,
  exerciseName: string,
  completedReps: number,
  weight?: number,
  sessionId?: string
): Promise<PRCheckResult> {
  try {
    const records = await getPRRecords();
    const existingPR = records.find((r) => r.exerciseId === exerciseId);
    const now = new Date().toISOString();
    const today = now.split("T")[0];

    let isNewPR = false;
    let achievement: PRAchievement | undefined;
    let prRecord: PersonalRecord | undefined;
    let improvementPercentage: number | undefined;

    if (!existingPR) {
      // 첫 번째 기록 - 자동으로 PR
      const newPR: PersonalRecord = {
        id: `pr_${exerciseId}_${Date.now()}`,
        exerciseId,
        exerciseName,
        maxReps: completedReps,
        maxWeight: weight,
        maxWeightWithReps: weight,
        achievedDate: today,
        achievedSessionId: sessionId || "",
        totalPRCount: 1,
        createdAt: now,
        updatedAt: now,
      };

      records.push(newPR);
      prRecord = newPR;
      isNewPR = true;

      achievement = {
        id: `achievement_${Date.now()}`,
        exerciseId,
        exerciseName,
        type: "reps",
        previousRecord: 0,
        newRecord: completedReps,
        achievedDate: today,
        sessionId: sessionId || "",
        celebrationShown: false,
        createdAt: now,
      };
    } else {
      // 기존 PR과 비교
      let repsImproved = false;
      let weightImproved = false;

      if (completedReps > existingPR.maxReps) {
        repsImproved = true;
        improvementPercentage = ((completedReps - existingPR.maxReps) / existingPR.maxReps) * 100;
      }

      if (weight && (!existingPR.maxWeight || weight > existingPR.maxWeight)) {
        weightImproved = true;
      }

      if (repsImproved || weightImproved) {
        isNewPR = true;

        const updatedPR: PersonalRecord = {
          ...existingPR,
          maxReps: repsImproved ? completedReps : existingPR.maxReps,
          maxWeight: weightImproved ? weight : existingPR.maxWeight,
          maxWeightWithReps: repsImproved && weight ? weight : existingPR.maxWeightWithReps,
          achievedDate: today,
          achievedSessionId: sessionId || "",
          totalPRCount: existingPR.totalPRCount + 1,
          updatedAt: now,
        };

        const index = records.findIndex((r) => r.exerciseId === exerciseId);
        records[index] = updatedPR;
        prRecord = updatedPR;

        let achievementType: "reps" | "weight" | "both" = "reps";
        if (repsImproved && weightImproved) {
          achievementType = "both";
        } else if (weightImproved) {
          achievementType = "weight";
        }

        achievement = {
          id: `achievement_${Date.now()}`,
          exerciseId,
          exerciseName,
          type: achievementType,
          previousRecord: achievementType === "weight" ? existingPR.maxWeight || 0 : existingPR.maxReps,
          newRecord: achievementType === "weight" ? weight || 0 : completedReps,
          achievedDate: today,
          sessionId: sessionId || "",
          celebrationShown: false,
          createdAt: now,
        };
      }
    }

    // PR이 업데이트된 경우 저장
    if (isNewPR && prRecord) {
      await AsyncStorage.setItem(PR_STORAGE_KEY, JSON.stringify(records));

      // 성취 기록 저장
      if (achievement) {
        const achievements = await getPRAchievements();
        achievements.push(achievement);
        await AsyncStorage.setItem(PR_ACHIEVEMENTS_KEY, JSON.stringify(achievements));
      }
    }

    return {
      isNewPR,
      achievement,
      prRecord,
      improvementPercentage,
    };
  } catch (error) {
    console.error("PR 확인 및 업데이트 실패:", error);
    throw error;
  }
}

/**
 * 모든 PR 성취 기록을 가져옵니다.
 */
export async function getPRAchievements(): Promise<PRAchievement[]> {
  try {
    const data = await AsyncStorage.getItem(PR_ACHIEVEMENTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("PR 성취 기록 로드 실패:", error);
    return [];
  }
}

/**
 * 특정 운동의 PR 성취 기록을 가져옵니다.
 */
export async function getExercisePRAchievements(exerciseId: string): Promise<PRAchievement[]> {
  try {
    const achievements = await getPRAchievements();
    return achievements
      .filter((a) => a.exerciseId === exerciseId)
      .sort((a, b) => new Date(b.achievedDate).getTime() - new Date(a.achievedDate).getTime());
  } catch (error) {
    console.error("운동 PR 성취 조회 실패:", error);
    return [];
  }
}

/**
 * PR 성취의 축하 표시 여부를 업데이트합니다.
 */
export async function markPRCelebrationShown(achievementId: string): Promise<boolean> {
  try {
    const achievements = await getPRAchievements();
    const index = achievements.findIndex((a) => a.id === achievementId);

    if (index === -1) {
      console.warn("성취 기록을 찾을 수 없습니다:", achievementId);
      return false;
    }

    achievements[index].celebrationShown = true;
    await AsyncStorage.setItem(PR_ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    return true;
  } catch (error) {
    console.error("축하 표시 업데이트 실패:", error);
    throw error;
  }
}

/**
 * 최근 미표시 PR 성취를 가져옵니다.
 */
export async function getUnshownPRAchievements(): Promise<PRAchievement[]> {
  try {
    const achievements = await getPRAchievements();
    return achievements
      .filter((a) => !a.celebrationShown)
      .sort((a, b) => new Date(b.achievedDate).getTime() - new Date(a.achievedDate).getTime());
  } catch (error) {
    console.error("미표시 성취 조회 실패:", error);
    return [];
  }
}

/**
 * 운동별 PR 통계를 가져옵니다.
 */
export async function getExercisePRStats(exerciseId: string) {
  try {
    const pr = await getExercisePR(exerciseId);
    const achievements = await getExercisePRAchievements(exerciseId);

    if (!pr) {
      return {
        hasPR: false,
        totalAchievements: 0,
        lastAchievementDate: null,
      };
    }

    return {
      hasPR: true,
      maxReps: pr.maxReps,
      maxWeight: pr.maxWeight,
      totalAchievements: pr.totalPRCount,
      lastAchievementDate: pr.achievedDate,
      recentAchievements: achievements.slice(0, 5),
    };
  } catch (error) {
    console.error("PR 통계 조회 실패:", error);
    throw error;
  }
}

/**
 * 모든 PR 기록을 삭제합니다.
 */
export async function clearPRRecords(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PR_STORAGE_KEY);
    await AsyncStorage.removeItem(PR_ACHIEVEMENTS_KEY);
  } catch (error) {
    console.error("PR 기록 초기화 실패:", error);
    throw error;
  }
}

/**
 * 특정 운동의 PR을 삭제합니다.
 */
export async function deleteExercisePR(exerciseId: string): Promise<boolean> {
  try {
    const records = await getPRRecords();
    const filtered = records.filter((r) => r.exerciseId !== exerciseId);

    if (filtered.length === records.length) {
      console.warn("삭제할 PR을 찾을 수 없습니다:", exerciseId);
      return false;
    }

    await AsyncStorage.setItem(PR_STORAGE_KEY, JSON.stringify(filtered));

    // 관련 성취 기록도 삭제
    const achievements = await getPRAchievements();
    const filteredAchievements = achievements.filter((a) => a.exerciseId !== exerciseId);
    await AsyncStorage.setItem(PR_ACHIEVEMENTS_KEY, JSON.stringify(filteredAchievements));

    return true;
  } catch (error) {
    console.error("PR 삭제 실패:", error);
    throw error;
  }
}
