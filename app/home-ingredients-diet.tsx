import { Alert, ScrollView, View, Text, Pressable, TextInput, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useMutation } from "@tanstack/react-query";
import { HomeIngredient, IngredientsBasedDiet } from "@/lib/home-ingredients-diet-types";
import { saveIngredientsProfile, getIngredientsProfile, saveIngredientsDiet } from "@/lib/home-ingredients-diet-storage";

const INGREDIENT_CATEGORIES = ["채소", "단백질", "탄수화물", "유제품", "과일", "기타"];

export default function HomeIngredientsDietScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<HomeIngredient[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<HomeIngredient["category"]>("채소");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedDiet, setGeneratedDiet] = useState<IngredientsBasedDiet | null>(null);
  const chatMutation = trpc.aiTrainer.chat.useMutation();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const profile = await getIngredientsProfile();
    if (profile) {
      setIngredients(profile.ingredients);
    }
  };

  const addIngredient = () => {
    if (!newIngredient.trim()) {
      Alert.alert("입력 오류", "재료 이름을 입력해주세요.");
      return;
    }
    const ingredient: HomeIngredient = {
      name: newIngredient,
      category: selectedCategory,
    };
    setIngredients([...ingredients, ingredient]);
    setNewIngredient("");
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const generateDiet = async () => {
    if (ingredients.length === 0) {
      Alert.alert("재료 없음", "최소 1개 이상의 재료를 추가해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const ingredientList = ingredients.map((ing) => `${ing.name} (${ing.category})`).join(", ");
      const prompt = `사용자의 집에 있는 재료: ${ingredientList}

이 재료들을 사용하여 1주일간의 건강한 식단을 만들어주세요. 다음 JSON 형식으로 응답해주세요:

{
  "mealPlan": [
    {
      "day": "월요일",
      "breakfast": {
        "name": "음식 이름",
        "description": "설명",
        "ingredients": ["재료1", "재료2"],
        "cookingTime": 15,
        "difficulty": "쉬움",
        "tips": "조리 팁"
      },
      "lunch": {...},
      "dinner": {...}
    }
  ],
  "recipes": [...],
  "nutritionSummary": {
    "dailyAverageCalories": 2000,
    "dailyAverageProtein": 100,
    "dailyAverageCarbs": 250,
    "dailyAverageFat": 60,
    "weeklyTotalCalories": 14000
  }
}`;

      const result = await chatMutation.mutateAsync({
        messages: [{ role: "user" as const, content: prompt }],
        userProfile: user ? { age: 30, weight: 70, height: 175, goal: "건강한 식단" } : undefined,
      });

      if (result && result.content) {
        const contentStr = String(result.content);
        try {
          const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const dietData = JSON.parse(jsonMatch[0]);
            const diet: IngredientsBasedDiet = {
              id: Date.now().toString(),
              mealPlan: dietData.mealPlan || [],
              recipes: dietData.recipes || [],
              shoppingList: [],
              nutritionSummary: dietData.nutritionSummary || {},
              generatedAt: new Date().toISOString(),
            };
            setGeneratedDiet(diet);
            await saveIngredientsDiet(diet);
            await saveIngredientsProfile({
              ingredients,
              lastUpdated: new Date().toISOString(),
            });
          }
        } catch (parseError) {
          console.error("JSON 파싱 오류:", parseError);
          Alert.alert("오류", "식단 데이터를 파싱할 수 없습니다.");
        }
      }
    } catch (error) {
      console.error("식단 생성 실패:", error);
      Alert.alert("오류", "식단을 생성할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (generatedDiet) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>생성된 식단</Text>
              <Pressable onPress={() => setGeneratedDiet(null)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                <IconSymbol name="xmark" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            {generatedDiet.mealPlan.map((day, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
                  {day.day}
                </Text>
                {day.breakfast && (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>아침</Text>
                    <Text style={{ fontSize: 13, color: colors.foreground }}>{day.breakfast.name}</Text>
                  </View>
                )}
                {day.lunch && (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>점심</Text>
                    <Text style={{ fontSize: 13, color: colors.foreground }}>{day.lunch.name}</Text>
                  </View>
                )}
                {day.dinner && (
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>저녁</Text>
                    <Text style={{ fontSize: 13, color: colors.foreground }}>{day.dinner.name}</Text>
                  </View>
                )}
              </View>
            ))}

            {generatedDiet.nutritionSummary && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
                  영양 정보
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>일일 평균 칼로리</Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
                    {generatedDiet.nutritionSummary.dailyAverageCalories} kcal
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>단백질</Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
                    {generatedDiet.nutritionSummary.dailyAverageProtein}g
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>탄수화물</Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
                    {generatedDiet.nutritionSummary.dailyAverageCarbs}g
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>지방</Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
                    {generatedDiet.nutritionSummary.dailyAverageFat}g
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            집 재료로 식단 짜기
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 20 }}>
            집에 있는 재료를 입력하면 AI가 맞춤형 식단을 만들어줍니다.
          </Text>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
              재료 카테고리
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {INGREDIENT_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat as HomeIngredient["category"])}
                  style={({ pressed }) => [{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: selectedCategory === cat ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: selectedCategory === cat ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  }]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: selectedCategory === cat ? "#fff" : colors.foreground,
                    }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
              재료 추가
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 13,
                  color: colors.foreground,
                  backgroundColor: colors.background,
                }}
                placeholder="재료 이름 입력"
                placeholderTextColor={colors.muted}
                value={newIngredient}
                onChangeText={setNewIngredient}
              />
              <Pressable
                onPress={addIngredient}
                style={({ pressed }) => [{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.8 : 1,
                }]}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>추가</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
              추가된 재료 ({ingredients.length})
            </Text>
            {ingredients.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 12, color: colors.muted }}>추가된 재료가 없습니다.</Text>
              </View>
            ) : (
              <FlatList
                scrollEnabled={false}
                data={ingredients}
                keyExtractor={(_, idx) => idx.toString()}
                renderItem={({ item, index }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 10,
                      borderBottomWidth: 0.5,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                        {item.category}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => removeIngredient(index)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    >
                      <IconSymbol name="xmark.circle.fill" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                )}
              />
            )}
          </View>

          <Pressable
            onPress={generateDiet}
            disabled={isLoading || ingredients.length === 0}
            style={({ pressed }) => [{
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: ingredients.length === 0 ? colors.border : colors.primary,
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
              marginBottom: 20,
            }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>
                식단 생성하기
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
