import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NETWORK_STATUS_KEY = "network_status";
const OFFLINE_QUEUE_KEY = "offline_sync_queue";

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  lastChecked: string;
}

export interface OfflineAction {
  id: string;
  type: "sync" | "upload" | "delete";
  data: any;
  timestamp: string;
  retries: number;
}

/**
 * 현재 네트워크 상태를 확인합니다.
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  try {
    const state = await NetInfo.fetch();
    const status: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      type: state.type || "unknown",
      lastChecked: new Date().toISOString(),
    };

    // 상태 저장
    await AsyncStorage.setItem(NETWORK_STATUS_KEY, JSON.stringify(status));

    return status;
  } catch (error) {
    console.error("네트워크 상태 확인 실패:", error);
    // 마지막 저장된 상태 반환
    const lastStatus = await AsyncStorage.getItem(NETWORK_STATUS_KEY);
    if (lastStatus) {
      return JSON.parse(lastStatus);
    }
    return {
      isConnected: false,
      isInternetReachable: false,
      type: "unknown",
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * 네트워크 상태 변화를 감시합니다.
 */
export function subscribeToNetworkStatus(
  callback: (status: NetworkStatus) => void
): () => void {
  const unsubscribe = NetInfo.addEventListener((state: any) => {
    const status: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      type: state.type || "unknown",
      lastChecked: new Date().toISOString(),
    };
    callback(status);
  });

  return () => unsubscribe();
}

/**
 * 오프라인 상태에서 수행할 작업을 큐에 추가합니다.
 */
export async function addOfflineAction(action: Omit<OfflineAction, "id" | "timestamp" | "retries">): Promise<string> {
  try {
    const queue = await getOfflineQueue();
    const newAction: OfflineAction = {
      ...action,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      retries: 0,
    };

    queue.push(newAction);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

    return newAction.id;
  } catch (error) {
    console.error("오프라인 작업 추가 실패:", error);
    throw error;
  }
}

/**
 * 오프라인 큐를 조회합니다.
 */
export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("오프라인 큐 조회 실패:", error);
    return [];
  }
}

/**
 * 오프라인 큐에서 작업을 제거합니다.
 */
export async function removeOfflineAction(actionId: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter((a) => a.id !== actionId);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("오프라인 작업 제거 실패:", error);
  }
}

/**
 * 오프라인 큐의 작업 재시도 횟수를 증가시킵니다.
 */
export async function incrementOfflineActionRetries(actionId: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const action = queue.find((a) => a.id === actionId);
    if (action) {
      action.retries += 1;
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (error) {
    console.error("재시도 횟수 증가 실패:", error);
  }
}

/**
 * 오프라인 큐를 초기화합니다.
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error("오프라인 큐 초기화 실패:", error);
  }
}

/**
 * 오프라인 큐의 크기를 반환합니다.
 */
export async function getOfflineQueueSize(): Promise<number> {
  try {
    const queue = await getOfflineQueue();
    return queue.length;
  } catch (error) {
    console.error("오프라인 큐 크기 조회 실패:", error);
    return 0;
  }
}
