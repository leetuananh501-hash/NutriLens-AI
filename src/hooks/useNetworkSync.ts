import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getSyncQueue, 
  getLastSyncedAt, 
  syncWithServer, 
  addToSyncQueue, 
  saveOfflineSnapshot,
  SyncAction 
} from '../services/storageSync';
import { MealLogEntry, ProductLabelAnalysis, UserNutritionProfile } from '../types';

interface UseNetworkSyncProps {
  meals: MealLogEntry[];
  labels: ProductLabelAnalysis[];
  water: number;
  profile: UserNutritionProfile;
  onSyncComplete?: (data: { meals?: MealLogEntry[]; labels?: ProductLabelAnalysis[] }) => void;
}

export function useNetworkSync({
  meals,
  labels,
  water,
  profile,
  onSyncComplete,
}: UseNetworkSyncProps) {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(() => getSyncQueue().length);
  const [lastSyncedAt, setLastSyncedAtState] = useState<string | null>(() => getLastSyncedAt());
  const [syncStatusBanner, setSyncStatusBanner] = useState<{
    type: 'online' | 'offline' | 'syncing' | 'success' | 'error';
    text: string;
    visible: boolean;
  }>({
    type: isOnline ? 'online' : 'offline',
    text: '',
    visible: false,
  });

  const bannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showBanner = useCallback((type: 'online' | 'offline' | 'syncing' | 'success' | 'error', text: string, autoDismissMs = 4000) => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = null;
    }
    setSyncStatusBanner({ type, text, visible: true });

    if (autoDismissMs > 0) {
      bannerTimeoutRef.current = setTimeout(() => {
        setSyncStatusBanner((prev) => ({ ...prev, visible: false }));
      }, autoDismissMs);
    }
  }, []);

  const hideBanner = useCallback(() => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = null;
    }
    setSyncStatusBanner((prev) => ({ ...prev, visible: false }));
  }, []);

  // Update pending queue count
  const refreshPendingCount = useCallback(() => {
    setPendingCount(getSyncQueue().length);
  }, []);

  // Sync execution
  const syncNow = useCallback(async (silent = false) => {
    if (isSyncing) return;
    if (!navigator.onLine) {
      if (!silent) {
        showBanner('offline', 'Thiết bị đang ngoại tuyến. Dữ liệu được lưu an toàn trên máy.', 3500);
      }
      return;
    }

    setIsSyncing(true);
    if (!silent) {
      showBanner('syncing', 'Đang đồng bộ dữ liệu dinh dưỡng & nhãn...', 0);
    }

    try {
      const res = await syncWithServer({
        meals,
        labels,
        water,
        profile,
      });

      if (res.success) {
        setPendingCount(0);
        if (res.serverTime) {
          setLastSyncedAtState(res.serverTime);
        }
        if (onSyncComplete && (res.meals || res.labels)) {
          onSyncComplete({ meals: res.meals, labels: res.labels });
        }
        if (!silent) {
          showBanner(
            'success',
            res.syncedCount > 0
              ? `Đồng bộ thành công ${res.syncedCount} thao tác ngoại tuyến!`
              : 'Dữ liệu đã được đồng bộ mới nhất!',
            3000
          );
        } else {
          hideBanner();
        }
      } else {
        if (!silent) {
          showBanner('error', `Không thể đồng bộ: ${res.error || 'Lỗi mạng'}`, 4000);
        }
      }
    } catch (e: any) {
      if (!silent) {
        showBanner('error', 'Lỗi khi đồng bộ dữ liệu.', 3500);
      }
    } finally {
      setIsSyncing(false);
      refreshPendingCount();
    }
  }, [isSyncing, meals, labels, water, profile, onSyncComplete, showBanner, hideBanner, refreshPendingCount]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Connection restored: online');
      setIsOnline(true);
      showBanner('online', 'Đã có mạng trở lại! Đang tự động đồng bộ hóa...', 2500);
      // Auto sync when network returns
      setTimeout(() => {
        syncNow(false);
      }, 600);
    };

    const handleOffline = () => {
      console.log('[Network] Connection lost: offline');
      setIsOnline(false);
      // Pre-cache an offline snapshot of current data
      saveOfflineSnapshot({ meals, labels, water, profile });
      showBanner(
        'offline',
        'Đã mất kết nối mạng - Đã chuyển sang chế độ Ngoại tuyến. Lịch sử và nhãn vẫn xem bình thường!',
        5000
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    };
  }, [meals, labels, water, profile, syncNow, showBanner]);

  // Ping heartbeat to verify true internet connectivity (every 40s)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (navigator.onLine) {
        try {
          const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
          if (!res.ok) {
            setIsOnline(false);
          } else {
            if (!isOnline) {
              setIsOnline(true);
              // Trigger sync if we re-detected connectivity
              syncNow(true);
            }
          }
        } catch {
          setIsOnline(false);
        }
      } else {
        setIsOnline(false);
      }
      refreshPendingCount();
    }, 40000);

    return () => clearInterval(interval);
  }, [isOnline, syncNow, refreshPendingCount]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncedAt,
    syncStatusBanner,
    syncNow,
    refreshPendingCount,
    addToQueue: (action: Omit<SyncAction, 'id' | 'timestamp'>) => {
      addToSyncQueue(action);
      refreshPendingCount();
    },
    hideBanner,
  };
}
