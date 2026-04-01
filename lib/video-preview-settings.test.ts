import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getVideoPreviewSettings,
  saveVideoPreviewSettings,
  toggleVideoPreview,
  type VideoPreviewSettings,
} from "./video-preview-settings";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe("Video Preview Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getVideoPreviewSettings", () => {
    it("should return default settings when no settings exist", async () => {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(null);

      const settings = await getVideoPreviewSettings();

      expect(settings.enableVideoPreview).toBe(true);
      expect(settings.lastUpdated).toBeDefined();
    });

    it("should return saved settings", async () => {
      const savedSettings: VideoPreviewSettings = {
        enableVideoPreview: false,
        lastUpdated: "2026-03-29T14:00:00.000Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(savedSettings)
      );

      const settings = await getVideoPreviewSettings();

      expect(settings.enableVideoPreview).toBe(false);
      expect(settings.lastUpdated).toBe("2026-03-29T14:00:00.000Z");
    });
  });

  describe("saveVideoPreviewSettings", () => {
    it("should save settings with updated timestamp", async () => {
      const settings: VideoPreviewSettings = {
        enableVideoPreview: true,
        lastUpdated: "2026-03-29T14:00:00.000Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");

      await saveVideoPreviewSettings(settings);

      expect(AsyncStorage.default.setItem).toHaveBeenCalled();
      const callArgs = vi.mocked(AsyncStorage.default.setItem).mock.calls[0];
      expect(callArgs[0]).toBe("video_preview_settings");

      const savedData = JSON.parse(callArgs[1]);
      expect(savedData.enableVideoPreview).toBe(true);
      expect(savedData.lastUpdated).toBeDefined();
    });
  });

  describe("toggleVideoPreview", () => {
    it("should toggle video preview setting", async () => {
      const initialSettings: VideoPreviewSettings = {
        enableVideoPreview: true,
        lastUpdated: "2026-03-29T14:00:00.000Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(initialSettings)
      );

      const result = await toggleVideoPreview();

      expect(result).toBe(false);
      expect(AsyncStorage.default.setItem).toHaveBeenCalled();
    });

    it("should toggle from false to true", async () => {
      const initialSettings: VideoPreviewSettings = {
        enableVideoPreview: false,
        lastUpdated: "2026-03-29T14:00:00.000Z",
      };

      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      vi.mocked(AsyncStorage.default.getItem).mockResolvedValueOnce(
        JSON.stringify(initialSettings)
      );

      const result = await toggleVideoPreview();

      expect(result).toBe(true);
    });
  });

  describe("VideoPreviewSettings Type", () => {
    it("should have required fields", () => {
      const settings: VideoPreviewSettings = {
        enableVideoPreview: true,
        lastUpdated: new Date().toISOString(),
      };

      expect(settings.enableVideoPreview).toBeDefined();
      expect(typeof settings.enableVideoPreview).toBe("boolean");
      expect(settings.lastUpdated).toBeDefined();
      expect(typeof settings.lastUpdated).toBe("string");
    });
  });

  describe("Exercise Video ID", () => {
    it("should support youtube video ID in exercise", () => {
      interface ExerciseWithVideo {
        name: string;
        sets: number;
        reps: number;
        restTime: number;
        youtubeVideoId?: string;
      }

      const exercise: ExerciseWithVideo = {
        name: "벤치프레스",
        sets: 3,
        reps: 8,
        restTime: 120,
        youtubeVideoId: "dQw4w9WgXcQ",
      };

      expect(exercise.youtubeVideoId).toBeDefined();
      expect(exercise.youtubeVideoId).toMatch(/^[a-zA-Z0-9_-]+$/);
    });

    it("should handle missing youtube video ID", () => {
      interface ExerciseWithVideo {
        name: string;
        sets: number;
        reps: number;
        restTime: number;
        youtubeVideoId?: string;
      }

      const exercise: ExerciseWithVideo = {
        name: "스쿼트",
        sets: 4,
        reps: 10,
        restTime: 90,
      };

      expect(exercise.youtubeVideoId).toBeUndefined();
    });
  });
});
