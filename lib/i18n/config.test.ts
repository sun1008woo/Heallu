import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSavedLanguage } from "./config";

// AsyncStorage 모킹
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe("i18n Config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSavedLanguage", () => {
    it("저장된 언어를 반환합니다", async () => {
      const mockAsyncStorage = AsyncStorage as any;
      mockAsyncStorage.getItem.mockResolvedValueOnce("en");

      const language = await getSavedLanguage();

      expect(language).toBe("en");
    });

    it("저장된 언어가 없으면 기본값(ko)을 반환합니다", async () => {
      const mockAsyncStorage = AsyncStorage as any;
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const language = await getSavedLanguage();

      expect(language).toBe("ko");
    });

    it("유효하지 않은 언어면 기본값(ko)을 반환합니다", async () => {
      const mockAsyncStorage = AsyncStorage as any;
      mockAsyncStorage.getItem.mockResolvedValueOnce("invalid");

      const language = await getSavedLanguage();

      expect(language).toBe("ko");
    });

    it("에러 발생 시 기본값(ko)을 반환합니다", async () => {
      const mockAsyncStorage = AsyncStorage as any;
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error("Storage error"));

      const language = await getSavedLanguage();

      expect(language).toBe("ko");
    });
  });
});
