import { Alert, ActivityIndicator, ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getRunningRoutine, toggleExerciseCompletion, updateDailyProgress } from "@/lib/routine-execution-storage";
import { RunningRoutine, DailyProgress, ExerciseProgress } from "@/lib/routine-execution-types";
import { ExerciseDetailsModal } from "@/components/modals/exercise-details-modal";

const DIFFICULTY_COLORS: Record<string, string> = {
  "초급": "#00D4AA",
  "중급": "#F59E0B",
  "고급": "#EF4444",
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
  }, [isExerciseActive, exerciseTimer]);

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
      Alert.alert("오류", "루틴을 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
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
      console.error("운동 상태 변경 실패:", error);
      Alert.alert("오류", "운동 상태를 변경할 수 없습니다.");
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

  const todayProgress = routine.dailyProgress.find((p) => p.date === selectedDate);
  const overallProgress = routine.overallCompletionPercentage;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    exerciseItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
  });

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { marginHorizontal: 20, marginBottom: 20 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
                {routine.routineName}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                {routine.routineDifficulty} • {routine.currentWeek}주차
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: DIFFICULTY_COLORS[routine.routineDifficulty] + "20",
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: DIFFICULTY_COLORS[routine.routineDifficulty] }}>
                {overallProgress}%
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-around", paddingTop: 12, borderTopWidth: 0.5, borderTopColor: colors.border }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>완료한 운동</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginTop: 4 }}>
                {routine.totalExercisesCompleted}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>전체 운동</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginTop: 4 }}>
                {routine.totalExercisesPlanned}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>시작일</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginTop: 4 }}>
                {new Date(routine.startDate).toLocaleDateString("ko-KR")}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>날짜 선택</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {Array.from({ length: 7 }).map((_, idx) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - idx));
              const dateStr = date.toISOString().split("T")[0];
              const isSelected = dateStr === selectedDate;
              const dayName = ["월", "화", "수", "목", "금", "토", "일"][date.getDay()];

              return (
                <Pressable
                  key={dateStr}
                  style={({ pressed }) => [{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  }]}
                  onPress={() => handlePress(() => setSelectedDate(dateStr))}
                >
                  <Text style={{ fontSize: 11, color: isSelected ? "#fff" : colors.muted, fontWeight: "600" }}>
                    {dayName}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? "#fff" : colors.foreground, marginTop: 2 }}>
                    {date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {todayProgress ? (
          <View style={[styles.card, { marginHorizontal: 20 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>오늘의 운동</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
                  {todayProgress.completedCount}/{todayProgress.totalCount}
                </Text>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
                  {todayProgress.completionPercentage}%
                </Text>
              </View>
            </View>

            {todayProgress.exercises.map((exercise, idx) => (
              <View key={idx}>
                <View style={styles.exerciseItem}>
                  <Pressable
                    style={({ pressed }) => [{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: exercise.completed ? colors.primary : colors.border,
                      backgroundColor: exercise.completed ? colors.primary : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed ? 0.8 : 1,
                    }]}
                    onPress={() => handlePress(() => handleToggleExercise(exercise.exerciseName))}
                  >
                    {exercise.completed && (
                      <IconSymbol name="checkmark" size={14} color="#fff" />
                    )}
                  </Pressable>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Pressable
                        style={{ flex: 1 }}
                        onPress={() => {
                          setSelectedExerciseIndex(idx);
                          setExerciseTimer(30);
                          setIsExerciseActive(true);
                        }}
                      >
                        <Text style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: colors.foreground,
                          textDecorationLine: exercise.completed ? "line-through" : "none",
                          opacity: exercise.completed ? 0.6 : 1,
                        }}>
                          {exercise.exerciseName}
                        </Text>
                        {exercise.sets && (
                          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                            {exercise.sets}세트 • 휴식 {exercise.restTime}초
                          </Text>
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setSelectedExerciseName(exercise.exerciseName);
                          setSelectedSets(exercise.sets || 3);
                          setSelectedRestTime(exercise.restTime || 60);
                          setSelectedExerciseIndex(idx);
                          setShowDetailsModal(true);
                        }}
                        style={({ pressed }) => [{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          opacity: pressed ? 0.7 : 1,
                        }]}
                      >
                        <IconSymbol name="gear" size={18} color={colors.primary} />
                      </Pressable>
                    </View>
                    {exercise.notes && (
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                        {exercise.notes}
                      </Text>
                    )}
                    {selectedExerciseIndex === idx && isExerciseActive && (
                      <View style={{ marginTop: 8, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: colors.primary + "20", borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>운동 타이머</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.primary }}>
                            {exerciseTimer}초
                          </Text>
                          <Pressable
                            onPress={() => setIsExerciseActive(!isExerciseActive)}
                            style={({ pressed }) => [{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              backgroundColor: colors.primary,
                              borderRadius: 6,
                              opacity: pressed ? 0.8 : 1,
                            }]}
                          >
                            <Text style={{ fontSize: 11, fontWeight: "600", color: "#fff" }}>
                              {isExerciseActive ? "일시정지" : "재개"}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.card, { marginHorizontal: 20, alignItems: "center", paddingVertical: 24 }]}>
            <IconSymbol name="calendar" size={32} color={colors.muted} />
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>
              이 날짜의 운동 계획이 없습니다.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <ExerciseDetailsModal
        visible={showDetailsModal}
        exerciseName={selectedExerciseName}
        initialSets={selectedSets}
        initialRestTime={selectedRestTime}
        onSave={(sets, restTime) => {
          setSelectedSets(sets);
          setSelectedRestTime(restTime);
          setShowDetailsModal(false);
          if (routine && selectedExerciseIndex !== null) {
            const todayEx = routine.dailyProgress.find((p) => p.date === selectedDate);
            if (todayEx && todayEx.exercises[selectedExerciseIndex]) {
              todayEx.exercises[selectedExerciseIndex].sets = sets;
              todayEx.exercises[selectedExerciseIndex].restTime = restTime;
            }
          }
        }}
        onCancel={() => setShowDetailsModal(false)}
      />
    </ScreenContainer>
  );
}
