import React, { useEffect, useState } from 'react';
import {
  X,
  CalendarDays,
  ShoppingCart,
  Sparkles,
  Check,
  RefreshCw,
  Utensils,
  Flame,
  Plus,
  RotateCcw,
} from 'lucide-react';
import {
  GroceryItem,
  PlannerGoalMode,
  UserNutritionProfile,
  WeeklyMealPlan,
} from '../types';
import {
  buildVietnameseWeeklyMealPlan,
  mapDietGoalToPlannerMode,
} from '../services/nutritionPlannerService';
import { roundInt } from '../utils/numberFormat';

interface WeeklyMealPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserNutritionProfile;
}

const PLAN_STORAGE_KEY = 'nutrilens_weekly_plan_v1';

export const WeeklyMealPlannerModal: React.FC<WeeklyMealPlannerModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const defaultMode = mapDietGoalToPlannerMode(profile.dietGoal);

  const [plan, setPlan] = useState<WeeklyMealPlan>(() => {
    try {
      const saved = localStorage.getItem(PLAN_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WeeklyMealPlan;
        if (parsed && Array.isArray(parsed.days) && parsed.days.length === 7) {
          return parsed;
        }
      }
    } catch {
      // ignore corrupted storage
    }
    return buildVietnameseWeeklyMealPlan(defaultMode, profile.targetCalories);
  });

  const [activeView, setActiveView] = useState<'menu' | 'grocery'>('menu');
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [customGroceryName, setCustomGroceryName] = useState<string>('');
  const [customGroceryQty, setCustomGroceryQty] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
    } catch {
      // ignore quota error
    }
  }, [plan]);

  if (!isOpen) return null;

  const currentDay = plan.days[selectedDayIdx] || plan.days[0];
  const checkedCount = plan.groceryList.filter((item) => item.checked).length;
  const totalGroceryCount = plan.groceryList.length;
  const groceryProgressPct =
    totalGroceryCount > 0 ? Math.round((checkedCount / totalGroceryCount) * 100) : 0;

  const handleSelectGoalMode = (mode: PlannerGoalMode) => {
    const newTarget =
      mode === 'lose_weight'
        ? Math.min(profile.targetCalories, 1650)
        : mode === 'gain_muscle'
        ? Math.max(profile.targetCalories, 2400)
        : profile.targetCalories;
    const regenerated = buildVietnameseWeeklyMealPlan(mode, newTarget);
    setPlan(regenerated);
    setSelectedDayIdx(0);
  };

  const handleAiRegenerate = async () => {
    setIsGenerating(true);
    try {
      if (!navigator.onLine) {
        setPlan(buildVietnameseWeeklyMealPlan(plan.goalMode, plan.dailyCalorieTarget));
        return;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 11000);
      const res = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalMode: plan.goalMode,
          targetCalories: plan.dailyCalorieTarget,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const aiPlan = (await res.json()) as WeeklyMealPlan;
        if (aiPlan && Array.isArray(aiPlan.days) && aiPlan.days.length === 7) {
          setPlan(aiPlan);
          setSelectedDayIdx(0);
          return;
        }
      }
      setPlan(buildVietnameseWeeklyMealPlan(plan.goalMode, plan.dailyCalorieTarget));
    } catch {
      setPlan(buildVietnameseWeeklyMealPlan(plan.goalMode, plan.dailyCalorieTarget));
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleGroceryItem = (id: string) => {
    setPlan((prev) => ({
      ...prev,
      groceryList: prev.groceryList.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    }));
  };

  const resetGroceryChecks = () => {
    setPlan((prev) => ({
      ...prev,
      groceryList: prev.groceryList.map((item) => ({ ...item, checked: false })),
    }));
  };

  const handleAddCustomGrocery = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customGroceryName.trim();
    if (!trimmed) return;
    const newItem: GroceryItem = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      quantity: customGroceryQty.trim() || '1 phần',
      category: 'pantry',
      categoryLabel: 'Thêm thủ công',
      checked: false,
    };
    setPlan((prev) => ({
      ...prev,
      groceryList: [newItem, ...prev.groceryList],
    }));
    setCustomGroceryName('');
    setCustomGroceryQty('');
  };

  const goalOptions: Array<{ id: PlannerGoalMode; label: string }> = [
    { id: 'lose_weight', label: 'Giảm mỡ thâm hụt' },
    { id: 'family_clean', label: 'Ăn sạch gia đình' },
    { id: 'gain_muscle', label: 'Nuôi dưỡng cơ bắp' },
  ];

  const groupedCategories: Array<{ key: GroceryItem['category']; label: string }> = [
    { key: 'protein', label: 'Thịt, Cá & Đạm sạch' },
    { key: 'produce', label: 'Rau Củ & Trái Cây' },
    { key: 'grains', label: 'Tinh Bột Chậm' },
    { key: 'pantry', label: 'Gia Vị Sạch & Sữa' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#121614]/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1A201C] rounded-[28px] sm:rounded-[32px] max-w-3xl w-full max-h-[92vh] overflow-y-auto scrollbar-hide border border-[#EAE5DC] dark:border-[#27302A] shadow-2xl p-4 sm:p-7 space-y-5 animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#F0EBE1] dark:border-[#27302A]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#EBF3EE] dark:bg-[#17261E] border border-[#C8DFCC] dark:border-[#2B4636] text-[#3D5C4E] dark:text-[#8FC2A6] flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#3D5C4E] dark:text-[#8FC2A6]">
                <span>AI Meal Planner</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#7A8B7F]">Lưu ngoại tuyến tự động</span>
              </div>
              <h2 className="font-editorial text-xl sm:text-2xl italic font-normal text-[#243B30] dark:text-[#E8EDE9] leading-snug">
                Kế hoạch bữa ăn 7 ngày chuẩn Việt
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng kế hoạch bữa ăn"
            className="w-9 h-9 rounded-full border border-[#EAE5DC] dark:border-[#27302A] flex items-center justify-center text-[#7A8B7F] hover:bg-[#FAF7F2] dark:hover:bg-[#151916] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Goal Mode Selector + AI Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pr-2">
            {goalOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectGoalMode(opt.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 border ${
                  plan.goalMode === opt.id
                    ? 'bg-[#3D5C4E] text-[#FAF7F2] border-[#3D5C4E]'
                    : 'bg-[#FAF7F2] dark:bg-[#151916] text-[#6A786E] dark:text-[#9DAEA3] border-[#EAE5DC] dark:border-[#27302A]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAiRegenerate}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FBEFEA] dark:bg-[#2D1F1A] text-[#C86446] dark:text-[#F09A82] border border-[#F1D5C9] dark:border-[#4B3026] text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'AI đang lên thực đơn...' : 'Làm mới thực đơn AI'}</span>
          </button>
        </div>

        {/* Main Tab Switcher: 7-Day Menu vs Smart Grocery List */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A]">
          <button
            type="button"
            onClick={() => setActiveView('menu')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeView === 'menu'
                ? 'bg-white dark:bg-[#1A201C] text-[#243B30] dark:text-[#E8EDE9] shadow-xs'
                : 'text-[#7A8B7F] hover:text-[#243B30]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 shrink-0" />
            <span>Thực đơn 7 ngày</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('grocery')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeView === 'grocery'
                ? 'bg-white dark:bg-[#1A201C] text-[#243B30] dark:text-[#E8EDE9] shadow-xs'
                : 'text-[#7A8B7F] hover:text-[#243B30]'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
            <span>Đi chợ ({checkedCount}/{totalGroceryCount})</span>
          </button>
        </div>

        {/* VIEW 1: 7-Day Vietnamese Meal Plan */}
        {activeView === 'menu' ? (
          <div className="space-y-4">
            {/* Horizontal Day Pills (Thứ 2 -> CN) */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 pr-2">
              {plan.days.map((day, idx) => (
                <button
                  key={day.dayIndex}
                  type="button"
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`flex-1 min-w-[46px] py-2 px-2.5 rounded-2xl flex flex-col items-center justify-center transition-all shrink-0 border ${
                    selectedDayIdx === idx
                      ? 'bg-[#3D5C4E] text-[#FAF7F2] border-[#3D5C4E] font-bold shadow-xs'
                      : 'bg-[#FAF7F2] dark:bg-[#151916] text-[#6A786E] dark:text-[#9DAEA3] border-[#EAE5DC] dark:border-[#27302A]'
                  }`}
                >
                  <span className="text-xs whitespace-nowrap">{day.shortLabel}</span>
                  <span className="text-[10px] font-mono tabular-nums opacity-80 whitespace-nowrap">
                    {roundInt(day.totalCalories)}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Day Nutrition Summary Strip */}
            <div className="p-3.5 rounded-2xl bg-[#EBF3EE] dark:bg-[#17261E] border border-[#C8DFCC] dark:border-[#2B4636] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#3D5C4E] dark:text-[#8FC2A6] shrink-0" />
                <span className="text-sm font-bold text-[#243B30] dark:text-[#E8EDE9]">
                  {currentDay.dayLabel} · {plan.goalTitle}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono tabular-nums whitespace-nowrap">
                <span className="flex items-center gap-1 font-bold text-[#243B30] dark:text-[#E8EDE9]">
                  <Flame className="w-3.5 h-3.5 text-[#C86446]" />
                  {roundInt(currentDay.totalCalories)} kcal
                </span>
                <span className="text-[#C86446] font-semibold">
                  Đạm {roundInt(currentDay.totalProtein)}g
                </span>
                <span className="text-[#3D5C4E] dark:text-[#8FC2A6] font-semibold">
                  Xơ {roundInt(currentDay.totalFiber)}g
                </span>
              </div>
            </div>

            {/* 4 Meal Slots for Selected Day */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentDay.meals.map((meal) => (
                <div
                  key={`${currentDay.dayIndex}-${meal.slot}`}
                  className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] flex flex-col justify-between space-y-2.5"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-[#3D5C4E] dark:text-[#8FC2A6]">
                        {meal.slotLabel}
                      </span>
                      <span className="font-mono font-bold tabular-nums text-[#243B30] dark:text-[#E8EDE9] whitespace-nowrap">
                        {roundInt(meal.calories)} kcal
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#243B30] dark:text-[#E8EDE9] leading-snug">
                      {meal.dishName}
                    </h4>
                    <p className="text-xs text-[#6A786E] dark:text-[#9DAEA3]">
                      {meal.portionNote}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#EAE5DC] dark:border-[#27302A] flex items-center gap-3 text-[11px] font-mono tabular-nums text-[#7A8B7F] whitespace-nowrap">
                    <span className="text-[#C86446]">Đạm {roundInt(meal.protein)}g</span>
                    <span>·</span>
                    <span className="text-[#3D5C4E] dark:text-[#8FC2A6]">Xơ {roundInt(meal.fiber)}g</span>
                    <span>·</span>
                    <span>Carb {roundInt(meal.carbs)}g</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* VIEW 2: Smart Grocery Checklist */
          <div className="space-y-4">
            {/* Grocery Progress Header */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[#243B30] dark:text-[#E8EDE9]">
                  Tiến độ đi chợ cả tuần ({checkedCount}/{totalGroceryCount} món)
                </span>
                {checkedCount > 0 && (
                  <button
                    type="button"
                    onClick={resetGroceryChecks}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C86446] hover:underline whitespace-nowrap"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Bỏ tick tất cả</span>
                  </button>
                )}
              </div>

              <div className="w-full h-2 rounded-full bg-[#EAE5DC] dark:bg-[#232B25] overflow-hidden">
                <div
                  className="h-full bg-[#3D5C4E] dark:bg-[#5F8060] rounded-full transition-all duration-300"
                  style={{ width: `${groceryProgressPct}%` }}
                />
              </div>
            </div>

            {/* Quick Add Custom Grocery Item */}
            <form onSubmit={handleAddCustomGrocery} className="flex gap-2">
              <input
                type="text"
                value={customGroceryName}
                onChange={(e) => setCustomGroceryName(e.target.value)}
                placeholder="Thêm món cần mua (VD: Chanh tươi, gừng...)"
                className="flex-1 min-w-0 px-3.5 py-2 text-xs rounded-xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] text-[#243B30] dark:text-[#E8EDE9] focus:outline-none focus:ring-2 focus:ring-[#3D5C4E]"
              />
              <input
                type="text"
                value={customGroceryQty}
                onChange={(e) => setCustomGroceryQty(e.target.value)}
                placeholder="SL (VD: 500g)"
                className="w-24 sm:w-28 px-3 py-2 text-xs rounded-xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] text-[#243B30] dark:text-[#E8EDE9] focus:outline-none focus:ring-2 focus:ring-[#3D5C4E]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#3D5C4E] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#2D473B] transition-colors shrink-0 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            </form>

            {/* Categorized Checklist */}
            <div className="space-y-4">
              {groupedCategories.map((cat) => {
                const items = plan.groceryList.filter((g) => g.category === cat.key);
                if (items.length === 0) return null;
                return (
                  <div key={cat.key} className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A8B7F]">
                      {cat.label}
                    </h4>
                    <div className="divide-y divide-[#F0EBE1] dark:divide-[#27302A] rounded-2xl border border-[#EAE5DC] dark:border-[#27302A] overflow-hidden bg-white dark:bg-[#1A201C]">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleGroceryItem(item.id)}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors min-h-[44px] ${
                            item.checked
                              ? 'bg-[#F4F7F4]/60 dark:bg-[#161F1A]/60 opacity-65'
                              : 'hover:bg-[#FAF7F2] dark:hover:bg-[#151916]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                item.checked
                                  ? 'bg-[#3D5C4E] border-[#3D5C4E] text-white'
                                  : 'border-[#D0DAD0] dark:border-[#3A473E] bg-white dark:bg-[#151916]'
                              }`}
                            >
                              {item.checked && <Check className="w-3.5 h-3.5" />}
                            </span>
                            <span
                              className={`text-xs sm:text-sm font-medium truncate ${
                                item.checked
                                  ? 'line-through text-[#7A8B7F]'
                                  : 'text-[#243B30] dark:text-[#E8EDE9]'
                              }`}
                            >
                              {item.name}
                            </span>
                          </div>

                          <span className="text-xs font-mono font-semibold text-[#3D5C4E] dark:text-[#8FC2A6] whitespace-nowrap shrink-0">
                            {item.quantity}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#F0EBE1] dark:border-[#27302A]">
          <span className="text-[11px] text-[#7A8B7F]">
            Đã lưu tự động vào bộ nhớ máy để dùng khi đi chợ ngoại tuyến.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#243B30] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#243B30] text-xs font-bold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
