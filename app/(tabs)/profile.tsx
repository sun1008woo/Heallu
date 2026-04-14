import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { LanguageSelector } from "@/components/language-selector";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useTranslationWithLanguageChange } from "@/hooks/use-translation";
import { clearAuthToken } from "@/lib/auth-token-storage";
import { getProgressStats, getUserProfile, saveUserProfile } from "@/lib/storage";
import { useThemeContext } from "@/lib/theme-provider";
import { ProgressStats, UserProfile } from "@/lib/types";

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "체중 감량",
  muscle_gain: "근육 증가",
  endurance: "지구력 향상",
  flexibility: "유연성 향상",
  general: "일반 건강",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const PREFERENCE_LABELS: Record<string, string> = {
  bodyweight: "맨몸 운동",
  weights: "웨이트",
  running: "러닝",
  mixed: "골고루",
};

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const { changeLanguage, currentLanguage } = useTranslationWithLanguageChange();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      getUserProfile().then(setProfile);
      getProgressStats().then(setStats);
    }, []),
  );

  const bmi = useMemo(() => {
    if (!profile?.weight || !profile?.height) return null;
    return profile.weight / Math.pow(profile.height / 100, 2);
  }, [profile]);

  const bmiLabel = useMemo(() => {
    if (!bmi) return "정보 없음";
    if (bmi < 18.5) return "저체중";
    if (bmi < 23) return "정상";
    if (bmi < 25) return "과체중";
    return "비만";
  }, [bmi]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 18,
        },
      }),
    [colors],
  );

  async function handleToggleNotifications(value: boolean) {
    if (!profile) return;
    const updatedProfile = { ...profile, notificationsEnabled: value };
    setProfile(updatedProfile);
    await saveUserProfile(updatedProfile);
  }

  async function handleLogout() {
    await clearAuthToken();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/auth");
  }

  const menuItems = [
    {
      label: "프로필 다시 설정",
      description: "온보딩 정보를 수정하고 추천 결과를 다시 맞춰요.",
      icon: "slider.horizontal.3" as const,
      color: colors.primary,
      onPress: () => router.push("/onboarding"),
    },
    {
      label: "진행 리포트 보기",
      description: "운동 횟수와 스트릭, 최근 기록을 확인해요.",
      icon: "chart.bar.fill" as const,
      color: colors.success,
      onPress: () => router.push("/(tabs)/progress"),
    },
    {
      label: "커뮤니티 루틴 둘러보기",
      description: "다른 사용자의 루틴을 저장하고 참고해요.",
      icon: "person.2.fill" as const,
      color: "#8B5CF6",
      onPress: () => router.push("/(tabs)/community"),
    },
    {
      label: "내 루틴 관리",
      description: "저장한 루틴을 확인하고 바로 실행해요.",
      icon: "bookmark.fill" as const,
      color: "#F97316",
      onPress: () => router.push("/(tabs)/my-routines"),
    },
  ];

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 18 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 30, fontWeight: "800", color: colors.foreground }}>내 정보</Text>
            <Text style={{ fontSize: 15, color: colors.muted, lineHeight: 22 }}>
              계정 정보와 설정, 보조 메뉴를 한곳에서 간단하게 관리해요.
            </Text>
          </View>

          <View style={[styles.card, { gap: 16 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: colors.primary + "18",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 28, fontWeight: "800", color: colors.primary }}>
                  {(profile?.name ?? "H").slice(0, 1)}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>
                  {profile?.name ?? "사용자"}
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted }}>
                  {GOAL_LABELS[profile?.goal ?? "general"]} · {LEVEL_LABELS[profile?.fitnessLevel ?? "beginner"]}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>
                  주 {profile?.weeklyWorkoutFrequency ?? 0}회 · {PREFERENCE_LABELS[profile?.workoutPreference ?? "mixed"]}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 16, padding: 14, gap: 4 }}>
                <Text style={{ fontSize: 12, color: colors.muted }}>현재 스트릭</Text>
                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>
                  {stats?.currentStreak ?? 0}일
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 16, padding: 14, gap: 4 }}>
                <Text style={{ fontSize: 12, color: colors.muted }}>BMI</Text>
                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>
                  {bmi ? bmi.toFixed(1) : "-"}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>{bmiLabel}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 16, padding: 14, gap: 4 }}>
                <Text style={{ fontSize: 12, color: colors.muted }}>총 운동 수</Text>
                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>
                  {stats?.totalWorkouts ?? 0}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, { gap: 12 }]}>
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground }}>바로 가기</Text>
            {menuItems.map((item) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.background,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    opacity: pressed ? 0.82 : 1,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: `${item.color}20`,
                  }}
                >
                  <IconSymbol name={item.icon} size={18} color={item.color} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{item.label}</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 19 }}>{item.description}</Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>

          <View style={[styles.card, { gap: 14 }]}>
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground }}>설정</Text>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>다크 모드</Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>더 차분한 화면 톤으로 전환해요.</Text>
              </View>
              <Switch
                value={colorScheme === "dark"}
                onValueChange={(enabled) => setColorScheme(enabled ? "dark" : "light")}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>언어</Text>
              <LanguageSelector currentLanguage={currentLanguage} onLanguageChange={changeLanguage} />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>알림</Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>루틴 리마인드와 주요 업데이트를 받아요.</Text>
              </View>
              <Switch
                value={profile?.notificationsEnabled ?? true}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <Pressable
            onPress={() =>
              Alert.alert("로그아웃", "정말 로그아웃할까요?", [
                { text: "취소", style: "cancel" },
                { text: "로그아웃", style: "destructive", onPress: () => void handleLogout() },
              ])
            }
            style={({ pressed }) => [
              {
                backgroundColor: "#EF444415",
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "#EF444440",
                paddingVertical: 16,
                alignItems: "center",
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <Text style={{ color: "#EF4444", fontSize: 15, fontWeight: "800" }}>로그아웃</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
