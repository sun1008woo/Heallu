import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import type { PRAchievement } from "@/lib/pr-tracking";

const { width, height } = Dimensions.get("window");

interface PRCelebrationModalProps {
  visible: boolean;
  achievement?: PRAchievement;
  onClose: () => void;
}

export function PRCelebrationModal({
  visible,
  achievement,
  onClose,
}: PRCelebrationModalProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && achievement) {
      // 트리거 햅틱 피드백
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 스케일 애니메이션
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // 떠오르는 애니메이션
        Animated.timing(floatAnim, {
          toValue: -30,
          duration: 800,
          delay: 1000,
          useNativeDriver: true,
        }),
      ]).start();

      // 3초 후 자동 닫기
      const timer = setTimeout(() => {
        onClose();
      }, 3500);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      floatAnim.setValue(0);
    }
  }, [visible, achievement]);

  if (!achievement) return null;

  const getAchievementLabel = (type: string) => {
    switch (type) {
      case "reps":
        return "반복 횟수 신기록!";
      case "weight":
        return "무게 신기록!";
      case "both":
        return "반복 & 무게 신기록!";
      default:
        return "신기록 달성!";
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case "reps":
        return "#8B5CF6";
      case "weight":
        return "#FF6B35";
      case "both":
        return "#FFD700";
      default:
        return colors.primary;
    }
  };

  const achievementColor = getAchievementColor(achievement.type);

  return (
    <Modal visible={visible} transparent animationType="none">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Confetti-like decorative elements */}
        <View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          {[...Array(6)].map((_, i) => (
            <Animated.View
              key={i}
              style={{
                position: "absolute",
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: [achievementColor, "#FFD700", "#FF6B35"][i % 3],
                left: `${(i * 15 + 10) % 100}%`,
                top: "20%",
                opacity: Animated.multiply(
                  opacityAnim,
                  new Animated.Value(0.7)
                ),
                transform: [
                  {
                    translateY: Animated.multiply(floatAnim, new Animated.Value(-1)),
                  },
                ],
              }}
            />
          ))}
        </View>

        {/* Main celebration card */}
        <Animated.View
          style={{
            transform: [
              {
                scale: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
              {
                translateY: floatAnim,
              },
            ],
            opacity: opacityAnim,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 24,
              alignItems: "center",
              width: width - 60,
              borderWidth: 2,
              borderColor: achievementColor,
              shadowColor: achievementColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            {/* Trophy Icon */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: achievementColor + "20",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <IconSymbol name="star.fill" size={48} color={achievementColor} />
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: achievementColor,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {getAchievementLabel(achievement.type)}
            </Text>

            {/* Exercise Name */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.foreground,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {achievement.exerciseName}
            </Text>

            {/* Achievement Details */}
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 12,
                width: "100%",
                marginBottom: 16,
                gap: 8,
              }}
            >
              {achievement.type === "reps" || achievement.type === "both" ? (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    이전 기록
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
                    {achievement.previousRecord}회
                  </Text>
                </View>
              ) : null}

              {achievement.type === "reps" || achievement.type === "both" ? (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    새로운 기록
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: achievementColor }}>
                    {achievement.newRecord}회
                  </Text>
                </View>
              ) : null}

              {achievement.type === "weight" || achievement.type === "both" ? (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    이전 무게
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
                    {achievement.previousRecord}kg
                  </Text>
                </View>
              ) : null}

              {achievement.type === "weight" || achievement.type === "both" ? (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    새로운 무게
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: achievementColor }}>
                    {achievement.newRecord}kg
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Motivational Text */}
            <Text
              style={{
                fontSize: 12,
                color: colors.muted,
                textAlign: "center",
                fontStyle: "italic",
                marginBottom: 16,
              }}
            >
              계속 이 기세로! 🚀
            </Text>

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: achievementColor,
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 24,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                축하합니다!
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
