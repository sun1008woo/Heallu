import React from "react";
import { Modal, View, Text, Pressable, TextInput } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface ExerciseDetailsModalProps {
  visible: boolean;
  exerciseName: string;
  initialSets?: number;
  initialRestTime?: number;
  onSave: (sets: number, restTime: number) => void;
  onCancel: () => void;
}

export function ExerciseDetailsModal({
  visible,
  exerciseName,
  initialSets = 3,
  initialRestTime = 60,
  onSave,
  onCancel,
}: ExerciseDetailsModalProps) {
  const colors = useColors();
  const [sets, setSets] = React.useState(initialSets.toString());
  const [restTime, setRestTime] = React.useState(initialRestTime.toString());

  React.useEffect(() => {
    setSets(initialSets.toString());
    setRestTime(initialRestTime.toString());
  }, [initialSets, initialRestTime, visible]);

  const handleSave = () => {
    const setsNum = parseInt(sets) || 3;
    const restNum = parseInt(restTime) || 60;
    onSave(setsNum, restNum);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 24,
            width: "85%",
            maxWidth: 400,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>
            {exerciseName}
          </Text>

          {/* Sets Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
              세트 수
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.foreground,
                backgroundColor: colors.background,
              }}
              keyboardType="number-pad"
              value={sets}
              onChangeText={setSets}
              placeholder="세트 수 입력"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Rest Time Input */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
              휴식 시간 (초)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.foreground,
                backgroundColor: colors.background,
              }}
              keyboardType="number-pad"
              value={restTime}
              onChangeText={setRestTime}
              placeholder="휴식 시간 입력 (초)"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: colors.border,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={onCancel}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>취소</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={handleSave}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>저장</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

