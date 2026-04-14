import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { getChatMessages, getUserProfile, saveChatMessages, saveUserProfile } from "@/lib/storage";
import { AIPersona, ChatMessage, UserProfile } from "@/lib/types";

const PERSONAS: { id: AIPersona; label: string; hint: string }[] = [
  { id: "kind_mentor", label: "다정한 멘토", hint: "부담 없이 시작하기 좋은 톤" },
  { id: "data_analyst", label: "데이터 분석가", hint: "숫자와 근거 중심 조언" },
  { id: "gigachad", label: "기가채드", hint: "강한 동기부여와 실행 중심" },
  { id: "custom", label: "직접 설정", hint: "원하는 말투를 직접 입력" },
];

const SUGGESTED_PROMPTS = [
  "오늘 컨디션에 맞는 운동을 짧게 추천해줘",
  "주 3회 기준으로 현실적인 루틴을 짜줘",
  "운동 전 워밍업 3가지만 알려줘",
  "체중 감량에 도움이 되는 식단 팁을 알려줘",
];

export default function AITrainerScreen() {
  const colors = useColors();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const chatMutation = trpc.aiTrainer.chat.useMutation();

  useEffect(() => {
    getChatMessages().then(setMessages);
    getUserProfile().then(setProfile);
  }, []);

  const activePersona = profile?.aiPersona ?? "kind_mentor";
  const selectedPersona = PERSONAS.find((persona) => persona.id === activePersona) ?? PERSONAS[0];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bubbleUser: {
          alignSelf: "flex-end",
          backgroundColor: colors.primary,
          borderRadius: 18,
          borderBottomRightRadius: 6,
          maxWidth: "82%",
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        bubbleAssistant: {
          alignSelf: "flex-start",
          backgroundColor: colors.surface,
          borderRadius: 18,
          borderBottomLeftRadius: 6,
          borderColor: colors.border,
          borderWidth: 1,
          maxWidth: "88%",
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        input: {
          flex: 1,
          minHeight: 52,
          maxHeight: 120,
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          color: colors.foreground,
          fontSize: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
      }),
    [colors],
  );

  async function handlePersonaSelect(nextPersona: AIPersona) {
    if (!profile) return;
    const updatedProfile = { ...profile, aiPersona: nextPersona };
    setProfile(updatedProfile);
    await saveUserProfile(updatedProfile);
  }

  async function handleCustomPersonaPromptChange(customPersonaPrompt: string) {
    if (!profile) return;
    const updatedProfile = { ...profile, customPersonaPrompt };
    setProfile(updatedProfile);
    await saveUserProfile(updatedProfile);
  }

  async function handleSend(preset?: string) {
    const content = (preset ?? inputText).trim();
    if (!content || chatMutation.isPending) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputText("");

    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));

    try {
      const result = await chatMutation.mutateAsync({
        messages: nextMessages.map((message) => ({
          role: message.role as "user" | "assistant",
          content: String(message.content),
        })),
        userProfile: profile
          ? {
              name: profile.name,
              goal: profile.goal,
              fitnessLevel: profile.fitnessLevel,
              age: profile.age,
              weight: profile.weight,
              height: profile.height,
              gender: profile.gender,
              weightUnit: profile.weightUnit,
              weeklyWorkoutFrequency: profile.weeklyWorkoutFrequency,
              workoutPreference: profile.workoutPreference,
              aiPersona: profile.aiPersona,
              customPersonaPrompt: profile.customPersonaPrompt,
            }
          : undefined,
      });

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: String(result.content),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...nextMessages, assistantMessage];
      setMessages(updatedMessages);
      await saveChatMessages(updatedMessages);
      requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
    } catch {
      const fallbackMessage: ChatMessage = {
        id: `${Date.now()}-error`,
        role: "assistant",
        content: "지금은 답변을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        timestamp: new Date().toISOString(),
      };
      const updatedMessages = [...nextMessages, fallbackMessage];
      setMessages(updatedMessages);
      await saveChatMessages(updatedMessages);
    }
  }

  async function handleClearChat() {
    setMessages([]);
    await saveChatMessages([]);
  }

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        {!isUser && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconSymbol name="brain.head.profile" size={14} color={colors.primary} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>
              {selectedPersona.label}
            </Text>
          </View>
        )}
        <View style={isUser ? styles.bubbleUser : styles.bubbleAssistant}>
          <Text style={{ color: isUser ? "#ffffff" : colors.foreground, fontSize: 15, lineHeight: 22 }}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer containerClassName="flex-1 bg-background">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 16 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 30, fontWeight: "800", color: colors.foreground }}>코치</Text>
            <Text style={{ fontSize: 15, color: colors.muted, lineHeight: 22 }}>
              질문 하나만 던져도 바로 실행 가능한 답을 주는 AI 피트니스 코치예요.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                  현재 페르소나
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>{selectedPersona.hint}</Text>
              </View>
              {messages.length > 0 && (
                <Pressable
                  onPress={handleClearChat}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, padding: 8 }]}
                >
                  <IconSymbol name="trash.fill" size={18} color={colors.muted} />
                </Pressable>
              )}
            </View>

            <FlatList
              horizontal
              data={PERSONAS}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => {
                const active = item.id === activePersona;
                return (
                  <Pressable
                    onPress={() => handlePersonaSelect(item.id)}
                    style={({ pressed }) => [
                      {
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary : colors.background,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={{ color: active ? "#ffffff" : colors.foreground, fontWeight: "700", fontSize: 13 }}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />

            {activePersona === "custom" && (
              <TextInput
                multiline
                value={profile?.customPersonaPrompt ?? ""}
                onChangeText={handleCustomPersonaPromptChange}
                placeholder="원하는 말투나 코칭 스타일을 적어 주세요."
                placeholderTextColor={colors.muted}
                style={[styles.input, { minHeight: 96 }]}
              />
            )}
          </View>
        </View>

        {messages.length === 0 ? (
          <View style={{ flex: 1, paddingHorizontal: 20, gap: 16 }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 20,
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: colors.primary + "18",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconSymbol name="brain.head.profile" size={24} color={colors.primary} />
              </View>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>
                  {profile?.name ? `${profile.name}님, 무엇을 도와드릴까요?` : "무엇을 도와드릴까요?"}
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 21, color: colors.muted }}>
                  오늘 운동, 식단, 루틴 조정처럼 바로 실천할 질문부터 시작해 보세요.
                </Text>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                바로 물어보기
              </Text>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <Pressable
                  key={prompt}
                  onPress={() => handleSend(prompt)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.primary + "15",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconSymbol name="bolt.fill" size={16} color={colors.primary} />
                  </View>
                  <Text style={{ flex: 1, color: colors.foreground, fontSize: 14, lineHeight: 20 }}>
                    {prompt}
                  </Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {chatMutation.isPending && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
            <View
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.muted, fontSize: 13 }}>답변을 정리하고 있어요...</Text>
            </View>
          </View>
        )}

        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 18,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            flexDirection: "row",
            gap: 12,
            alignItems: "flex-end",
          }}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="메시지를 입력해 주세요"
            placeholderTextColor={colors.muted}
            multiline
            style={styles.input}
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!inputText.trim() || chatMutation.isPending}
            style={({ pressed }) => [
              {
                width: 54,
                height: 54,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.primary,
                opacity: !inputText.trim() || chatMutation.isPending || pressed ? 0.6 : 1,
              },
            ]}
          >
            <IconSymbol name="paperplane.fill" size={18} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
