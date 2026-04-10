import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { EXERCISES, WORKOUT_CATEGORIES } from "@/lib/exercises-data";
import type { Exercise, WorkoutCategory } from "@/lib/types";

const DIFFICULTY_LABELS = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const DIFFICULTY_COLORS = {
  beginner: "#00D4AA",
  intermediate: "#F59E0B",
  advanced: "#EF4444",
};

export default function WorkoutsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<WorkoutCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handlePress = (action: () => void) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    action();
  };

  const filteredExercises = EXERCISES.filter((exercise) => {
    const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
    const lowerSearch = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !lowerSearch ||
      exercise.name.toLowerCase().includes(lowerSearch) ||
      exercise.muscleGroups.some((muscle) => muscle.toLowerCase().includes(lowerSearch));

    return matchesCategory && matchesSearch;
  });

  const styles = StyleSheet.create({
    categoryChip: {
      paddingHorizontal: 14,
      minHeight: 40,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1.5,
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    exerciseCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
    },
    searchInput: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
      flex: 1,
    },
  });

  const renderExercise = ({ item }: { item: Exercise }) => (
    <Pressable
      style={({ pressed }) => [styles.exerciseCard, { opacity: pressed ? 0.82 : 1 }]}
      onPress={() => handlePress(() => router.push(`/workout/${item.id}` as never))}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.primary + "20",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <IconSymbol name="dumbbell.fill" size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{item.name}</Text>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
              backgroundColor: DIFFICULTY_COLORS[item.difficulty] + "20",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: DIFFICULTY_COLORS[item.difficulty] }}>
              {DIFFICULTY_LABELS[item.difficulty]}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, color: colors.muted }}>{item.muscleGroups.join(" · ")}</Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
          {item.sets}세트 × {item.duration ? `${item.duration}초` : `${item.reps}회`} · 휴식 {item.restTime}초
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={20} color={colors.muted} />
    </Pressable>
  );

  return (
    <ScreenContainer>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground }}>운동</Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>나에게 맞는 운동을 찾아보고 직접 루틴도 만들어보세요.</Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Pressable
          onPress={() => handlePress(() => router.push("/custom-routine-builder" as never))}
          style={({ pressed }) => [
            {
              borderRadius: 16,
              padding: 16,
              backgroundColor: colors.primary,
              opacity: pressed ? 0.84 : 1,
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: "800", color: "#fff" }}>나만의 운동 리스트 만들기</Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", marginTop: 4 }}>
                음악 플레이리스트처럼 운동을 골라 순서, 세트, 횟수, 휴식까지 직접 구성해보세요.
              </Text>
            </View>
            <IconSymbol name="plus.circle.fill" size={28} color="#fff" />
          </View>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", paddingHorizontal: 20, marginBottom: 16, gap: 10 }}>
        <TextInput
          style={styles.searchInput}
          placeholder="운동 검색..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 20,
          paddingRight: 8,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <Pressable
          style={({ pressed }) => [
            styles.categoryChip,
            {
              backgroundColor: selectedCategory === "all" ? colors.primary : "transparent",
              borderColor: selectedCategory === "all" ? colors.primary : colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={() => handlePress(() => setSelectedCategory("all"))}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: selectedCategory === "all" ? "#fff" : colors.muted }}>
            전체
          </Text>
        </Pressable>
        {WORKOUT_CATEGORIES.map((category) => (
          <Pressable
            key={category.id}
            style={({ pressed }) => [
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === category.id ? category.color : "transparent",
                borderColor: selectedCategory === category.id ? category.color : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={() => handlePress(() => setSelectedCategory(category.id as WorkoutCategory))}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: selectedCategory === category.id ? "#fff" : colors.muted }}>
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <IconSymbol name="magnifyingglass" size={48} color={colors.muted} />
            <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12 }}>검색 결과가 없어요.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
