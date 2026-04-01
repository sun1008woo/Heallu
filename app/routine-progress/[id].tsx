import { ScrollView, Text, View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getRunningRoutine } from "@/lib/routine-execution-storage";
import { RunningRoutine } from "@/lib/routine-execution-types";

export default function RoutineProgressScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routine, setRoutine] = useState<RunningRoutine | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRoutine();
    }, [id])
  );

  const loadRoutine = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await getRunningRoutine(id);
      setRoutine(data);
    } catch (error) {
      console.error("루틴 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = (action: () => void) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    action();
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!routine) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted }}>루틴을 찾을 수 없습니다.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayCell: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 4,
      marginVertical: 4,
      borderWidth: 1,
    },
  });

  // 주간 진행 상황 계산
  const weeksData = [];
  for (let week = 1; week <= routine.durationWeeks; week++) {
    const weekStart = new Date(routine.startDate);
    weekStart.setDate(weekStart.getDate() + (week - 1) * 7);

    const weekDays = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split("T")[0];
      const dayProgress = routine.dailyProgress.find((p) => p.date === dateStr);
      weekDays.push({ date: dateStr, progress: dayProgress });
    }
    weeksData.push({ week, days: weekDays });
  }

  // 최근 7일 데이터
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayProgress = routine.dailyProgress.find((p) => p.date === dateStr);
    last7Days.push({ date: dateStr, progress: dayProgress });
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={20} color={colors.primary} />
          </Pressable>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>진행 상황</Text>
        </View>

        {/* Stats Summary */}
        <View style={[styles.card, { marginHorizontal: 20, marginTop: 16 }]}>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: colors.muted }}>전체 진행률</Text>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: colors.primary }}>
                  {routine.overallCompletionPercentage}%
                </Text>
              </View>
            </View>
            <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" }}>
              <View
                style={{
                  height: "100%",
                  width: `${routine.overallCompletionPercentage}%`,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
          </View>

          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: colors.border }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>완료 운동</Text>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.primary }}>
                  {routine.totalExercisesCompleted}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>총 운동</Text>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
                  {routine.totalExercisesPlanned}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>주차</Text>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
                  {routine.currentWeek}/{routine.durationWeeks}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Last 7 Days */}
        <View style={[styles.card, { marginHorizontal: 20, marginTop: 16 }]}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            최근 7일
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 6 }}>
            {last7Days.map((day, idx) => {
              const dayName = ["일", "월", "화", "수", "목", "금", "토"][new Date(day.date).getDay()];
              const isCompleted = day.progress?.isCompleted;

              return (
                <View key={idx} style={{ flex: 1, alignItems: "center" }}>
                  <View
                    style={[
                      styles.dayCell,
                      {
                        backgroundColor: isCompleted ? colors.primary : colors.surface,
                        borderColor: isCompleted ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {isCompleted ? (
                      <IconSymbol name="checkmark" size={20} color="#fff" />
                    ) : (
                      <Text style={{ fontSize: 10, color: colors.muted }}>-</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4 }}>{dayName}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Weekly Calendar */}
        <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 32 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            주간 일정
          </Text>
          {weeksData.map((weekData) => (
            <View key={weekData.week} style={[styles.card, { marginBottom: 12 }]}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 10 }}>
                {weekData.week}주차
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                {weekData.days.map((day, idx) => {
                  const dayName = ["월", "화", "수", "목", "금", "토", "일"][idx];
                  const isCompleted = day.progress?.isCompleted;
                  const completionPercentage = day.progress?.completionPercentage || 0;

                  return (
                    <View key={idx} style={{ flex: 1, alignItems: "center", marginHorizontal: 2 }}>
                      <View
                        style={{
                          width: "100%",
                          aspectRatio: 1,
                          borderRadius: 8,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isCompleted
                            ? colors.primary
                            : completionPercentage > 0
                            ? colors.primary + "40"
                            : colors.border,
                        }}
                      >
                        {isCompleted ? (
                          <IconSymbol name="checkmark" size={16} color="#fff" />
                        ) : completionPercentage > 0 ? (
                          <Text style={{ fontSize: 10, fontWeight: "600", color: colors.primary }}>
                            {completionPercentage}%
                          </Text>
                        ) : (
                          <Text style={{ fontSize: 10, color: colors.muted }}>-</Text>
                        )}
                      </View>
                      <Text style={{ fontSize: 9, color: colors.muted, marginTop: 4 }}>{dayName}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
