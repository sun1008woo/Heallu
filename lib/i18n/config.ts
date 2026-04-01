import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ko } from "./locales/ko";
import { en } from "./locales/en";
import { zh } from "./locales/zh";

const LANGUAGE_KEY = "app_language";

export type Language = "ko" | "en" | "zh";

const resources = {
  ko: { translation: ko },
  en: { translation: en },
  zh: { translation: zh },
};

/**
 * 저장된 언어 설정을 불러옵니다.
 */
export async function getSavedLanguage(): Promise<Language> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && (saved === "ko" || saved === "en" || saved === "zh")) {
      return saved as Language;
    }
  } catch (error) {
    console.error("언어 설정 로드 실패:", error);
  }
  return "ko"; // 기본값: 한국어
}

/**
 * 언어 설정을 저장합니다.
 */
export async function saveLanguage(language: Language): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error("언어 설정 저장 실패:", error);
    throw error;
  }
}

/**
 * i18n 초기화
 */
export async function initializeI18n(): Promise<void> {
  const savedLanguage = await getSavedLanguage();

  i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: "ko",
    interpolation: {
      escapeValue: false, // React는 XSS 공격으로부터 보호합니다
    },
    react: {
      useSuspense: false, // Suspense 비활성화 (React Native에서 필요)
    },
  });
}

export default i18n;
