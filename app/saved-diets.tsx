import { ScrollView, Text, View, Pressable, StyleSheet, FlatList, Alert, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getSavedDiets, deleteDiet } from "@/lib/saved-routines-diets";
import { SavedDiet } from "@/lib/saved-routines-diets";

export default function SavedDietsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [diets, setDiets] = useState<SavedDiet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadDiets();
    }, [])
  );

  const loadDiets = async () => {
    setIsLoading(true);
    try {
      const data = await getSavedDiets();
      setDiets(data);
    } catch (error) {
      console.error("식단 목록 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDiet = (id: string, name: string) => {
    Alert.alert(
      "식단 삭제",
      `"${name}"을(를) 삭제하시겠습니까?`,
      [
        { text: "취소", onPress: () => {}, style: "cancel" },
        {
          text: "삭제",
          onPress: async () => {
            try {
              await deleteDiet(id);
              await loadDiets();
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              Alert.alert("삭제 실패", "식단 삭제에 실패했습니다.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handlePress = (action: () => void) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    action();
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
  });

  const renderDiet = ({ item }: { item: SavedDiet }) => (
    <View style={styles.card}>
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{item.diet.name}</Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
          저장: {new Date(item.savedAt).toLocaleDateString("ko-KR")}
        </Text>
      </View>

      <View style={{ gap: 8, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted }}>기간</Text>
          <Text style={{ fontWeight: "600", color: colors.foreground }}>{item.diet.durationDays}일</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted }}>일일 칼로리</Text>
          <Text style={{ fontWeight: "600", color: colors.primary }}>{item.diet.dailyCalories}kcal</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted }}>식사 수</Text>
          <Text style={{ fontWeight: "600", color: colors.foreground }}>{item.diet.meals.length}끼</Text>
        </View>
      </View>

      {/* Macros Preview */}
      <View style={{ marginBottom: 12, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>영양소 구성</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 11, color: colors.muted }}>단백질</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#FF6B6B", marginTop: 2 }}>{item.diet.macros.protein}g</Text>
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 11, color: colors.muted }}>탄수화물</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#4ECDC4", marginTop: 2 }}>{item.diet.macros.carbs}g</Text>
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 11, color: colors.muted }}>지방</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFE66D", marginTop: 2 }}>{item.diet.macros.fat}g</Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          style={({ pressed }) => [{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: "center",
            backgroundColor: colors.primary,
            opacity: pressed ? 0.8 : 1,
          }]}
          onPress={() => handlePress(() => router.push(`/diet-detail/${item.id}` as any))}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>보기</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: "#EF4444",
            opacity: pressed ? 0.8 : 1,
          }]}
          onPress={() => handlePress(() => handleDeleteDiet(item.id, item.diet.name))}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#EF4444" }}>삭제</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.primary} />
        </Pressable>
        <Text style={{ fontSize: 26, fontWeight: "700", color: colors.foreground }}>저장된 식단</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : diets.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
          <IconSymbol name="folder.badge.questionmark" size={48} color={colors.muted} />
          <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, textAlign: "center" }}>
            저장된 식단이 없습니다.{"\n"}맞춤형 식단을 생성하고 저장해보세요!
          </Text>
        </View>
      ) : (
        <FlatList
          data={diets}
          renderItem={renderDiet}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}
