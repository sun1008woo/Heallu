import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const env = {
  appName: "Heallu",
  appSlug: "heallu",
  scheme: process.env.EXPO_PUBLIC_APP_SCHEME ?? "heallu",
  iosBundleId: process.env.EXPO_PUBLIC_IOS_BUNDLE_ID ?? "com.heallu.app",
  androidPackage: process.env.EXPO_PUBLIC_ANDROID_PACKAGE ?? "com.heallu.app",
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#1f1f1f",
      foregroundImage: "./assets/images/android-icon-foreground.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#1f1f1f",
        dark: {
          backgroundColor: "#1f1f1f",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appScheme: env.scheme,
    iosBundleId: env.iosBundleId,
    androidPackage: env.androidPackage,
    eas: {
      projectId: "f94bf02c-5d6b-40ad-9554-8c46aa8171fd",
    },
  },
};

export default config;
