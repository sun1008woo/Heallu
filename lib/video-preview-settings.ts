import AsyncStorage from "@react-native-async-storage/async-storage";

const VIDEO_PREVIEW_SETTINGS_KEY = "video_preview_settings";

export interface VideoPreviewSettings {
  enableVideoPreview: boolean;
  lastUpdated: string;
}

const DEFAULT_SETTINGS: VideoPreviewSettings = {
  enableVideoPreview: true,
  lastUpdated: new Date().toISOString(),
};

/**
 * 영상 미리보기 설정을 가져옵니다.
 */
export async function getVideoPreviewSettings(): Promise<VideoPreviewSettings> {
  try {
    const data = await AsyncStorage.getItem(VIDEO_PREVIEW_SETTINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("영상 미리보기 설정 로드 실패:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * 영상 미리보기 설정을 저장합니다.
 */
export async function saveVideoPreviewSettings(
  settings: VideoPreviewSettings
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      VIDEO_PREVIEW_SETTINGS_KEY,
      JSON.stringify({
        ...settings,
        lastUpdated: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("영상 미리보기 설정 저장 실패:", error);
    throw error;
  }
}

/**
 * 영상 미리보기 활성화 여부를 토글합니다.
 */
export async function toggleVideoPreview(): Promise<boolean> {
  try {
    const settings = await getVideoPreviewSettings();
    const newSettings: VideoPreviewSettings = {
      ...settings,
      enableVideoPreview: !settings.enableVideoPreview,
    };
    await saveVideoPreviewSettings(newSettings);
    return newSettings.enableVideoPreview;
  } catch (error) {
    console.error("영상 미리보기 토글 실패:", error);
    throw error;
  }
}
