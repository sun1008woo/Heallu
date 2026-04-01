import { useTranslation } from "react-i18next";
import type { Language } from "@/lib/i18n/config";
import { saveLanguage } from "@/lib/i18n/config";

/**
 * 번역 및 언어 변경을 관리하는 훅
 */
export function useTranslationWithLanguageChange() {
  const { t, i18n } = useTranslation();

  const changeLanguage = async (language: Language) => {
    try {
      await saveLanguage(language);
    } catch (error) {
      console.error("언어 변경 실패:", error);
      throw error;
    }
  };

  const currentLanguage = (i18n.language || "ko") as Language;

  return {
    t,
    i18n,
    changeLanguage,
    currentLanguage,
  };
}

/**
 * 간단한 번역 훅
 */
export function useTranslate() {
  const { t } = useTranslation();
  return t;
}
