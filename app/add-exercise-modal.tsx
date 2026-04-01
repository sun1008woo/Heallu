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
import { useColors } from "@/hooks/use-colors";
import { addCustomExercise, type CustomExerciseInput } from "@/lib/custom-exercises";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface AddExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onExerciseAdded: () => void;
}

const MUSCLE_GROUPS = [
  "가슴",
  "등",
  "어깨",
  "이두",
  "삼두",
  "전완",
  "복부",
  "허리",
  "다리",
  "종아리",
];

const DIFFICULTIES = [
  { id: "beginner", label: "초급" },
  { id: "intermediate", label: "중급" },
  { id: "advanced", label: "고급" },
];

export default function AddExerciseModal({
  visible,
  onClose,
  onExerciseAdded,
}: AddExerciseModalProps) {
  const colors = useColors();
  const [formData, setFormData] = useState<CustomExerciseInput>({
    name: "",
    description: "",
    sets: 3,
    reps: 10,
    restTime: 60,
    muscleGroups: [],
    difficulty: "beginner",
  });
  const [loading, setLoading] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);

  const handleToggleMuscle = (muscle: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
    setFormData((prev) => ({
      ...prev,
      muscleGroups: selectedMuscles.includes(muscle)
        ? selectedMuscles.filter((m) => m !== muscle)
        : [...selectedMuscles, muscle],
    }));
  };

  const handleAddExercise = async () => {
    if (!formData.name.trim()) {
      Alert.alert("오류", "운동 이름을 입력해주세요.");
      return;
    }

    if (selectedMuscles.length === 0) {
      Alert.alert("오류", "근육 그룹을 선택해주세요.");
      return;
    }

    if (formData.sets <= 0 || formData.reps <= 0) {
      Alert.alert("오류", "세트와 반복 횟수는 0보다 커야 합니다.");
      return;
    }

    setLoading(true);
    try {
      await addCustomExercise({
        ...formData,
        muscleGroups: selectedMuscles,
      });

      Alert.alert("성공", "운동이 추가되었습니다.");
      resetForm();
      onExerciseAdded();
      onClose();
    } catch (error) {
      Alert.alert("오류", "운동 추가에 실패했습니다.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      sets: 3,
      reps: 10,
      restTime: 60,
      muscleGroups: [],
      difficulty: "beginner",
    });
    setSelectedMuscles([]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.surface,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
            운동 추가
          </Text>
          <TouchableOpacity onPress={onClose}>
            <IconSymbol name="xmark" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1, padding: 16 }}
          contentContainerStyle={{ gap: 16, paddingBottom: 20 }}
        >
          {/* Exercise Name */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              운동 이름 *
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
              placeholder="예: 덤벨 벤치프레스"
              placeholderTextColor={colors.muted}
              value={formData.name}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
            />
          </View>

          {/* Description */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              설명
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
                minHeight: 60,
              }}
              placeholder="운동에 대한 설명을 입력하세요."
              placeholderTextColor={colors.muted}
              multiline
              value={formData.description}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, description: text }))
              }
            />
          </View>

          {/* Sets and Reps */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                세트
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
                placeholder="3"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                value={formData.sets.toString()}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, sets: parseInt(text) || 0 }))
                }
              />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                반복
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
                placeholder="10"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                value={formData.reps.toString()}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, reps: parseInt(text) || 0 }))
                }
              />
            </View>
          </View>

          {/* Rest Time */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              휴식 시간 (초)
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
              placeholder="60"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              value={formData.restTime.toString()}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, restTime: parseInt(text) || 0 }))
              }
            />
          </View>

          {/* Muscle Groups */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              근육 그룹 *
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {MUSCLE_GROUPS.map((muscle) => (
                <TouchableOpacity
                  key={muscle}
                  onPress={() => handleToggleMuscle(muscle)}
                  style={{
                    backgroundColor: selectedMuscles.includes(muscle)
                      ? colors.primary
                      : colors.surface,
                    borderWidth: 1,
                    borderColor: selectedMuscles.includes(muscle)
                      ? colors.primary
                      : colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      color: selectedMuscles.includes(muscle)
                        ? "#fff"
                        : colors.foreground,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {muscle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Difficulty */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              난이도
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {DIFFICULTIES.map((diff) => (
                <TouchableOpacity
                  key={diff.id}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      difficulty: diff.id as "beginner" | "intermediate" | "advanced",
                    }))
                  }
                  style={{
                    flex: 1,
                    backgroundColor:
                      formData.difficulty === diff.id ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor:
                      formData.difficulty === diff.id ? colors.primary : colors.border,
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: formData.difficulty === diff.id ? "#fff" : colors.foreground,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {diff.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* YouTube Video ID */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              유튜브 비디오 ID (선택사항)
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
              placeholder="dQw4w9WgXcQ"
              placeholderTextColor={colors.muted}
              value={formData.youtubeVideoId || ""}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, youtubeVideoId: text || undefined }))
              }
            />
          </View>

          {/* Notes */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              메모
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
                minHeight: 60,
              }}
              placeholder="추가 메모를 입력하세요."
              placeholderTextColor={colors.muted}
              multiline
              value={formData.notes || ""}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, notes: text || undefined }))
              }
            />
          </View>
        </ScrollView>

        {/* Footer Buttons */}
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
            onPress={onClose}
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
            onPress={handleAddExercise}
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
              {loading ? "추가 중..." : "운동 추가"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
