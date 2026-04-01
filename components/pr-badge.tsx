import React from "react";
import { View, Text } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface PRBadgeProps {
  type: "reps" | "weight" | "both";
  size?: "small" | "medium" | "large";
}

export function PRBadge({ type, size = "medium" }: PRBadgeProps) {
  const colors = useColors();

  const getLabel = () => {
    switch (type) {
      case "reps":
        return "PR";
      case "weight":
        return "무게 PR";
      case "both":
        return "신기록";
      default:
        return "PR";
    }
  };

  const getColor = () => {
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

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: 6,
          paddingVertical: 3,
          fontSize: 10,
          iconSize: 12,
        };
      case "large":
        return {
          paddingHorizontal: 12,
          paddingVertical: 8,
          fontSize: 14,
          iconSize: 18,
        };
      default:
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 11,
          iconSize: 14,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const badgeColor = getColor();

  return (
    <View
      style={{
        backgroundColor: badgeColor + "20",
        borderRadius: 6,
        paddingHorizontal: sizeStyles.paddingHorizontal,
        paddingVertical: sizeStyles.paddingVertical,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderWidth: 1,
        borderColor: badgeColor,
      }}
    >
      <IconSymbol name="star.fill" size={sizeStyles.iconSize} color={badgeColor} />
      <Text
        style={{
          fontSize: sizeStyles.fontSize,
          color: badgeColor,
          fontWeight: "700",
        }}
      >
        {getLabel()}
      </Text>
    </View>
  );
}
