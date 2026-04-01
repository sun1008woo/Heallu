import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface VideoPreviewSkeletonProps {
  width?: number | string;
  height?: number | string;
  aspectRatio?: number;
}

/**
 * 동영상 로딩 중 표시할 스켈레톤 UI 컴포넌트
 */
export function VideoPreviewSkeleton({
  width = "100%",
  height = undefined,
  aspectRatio = 16 / 9,
}: VideoPreviewSkeletonProps) {
  const colors = useColors();

  const styles = StyleSheet.create({
    container: {
      width: width as any,
      height: height as any,
      aspectRatio,
      backgroundColor: colors.border,
      borderRadius: 12,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      overflow: "hidden" as const,
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

/**
 * 동영상 썸네일 스켈레톤 (여러 개)
 */
export function VideoThumbnailGridSkeleton({ count = 3 }: { count?: number }) {
  const colors = useColors();

  return (
    <View className="flex-row gap-3 flex-wrap">
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            minWidth: 100,
            aspectRatio: 16 / 9,
            backgroundColor: colors.border,
            borderRadius: 8,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ))}
    </View>
  );
}
