import { ScrollView, Text, View, Pressable, StyleSheet, FlatList, Alert, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getSavedRoutines, deleteRoutine } from "@/lib/saved-routines-diets";
import { SavedRoutine } from "@/lib/saved-routines-diets";
import { startRoutine, createRunningRoutine } from "@/lib/routine-execution-storage";
import { RoutineShareModal } from "@/components/modals/routine-share-modal";

const DIFFICULTY_COLORS: Record<string, string> = {
  "초급": "#00D4AA",
  "중급": "#F59E0B",
  "고급": "#EF4444",
};

export default function SavedRoutinesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [routines, setRoutines] = useState<SavedRoutine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<SavedRoutine | null>(null);

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

  const handleStartRoutine = async (routine: SavedRoutine) => {
    try {
      const runningRoutine = createRunningRoutine(routine.id, routine.routine);
      await startRoutine(runningRoutine);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.push(`/routine-execution/${runningRoutine.id}` as any);
    } catch (error) {
      Alert.alert("시작 실패", "루틴 시작에 실패했습니다.");
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
              Alert.alert("삭제 실패", "루틴 삭제에 실패했습니다.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handlePress = (action: () => void) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    action();
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
  });

  const renderRoutine = ({ item }: { item: SavedRoutine }) => (
    <View style={styles.card}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{item.routine.name}</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            저장: {new Date(item.savedAt).toLocaleDateString("ko-KR")}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: DIFFICULTY_COLORS[item.routine.difficulty] + "20" }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: DIFFICULTY_COLORS[item.routine.difficulty] }}>
            {item.routine.difficulty}
          </Text>
        </View>
      </View>

      <View style={{ gap: 8, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted }}>기간</Text>
          <Text style={{ fontWeight: "600", color: colors.foreground }}>{item.routine.durationWeeks}주</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted }}>주당 운동일</Text>
          <Text style={{ fontWeight: "600", color: colors.foreground }}>{item.routine.daysPerWeek}일</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted }}>총 칼로리</Text>
          <Text style={{ fontWeight: "600", color: colors.primary }}>약 {item.routine.totalCaloriesBurn}kcal/주</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          style={({ pressed }) => [{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: "center",
            backgroundColor: colors.primary,
            opacity: pressed ? 0.8 : 1,
          }]}
          onPress={() => handlePress(() => handleStartRoutine(item))}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>시작</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: colors.primary,
            opacity: pressed ? 0.8 : 1,
          }]}
          onPress={() => handlePress(() => router.push(`/routine-detail/${item.id}`))}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>상세</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: "center",
            backgroundColor: "#00D4AA",
            opacity: pressed ? 0.8 : 1,
          }]}
          onPress={() => handlePress(() => {
            setSelectedRoutine(item);
            setShareModalVisible(true);
          })}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>공유</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: "#EF4444",
            opacity: pressed ? 0.8 : 1,
          }]}
          onPress={() => handlePress(() => handleDeleteRoutine(item.id, item.routine.name))}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#EF4444" }}>삭제</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.primary} />
        </Pressable>
        <Text style={{ fontSize: 26, fontWeight: "700", color: colors.foreground }}>저장된 루틴</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : routines.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
          <IconSymbol name="folder.badge.questionmark" size={48} color={colors.muted} />
          <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, textAlign: "center" }}>
            저장된 루틴이 없습니다.{"\n"}맞춤형 루틴을 생성하고 저장해보세요!
          </Text>
        </View>
      ) : (
        <FlatList
          data={routines}
          renderItem={renderRoutine}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selectedRoutine && (
        <RoutineShareModal
          visible={shareModalVisible}
          routine={selectedRoutine.routine}
          creatorName="사용자"
          onClose={() => setShareModalVisible(false)}
        />
      )}
    </ScreenContainer>
  );
}
