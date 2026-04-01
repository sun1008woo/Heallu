import React from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

export interface OfflineStatusBannerProps {
  isOnline: boolean;
  offlineQueueSize?: number;
  animated?: boolean;
}

/**
 * 오프라인 상태를 표시하는 배너 컴포넌트
 */
export function OfflineStatusBanner({
  isOnline,
  offlineQueueSize = 0,
  animated = true,
}: OfflineStatusBannerProps) {
  const colors = useColors();

  if (isOnline && offlineQueueSize === 0) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isOnline ? colors.warning : colors.error,
      paddingVertical: 10,
      paddingHorizontal: 16,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
    },
    content: {
      flex: 1,
    },
    title: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600" as const,
    },
    subtitle: {
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: 12,
      marginTop: 2,
    },
    icon: {
      width: 20,
      height: 20,
    },
  });

  if (!isOnline) {
    return (
      <View style={styles.container}>
        <IconSymbol name="wifi.slash" size={20} color="#fff" />
        <View style={styles.content}>
          <Text style={styles.title}>오프라인 상태</Text>
          <Text style={styles.subtitle}>인터넷 연결을 확인하세요</Text>
        </View>
      </View>
    );
  }

  if (offlineQueueSize > 0) {
    return (
      <View style={{ ...styles.container, backgroundColor: colors.warning }}>
        <IconSymbol name="arrow.up.circle" size={20} color="#fff" />
        <View style={styles.content}>
          <Text style={styles.title}>동기화 대기 중</Text>
          <Text style={styles.subtitle}>
            {offlineQueueSize}개의 변경사항이 동기화 대기 중입니다
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

/**
 * 오프라인 상태 표시 인디케이터 (작은 버전)
 */
export function OfflineStatusIndicator({
  isOnline,
  offlineQueueSize = 0,
}: {
  isOnline: boolean;
  offlineQueueSize?: number;
}) {
  const colors = useColors();

  if (isOnline && offlineQueueSize === 0) {
    return null;
  }

  const backgroundColor = isOnline ? colors.warning : colors.error;

  return (
    <View
      style={{
        backgroundColor,
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 10,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 6,
      }}
    >
      <IconSymbol
        name={isOnline ? "arrow.up.circle" : "wifi.slash"}
        size={14}
        color="#fff"
      />
      <Text
        style={{
          color: "#fff",
          fontSize: 11,
          fontWeight: "600" as const,
        }}
      >
        {isOnline ? `${offlineQueueSize}개 대기` : "오프라인"}
      </Text>
    </View>
  );
}
