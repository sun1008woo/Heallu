import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getThumbnailUrl,
  cleanExpiredThumbnails,
  clearThumbnailCache,
  getThumbnailCacheStats,
} from "./video-thumbnail-cache";

// AsyncStorage 모킹
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("Video Thumbnail Cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getThumbnailUrl", () => {
    it("캐시에 없는 경우 새로운 썸네일 URL을 생성하고 캐시합니다", async () => {
      const videoId = "test123";
      const mockAsyncStorage = AsyncStorage as any;

      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      const url = await getThumbnailUrl(videoId);

      expect(url).toContain("img.youtube.com");
      expect(url).toContain(videoId);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it("캐시에 있는 경우 캐시된 URL을 반환합니다", async () => {
      const videoId = "test123";
      const cachedUrl = "https://img.youtube.com/vi/test123/maxresdefault.jpg";
      const mockAsyncStorage = AsyncStorage as any;

      const cacheData = {
        thumbnails: [
          {
            videoId,
            url: cachedUrl,
            cachedAt: new Date().toISOString(),
          },
        ],
        lastCleaned: new Date().toISOString(),
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cacheData));

      const url = await getThumbnailUrl(videoId);

      expect(url).toBe(cachedUrl);
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it("에러 발생 시 폴백 URL을 반환합니다", async () => {
      const videoId = "test123";
      const mockAsyncStorage = AsyncStorage as any;

      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error("Storage error"));

      const url = await getThumbnailUrl(videoId);

      expect(url).toContain("img.youtube.com");
      expect(url).toContain("default.jpg");
    });
  });

  describe("cleanExpiredThumbnails", () => {
    it("만료된 캐시를 제거합니다", async () => {
      const mockAsyncStorage = AsyncStorage as any;
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 31); // 31일 전

      const cacheData = {
        thumbnails: [
          {
            videoId: "old",
            url: "https://example.com/old.jpg",
            cachedAt: expiredDate.toISOString(),
          },
          {
            videoId: "new",
            url: "https://example.com/new.jpg",
            cachedAt: new Date().toISOString(),
          },
        ],
        lastCleaned: new Date().toISOString(),
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cacheData));
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      await cleanExpiredThumbnails();

      const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);

      expect(savedData.thumbnails).toHaveLength(1);
      expect(savedData.thumbnails[0].videoId).toBe("new");
    });
  });

  describe("getThumbnailCacheStats", () => {
    it("캐시 통계를 반환합니다", async () => {
      const mockAsyncStorage = AsyncStorage as any;

      const cacheData = {
        thumbnails: [
          {
            videoId: "test1",
            url: "https://example.com/1.jpg",
            cachedAt: new Date().toISOString(),
          },
          {
            videoId: "test2",
            url: "https://example.com/2.jpg",
            cachedAt: new Date().toISOString(),
          },
        ],
        lastCleaned: new Date().toISOString(),
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cacheData));

      const stats = await getThumbnailCacheStats();

      expect(stats.totalCached).toBe(2);
      expect(stats.lastCleaned).toBeDefined();
    });

    it("캐시가 없는 경우 0을 반환합니다", async () => {
      const mockAsyncStorage = AsyncStorage as any;

      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const stats = await getThumbnailCacheStats();

      expect(stats.totalCached).toBe(0);
    });
  });

  describe("clearThumbnailCache", () => {
    it("모든 캐시를 초기화합니다", async () => {
      const mockAsyncStorage = AsyncStorage as any;

      mockAsyncStorage.removeItem.mockResolvedValueOnce(undefined);

      await clearThumbnailCache();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
        "video_thumbnail_cache"
      );
    });
  });
});
