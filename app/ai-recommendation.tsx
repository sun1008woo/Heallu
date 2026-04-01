import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getUserProfile } from "@/lib/storage";
import { saveRoutine } from "@/lib/saved-routines-diets";
import { trpc } from "@/lib/trpc";
import type { UserProfile } from "@/lib/types";
import type { RoutineRecommendation } from "@/lib/ai-recommendation-types";
import type { WorkoutRoutine } from "@/lib/routine-diet-types";
import { getVideoPreviewSettings, saveVideoPreviewSettings } from "@/lib/video-preview-settings";
import type { VideoPreviewSettings } from "@/lib/video-preview-settings";
import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import AddExerciseModal from "@/app/add-exercise-modal";
import { getCustomExercises, type CustomExercise } from "@/lib/custom-exercises";

function getEquipmentFromPreference(preference?: UserProfile["workoutPreference"]) {
  if (preference === "bodyweight" || preference === "running") return "home" as const;
  if (preference === "weights") return "gym" as const;
  return "both" as const;
}

export default function AIRecommendationScreen() {
  const router = useRouter();
  const colors = useColors();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recommendation, setRecommendation] = useState<RoutineRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [videoPreviewSettings, setVideoPreviewSettings] = useState<VideoPreviewSettings | null>(null);
  const [selectedExerciseVideo, setSelectedExerciseVideo] = useState<{ name: string; videoId: string } | null>(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);

  const recommendMutation = trpc.personalization.recommendRoutine.useMutation();

  useEffect(() => {
    loadUserProfile();
    loadVideoPreviewSettings();
    loadCustomExercises();
  }, []);

  const loadCustomExercises = async () => {
    try {
      const exercises = await getCustomExercises();
      setCustomExercises(exercises);
    } catch (error) {
      console.error("사용자 정의 운동 로드 실패:", error);
    }
  };

  const loadVideoPreviewSettings = async () => {
    try {
      const settings = await getVideoPreviewSettings();
      setVideoPreviewSettings(settings);
    } catch (error) {
      console.error("영상 미리보기 설정 로드 실패:", error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
      if (profile.weeklyWorkoutFrequency && profile.weeklyWorkoutFrequency > 0) {
        setDaysPerWeek(profile.weeklyWorkoutFrequency);
      }
    } catch (error) {
      console.error("프로필 로드 실패:", error);
    }
  };

  const handleGetRecommendation = async () => {
    if (!userProfile) {
      Alert.alert("오류", "사용자 프로필을 불러올 수 없습니다.");
      return;
    }

    setLoading(true);
    try {
      const result = await recommendMutation.mutateAsync({
        age: userProfile.age,
        weight: userProfile.weight,
        height: userProfile.height,
        goal: userProfile.goal,
        fitnessLevel: userProfile.fitnessLevel,
        daysPerWeek,
        durationWeeks,
        equipment: getEquipmentFromPreference(userProfile.workoutPreference),
        gender: userProfile.gender,
        weightUnit: userProfile.weightUnit,
        weeklyWorkoutFrequency: userProfile.weeklyWorkoutFrequency,
        workoutPreference: userProfile.workoutPreference,
      });

      setRecommendation(result);
    } catch (error) {
      console.error("추천 생성 실패:", error);
      Alert.alert("오류", "루틴 추천 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVideoPreview = async () => {
    if (!videoPreviewSettings) return;
    try {
      const newSettings: VideoPreviewSettings = {
        ...videoPreviewSettings,
        enableVideoPreview: !videoPreviewSettings.enableVideoPreview,
      };
      await saveVideoPreviewSettings(newSettings);
      setVideoPreviewSettings(newSettings);
    } catch (error) {
      console.error("영상 미리보기 설정 변경 실패:", error);
    }
  };

  const handleSaveRecommendation = async () => {
    if (!recommendation) return;

    try {
      // Convert recommendation to WorkoutRoutine format
      const routine = {
        id: `recommendation-${Date.now()}`,
        name: recommendation.name,
        description: recommendation.description,
        goal: recommendation.goal,
        difficulty: recommendation.difficulty,
        durationWeeks: recommendation.durationWeeks,
        daysPerWeek: recommendation.daysPerWeek,
        dailyWorkouts: recommendation.dailyWorkouts.map((day) => ({
          day: day.day,
          exercises: day.exercises.map((ex) => ({
            exerciseId: `ex-${Date.now()}-${Math.random()}`,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            restTime: ex.restTime,
            notes: "",
          })),
          totalDuration: 0,
          totalCalories: 0,
        })),
        totalCaloriesBurn: recommendation.totalCaloriesBurn,
        notes: recommendation.tips?.join(", ") || "",
      };

      await saveRoutine(routine);
      Alert.alert("성공", "루틴이 저장되었습니다.", [
        {
          text: "내 루틴 보기",
          onPress: () => router.push("/my-routines"),
        },
        {
          text: "닫기",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("루틴 저장 실패:", error);
      Alert.alert("오류", "루틴 저장에 실패했습니다.");
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">AI 루틴 추천</Text>
            <Text className="text-base text-muted">
              당신의 목표와 체력 수준에 맞는 최적의 루틴을 추천받으세요
            </Text>
          </View>

          {/* User Profile Info */}
          {userProfile && (
            <View className="bg-surface rounded-2xl p-4 gap-3">
              <Text className="text-lg font-semibold text-foreground">현재 프로필</Text>
              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">나이</Text>
                  <Text className="text-sm font-semibold text-foreground">{userProfile.age}세</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">체중</Text>
                  <Text className="text-sm font-semibold text-foreground">{userProfile.weight}kg</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">키</Text>
                  <Text className="text-sm font-semibold text-foreground">{userProfile.height}cm</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">목표</Text>
                  <Text className="text-sm font-semibold text-foreground">{userProfile.goal}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">체력 수준</Text>
                  <Text className="text-sm font-semibold text-foreground">{userProfile.fitnessLevel}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Settings */}
          <View className="bg-surface rounded-2xl p-4 gap-4">
            <Text className="text-lg font-semibold text-foreground">루틴 설정</Text>

            {/* Days Per Week */}
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm font-medium text-foreground">주당 운동 빈도</Text>
                <Text className="text-sm font-semibold text-primary">{daysPerWeek}일</Text>
              </View>
              <View className="flex-row gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setDaysPerWeek(day)}
                    style={{
                      backgroundColor: daysPerWeek === day ? colors.primary : colors.border,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: daysPerWeek === day ? "#fff" : colors.foreground,
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration Weeks */}
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm font-medium text-foreground">루틴 기간</Text>
                <Text className="text-sm font-semibold text-primary">{durationWeeks}주</Text>
              </View>
              <View className="flex-row gap-2">
                {[2, 4, 6, 8, 12].map((weeks) => (
                  <TouchableOpacity
                    key={weeks}
                    onPress={() => setDurationWeeks(weeks)}
                    style={{
                      backgroundColor: durationWeeks === weeks ? colors.primary : colors.border,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: durationWeeks === weeks ? "#fff" : colors.foreground,
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      {weeks}주
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Get Recommendation Button */}
          {!recommendation && (
            <TouchableOpacity
              onPress={handleGetRecommendation}
              disabled={loading}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                  루틴 추천 받기
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Video Modal */}
          {selectedExerciseVideo && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              }}
            >
              <View style={{ width: "90%", gap: 12 }}>
                {/* Video Player */}
                <View
                  style={{
                    width: "100%",
                    aspectRatio: 16 / 9,
                    backgroundColor: "#000",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      WebBrowser.openBrowserAsync(
                        `https://www.youtube.com/watch?v=${selectedExerciseVideo.videoId}`
                      );
                    }}
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#000",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 14, textAlign: "center" }}>
                      유튜브에서 영상 보기
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Exercise Name */}
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                  {selectedExerciseVideo.name}
                </Text>

                {/* Close Button */}
                <TouchableOpacity
                  onPress={() => setSelectedExerciseVideo(null)}
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>닫기</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Recommendation Result */}
          {recommendation && (
            <View className="bg-surface rounded-2xl p-4 gap-4">
              <View className="gap-2">
                <Text className="text-2xl font-bold text-foreground">{recommendation.name}</Text>
                <Text className="text-sm text-muted">{recommendation.description}</Text>
              </View>

              {/* Stats */}
              <View className="flex-row gap-2">
                <View
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                    {recommendation.difficulty}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colors.border,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }}>
                    {recommendation.durationWeeks}주
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colors.border,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }}>
                    주 {recommendation.daysPerWeek}일
                  </Text>
                </View>
              </View>

              {/* Video Preview Settings */}
              {videoPreviewSettings && (
                <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, gap: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                      영상 미리보기
                    </Text>
                    <TouchableOpacity
                      onPress={handleToggleVideoPreview}
                      style={{
                        backgroundColor: videoPreviewSettings.enableVideoPreview ? colors.primary : colors.border,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: videoPreviewSettings.enableVideoPreview ? "#fff" : colors.foreground,
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {videoPreviewSettings.enableVideoPreview ? "활성화" : "비활성화"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Add Custom Exercise Button */}
              <TouchableOpacity
                onPress={() => setShowAddExerciseModal(true)}
                style={{
                  backgroundColor: colors.primary + "20",
                  borderWidth: 2,
                  borderColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <IconSymbol name="plus.circle.fill" size={20} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>
                  운동 추가
                </Text>
              </TouchableOpacity>

              {/* Daily Workouts */}
              <View className="gap-3">
                <Text className="text-lg font-semibold text-foreground">운동 계획</Text>
                {recommendation.dailyWorkouts.map((dayWorkout, dayIndex) => (
                  <View key={dayIndex} className="bg-background rounded-xl p-3 gap-2">
                    <Text className="font-semibold text-foreground">{dayWorkout.day}</Text>
                    {dayWorkout.exercises.map((exercise, exIndex) => (
                      <TouchableOpacity
                        key={exIndex}
                        onPress={() => {
                          if (videoPreviewSettings?.enableVideoPreview && exercise.youtubeVideoId) {
                            setSelectedExerciseVideo({
                              name: exercise.name,
                              videoId: exercise.youtubeVideoId,
                            });
                          }
                        }}
                        style={{ opacity: videoPreviewSettings?.enableVideoPreview && exercise.youtubeVideoId ? 0.8 : 1 }}
                      >
                        <View className="flex-row justify-between items-center pl-2 pr-2 py-1">
                          <View className="flex-1 gap-1">
                            <Text className="text-sm text-muted flex-1">{exercise.name}</Text>
                            {videoPreviewSettings?.enableVideoPreview && exercise.youtubeVideoId && (
                              <Text className="text-xs text-primary">탭하여 영상 보기</Text>
                            )}
                          </View>
                          <Text className="text-sm font-medium text-foreground">
                            {exercise.sets}x{exercise.reps}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>

              {/* Tips */}
              {recommendation.tips && recommendation.tips.length > 0 && (
                <View className="gap-2">
                  <Text className="text-lg font-semibold text-foreground">팁</Text>
                  {recommendation.tips.map((tip, index) => (
                    <View key={index} className="flex-row gap-2">
                      <Text className="text-primary font-bold">•</Text>
                      <Text className="text-sm text-muted flex-1">{tip}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Estimated Results */}
              {recommendation.estimatedResults && (
                <View className="bg-background rounded-xl p-3 gap-2">
                  <Text className="font-semibold text-foreground">예상 결과</Text>
                  <View className="gap-1">
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted">체중 변화</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        {recommendation.estimatedResults.weightChange}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted">근력 향상</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        {recommendation.estimatedResults.muscleGain}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted">기간</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        {recommendation.estimatedResults.timeframe}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View className="gap-2 pt-2">
                <TouchableOpacity
                  onPress={handleSaveRecommendation}
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                    루틴 저장
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRecommendation(null)}
                  style={{
                    backgroundColor: colors.border,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
                    다시 추천받기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Exercise Modal */}
      <AddExerciseModal
        visible={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        onExerciseAdded={() => {
          loadCustomExercises();
        }}
      />
    </ScreenContainer>
  );
}
