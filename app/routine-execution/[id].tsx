import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ExerciseDetailsModal } from "@/components/modals/exercise-details-modal";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getRunningRoutine, toggleExerciseCompletion, updateDailyProgress } from "@/lib/routine-execution-storage";
import type { DailyProgress, ExerciseProgress, RunningRoutine } from "@/lib/routine-execution-types";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "#00D4AA",
  intermediate: "#F59E0B",
  advanced: "#EF4444",
  초급: "#00D4AA",
  중급: "#F59E0B",
  고급: "#EF4444",
};

export default function RoutineExecutionScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routine, setRoutine] = useState<RunningRoutine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [isRestActive, setIsRestActive] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExerciseName, setSelectedExerciseName] = useState("");
  const [selectedSets, setSelectedSets] = useState(3);
  const [selectedRestTime, setSelectedRestTime] = useState(60);

  useEffect(() => {
    if (!isExerciseActive || exerciseTimer <= 0) return;
    const interval = setInterval(() => {
      setExerciseTimer((prev) => {
        if (prev <= 1) {
          setIsExerciseActive(false);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [exerciseTimer, isExerciseActive]);

  useEffect(() => {
    if (!isRestActive || restTimer <= 0) return;
    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev <= 1) {
          setIsRestActive(false);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRestActive, restTimer]);

  useFocusEffect(
    useCallback(() => {
      void loadRoutine();
    }, [id])
  );

  const loadRoutine = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await getRunningRoutine(id);
      setRoutine(data);
    } catch (error) {
      console.error("Failed to load routine:", error);
      Alert.alert("오류", "루틴을 불러오지 못했어요.");
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

  const todayProgress = useMemo(
    () => routine?.dailyProgress.find((progress) => progress.date === selectedDate) ?? null,
    [routine, selectedDate]
  );

  const activeExercise = selectedExerciseIndex !== null ? todayProgress?.exercises[selectedExerciseIndex] ?? null : null;

  const persistUpdatedDay = async (nextDay: DailyProgress) => {
    if (!id) return;
    await updateDailyProgress(id, selectedDate, nextDay);
    await loadRoutine();
  };

  const handleToggleExercise = async (exerciseName: string) => {
    if (!routine || !id) return;
    try {
      await toggleExerciseCompletion(id, selectedDate, exerciseName);
      await loadRoutine();
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("Failed to toggle exercise completion:", error);
      Alert.alert("오류", "운동 완료 상태를 바꾸지 못했어요.");
    }
  };

  const startExerciseTimer = (exercise: ExerciseProgress, index: number) => {
    setSelectedExerciseIndex(index);
    setIsRestActive(false);
    setRestTimer(0);
    setExerciseTimer(exercise.duration ?? 30);
    setIsExerciseActive(true);
  };

  const handleFinishExerciseAndStartRest = async () => {
    if (!activeExercise || !todayProgress) return;

    if (!activeExercise.completed) {
      await handleToggleExercise(activeExercise.exerciseName);
    }

    const restSeconds = activeExercise.restTime ?? 0;
    setIsExerciseActive(false);
    setExerciseTimer(0);

    if (restSeconds > 0) {
      setRestTimer(restSeconds);
      setIsRestActive(true);
    } else {
      setIsRestActive(false);
      setRestTimer(0);
    }
  };

  const handleSaveExerciseDetails = async (sets: number, restTime: number) => {
    if (!todayProgress || selectedExerciseIndex === null) {
      setShowDetailsModal(false);
      return;
    }

    const nextExercises = todayProgress.exercises.map((exercise, index) =>
      index === selectedExerciseIndex
        ? {
            ...exercise,
            sets,
            restTime,
          }
        : exercise
    );

    const nextDay: DailyProgress = {
      ...todayProgress,
      exercises: nextExercises,
    };

    try {
      await persistUpdatedDay(nextDay);
      setSelectedSets(sets);
      setSelectedRestTime(restTime);
      setShowDetailsModal(false);
    } catch (error) {
      console.error("Failed to update exercise details:", error);
      Alert.alert("오류", "운동 설정을 저장하지 못했어요.");
    }
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    exerciseItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    smallButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
  });

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
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: colors.muted, textAlign: "center" }}>진행 중인 루틴을 찾지 못했어요.</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.smallButton,
              { marginTop: 16, backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>뒤로 가기</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground }}>{routine.routineName}</Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                {routine.currentWeek}주차 · 진행률 {routine.overallCompletionPercentage}%
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: (DIFFICULTY_COLORS[routine.routineDifficulty] ?? colors.primary) + "20",
                borderRadius: 10,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: DIFFICULTY_COLORS[routine.routineDifficulty] ?? colors.primary }}>
                {routine.routineDifficulty}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>완료한 운동</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginTop: 4 }}>
                {routine.totalExercisesCompleted}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>총 운동</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginTop: 4 }}>
                {routine.totalExercisesPlanned}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>시작일</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginTop: 4 }}>
                {new Date(routine.startDate).toLocaleDateString("ko-KR")}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>날짜 선택</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {Array.from({ length: 7 }).map((_, idx) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - idx));
              const dateStr = date.toISOString().split("T")[0];
              const isSelected = dateStr === selectedDate;
              const dayName = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

              return (
                <Pressable
                  key={dateStr}
                  onPress={() => handlePress(() => setSelectedDate(dateStr))}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: "center",
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 11, color: isSelected ? "#fff" : colors.muted, fontWeight: "600" }}>{dayName}</Text>
                  <Text style={{ fontSize: 13, color: isSelected ? "#fff" : colors.foreground, fontWeight: "800", marginTop: 2 }}>
                    {date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {todayProgress ? (
          <>
            <View style={[styles.card, { marginBottom: 16 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground }}>오늘의 루틴</Text>
                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "700" }}>
                  {todayProgress.completedCount}/{todayProgress.totalCount}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.muted }}>
                체크하거나 타이머를 눌러 바로 운동을 진행해보세요.
              </Text>
            </View>

            {todayProgress.exercises.map((exercise, idx) => {
              const isActiveExercise = selectedExerciseIndex === idx && isExerciseActive;
              const isActiveRest = selectedExerciseIndex === idx && isRestActive;

              return (
                <View key={`${exercise.exerciseName}-${idx}`} style={styles.card}>
                  <View style={styles.exerciseItem}>
                    <Pressable
                      onPress={() => handlePress(() => void handleToggleExercise(exercise.exerciseName))}
                      style={({ pressed }) => [
                        {
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: exercise.completed ? colors.primary : colors.border,
                          backgroundColor: exercise.completed ? colors.primary : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: pressed ? 0.8 : 1,
                          marginTop: 2,
                        },
                      ]}
                    >
                      {exercise.completed ? <IconSymbol name="checkmark" size={14} color="#fff" /> : null}
                    </Pressable>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <Pressable onPress={() => handlePress(() => startExerciseTimer(exercise, idx))} style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "700",
                              color: colors.foreground,
                              textDecorationLine: exercise.completed ? "line-through" : "none",
                              opacity: exercise.completed ? 0.6 : 1,
                            }}
                          >
                            {exercise.exerciseName}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                            {exercise.sets ?? 3}세트 · {exercise.duration ? `${exercise.duration}초` : `${exercise.reps ?? 10}회`} · 휴식 {exercise.restTime ?? 60}초
                          </Text>
                          {exercise.notes ? (
                            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>{exercise.notes}</Text>
                          ) : null}
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            setSelectedExerciseName(exercise.exerciseName);
                            setSelectedSets(exercise.sets ?? 3);
                            setSelectedRestTime(exercise.restTime ?? 60);
                            setSelectedExerciseIndex(idx);
                            setShowDetailsModal(true);
                          }}
                          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, paddingTop: 2 }]}
                        >
                          <IconSymbol name="gear" size={18} color={colors.primary} />
                        </Pressable>
                      </View>

                      {isActiveExercise ? (
                        <View
                          style={{
                            marginTop: 12,
                            borderRadius: 12,
                            padding: 12,
                            backgroundColor: colors.primary + "14",
                            borderWidth: 1,
                            borderColor: colors.primary + "30",
                          }}
                        >
                          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>운동 타이머</Text>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.primary }}>{exerciseTimer}초</Text>
                            <Pressable
                              onPress={() => setIsExerciseActive((prev) => !prev)}
                              style={({ pressed }) => [
                                styles.smallButton,
                                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                              ]}
                            >
                              <Text style={{ color: "#fff", fontWeight: "700" }}>{isExerciseActive ? "일시정지" : "재개"}</Text>
                            </Pressable>
                          </View>
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <Pressable
                              onPress={() => void handleFinishExerciseAndStartRest()}
                              style={({ pressed }) => [
                                styles.smallButton,
                                { flex: 1, backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                              ]}
                            >
                              <Text style={{ color: "#fff", fontWeight: "700" }}>운동 완료 후 휴식</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                setIsExerciseActive(false);
                                setExerciseTimer(0);
                              }}
                              style={({ pressed }) => [
                                styles.smallButton,
                                { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                              ]}
                            >
                              <Text style={{ color: colors.foreground, fontWeight: "700" }}>끝내기</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : null}

                      {isActiveRest ? (
                        <View
                          style={{
                            marginTop: 12,
                            borderRadius: 12,
                            padding: 12,
                            backgroundColor: "#22C55E14",
                            borderWidth: 1,
                            borderColor: "#22C55E33",
                          }}
                        >
                          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>휴식 시간</Text>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <Text style={{ fontSize: 28, fontWeight: "800", color: "#22C55E" }}>{restTimer}초</Text>
                            <Pressable
                              onPress={() => setIsRestActive((prev) => !prev)}
                              style={({ pressed }) => [
                                styles.smallButton,
                                { backgroundColor: "#22C55E", opacity: pressed ? 0.8 : 1 },
                              ]}
                            >
                              <Text style={{ color: "#fff", fontWeight: "700" }}>{isRestActive ? "일시정지" : "재개"}</Text>
                            </Pressable>
                          </View>
                          <Pressable
                            onPress={() => {
                              setIsRestActive(false);
                              setRestTimer(0);
                            }}
                            style={({ pressed }) => [
                              styles.smallButton,
                              { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                            ]}
                          >
                            <Text style={{ color: colors.foreground, fontWeight: "700" }}>휴식 건너뛰기</Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <View style={[styles.card, { alignItems: "center", paddingVertical: 24 }]}>
            <IconSymbol name="calendar" size={32} color={colors.muted} />
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>이 날짜에는 배정된 운동이 없어요.</Text>
          </View>
        )}
      </ScrollView>

      <ExerciseDetailsModal
        visible={showDetailsModal}
        exerciseName={selectedExerciseName}
        initialSets={selectedSets}
        initialRestTime={selectedRestTime}
        onSave={(sets, restTime) => void handleSaveExerciseDetails(sets, restTime)}
        onCancel={() => setShowDetailsModal(false)}
      />
    </ScreenContainer>
  );
}
