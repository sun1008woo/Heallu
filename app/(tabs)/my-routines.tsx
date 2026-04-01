import { ScrollView, Text, View, Pressable, StyleSheet, ActivityIndicator, Alert, FlatList } from "react-native";
import { useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getSavedRoutines, deleteRoutine } from "@/lib/saved-routines-diets";
import { SavedRoutine } from "@/lib/saved-routines-diets";
import { createRunningRoutine, startRoutine } from "@/lib/routine-execution-storage";
import { useRouter } from "expo-router";

const DIFFICULTY_COLORS: Record<string, string> = {
  "초급": "#00D4AA",
  "중급": "#F59E0B",
  "고급": "#EF4444",
};

export default function MyRoutinesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [routines, setRoutines] = useState<SavedRoutine[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [])
  );

  const loadRoutines = async () => {
    setIsLoading(true);
    try {
      const data = await getSavedRoutines();
      setRoutines(data);
    } catch (error) {
      console.error("루틴 목록 로드 실패:", error);
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

  const handleStartRoutine = async (routine: SavedRoutine) => {
    try {
      const runningRoutine = createRunningRoutine(routine.id, routine.routine);
      const savedRoutine = await startRoutine(runningRoutine);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.push(`/routine-execution/${savedRoutine.id}`);
    } catch (error) {
      console.error("루틴 시작 실패:", error);
      Alert.alert("오류", "루틴을 시작할 수 없습니다.");
    }
  };

  const handleDeleteRoutine = (id: string, name: string) => {
    Alert.alert(
      "루틴 삭제",
      `"${name}"을(를) 삭제하시겠습니까?`,
      [
        { text: "취소", onPress: () => {}, style: "cancel" },
        {
          text: "삭제",
          onPress: async () => {
            try {
              await deleteRoutine(id);
              await loadRoutines();
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              console.error("루틴 삭제 실패:", error);
              Alert.alert("오류", "루틴 삭제에 실패했습니다.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    button: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#fff",
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

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 4, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: colors.foreground }}>
            내 루틴
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            저장된 맞춤형 운동 루틴
          </Text>
        </View>

        {/* Routines List */}
        {routines.length > 0 ? (
          <View>
            {routines.map((item) => (
              <View key={item.id} style={styles.card}>
                {/* Header */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                      {item.routine.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                      {new Date(item.savedAt).toLocaleDateString("ko-KR")}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: DIFFICULTY_COLORS[item.routine.difficulty] + "20" }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: DIFFICULTY_COLORS[item.routine.difficulty] }}>
                      {item.routine.difficulty}
                    </Text>
                  </View>
                </View>

                {/* Info */}
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.muted }}>주당 일수</Text>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginTop: 2 }}>
                      {item.routine.daysPerWeek}일
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.muted }}>주차</Text>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginTop: 2 }}>
                      {item.routine.durationWeeks}주
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.muted }}>총 운동</Text>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginTop: 2 }}>
                      {item.routine.dailyWorkouts.length}개
                    </Text>
                  </View>
                </View>

                {/* Description */}
                {item.routine.description && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
                      {item.routine.description}
                    </Text>
                  </View>
                )}

                {/* Buttons */}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.button,
                      { flex: 1, opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => handlePress(() => handleStartRoutine(item))}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <IconSymbol name="play.fill" size={14} color="#fff" />
                      <Text style={styles.buttonText}>시작</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: colors.error + "20",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                    onPress={() => handlePress(() => handleDeleteRoutine(item.id, item.name))}
                  >
                    <IconSymbol name="trash.fill" size={16} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.card, { alignItems: "center", paddingVertical: 40 }]}>
            <IconSymbol name="heart.slash" size={40} color={colors.muted} />
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginTop: 12 }}>
              저장된 루틴이 없습니다
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, textAlign: "center" }}>
              프로필에서 맞춤형 루틴을 생성하고 저장해보세요
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
