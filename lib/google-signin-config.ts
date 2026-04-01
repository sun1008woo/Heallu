import { Platform } from "react-native";

// Expo Go에서는 Google Sign-In 네이티브 모듈을 사용할 수 없으므로 조건부 import
let GoogleSignin: any = null;
let statusCodes: any = null;

try {
  const module = require("@react-native-google-signin/google-signin");
  GoogleSignin = module.GoogleSignin;
  statusCodes = module.statusCodes;
} catch (error) {
  console.warn("[GoogleSignIn] Native module not available (likely running in Expo Go)");
}

const isGoogleSignInAvailable = GoogleSignin !== null;

/**
 * Initialize Google Sign-In
 * This should be called once when the app starts
 */
export async function initializeGoogleSignIn(): Promise<void> {
  if (!isGoogleSignInAvailable) {
    console.warn(
      "[GoogleSignIn] Google Sign-In is not available in this environment (Expo Go)"
    );
    return;
  }

  try {
    // Configure Google Sign-In
    // Note: You'll need to replace this with your actual Google Web Client ID
    // Get this from Google Cloud Console
    const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

    if (!googleWebClientId) {
      console.warn(
        "[GoogleSignIn] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID not set. Google Sign-In will not work."
      );
      return;
    }

    GoogleSignin.configure({
      webClientId: googleWebClientId,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
      scopes: ["profile", "email"],
    });

    console.log("[GoogleSignIn] Initialized successfully");
  } catch (error) {
    console.error("[GoogleSignIn] Initialization failed:", error);
  }
}

/**
 * Sign in with Google
 * Returns user info including ID token
 */
export async function signInWithGoogle(): Promise<{
  user: {
    id: string;
    name: string;
    email: string;
    photo?: string;
  };
  idToken: string;
} | null> {
  if (!isGoogleSignInAvailable) {
    console.warn("[GoogleSignIn] Google Sign-In is not available in this environment");
    return null;
  }

  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    if (!userInfo.data?.idToken) {
      throw new Error("No ID token received from Google");
    }

    return {
      user: {
        id: userInfo.data.user.id || "",
        name: userInfo.data.user.name || "",
        email: userInfo.data.user.email || "",
        photo: userInfo.data.user.photo || undefined,
      },
      idToken: userInfo.data.idToken,
    };
  } catch (error: any) {
    if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log("[GoogleSignIn] User cancelled sign in");
    } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
      console.log("[GoogleSignIn] Sign in is in progress");
    } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.error("[GoogleSignIn] Play Services not available");
    } else {
      console.error("[GoogleSignIn] Sign in failed:", error);
    }
    return null;
  }
}

/**
 * Sign out from Google
 */
export async function signOutFromGoogle(): Promise<void> {
  if (!isGoogleSignInAvailable) {
    console.warn("[GoogleSignIn] Google Sign-In is not available in this environment");
    return;
  }

  try {
    await GoogleSignin.signOut();
    console.log("[GoogleSignIn] Signed out successfully");
  } catch (error) {
    console.error("[GoogleSignIn] Sign out failed:", error);
  }
}

/**
 * Get current signed-in user
 */
export async function getCurrentGoogleUser(): Promise<{
  user: {
    id: string;
    name: string;
    email: string;
    photo?: string;
  };
  idToken: string;
} | null> {
  if (!isGoogleSignInAvailable) {
    console.warn("[GoogleSignIn] Google Sign-In is not available in this environment");
    return null;
  }

  try {
    const userInfo = await GoogleSignin.getCurrentUser();

    if (!userInfo || !userInfo.idToken) {
      return null;
    }

    return {
      user: {
        id: userInfo.user.id || "",
        name: userInfo.user.name || "",
        email: userInfo.user.email || "",
        photo: userInfo.user.photo || undefined,
      },
      idToken: userInfo.idToken,
    };
  } catch (error) {
    console.error("[GoogleSignIn] Get current user failed:", error);
    return null;
  }
}
