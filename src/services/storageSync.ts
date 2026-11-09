import { MealLogEntry, ProductLabelAnalysis, UserNutritionProfile } from '../types';

export interface SyncAction {
  id: string;
  type: 'ADD_MEAL' | 'DELETE_MEAL' | 'ADD_LABEL' | 'DELETE_LABEL' | 'UPDATE_WATER' | 'UPDATE_PROFILE';
  data: any;
  timestamp: number;
}

export const STORAGE_KEYS = {
  MEALS: 'nutrilens_logs',
  LABELS: 'nutrilens_labels',
  WATER: 'nutrilens_water',
  PROFILE: 'nutrilens_profile',
  QUEUE: 'nutrilens_sync_queue',
  LAST_SYNCED: 'nutrilens_last_synced_at',
  OFFLINE_SNAPSHOT: 'nutrilens_offline_snapshot',
  USER_ID: 'nutrilens_user_id',
} as const;

// Safe localStorage helper with quota protection
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (err) {
      console.warn(`[storage] Failed to read key: ${key}`, err);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`[storage] Failed to write key: ${key}`, err);
      return false;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[storage] Failed to remove key: ${key}`, err);
    }
  },
};

// Get or generate a persistent local-first unique user ID
export function getOrCreateUserId(): string {
  let uid = storage.get<string | null>(STORAGE_KEYS.USER_ID, null);
  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    uid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    storage.set(STORAGE_KEYS.USER_ID, uid);
  }
  return uid;
}

// Queue operations for offline mutations
export const getSyncQueue = (): SyncAction[] => {
  return storage.get<SyncAction[]>(STORAGE_KEYS.QUEUE, []);
};

export const addToSyncQueue = (action: Omit<SyncAction, 'id' | 'timestamp'>): void => {
  const currentQueue = getSyncQueue();
  const newAction: SyncAction = {
    ...action,
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };
  currentQueue.push(newAction);
  storage.set(STORAGE_KEYS.QUEUE, currentQueue);
  console.log(`[OfflineQueue] Queued action: ${newAction.type}`, newAction);
};

export const clearSyncQueue = (): void => {
  storage.set(STORAGE_KEYS.QUEUE, []);
};

export const getLastSyncedAt = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.LAST_SYNCED);
};

export const setLastSyncedAt = (timeStr: string): void => {
  localStorage.setItem(STORAGE_KEYS.LAST_SYNCED, timeStr);
};

// Offline snapshot saver - guarantees offline inspection anytime
export const saveOfflineSnapshot = (data: {
  meals: MealLogEntry[];
  labels: ProductLabelAnalysis[];
  water: number;
  profile: UserNutritionProfile;
}) => {
  storage.set(STORAGE_KEYS.OFFLINE_SNAPSHOT, {
    ...data,
    savedAt: new Date().toISOString(),
  });
};

// Auto-sync function with server
export async function syncWithServer(params: {
  meals: MealLogEntry[];
  labels: ProductLabelAnalysis[];
  water: number;
  profile: UserNutritionProfile;
}): Promise<{
  success: boolean;
  syncedCount: number;
  serverTime?: string;
  meals?: MealLogEntry[];
  labels?: ProductLabelAnalysis[];
  error?: string;
}> {
  const queue = getSyncQueue();
  const userId = getOrCreateUserId();

  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        userId,
        syncQueue: queue,
        clientMeals: params.meals,
        clientLabels: params.labels,
        clientWater: params.water,
        clientProfile: params.profile,
        lastSyncedAt: getLastSyncedAt(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Mã lỗi máy chủ: ${response.status}`);
    }

    const resData = await response.json();
    if (resData.success) {
      // Clear queue since items are processed on server
      clearSyncQueue();
      const serverTime = resData.serverTime || new Date().toISOString();
      setLastSyncedAt(serverTime);

      // Refresh snapshot
      saveOfflineSnapshot({
        meals: resData.meals || params.meals,
        labels: resData.labels || params.labels,
        water: params.water,
        profile: params.profile,
      });

      return {
        success: true,
        syncedCount: queue.length,
        serverTime,
        meals: resData.meals,
        labels: resData.labels,
      };
    } else {
      throw new Error(resData.error || 'Đồng bộ thất bại.');
    }
  } catch (err: any) {
    console.warn('[Sync] Sync failed (offline or server unreachable):', err.message);
    return {
      success: false,
      syncedCount: 0,
      error: err.message,
    };
  }
}
