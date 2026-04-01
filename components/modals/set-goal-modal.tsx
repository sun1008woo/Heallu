import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { createExerciseGoal, type GoalType, type GoalPeriod } from "@/lib/exercise-goals";

interface SetGoalModalProps {
  visible: boolean;
  exerciseId: string;
  exerciseName: string;
  onClose: () => void;
  onGoalCreated?: () => void;
}

export function SetGoalModal({
  visible,
  exerciseId,
  exerciseName,
  onClose,
  onGoalCreated,
}: SetGoalModalProps) {
  const colors = useColors();
  const [goalType, setGoalType] = useState<GoalType>("reps");
  const [targetValue, setTargetValue] = useState("");
  const [period, setPeriod] = useState<GoalPeriod>("weekly");
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const goalTypeOptions: { label: string; value: GoalType; unit: string }[] = [
    { label: "반복 횟수", value: "reps", unit: "회" },
    { label: "무게", value: "weight", unit: "kg" },
    { label: "운동 시간", value: "duration", unit: "분" },
    { label: "운동 빈도", value: "frequency", unit: "회/주" },
  ];

  const periodOptions: { label: string; value: GoalPeriod }[] = [
    { label: "주간", value: "weekly" },
    { label: "월간", value: "monthly" },
    { label: "연간", value: "yearly" },
  ];

  const getUnitForType = (type: GoalType) => {
    const option = goalTypeOptions.find((o) => o.value === type);
    return option?.unit || "";
  };

  const handleCreateGoal = async () => {
    if (!targetValue || isNaN(Number(targetValue))) {
      Alert.alert("오류", "목표값을 올바르게 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      await createExerciseGoal({
        exerciseId,
        exerciseName,
        goalType,
        targetValue: Number(targetValue),
        unit: getUnitForType(goalType),
        period,
        endDate: hasEndDate ? endDate : undefined,
      });

      Alert.alert("성공", "운동 목표가 설정되었습니다.");
      onGoalCreated?.();
      handleClose();
    } catch (error) {
      console.error("목표 설정 실패:", error);
      Alert.alert("오류", "목표 설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGoalType("reps");
    setTargetValue("");
    setPeriod("weekly");
    setHasEndDate(false);
    setEndDate("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <ScreenContainer
        className="p-4"
        style={{ backgroundColor: colors.background }}
      >
        <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>
              운동 목표 설정
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <IconSymbol name="xmark" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Exercise Name */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.muted }}>운동</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              {exerciseName}
            </Text>
          </View>

          {/* Goal Type Selection */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>
              목표 유형
            </Text>
            <View style={{ gap: 8 }}>
              {goalTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setGoalType(option.value)}
                  style={{
                    backgroundColor: goalType === option.value ? colors.primary + "20" : colors.surface,
                    borderRadius: 10,
                    padding: 12,
                    borderWidth: 2,
                    borderColor: goalType === option.value ? colors.primary : colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: goalType === option.value ? colors.primary : colors.foreground,
                    }}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: goalType === option.value ? colors.primary : colors.muted,
                    }}
                  >
                    ({option.unit})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target Value Input */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>
              목표값
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 16,
                  color: colors.foreground,
                }}
                placeholder="목표값 입력"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                value={targetValue}
                onChangeText={setTargetValue}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.foreground,
                  minWidth: 40,
                }}
              >
                {getUnitForType(goalType)}
              </Text>
            </View>
          </View>

          {/* Period Selection */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>
              기간
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {periodOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setPeriod(option.value)}
                  style={{
                    flex: 1,
                    backgroundColor: period === option.value ? colors.primary : colors.surface,
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: period === option.value ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: period === option.value ? "#fff" : colors.foreground,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* End Date Toggle */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              종료 날짜 설정
            </Text>
            <Switch
              value={hasEndDate}
              onValueChange={setHasEndDate}
              trackColor={{ false: colors.border, true: colors.primary + "50" }}
              thumbColor={hasEndDate ? colors.primary : colors.muted}
            />
          </View>

          {/* End Date Input */}
          {hasEndDate && (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>
                종료 날짜 (YYYY-MM-DD)
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: colors.foreground,
                }}
                placeholder="2026-12-31"
                placeholderTextColor={colors.muted}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          )}

          {/* Info Box */}
          <View
            style={{
              backgroundColor: colors.primary + "10",
              borderRadius: 10,
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
              목표를 설정하면 운동 기록을 통해 진행도를 추적할 수 있습니다. 목표 달성 시 축하
              알림을 받습니다.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                취소
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCreateGoal}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: "center",
                opacity: loading ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                {loading ? "설정 중..." : "목표 설정"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    </Modal>
  );
}
