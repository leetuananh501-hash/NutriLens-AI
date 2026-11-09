import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DailyDashboard } from './components/DailyDashboard';
import { MealScanner } from './components/MealScanner';
import { LabelScanner } from './components/LabelScanner';
import { ProductHistoryView } from './components/ProductHistoryView';
import { GoalsView } from './components/GoalsView';
import { MobileQuickScanSheet } from './components/MobileQuickScanSheet';
import { NutriRankModal } from './components/NutriRankModal';
import { calculateNutriRank } from './services/nutriRankService';
import { 
  MealLogEntry, 
  ProductLabelAnalysis, 
  UserNutritionProfile, 
  AnalyzedMeal, 
  MealType 
} from './types';
import { 
  DEFAULT_PROFILE, 
  INITIAL_MEAL_LOGS, 
  SAMPLE_LABELS 
} from './data/sampleData';
import { useNetworkSync } from './hooks/useNetworkSync';
import { 
  Utensils, 
  Camera, 
  ShieldAlert, 
  Target, 
  History, 
  Smartphone, 
  Monitor, 
  Sparkles,
  Wifi,
  WifiOff,
  Battery,
  ScanLine,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('nutrilens_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nutrilens_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nutrilens_theme', 'light');
    }
  }, [isDark]);

  const toggleDark = () => setIsDark((prev) => !prev);

  // Active view
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meal_scan' | 'label_scan' | 'history' | 'goals'>('dashboard');
  const [prefilledMealType, setPrefilledMealType] = useState<MealType>('lunch');
  const [isQuickScanOpen, setIsQuickScanOpen] = useState<boolean>(false);
  const [isMobileFrameMode, setIsMobileFrameMode] = useState<boolean>(false);
  const [isNutriRankOpen, setIsNutriRankOpen] = useState<boolean>(false);

  // Logs and Data state with LocalStorage
  const [mealLogs, setMealLogs] = useState<MealLogEntry[]>(() => {
    const saved = localStorage.getItem('nutrilens_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved logs:', e);
      }
    }
    return INITIAL_MEAL_LOGS;
  });

  const [savedLabels, setSavedLabels] = useState<ProductLabelAnalysis[]>(() => {
    const saved = localStorage.getItem('nutrilens_labels');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved labels:', e);
      }
    }
    return SAMPLE_LABELS.map((s) => s.data);
  });

  const [waterMl, setWaterMl] = useState<number>(() => {
    const saved = localStorage.getItem('nutrilens_water');
    return saved ? parseInt(saved, 10) : 1250;
  });

  const [profile, setProfile] = useState<UserNutritionProfile>(() => {
    const saved = localStorage.getItem('nutrilens_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved profile:', e);
      }
    }
    return DEFAULT_PROFILE;
  });

  // Calculate dynamic Nutri-Rank and badges
  const nutriRankInfo = calculateNutriRank(savedLabels, mealLogs, waterMl);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('nutrilens_logs', JSON.stringify(mealLogs));
  }, [mealLogs]);

  useEffect(() => {
    localStorage.setItem('nutrilens_labels', JSON.stringify(savedLabels));
  }, [savedLabels]);

  useEffect(() => {
    localStorage.setItem('nutrilens_water', waterMl.toString());
  }, [waterMl]);

  useEffect(() => {
    localStorage.setItem('nutrilens_profile', JSON.stringify(profile));
  }, [profile]);

  // Network detection and background auto-synchronization
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncedAt,
    syncStatusBanner,
    syncNow,
    addToQueue,
    hideBanner,
  } = useNetworkSync({
    meals: mealLogs,
    labels: savedLabels,
    water: waterMl,
    profile,
    onSyncComplete: (synced) => {
      if (synced.meals) setMealLogs(synced.meals);
      if (synced.labels) setSavedLabels(synced.labels);
    },
  });

  // Handlers with Offline Action Queuing
  const handleAddMeal = (meal: AnalyzedMeal, mealType: MealType, imageUrl?: string) => {
    const newEntry: MealLogEntry = {
      ...meal,
      id: `meal-${Date.now()}`,
      mealType,
      loggedAt: new Date().toISOString(),
      imageUrl,
    };
    setMealLogs((prev) => [newEntry, ...prev]);
    addToQueue({
      type: 'ADD_MEAL',
      data: newEntry,
    });
  };

  const handleDeleteMeal = (id: string) => {
    setMealLogs((prev) => prev.filter((item) => item.id !== id));
    addToQueue({
      type: 'DELETE_MEAL',
      data: { id },
    });
  };

  const handleAddWater = (amount: number) => {
    setWaterMl((prev) => {
      const updated = Math.min(prev + amount, 6000);
      addToQueue({
        type: 'UPDATE_WATER',
        data: { waterMl: updated },
      });
      return updated;
    });
  };

  const handleResetWater = () => {
    setWaterMl(0);
    addToQueue({
      type: 'UPDATE_WATER',
      data: { waterMl: 0 },
    });
  };

  const handleSaveLabelAnalysis = (analysis: ProductLabelAnalysis) => {
    const withTimestamp = {
      ...analysis,
      scannedAt: analysis.scannedAt || new Date().toISOString(),
    };
    setSavedLabels((prev) => [withTimestamp, ...prev]);
    addToQueue({
      type: 'ADD_LABEL',
      data: withTimestamp,
    });
  };

  const handleDeleteLabel = (index: number) => {
    setSavedLabels((prev) => prev.filter((_, i) => i !== index));
    addToQueue({
      type: 'DELETE_LABEL',
      data: { index },
    });
  };

  const handleClearAllLabels = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả lịch sử tra cứu sản phẩm?')) {
      setSavedLabels([]);
      // Queue empty reset
      addToQueue({
        type: 'DELETE_LABEL',
        data: { clearAll: true },
      });
    }
  };

  const handleUpdateProfile = (newProfile: UserNutritionProfile) => {
    setProfile(newProfile);
    addToQueue({
      type: 'UPDATE_PROFILE',
      data: newProfile,
    });
  };

  const handleOpenMealScan = (mealType?: MealType) => {
    if (mealType) {
      setPrefilledMealType(mealType);
    }
    setActiveTab('meal_scan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLabelScan = () => {
    setActiveTab('label_scan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render main view contents
  const renderCurrentView = () => (
    <>
      {activeTab === 'dashboard' && (
        <DailyDashboard
          logs={mealLogs}
          profile={profile}
          waterMl={waterMl}
          onAddWater={handleAddWater}
          onResetWater={handleResetWater}
          onDeleteMeal={handleDeleteMeal}
          onOpenMealScan={handleOpenMealScan}
          onOpenLabelScan={handleOpenLabelScan}
          recentLabels={savedLabels}
          onOpenNutriRank={() => setIsNutriRankOpen(true)}
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingCount={pendingCount}
          onSyncNow={() => syncNow(false)}
        />
      )}

      {activeTab === 'meal_scan' && (
        <MealScanner
          initialMealType={prefilledMealType}
          onSaveMeal={(meal, mType, img) => {
            handleAddMeal(meal, mType, img);
            setActiveTab('dashboard');
          }}
        />
      )}

      {activeTab === 'label_scan' && (
        <LabelScanner
          onSaveLabelAnalysis={handleSaveLabelAnalysis}
          savedLabelsHistory={savedLabels}
        />
      )}

      {activeTab === 'history' && (
        <ProductHistoryView
          labelHistory={savedLabels}
          mealHistory={mealLogs}
          onDeleteLabel={handleDeleteLabel}
          onDeleteMeal={handleDeleteMeal}
          onClearAllLabels={handleClearAllLabels}
          onOpenLabelScanner={handleOpenLabelScan}
          onOpenMealScanner={handleOpenMealScan}
          onOpenNutriRank={() => setIsNutriRankOpen(true)}
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingCount={pendingCount}
          lastSyncedAt={lastSyncedAt}
          onSyncNow={() => syncNow(false)}
        />
      )}

      {activeTab === 'goals' && (
        <GoalsView
          profile={profile}
          onUpdateProfile={(p) => {
            handleUpdateProfile(p);
            setActiveTab('dashboard');
          }}
        />
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#121614] text-[#243B30] dark:text-[#E8EDE9] transition-colors flex flex-col items-center">
      {/* Desktop Helper Bar: Allows reviewer to test iOS/Android phone frame or responsive web */}
      <div className="hidden lg:flex items-center justify-between w-full max-w-7xl px-6 py-2.5 bg-white/70 dark:bg-[#1A201C]/70 border-b border-[#EAE5DC] dark:border-[#27302A] text-xs text-[#7A8B7F]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#243B30] dark:text-[#E8EDE9]">NutriLens Mobile OS Experience</span>
          <span aria-hidden="true">·</span>
          <span>Chuẩn giao diện iOS & Android Touch</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Xem thử:</span>
          <button
            onClick={() => setIsMobileFrameMode(false)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              !isMobileFrameMode
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Toàn màn hình</span>
          </button>

          <button
            onClick={() => setIsMobileFrameMode(true)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              isMobileFrameMode
                ? 'bg-emerald-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mô phỏng Điện thoại (414px)</span>
          </button>
        </div>
      </div>

      {/* Main Container: Either Fullwidth or Phone Simulation Container */}
      <div
        className={`w-full transition-all flex flex-col ${
          isMobileFrameMode
            ? 'max-w-[420px] my-6 bg-white dark:bg-slate-900 rounded-[48px] border-[6px] border-slate-800 dark:border-slate-700 shadow-2xl overflow-hidden min-h-[860px]'
            : 'max-w-7xl'
        }`}
      >
        {/* iOS / Android Simulated Status Bar (Visible in Phone Mode) */}
        {isMobileFrameMode && (
          <div className="w-full bg-slate-900 text-white px-7 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono z-50 shrink-0">
            <span className="font-bold">09:41</span>
            {/* Dynamic Island Pill */}
            <div className="w-20 h-4 bg-black rounded-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700" />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Universal Top Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDark={isDark}
          toggleDark={toggleDark}
          onOpenQuickScan={() => setIsQuickScanOpen(true)}
          onOpenNutriRank={() => setIsNutriRankOpen(true)}
          nutriRankLevel={nutriRankInfo.tierLevel}
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingCount={pendingCount}
          lastSyncedAt={lastSyncedAt}
          onSyncNow={() => syncNow(false)}
        />

        {/* Global Floating Sync Notification Toast */}
        {syncStatusBanner.visible && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md animate-fade-in pointer-events-auto">
            <div
              className={`p-3 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs backdrop-blur-md ${
                syncStatusBanner.type === 'offline'
                  ? 'bg-amber-900/90 text-amber-100 border-amber-700/80 shadow-amber-950/20'
                  : syncStatusBanner.type === 'syncing'
                  ? 'bg-[#243B30]/95 text-[#E8EDE9] border-[#3D5C4E] shadow-[#121614]/30'
                  : syncStatusBanner.type === 'error'
                  ? 'bg-rose-900/90 text-rose-100 border-rose-700/80 shadow-rose-950/20'
                  : 'bg-emerald-900/90 text-emerald-100 border-emerald-700/80 shadow-emerald-950/20'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {syncStatusBanner.type === 'offline' && <WifiOff className="w-4 h-4 text-amber-300 shrink-0" />}
                {syncStatusBanner.type === 'syncing' && <RefreshCw className="w-4 h-4 text-[#8FA89B] shrink-0 animate-spin" />}
                {syncStatusBanner.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />}
                {(syncStatusBanner.type === 'online' || syncStatusBanner.type === 'success') && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                )}
                <span className="font-medium truncate">{syncStatusBanner.text}</span>
              </div>
              <button
                onClick={hideBanner}
                className="p-1 rounded-md hover:bg-white/20 text-white/80 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Viewport */}
        <main className="flex-1 w-full px-4 sm:px-6 pt-5 pb-28 md:pb-12">
          {renderCurrentView()}
        </main>

        {/* iOS / Android Ergonomic Floating Bottom Navigation Dock (Deliciously Ella Style) */}
        <div
          className={`fixed md:hidden bottom-3 left-3 right-3 z-40 max-w-md mx-auto bg-white/95 dark:bg-[#1A201C]/95 backdrop-blur-xl border border-[#EAE5DC] dark:border-[#27302A] rounded-[32px] shadow-xl shadow-[#3D5C4E]/10 ${
            isMobileFrameMode ? '!sticky !bottom-2' : ''
          }`}
        >
          <div className="grid grid-cols-5 items-center h-16 px-3 relative">
            {/* Tab 1: Nhật ký */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
                activeTab === 'dashboard'
                  ? 'text-[#3D5C4E] dark:text-[#8FA89B] font-bold'
                  : 'text-[#8E9F93] hover:text-[#243B30] dark:text-[#6A786E]'
              }`}
            >
              <Utensils className="w-4.5 h-4.5" />
              <span className="text-[10px] tracking-tight mt-1 font-medium">Nhật ký</span>
            </button>

            {/* Tab 2: Soi Nhãn */}
            <button
              onClick={() => setActiveTab('label_scan')}
              className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
                activeTab === 'label_scan'
                  ? 'text-[#C86446] dark:text-[#E89279] font-bold'
                  : 'text-[#8E9F93] hover:text-[#243B30] dark:text-[#6A786E]'
              }`}
            >
              <ShieldAlert className="w-4.5 h-4.5" />
              <span className="text-[10px] tracking-tight mt-1 font-medium">Soi Nhãn</span>
            </button>

            {/* Center: Signature Elevated Shutter Button */}
            <div className="flex justify-center -mt-6">
              <button
                onClick={() => setIsQuickScanOpen(true)}
                aria-label="Chụp ảnh phân tích"
                className="w-13 h-13 rounded-full bg-[#3D5C4E] hover:bg-[#2D473B] text-[#FAF7F2] shadow-lg shadow-[#3D5C4E]/30 border-3 border-white dark:border-[#1A201C] flex items-center justify-center active:scale-95 transition-transform"
              >
                <Camera className="w-5.5 h-5.5 stroke-[2]" />
              </button>
            </div>

            {/* Tab 3: Lịch sử */}
            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
                activeTab === 'history'
                  ? 'text-[#3D5C4E] dark:text-[#8FA89B] font-bold'
                  : 'text-[#8E9F93] hover:text-[#243B30] dark:text-[#6A786E]'
              }`}
            >
              <History className="w-4.5 h-4.5" />
              <span className="text-[10px] tracking-tight mt-1 font-medium">Lịch sử</span>
            </button>

            {/* Tab 4: Mục tiêu */}
            <button
              onClick={() => setActiveTab('goals')}
              className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
                activeTab === 'goals'
                  ? 'text-[#3D5C4E] dark:text-[#8FA89B] font-bold'
                  : 'text-[#8E9F93] hover:text-[#243B30] dark:text-[#6A786E]'
              }`}
            >
              <Target className="w-4.5 h-4.5" />
              <span className="text-[10px] tracking-tight mt-1 font-medium">Mục tiêu</span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS/Android Quick Action Sheet Trigger */}
      <MobileQuickScanSheet
        isOpen={isQuickScanOpen}
        onClose={() => setIsQuickScanOpen(false)}
        onSelectMealScan={() => handleOpenMealScan()}
        onSelectLabelScan={() => handleOpenLabelScan()}
      />

      {/* Nutri-Rank & Wellness Badges Modal */}
      <NutriRankModal
        isOpen={isNutriRankOpen}
        onClose={() => setIsNutriRankOpen(false)}
        rankInfo={nutriRankInfo}
      />
    </div>
  );
}
