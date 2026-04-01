import { ScrollView, Text, View, Pressable, StyleSheet, FlatList } from "react-native";
import { useState, useEffect } from "react";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getProgressStats, getWorkoutSessions } from "@/lib/storage";
import { ProgressStats, WorkoutSession } from "@/lib/types";
import { getRunningRoutines } from "@/lib/routine-execution-storage";
import { RunningRoutine } from "@/lib/routine-execution-types";
import { useRouter } from "expo-router";

const CATEGORY_LABELS: Record<string, string> = {
  strength: "근력", cardio: "유산소", hiit: "HIIT", yoga: "요가", stretching: "스트레칭", core: "코어",
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function ProgressScreen() {
  const router = useRouter();
  const colors = useColors();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [runningRoutines, setRunningRoutines] = useState<RunningRoutine[]>([]);

  useFocusEffect(
    useCallback(() => {
      getProgressStats().then(setStats);
      getWorkoutSessions().then(setSessions);
      getRunningRoutines().then(setRunningRoutines);
    }, [])
  );

  const today = new Date();
  const weekDayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return DAY_LABELS[d.getDay()];
  });

  const maxWorkouts = Math.max(...(stats?.weeklyWorkouts ?? [0]), 1);

  const recentSessions = sessions.slice(0, 10);
  const activeRoutines = runningRoutines.filter((r) => r.status === "active");

  const styles = StyleSheet.create({
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    periodBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      alignItems: "center",
    },
    historyCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: colors.foreground }}>진행 상황</Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>나의 운동 기록을 확인하세요</Text>
        </View>

        {/* Main Stats */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={styles.statCard}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <IconSymbol name="dumbbell.fill" size={20} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>{stats?.totalWorkouts ?? 0}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>총 운동 횟수</Text>
            </View>
            <View style={styles.statCard}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.success + "20", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <IconSymbol name="flame.fill" size={20} color={colors.success} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>{stats?.totalCalories ?? 0}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>총 칼로리</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={styles.statCard}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#F59E0B20", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <IconSymbol name="clock.fill" size={20} color="#F59E0B" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>{stats?.totalMinutes ?? 0}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>총 운동 시간(분)</Text>
            </View>
            <View style={styles.statCard}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#8B5CF620", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <IconSymbol name="flame.fill" size={20} color="#8B5CF6" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>{stats?.currentStreak ?? 0}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>현재 연속 일수</Text>
            </View>
          </View>
        </View>

        {/* Active Routines */}
        {activeRoutines.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>진행 중인 루틴</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{activeRoutines.length}개</Text>
            </View>
            {activeRoutines.map((routine) => (
              <Pressable
                key={routine.id}
                style={({ pressed }) => [{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                }]}
                onPress={() => router.push(`/routine-execution/${routine.id}` as any)}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                      {routine.routineName}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                      {routine.currentWeek}주차 · {routine.currentDay}일차
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>
                    {routine.overallCompletionPercentage}%
                  </Text>
                </View>
                <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
                  <View
                    style={{
                      height: "100%",
                      width: `${routine.overallCompletionPercentage}%`,
                      backgroundColor: colors.primary,
                    }}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Weekly Chart */}
        <View style={{ marginHorizontal: 20, marginTop: 20, backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>주간 활동</Text>
            <View style={{ flexDirection: "row", backgroundColor: colors.border + "60", borderRadius: 10, padding: 3 }}>
              <Pressable
                style={({ pressed }) => [styles.periodBtn, { backgroundColor: period === "week" ? colors.background : "transparent", opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setPeriod("week")}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: period === "week" ? colors.foreground : colors.muted }}>주간</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.periodBtn, { backgroundColor: period === "month" ? colors.background : "transparent", opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setPeriod("month")}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: period === "month" ? colors.foreground : colors.muted }}>월간</Text>
              </Pressable>
            </View>
          </View>

          {/* Bar Chart */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 80 }}>
            {(stats?.weeklyWorkouts ?? [0, 0, 0, 0, 0, 0, 0]).map((count, i) => {
              const height = maxWorkouts > 0 ? Math.max((count / maxWorkouts) * 70, count > 0 ? 8 : 0) : 0;
              return (
                <View key={i} style={{ alignItems: "center", flex: 1 }}>
                  <View style={{
                    width: 28,
                    height: Math.max(height, 4),
                    borderRadius: 6,
                    backgroundColor: count > 0 ? colors.primary : colors.border,
                  }} />
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 6 }}>{weekDayLabels[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Streak Info */}
        <View style={{ marginHorizontal: 20, marginTop: 12, flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: colors.primary + "15", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.primary + "30" }}>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600", marginBottom: 4 }}>현재 연속</Text>
            <Text style={{ fontSize: 22, fontWeight: "700", color: colors.primary }}>{stats?.currentStreak ?? 0}일 🔥</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.success + "15", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.success + "30" }}>
            <Text style={{ fontSize: 12, color: colors.success, fontWeight: "600", marginBottom: 4 }}>최장 연속</Text>
            <Text style={{ fontSize: 22, fontWeight: "700", color: colors.success }}>{stats?.longestStreak ?? 0}일 🏆</Text>
          </View>
        </View>

        {/* Workout History */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>운동 기록</Text>
          {recentSessions.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <IconSymbol name="calendar" size={48} color={colors.muted} />
              <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12 }}>아직 운동 기록이 없습니다</Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>운동을 완료하면 여기에 기록됩니다</Text>
            </View>
          ) : (
            recentSessions.map((session) => {
              const date = new Date(session.date);
              const dateStr = `${date.getMonth() + 1}월 ${date.getDate()}일`;
              const timeStr = date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
              return (
                <View key={session.id} style={styles.historyCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                        {session.exercises.map((e) => e.exerciseName).join(", ")}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.muted }}>{dateStr} {timeStr}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <IconSymbol name="flame.fill" size={14} color={colors.primary} />
                        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>{session.totalCalories}kcal</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <IconSymbol name="clock.fill" size={14} color={colors.muted} />
                        <Text style={{ fontSize: 12, color: colors.muted }}>{Math.floor(session.totalDuration / 60)}분</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
