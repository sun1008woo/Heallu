import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getUserProfile, getProgressStats } from "@/lib/storage";
import { UserProfile, ProgressStats } from "@/lib/types";

const MOTIVATIONAL_MESSAGES = [
  "오늘도 최선을 다해봐요! 💪",
  "작은 노력이 큰 변화를 만듭니다!",
  "어제보다 더 강해지고 있어요!",
  "포기하지 마세요, 당신은 할 수 있어요!",
  "건강한 몸은 건강한 마음을 만듭니다!",
];

const QUICK_WORKOUTS = [
  { id: "push-up", name: "푸시업 챌린지", duration: "10분", calories: "80", category: "strength", color: "#FF6B35" },
  { id: "squat", name: "스쿼트 루틴", duration: "15분", calories: "120", category: "strength", color: "#00D4AA" },
  { id: "burpee", name: "HIIT 버피", duration: "20분", calories: "200", category: "hiit", color: "#F59E0B" },
];

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [motivationIndex] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length));

  useEffect(() => {
    getUserProfile().then(setProfile);
    getProgressStats().then(setStats);
  }, []);

  const handlePress = (action: () => void) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    action();
  };

  const today = new Date();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return { day: dayNames[d.getDay()], active: (stats?.weeklyWorkouts[6 - i] ?? 0) > 0 };
  });

  const styles = StyleSheet.create({
    quickBtn: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginRight: 12,
      width: 160,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionBtn: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 24,
      alignItems: "center",
    },
  });

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 2 }}>안녕하세요 👋</Text>
          <Text style={{ fontSize: 26, fontWeight: "700", color: colors.foreground }}>
            {profile?.name ?? "사용자"}님
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            {MOTIVATIONAL_MESSAGES[motivationIndex]}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 12, marginTop: 16 }}>
          <View style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 16, padding: 16 }}>
            <IconSymbol name="flame.fill" size={24} color="#fff" />
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#fff", marginTop: 8 }}>
              {stats?.currentStreak ?? 0}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>연속 운동</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.success, borderRadius: 16, padding: 16 }}>
            <IconSymbol name="trophy.fill" size={24} color="#fff" />
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#fff", marginTop: 8 }}>
              {stats?.totalWorkouts ?? 0}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>총 운동 횟수</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#8B5CF6", borderRadius: 16, padding: 16 }}>
            <IconSymbol name="bolt.fill" size={24} color="#fff" />
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#fff", marginTop: 8 }}>
              {stats?.totalCalories ?? 0}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>총 칼로리</Text>
          </View>
        </View>

        {/* Weekly Activity */}
        <View style={{ marginHorizontal: 20, marginTop: 20, backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>이번 주 활동</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {weekDays.map((item, idx) => (
              <View key={idx} style={{ alignItems: "center", gap: 6 }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: item.active ? colors.primary : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {item.active && <IconSymbol name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={{ fontSize: 11, color: colors.muted }}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Start */}
        <View style={{ marginTop: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>빠른 시작</Text>
            <Pressable onPress={() => handlePress(() => router.push("/(tabs)/workouts"))} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>전체 보기</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
            {QUICK_WORKOUTS.map((workout) => (
              <Pressable
                key={workout.id}
                style={({ pressed }) => [styles.quickBtn, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => handlePress(() => router.push(`/workout/${workout.id}` as any))}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: workout.color + "20", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <IconSymbol name="dumbbell.fill" size={20} color={workout.color} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>{workout.name}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>{workout.duration} · {workout.calories}kcal</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>빠른 액션</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => handlePress(() => router.push("/(tabs)/workouts"))}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <IconSymbol name="dumbbell.fill" size={22} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>운동 시작</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => handlePress(() => router.push("/(tabs)/ai-trainer"))}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#8B5CF620", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <IconSymbol name="brain.head.profile" size={22} color="#8B5CF6" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>AI 상담</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => handlePress(() => router.push("/(tabs)/progress"))}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.success + "20", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <IconSymbol name="chart.bar.fill" size={22} color={colors.success} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>진행 확인</Text>
            </Pressable>
          </View>
        </View>

        {/* AI Trainer CTA */}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            onPress={() => handlePress(() => router.push("/(tabs)/ai-trainer"))}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <IconSymbol name="brain.head.profile" size={20} color="#fff" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>AI 트레이너에게 물어보기</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
