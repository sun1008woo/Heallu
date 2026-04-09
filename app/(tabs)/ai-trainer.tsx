import {
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { getChatMessages, saveChatMessages, getUserProfile, saveUserProfile } from "@/lib/storage";
import { AIPersona, ChatMessage, UserProfile } from "@/lib/types";

const SUGGESTED_PROMPTS = [
  "오늘 어떤 운동을 해야 할까요?",
  "체중 감량을 위한 운동 계획을 세워주세요",
  "근육을 키우려면 어떻게 해야 하나요?",
  "운동 후 단백질 섭취는 얼마나 해야 하나요?",
  "초보자를 위한 운동 루틴을 알려주세요",
  "허리 통증에 좋은 운동이 있나요?",
];

const PERSONAS: { id: AIPersona; label: string }[] = [
  { id: "kind_mentor", label: "다정한 멘토" },
  { id: "data_analyst", label: "데이터 분석가" },
  { id: "gigachad", label: "기가채드" },
  { id: "custom", label: "직접 작성" },
];

export default function AITrainerScreen() {
  const colors = useColors();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const chatMutation = trpc.aiTrainer.chat.useMutation();

  useEffect(() => {
    getChatMessages().then(setMessages);
    getUserProfile().then(setProfile);
  }, []);

  const handleSend = async (text?: string) => {
    const content = text ?? inputText.trim();
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

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");

    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const result = await chatMutation.mutateAsync({
        messages: newMessages.map((m) => ({ role: m.role as "user" | "assistant", content: String(m.content) })),
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
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: String(result.content),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      await saveChatMessages(updatedMessages);

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "죄송합니다, 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        timestamp: new Date().toISOString(),
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      await saveChatMessages(updatedMessages);
    }
  };

  const handleClearChat = async () => {
    setMessages([]);
    await saveChatMessages([]);
  };

  const handlePersonaSelect = async (persona: AIPersona) => {
    if (!profile) return;
    const nextProfile = { ...profile, aiPersona: persona };
    setProfile(nextProfile);
    await saveUserProfile(nextProfile);
  };

  const handleCustomPersonaPromptChange = async (customPersonaPrompt: string) => {
    if (!profile) return;
    const nextProfile = { ...profile, customPersonaPrompt };
    setProfile(nextProfile);
    await saveUserProfile(nextProfile);
  };

  const styles = StyleSheet.create({
    userBubble: {
      backgroundColor: colors.primary,
      borderRadius: 18,
      borderBottomRightRadius: 4,
      paddingHorizontal: 16,
      paddingVertical: 10,
      maxWidth: "80%",
      alignSelf: "flex-end",
    },
    aiBubble: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderBottomLeftRadius: 4,
      paddingHorizontal: 16,
      paddingVertical: 10,
      maxWidth: "80%",
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 10,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    textInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: 100,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={{ marginBottom: 12, paddingHorizontal: 16 }}>
      {item.role === "assistant" && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center" }}>
            <IconSymbol name="brain.head.profile" size={14} color="#fff" />
          </View>
          <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>AI 트레이너</Text>
        </View>
      )}
      <View style={item.role === "user" ? styles.userBubble : styles.aiBubble}>
        <Text style={{ fontSize: 15, color: item.role === "user" ? "#fff" : colors.foreground, lineHeight: 22 }}>
          {item.content}
        </Text>
      </View>
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4, alignSelf: item.role === "user" ? "flex-end" : "flex-start", paddingHorizontal: 4 }}>
        {new Date(item.timestamp).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </View>
  );

  return (
    <ScreenContainer containerClassName="flex-1">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: "700", color: colors.foreground }}>AI 트레이너</Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>개인 맞춤 피트니스 코치</Text>
          </View>
          {messages.length > 0 && (
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
              onPress={handleClearChat}
            >
              <IconSymbol name="trash.fill" size={20} color={colors.muted} />
            </Pressable>
          )}
        </View>

        <FlatList
          horizontal
          data={PERSONAS}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, maxHeight: 52 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 12,
            gap: 8,
            alignItems: "center",
          }}
          renderItem={({ item }) => {
            const active = (profile?.aiPersona ?? "kind_mentor") === item.id;
            return (
              <Pressable
                style={({ pressed }) => [{
                  paddingHorizontal: 12,
                  minHeight: 40,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                  alignItems: "center",
                  justifyContent: "center",
                  alignSelf: "center",
                }]}
                onPress={() => handlePersonaSelect(item.id)}
              >
                <Text style={{ color: active ? "#fff" : colors.foreground, fontSize: 12, fontWeight: "600" }}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />

        {(profile?.aiPersona ?? "kind_mentor") === "custom" && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <TextInput
              style={[styles.textInput, { minHeight: 88 }]}
              placeholder="원하는 AI 말투와 역할을 적어주세요"
              placeholderTextColor={colors.muted}
              multiline
              value={profile?.customPersonaPrompt ?? ""}
              onChangeText={handleCustomPersonaPromptChange}
            />
          </View>
        )}

        {/* Messages or Empty State */}
        {messages.length === 0 ? (
          <View style={{ flex: 1 }}>
            {/* Welcome */}
            <View style={{ alignItems: "center", paddingHorizontal: 32, paddingTop: 20, paddingBottom: 24 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#8B5CF620", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <IconSymbol name="brain.head.profile" size={36} color="#8B5CF6" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
                안녕하세요, {profile?.name ?? "사용자"}님!
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 22 }}>
                저는 AI 피트니스 트레이너입니다. 운동, 영양, 건강에 관한 무엇이든 물어보세요!
              </Text>
            </View>

            {/* Suggested Prompts */}
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, paddingHorizontal: 20, marginBottom: 12 }}>
              추천 질문
            </Text>
            <FlatList
              data={SUGGESTED_PROMPTS}
              keyExtractor={(item) => item}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    opacity: pressed ? 0.7 : 1,
                  }]}
                  onPress={() => handleSend(item)}
                >
                  <IconSymbol name="bolt.fill" size={16} color={colors.primary} />
                  <Text style={{ flex: 1, fontSize: 14, color: colors.foreground }}>{item}</Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </Pressable>
              )}
            />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Loading indicator */}
        {chatMutation.isPending && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingBottom: 8 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center" }}>
              <IconSymbol name="brain.head.profile" size={14} color="#fff" />
            </View>
            <View style={{ backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: colors.border }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="메시지를 입력하세요..."
            placeholderTextColor={colors.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <Pressable
            style={({ pressed }) => [styles.sendBtn, { opacity: pressed || !inputText.trim() || chatMutation.isPending ? 0.5 : 1 }]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || chatMutation.isPending}
          >
            <IconSymbol name="paperplane.fill" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
