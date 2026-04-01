import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { addExerciseRecord, type ExerciseSetRecord } from "@/lib/exercise-records";
import * as Haptics from "expo-haptics";

interface RecordExerciseProps {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  onRecordSaved?: () => void;
}

export default function RecordExerciseScreen() {
  const router = useRouter();
  const colors = useColors();

  // Get params from route
  const [exerciseId] = useState("test_exercise");
  const [exerciseName] = useState("벤치프레스");
  const [targetSets] = useState(3);
  const [targetReps] = useState(8);

  const [sets, setSets] = useState<Omit<ExerciseSetRecord, "timestamp">[]>(
    Array.from({ length: targetSets }, (_, i) => ({
      setNumber: i + 1,
      completedReps: targetReps,
      weight: undefined,
      notes: undefined,
    }))
  );
  const [totalDuration, setTotalDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);

  const handleSetRepsChange = (index: number, reps: number) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], completedReps: reps };
    setSets(newSets);
  };

  const handleSetWeightChange = (index: number, weight: string) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], weight: weight ? parseFloat(weight) : undefined };
    setSets(newSets);
  };

  const handleSetNotesChange = (index: number, note: string) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], notes: note || undefined };
    setSets(newSets);
  };

  const handleSaveRecord = async () => {
    if (sets.some((s) => s.completedReps < 0)) {
      Alert.alert("오류", "반복 횟수는 0 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await addExerciseRecord({
        exerciseId,
        exerciseName,
        date: today,
        sets,
        totalDuration: totalDuration ? parseInt(totalDuration) : undefined,
        notes: notes || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("성공", "운동 기록이 저장되었습니다.");
      router.back();
    } catch (error) {
      Alert.alert("오류", "기록 저장에 실패했습니다.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
              {exerciseName}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              {targetSets}세트 x {targetReps}반복
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="xmark.circle.fill" size={28} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Sets Progress */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            세트 진행도
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {sets.map((_, index) => (
              <View
                key={index}
                style={{
                  flex: 1,
                  backgroundColor: index <= currentSetIndex ? colors.primary : colors.surface,
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: index <= currentSetIndex ? "#fff" : colors.foreground,
                  }}
                >
                  세트 {index + 1}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sets Details */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            세트별 기록
          </Text>
          {sets.map((set, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setCurrentSetIndex(index)}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                borderLeftWidth: 4,
                borderLeftColor: index === currentSetIndex ? colors.primary : colors.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  세트 {index + 1}
                </Text>
                {set.completedReps >= targetReps && (
                  <View style={{ backgroundColor: "#22C55E", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 10, color: "#fff", fontWeight: "600" }}>
                      완료
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ gap: 8 }}>
                {/* Reps */}
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: colors.muted, flex: 0.3 }}>
                    반복
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        if (set.completedReps > 0) {
                          handleSetRepsChange(index, set.completedReps - 1);
                        }
                      }}
                    >
                      <IconSymbol name="minus.circle.fill" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TextInput
                      style={{
                        flex: 1,
                        textAlign: "center",
                        color: colors.foreground,
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                      keyboardType="number-pad"
                      value={set.completedReps.toString()}
                      onChangeText={(text) => handleSetRepsChange(index, parseInt(text) || 0)}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        handleSetRepsChange(index, set.completedReps + 1);
                      }}
                    >
                      <IconSymbol name="plus.circle.fill" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Weight */}
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: colors.muted, flex: 0.3 }}>
                    무게 (kg)
                  </Text>
                  <TextInput
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      color: colors.foreground,
                      fontSize: 12,
                    }}
                    placeholder="선택사항"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    value={set.weight?.toString() || ""}
                    onChangeText={(text) => handleSetWeightChange(index, text)}
                  />
                </View>

                {/* Notes */}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Text style={{ fontSize: 12, color: colors.muted, flex: 0.3 }}>
                    메모
                  </Text>
                  <TextInput
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      color: colors.foreground,
                      fontSize: 12,
                    }}
                    placeholder="선택사항"
                    placeholderTextColor={colors.muted}
                    value={set.notes || ""}
                    onChangeText={(text) => handleSetNotesChange(index, text)}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Duration */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            총 운동 시간 (분)
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.foreground,
              fontSize: 14,
            }}
            placeholder="선택사항"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            value={totalDuration}
            onChangeText={setTotalDuration}
          />
        </View>

        {/* Overall Notes */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            운동 메모
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.foreground,
              fontSize: 14,
              minHeight: 80,
            }}
            placeholder="운동에 대한 전체 메모를 입력하세요."
            placeholderTextColor={colors.muted}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
            취소
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSaveRecord}
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: "center",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
            {loading ? "저장 중..." : "기록 저장"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
