import { ScrollView, Text, View, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getUserProfile } from "@/lib/storage";
import { trpc } from "@/lib/trpc";
import { UserProfile } from "@/lib/types";
import { DietPlan, Meal } from "@/lib/routine-diet-types";
import { saveDiet } from "@/lib/saved-routines-diets";

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "거의 운동 안 함",
  light: "가벼운 운동",
  moderate: "중간 정도 운동",
  active: "활발한 운동",
  veryActive: "매우 활발한 운동",
};

const MACRO_COLORS = {
  protein: "#FF6B6B",
  carbs: "#4ECDC4",
  fat: "#FFE66D",
};

export default function DietScreen() {
  const router = useRouter();
  const colors = useColors();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [diet, setDiet] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activityLevel, setActivityLevel] = useState<"sedentary" | "light" | "moderate" | "active" | "veryActive">("moderate");

  const generateDietMutation = trpc.personalization.generateDiet.useMutation();

  useEffect(() => {
    getUserProfile().then(setProfile);
  }, []);

  const handleGenerateDiet = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const result = await generateDietMutation.mutateAsync({
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        goal: profile.goal,
        activityLevel: activityLevel,
      });
      setDiet(result);
    } catch (error) {
      console.error("식단 생성 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = (action: () => void) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    action();
  };

  const handleSaveDiet = async () => {
    if (!diet) return;
    setIsSaving(true);
    try {
      await saveDiet(diet);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("저장 완료", "식단이 저장되었습니다.");
    } catch (error) {
      console.error("식단 저장 실패:", error);
      Alert.alert("저장 실패", "식단 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
    },
    macroBar: {
      height: 8,
      borderRadius: 4,
      overflow: "hidden",
      marginTop: 8,
      backgroundColor: colors.border,
    },
  });

  if (!profile) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={20} color={colors.primary} />
          </Pressable>
          <Text style={{ fontSize: 26, fontWeight: "700", color: colors.foreground }}>맞춤형 식단</Text>
        </View>

        {!diet ? (
          <>
            {/* User Info Summary */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <View style={styles.card}>
                <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>당신의 정보</Text>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.foreground }}>나이</Text>
                    <Text style={{ fontWeight: "600", color: colors.foreground }}>{profile.age}세</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.foreground }}>체중</Text>
                    <Text style={{ fontWeight: "600", color: colors.foreground }}>{profile.weight}kg</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.foreground }}>키</Text>
                    <Text style={{ fontWeight: "600", color: colors.foreground }}>{profile.height}cm</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.foreground }}>목표</Text>
                    <Text style={{ fontWeight: "600", color: colors.foreground }}>{profile.goal}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Activity Level Selection */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 10 }}>활동 수준</Text>
              <View style={{ gap: 8 }}>
                {(["sedentary", "light", "moderate", "active", "veryActive"] as const).map((level) => (
                  <Pressable
                    key={level}
                    style={({ pressed }) => [{
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      backgroundColor: activityLevel === level ? colors.primary + "20" : "transparent",
                      borderColor: activityLevel === level ? colors.primary : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    }]}
                    onPress={() => handlePress(() => setActivityLevel(level))}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: activityLevel === level ? colors.primary : colors.foreground }}>
                      {ACTIVITY_LABELS[level]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Generate Button */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, { opacity: pressed || isLoading ? 0.9 : 1 }]}
                onPress={() => handlePress(handleGenerateDiet)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <IconSymbol name="fork.knife" size={18} color="#fff" />
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>맞춤형 식단 생성</Text>
                  </View>
                )}
              </Pressable>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 12, textAlign: "center" }}>
                AI가 당신의 신체 정보와 활동 수준을 분석하여 최적의 식단을 만들어드립니다.
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* Diet Info */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <View style={styles.card}>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>{diet.name}</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{diet.description}</Text>
                </View>

                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.muted }}>기간</Text>
                    <Text style={{ fontWeight: "600", color: colors.foreground }}>{diet.durationDays}일</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.muted }}>일일 칼로리</Text>
                    <Text style={{ fontWeight: "600", color: colors.primary }}>{diet.dailyCalories}kcal</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Macros */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <View style={styles.card}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>영양소 구성</Text>
                <View style={{ gap: 12 }}>
                  {[
                    { label: "단백질", value: diet.macros.protein, color: MACRO_COLORS.protein },
                    { label: "탄수화물", value: diet.macros.carbs, color: MACRO_COLORS.carbs },
                    { label: "지방", value: diet.macros.fat, color: MACRO_COLORS.fat },
                  ].map(({ label, value, color }) => {
                    const total = diet.macros.protein + diet.macros.carbs + diet.macros.fat;
                    const percentage = (value / total) * 100;
                    return (
                      <View key={label}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text style={{ fontSize: 12, color: colors.muted }}>{label}</Text>
                          <Text style={{ fontSize: 12, fontWeight: "600", color: color }}>
                            {value}g ({percentage.toFixed(0)}%)
                          </Text>
                        </View>
                        <View style={styles.macroBar}>
                          <View style={{ width: `${percentage}%`, height: "100%", backgroundColor: color }} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Daily Meals */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>일일 식단</Text>
              {diet.meals.map((meal, mealIdx) => (
                <View key={mealIdx} style={styles.card}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{meal.name}</Text>
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{meal.time}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>{meal.totalCalories}kcal</Text>
                      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                        P {meal.totalProtein}g | C {meal.totalCarbs}g | F {meal.totalFat}g
                      </Text>
                    </View>
                  </View>

                  {meal.foods.map((food, foodIdx) => (
                    <View key={foodIdx} style={{ paddingVertical: 10, borderTopWidth: foodIdx === 0 ? 0 : 0.5, borderTopColor: colors.border }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>{food.name}</Text>
                          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{food.quantity}</Text>
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary, marginLeft: 8 }}>
                          {food.calories}kcal
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            {/* Notes */}
            {diet.notes && (
              <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
                <View style={[styles.card, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>💡 추가 조언</Text>
                  <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>{diet.notes}</Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ paddingHorizontal: 20, marginTop: 16, gap: 10 }}>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, { opacity: pressed || isSaving ? 0.9 : 1 }]}
                onPress={() => handlePress(handleSaveDiet)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <IconSymbol name="square.and.arrow.down" size={18} color="#fff" />
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>식단 저장</Text>
                  </View>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, { backgroundColor: "#00D4AA", opacity: pressed ? 0.9 : 1 }]}
                onPress={() => handlePress(handleGenerateDiet)}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>다시 생성</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [{ paddingVertical: 14, alignItems: "center", borderRadius: 14, borderWidth: 2, borderColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}
                onPress={() => handlePress(() => router.back())}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>돌아가기</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
