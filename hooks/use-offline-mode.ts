import { useState, useEffect, useCallback } from "react";
import {
  getNetworkStatus,
  subscribeToNetworkStatus,
  getOfflineQueue,
  getOfflineQueueSize,
  type NetworkStatus,
  type OfflineAction,
} from "@/lib/network-status";

export interface OfflineModeState {
  isOnline: boolean;
  networkStatus: NetworkStatus | null;
  offlineQueueSize: number;
  offlineQueue: OfflineAction[];
  isLoading: boolean;
}

/**
 * 오프라인 모드 상태를 관리하는 훅
 */
export function useOfflineMode() {
  const [state, setState] = useState<OfflineModeState>({
    isOnline: true,
    networkStatus: null,
    offlineQueueSize: 0,
    offlineQueue: [],
    isLoading: true,
  });

  // 초기 네트워크 상태 확인
  useEffect(() => {
    const initializeNetworkStatus = async () => {
      try {
        const status = await getNetworkStatus();
        const queueSize = await getOfflineQueueSize();
        const queue = await getOfflineQueue();

        setState((prev) => ({
          ...prev,
          isOnline: status.isConnected && status.isInternetReachable,
          networkStatus: status,
          offlineQueueSize: queueSize,
          offlineQueue: queue,
          isLoading: false,
        }));
      } catch (error) {
        console.error("네트워크 상태 초기화 실패:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initializeNetworkStatus();
  }, []);

  // 네트워크 상태 변화 감시
  useEffect(() => {
    const unsubscribe = subscribeToNetworkStatus((status) => {
      setState((prev) => ({
        ...prev,
        isOnline: status.isConnected && status.isInternetReachable,
        networkStatus: status,
      }));
    });

    return () => unsubscribe();
  }, []);

  // 오프라인 큐 새로고침
  const refreshOfflineQueue = useCallback(async () => {
    try {
      const queueSize = await getOfflineQueueSize();
      const queue = await getOfflineQueue();

      setState((prev) => ({
        ...prev,
        offlineQueueSize: queueSize,
        offlineQueue: queue,
      }));
    } catch (error) {
      console.error("오프라인 큐 새로고침 실패:", error);
    }
  }, []);

  return {
    ...state,
    refreshOfflineQueue,
  };
}

/**
 * 오프라인 모드 상태를 확인하는 훅
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkOnlineStatus = async () => {
      const status = await getNetworkStatus();
      setIsOnline(status.isConnected && status.isInternetReachable);
    };

    checkOnlineStatus();

    const unsubscribe = subscribeToNetworkStatus((status) => {
      setIsOnline(status.isConnected && status.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
}
