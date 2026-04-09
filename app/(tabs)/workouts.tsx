import { ScrollView, Text, View, Pressable, StyleSheet, FlatList, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { EXERCISES, WORKOUT_CATEGORIES } from "@/lib/exercises-data";
import { Exercise, WorkoutCategory } from "@/lib/types";

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

  const filteredExercises = EXERCISES.filter((ex) => {
    const matchesCategory = selectedCategory === "all" || ex.category === selectedCategory;
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscleGroups.some((m) => m.includes(searchQuery));
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
      style={({ pressed }) => [styles.exerciseCard, { opacity: pressed ? 0.8 : 1 }]}
      onPress={() => handlePress(() => router.push(`/workout/${item.id}` as any))}
    >
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary + "20",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
      }}>
        <IconSymbol name="dumbbell.fill" size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>{item.name}</Text>
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 10,
            backgroundColor: DIFFICULTY_COLORS[item.difficulty] + "20",
          }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: DIFFICULTY_COLORS[item.difficulty] }}>
              {DIFFICULTY_LABELS[item.difficulty]}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, color: colors.muted }}>
          {item.muscleGroups.join(" · ")}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
          {item.sets}세트 × {item.duration ? `${item.duration}초` : `${item.reps}회`} · 휴식 {item.restTime}초
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={20} color={colors.muted} />
    </Pressable>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.foreground }}>운동</Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>나에게 맞는 운동을 찾아보세요</Text>
      </View>

      {/* Search */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, marginBottom: 16, gap: 10 }}>
        <View style={{ position: "relative", flex: 1 }}>
          <TextInput
            style={styles.searchInput}
            placeholder="운동 검색..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Categories */}
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
          <Text style={{ fontSize: 13, fontWeight: "600", color: selectedCategory === "all" ? "#fff" : colors.muted }}>
            전체
          </Text>
        </Pressable>
        {WORKOUT_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={({ pressed }) => [
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === cat.id ? cat.color : "transparent",
                borderColor: selectedCategory === cat.id ? cat.color : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={() => handlePress(() => setSelectedCategory(cat.id as WorkoutCategory))}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: selectedCategory === cat.id ? "#fff" : colors.muted }}>
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <IconSymbol name="magnifyingglass" size={48} color={colors.muted} />
            <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12 }}>검색 결과가 없습니다</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
