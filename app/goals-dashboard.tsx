import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Dimensions } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getAllGoalProgress,
  getGoalStatistics,
  type GoalProgress,
} from "@/lib/exercise-goals";

const { width } = Dimensions.get("window");

export default function GoalsDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [statistics, setStatistics] = useState({
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    abandonedGoals: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const progress = await getAllGoalProgress();
      setGoalProgress(progress);

      const stats = await getGoalStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("대시보드 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeGoals = goalProgress.filter((g) => g.goal.status === "active");
  const completedGoals = goalProgress.filter((g) => g.goal.status === "completed");
  const onTrackGoals = activeGoals.filter((g) => g.isOnTrack);

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
              목표 대시보드
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              운동 목표 진행 상황
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/manage-goals")}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 10,
              width: 44,
              height: 44,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconSymbol name="gear" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Summary Stats */}
        <View style={{ gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              gap: 8,
            }}
          >
            {/* Active Goals Card */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.primary + "20",
                borderRadius: 12,
                padding: 12,
                gap: 8,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.muted }}>진행 중</Text>
              <Text style={{ fontSize: 24, fontWeight: "700", color: colors.primary }}>
                {statistics.activeGoals}
              </Text>
              <Text style={{ fontSize: 10, color: colors.muted }}>
                {onTrackGoals.length} 추적 중
              </Text>
            </View>

            {/* Completed Goals Card */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.success + "20",
                borderRadius: 12,
                padding: 12,
                gap: 8,
                borderLeftWidth: 4,
                borderLeftColor: colors.success,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.muted }}>완료</Text>
              <Text style={{ fontSize: 24, fontWeight: "700", color: colors.success }}>
                {statistics.completedGoals}
              </Text>
              <Text style={{ fontSize: 10, color: colors.muted }}>
                {statistics.totalGoals > 0
                  ? `${statistics.completionRate.toFixed(0)}%`
                  : "0%"}
              </Text>
            </View>
          </View>

          {/* Overall Completion Rate */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              gap: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                전체 달성률
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.primary }}>
                {statistics.completionRate.toFixed(0)}%
              </Text>
            </View>

            <View
              style={{
                height: 12,
                backgroundColor: colors.border,
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${statistics.completionRate}%`,
                  backgroundColor: colors.primary,
                  borderRadius: 6,
                }}
              />
            </View>

            <Text style={{ fontSize: 11, color: colors.muted }}>
              {statistics.totalGoals}개 목표 중 {statistics.completedGoals}개 완료
            </Text>
          </View>
        </View>

        {/* Active Goals Section */}
        {activeGoals.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              진행 중인 목표
            </Text>

            {activeGoals.slice(0, 3).map((progress, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 12,
                  gap: 10,
                }}
              >
                {/* Goal Title */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                      {progress.goal.exerciseName}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      {progress.goal.currentValue} / {progress.goal.targetValue}{" "}
                      {progress.goal.unit}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={{
                      backgroundColor: progress.isOnTrack
                        ? colors.success + "20"
                        : colors.warning + "20",
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        color: progress.isOnTrack ? colors.success : colors.warning,
                      }}
                    >
                      {progress.isOnTrack ? "추적 중" : "주의"}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={{ gap: 4 }}>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.border,
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${Math.min(progress.progressPercentage, 100)}%`,
                        backgroundColor: progress.isOnTrack ? colors.primary : colors.warning,
                        borderRadius: 3,
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
                    <Text style={{ fontSize: 10, color: colors.muted }}>
                      {progress.progressPercentage.toFixed(0)}%
                    </Text>
                    {progress.daysRemaining !== undefined && (
                      <Text style={{ fontSize: 10, color: colors.muted }}>
                        {progress.daysRemaining > 0
                          ? `${progress.daysRemaining}일 남음`
                          : "기한 만료"}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}

            {activeGoals.length > 3 && (
              <TouchableOpacity
                onPress={() => router.push("/manage-goals")}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
                  모든 목표 보기 ({activeGoals.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Completed Goals Section */}
        {completedGoals.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              완료된 목표
            </Text>

            {completedGoals.slice(0, 2).map((progress, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: colors.success + "10",
                  borderRadius: 12,
                  padding: 12,
                  gap: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.success,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                      {progress.goal.exerciseName}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                      {progress.goal.currentValue} {progress.goal.unit} 달성
                    </Text>
                  </View>

                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {goalProgress.length === 0 && (
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
              운동 목표를 설정하고 진행 상황을 추적해보세요.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/manage-goals")}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingHorizontal: 20,
                paddingVertical: 10,
                marginTop: 8,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>
                목표 설정하기
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tips Section */}
        {goalProgress.length > 0 && (
          <View
            style={{
              backgroundColor: colors.primary + "10",
              borderRadius: 12,
              padding: 12,
              gap: 8,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
              💡 팁
            </Text>
            <Text style={{ fontSize: 12, color: colors.foreground, lineHeight: 18 }}>
              운동 기록을 입력할 때마다 목표 진행도가 자동으로 업데이트됩니다. 목표 달성 시
              축하 알림을 받습니다.
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
