import { ScreenContainer } from "@/components/screen-container";
import { getApiBaseUrl } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { useCloudSync } from "@/hooks/use-cloud-sync";
import { useColors } from "@/hooks/use-colors";
import * as AuthStorage from "@/lib/_core/auth";
import { hasCompletedOnboarding } from "@/lib/storage";
import { trpc } from "@/lib/trpc";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
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

const DEFAULT_WEB_CLIENT_ID =
  "895771070777-5966qil4lndmc746dgdaetjfnshnlv0o.apps.googleusercontent.com";
const DEFAULT_ANDROID_CLIENT_ID =
  "895771070777-l44t7m0797dk3hk601aooro2aoacuifl.apps.googleusercontent.com";
const DEFAULT_IOS_CLIENT_ID =
  "895771070777-mq73fstbi5pgs7dbv2jd2bldb5ro7qss.apps.googleusercontent.com";

function toGoogleNativeScheme(clientId?: string) {
  return clientId
    ? `com.googleusercontent.apps.${clientId.replace(
        ".apps.googleusercontent.com",
        "",
      )}:/oauthredirect`
    : undefined;
}

export default function AuthScreen() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const { uploadToCloud, downloadFromCloud, isSyncing } = useCloudSync();
  const colors = useColors();
  const [syncMessage, setSyncMessage] = useState("");
  const [isGoogleFlowStarting, setIsGoogleFlowStarting] = useState(false);
  const googleLoginMutation = trpc.auth.loginWithGoogle.useMutation();

  const googleWebClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? DEFAULT_WEB_CLIENT_ID;
  const googleAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? DEFAULT_ANDROID_CLIENT_ID;
  const googleIosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? DEFAULT_IOS_CLIENT_ID;

  const googleNativeRedirectUri =
    Platform.OS === "android"
      ? toGoogleNativeScheme(googleAndroidClientId)
      : Platform.OS === "ios"
        ? toGoogleNativeScheme(googleIosClientId)
        : undefined;

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: googleWebClientId,
    androidClientId:
      Platform.OS === "android" ? googleAndroidClientId : undefined,
    iosClientId: Platform.OS === "ios" ? googleIosClientId : undefined,
    scopes: ["openid", "profile", "email"],
  });

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    GoogleSignin.configure({
      webClientId: googleWebClientId,
      iosClientId: googleIosClientId || undefined,
    });
  }, [googleIosClientId, googleWebClientId]);

  useEffect(() => {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return;
    }

    fetch(`${apiBaseUrl}/api/health`).catch(() => {
      // Ignore warm-up failures. This only reduces Render cold-start delay.
    });
  }, []);

  useEffect(() => {
    const routeAuthenticatedUser = async () => {
      if (!isAuthenticated || !user || isGoogleFlowStarting || googleLoginMutation.isPending) {
        return;
      }

      const completed = await hasCompletedOnboarding();
      router.replace(completed ? "/(tabs)" : "/onboarding");
    };

    routeAuthenticatedUser();
  }, [googleLoginMutation.isPending, isAuthenticated, isGoogleFlowStarting, user]);

  const finishGoogleLogin = async (accessToken: string) => {
    try {
      setIsGoogleFlowStarting(true);
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
      alert(error instanceof Error ? error.message : "구글 로그인에 실패했습니다.");
    } finally {
      setIsGoogleFlowStarting(false);
    }
  };

  useEffect(() => {
    const completeWebGoogleLogin = async () => {
      if (Platform.OS !== "web" || response?.type !== "success") {
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

      await finishGoogleLogin(accessToken);
    };

    completeWebGoogleLogin();
  }, [response]);

  const handleGoogleSignIn = async () => {
    const hasGoogleClientId =
      Platform.OS === "web"
        ? Boolean(googleWebClientId)
        : Platform.OS === "ios"
          ? Boolean(googleIosClientId)
          : Boolean(googleAndroidClientId);

    if (!hasGoogleClientId) {
      alert("Google OAuth Client ID가 설정되지 않았습니다.");
      return;
    }

    try {
      setIsGoogleFlowStarting(true);
      if (Platform.OS !== "web") {
        if (false) alert(
          [
            "Android Google OAuth 확인",
            `clientId: ${googleAndroidClientId}`,
            `redirectUri: ${googleNativeRedirectUri ?? "none"}`,
          ].join("\n"),
        );

        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });

        // Force the account chooser to appear instead of silently reusing
        // the last Google session on Android.
        try {
          await GoogleSignin.signOut();
        } catch {
          // Ignore when there is no cached Google session yet.
        }

        const signInResult = await GoogleSignin.signIn();
        if (!isSuccessResponse(signInResult)) {
          return;
        }

        const tokens = await GoogleSignin.getTokens();
        if (!tokens.accessToken) {
          alert("Google 액세스 토큰을 받지 못했습니다.");
          return;
        }

        await finishGoogleLogin(tokens.accessToken);
        return;
      }

      await promptAsync();
    } catch (error) {
      console.error("Google Sign-In failed:", error);

      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          return;
        }

        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          alert("Google Play 서비스가 필요합니다.");
          return;
        }
      }

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
              <Text className="text-3xl font-bold text-foreground">
                {user.name || "사용자"}
              </Text>
              <Text className="text-base text-muted">{user.email || "이메일 없음"}</Text>
            </View>

            {syncMessage ? (
              <View className="rounded-lg bg-primary/10 p-4">
                <Text className="text-center font-semibold text-primary">
                  {syncMessage}
                </Text>
              </View>
            ) : null}

            <View className="gap-4">
              <Text className="text-lg font-semibold text-foreground">
                데이터 동기화
              </Text>

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
                  <Text className="font-semibold text-background">
                    클라우드로 업로드
                  </Text>
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
                  <Text className="font-semibold text-background">
                    클라우드에서 다운로드
                  </Text>
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

  const isGoogleLoginDisabled =
    (Platform.OS === "web" && !request) || googleLoginMutation.isPending;

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
                <Text className="text-base font-semibold text-foreground">
                  클라우드 동기화
                </Text>
                <Text className="text-sm text-muted">
                  모든 기기에서 운동 데이터를 이어서 사용할 수 있어요.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3">
              <Text className="text-2xl">📈</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  진행 상황 추적
                </Text>
                <Text className="text-sm text-muted">
                  운동 기록과 목표 달성 흐름을 꾸준히 확인하세요.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3">
              <Text className="text-2xl">🏆</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  개인 기록 관리
                </Text>
                <Text className="text-sm text-muted">
                  루틴과 성과를 쌓아가며 꾸준히 성장할 수 있어요.
                </Text>
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
              출시 빌드에서는 Google OAuth와 배포용 API 주소가 모두 설정되어 있어야
              합니다.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
