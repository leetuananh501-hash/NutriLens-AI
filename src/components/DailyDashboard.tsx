import React, { useState } from 'react';
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
  HardDrive
} from 'lucide-react';
import { MealLogEntry, UserNutritionProfile, MealType, ProductLabelAnalysis } from '../types';
import { WeeklyCalorieTrendChart } from './WeeklyCalorieTrendChart';
import { NutriRankCard } from './NutriRankCard';
import { calculateNutriRank } from '../services/nutriRankService';

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
  recentLabels: ProductLabelAnalysis[];
  isOnline?: boolean;
  isSyncing?: boolean;
  pendingCount?: number;
  onSyncNow?: () => void;
}

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
  recentLabels,
  isOnline = true,
  isSyncing = false,
  pendingCount = 0,
  onSyncNow,
}) => {
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

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

  // Compute daily totals
  const totalCalories = logs.reduce((acc, item) => acc + item.calories, 0);
  const totalProtein = logs.reduce((acc, item) => acc + item.protein, 0);
  const totalCarbs = logs.reduce((acc, item) => acc + item.carbs, 0);
  const totalFat = logs.reduce((acc, item) => acc + item.fat, 0);
  const totalFiber = logs.reduce((acc, item) => acc + (item.fiber || 0), 0);

  const caloriesRemaining = profile.targetCalories - totalCalories;
  const calPercent = Math.min(Math.round((totalCalories / profile.targetCalories) * 100), 100);
  const proteinPercent = Math.min(Math.round((totalProtein / profile.targetProtein) * 100), 100);
  const carbsPercent = Math.min(Math.round((totalCarbs / profile.targetCarbs) * 100), 100);
  const fatPercent = Math.min(Math.round((totalFat / profile.targetFat) * 100), 100);
  const waterPercent = Math.min(Math.round((waterMl / profile.targetWaterMl) * 100), 100);

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
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 text-xs flex items-center gap-1.5 transition-all"
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
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-2 border-b border-[#F0EBE1] dark:border-[#242D26] -mx-1 px-1">
          {weekDays.map((item) => (
            <button
              key={item.offset}
              onClick={() => setSelectedDayOffset(item.offset)}
              className={`flex-1 min-w-[44px] py-2.5 px-2 rounded-2xl flex flex-col items-center justify-center transition-all ${
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

        {/* Editorial Greeting Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-2 border-b border-[#F0EBE1] dark:border-[#242D26]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#7A8B7F] dark:text-[#8E9F93]">
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
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenMealScan()}
              className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#FAF7F2] bg-[#3D5C4E] hover:bg-[#2D473B] rounded-full transition-all shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>Chụp bữa ăn</span>
            </button>
            <button
              onClick={onOpenLabelScan}
              className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#C86446] bg-[#FBEFEA] dark:bg-[#2D1F1A] hover:bg-[#F6E1D7] dark:hover:bg-[#3B2822] rounded-full transition-all border border-[#F1D5C9] dark:border-[#4B3026]"
            >
              <ShieldAlert className="w-4 h-4 text-[#C86446]" />
              <span>Soi nhãn thực phẩm</span>
            </button>
          </div>
        </div>

        {/* Deliciously Ella Circular Nourishment Hub & 4 Botanical Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Central Radial Gauge Card (4 cols) */}
          <div className="lg:col-span-5 p-6 rounded-[28px] bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] flex flex-col items-center text-center justify-center relative overflow-hidden">
            {/* SVG Circular Progress Ring */}
            <div className="relative w-44 h-44 flex items-center justify-center my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className="stroke-[#EAE5DC] dark:stroke-[#232B25]"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Active Gradient Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className="stroke-[#3D5C4E] dark:stroke-[#5F8060] transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 * (1 - Math.min(calPercent, 100) / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              {/* Inner Center Metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] uppercase tracking-wider text-[#7A8B7F] dark:text-[#8E9F93] font-medium">
                  {caloriesRemaining >= 0 ? 'Còn lại' : 'Vượt mức'}
                </span>
                <span className="text-3xl font-extrabold font-mono tabular-nums text-[#243B30] dark:text-[#E8EDE9] mt-0.5">
                  {Math.abs(caloriesRemaining).toLocaleString()}
                </span>
                <span className="text-[11px] text-[#7A8B7F] font-mono">/ {profile.targetCalories.toLocaleString()} kcal</span>
              </div>
            </div>

            <div className="mt-2 text-center">
              <p className="text-xs font-medium text-[#243B30] dark:text-[#E8EDE9]">
                {caloriesRemaining >= 0 
                  ? 'Cơ thể đang ở nhịp độ năng lượng hoàn hảo' 
                  : 'Năng lượng dư dả cho các hoạt động thể thao tối nay'}
              </p>
              <div className="flex items-center justify-center gap-2 text-[11px] text-[#7A8B7F] dark:text-[#8E9F93] mt-1">
                <span>Đã nạp {totalCalories.toLocaleString()} kcal</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{calPercent}% mục tiêu</span>
              </div>
            </div>
          </div>

          {/* 4 Botanical Macro Pillars (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-3.5">
            {/* Pillar 1: Đạm (Protein) - Terracotta */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#7A8B7F] mb-1">
                <span className="font-medium text-[#C86446] dark:text-[#E89279]">Đạm thực dưỡng</span>
                <span className="font-mono tabular-nums text-[11px]">{proteinPercent}%</span>
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-[#243B30] dark:text-[#E8EDE9]">
                  {totalProtein}
                </span>
                <span className="text-xs text-[#7A8B7F] font-mono">/ {profile.targetProtein}g</span>
              </div>
              <div className="w-full bg-[#EAE5DC] dark:bg-[#232B25] h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-[#C86446] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(proteinPercent, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#7A8B7F] mt-2 block">Cơ bắp & tái tạo tế bào</span>
            </div>

            {/* Pillar 2: Chất Xơ (Fiber) - Forest Sage (Deliciously Ella's Star) */}
            <div className="p-4 rounded-2xl bg-[#F4F7F4] dark:bg-[#161F1A] border border-[#D8E2D8] dark:border-[#26372D] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#7A8B7F] mb-1">
                <span className="font-medium text-[#3D5C4E] dark:text-[#8FA89B]">Chất xơ tự nhiên</span>
                <span className="font-mono tabular-nums text-[11px] font-bold text-[#3D5C4E] dark:text-[#8FA89B]">
                  {Math.round((totalFiber / 30) * 100)}%
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-[#243B30] dark:text-[#E8EDE9]">
                  {totalFiber}
                </span>
                <span className="text-xs text-[#7A8B7F] font-mono">/ 30g chuẩn</span>
              </div>
              <div className="w-full bg-[#D8E2D8] dark:bg-[#232B25] h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-[#3D5C4E] dark:bg-[#5F8060] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((totalFiber / 30) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#3D5C4E] dark:text-[#8FA89B] mt-2 block font-medium">Hệ vi sinh & đường ruột</span>
            </div>

            {/* Pillar 3: Tinh Bột Chậm (Carbs) - Honey */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#7A8B7F] mb-1">
                <span className="font-medium text-[#DDA15E]">Tinh bột phức hợp</span>
                <span className="font-mono tabular-nums text-[11px]">{carbsPercent}%</span>
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-[#243B30] dark:text-[#E8EDE9]">
                  {totalCarbs}
                </span>
                <span className="text-xs text-[#7A8B7F] font-mono">/ {profile.targetCarbs}g</span>
              </div>
              <div className="w-full bg-[#EAE5DC] dark:bg-[#232B25] h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-[#DDA15E] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(carbsPercent, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#7A8B7F] mt-2 block">Năng lượng bền bỉ cả ngày</span>
            </div>

            {/* Pillar 4: Chất Béo Lành Mạnh (Fats) - Warm Olive */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#7A8B7F] mb-1">
                <span className="font-medium text-[#7A8B58]">Chất béo thực vật</span>
                <span className="font-mono tabular-nums text-[11px]">{fatPercent}%</span>
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-[#243B30] dark:text-[#E8EDE9]">
                  {totalFat}
                </span>
                <span className="text-xs text-[#7A8B7F] font-mono">/ {profile.targetFat}g</span>
              </div>
              <div className="w-full bg-[#EAE5DC] dark:bg-[#232B25] h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-[#7A8B58] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(fatPercent, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#7A8B7F] mt-2 block">Hấp thu vitamin A, D, E, K</span>
            </div>
          </div>
        </div>

        {/* Artisanal Hydration Ritual */}
        <div className="pt-5 border-t border-[#F0EBE1] dark:border-[#242D26] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#EBF3EE] dark:bg-[#1B2921] flex items-center justify-center text-[#3D5C4E] dark:text-[#8FA89B] shrink-0">
              <Droplet className="w-5 h-5 fill-[#3D5C4E]/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#243B30] dark:text-[#E8EDE9]">Thói quen uống nước</span>
                <span className="text-xs font-mono tabular-nums text-[#7A8B7F]">
                  {waterMl} / {profile.targetWaterMl} ml ({waterPercent}%)
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddWater(250)}
              className="px-3.5 py-1.5 text-xs font-medium text-[#243B30] dark:text-[#E8EDE9] bg-[#FAF7F2] dark:bg-[#151916] hover:bg-[#F2ECE1] dark:hover:bg-[#232B25] rounded-full border border-[#EAE5DC] dark:border-[#27302A] transition-colors"
            >
              +250 ml (1 ly)
            </button>
            <button
              onClick={() => onAddWater(500)}
              className="px-3.5 py-1.5 text-xs font-medium text-[#243B30] dark:text-[#E8EDE9] bg-[#FAF7F2] dark:bg-[#151916] hover:bg-[#F2ECE1] dark:hover:bg-[#232B25] rounded-full border border-[#EAE5DC] dark:border-[#27302A] transition-colors"
            >
              +500 ml (1 chai)
            </button>
            {waterMl > 0 && (
              <button
                onClick={onResetWater}
                className="px-2.5 py-1.5 text-xs font-medium text-[#7A8B7F] hover:text-[#C86446] transition-colors"
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
              className="text-xs font-medium text-[#3D5C4E] dark:text-[#8FA89B] hover:underline flex items-center gap-1"
            >
              Soi thêm sản phẩm <ArrowUpRight className="w-3.5 h-3.5" />
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
                  <span>Độ sạch: <strong className="font-mono text-[#243B30] dark:text-[#E8EDE9]">{lbl.cleanScore}/100</strong></span>
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
            const secCal = sectionLogs.reduce((acc, m) => acc + m.calories, 0);

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
                          <div className="flex items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.vietnameseName}
                                  referrerPolicy="no-referrer"
                                  className="w-14 h-14 rounded-2xl object-cover border border-[#EAE5DC] dark:border-[#27302A] shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] flex items-center justify-center text-[#3D5C4E] shrink-0">
                                  <Sparkles className="w-5 h-5" />
                                </div>
                              )}

                              <div>
                                <h4 className="text-sm sm:text-base font-bold text-[#243B30] dark:text-[#E8EDE9]">
                                  {item.vietnameseName}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-[#7A8B7F] mt-0.5">
                                  <span>{item.estimatedTotalGrams}g</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-[#C86446] font-mono tabular-nums">{item.protein}g đạm</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-[#DDA15E] font-mono tabular-nums">{item.carbs}g carb</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-[#7A8B58] font-mono tabular-nums">{item.fat}g béo</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-base font-bold text-[#243B30] dark:text-[#E8EDE9] font-mono tabular-nums">
                                {item.calories} <span className="text-xs font-normal text-[#7A8B7F]">kcal</span>
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
                                <div className="space-y-1.5">
                                  {item.ingredients.map((ing, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[#6A786E] dark:text-[#9DAEA3]">
                                      <span>• {ing.name} ({ing.weightGrams}g)</span>
                                      <span className="font-mono tabular-nums">
                                        {ing.calories} kcal (Đạm: {ing.protein}g · Carb: {ing.carbs}g · Béo: {ing.fat}g)
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
