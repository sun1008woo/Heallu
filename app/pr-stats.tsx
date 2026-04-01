import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getPRRecords,
  getExercisePRAchievements,
  type PersonalRecord,
  type PRAchievement,
} from "@/lib/pr-tracking";
import { PRBadge } from "@/components/pr-badge";

export default function PRStatsScreen() {
  const colors = useColors();
  const [prRecords, setPRRecords] = useState<PersonalRecord[]>([]);
  const [selectedExercisePR, setSelectedExercisePR] = useState<PersonalRecord | null>(null);
  const [selectedAchievements, setSelectedAchievements] = useState<PRAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadPRData();
    }, [])
  );

  const loadPRData = async () => {
    setLoading(true);
    try {
      const records = await getPRRecords();
      setPRRecords(records.sort((a, b) => b.totalPRCount - a.totalPRCount));
    } catch (error) {
      console.error("PR 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExercise = async (pr: PersonalRecord) => {
    setSelectedExercisePR(pr);
    try {
      const achievements = await getExercisePRAchievements(pr.exerciseId);
      setSelectedAchievements(achievements);
    } catch (error) {
      console.error("성취 기록 로드 실패:", error);
    }
  };

  const getAchievementTypeLabel = (type: string) => {
    switch (type) {
      case "reps":
        return "반복 횟수";
      case "weight":
        return "무게";
      case "both":
        return "반복 & 무게";
      default:
        return type;
    }
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
        <View>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
            개인 최고 기록
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            {prRecords.length}개 운동의 PR 기록
          </Text>
        </View>

        {prRecords.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 24,
              alignItems: "center",
              gap: 12,
            }}
          >
            <IconSymbol name="star" size={48} color={colors.muted} />
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              아직 PR이 없습니다
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center" }}>
              운동을 기록하고 신기록을 달성해보세요!
            </Text>
          </View>
        ) : selectedExercisePR ? (
          // Detailed view
          <View style={{ gap: 16 }}>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => setSelectedExercisePR(null)}
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <IconSymbol name="chevron.left" size={20} color={colors.primary} />
              <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>
                돌아가기
              </Text>
            </TouchableOpacity>

            {/* Exercise PR Details */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                gap: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>
                  {selectedExercisePR.exerciseName}
                </Text>
                <PRBadge type="both" size="medium" />
              </View>

              <View style={{ gap: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.muted }}>최대 반복</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#8B5CF6" }}>
                    {selectedExercisePR.maxReps}회
                  </Text>
                </View>

                {selectedExercisePR.maxWeight && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.muted }}>최대 무게</Text>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#FF6B35" }}>
                      {selectedExercisePR.maxWeight}kg
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.muted }}>총 신기록 횟수</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
                    {selectedExercisePR.totalPRCount}회
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.muted }}>달성 날짜</Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
                    {new Date(selectedExercisePR.achievedDate).toLocaleDateString("ko-KR")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Achievement History */}
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                신기록 이력
              </Text>
              {selectedAchievements.length === 0 ? (
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  이력이 없습니다
                </Text>
              ) : (
                selectedAchievements.map((achievement, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 8,
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
                      <Text style={{ fontSize: 12, color: colors.muted }}>
                        {new Date(achievement.achievedDate).toLocaleDateString("ko-KR")}
                      </Text>
                      <PRBadge type={achievement.type} size="small" />
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 11, color: colors.muted }}>
                        {getAchievementTypeLabel(achievement.type)}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                        <Text style={{ fontSize: 11, color: colors.muted }}>
                          {achievement.previousRecord}
                        </Text>
                        <IconSymbol name="arrow.right" size={14} color={colors.muted} />
                        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>
                          {achievement.newRecord}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : (
          // List view
          <View style={{ gap: 8 }}>
            {prRecords.map((pr, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSelectExercise(pr)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                    {pr.exerciseName}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <IconSymbol name="repeat" size={12} color={colors.muted} />
                      <Text style={{ fontSize: 11, color: colors.muted }}>
                        {pr.maxReps}회
                      </Text>
                    </View>
                    {pr.maxWeight && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <IconSymbol name="dumbbell.fill" size={12} color={colors.muted} />
                        <Text style={{ fontSize: 11, color: colors.muted }}>
                          {pr.maxWeight}kg
                        </Text>
                      </View>
                    )}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <IconSymbol name="star.fill" size={12} color="#FFD700" />
                      <Text style={{ fontSize: 11, color: colors.muted }}>
                        {pr.totalPRCount}회
                      </Text>
                    </View>
                  </View>
                </View>

                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
