import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getRunningRoutines } from "@/lib/routine-execution-storage";
import { RunningRoutine } from "@/lib/routine-execution-types";
import { getProgressStats, getWorkoutSessions } from "@/lib/storage";
import { ProgressStats, WorkoutSession } from "@/lib/types";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function ProgressScreen() {
  const colors = useColors();
  const router = useRouter();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [runningRoutines, setRunningRoutines] = useState<RunningRoutine[]>([]);

  useFocusEffect(
    useCallback(() => {
      getProgressStats().then(setStats);
      getWorkoutSessions().then(setSessions);
      getRunningRoutines().then(setRunningRoutines);
    }, []),
  );

  const maxWeeklyCount = useMemo(
    () => Math.max(...(stats?.weeklyWorkouts ?? [0, 0, 0, 0, 0, 0, 0]), 1),
    [stats],
  );

  const last7Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return DAY_LABELS[date.getDay()];
    });
  }, []);

  const activeRoutines = runningRoutines.filter((routine) => routine.status === "active");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 18,
        },
      }),
    [colors],
  );

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 18 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 30, fontWeight: "800", color: colors.foreground }}>진행 리포트</Text>
            <Text style={{ fontSize: 15, lineHeight: 22, color: colors.muted }}>
              최근 운동 흐름과 스트릭, 진행 중인 루틴을 한눈에 확인해요.
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={[styles.card, { flex: 1, gap: 6 }]}>
              <Text style={{ fontSize: 12, color: colors.muted }}>총 운동 수</Text>
              <Text style={{ fontSize: 26, fontWeight: "800", color: colors.foreground }}>
                {stats?.totalWorkouts ?? 0}
              </Text>
            </View>
            <View style={[styles.card, { flex: 1, gap: 6 }]}>
              <Text style={{ fontSize: 12, color: colors.muted }}>현재 스트릭</Text>
              <Text style={{ fontSize: 26, fontWeight: "800", color: colors.foreground }}>
                {stats?.currentStreak ?? 0}일
              </Text>
            </View>
            <View style={[styles.card, { flex: 1, gap: 6 }]}>
              <Text style={{ fontSize: 12, color: colors.muted }}>총 시간</Text>
              <Text style={{ fontSize: 26, fontWeight: "800", color: colors.foreground }}>
                {stats?.totalMinutes ?? 0}분
              </Text>
            </View>
          </View>

          <View style={[styles.card, { gap: 14 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground }}>최근 7일 운동</Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>꾸준함이 가장 큰 성과예요</Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 120 }}>
              {(stats?.weeklyWorkouts ?? [0, 0, 0, 0, 0, 0, 0]).map((count, index) => {
                const height = Math.max((count / maxWeeklyCount) * 92, count > 0 ? 12 : 4);
                return (
                  <View key={`${last7Days[index]}-${index}`} style={{ flex: 1, alignItems: "center", gap: 8 }}>
                    <View
                      style={{
                        width: 24,
                        height,
                        borderRadius: 999,
                        backgroundColor: count > 0 ? colors.primary : colors.border,
                      }}
                    />
                    <Text style={{ fontSize: 12, color: colors.muted }}>{last7Days[index]}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {activeRoutines.length > 0 && (
            <View style={[styles.card, { gap: 12 }]}>
              <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground }}>진행 중인 루틴</Text>
              {activeRoutines.map((routine) => (
                <Pressable
                  key={routine.id}
                  onPress={() => router.push(`/routine-execution/${routine.id}` as any)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.background,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 16,
                      gap: 10,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                        {routine.routineName}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.muted }}>
                        {routine.currentWeek}주차 · {routine.currentDay}일차
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: colors.primary }}>
                      {routine.overallCompletionPercentage}%
                    </Text>
                  </View>

                  <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 999, overflow: "hidden" }}>
                    <View
                      style={{
                        width: `${routine.overallCompletionPercentage}%`,
                        height: "100%",
                        backgroundColor: colors.primary,
                      }}
                    />
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <View style={[styles.card, { gap: 12 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground }}>최근 운동 기록</Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>{sessions.length}개</Text>
            </View>

            {sessions.length === 0 ? (
              <View style={{ paddingVertical: 12, alignItems: "center", gap: 10 }}>
                <IconSymbol name="calendar" size={28} color={colors.muted} />
                <Text style={{ fontSize: 14, color: colors.muted }}>아직 저장된 운동 기록이 없어요.</Text>
              </View>
            ) : (
              sessions.slice(0, 5).map((session) => {
                const date = new Date(session.date);
                return (
                  <View
                    key={session.id}
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 16,
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                          {session.exercises.map((exercise) => exercise.exerciseName).join(", ")}
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.muted }}>
                          {date.toLocaleDateString("ko-KR")} · {date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>
                          {session.totalCalories} kcal
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.muted }}>
                          {Math.max(1, Math.floor(session.totalDuration / 60))}분
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
