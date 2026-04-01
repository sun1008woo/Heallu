import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getExerciseGoals,
  getGoalProgress,
  deleteExerciseGoal,
  abandonExerciseGoal,
  completeExerciseGoal,
  type ExerciseGoal,
  type GoalProgress,
} from "@/lib/exercise-goals";
import { SetGoalModal } from "@/components/modals/set-goal-modal";

export default function ManageGoalsScreen() {
  const colors = useColors();
  const [goals, setGoals] = useState<ExerciseGoal[]>([]);
  const [goalProgress, setGoalProgress] = useState<Map<string, GoalProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showSetGoalModal, setShowSetGoalModal] = useState(false);
  const [selectedExerciseForGoal, setSelectedExerciseForGoal] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadGoals();
    }, [])
  );

  const loadGoals = async () => {
    setLoading(true);
    try {
      const allGoals = await getExerciseGoals();
      setGoals(allGoals);

      const progressMap = new Map<string, GoalProgress>();
      for (const goal of allGoals) {
        const progress = await getGoalProgress(goal.id);
        if (progress) {
          progressMap.set(goal.id, progress);
        }
      }
      setGoalProgress(progressMap);
    } catch (error) {
      console.error("목표 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    Alert.alert("목표 삭제", "이 목표를 삭제하시겠습니까?", [
      { text: "취소", onPress: () => {} },
      {
        text: "삭제",
        onPress: async () => {
          try {
            await deleteExerciseGoal(goalId);
            loadGoals();
          } catch (error) {
            Alert.alert("오류", "목표 삭제에 실패했습니다.");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleAbandonGoal = (goalId: string) => {
    Alert.alert("목표 포기", "이 목표를 포기하시겠습니까?", [
      { text: "취소", onPress: () => {} },
      {
        text: "포기",
        onPress: async () => {
          try {
            await abandonExerciseGoal(goalId);
            loadGoals();
          } catch (error) {
            Alert.alert("오류", "목표 포기에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const handleCompleteGoal = (goalId: string) => {
    Alert.alert("목표 완료", "이 목표를 완료하시겠습니까?", [
      { text: "취소", onPress: () => {} },
      {
        text: "완료",
        onPress: async () => {
          try {
            await completeExerciseGoal(goalId);
            loadGoals();
          } catch (error) {
            Alert.alert("오류", "목표 완료에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const getGoalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reps: "반복 횟수",
      weight: "무게",
      duration: "운동 시간",
      frequency: "운동 빈도",
    };
    return labels[type] || type;
  };

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      weekly: "주간",
      monthly: "월간",
      yearly: "연간",
    };
    return labels[period] || period;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return colors.success;
      case "abandoned":
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: "진행 중",
      completed: "완료",
      abandoned: "포기",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <Text style={{ color: colors.muted }}>로딩 중...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
              운동 목표
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              {goals.length}개의 목표
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setSelectedExerciseForGoal(null);
              setShowSetGoalModal(true);
            }}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 10,
              width: 44,
              height: 44,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconSymbol name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 24,
              alignItems: "center",
              gap: 12,
            }}
          >
            <IconSymbol name="target" size={48} color={colors.muted} />
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              설정된 목표가 없습니다
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center" }}>
              위의 + 버튼을 눌러 새로운 목표를 설정해보세요.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {goals.map((goal) => {
              const progress = goalProgress.get(goal.id);
              if (!progress) return null;

              return (
                <View
                  key={goal.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 12,
                    gap: 12,
                  }}
                >
                  {/* Goal Header */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                        {goal.exerciseName}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                        <Text style={{ fontSize: 11, color: colors.muted }}>
                          {getGoalTypeLabel(goal.goalType)}
                        </Text>
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: colors.muted,
                          }}
                        />
                        <Text style={{ fontSize: 11, color: colors.muted }}>
                          {getPeriodLabel(goal.period)}
                        </Text>
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: colors.muted,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            color: getStatusColor(goal.status),
                            fontWeight: "600",
                          }}
                        >
                          {getStatusLabel(goal.status)}
                        </Text>
                      </View>
                    </View>

                    {/* Menu Button */}
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert("목표 관리", "", [
                          {
                            text: goal.status === "completed" ? "다시 활성화" : "완료",
                            onPress: () => {
                              if (goal.status === "completed") {
                                // 다시 활성화 로직
                              } else {
                                handleCompleteGoal(goal.id);
                              }
                            },
                          },
                          {
                            text: "포기",
                            onPress: () => handleAbandonGoal(goal.id),
                          },
                          {
                            text: "삭제",
                            onPress: () => handleDeleteGoal(goal.id),
                            style: "destructive",
                          },
                          { text: "취소", style: "cancel" },
                        ]);
                      }}
                      style={{ padding: 4 }}
                    >
                      <IconSymbol name="ellipsis" size={20} color={colors.muted} />
                    </TouchableOpacity>
                  </View>

                  {/* Progress Bar */}
                  <View style={{ gap: 4 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 12, color: colors.muted }}>진행도</Text>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </Text>
                    </View>

                    <View
                      style={{
                        height: 8,
                        backgroundColor: colors.border,
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${Math.min(progress.progressPercentage, 100)}%`,
                          backgroundColor: progress.isCompleted
                            ? colors.success
                            : progress.isOnTrack
                              ? colors.primary
                              : colors.warning,
                          borderRadius: 4,
                        }}
                      />
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 11, color: colors.muted }}>
                        {progress.progressPercentage.toFixed(0)}%
                      </Text>
                      {progress.daysRemaining !== undefined && (
                        <Text style={{ fontSize: 11, color: colors.muted }}>
                          {progress.daysRemaining > 0
                            ? `${progress.daysRemaining}일 남음`
                            : "기한 만료"}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Status Indicator */}
                  {!progress.isOnTrack && goal.status === "active" && (
                    <View
                      style={{
                        backgroundColor: colors.warning + "20",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <IconSymbol name="exclamationmark.circle.fill" size={14} color={colors.warning} />
                      <Text style={{ fontSize: 11, color: colors.warning, fontWeight: "600" }}>
                        목표 달성 추적 중
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Set Goal Modal */}
      <SetGoalModal
        visible={showSetGoalModal}
        exerciseId={selectedExerciseForGoal?.id || ""}
        exerciseName={selectedExerciseForGoal?.name || ""}
        onClose={() => setShowSetGoalModal(false)}
        onGoalCreated={() => {
          setShowSetGoalModal(false);
          loadGoals();
        }}
      />
    </ScreenContainer>
  );
}
