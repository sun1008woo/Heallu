import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { createRunningRoutine, getRunningRoutines, startRoutine } from "@/lib/routine-execution-storage";
import type { RunningRoutine } from "@/lib/routine-execution-types";
import { getSavedRoutines, type SavedRoutine } from "@/lib/saved-routines-diets";
import { getProgressStats, getUserProfile } from "@/lib/storage";
import type { ProgressStats, UserProfile } from "@/lib/types";

export default function TodayScreen() {
  const router = useRouter();
  const colors = useColors();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>([]);
  const [activeRoutines, setActiveRoutines] = useState<RunningRoutine[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, []),
  );

  async function loadDashboard() {
    setLoading(true);
    try {
      const [nextProfile, nextStats, nextSavedRoutines, nextRunningRoutines] = await Promise.all([
        getUserProfile(),
        getProgressStats(),
        getSavedRoutines(),
        getRunningRoutines(),
      ]);

      setProfile(nextProfile);
      setStats(nextStats);
      setSavedRoutines(nextSavedRoutines);
      setActiveRoutines(nextRunningRoutines.filter((routine) => routine.status === "active"));
    } finally {
      setLoading(false);
    }
  }

  const primarySavedRoutine = savedRoutines[0] ?? null;
  const primaryRunningRoutine = activeRoutines[0] ?? null;
  const greetingName = profile?.name?.trim() || "사용자";
  const weeklyTotal = useMemo(() => (stats?.weeklyWorkouts ?? []).reduce((sum, count) => sum + count, 0), [stats]);

  const styles = StyleSheet.create({
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    secondaryButton: {
      flex: 1,
      minHeight: 56,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
      gap: 6,
    },
  });

  function handlePress(action: () => void) {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    action();
  }

  async function handlePrimaryAction() {
    if (!primaryRunningRoutine && !primarySavedRoutine) {
      router.push("/custom-routine-builder" as never);
      return;
    }

    if (primaryRunningRoutine) {
      router.push(`/routine-execution/${primaryRunningRoutine.id}` as never);
      return;
    }

    try {
      const runningRoutine = createRunningRoutine(primarySavedRoutine!.id, primarySavedRoutine!.routine);
      const created = await startRoutine(runningRoutine);
      router.push(`/routine-execution/${created.id}` as never);
    } catch (error) {
      console.error("Failed to start routine from today screen:", error);
      Alert.alert("오류", "루틴을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  const primaryTitle = primaryRunningRoutine
    ? primaryRunningRoutine.routineName
    : primarySavedRoutine?.routine.name ?? "아직 루틴이 없어요";
  const primaryDescription = primaryRunningRoutine
    ? `${primaryRunningRoutine.currentWeek}주차 · ${primaryRunningRoutine.currentDay}일차 · ${primaryRunningRoutine.overallCompletionPercentage}% 진행 중`
    : primarySavedRoutine
      ? `${primarySavedRoutine.routine.daysPerWeek}일 루틴 · ${primarySavedRoutine.routine.durationWeeks}주 프로그램`
      : "운동을 바로 시작할 수 있도록 나만의 루틴부터 만들어 볼까요?";
  const primaryButtonLabel = primaryRunningRoutine
    ? "이어 하기"
    : primarySavedRoutine
      ? "오늘 루틴 시작"
      : "루틴 만들기";

  return (
    <ScreenContainer>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: 18 }}>
            <Text style={{ fontSize: 32, fontWeight: "800", color: colors.foreground }}>오늘</Text>
            <Text style={{ fontSize: 16, color: colors.muted, marginTop: 6, lineHeight: 24 }}>
              {greetingName}님, 지금 해야 할 운동만 깔끔하게 모아뒀어요.
            </Text>
          </View>

          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                marginBottom: 18,
              },
            ]}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.82)", marginBottom: 8 }}>
              오늘의 핵심
            </Text>
            <Text style={{ fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 8 }}>{primaryTitle}</Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.86)", lineHeight: 22, marginBottom: 18 }}>
              {primaryDescription}
            </Text>
            <Pressable
              onPress={() => handlePress(() => void handlePrimaryAction())}
              style={({ pressed }) => [
                {
                  minHeight: 56,
                  borderRadius: 16,
                  backgroundColor: "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary }}>{primaryButtonLabel}</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 18 }}>
            <View style={[styles.sectionCard, { flex: 1, marginBottom: 0 }]}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 6 }}>이번 주 운동</Text>
              <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>{weeklyTotal}회</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>조금씩 쌓는 흐름이 중요해요.</Text>
            </View>
            <View style={[styles.sectionCard, { flex: 1, marginBottom: 0 }]}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 6 }}>현재 스트릭</Text>
              <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>{stats?.currentStreak ?? 0}일</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>오늘도 흐름을 이어가 볼까요?</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground, marginBottom: 10 }}>빠른 이동</Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16, lineHeight: 22 }}>
              자주 쓰는 메뉴만 남겨서 더 빠르게 이동할 수 있게 정리했어요.
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => handlePress(() => router.push("/(tabs)/workouts"))}
                style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.84 : 1 }]}
              >
                <IconSymbol name="bookmark.fill" size={20} color={colors.primary} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>루틴 관리</Text>
              </Pressable>

              <Pressable
                onPress={() => handlePress(() => router.push("/(tabs)/ai-trainer"))}
                style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.84 : 1 }]}
              >
                <IconSymbol name="brain.head.profile" size={20} color={colors.primary} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>AI 코치</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>최근 흐름</Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16, lineHeight: 22 }}>
              기록은 요약만 보여주고, 자세한 통계는 리포트에서 확인할 수 있어요.
            </Text>

            <Pressable
              onPress={() => handlePress(() => router.push("/(tabs)/progress"))}
              style={({ pressed }) => [
                {
                  minHeight: 54,
                  borderRadius: 16,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  opacity: pressed ? 0.84 : 1,
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <IconSymbol name="chart.bar.fill" size={18} color={colors.primary} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>운동 리포트 보기</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </Pressable>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
