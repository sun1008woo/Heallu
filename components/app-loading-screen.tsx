import { ActivityIndicator, Image, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type AppLoadingScreenProps = {
  title?: string;
  message?: string;
};

export function AppLoadingScreen({
  title = "Heallu",
  message = "화면을 준비하고 있어요...",
}: AppLoadingScreenProps) {
  const colors = useColors();

  return (
    <ScreenContainer containerClassName="flex-1 bg-background">
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 28,
          gap: 18,
          backgroundColor: colors.background,
        }}
      >
        <Image
          source={require("@/assets/images/heallu-logo.png")}
          style={{ width: 180, height: 80 }}
          resizeMode="contain"
        />
        <View style={{ alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>
            {title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              lineHeight: 21,
              color: colors.muted,
              textAlign: "center",
            }}
          >
            {message}
          </Text>
        </View>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    </ScreenContainer>
  );
}
