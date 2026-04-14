import { router, Tabs } from "expo-router";
import { Platform } from "react-native";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppLoadingScreen } from "@/components/app-loading-screen";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { hasCompletedOnboarding } from "@/lib/storage";

export default function TabLayout() {
  const { isAuthenticated, loading } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [onboardingReady, setOnboardingReady] = useState<boolean | null>(null);
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 60 + bottomPadding;

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isAuthenticated) {
        setOnboardingReady(false);
        return;
      }

      const completed = await hasCompletedOnboarding();
      setOnboardingReady(completed);
    };

    void checkOnboarding();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (!loading && isAuthenticated && onboardingReady === false) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, loading, onboardingReady]);

  if (loading) {
    return (
      <AppLoadingScreen title="Heallu" message="계정 상태를 확인하고 있어요..." />
    );
  }

  if (!isAuthenticated) {
    return (
      <AppLoadingScreen title="Heallu" message="로그인 화면으로 이동하고 있어요..." />
    );
  }

  if (onboardingReady === null) {
    return (
      <AppLoadingScreen title="Heallu" message="맞춤 설정 상태를 확인하고 있어요..." />
    );
  }

  if (onboardingReady === false) {
    return (
      <AppLoadingScreen title="Heallu" message="맞춤 정보 화면으로 이동하고 있어요..." />
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "오늘",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "루틴",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="bookmark.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-trainer"
        options={{
          title: "코치",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="brain.head.profile" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "내 정보",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen name="progress" options={{ href: null }} />
      <Tabs.Screen name="my-routines" options={{ href: null }} />
      <Tabs.Screen name="community" options={{ href: null }} />
    </Tabs>
  );
}
