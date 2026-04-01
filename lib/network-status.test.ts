import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getNetworkStatus,
  addOfflineAction,
  getOfflineQueue,
  removeOfflineAction,
  clearOfflineQueue,
  getOfflineQueueSize,
} from "./network-status";

// AsyncStorage 모킹
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// NetInfo 모킹
vi.mock("@react-native-community/netinfo", () => ({
  default: {
    fetch: vi.fn(),
    addEventListener: vi.fn(),
  },
}));

describe("Network Status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNetworkStatus", () => {
    it("현재 네트워크 상태를 반환합니다", async () => {
      const mockAsyncStorage = AsyncStorage as any;
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      const status = await getNetworkStatus();

      expect(status).toHaveProperty("isConnected");
      expect(status).toHaveProperty("isInternetReachable");
      expect(status).toHaveProperty("type");
      expect(status).toHaveProperty("lastChecked");
    });
  });

  describe("Offline Queue", () => {
    it("오프라인 작업을 큐에 추가할 수 있습니다", async () => {
      const mockAsyncStorage = AsyncStorage as any;

      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      const actionId = await addOfflineAction({
        type: "sync",
        data: { test: "data" },
      });

      expect(actionId).toBeDefined();
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it("오프라인 큐를 조회할 수 있습니다", async () => {
      const mockAsyncStorage = AsyncStorage as any;
      const mockQueue = [
        {
          id: "1",
          type: "sync" as const,
          data: { test: "data" },
          timestamp: new Date().toISOString(),
          retries: 0,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockQueue));

      const queue = await getOfflineQueue();

      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe("1");
    });

    it("오프라인 큐에서 작업을 제거할 수 있습니다", async () => {
      const mockAsyncStorage = AsyncStorage as any;
      const mockQueue = [
        {
          id: "1",
          type: "sync" as const,
          data: { test: "data" },
          timestamp: new Date().toISOString(),
          retries: 0,
        },
        {
          id: "2",
          type: "sync" as const,
          data: { test: "data2" },
          timestamp: new Date().toISOString(),
          retries: 0,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockQueue));
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      await removeOfflineAction("1");

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it("오프라인 큐를 초기화할 수 있습니다", async () => {
      const mockAsyncStorage = AsyncStorage as any;

      mockAsyncStorage.removeItem.mockResolvedValueOnce(undefined);

      await clearOfflineQueue();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
        "offline_sync_queue"
      );
    });

    it("오프라인 큐의 크기를 반환합니다", async () => {
      const mockAsyncStorage = AsyncStorage as any;
      const mockQueue = [
        {
          id: "1",
          type: "sync" as const,
          data: { test: "data" },
          timestamp: new Date().toISOString(),
          retries: 0,
        },
        {
          id: "2",
          type: "sync" as const,
          data: { test: "data2" },
          timestamp: new Date().toISOString(),
          retries: 0,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockQueue));

      const size = await getOfflineQueueSize();

      expect(size).toBe(2);
    });
  });
});
