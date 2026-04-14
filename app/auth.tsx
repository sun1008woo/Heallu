import { AppLoadingScreen } from "@/components/app-loading-screen";
import { ScreenContainer } from "@/components/screen-container";
import { getApiBaseUrl } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
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
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

const DEFAULT_WEB_CLIENT_ID =
  "895771070777-5966qil4lndmc746dgdaetjfnshnlv0o.apps.googleusercontent.com";
const DEFAULT_ANDROID_CLIENT_ID =
  "895771070777-l44t7m0797dk3hk601aooro2aoacuifl.apps.googleusercontent.com";
const DEFAULT_IOS_CLIENT_ID =
  "895771070777-mq73fstbi5pgs7dbv2jd2bldb5ro7qss.apps.googleusercontent.com";

export default function AuthScreen() {
  const { isAuthenticated, loading, user } = useAuth();
  const colors = useColors();
  const [isGoogleFlowStarting, setIsGoogleFlowStarting] = useState(false);
  const [isRoutingAfterAuth, setIsRoutingAfterAuth] = useState(false);
  const warmupRequestRef = useRef<Promise<unknown> | null>(null);
  const googleLoginMutation = trpc.auth.loginWithGoogle.useMutation();

  const googleWebClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? DEFAULT_WEB_CLIENT_ID;
  const googleAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? DEFAULT_ANDROID_CLIENT_ID;
  const googleIosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? DEFAULT_IOS_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: googleWebClientId,
    androidClientId:
      Platform.OS === "android" ? googleAndroidClientId : undefined,
    iosClientId: Platform.OS === "ios" ? googleIosClientId : undefined,
    scopes: ["openid", "profile", "email"],
  });

  useEffect(() => {
    if (Platform.OS === "web") return;

    GoogleSignin.configure({
      webClientId: googleWebClientId,
      iosClientId: googleIosClientId || undefined,
      offlineAccess: false,
      forceCodeForRefreshToken: false,
    });
  }, [googleIosClientId, googleWebClientId]);

  useEffect(() => {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) return;

    warmupRequestRef.current = fetch(`${apiBaseUrl}/api/health`).catch(() => {
      // Used only to reduce cold-start delay on Render.
    });
  }, []);

  useEffect(() => {
    const routeAuthenticatedUser = async () => {
      if (
        !isAuthenticated ||
        !user ||
        isGoogleFlowStarting ||
        googleLoginMutation.isPending ||
        isRoutingAfterAuth
      ) {
        return;
      }

      setIsRoutingAfterAuth(true);
      const completed = await hasCompletedOnboarding();
      router.replace(completed ? "/(tabs)" : "/onboarding");
    };

    void routeAuthenticatedUser();
  }, [
    googleLoginMutation.isPending,
    isAuthenticated,
    isGoogleFlowStarting,
    isRoutingAfterAuth,
    user,
  ]);

  const finishGoogleLogin = async (accessToken: string) => {
    try {
      setIsGoogleFlowStarting(true);
      const result = await googleLoginMutation.mutateAsync({ accessToken });

      if (!result.success || !result.user) {
        alert(result.error || "구글 로그인에 실패했어요.");
        return;
      }

      await Promise.all([
        AuthStorage.setUserInfo({
          id: result.user.id,
          openId: result.user.openId,
          name: result.user.name,
          email: result.user.email,
          loginMethod: result.user.loginMethod,
          lastSignedIn: new Date(result.user.lastSignedIn),
        }),
        Platform.OS !== "web" && result.sessionToken
          ? AuthStorage.setSessionToken(result.sessionToken)
          : Promise.resolve(),
      ]);

      setIsRoutingAfterAuth(true);
      const completed = await hasCompletedOnboarding();
      router.replace(completed ? "/(tabs)" : "/onboarding");
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      alert(error instanceof Error ? error.message : "구글 로그인에 실패했어요.");
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
        alert("구글 액세스 토큰을 받지 못했어요.");
        return;
      }

      await finishGoogleLogin(accessToken);
    };

    void completeWebGoogleLogin();
  }, [response]);

  const handleGoogleSignIn = async () => {
    const hasGoogleClientId =
      Platform.OS === "web"
        ? Boolean(googleWebClientId)
        : Platform.OS === "ios"
          ? Boolean(googleIosClientId)
          : Boolean(googleAndroidClientId);

    if (!hasGoogleClientId) {
      alert("Google OAuth 설정이 아직 완료되지 않았어요.");
      return;
    }

    try {
      setIsGoogleFlowStarting(true);
      void warmupRequestRef.current;

      if (Platform.OS !== "web") {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });

        const signInResult = await GoogleSignin.signIn();
        if (!isSuccessResponse(signInResult)) {
          return;
        }

        const tokens = await GoogleSignin.getTokens();
        if (!tokens.accessToken) {
          alert("구글 액세스 토큰을 받지 못했어요.");
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
          alert("Google Play 서비스가 필요해요.");
          return;
        }
      }

      alert("구글 로그인에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setIsGoogleFlowStarting(false);
    }
  };

  if (loading) {
    return (
      <AppLoadingScreen
        title="Heallu"
        message="계정 상태를 확인하고 있어요..."
      />
    );
  }

  if (isGoogleFlowStarting || googleLoginMutation.isPending || isRoutingAfterAuth) {
    return (
      <AppLoadingScreen
        title="Heallu"
        message="계정 정보를 확인하고 다음 화면으로 이동하고 있어요..."
      />
    );
  }

  if (isAuthenticated && user) {
    return (
      <AppLoadingScreen
        title="Heallu"
        message="로그인 정보를 불러왔어요. 맞춤 화면으로 이동하고 있어요..."
      />
    );
  }

  const isGoogleLoginDisabled =
    (Platform.OS === "web" && !request) ||
    googleLoginMutation.isPending ||
    isGoogleFlowStarting;

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
                  운동 기록과 루틴을 같은 계정으로 이어서 사용할 수 있어요.
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
                  운동 기록과 목표 달성 흐름을 한눈에 확인할 수 있어요.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3">
              <Text className="text-2xl">🤖</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  AI 맞춤 추천
                </Text>
                <Text className="text-sm text-muted">
                  내 운동 성향과 목표에 맞는 루틴을 빠르게 받을 수 있어요.
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
              {isGoogleLoginDisabled ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-2xl text-white">G</Text>
              )}
              <Text className="text-lg font-semibold text-white">
                {googleLoginMutation.isPending || isGoogleFlowStarting
                  ? "로그인 중..."
                  : "구글로 로그인"}
              </Text>
            </Pressable>
          </View>

          <View className="mt-4 w-full rounded-lg bg-surface p-4">
            <Text className="text-center text-sm text-muted">
              출시 빌드에서는 Google OAuth와 배포용 API 주소가 모두 설정되어 있어야
              해요.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
