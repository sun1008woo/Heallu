import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatMessage, ProgressStats, UserProfile, WorkoutSession } from "./types";

const KEYS = {
  USER_PROFILE: "user_profile",
  WORKOUT_SESSIONS: "workout_sessions",
  CHAT_MESSAGES: "chat_messages",
  PROGRESS_STATS: "progress_stats",
};

export const DEFAULT_PROFILE: UserProfile = {
  name: "사용자",
  age: 25,
  weight: 70,
  height: 170,
  goal: "general",
  fitnessLevel: "beginner",
  gender: "prefer_not_to_say",
  weightUnit: "kg",
  weeklyWorkoutFrequency: 3,
  workoutPreference: "mixed",
  aiPersona: "kind_mentor",
  customPersonaPrompt: "",
  notificationsEnabled: true,
  onboardingCompleted: false,
};

const DEFAULT_STATS: ProgressStats = {
  totalWorkouts: 0,
  totalCalories: 0,
  totalMinutes: 0,
  currentStreak: 0,
  longestStreak: 0,
  weeklyWorkouts: [0, 0, 0, 0, 0, 0, 0],
  personalRecords: [],
};

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    return data ? { ...DEFAULT_PROFILE, ...JSON.parse(data) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile.onboardingCompleted === true;
}

export async function getWorkoutSessions(): Promise<WorkoutSession[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.WORKOUT_SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveWorkoutSession(session: WorkoutSession): Promise<void> {
  const sessions = await getWorkoutSessions();
  sessions.unshift(session);
  const trimmed = sessions.slice(0, 100);
  await AsyncStorage.setItem(KEYS.WORKOUT_SESSIONS, JSON.stringify(trimmed));
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CHAT_MESSAGES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveChatMessages(messages: ChatMessage[]): Promise<void> {
  const trimmed = messages.slice(-50);
  await AsyncStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(trimmed));
}

export async function getProgressStats(): Promise<ProgressStats> {
  try {
    const data = await AsyncStorage.getItem(KEYS.PROGRESS_STATS);
    return data ? JSON.parse(data) : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
}

export async function updateProgressStats(session: WorkoutSession): Promise<void> {
  const stats = await getProgressStats();
  stats.totalWorkouts += 1;
  stats.totalCalories += session.totalCalories;
  stats.totalMinutes += Math.floor(session.totalDuration / 60);

  const today = new Date();
  const sessionDate = new Date(session.date);
  const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff >= 0 && daysDiff < 7) {
    stats.weeklyWorkouts[daysDiff] = (stats.weeklyWorkouts[daysDiff] || 0) + 1;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isToday = sessionDate.toDateString() === today.toDateString();
  const isYesterday = sessionDate.toDateString() === yesterday.toDateString();
  if (isToday || isYesterday) {
    stats.currentStreak += 1;
    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }
  } else {
    stats.currentStreak = 1;
  }

  await AsyncStorage.setItem(KEYS.PROGRESS_STATS, JSON.stringify(stats));
}
