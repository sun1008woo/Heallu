import { AppLoadingScreen } from "@/components/app-loading-screen";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { DEFAULT_PROFILE, getUserProfile, saveUserProfile } from "@/lib/storage";
import type {
  AIPersona,
  DifficultyLevel,
  FitnessGoal,
  Gender,
  UserProfile,
  WeightUnit,
  WorkoutPreference,
} from "@/lib/types";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const GENDERS: { id: Gender; label: string }[] = [
  { id: "male", label: "남성" },
  { id: "female", label: "여성" },
  { id: "non_binary", label: "논바이너리" },
  { id: "prefer_not_to_say", label: "응답 안 함" },
];

const GOALS: { id: FitnessGoal; label: string }[] = [
  { id: "weight_loss", label: "체중 감량" },
  { id: "muscle_gain", label: "근육 증가" },
  { id: "endurance", label: "지구력 향상" },
  { id: "flexibility", label: "유연성 향상" },
  { id: "general", label: "일반 건강" },
];

const LEVELS: { id: DifficultyLevel; label: string }[] = [
  { id: "beginner", label: "초급" },
  { id: "intermediate", label: "중급" },
  { id: "advanced", label: "고급" },
];

const PREFERENCES: { id: WorkoutPreference; label: string }[] = [
  { id: "bodyweight", label: "맨몸운동" },
  { id: "weights", label: "웨이트" },
  { id: "running", label: "러닝" },
  { id: "mixed", label: "골고루" },
];

const PERSONAS: { id: AIPersona; label: string; description: string }[] = [
  { id: "kind_mentor", label: "다정한 멘토", description: "부드럽고 응원하는 스타일" },
  { id: "data_analyst", label: "데이터 분석가", description: "근거와 수치를 중심으로 설명" },
  { id: "gigachad", label: "기가채드", description: "강한 코치 톤의 동기부여" },
  { id: "custom", label: "직접 작성", description: "원하는 말투를 직접 설정" },
];

function toDisplayWeight(weightKg: number, weightUnit: WeightUnit) {
  return weightUnit === "lb" ? (weightKg * 2.20462).toFixed(1) : String(weightKg);
}

function toKg(weight: number, weightUnit: WeightUnit) {
  return weightUnit === "lb" ? Number((weight / 2.20462).toFixed(1)) : weight;
}

export default function OnboardingScreen() {
  const { user, isAuthenticated, loading } = useAuth();
  const colors = useColors();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [weightInput, setWeightInput] = useState(
    toDisplayWeight(DEFAULT_PROFILE.weight, DEFAULT_PROFILE.weightUnit ?? "kg"),
  );
  const [profileReady, setProfileReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    const loadProfile = async () => {
      const stored = await getUserProfile();
      const nextProfile: UserProfile = {
        ...DEFAULT_PROFILE,
        ...stored,
        name:
          stored.name === DEFAULT_PROFILE.name && user?.name
            ? user.name
            : stored.name,
      };

      setProfile(nextProfile);
      setWeightInput(
        toDisplayWeight(nextProfile.weight, nextProfile.weightUnit ?? "kg"),
      );

      if (nextProfile.onboardingCompleted) {
        router.replace("/(tabs)");
        return;
      }

      setProfileReady(true);
    };

    if (isAuthenticated) {
      void loadProfile();
    }
  }, [isAuthenticated, user]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          backgroundColor: colors.surface,
          borderRadius: 18,
          padding: 18,
          gap: 14,
        },
        label: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.foreground,
        },
        helper: {
          fontSize: 13,
          color: colors.muted,
          lineHeight: 20,
        },
        input: {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: colors.foreground,
          fontSize: 15,
        },
        chipRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        },
        chip: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: colors.background,
        },
        chipActive: {
          borderColor: colors.primary,
          backgroundColor: `${colors.primary}18`,
        },
        chipText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.foreground,
        },
        chipTextActive: {
          color: colors.primary,
        },
        primaryButton: {
          backgroundColor: colors.primary,
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: "center",
        },
      }),
    [colors],
  );

  const handleWeightUnitChange = (nextUnit: WeightUnit) => {
    const currentUnit = profile.weightUnit ?? "kg";
    const currentWeight = Number(weightInput);
    if (currentWeight > 0) {
      const weightKg = toKg(currentWeight, currentUnit);
      setWeightInput(toDisplayWeight(weightKg, nextUnit));
    }
    setProfile((current) => ({ ...current, weightUnit: nextUnit }));
  };

  const handleSave = async () => {
    const age = Number(profile.age);
    const height = Number(profile.height);
    const weightValue = Number(weightInput);
    const weightUnit = profile.weightUnit ?? "kg";

    if (!profile.name.trim()) {
      alert("이름을 입력해 주세요.");
      return;
    }

    if (!age || age < 10 || age > 100) {
      alert("나이를 올바르게 입력해 주세요.");
      return;
    }

    if (!height || height < 100 || height > 250) {
      alert("키를 올바르게 입력해 주세요.");
      return;
    }

    if (!weightValue || weightValue <= 0) {
      alert("몸무게를 올바르게 입력해 주세요.");
      return;
    }

    setSaving(true);
    try {
      await saveUserProfile({
        ...DEFAULT_PROFILE,
        ...profile,
        age,
        height,
        weightUnit,
        weight: toKg(weightValue, weightUnit),
        onboardingCompleted: true,
      });
      router.replace("/(tabs)");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLoadingScreen title="Heallu" message="계정 상태를 확인하고 있어요..." />
    );
  }

  if (!isAuthenticated) {
    return (
      <AppLoadingScreen title="Heallu" message="로그인 화면으로 이동하고 있어요..." />
    );
  }

  if (!profileReady) {
    return (
      <AppLoadingScreen title="Heallu" message="맞춤 정보 화면을 준비하고 있어요..." />
    );
  }

  if (saving) {
    return (
      <AppLoadingScreen title="Heallu" message="입력한 정보를 저장하고 있어요..." />
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18 }}>
        <View style={{ gap: 8, marginTop: 12 }}>
          <Text style={{ fontSize: 30, fontWeight: "700", color: colors.foreground }}>
            시작하기 전에
          </Text>
          <Text style={styles.helper}>
            더 잘 맞는 운동 루틴과 AI 추천을 위해 몇 가지만 알려주세요.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>기본 정보</Text>
          <TextInput
            style={styles.input}
            placeholder="이름"
            placeholderTextColor={colors.muted}
            value={profile.name}
            onChangeText={(name) => setProfile((current) => ({ ...current, name }))}
          />
          <TextInput
            style={styles.input}
            placeholder="나이"
            placeholderTextColor={colors.muted}
            value={String(profile.age || "")}
            keyboardType="numeric"
            onChangeText={(age) =>
              setProfile((current) => ({
                ...current,
                age: Number(age.replace(/[^0-9]/g, "")) || 0,
              }))
            }
          />
          <TextInput
            style={styles.input}
            placeholder="키 (cm)"
            placeholderTextColor={colors.muted}
            value={String(profile.height || "")}
            keyboardType="numeric"
            onChangeText={(height) =>
              setProfile((current) => ({
                ...current,
                height: Number(height.replace(/[^0-9]/g, "")) || 0,
              }))
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>성별</Text>
          <View style={styles.chipRow}>
            {GENDERS.map((option) => {
              const active = profile.gender === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setProfile((current) => ({ ...current, gender: option.id }))}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>몸무게</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="몸무게"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={(value) => setWeightInput(value.replace(/[^0-9.]/g, ""))}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["kg", "lb"] as WeightUnit[]).map((unit) => {
                const active = (profile.weightUnit ?? "kg") === unit;
                return (
                  <Pressable
                    key={unit}
                    style={[styles.chip, active && styles.chipActive, { justifyContent: "center" }]}
                    onPress={() => handleWeightUnitChange(unit)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {unit.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>일주일 운동 횟수</Text>
          <View style={styles.chipRow}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((count) => {
              const active = profile.weeklyWorkoutFrequency === count;
              return (
                <Pressable
                  key={count}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    setProfile((current) => ({ ...current, weeklyWorkoutFrequency: count }))
                  }
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {count === 0 ? "처음 시작" : `주 ${count}회`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>선호 운동</Text>
          <View style={styles.chipRow}>
            {PREFERENCES.map((option) => {
              const active = profile.workoutPreference === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    setProfile((current) => ({ ...current, workoutPreference: option.id }))
                  }
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>운동 목적</Text>
          <View style={styles.chipRow}>
            {GOALS.map((goal) => {
              const active = profile.goal === goal.id;
              return (
                <Pressable
                  key={goal.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setProfile((current) => ({ ...current, goal: goal.id }))}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {goal.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>현재 운동 수준</Text>
          <View style={styles.chipRow}>
            {LEVELS.map((level) => {
              const active = profile.fitnessLevel === level.id;
              return (
                <Pressable
                  key={level.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setProfile((current) => ({ ...current, fitnessLevel: level.id }))}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {level.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>AI 페르소나</Text>
          <Text style={styles.helper}>
            AI 트레이너의 기본 말투를 정할 수 있어요. 나중에 다시 바꿀 수 있습니다.
          </Text>
          <View style={styles.chipRow}>
            {PERSONAS.map((persona) => {
              const active = (profile.aiPersona ?? "kind_mentor") === persona.id;
              return (
                <Pressable
                  key={persona.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setProfile((current) => ({ ...current, aiPersona: persona.id }))}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {persona.label}
                  </Text>
                  <Text style={[styles.helper, { marginTop: 4 }]}>{persona.description}</Text>
                </Pressable>
              );
            })}
          </View>
          {(profile.aiPersona ?? "kind_mentor") === "custom" && (
            <TextInput
              style={styles.input}
              placeholder="원하는 말투나 톤을 직접 적어주세요."
              placeholderTextColor={colors.muted}
              value={profile.customPersonaPrompt ?? ""}
              multiline
              onChangeText={(customPersonaPrompt) =>
                setProfile((current) => ({ ...current, customPersonaPrompt }))
              }
            />
          )}
        </View>

        <Pressable style={styles.primaryButton} onPress={handleSave} disabled={saving}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            {saving ? "저장 중..." : "시작하기"}
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
