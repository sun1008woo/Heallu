import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useCloudSync } from "@/hooks/use-cloud-sync";
import { useColors } from "@/hooks/use-colors";
import * as AuthStorage from "@/lib/_core/auth";
import { hasCompletedOnboarding } from "@/lib/storage";
import { trpc } from "@/lib/trpc";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const { uploadToCloud, downloadFromCloud, isSyncing } = useCloudSync();
  const colors = useColors();
  const [syncMessage, setSyncMessage] = useState("");
  const googleLoginMutation = trpc.auth.loginWithGoogle.useMutation();
  const googleWebClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    "895771070777-5966qil4lndmc746dgdaetjfnshnlv0o.apps.googleusercontent.com";
  const googleAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ??
    "895771070777-l44t7m0797dk3hk601aooro2aoacuifl.apps.googleusercontent.com";
  const googleIosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ??
    "895771070777-mq73fstbi5pgs7dbv2jd2bldb5ro7qss.apps.googleusercontent.com";

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: googleWebClientId || undefined,
    androidClientId: googleAndroidClientId || undefined,
    iosClientId: googleIosClientId || undefined,
    scopes: ["openid", "profile", "email"],
  });

  useEffect(() => {
    const routeAuthenticatedUser = async () => {
      if (!isAuthenticated || !user) {
        return;
      }

      const completed = await hasCompletedOnboarding();
      router.replace(completed ? "/(tabs)" : "/onboarding");
    };

    routeAuthenticatedUser();
  }, [isAuthenticated, user]);

  useEffect(() => {
    const completeGoogleLogin = async () => {
      if (response?.type !== "success") {
        return;
      }

      const accessToken =
        response.authentication?.accessToken ??
        (typeof response.params?.access_token === "string"
          ? response.params.access_token
          : undefined);

      if (!accessToken) {
        alert("Google 액세스 토큰을 받지 못했습니다.");
        return;
      }

      try {
        const result = await googleLoginMutation.mutateAsync({ accessToken });
        if (!result.success || !result.user) {
          alert(result.error || "구글 로그인에 실패했습니다.");
          return;
        }

        await AuthStorage.setUserInfo({
          id: result.user.id,
          openId: result.user.openId,
          name: result.user.name,
          email: result.user.email,
          loginMethod: result.user.loginMethod,
          lastSignedIn: new Date(result.user.lastSignedIn),
        });

        if (Platform.OS !== "web" && result.sessionToken) {
          await AuthStorage.setSessionToken(result.sessionToken);
        }

        const completed = await hasCompletedOnboarding();
        router.replace(completed ? "/(tabs)" : "/onboarding");
      } catch (error) {
        console.error("Google Sign-In failed:", error);
        if (error instanceof Error) {
          alert(error.message);
          return;
        }
        alert("구글 로그인에 실패했습니다. 다시 시도해주세요.");
      }
    };

    completeGoogleLogin();
  }, [googleLoginMutation, response]);

  const handleGoogleSignIn = async () => {
    const hasGoogleClientId =
      Platform.OS === "android"
        ? Boolean(googleAndroidClientId)
        : Platform.OS === "ios"
          ? Boolean(googleIosClientId)
          : Boolean(googleWebClientId);

    if (!hasGoogleClientId) {
      alert("Google OAuth Client ID가 설정되지 않았습니다.");
      return;
    }

    try {
      await promptAsync();
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      alert("구글 로그인에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleSyncData = async () => {
    setSyncMessage("업로드 중...");
    try {
      await uploadToCloud();
      setSyncMessage("업로드 완료");
      setTimeout(() => setSyncMessage(""), 2000);
    } catch (error) {
      setSyncMessage("업로드 실패");
      console.error("Sync failed:", error);
    }
  };

  const handleDownloadData = async () => {
    setSyncMessage("다운로드 중...");
    try {
      await downloadFromCloud();
      setSyncMessage("다운로드 완료");
      setTimeout(() => setSyncMessage(""), 2000);
    } catch (error) {
      setSyncMessage("다운로드 실패");
      console.error("Download failed:", error);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (isAuthenticated && user) {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-8">
            <View className="items-center gap-4">
              <Text className="text-3xl font-bold text-foreground">{user.name || "사용자"}</Text>
              <Text className="text-base text-muted">{user.email || "이메일 없음"}</Text>
            </View>

            {syncMessage ? (
              <View className="rounded-lg bg-primary/10 p-4">
                <Text className="text-center font-semibold text-primary">{syncMessage}</Text>
              </View>
            ) : null}

            <View className="gap-4">
              <Text className="text-lg font-semibold text-foreground">데이터 동기화</Text>

              <Pressable
                onPress={handleSyncData}
                disabled={isSyncing}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="items-center rounded-lg p-4"
              >
                {isSyncing ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text className="font-semibold text-background">클라우드에 업로드</Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleDownloadData}
                disabled={isSyncing}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="items-center rounded-lg p-4"
              >
                {isSyncing ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text className="font-semibold text-background">클라우드에서 다운로드</Text>
                )}
              </Pressable>
            </View>

            <View className="mt-auto gap-4">
              <Pressable
                onPress={logout}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.error,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="items-center rounded-lg p-4"
              >
                <Text className="font-semibold text-background">로그아웃</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const isGoogleLoginDisabled = !request || googleLoginMutation.isPending;

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 items-center justify-center gap-8">
          <View className="items-center gap-4">
            <Image
              source={require("@/assets/images/heallu-logo.png")}
              style={{ width: 260, height: 120 }}
              resizeMode="contain"
            />
            <Text className="text-center text-base text-muted">
              여러 기기에서 운동 데이터를 안전하게 동기화하세요
            </Text>
          </View>

          <View className="w-full gap-3">
            <View className="flex-row items-start gap-3">
              <Text className="text-2xl">☁️</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">클라우드 동기화</Text>
                <Text className="text-sm text-muted">모든 기기에서 데이터를 이어서 사용할 수 있어요</Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3">
              <Text className="text-2xl">📊</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">진행 상황 추적</Text>
                <Text className="text-sm text-muted">운동 기록과 목표 달성 흐름을 한눈에 확인하세요</Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3">
              <Text className="text-2xl">🏆</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">개인 기록 관리</Text>
                <Text className="text-sm text-muted">루틴과 성과를 쌓아가며 꾸준히 성장할 수 있어요</Text>
              </View>
            </View>
          </View>

          <View className="mt-8 w-full gap-3">
            <Pressable
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoginDisabled}
              style={({ pressed }) => [
                {
                  backgroundColor: "#111111",
                  borderColor: "#111111",
                  borderWidth: 1,
                  opacity: pressed || isGoogleLoginDisabled ? 0.8 : 1,
                },
              ]}
              className="w-full flex-row items-center justify-center gap-3 rounded-lg p-4"
            >
              <Text className="text-2xl text-white">G</Text>
              <Text className="text-lg font-semibold text-white">
                {googleLoginMutation.isPending ? "로그인 중..." : "구글로 로그인"}
              </Text>
            </Pressable>
          </View>

          <View className="mt-4 w-full rounded-lg bg-surface p-4">
            <Text className="text-center text-sm text-muted">
              출시 빌드에서는 Google OAuth와 배포용 API 주소가 모두 설정되어 있어야 합니다.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
