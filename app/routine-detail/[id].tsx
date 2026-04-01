import { ScrollView, View, Text, Pressable, Alert, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getSavedRoutines } from "@/lib/saved-routines-diets";
import { WorkoutRoutine } from "@/lib/routine-diet-types";

export default function RoutineDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routine, setRoutine] = useState<any>(null);

  useEffect(() => {
    loadRoutineDetail();
  }, [id]);

  const loadRoutineDetail = async () => {
    if (!id) return;
    const routines = await getSavedRoutines();
    const found = routines.find((r) => r.id === id);
    if (found) {
      setRoutine(found);
    }
  };

  if (!routine) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.foreground }}>루틴을 불러올 수 없습니다.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Pressable onPress={() => router.back()}>
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>루틴 상세</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Routine Info */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
              {routine.name}
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>난이도</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  {routine.difficulty === "beginner" ? "초급" : routine.difficulty === "intermediate" ? "중급" : "고급"}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>기간</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  {routine.durationWeeks}주
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>주당 운동일</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  {routine.daysPerWeek}일
                </Text>
              </View>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>설명</Text>
              <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
                {routine.description}
              </Text>
            </View>
          </View>

          {/* Weekly Schedule */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
              주간 운동 계획
            </Text>
            {routine.dailyWorkouts.map((day: any, idx: number) => (
              <View
                key={idx}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary, marginBottom: 8 }}>
                  {day.day}
                </Text>
                {day.exercises && day.exercises.length === 0 ? (
                  <Text style={{ fontSize: 12, color: colors.muted }}>휴식일</Text>
                ) : (
                  <FlatList
                    scrollEnabled={false}
                    data={day.exercises}
                    keyExtractor={(_, idx: number) => idx.toString()}
                    renderItem={({ item, index }: any) => (
                      <View style={{ marginBottom: index < day.exercises.length - 1 ? 8 : 0 }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                          {item.sets} 세트 × {item.reps} 회 (휴식 {item.restTime}초)
                        </Text>
                      </View>
                    )}
                  />
                )}
              </View>
            ))}
          </View>

          {/* Goal & Notes */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
              루틴 정보
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>목표</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                  {routine.goal}
                </Text>
              </View>
              {routine.notes && (
                <View>
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>참고사항</Text>
                  <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
                    {routine.notes}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Calories */}
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                backgroundColor: colors.primary + "20",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>예상 소모 칼로리</Text>
              <Text style={{ fontSize: 24, fontWeight: "700", color: colors.primary }}>
                {routine.totalCaloriesBurn}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>주당 총 칼로리 소모량</Text>
            </View>
          </View>

          {/* Start Button */}
          <Pressable
            style={({ pressed }) => [{
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: colors.primary,
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
              marginBottom: 20,
            }]}
            onPress={() => {
              Alert.alert("루틴 시작", "이 루틴을 시작하시겠습니까?", [
                { text: "취소", onPress: () => {} },
                {
                  text: "시작",
                  onPress: () => router.push(`/routine-execution/${routine.id}`),
                },
              ]);
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>루틴 시작하기</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
