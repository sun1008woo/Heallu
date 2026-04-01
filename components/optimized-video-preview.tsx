import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Text,
} from "react-native";
import { getThumbnailUrl } from "@/lib/video-thumbnail-cache";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

export interface OptimizedVideoPreviewProps {
  videoId: string;
  exerciseName: string;
  onPress: () => void;
  width?: number | string;
  height?: number | string;
  aspectRatio?: number;
}

/**
 * 최적화된 동영상 미리보기 컴포넌트
 * - 썸네일 캐싱
 * - 지연 로딩
 * - 메모리 최적화
 */
export function OptimizedVideoPreview({
  videoId,
  exerciseName,
  onPress,
  width = "100%",
  height = undefined,
  aspectRatio = 16 / 9,
}: OptimizedVideoPreviewProps) {
  const colors = useColors();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadThumbnail();
  }, [videoId]);

  const loadThumbnail = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const url = await getThumbnailUrl(videoId);
      setThumbnailUrl(url);
    } catch (err) {
      console.error("썸네일 로드 실패:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  const styles = StyleSheet.create({
    container: {
      width: width as any,
      height: height as any,
      aspectRatio,
      borderRadius: 12,
      overflow: "hidden" as const,
      backgroundColor: colors.border,
    },
    imageContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    image: {
      width: "100%",
      height: "100%",
      resizeMode: "cover" as const,
    },
    overlay: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    playButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      backgroundColor: colors.border,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      backgroundColor: colors.border,
      gap: 8,
    },
    errorText: {
      color: colors.muted,
      fontSize: 12,
      textAlign: "center" as const,
    },
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : error || !thumbnailUrl ? (
        <View style={styles.errorContainer}>
          <IconSymbol name="play.fill" size={24} color={colors.muted} />
          <Text style={styles.errorText}>영상 로드 실패</Text>
        </View>
      ) : (
        <>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.image}
            onError={() => setError(true)}
          />
          <View style={styles.overlay}>
            <View style={styles.playButton}>
              <IconSymbol name="play.fill" size={24} color={colors.primary} />
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

/**
 * 동영상 미리보기 그리드 컴포넌트
 */
export function VideoPreviewGrid({
  videos,
  onVideoPress,
}: {
  videos: Array<{ videoId: string; name: string }>;
  onVideoPress: (videoId: string, name: string) => void;
}) {
  const colors = useColors();

  return (
    <View className="flex-row gap-3 flex-wrap">
      {videos.map((video) => (
        <View key={video.videoId} style={{ flex: 1, minWidth: 120 }}>
          <OptimizedVideoPreview
            videoId={video.videoId}
            exerciseName={video.name}
            onPress={() => onVideoPress(video.videoId, video.name)}
            aspectRatio={16 / 9}
          />
          <Text
            className="text-xs text-muted mt-1"
            numberOfLines={2}
            style={{ color: colors.muted }}
          >
            {video.name}
          </Text>
        </View>
      ))}
    </View>
  );
}
