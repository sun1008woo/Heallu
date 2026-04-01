import AsyncStorage from "@react-native-async-storage/async-storage";

const VIDEO_THUMBNAIL_CACHE_KEY = "video_thumbnail_cache";
const CACHE_EXPIRY_DAYS = 30;

export interface CachedThumbnail {
  videoId: string;
  url: string;
  cachedAt: string;
}

export interface ThumbnailCache {
  thumbnails: CachedThumbnail[];
  lastCleaned: string;
}

/**
 * YouTube 동영상 ID로부터 썸네일 URL을 생성합니다.
 * 캐시된 URL이 있으면 반환하고, 없으면 새로 생성하여 캐시합니다.
 */
export async function getThumbnailUrl(videoId: string): Promise<string> {
  try {
    // 캐시에서 확인
    const cached = await getCachedThumbnail(videoId);
    if (cached) {
      return cached;
    }

    // 새로운 썸네일 URL 생성 (고품질)
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // 캐시에 저장
    await cacheThumbnail(videoId, thumbnailUrl);

    return thumbnailUrl;
  } catch (error) {
    console.error("썸네일 URL 생성 실패:", error);
    // 폴백: 기본 썸네일 URL 반환
    return `https://img.youtube.com/vi/${videoId}/default.jpg`;
  }
}

/**
 * 캐시에서 썸네일을 조회합니다.
 */
async function getCachedThumbnail(videoId: string): Promise<string | null> {
  try {
    const data = await AsyncStorage.getItem(VIDEO_THUMBNAIL_CACHE_KEY);
    if (!data) return null;

    const cache: ThumbnailCache = JSON.parse(data);
    const cached = cache.thumbnails.find((t) => t.videoId === videoId);

    if (cached) {
      // 캐시 만료 확인
      const cachedDate = new Date(cached.cachedAt);
      const now = new Date();
      const daysDiff = (now.getTime() - cachedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff < CACHE_EXPIRY_DAYS) {
        return cached.url;
      }
    }

    return null;
  } catch (error) {
    console.error("캐시 조회 실패:", error);
    return null;
  }
}

/**
 * 썸네일을 캐시에 저장합니다.
 */
async function cacheThumbnail(videoId: string, url: string): Promise<void> {
  try {
    let cache: ThumbnailCache = { thumbnails: [], lastCleaned: new Date().toISOString() };

    const existingData = await AsyncStorage.getItem(VIDEO_THUMBNAIL_CACHE_KEY);
    if (existingData) {
      cache = JSON.parse(existingData);
    }

    // 기존 항목 제거
    cache.thumbnails = cache.thumbnails.filter((t) => t.videoId !== videoId);

    // 새 항목 추가
    cache.thumbnails.push({
      videoId,
      url,
      cachedAt: new Date().toISOString(),
    });

    // 캐시 크기 제한 (최대 500개)
    if (cache.thumbnails.length > 500) {
      cache.thumbnails = cache.thumbnails.slice(-500);
    }

    await AsyncStorage.setItem(VIDEO_THUMBNAIL_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("썸네일 캐시 저장 실패:", error);
  }
}

/**
 * 만료된 캐시를 정리합니다.
 */
export async function cleanExpiredThumbnails(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(VIDEO_THUMBNAIL_CACHE_KEY);
    if (!data) return;

    const cache: ThumbnailCache = JSON.parse(data);
    const now = new Date();

    cache.thumbnails = cache.thumbnails.filter((t) => {
      const cachedDate = new Date(t.cachedAt);
      const daysDiff = (now.getTime() - cachedDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff < CACHE_EXPIRY_DAYS;
    });

    cache.lastCleaned = new Date().toISOString();

    await AsyncStorage.setItem(VIDEO_THUMBNAIL_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("캐시 정리 실패:", error);
  }
}

/**
 * 모든 썸네일 캐시를 초기화합니다.
 */
export async function clearThumbnailCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(VIDEO_THUMBNAIL_CACHE_KEY);
  } catch (error) {
    console.error("캐시 초기화 실패:", error);
  }
}

/**
 * 캐시 통계를 반환합니다.
 */
export async function getThumbnailCacheStats(): Promise<{
  totalCached: number;
  lastCleaned: string;
}> {
  try {
    const data = await AsyncStorage.getItem(VIDEO_THUMBNAIL_CACHE_KEY);
    if (!data) {
      return { totalCached: 0, lastCleaned: new Date().toISOString() };
    }

    const cache: ThumbnailCache = JSON.parse(data);
    return {
      totalCached: cache.thumbnails.length,
      lastCleaned: cache.lastCleaned,
    };
  } catch (error) {
    console.error("캐시 통계 조회 실패:", error);
    return { totalCached: 0, lastCleaned: new Date().toISOString() };
  }
}
