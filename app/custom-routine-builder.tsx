import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { EXERCISES } from "@/lib/exercises-data";
import { saveRoutine } from "@/lib/saved-routines-diets";
import type { Exercise } from "@/lib/types";
import type { RoutineExercise, WorkoutRoutine } from "@/lib/routine-diet-types";

interface BuilderExercise extends RoutineExercise {
  localId: string;
}

const DIFFICULTY_LABELS = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

export default function CustomRoutineBuilderScreen() {
  const router = useRouter();
  const colors = useColors();
  const [routineName, setRoutineName] = useState("");
  const [routineDescription, setRoutineDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<BuilderExercise[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const filteredExercises = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return EXERCISES;

    return EXERCISES.filter((exercise) => {
      return (
        exercise.name.toLowerCase().includes(query) ||
        exercise.muscleGroups.some((muscle) => muscle.toLowerCase().includes(query))
      );
    });
  }, [searchQuery]);

  function handlePress(action: () => void) {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    action();
  }

  function addExerciseToRoutine(exercise: Exercise) {
    setSelectedExercises((prev) => [
      ...prev,
      {
        localId: `${exercise.id}-${Date.now()}-${prev.length}`,
        exerciseId: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        duration: exercise.duration,
        restTime: exercise.restTime,
        notes: exercise.description,
        youtubeVideoId: exercise.youtubeVideoId,
      },
    ]);
  }

  function updateExercise(localId: string, patch: Partial<BuilderExercise>) {
    setSelectedExercises((prev) =>
      prev.map((exercise) => (exercise.localId === localId ? { ...exercise, ...patch } : exercise)),
    );
  }

  function removeExercise(localId: string) {
    setSelectedExercises((prev) => prev.filter((exercise) => exercise.localId !== localId));
  }

  function moveExercise(localId: string, direction: -1 | 1) {
    setSelectedExercises((prev) => {
      const index = prev.findIndex((exercise) => exercise.localId === localId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  }

  function buildRoutine(): WorkoutRoutine | null {
    if (!routineName.trim()) {
      Alert.alert("이름이 필요해요", "루틴 이름을 먼저 입력해 주세요.");
      return null;
    }

    if (selectedExercises.length === 0) {
      Alert.alert("운동을 추가해 주세요", "최소 한 개 이상의 운동이 필요해요.");
      return null;
    }

    const totalCalories = selectedExercises.reduce((sum, exercise) => {
      const source = EXERCISES.find((item) => item.id === exercise.exerciseId);
      return sum + (source?.calories ?? 0) * Math.max(exercise.sets, 1);
    }, 0);

    const totalDuration = selectedExercises.reduce((sum, exercise) => {
      const activeSeconds = exercise.duration ?? 0;
      return sum + activeSeconds + exercise.restTime * Math.max(exercise.sets - 1, 0);
    }, 0);

    return {
      id: `custom-${Date.now()}`,
      name: routineName.trim(),
      description: routineDescription.trim() || "직접 만든 커스텀 루틴",
      goal: "custom",
      difficulty: "intermediate",
      durationWeeks: 1,
      daysPerWeek: 1,
      dailyWorkouts: [
        {
          day: "커스텀 루틴",
          exercises: selectedExercises.map(({ localId, ...exercise }) => exercise),
          totalDuration,
          totalCalories,
        },
      ],
      totalCaloriesBurn: totalCalories,
      notes: "운동 탭에서 직접 만든 루틴",
    };
  }

  async function handleSaveRoutine() {
    const routine = buildRoutine();
    if (!routine) return;

    setIsSaving(true);
    try {
      await saveRoutine(routine);
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("저장 완료", "새 루틴이 내 루틴에 저장됐어요.", [
        {
          text: "확인",
          onPress: () => router.replace("/(tabs)/my-routines"),
        },
      ]);
    } catch (error) {
      console.error("Failed to save custom routine:", error);
      Alert.alert("오류", "루틴을 저장하지 못했어요.");
    } finally {
      setIsSaving(false);
    }
  }

  const styles = StyleSheet.create({
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    input: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.foreground,
      fontSize: 15,
    },
    label: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 8,
    },
  });

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground }}>나만의 운동 리스트</Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4, lineHeight: 22 }}>
            운동을 고르고, 순서를 바꾸고, 세트와 반복 수를 조정해서 플레이리스트처럼 루틴을 구성해 보세요.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.label}>루틴 이름</Text>
          <TextInput
            style={styles.input}
            value={routineName}
            onChangeText={setRoutineName}
            placeholder="예: 상체 데이, 출근 전 20분"
            placeholderTextColor={colors.muted}
          />

          <Text style={[styles.label, { marginTop: 14 }]}>설명</Text>
          <TextInput
            style={[styles.input, { minHeight: 88, textAlignVertical: "top" }]}
            value={routineDescription}
            onChangeText={setRoutineDescription}
            placeholder="루틴 목적이나 메모를 적어 주세요."
            placeholderTextColor={colors.muted}
            multiline
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={styles.label}>운동 리스트</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>{selectedExercises.length}개 선택됨</Text>
          </View>

          {selectedExercises.length === 0 ? (
            <View style={{ paddingVertical: 12 }}>
              <Text style={{ color: colors.muted }}>아래에서 운동을 추가해 나만의 리스트를 만들어 보세요.</Text>
            </View>
          ) : (
            selectedExercises.map((exercise, index) => (
              <View
                key={exercise.localId}
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  padding: 14,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: "800", color: colors.foreground }}>
                      {index + 1}. {exercise.name}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable onPress={() => moveExercise(exercise.localId, -1)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                      <IconSymbol name="chevron.up" size={18} color={colors.muted} />
                    </Pressable>
                    <Pressable onPress={() => moveExercise(exercise.localId, 1)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                      <IconSymbol name="chevron.down" size={18} color={colors.muted} />
                    </Pressable>
                    <Pressable onPress={() => removeExercise(exercise.localId)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                      <IconSymbol name="trash.fill" size={18} color={colors.error} />
                    </Pressable>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { marginBottom: 6 }]}>세트</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={String(exercise.sets)}
                      onChangeText={(value) => updateExercise(exercise.localId, { sets: Math.max(Number(value) || 1, 1) })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { marginBottom: 6 }]}>{exercise.duration ? "시간(초)" : "반복 수"}</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={String(exercise.duration ?? exercise.reps)}
                      onChangeText={(value) => {
                        const nextValue = Math.max(Number(value) || 1, 1);
                        updateExercise(exercise.localId, exercise.duration ? { duration: nextValue } : { reps: nextValue });
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { marginBottom: 6 }]}>휴식(초)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={String(exercise.restTime)}
                      onChangeText={(value) => updateExercise(exercise.localId, { restTime: Math.max(Number(value) || 0, 0) })}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.label}>운동 추가하기</Text>
          <TextInput
            style={[styles.input, { marginBottom: 12 }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="운동 이름이나 부위를 검색해 보세요."
            placeholderTextColor={colors.muted}
          />

          {filteredExercises.slice(0, 18).map((exercise) => (
            <View
              key={exercise.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{exercise.name}</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                  {DIFFICULTY_LABELS[exercise.difficulty]} · {exercise.muscleGroups.join(" · ")}
                </Text>
              </View>
              <Pressable
                onPress={() => handlePress(() => addExerciseToRoutine(exercise))}
                style={({ pressed }) => [
                  {
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <IconSymbol name="plus" size={18} color="#fff" />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              {
                flex: 1,
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.84 : 1,
              },
            ]}
          >
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>취소</Text>
          </Pressable>

          <Pressable
            onPress={() => handlePress(() => void handleSaveRoutine())}
            disabled={isSaving}
            style={({ pressed }) => [
              {
                flex: 1.4,
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.primary,
                opacity: pressed || isSaving ? 0.84 : 1,
              },
            ]}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>{isSaving ? "저장 중..." : "내 루틴에 저장"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
