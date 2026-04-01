import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Dimensions } from "react-native";
import { useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getExerciseRecordsByExerciseId,
  getExerciseStats,
  getWeeklyActivitySummary,
  type ExerciseSessionRecord,
} from "@/lib/exercise-records";

const screenWidth = Dimensions.get("window").width;

interface ExerciseProgressProps {
  exerciseId?: string;
  exerciseName?: string;
}

export default function ExerciseProgressScreen() {
  const colors = useColors();
  const [exerciseId] = useState("test_exercise");
  const [exerciseName] = useState("벤치프레스");
  const [records, setRecords] = useState<ExerciseSessionRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("week");

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [recordsData, statsData, weeklyData] = await Promise.all([
        getExerciseRecordsByExerciseId(exerciseId),
        getExerciseStats(exerciseId),
        getWeeklyActivitySummary(),
      ]);

      setRecords(recordsData);
      setStats(statsData);
      setWeeklyActivity(weeklyData);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRecords = () => {
    const now = new Date();
    const filtered = records.filter((record) => {
      const recordDate = new Date(record.date);
      if (selectedPeriod === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return recordDate >= weekAgo;
      } else if (selectedPeriod === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return recordDate >= monthAgo;
      }
      return true;
    });
    return filtered;
  };

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[date.getDay()];
  };

  const getMaxRepsInPeriod = () => {
    const filtered = getFilteredRecords();
    if (filtered.length === 0) return 0;
    return Math.max(...filtered.flatMap((r) => r.sets.map((s) => s.completedReps)));
  };

  const maxReps = getMaxRepsInPeriod();
  const filteredRecords = getFilteredRecords();

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
            {exerciseName}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            진행 상황 및 통계
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          <View
            style={{
              flex: 1,
              minWidth: 150,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.muted }}>총 세션</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.primary }}>
              {stats?.totalSessions || 0}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              minWidth: 150,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.muted }}>총 세트</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.primary }}>
              {stats?.totalSets || 0}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              minWidth: 150,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.muted }}>총 반복</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.primary }}>
              {stats?.totalReps || 0}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              minWidth: 150,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.muted }}>최대 반복</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#FF6B35" }}>
              {stats?.maxReps || 0}
            </Text>
          </View>
        </View>

        {/* Period Selector */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            기간 선택
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["week", "month", "all"] as const).map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={{
                  flex: 1,
                  backgroundColor: selectedPeriod === period ? colors.primary : colors.surface,
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: selectedPeriod === period ? "#fff" : colors.foreground,
                  }}
                >
                  {period === "week" ? "1주" : period === "month" ? "1개월" : "전체"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weekly Activity Chart */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            주간 활동
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", gap: 6, alignItems: "flex-end", height: 120 }}>
              {Object.entries(weeklyActivity).map(([date, count]) => {
                const maxCount = Math.max(...Object.values(weeklyActivity), 1);
                const height = (count / maxCount) * 100;
                return (
                  <View
                    key={date}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <View
                      style={{
                        width: "100%",
                        height: height,
                        backgroundColor: colors.primary,
                        borderRadius: 4,
                      }}
                    />
                    <Text style={{ fontSize: 10, color: colors.muted }}>
                      {getDayLabel(date)}
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colors.foreground }}>
                      {count}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Rep Progress Chart */}
        {filteredRecords.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              반복 횟수 추이
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", height: 120 }}>
                {filteredRecords.map((record, index) => {
                  const avgReps =
                    record.sets.reduce((sum, s) => sum + s.completedReps, 0) / record.sets.length;
                  const height = maxReps > 0 ? (avgReps / maxReps) * 100 : 0;
                  return (
                    <View
                      key={index}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <View
                        style={{
                          width: "100%",
                          height: height,
                          backgroundColor: "#8B5CF6",
                          borderRadius: 4,
                        }}
                      />
                      <Text style={{ fontSize: 9, color: colors.muted }}>
                        {new Date(record.date).getDate()}일
                      </Text>
                      <Text style={{ fontSize: 9, fontWeight: "600", color: colors.foreground }}>
                        {Math.round(avgReps)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Recent Records */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            최근 기록
          </Text>
          {filteredRecords.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 24,
                alignItems: "center",
                gap: 8,
              }}
            >
              <IconSymbol name="calendar" size={32} color={colors.muted} />
              <Text style={{ fontSize: 14, color: colors.muted }}>
                이 기간에 기록이 없습니다
              </Text>
            </View>
          ) : (
            filteredRecords.map((record, index) => (
              <View
                key={index}
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
                    {new Date(record.date).toLocaleDateString("ko-KR")}
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primary + "20",
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
                      {record.sets.length}세트
                    </Text>
                  </View>
                </View>

                {/* Sets Summary */}
                <View style={{ gap: 4 }}>
                  {record.sets.map((set, setIndex) => (
                    <View
                      key={setIndex}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        backgroundColor: colors.background,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: colors.muted }}>
                        세트 {set.setNumber}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                        <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: "600" }}>
                          {set.completedReps}회
                        </Text>
                        {set.weight && (
                          <Text style={{ fontSize: 12, color: colors.muted }}>
                            {set.weight}kg
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                {/* Record Notes */}
                {record.notes && (
                  <Text style={{ fontSize: 11, color: colors.muted, fontStyle: "italic" }}>
                    메모: {record.notes}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
