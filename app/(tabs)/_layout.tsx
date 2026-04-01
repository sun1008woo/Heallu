import { Redirect, Tabs } from "expo-router";
import { Platform } from "react-native";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const tabBarHeight = 56 + bottomPadding;

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isAuthenticated) {
        setOnboardingReady(false);
        return;
      }

      const completed = await hasCompletedOnboarding();
      setOnboardingReady(completed);
    };

    checkOnboarding();
  }, [isAuthenticated]);

  if (!loading && !isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  if (isAuthenticated && onboardingReady === false) {
    return <Redirect href="/onboarding" />;
  }

  if (loading || onboardingReady === null) {
    return null;
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
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "운동",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="dumbbell.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-trainer"
        options={{
          title: "AI 트레이너",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="brain.head.profile" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "진행",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-routines"
        options={{
          title: "내 루틴",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="bookmark.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "커뮤니티",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "프로필",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
