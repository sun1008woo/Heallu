import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const env = {
  appName: "Heallu",
  appSlug: "heallu",
  scheme: process.env.EXPO_PUBLIC_APP_SCHEME ?? "heallu",
  iosBundleId: process.env.EXPO_PUBLIC_IOS_BUNDLE_ID ?? "com.heallu.app",
  androidPackage: process.env.EXPO_PUBLIC_ANDROID_PACKAGE ?? "com.heallu.app",
  googleAndroidClientId:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ??
    "895771070777-l44t7m0797dk3hk601aooro2aoacuifl.apps.googleusercontent.com",
  googleIosClientId:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ??
    "895771070777-mq73fstbi5pgs7dbv2jd2bldb5ro7qss.apps.googleusercontent.com",
};

const toGoogleNativeScheme = (clientId?: string) =>
  clientId
    ? `com.googleusercontent.apps.${clientId.replace(
        ".apps.googleusercontent.com",
        "",
      )}`
    : undefined;

const schemes = Array.from(
  new Set([
    env.scheme,
    toGoogleNativeScheme(env.googleAndroidClientId),
    toGoogleNativeScheme(env.googleIosClientId),
  ].filter((value): value is string => Boolean(value))),
);

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: schemes,
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
    "@react-native-google-signin/google-signin",
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
