import { useCallback, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "./use-auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CloudSyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: Error | null;
}

export function useCloudSync() {
  const { isAuthenticated, user } = useAuth();
  const [syncState, setSyncState] = useState<CloudSyncState>({
    isSyncing: false,
    lastSyncTime: null,
    error: null,
  });

  // Get all user data from cloud
  const getAllUserData = trpc.sync.getAllUserData.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Sync goals to cloud
  const syncGoalsMutation = trpc.sync.syncExerciseGoals.useMutation();

  // Sync records to cloud
  const syncRecordsMutation = trpc.sync.syncExerciseRecords.useMutation();

  // Sync custom exercises to cloud
  const syncExercisesMutation = trpc.sync.syncCustomExercises.useMutation();

  /**
   * Upload local data to cloud
   */
  const uploadToCloud = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setSyncState((prev) => ({
        ...prev,
        error: new Error("User not authenticated"),
      }));
      return;
    }

    setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      // Get local data
      const goalsJson = await AsyncStorage.getItem("exerciseGoals");
      const recordsJson = await AsyncStorage.getItem("exerciseRecords");
      const exercisesJson = await AsyncStorage.getItem("customExercises");

      const goals = goalsJson ? JSON.parse(goalsJson) : [];
      const records = recordsJson ? JSON.parse(recordsJson) : [];
      const exercises = exercisesJson ? JSON.parse(exercisesJson) : [];

      // Upload to cloud
      await Promise.all([
        syncGoalsMutation.mutateAsync(goals),
        syncRecordsMutation.mutateAsync(
          records.map((r: any) => ({
            ...r,
            recordedAt: new Date(r.recordedAt),
          }))
        ),
        syncExercisesMutation.mutateAsync(exercises),
      ]);

      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
      }));
    } catch (error) {
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error : new Error("Sync failed"),
      }));
    }
  }, [isAuthenticated, user, syncGoalsMutation, syncRecordsMutation, syncExercisesMutation]);

  /**
   * Download cloud data to local
   */
  const downloadFromCloud = useCallback(async () => {
    if (!getAllUserData.data) return;

    setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      // Save to local storage
      await Promise.all([
        AsyncStorage.setItem("exerciseGoals", JSON.stringify(getAllUserData.data.goals)),
        AsyncStorage.setItem("exerciseRecords", JSON.stringify(getAllUserData.data.records)),
        AsyncStorage.setItem("customExercises", JSON.stringify(getAllUserData.data.customExercises)),
      ]);

      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
      }));
    } catch (error) {
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error : new Error("Sync failed"),
      }));
    }
  }, [getAllUserData.data]);

  /**
   * Bi-directional sync
   */
  const syncBothWays = useCallback(async () => {
    // First download from cloud
    await downloadFromCloud();
    // Then upload local changes
    await uploadToCloud();
  }, [downloadFromCloud, uploadToCloud]);

  return {
    ...syncState,
    uploadToCloud,
    downloadFromCloud,
    syncBothWays,
    cloudData: getAllUserData.data,
    isLoadingCloudData: getAllUserData.isLoading,
  };
}
