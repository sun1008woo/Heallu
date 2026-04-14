import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { EXERCISES } from "@/lib/exercises-data";
import { createRunningRoutine, startRoutine } from "@/lib/routine-execution-storage";
import { getSavedRoutines, type SavedRoutine } from "@/lib/saved-routines-diets";

export default function RoutineHubScreen() {
  const router = useRouter();
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      void loadSavedRoutines();
    }, []),
  );

  async function loadSavedRoutines() {
    setLoading(true);
    try {
      const nextRoutines = await getSavedRoutines();
      setSavedRoutines(nextRoutines);
    } finally {
      setLoading(false);
    }
  }

  function handlePress(action: () => void) {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    action();
  }

  const filteredExercises = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return EXERCISES.slice(0, 8);
    return EXERCISES.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.muscleGroups.some((muscle) => muscle.toLowerCase().includes(query)),
    ).slice(0, 8);
  }, [searchQuery]);

  async function handleStartRoutine(savedRoutine: SavedRoutine) {
    const runningRoutine = createRunningRoutine(savedRoutine.id, savedRoutine.routine);
    const created = await startRoutine(runningRoutine);
    router.push(`/routine-execution/${created.id}` as never);
  }

  const styles = StyleSheet.create({
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    searchInput: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 13,
      color: colors.foreground,
      fontSize: 15,
    },
  });

  return (
    <ScreenContainer>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: 18 }}>
            <Text style={{ fontSize: 32, fontWeight: "800", color: colors.foreground }}>루틴</Text>
            <Text style={{ fontSize: 16, color: colors.muted, marginTop: 6, lineHeight: 24 }}>
              저장한 루틴을 바로 실행하고, 필요하면 직접 운동 리스트를 새로 구성할 수 있어요.
            </Text>
          </View>

          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.84)", marginBottom: 8 }}>
              핵심 행동
            </Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 8 }}>
              나만의 운동 리스트 만들기
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.82)", lineHeight: 22, marginBottom: 18 }}>
              운동을 고르고 순서를 바꾸고, 세트와 반복 수까지 조정해서 플레이리스트처럼 루틴을 구성할 수 있어요.
            </Text>
            <Pressable
              onPress={() => handlePress(() => router.push("/custom-routine-builder" as never))}
              style={({ pressed }) => [
                {
                  minHeight: 56,
                  borderRadius: 16,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary }}>커스텀 루틴 시작하기</Text>
            </Pressable>
          </View>

          <View style={styles.sectionCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>내 루틴</Text>
              <Pressable onPress={() => handlePress(() => router.push("/(tabs)/my-routines"))}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>전체 보기</Text>
              </Pressable>
            </View>

            {savedRoutines.length === 0 ? (
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  padding: 16,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>
                  저장된 루틴이 없어요
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22 }}>
                  직접 루틴을 만들거나, 커뮤니티에서 마음에 드는 루틴을 저장해 보세요.
                </Text>
              </View>
            ) : (
              savedRoutines.slice(0, 3).map((savedRoutine) => (
                <View
                  key={savedRoutine.id}
                  style={{
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    padding: 16,
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground }}>
                        {savedRoutine.routine.name}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                        주 {savedRoutine.routine.daysPerWeek}일 · {savedRoutine.routine.durationWeeks}주
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handlePress(() => void handleStartRoutine(savedRoutine))}
                      style={({ pressed }) => [
                        {
                          minHeight: 40,
                          paddingHorizontal: 14,
                          borderRadius: 12,
                          backgroundColor: colors.primary,
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: pressed ? 0.84 : 1,
                        },
                      ]}
                    >
                      <Text style={{ color: "#fff", fontWeight: "800" }}>시작</Text>
                    </Pressable>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
                    {savedRoutine.routine.description}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>운동 라이브러리</Text>
              <Pressable onPress={() => handlePress(() => router.push("/custom-exercises"))}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>내 운동</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="운동 이름이나 부위를 검색해 보세요"
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={{ marginTop: 12 }}>
              {filteredExercises.map((exercise) => (
                <Pressable
                  key={exercise.id}
                  onPress={() => handlePress(() => router.push(`/workout/${exercise.id}` as never))}
                  style={({ pressed }) => [
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 12,
                      borderBottomWidth: 0.5,
                      borderBottomColor: colors.border,
                      opacity: pressed ? 0.84 : 1,
                    },
                  ]}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{exercise.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                      {exercise.muscleGroups.join(" · ")}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>커뮤니티</Text>
              <Pressable onPress={() => handlePress(() => router.push("/(tabs)/community"))}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>열기</Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22 }}>
              다른 사용자가 공유한 루틴을 저장해서 바로 내 루틴에 가져올 수 있어요.
            </Text>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
