import React from 'react';
import { 
  Sparkles, 
  Camera, 
  ScanLine, 
  Sun, 
  Moon, 
  Utensils, 
  ShieldAlert, 
  Target, 
  History,
  Wifi,
  WifiOff,
  RefreshCw,
  Check,
  Trophy
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'meal_scan' | 'label_scan' | 'history' | 'goals';
  setActiveTab: (tab: 'dashboard' | 'meal_scan' | 'label_scan' | 'history' | 'goals') => void;
  isDark: boolean;
  toggleDark: () => void;
  onOpenQuickScan: () => void;
  onOpenNutriRank?: () => void;
  nutriRankLevel?: number;
  isOnline?: boolean;
  isSyncing?: boolean;
  pendingCount?: number;
  lastSyncedAt?: string | null;
  onSyncNow?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  toggleDark,
  onOpenQuickScan,
  onOpenNutriRank,
  nutriRankLevel = 3,
  isOnline = true,
  isSyncing = false,
  pendingCount = 0,
  lastSyncedAt,
  onSyncNow,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 dark:bg-[#121614]/90 backdrop-blur-md border-b border-[#EAE5DC] dark:border-[#232B25] transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand wordmark in warm editorial serif */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 text-left text-[#243B30] dark:text-[#E8EDE9] whitespace-nowrap shrink-0 group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-full bg-[#3D5C4E] text-[#FAF7F2] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-editorial text-2xl font-normal italic tracking-tight">NutriLens</span>
            <span className="text-[11px] font-sans font-medium text-[#7A8B7F] dark:text-[#9DAEA3] hidden sm:inline">
              · feel better
            </span>
          </div>
        </button>

        {/* Zone 2: 4 single-line clean nav links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'dashboard'
                ? 'text-[#243B30] dark:text-[#FAF7F2] bg-[#EAE5DC] dark:bg-[#232B25]'
                : 'text-[#6A786E] dark:text-[#9DAEA3] hover:text-[#243B30] dark:hover:text-[#FAF7F2]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Nhật ký ăn uống</span>
          </button>

          <button
            onClick={() => setActiveTab('meal_scan')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'meal_scan'
                ? 'text-[#243B30] dark:text-[#FAF7F2] bg-[#EAE5DC] dark:bg-[#232B25]'
                : 'text-[#6A786E] dark:text-[#9DAEA3] hover:text-[#243B30] dark:hover:text-[#FAF7F2]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Soi Calo món ăn</span>
          </button>

          <button
            onClick={() => setActiveTab('label_scan')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'label_scan'
                ? 'text-[#C86446] dark:text-[#E89279] bg-[#FBEFEA] dark:bg-[#2D1F1A]'
                : 'text-[#6A786E] dark:text-[#9DAEA3] hover:text-[#243B30] dark:hover:text-[#FAF7F2]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Soi Nhãn Hóa Chất</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'history'
                ? 'text-[#243B30] dark:text-[#FAF7F2] bg-[#EAE5DC] dark:bg-[#232B25]'
                : 'text-[#6A786E] dark:text-[#9DAEA3] hover:text-[#243B30] dark:hover:text-[#FAF7F2]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lịch sử tra cứu</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'goals'
                ? 'text-[#243B30] dark:text-[#FAF7F2] bg-[#EAE5DC] dark:bg-[#232B25]'
                : 'text-[#6A786E] dark:text-[#9DAEA3] hover:text-[#243B30] dark:hover:text-[#FAF7F2]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Mục tiêu Calo</span>
          </button>
        </nav>

        {/* Zone 3: Sync Indicator, Theme Toggle, Primary Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Network / Sync Status */}
          <button
            onClick={() => onSyncNow && onSyncNow()}
            disabled={isSyncing}
            title={
              !isOnline
                ? `Đang ngoại tuyến (${pendingCount} mục chờ đồng bộ).`
                : isSyncing
                ? 'Đang đồng bộ dữ liệu...'
                : `Đã đồng bộ ${lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'mới nhất'}.`
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              !isOnline
                ? 'bg-[#FBEFEA] dark:bg-[#2A1E18] text-[#C86446] border-[#F1D5C9] dark:border-[#4A2D23]'
                : isSyncing
                ? 'bg-[#F3F6F4] dark:bg-[#1D2520] text-[#3D5C4E] border-[#D0DAD0] animate-pulse'
                : pendingCount > 0
                ? 'bg-[#FDF6ED] dark:bg-[#2C2317] text-[#DDA15E] border-[#F5E2C5]'
                : 'bg-[#F2F5F2] dark:bg-[#1A221D] text-[#3D5C4E] dark:text-[#9DAEA3] border-[#E2E8E2] dark:border-[#27352D]'
            }`}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-[#C86446]" />
                <span className="hidden xs:inline">Ngoại tuyến</span>
                {pendingCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#C86446] text-white text-[10px] font-mono font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3D5C4E]" />
                <span className="hidden xs:inline">Đang đồng bộ</span>
              </>
            ) : pendingCount > 0 ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-[#DDA15E]" />
                <span className="hidden xs:inline">Chờ ({pendingCount})</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-[#3D5C4E] dark:text-[#8FA89B]" />
                <span className="hidden xs:inline text-[11px]">Đã lưu an toàn</span>
              </>
            )}
          </button>

          {/* Nutri-Rank Quick Pill */}
          {onOpenNutriRank && (
            <button
              onClick={onOpenNutriRank}
              title="Xem Bảng Vinh Danh & Huy Hiệu Nutri-Rank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#C86446] dark:text-[#E89279] bg-[#FBEFEA] dark:bg-[#2A1E18] border border-[#F1D5C9] dark:border-[#4A2D23] hover:scale-105 active:scale-95 transition-all shadow-2xs"
            >
              <Trophy className="w-3.5 h-3.5 text-[#C86446] dark:text-[#E89279]" />
              <span className="hidden sm:inline">Rank:</span>
              <span className="font-bold font-mono">Lv.{nutriRankLevel}</span>
            </button>
          )}

          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="w-9 h-9 rounded-full border border-[#EAE5DC] dark:border-[#2B352E] flex items-center justify-center text-[#6A786E] dark:text-[#9DAEA3] hover:bg-[#EAE5DC]/60 dark:hover:bg-[#232B25] transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#DDA15E]" /> : <Moon className="w-4 h-4 text-[#3D5C4E]" />}
          </button>

          <button
            onClick={onOpenQuickScan}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-[#FAF7F2] bg-[#3D5C4E] hover:bg-[#2D473B] active:scale-95 rounded-full shadow-sm transition-all whitespace-nowrap shrink-0"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chụp & Soi ngay</span>
            <span className="sm:hidden">Soi</span>
          </button>
        </div>
      </div>
    </header>
  );
};
