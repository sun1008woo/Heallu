import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, TextInput, FlatList, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getCommunityRoutines, downloadRoutine } from "@/lib/community-library-storage";
import { CommunityRoutine, CommunityLibraryFilter } from "@/lib/community-library-types";


export default function CommunityScreen() {
  const colors = useColors();
  const [routines, setRoutines] = useState<CommunityRoutine[]>([]);
  const [filteredRoutines, setFilteredRoutines] = useState<CommunityRoutine[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"downloads" | "rating" | "recent">("recent");
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [])
  );

  const loadRoutines = async () => {
    setLoading(true);
    const data = await getCommunityRoutines();
    setRoutines(data);
    applyFilters(data, searchQuery, selectedDifficulty, sortBy);
    setLoading(false);
  };

  const applyFilters = (
    data: CommunityRoutine[],
    query: string,
    difficulty: string | null,
    sort: "downloads" | "rating" | "recent"
  ) => {
    let filtered = [...data];

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.routine.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.authorName.toLowerCase().includes(q)
      );
    }

    if (difficulty) {
      filtered = filtered.filter((r) => r.routine.difficulty === difficulty);
    }

    if (sort === "downloads") {
      filtered.sort((a, b) => b.downloads - a.downloads);
    } else if (sort === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else {
      filtered.sort((a, b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime());
    }

    setFilteredRoutines(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilters(routines, text, selectedDifficulty, sortBy);
  };

  const handleDifficultyFilter = (difficulty: string) => {
    const newDifficulty = selectedDifficulty === difficulty ? null : difficulty;
    setSelectedDifficulty(newDifficulty);
    applyFilters(routines, searchQuery, newDifficulty, sortBy);
  };

  const handleDownload = async (routine: CommunityRoutine) => {
    try {
      await downloadRoutine(routine);
      // 루틴이 이미 저장되었으므로 추가 저장 불필요
      // await saveUserRoutine(routine.routine);
      Alert.alert("성공", "루틴이 저장되었습니다!");
    } catch (error) {
      Alert.alert("오류", "루틴 저장에 실패했습니다.");
    }
  };

  const renderRoutineCard = ({ item }: { item: CommunityRoutine }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>
            {item.routine.name}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>{item.authorName}</Text>
        </View>
        <View
          style={{
            backgroundColor:
              item.routine.difficulty === "beginner"
                ? "#22C55E20"
                : item.routine.difficulty === "intermediate"
                  ? "#F59E0B20"
                  : "#EF444420",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color:
                item.routine.difficulty === "beginner"
                  ? "#22C55E"
                  : item.routine.difficulty === "intermediate"
                    ? "#F59E0B"
                    : "#EF4444",
            }}
          >
            {item.routine.difficulty === "beginner"
              ? "초급"
              : item.routine.difficulty === "intermediate"
                ? "중급"
                : "고급"}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 12, lineHeight: 18 }}>
        {item.description}
      </Text>

      <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>다운로드</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{item.downloads}</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>평점</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#F59E0B" }}>⭐ {item.rating}</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>리뷰</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{item.reviews}</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>기간</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            {item.routine.durationWeeks}주
          </Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          {
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        onPress={() => handleDownload(item)}
      >
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>다운로드</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>
            커뮤니티 라이브러리
          </Text>

          {/* 검색창 */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 12,
              paddingHorizontal: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
            <TextInput
              placeholder="루틴 검색..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={handleSearch}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 8,
                fontSize: 14,
                color: colors.foreground,
              }}
            />
          </View>

          {/* 난이도 필터 */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>난이도</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {["beginner", "intermediate", "advanced"].map((difficulty) => (
                <Pressable
                  key={difficulty}
                  style={({ pressed }) => [
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor:
                        selectedDifficulty === difficulty ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor:
                        selectedDifficulty === difficulty ? colors.primary : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  onPress={() => handleDifficultyFilter(difficulty)}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color:
                        selectedDifficulty === difficulty
                          ? "#fff"
                          : colors.foreground,
                    }}
                  >
                    {difficulty === "beginner" ? "초급" : difficulty === "intermediate" ? "중급" : "고급"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 정렬 옵션 */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>정렬</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["recent", "downloads", "rating"] as const).map((sort) => (
                <Pressable
                  key={sort}
                  style={({ pressed }) => [
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor:
                        sortBy === sort ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor:
                        sortBy === sort ? colors.primary : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  onPress={() => {
                    setSortBy(sort);
                    applyFilters(routines, searchQuery, selectedDifficulty, sort);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color:
                        sortBy === sort ? "#fff" : colors.foreground,
                    }}
                  >
                    {sort === "recent" ? "최신" : sort === "downloads" ? "다운로드" : "평점"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* 루틴 목록 */}
        {loading ? (
          <Text style={{ textAlign: "center", color: colors.muted, marginTop: 20 }}>로딩 중...</Text>
        ) : filteredRoutines.length === 0 ? (
          <Text style={{ textAlign: "center", color: colors.muted, marginTop: 20 }}>
            검색 결과가 없습니다.
          </Text>
        ) : (
          <FlatList
            data={filteredRoutines}
            renderItem={renderRoutineCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
