import { ScrollView, Text, View, Pressable, StyleSheet, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useKeepAwake } from "expo-keep-awake";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getExerciseById } from "@/lib/exercises-data";
import { saveWorkoutSession, updateProgressStats } from "@/lib/storage";
import { WorkoutSession, CompletedExercise } from "@/lib/types";

const DIFFICULTY_LABELS = { beginner: "초급", intermediate: "중급", advanced: "고급" };
const DIFFICULTY_COLORS = { beginner: "#00D4AA", intermediate: "#F59E0B", advanced: "#EF4444" };
const CATEGORY_LABELS: Record<string, string> = {
  strength: "근력", cardio: "유산소", hiit: "HIIT", yoga: "요가", stretching: "스트레칭", core: "코어",
};

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const exercise = getExerciseById(id ?? "");

  const [completedSets, setCompletedSets] = useState<boolean[]>([]);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useKeepAwake();

  useEffect(() => {
    if (exercise) {
      setCompletedSets(new Array(exercise.sets).fill(false));
    }
  }, [exercise]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRestTimer = (duration: number) => {
    setIsResting(true);
    setRestTimer(duration);
    timerRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsResting(false);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSetComplete = (setIndex: number) => {
    if (!workoutStarted) {
      setWorkoutStarted(true);
      setWorkoutStartTime(new Date());
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const newCompleted = [...completedSets];
    newCompleted[setIndex] = true;
    setCompletedSets(newCompleted);

    // Start rest timer if not last set
    if (setIndex < (exercise?.sets ?? 0) - 1) {
      startRestTimer(exercise?.restTime ?? 60);
    }

    // Check if all sets completed
    if (newCompleted.every(Boolean)) {
      setTimeout(() => handleWorkoutComplete(newCompleted), 500);
    }
  };

  const handleWorkoutComplete = async (sets: boolean[]) => {
    if (!exercise || !workoutStartTime) return;
    const duration = Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 1000);
    const session: WorkoutSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      exercises: [{
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: sets.map((completed) => ({
          reps: exercise.reps,
          completed,
        })),
      }] as CompletedExercise[],
      totalDuration: duration,
      totalCalories: exercise.calories * exercise.sets,
    };
    await saveWorkoutSession(session);
    await updateProgressStats(session);
    setIsCompleted(true);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  if (!exercise) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted }}>운동을 찾을 수 없습니다</Text>
        </View>
      </ScreenContainer>
    );
  }

  const styles = StyleSheet.create({
    setCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
    },
    completeBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
    },
  });

  if (isCompleted) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.success + "20", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <IconSymbol name="checkmark.circle.fill" size={48} color={colors.success} />
          </View>
          <Text style={{ fontSize: 28, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>운동 완료! 🎉</Text>
          <Text style={{ fontSize: 16, color: colors.muted, textAlign: "center", marginBottom: 8 }}>
            {exercise.name}을(를) 성공적으로 완료했습니다.
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 32 }}>
            소모 칼로리: 약 {exercise.calories * exercise.sets}kcal
          </Text>
          <Pressable
            style={({ pressed }) => [styles.completeBtn, { width: "100%", opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.back()}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>운동 목록으로 돌아가기</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Pressable
            style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16, opacity: pressed ? 0.6 : 1 }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={20} color={colors.primary} />
            <Text style={{ fontSize: 15, color: colors.primary, fontWeight: "600" }}>뒤로</Text>
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: DIFFICULTY_COLORS[exercise.difficulty] + "20" }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: DIFFICULTY_COLORS[exercise.difficulty] }}>
                {DIFFICULTY_LABELS[exercise.difficulty]}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: colors.primary + "20" }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
                {CATEGORY_LABELS[exercise.category] ?? exercise.category}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 28, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>{exercise.name}</Text>
          <Text style={{ fontSize: 15, color: colors.muted, lineHeight: 22 }}>{exercise.description}</Text>
        </View>

        {/* YouTube Video */}
        {exercise.youtubeVideoId && (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <Pressable
              style={({ pressed }) => [{
                backgroundColor: colors.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
                opacity: pressed ? 0.8 : 1,
              }]}
              onPress={() => {
                const youtubeUrl = `https://www.youtube.com/watch?v=${exercise.youtubeVideoId}`;
                Linking.openURL(youtubeUrl);
              }}
            >
              <View style={{ aspectRatio: 16 / 9, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#FF0000", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="play.fill" size={28} color="#fff" />
                </View>
              </View>
              <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>운동 자세 보기</Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>유튜브에서 정확한 운동 자세를 확인하세요</Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Stats */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 10, marginTop: 16 }}>
          {[
            { label: "세트", value: `${exercise.sets}`, icon: "list.bullet" as const },
            { label: exercise.duration ? "시간" : "횟수", value: exercise.duration ? `${exercise.duration}초` : `${exercise.reps}회`, icon: "clock.fill" as const },
            { label: "휴식", value: `${exercise.restTime}초`, icon: "arrow.clockwise" as const },
            { label: "칼로리", value: `~${exercise.calories * exercise.sets}`, icon: "flame.fill" as const },
          ].map((stat, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
              <IconSymbol name={stat.icon} size={18} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginTop: 4 }}>{stat.value}</Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Muscle Groups */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 10 }}>운동 부위</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {exercise.muscleGroups.map((muscle) => (
              <View key={muscle} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.primary + "15", borderWidth: 1, borderColor: colors.primary + "30" }}>
                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "500" }}>{muscle}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>운동 방법</Text>
          {exercise.instructions.map((step, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 12, marginBottom: 10 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>{i + 1}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: colors.foreground, lineHeight: 22 }}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Rest Timer */}
        {isResting && (
          <View style={{ marginHorizontal: 20, marginTop: 20, backgroundColor: colors.warning + "15", borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: colors.warning + "40" }}>
            <IconSymbol name="clock.fill" size={28} color={colors.warning} />
            <Text style={{ fontSize: 36, fontWeight: "700", color: colors.warning, marginTop: 8 }}>{restTimer}초</Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>휴식 중...</Text>
            <Pressable
              style={({ pressed }) => [{ marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.warning + "30", opacity: pressed ? 0.7 : 1 }]}
              onPress={() => { if (timerRef.current) clearInterval(timerRef.current); setIsResting(false); }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.warning }}>건너뛰기</Text>
            </Pressable>
          </View>
        )}

        {/* Sets */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>세트 기록</Text>
          {completedSets.map((done, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                styles.setCard,
                {
                  borderColor: done ? colors.success : colors.border,
                  backgroundColor: done ? colors.success + "10" : colors.surface,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => !done && !isResting && handleSetComplete(i)}
              disabled={done || isResting}
            >
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: done ? colors.success : colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}>
                {done
                  ? <IconSymbol name="checkmark" size={18} color="#fff" />
                  : <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>{i + 1}</Text>
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: done ? colors.success : colors.foreground }}>
                  세트 {i + 1}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>
                  {exercise.duration ? `${exercise.duration}초 유지` : `${exercise.reps}회 반복`}
                </Text>
              </View>
              {!done && (
                <View style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.primary }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>완료</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
