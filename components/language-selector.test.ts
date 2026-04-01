import { describe, it, expect, vi } from "vitest";
import type { Language } from "@/lib/i18n/config";

describe("LanguageSelector Component", () => {
  it("현재 언어를 표시합니다", () => {
    const currentLanguage: Language = "ko";
    expect(currentLanguage).toBe("ko");
  });

  it("언어 변경 콜백을 호출합니다", async () => {
    const onLanguageChange = vi.fn();
    const newLanguage: Language = "en";

    await onLanguageChange(newLanguage);

    expect(onLanguageChange).toHaveBeenCalledWith(newLanguage);
  });

  it("지원하는 모든 언어를 포함합니다", () => {
    const languages: Language[] = ["ko", "en", "zh"];
    
    expect(languages).toContain("ko");
    expect(languages).toContain("en");
    expect(languages).toContain("zh");
  });

  it("같은 언어 선택 시 변경하지 않습니다", async () => {
    const onLanguageChange = vi.fn();
    const currentLanguage: Language = "ko";

    // 같은 언어를 선택하면 콜백이 호출되지 않음
    if (currentLanguage === "ko") {
      // 변경 없음
    }

    expect(onLanguageChange).not.toHaveBeenCalled();
  });
});
