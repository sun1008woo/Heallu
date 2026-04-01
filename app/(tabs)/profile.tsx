import { ScrollView, Text, View, StyleSheet, TextInput, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, Switch } from "react-native";
import { getVideoPreviewSettings, saveVideoPreviewSettings } from "@/lib/video-preview-settings";
import type { VideoPreviewSettings } from "@/lib/video-preview-settings";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useTranslationWithLanguageChange } from "@/hooks/use-translation";
import { DEFAULT_PROFILE, getUserProfile, saveUserProfile } from "@/lib/storage";
import { UserProfile, FitnessGoal, DifficultyLevel } from "@/lib/types";
import { useThemeContext } from "@/lib/theme-provider";
import { clearAuthToken } from "@/lib/auth-token-storage";
import { LanguageSelector } from "@/components/language-selector";

const GOALS: { id: FitnessGoal; label: string; icon: string; color: string }[] = [
  { id: "weight_loss", label: "체중 감량", icon: "🔥", color: "#EF4444" },
  { id: "muscle_gain", label: "근육 증가", icon: "💪", color: "#FF6B35" },
  { id: "endurance", label: "지구력 향상", icon: "🏃", color: "#00D4AA" },
  { id: "flexibility", label: "유연성 향상", icon: "🧘", color: "#8B5CF6" },
  { id: "general", label: "전반적 건강", icon: "❤️", color: "#F59E0B" },
];

const LEVELS: { id: DifficultyLevel; label: string }[] = [
  { id: "beginner", label: "초급" },
  { id: "intermediate", label: "중급" },
  { id: "advanced", label: "고급" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const { changeLanguage, currentLanguage } = useTranslationWithLanguageChange();
  const [profile, setProfile] = useState<UserProfile>({
    name: "사용자",
    age: 25,
    weight: 70,
    height: 170,
    goal: "general",
    fitnessLevel: "beginner",
    notificationsEnabled: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState<UserProfile>(profile);
  const [videoPreviewSettings, setVideoPreviewSettings] = useState<VideoPreviewSettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      getUserProfile().then((p) => {
        setProfile(p);
        setEditProfile(p);
      });
      loadVideoPreviewSettings();
    }, [])
  );

  const loadVideoPreviewSettings = async () => {
    try {
      const settings = await getVideoPreviewSettings();
      setVideoPreviewSettings(settings);
    } catch (error) {
      console.error("영상 미리보기 설정 로드 실패:", error);
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

  const handleSave = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await saveUserProfile(editProfile);
    setProfile(editProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditProfile(profile);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await clearAuthToken();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace("/auth");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  const bmi = profile.weight / Math.pow(profile.height / 100, 2);
  const bmiLabel = bmi < 18.5 ? "저체중" : bmi < 23 ? "정상" : bmi < 25 ? "과체중" : "비만";
  const bmiColor = bmi < 18.5 ? "#F59E0B" : bmi < 23 ? "#00D4AA" : bmi < 25 ? "#F59E0B" : "#EF4444";

  const styles = StyleSheet.create({
    section: {
      marginHorizontal: 20,
      marginTop: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    input: {
      fontSize: 15,
      color: colors.foreground,
      textAlign: "right",
      minWidth: 80,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.background,
    },
    goalChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1.5,
      marginBottom: 8,
    },
  });

  const currentGoal = GOALS.find((g) => g.id === profile.goal);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: colors.foreground }}>프로필</Text>
          {!isEditing ? (
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary + "15", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }]}
              onPress={() => setIsEditing(true)}
            >
              <IconSymbol name="pencil" size={16} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>편집</Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border }]}
                onPress={handleCancel}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted }}>취소</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>저장</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Avatar & Name */}
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: 12, borderWidth: 3, borderColor: colors.primary }}>
            <Text style={{ fontSize: 36 }}>🏋️</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>{profile.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
            <Text style={{ fontSize: 20 }}>{currentGoal?.icon}</Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>{currentGoal?.label}</Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>·</Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>{LEVELS.find((l) => l.id === profile.fitnessLevel)?.label}</Text>
          </View>
        </View>

        {/* BMI Card */}
        <View style={{ marginHorizontal: 20, backgroundColor: bmiColor + "15", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: bmiColor + "30" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 4 }}>체질량지수 (BMI)</Text>
              <Text style={{ fontSize: 28, fontWeight: "700", color: bmiColor }}>{bmi.toFixed(1)}</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: bmiColor }}>{bmiLabel}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={{ fontSize: 14, color: colors.foreground }}>{profile.weight}kg</Text>
              <Text style={{ fontSize: 14, color: colors.foreground }}>{profile.height}cm</Text>
              <Text style={{ fontSize: 14, color: colors.foreground }}>{profile.age}세</Text>
            </View>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>개인 정보</Text>
          {[
            { label: "이름", key: "name" as keyof UserProfile, type: "text" },
            { label: "나이", key: "age" as keyof UserProfile, type: "number", suffix: "세" },
            { label: "몸무게", key: "weight" as keyof UserProfile, type: "number", suffix: "kg" },
            { label: "키", key: "height" as keyof UserProfile, type: "number", suffix: "cm" },
          ].map(({ label, key, type, suffix }, i, arr) => (
            <View key={key} style={[styles.inputRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={{ fontSize: 15, color: colors.foreground }}>{label}</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={String(editProfile[key])}
                  onChangeText={(v) => setEditProfile({ ...editProfile, [key]: type === "number" ? (parseFloat(v) || 0) : v })}
                  keyboardType={type === "number" ? "numeric" : "default"}
                  returnKeyType="done"
                />
              ) : (
                <Text style={{ fontSize: 15, color: colors.muted }}>{String(profile[key])}{suffix ?? ""}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Fitness Goal */}
        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>운동 목표</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {GOALS.map((goal) => {
              const isSelected = (isEditing ? editProfile : profile).goal === goal.id;
              return (
                <Pressable
                  key={goal.id}
                  style={({ pressed }) => [
                    styles.goalChip,
                    {
                      width: "47%",
                      backgroundColor: isSelected ? goal.color + "20" : "transparent",
                      borderColor: isSelected ? goal.color : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                  onPress={() => isEditing && setEditProfile({ ...editProfile, goal: goal.id })}
                  disabled={!isEditing}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>{goal.icon}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: isSelected ? goal.color : colors.muted }}>{goal.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Fitness Level */}
        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>체력 수준</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {LEVELS.map((level) => {
              const isSelected = (isEditing ? editProfile : profile).fitnessLevel === level.id;
              return (
                <Pressable
                  key={level.id}
                  style={({ pressed }) => [{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: "center",
                    borderWidth: 1.5,
                    backgroundColor: isSelected ? colors.primary + "20" : "transparent",
                    borderColor: isSelected ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  }]}
                  onPress={() => isEditing && setEditProfile({ ...editProfile, fitnessLevel: level.id })}
                  disabled={!isEditing}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: isSelected ? colors.primary : colors.muted }}>{level.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Personalization Actions */}
        <View style={{ paddingHorizontal: 20, marginTop: 16, gap: 10 }}>
          <Pressable
            style={({ pressed }) => [{
              backgroundColor: colors.primary,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.9 : 1,
            }]}
            onPress={() => router.push("/ai-recommendation")}
          >
            <IconSymbol name="sparkles" size={18} color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>맞춤형 운동 루틴</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [{
              backgroundColor: "#FF6B35",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              display: "none",
              opacity: pressed ? 0.9 : 1,
            }]}
            onPress={() => router.push("/ai-recommendation")}
          >
            <IconSymbol name="sparkles" size={18} color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>AI 루틴 추천</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [{
              backgroundColor: "#00D4AA",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.9 : 1,
            }]}
            onPress={() => router.push("/diet")}
          >
            <IconSymbol name="fork.knife" size={18} color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>맞춤형 식단 추천</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [{
              backgroundColor: colors.primary + "40",
              borderRadius: 14,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.9 : 1,
              borderWidth: 1.5,
              borderColor: colors.primary,
            }]}
            onPress={() => router.push("/home-ingredients-diet")}
          >
            <IconSymbol name="list.bullet" size={16} color={colors.primary} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>집 재료 식단</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [{
              backgroundColor: colors.primary + "40",
              borderRadius: 14,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.9 : 1,
              borderWidth: 1.5,
              borderColor: colors.primary,
            }]}
            onPress={() => router.push("/saved-routines")}
          >
            <IconSymbol name="bookmark.fill" size={16} color={colors.primary} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>저장된 루틴</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [{
              backgroundColor: "#00D4AA40",
              borderRadius: 14,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.9 : 1,
              borderWidth: 1.5,
              borderColor: "#00D4AA",
            }]}
            onPress={() => router.push("/saved-diets")}
          >
            <IconSymbol name="bookmark.fill" size={16} color="#00D4AA" />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#00D4AA" }}>저장된 식단</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [{
              backgroundColor: "#8B5CF640",
              borderRadius: 14,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.9 : 1,
              borderWidth: 1.5,
              borderColor: "#8B5CF6",
            }]}
            onPress={() => router.push("/follow-management")}
          >
            <IconSymbol name="person.2.fill" size={16} color="#8B5CF6" />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#8B5CF6" }}>팔로우 관리</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [{
              backgroundColor: "#F59E0B40",
              borderRadius: 14,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.9 : 1,
              borderWidth: 1.5,
              borderColor: "#F59E0B",
            }]}
            onPress={() => router.push("/notifications")}
          >
            <IconSymbol name="bell.fill" size={16} color="#F59E0B" />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#F59E0B" }}>알림</Text>
          </Pressable>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>설정</Text>
          <View style={[styles.inputRow]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <IconSymbol name="moon.fill" size={20} color="#8B5CF6" />
              <Text style={{ fontSize: 15, color: colors.foreground }}>다크 모드</Text>
            </View>
            <Switch
              value={colorScheme === "dark"}
              onValueChange={(v) => setColorScheme(v ? "dark" : "light")}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.inputRow]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <IconSymbol name="globe" size={20} color="#0a7ea4" />
              <Text style={{ fontSize: 15, color: colors.foreground }}>언어</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <LanguageSelector
                currentLanguage={currentLanguage}
                onLanguageChange={changeLanguage}
              />
            </View>
          </View>
          {videoPreviewSettings && (
            <View style={[styles.inputRow, { borderBottomWidth: 0 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <IconSymbol name="play.circle.fill" size={20} color="#FF6B35" />
                <Text style={{ fontSize: 15, color: colors.foreground }}>운동 영상 미리보기</Text>
              </View>
              <Switch
                value={videoPreviewSettings.enableVideoPreview}
                onValueChange={handleToggleVideoPreview}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          )}
        </View>

        {/* Logout Button */}
        <Pressable
          style={({ pressed }) => [{
            backgroundColor: "#EF4444",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            marginTop: 24,
            opacity: pressed ? 0.9 : 1,
          }]}
          onPress={handleLogout}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>로그아웃</Text>
        </Pressable>

        {/* App Info */}
        <View style={{ alignItems: "center", marginTop: 24, gap: 4 }}>
          <Text style={{ fontSize: 13, color: colors.muted }}>Heallu</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>버전 1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
