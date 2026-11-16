import React, { useEffect, useRef, useState } from 'react';
import { 
  Flame, 
  Droplet, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Camera,
  ShieldAlert,
  ArrowUpRight,
  WifiOff,
  RefreshCw,
  HardDrive,
  CalendarDays,
  Scale,
  Activity
} from 'lucide-react';
import { MealLogEntry, UserNutritionProfile, MealType, ProductLabelAnalysis } from '../types';
import { WeeklyCalorieTrendChart } from './WeeklyCalorieTrendChart';
import { NutriRankCard } from './NutriRankCard';
import { calculateNutriRank } from '../services/nutriRankService';
import { roundInt } from '../utils/numberFormat';

interface DailyDashboardProps {
  logs: MealLogEntry[];
  profile: UserNutritionProfile;
  waterMl: number;
  onAddWater: (amount: number) => void;
  onResetWater: () => void;
  onDeleteMeal: (id: string) => void;
  onOpenMealScan: (prefillMealType?: MealType) => void;
  onOpenLabelScan: () => void;
  onOpenNutriRank?: () => void;
  onOpenMealPlanner?: () => void;
  onOpenProductCompare?: () => void;
  recentLabels: ProductLabelAnalysis[];
  isOnline?: boolean;
  isSyncing?: boolean;
  pendingCount?: number;
  onSyncNow?: () => void;
}

// 12x12 warm botanical low-resolution PNG base64 placeholder (prevents layout shift while loading)
const MEAL_IMAGE_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAxElEQVR42o3RPQvCMBAG4Pz/0b2bCBniIkFCh5S0GmL6EdqjJn5gJFo6KPgTpAhdDbzbPXDHe+hzhjlvZ1627p41DOY4whw0j8dePboitOJwE9oXTVAzRT8xgPSGXyrmNM0szU9MXnl1lz83obFX3nCnKUhidnjb4hRIZqm88iaoCb2deXTFpWIgSSmWkifrMtk0yxRIfmLaFzAY9LJ1aIXT1Oyw5Alni9V+sS6TbYszSw830T3rOBS1Lurw2Aqiyvz7li8GJV04fk/u8QAAAABJRU5ErkJggg==';

interface MealThumbnailProps {
  src?: string;
  alt: string;
}

const MealThumbnail: React.FC<MealThumbnailProps> = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setHasError(false);
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  if (!src || hasError) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] flex items-center justify-center text-[#3D5C4E] shrink-0">
        <Sparkles className="w-5 h-5" />
      </div>
    );
  }

  return (
    <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-[#EAE5DC] dark:border-[#27302A] bg-[#FAF7F2] dark:bg-[#151916] shrink-0">
      {/* Low-resolution blurred base64 placeholder */}
      <img
        src={MEAL_IMAGE_PLACEHOLDER}
        alt=""
        aria-hidden="true"
        width={56}
        height={56}
        className={`absolute inset-0 w-full h-full object-cover blur-sm scale-110 transition-opacity duration-300 pointer-events-none ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* High-resolution meal image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={56}
        height={56}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`relative w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export const DailyDashboard: React.FC<DailyDashboardProps> = ({
  logs,
  profile,
  waterMl,
  onAddWater,
  onResetWater,
  onDeleteMeal,
  onOpenMealScan,
  onOpenLabelScan,
  onOpenNutriRank,
  onOpenMealPlanner,
  onOpenProductCompare,
  recentLabels,
  isOnline = true,
  isSyncing = false,
  pendingCount = 0,
  onSyncNow,
}) => {
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  const defaultBurnByActivity: Record<UserNutritionProfile['activityLevel'], number> = {
    sedentary: 180,
    light: 260,
    moderate: 340,
    active: 460,
  };

  const [burnedCalories, setBurnedCalories] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nutrilens_burned_kcal');
      if (saved) return roundInt(parseInt(saved, 10), defaultBurnByActivity[profile.activityLevel]);
    } catch {
      // ignore storage error
    }
    return defaultBurnByActivity[profile.activityLevel];
  });

  const handleAddBurnedCalories = (delta: number) => {
    setBurnedCalories((prev) => {
      const next = Math.min(2500, Math.max(0, roundInt(prev + delta)));
      try {
        localStorage.setItem('nutrilens_burned_kcal', String(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

  // Compute Nutri-Rank and badges
  const nutriRankInfo = calculateNutriRank(recentLabels, logs, waterMl);

  // Generate 7-day mobile date carousel
  const weekDays = [6, 5, 4, 3, 2, 1, 0].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return {
      offset,
      dayLabel: dayLabels[d.getDay()],
      dayNum: d.getDate(),
      isToday: offset === 0,
    };
  });

  // Compute daily totals (rounded to nearest integer to prevent IEEE-754 float artifacts)
  const totalCalories = roundInt(logs.reduce((acc, item) => acc + (Number(item.calories) || 0), 0));
  const totalProtein = roundInt(logs.reduce((acc, item) => acc + (Number(item.protein) || 0), 0));
  const totalCarbs = roundInt(logs.reduce((acc, item) => acc + (Number(item.carbs) || 0), 0));
  const totalFat = roundInt(logs.reduce((acc, item) => acc + (Number(item.fat) || 0), 0));
  const totalFiber = roundInt(logs.reduce((acc, item) => acc + (Number(item.fiber) || 0), 0));
  const roundedWaterMl = roundInt(waterMl);

  const targetCalories = Math.max(1, roundInt(profile.targetCalories, 2000));
  const targetProtein = Math.max(1, roundInt(profile.targetProtein, 130));
  const targetCarbs = Math.max(1, roundInt(profile.targetCarbs, 220));
  const targetFat = Math.max(1, roundInt(profile.targetFat, 60));
  const targetWaterMl = Math.max(1, roundInt(profile.targetWaterMl, 2500));

  const caloriesRemaining = roundInt(targetCalories - totalCalories + burnedCalories);
  const calPercent = Math.min(Math.round((totalCalories / targetCalories) * 100), 100);
  const burnGoal = 500;
  const burnPercent = Math.min(Math.round((burnedCalories / burnGoal) * 100), 100);
  const proteinPercent = Math.min(Math.round((totalProtein / targetProtein) * 100), 100);
  const fiberPercent = Math.min(Math.round((totalFiber / 30) * 100), 100);
  const carbsPercent = Math.min(Math.round((totalCarbs / targetCarbs) * 100), 100);
  const fatPercent = Math.min(Math.round((totalFat / targetFat) * 100), 100);
  const waterPercent = Math.min(Math.round((roundedWaterMl / targetWaterMl) * 100), 100);

  // Group meals
  const mealSections: { type: MealType; label: string; icon: string; timeHint: string }[] = [
    { type: 'breakfast', label: 'Bữa Sáng', icon: '🍳', timeHint: '06:00 - 09:00' },
    { type: 'lunch', label: 'Bữa Trưa', icon: '🥗', timeHint: '11:30 - 13:30' },
    { type: 'dinner', label: 'Bữa Tối', icon: '🍲', timeHint: '18:00 - 20:00' },
    { type: 'snack', label: 'Bữa Ăn Nhẹ & Nước Uống', icon: '🍎', timeHint: 'Cả ngày' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Offline Status Notice Banner (when offline or has pending queued actions) */}
      {(!isOnline || pendingCount > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-200">
                {!isOnline ? 'Đang hoạt động Ngoại Tuyến (Offline)' : 'Đã có mạng - Chờ hoàn tất đồng bộ'}
              </p>
              <p className="text-amber-700 dark:text-amber-400 mt-0.5 text-[11px]">
                Toàn bộ lịch sử dinh dưỡng, biểu đồ calo 7 ngày và nhãn đã lưu vẫn hoạt động bình thường từ bộ nhớ máy.
                {pendingCount > 0 && ` (${pendingCount} thao tác sẽ tự động đồng bộ).`}
              </p>
            </div>
          </div>

          {onSyncNow && isOnline && (
            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 text-xs flex items-center gap-1.5 transition-all whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Đồng bộ ngay</span>
            </button>
          )}
        </div>
      )}

      {/* 1. Daily Progress & Calorie Overview Strip (Deliciously Ella "Feel Better" Signature Hub) */}
      <section className="bg-white dark:bg-[#1A201C] rounded-[32px] p-5 sm:p-8 border border-[#EAE5DC] dark:border-[#27302A] shadow-xs transition-colors space-y-7">
        {/* Horizontal Mobile Date Carousel (Pebble-shaped dates) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-2 pr-2 border-b border-[#F0EBE1] dark:border-[#242D26] -mx-1 pl-1">
          {weekDays.map((item) => (
            <button
              key={item.offset}
              onClick={() => setSelectedDayOffset(item.offset)}
              className={`flex-1 min-w-[44px] py-2.5 px-2 rounded-2xl flex flex-col items-center justify-center transition-all shrink-0 ${
                selectedDayOffset === item.offset
                  ? 'bg-[#3D5C4E] text-[#FAF7F2] shadow-sm font-semibold scale-[1.02]'
                  : 'bg-[#FAF7F2] dark:bg-[#151916] text-[#6A786E] dark:text-[#9DAEA3] hover:bg-[#F2ECE1]'
              }`}
            >
              <span className="text-[10px] tracking-wider uppercase font-medium">{item.dayLabel}</span>
              <span className="text-sm font-bold font-mono mt-0.5">{item.dayNum}</span>
              {item.isToday && (
                <span className={`w-1 h-1 rounded-full mt-1 ${selectedDayOffset === item.offset ? 'bg-[#FAF7F2]' : 'bg-[#3D5C4E]'}`} />
              )}
            </button>
          ))}
        </div>

        {/* Title block + Always-horizontal CTA Buttons */}
        <div className="pb-3 border-b border-[#F0EBE1] dark:border-[#242D26]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#7A8B7F] dark:text-[#8E9F93]">
            <span>Hôm nay</span>
            <span aria-hidden="true">·</span>
            <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#3D5C4E] dark:text-[#8FA89B] font-medium">
              {profile.dietGoal === 'lose_weight' ? 'Thâm hụt lành mạnh' : profile.dietGoal === 'gain_muscle' ? 'Tăng cơ tự nhiên' : 'Cân bằng & Tươi trẻ'}
            </span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl italic font-normal tracking-tight text-[#243B30] dark:text-[#E8EDE9] mt-1">
            Nuôi dưỡng cơ thể hôm nay
          </h1>
          <p className="text-xs text-[#6A786E] dark:text-[#9DAEA3] mt-0.5">
            Lắng nghe dinh dưỡng tự nhiên · Ăn để cảm thấy khỏe khoắn và tràn đầy năng lượng
          </p>

          {/* CTA Buttons — always side by side, never wrap */}
          <div className="flex flex-row gap-3 mt-4">
            <button
              onClick={() => onOpenMealScan()}
              className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold text-[#FAF7F2] bg-[#3D5C4E] hover:bg-[#2D473B] rounded-full transition-all shadow-xs whitespace-nowrap"
            >
              <Camera className="w-4 h-4 shrink-0" />
              Chụp bữa ăn
            </button>
            <button
              onClick={onOpenLabelScan}
              className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold text-[#C86446] bg-[#FBEFEA] dark:bg-[#2D1F1A] hover:bg-[#F6E1D7] dark:hover:bg-[#3B2822] rounded-full transition-all border border-[#F1D5C9] dark:border-[#4B3026] whitespace-nowrap"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#C86446]" />
              Soi nhãn
            </button>
          </div>
        </div>

        {/* 3. Compact All-in-one Calorie Overview Card (2-column layout) */}
        <div className="p-4 sm:p-5 rounded-[24px] bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A]">
          <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[116px_1fr] gap-3.5 sm:gap-6 items-center">
            {/* Left Column: Compact SVG Calorie Ring (~100px) */}
            <div className="relative w-[100px] h-[100px] sm:w-[112px] sm:h-[112px] flex items-center justify-center mx-auto shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="41"
                  className="stroke-[#EAE5DC] dark:stroke-[#232B25]"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="41"
                  className="stroke-[#3D5C4E] dark:stroke-[#5F8060] transition-all duration-700 ease-out"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 41}
                  strokeDashoffset={2 * Math.PI * 41 * (1 - Math.min(calPercent, 100) / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
                <span className="text-[10px] uppercase tracking-wider text-[#7A8B7F] dark:text-[#8E9F93] font-bold leading-none">
                  {caloriesRemaining >= 0 ? 'CÒN LẠI' : 'VƯỢT MỨC'}
                </span>
                <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-[#243B30] dark:text-[#E8EDE9] leading-tight mt-0.5">
                  {Math.abs(caloriesRemaining).toLocaleString()}
                </span>
                <span className="text-[10px] text-[#7A8B7F] font-mono leading-none">kcal</span>
              </div>
            </div>

            {/* Right Column: 3 Visual Progress Rows */}
            <div className="space-y-2.5 min-w-0">
              {/* Row 1: Đã nạp */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#243B30] dark:text-[#E8EDE9] truncate">Đã nạp</span>
                  <span className="font-mono font-bold tabular-nums text-[#3D5C4E] dark:text-[#8FC2A6] whitespace-nowrap">
                    {roundInt(totalCalories).toLocaleString()} kcal
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EAE5DC] dark:bg-[#232B25] overflow-hidden">
                  <div
                    className="h-full bg-[#3D5C4E] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(calPercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Row 2: Vận động / Tiêu hao */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#243B30] dark:text-[#E8EDE9] truncate flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#C86446] shrink-0" />
                    <span className="truncate">Vận động / Tiêu hao</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-bold tabular-nums text-[#C86446] whitespace-nowrap">
                      {roundInt(burnedCalories).toLocaleString()} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddBurnedCalories(100)}
                      title="Cộng thêm 100 kcal vận động"
                      className="px-1.5 py-0.5 rounded-md bg-[#FFF5F3] dark:bg-[#2A1B18] border border-[#FDDBD4] dark:border-[#4D2D27] text-[10px] font-mono font-bold text-[#C86446] hover:opacity-80 transition-opacity whitespace-nowrap"
                    >
                      +100
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EAE5DC] dark:bg-[#232B25] overflow-hidden">
                  <div
                    className="h-full bg-[#C86446] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(burnPercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Row 3: Badge Mục tiêu ngày */}
              <div className="pt-0.5 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#243B30] dark:bg-[#3D5C4E] text-[#FAF7F2] text-[11px] font-semibold whitespace-nowrap">
                  <span>Mục tiêu ngày:</span>
                  <strong className="font-mono tabular-nums">{targetCalories.toLocaleString()} kcal</strong>
                </span>
                <span className="text-[11px] text-[#7A8B7F] font-mono tabular-nums whitespace-nowrap">
                  {calPercent}% năng lượng nạp
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Botanical 4 Pillars Grid (2x2) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pillar 1: Đạm (Protein) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFF5F3] dark:bg-[#2A1B18] border border-[#FDDBD4] dark:border-[#4D2D27] flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 text-xs mb-1">
              <span className="font-bold text-[#C86446] dark:text-[#F09A82] truncate">Đạm</span>
              <span className="font-mono tabular-nums text-[11px] font-semibold text-[#C86446] dark:text-[#F09A82] shrink-0">
                {proteinPercent}%
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 my-0.5">
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#243B30] dark:text-[#E8EDE9]">
                {roundInt(totalProtein)}g
              </span>
              <span className="text-xs text-[#7A8B7F] font-mono whitespace-nowrap">/ {roundInt(targetProtein)}g</span>
            </div>
            <div className="w-full bg-[#FDDBD4]/70 dark:bg-[#4D2D27] h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-[#C86446] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(proteinPercent, 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-[#C86446]/90 dark:text-[#F09A82]/90 mt-2 block">
              Cơ bắp · Phục hồi
            </span>
          </div>

          {/* Pillar 2: Chất xơ (Fiber) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#EBF3EE] dark:bg-[#17261E] border border-[#C8DFCC] dark:border-[#2B4636] flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 text-xs mb-1">
              <span className="font-bold text-[#3D5C4E] dark:text-[#8FC2A6] truncate">Chất xơ</span>
              <span className="font-mono tabular-nums text-[11px] font-semibold text-[#3D5C4E] dark:text-[#8FC2A6] shrink-0">
                {fiberPercent}%
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 my-0.5">
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#243B30] dark:text-[#E8EDE9]">
                {roundInt(totalFiber)}g
              </span>
              <span className="text-xs text-[#7A8B7F] font-mono whitespace-nowrap">/ 30g</span>
            </div>
            <div className="w-full bg-[#C8DFCC]/80 dark:bg-[#2B4636] h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-[#3D5C4E] dark:bg-[#5F8060] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(fiberPercent, 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-[#3D5C4E] dark:text-[#8FC2A6] mt-2 block">
              Vi sinh · Đường ruột
            </span>
          </div>

          {/* Pillar 3: Tinh bột (Carbs) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FDF8EE] dark:bg-[#292114] border border-[#EFDCAD] dark:border-[#4A3B22] flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 text-xs mb-1">
              <span className="font-bold text-[#DDA15E] dark:text-[#EBB97B] truncate">Tinh bột</span>
              <span className="font-mono tabular-nums text-[11px] font-semibold text-[#DDA15E] dark:text-[#EBB97B] shrink-0">
                {carbsPercent}%
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 my-0.5">
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#243B30] dark:text-[#E8EDE9]">
                {roundInt(totalCarbs)}g
              </span>
              <span className="text-xs text-[#7A8B7F] font-mono whitespace-nowrap">/ {roundInt(targetCarbs)}g</span>
            </div>
            <div className="w-full bg-[#EFDCAD]/70 dark:bg-[#4A3B22] h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-[#DDA15E] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(carbsPercent, 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-[#B87B28] dark:text-[#EBB97B] mt-2 block">
              Năng lượng · Bền bỉ
            </span>
          </div>

          {/* Pillar 4: Chất béo (Fat) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F4F7EE] dark:bg-[#1E2517] border border-[#CFDDB0] dark:border-[#39472B] flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 text-xs mb-1">
              <span className="font-bold text-[#7A8B58] dark:text-[#A9BE7E] truncate">Chất béo</span>
              <span className="font-mono tabular-nums text-[11px] font-semibold text-[#7A8B58] dark:text-[#A9BE7E] shrink-0">
                {fatPercent}%
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 my-0.5">
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#243B30] dark:text-[#E8EDE9]">
                {roundInt(totalFat)}g
              </span>
              <span className="text-xs text-[#7A8B7F] font-mono whitespace-nowrap">/ {roundInt(targetFat)}g</span>
            </div>
            <div className="w-full bg-[#CFDDB0]/70 dark:bg-[#39472B] h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-[#7A8B58] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(fatPercent, 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-[#7A8B58] dark:text-[#A9BE7E] mt-2 block">
              Vitamin · Tim mạch
            </span>
          </div>
        </div>

        {/* Family Assistant Tools Strip: Weekly Meal Planner & Head-to-Head Supermarket Comparison */}
        {(onOpenMealPlanner || onOpenProductCompare) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {onOpenMealPlanner && (
              <button
                type="button"
                onClick={onOpenMealPlanner}
                className="p-3.5 rounded-2xl bg-[#EBF3EE] dark:bg-[#17261E] border border-[#C8DFCC] dark:border-[#2B4636] hover:border-[#3D5C4E] text-left flex items-center justify-between gap-3 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#3D5C4E] text-white flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-[#243B30] dark:text-[#E8EDE9] block truncate">
                      Lập thực đơn AI 7 ngày
                    </span>
                    <span className="text-[11px] text-[#3D5C4E] dark:text-[#8FC2A6] block truncate">
                      Món Việt chuẩn vị + Danh sách đi chợ
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#3D5C4E] dark:text-[#8FC2A6] shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {onOpenProductCompare && (
              <button
                type="button"
                onClick={onOpenProductCompare}
                className="p-3.5 rounded-2xl bg-[#FFF5F3] dark:bg-[#2A1B18] border border-[#FDDBD4] dark:border-[#4D2D27] hover:border-[#C86446] text-left flex items-center justify-between gap-3 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#C86446] text-white flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-[#243B30] dark:text-[#E8EDE9] block truncate">
                      Soi & So sánh siêu thị
                    </span>
                    <span className="text-[11px] text-[#C86446] dark:text-[#F09A82] block truncate">
                      Đặt 2 sản phẩm lên bàn cân A vs B
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#C86446] dark:text-[#F09A82] shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        )}

        {/* Artisanal Hydration Ritual */}
        <div className="pt-5 border-t border-[#F0EBE1] dark:border-[#242D26] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#EBF3EE] dark:bg-[#1B2921] flex items-center justify-center text-[#3D5C4E] dark:text-[#8FA89B] shrink-0">
              <Droplet className="w-5 h-5 fill-[#3D5C4E]/20" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-sm font-semibold text-[#243B30] dark:text-[#E8EDE9]">Thói quen uống nước</span>
                <span className="text-xs font-mono tabular-nums text-[#7A8B7F]">
                  {roundedWaterMl} / {targetWaterMl} ml ({waterPercent}%)
                </span>
              </div>
              <div className="w-48 sm:w-64 bg-[#EAE5DC] dark:bg-[#232B25] h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-[#3D5C4E] dark:bg-[#5F8060] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(waterPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onAddWater(250)}
              className="px-3.5 py-1.5 text-xs font-medium text-[#243B30] dark:text-[#E8EDE9] bg-[#FAF7F2] dark:bg-[#151916] hover:bg-[#F2ECE1] dark:hover:bg-[#232B25] rounded-full border border-[#EAE5DC] dark:border-[#27302A] transition-colors whitespace-nowrap"
            >
              +250 ml (1 ly)
            </button>
            <button
              onClick={() => onAddWater(500)}
              className="px-3.5 py-1.5 text-xs font-medium text-[#243B30] dark:text-[#E8EDE9] bg-[#FAF7F2] dark:bg-[#151916] hover:bg-[#F2ECE1] dark:hover:bg-[#232B25] rounded-full border border-[#EAE5DC] dark:border-[#27302A] transition-colors whitespace-nowrap"
            >
              +500 ml (1 chai)
            </button>
            {waterMl > 0 && (
              <button
                onClick={onResetWater}
                className="px-2.5 py-1.5 text-xs font-medium text-[#7A8B7F] hover:text-[#C86446] transition-colors whitespace-nowrap"
                title="Đặt lại lượng nước"
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Nutri-Rank & Wellness Badges System */}
      <NutriRankCard
        rankInfo={nutriRankInfo}
        onOpenDetails={onOpenNutriRank || (() => {})}
      />

      {/* 3. Recharts 7-Day Calorie & Macro Trend Chart (Artisanal Botanical Aesthetic) */}
      <WeeklyCalorieTrendChart
        currentLogs={logs}
        profile={profile}
      />

      {/* 3. Highlight: Tủ Gia Vị & Nhãn Phụ Gia Đã Soi */}
      {recentLabels.length > 0 && (
        <section className="bg-white dark:bg-[#1A201C] rounded-[28px] p-6 border border-[#EAE5DC] dark:border-[#27302A]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#C86446]" />
              <h2 className="font-editorial text-xl italic font-normal text-[#243B30] dark:text-[#E8EDE9]">
                Gia vị & thực phẩm đóng gói vừa soi
              </h2>
            </div>
            <button
              onClick={onOpenLabelScan}
              className="text-xs font-medium text-[#3D5C4E] dark:text-[#8FA89B] hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              Soi thêm sản phẩm <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentLabels.slice(0, 3).map((lbl, idx) => (
              <div
                key={idx}
                className="bg-[#FAF7F2] dark:bg-[#151916] p-4 rounded-2xl border border-[#EAE5DC] dark:border-[#27302A] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                    <span className="text-[#7A8B7F] truncate">{lbl.category}</span>
                    <span
                      className={`font-semibold ${
                        lbl.verdict === 'BUY'
                          ? 'text-[#3D5C4E] dark:text-[#8FA89B]'
                          : lbl.verdict === 'PASS'
                          ? 'text-[#C86446]'
                          : 'text-[#DDA15E]'
                      }`}
                    >
                      {lbl.verdict === 'BUY' ? 'Thuần tự nhiên' : lbl.verdict === 'PASS' ? 'Nên tránh' : 'Cân nhắc'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#243B30] dark:text-[#E8EDE9] line-clamp-1">
                    {lbl.productName}
                  </h3>
                  <p className="text-xs text-[#6A786E] dark:text-[#9DAEA3] line-clamp-2 mt-1">
                    {lbl.verdictHeadline}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#EAE5DC] dark:border-[#27302A] flex items-center justify-between text-xs text-[#7A8B7F]">
                  <span>Độ sạch: <strong className="font-mono text-[#243B30] dark:text-[#E8EDE9]">{roundInt(lbl.cleanScore)}/100</strong></span>
                  <span>Phụ gia: <strong className="font-mono text-[#243B30] dark:text-[#E8EDE9]">{lbl.additives.length} chất</strong></span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Meals Timeline: Nhật Ký Bữa Ăn Trong Ngày */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-editorial text-2xl italic font-normal tracking-tight text-[#243B30] dark:text-[#E8EDE9]">
              Bữa ăn trong ngày
            </h2>
            <p className="text-xs text-[#7A8B7F] mt-0.5">Mỗi đĩa ăn là một nguồn nuôi dưỡng lành mạnh</p>
          </div>
          <span className="text-xs text-[#7A8B7F] font-mono tabular-nums">
            {logs.length} món đã lưu
          </span>
        </div>

        <div className="space-y-4">
          {mealSections.map((sec) => {
            const sectionLogs = logs.filter((l) => l.mealType === sec.type);
            const secCal = roundInt(sectionLogs.reduce((acc, m) => acc + (Number(m.calories) || 0), 0));

            return (
              <div
                key={sec.type}
                className="bg-white dark:bg-[#1A201C] rounded-[24px] border border-[#EAE5DC] dark:border-[#27302A] overflow-hidden shadow-xs"
              >
                {/* Header of Section */}
                <div className="flex items-center justify-between px-5 py-4 bg-[#FAF7F2]/80 dark:bg-[#151916]/80 border-b border-[#F0EBE1] dark:border-[#242D26]">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{sec.icon}</span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#243B30] dark:text-[#E8EDE9]">
                        {sec.label}
                      </h3>
                      <span className="text-xs text-[#7A8B7F]">{sec.timeHint}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#243B30] dark:text-[#E8EDE9] font-mono tabular-nums">
                      {secCal} <span className="text-xs font-normal text-[#7A8B7F]">kcal</span>
                    </span>
                    <button
                      onClick={() => onOpenMealScan(sec.type)}
                      className="p-1.5 text-[#3D5C4E] dark:text-[#8FA89B] hover:bg-[#EAE5DC] dark:hover:bg-[#232B25] rounded-full transition-colors"
                      title={`Thêm vào ${sec.label}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Section Items */}
                {sectionLogs.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-xs text-[#7A8B7F]">
                      Chưa ghi nhận món ăn nào trong bữa này.
                    </p>
                    <button
                      onClick={() => onOpenMealScan(sec.type)}
                      className="mt-2 text-xs font-medium text-[#3D5C4E] dark:text-[#8FA89B] hover:underline inline-flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Chụp hoặc thêm món ăn ngay
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F0EBE1] dark:divide-[#242D26]">
                    {sectionLogs.map((item) => {
                      const isExpanded = expandedMealId === item.id;
                      return (
                        <div key={item.id} className="p-4 sm:p-5 transition-colors hover:bg-[#FAF7F2]/50 dark:hover:bg-[#151916]/50">
                          <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <MealThumbnail src={item.imageUrl} alt={item.vietnameseName} />

                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm sm:text-base font-bold text-[#243B30] dark:text-[#E8EDE9] line-clamp-1">
                                  {item.vietnameseName}
                                </h4>
                                <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs text-[#7A8B7F] mt-0.5 overflow-x-auto scrollbar-hide whitespace-nowrap">
                                  <span className="shrink-0">{roundInt(item.estimatedTotalGrams)}g</span>
                                  <span className="shrink-0" aria-hidden="true">·</span>
                                  <span className="shrink-0 text-[#C86446] font-mono tabular-nums">{roundInt(item.protein)}g đạm</span>
                                  <span className="shrink-0" aria-hidden="true">·</span>
                                  <span className="shrink-0 text-[#DDA15E] font-mono tabular-nums">{roundInt(item.carbs)}g carb</span>
                                  <span className="shrink-0" aria-hidden="true">·</span>
                                  <span className="shrink-0 text-[#7A8B58] font-mono tabular-nums">{roundInt(item.fat)}g béo</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                              <span className="text-sm sm:text-base font-bold text-[#243B30] dark:text-[#E8EDE9] font-mono tabular-nums whitespace-nowrap">
                                {roundInt(item.calories)} <span className="text-xs font-normal text-[#7A8B7F]">kcal</span>
                              </span>

                              <button
                                onClick={() => setExpandedMealId(isExpanded ? null : item.id)}
                                className="p-1.5 text-[#7A8B7F] hover:text-[#243B30] dark:hover:text-[#FAF7F2] rounded-lg transition-colors"
                                title="Xem chi tiết thành phần"
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>

                              <button
                                onClick={() => onDeleteMeal(item.id)}
                                className="p-1.5 text-[#7A8B7F] hover:text-[#C86446] rounded-lg transition-colors"
                                title="Xóa món này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Ingredient Decomposition */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-[#F0EBE1] dark:border-[#242D26] text-xs space-y-3">
                              <p className="text-[#6A786E] dark:text-[#9DAEA3] italic">
                                "{item.healthSummary}"
                              </p>

                              <div className="bg-[#FAF7F2] dark:bg-[#151916] rounded-2xl p-3.5 border border-[#EAE5DC] dark:border-[#27302A]">
                                <span className="font-semibold text-[#243B30] dark:text-[#E8EDE9] block mb-2">
                                  Bóc tách từng thành phần tự nhiên:
                                </span>
                                <div className="space-y-2 sm:space-y-1.5">
                                  {item.ingredients.map((ing, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 text-[#6A786E] dark:text-[#9DAEA3]">
                                      <span>• {ing.name} ({roundInt(ing.weightGrams)}g)</span>
                                      <span className="font-mono tabular-nums text-[11px] sm:text-xs">
                                        {roundInt(ing.calories)} kcal (Đạm: {roundInt(ing.protein)}g · Carb: {roundInt(ing.carbs)}g · Béo: {roundInt(ing.fat)}g)
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {item.advice && (
                                <div className="text-[#3D5C4E] dark:text-[#8FA89B] bg-[#F2F5F2] dark:bg-[#18231D] p-3 rounded-xl border border-[#D8E2D8] dark:border-[#25362B]">
                                  <strong>Gợi ý dinh dưỡng:</strong> {item.advice}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
