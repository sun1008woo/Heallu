import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getCustomExercises,
  deleteCustomExercise,
  type CustomExercise,
} from "@/lib/custom-exercises";
import AddExerciseModal from "@/app/add-exercise-modal";

export default function CustomExercisesScreen() {
  const colors = useColors();
  const [exercises, setExercises] = useState<CustomExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<CustomExercise | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadExercises();
    }, [])
  );

  const loadExercises = async () => {
    setLoading(true);
    try {
      const data = await getCustomExercises();
      setExercises(data);
    } catch (error) {
      Alert.alert("오류", "운동 목록을 불러올 수 없습니다.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExercise = (id: string, name: string) => {
    Alert.alert(
      "운동 삭제",
      `"${name}"을(를) 삭제하시겠습니까?`,
      [
        { text: "취소", onPress: () => {}, style: "cancel" },
        {
          text: "삭제",
          onPress: async () => {
            try {
              await deleteCustomExercise(id);
              loadExercises();
              Alert.alert("성공", "운동이 삭제되었습니다.");
            } catch (error) {
              Alert.alert("오류", "운동 삭제에 실패했습니다.");
              console.error(error);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const getDifficultyLabel = (difficulty: string) => {
    const map: Record<string, string> = {
      beginner: "초급",
      intermediate: "중급",
      advanced: "고급",
    };
    return map[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "#22C55E";
      case "intermediate":
        return "#F59E0B";
      case "advanced":
        return "#EF4444";
      default:
        return colors.primary;
    }
  };

  const renderExerciseCard = (exercise: CustomExercise) => (
    <TouchableOpacity
      key={exercise.id}
      onPress={() => setSelectedExercise(exercise)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: getDifficultyColor(exercise.difficulty),
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
            {exercise.name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            {exercise.description}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteExercise(exercise.id, exercise.name)}
          style={{ padding: 8 }}
        >
          <IconSymbol name="trash.fill" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Exercise Details */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <View style={{ backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>세트</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            {exercise.sets}
          </Text>
        </View>
        <View style={{ backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>반복</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            {exercise.reps}
          </Text>
        </View>
        <View style={{ backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>휴식</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            {exercise.restTime}초
          </Text>
        </View>
      </View>

      {/* Muscle Groups */}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {exercise.muscleGroups.map((muscle) => (
          <View
            key={muscle}
            style={{
              backgroundColor: colors.primary + "20",
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
              {muscle}
            </Text>
          </View>
        ))}
      </View>

      {/* Difficulty Badge */}
      <View
        style={{
          backgroundColor: getDifficultyColor(exercise.difficulty) + "20",
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 4,
          alignSelf: "flex-start",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: getDifficultyColor(exercise.difficulty),
            fontWeight: "600",
          }}
        >
          {getDifficultyLabel(exercise.difficulty)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View style={{ marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
            나의 운동
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            {exercises.length}개의 운동
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: "row",
            gap: 6,
            alignItems: "center",
          }}
        >
          <IconSymbol name="plus" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
            추가
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exercises List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>로딩 중...</Text>
        </View>
      ) : exercises.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
          <IconSymbol name="dumbbell.fill" size={48} color={colors.muted} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
            아직 운동이 없습니다
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center" }}>
            새로운 운동을 추가하여 시작하세요
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {exercises.map((exercise) => renderExerciseCard(exercise))}
        </ScrollView>
      )}

      {/* Add Exercise Modal */}
      <AddExerciseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onExerciseAdded={() => {
          loadExercises();
          setShowAddModal(false);
        }}
      />

      {/* Exercise Detail Modal */}
      <Modal visible={selectedExercise !== null} animationType="slide" transparent={false}>
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
              운동 상세
            </Text>
            <TouchableOpacity onPress={() => setSelectedExercise(null)}>
              <IconSymbol name="xmark" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {selectedExercise && (
            <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
              {/* Title */}
              <View>
                <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
                  {selectedExercise.name}
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
                  {selectedExercise.description}
                </Text>
              </View>

              {/* Basic Info */}
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  기본 정보
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontSize: 12, color: colors.muted }}>세트</Text>
                    <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginTop: 4 }}>
                      {selectedExercise.sets}
                    </Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontSize: 12, color: colors.muted }}>반복</Text>
                    <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginTop: 4 }}>
                      {selectedExercise.reps}
                    </Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontSize: 12, color: colors.muted }}>휴식 (초)</Text>
                    <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginTop: 4 }}>
                      {selectedExercise.restTime}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Muscle Groups */}
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  근육 그룹
                </Text>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {selectedExercise.muscleGroups.map((muscle) => (
                    <View
                      key={muscle}
                      style={{
                        backgroundColor: colors.primary + "20",
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
                        {muscle}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Difficulty */}
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  난이도
                </Text>
                <View
                  style={{
                    backgroundColor: getDifficultyColor(selectedExercise.difficulty) + "20",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: getDifficultyColor(selectedExercise.difficulty),
                      fontWeight: "600",
                    }}
                  >
                    {getDifficultyLabel(selectedExercise.difficulty)}
                  </Text>
                </View>
              </View>

              {/* Notes */}
              {selectedExercise.notes && (
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                    메모
                  </Text>
                  <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12 }}>
                    <Text style={{ fontSize: 12, color: colors.foreground, lineHeight: 18 }}>
                      {selectedExercise.notes}
                    </Text>
                  </View>
                </View>
              )}

              {/* YouTube Video */}
              {selectedExercise.youtubeVideoId && (
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                    영상
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 8,
                      paddingVertical: 12,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <IconSymbol name="play.circle.fill" size={20} color="#fff" />
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                      유튜브에서 보기
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Delete Button */}
              <TouchableOpacity
                onPress={() => {
                  handleDeleteExercise(selectedExercise.id, selectedExercise.name);
                  setSelectedExercise(null);
                }}
                style={{
                  backgroundColor: "#EF4444" + "20",
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: "center",
                  marginTop: 12,
                }}
              >
                <Text style={{ color: "#EF4444", fontSize: 14, fontWeight: "600" }}>
                  운동 삭제
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScreenContainer>
  );
}
