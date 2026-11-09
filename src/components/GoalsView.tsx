import React, { useState } from 'react';
import { Target, Calculator, Check, Sparkles, Scale, Activity, Flame } from 'lucide-react';
import { UserNutritionProfile } from '../types';

interface GoalsViewProps {
  profile: UserNutritionProfile;
  onUpdateProfile: (newProfile: UserNutritionProfile) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ profile, onUpdateProfile }) => {
  const [gender, setGender] = useState<'male' | 'female'>(profile.gender);
  const [weight, setWeight] = useState<number>(profile.currentWeight);
  const [goalWeight, setGoalWeight] = useState<number>(profile.goalWeight);
  const [height, setHeight] = useState<number>(170);
  const [age, setAge] = useState<number>(26);
  const [activity, setActivity] = useState<'sedentary' | 'light' | 'moderate' | 'active'>(profile.activityLevel);
  const [dietGoal, setDietGoal] = useState<'lose_weight' | 'maintain' | 'gain_muscle'>(profile.dietGoal);
  const [saved, setSaved] = useState(false);

  // Mifflin-St Jeor Formula
  const calculateBMR = () => {
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  };

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };

  const bmr = Math.round(calculateBMR());
  const tdee = Math.round(bmr * activityMultipliers[activity]);

  const calorieDelta = dietGoal === 'lose_weight' ? -450 : dietGoal === 'gain_muscle' ? +350 : 0;
  const targetCalories = Math.max(1200, tdee + calorieDelta);

  // Macro calculation based on goal
  let proteinRatio = dietGoal === 'gain_muscle' ? 2.2 : dietGoal === 'lose_weight' ? 2.0 : 1.6;
  const targetProtein = Math.round(weight * proteinRatio);
  const proteinKcal = targetProtein * 4;

  const targetFat = Math.round((targetCalories * 0.25) / 9);
  const fatKcal = targetFat * 9;

  const remainingKcal = Math.max(0, targetCalories - (proteinKcal + fatKcal));
  const targetCarbs = Math.round(remainingKcal / 4);

  const targetWaterMl = Math.round(weight * 35); // 35ml per kg

  const handleSave = () => {
    onUpdateProfile({
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      targetWaterMl,
      currentWeight: weight,
      goalWeight,
      gender,
      activityLevel: activity,
      dietGoal,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
          <Calculator className="w-4 h-4" />
          <span>Công thức Dinh dưỡng Khoa học Mifflin-St Jeor</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Thiết lập mục tiêu Calo & Dinh dưỡng cá nhân
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          Hệ thống sẽ tự động tính toán chỉ số trao đổi chất cơ bản (BMR), mức tiêu hao năng lượng hàng ngày (TDEE) và phân bổ tỷ lệ Đạm - Tinh bột - Chất béo tối ưu nhất cho mục tiêu của bạn.
        </p>

        {/* Form Inputs */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gender & Age */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Giới tính:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2.5 px-4 text-xs font-bold rounded-xl border transition-all ${
                    gender === 'male'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Nam
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2.5 px-4 text-xs font-bold rounded-xl border transition-all ${
                    gender === 'female'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Nữ
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Tuổi:
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 20)}
                  min={12}
                  max={90}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Chiều cao (cm):
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 160)}
                  min={100}
                  max={230}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Cân nặng hiện tại (kg):
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 50)}
                  min={30}
                  max={200}
                  step={0.5}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Cân nặng mục tiêu (kg):
                </label>
                <input
                  type="number"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(parseFloat(e.target.value) || 50)}
                  min={30}
                  max={200}
                  step={0.5}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Activity & Diet Goal */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Mức độ vận động thể chất:
              </label>
              <div className="space-y-2">
                {[
                  { id: 'sedentary', label: 'Ít vận động (Ngồi văn phòng, không tập)' },
                  { id: 'light', label: 'Vận động nhẹ (Tập nhẹ 1-3 ngày/tuần)' },
                  { id: 'moderate', label: 'Vận động vừa (Tập thể thao 3-5 ngày/tuần)' },
                  { id: 'active', label: 'Rất năng động (Tập nặng 6-7 ngày/tuần)' },
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setActivity(act.id as any)}
                    className={`w-full p-2.5 text-left text-xs font-medium rounded-xl border transition-all ${
                      activity === act.id
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Mục tiêu hình thể:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'lose_weight', label: 'Giảm mỡ (-450 kcal)' },
                  { id: 'maintain', label: 'Giữ dáng (TDEE)' },
                  { id: 'gain_muscle', label: 'Tăng cơ (+350 kcal)' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setDietGoal(g.id as any)}
                    className={`p-2.5 text-center text-xs font-bold rounded-xl border transition-all ${
                      dietGoal === g.id
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Calculated Results Preview */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Kết quả tính toán dinh dưỡng được cá nhân hóa:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 block">BMR (Trao đổi chất nghỉ)</span>
              <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-1 block">
                {bmr} <span className="text-xs font-normal text-slate-500">kcal</span>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 block">TDEE (Tiêu hao ngày)</span>
              <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-1 block">
                {tdee} <span className="text-xs font-normal text-slate-500">kcal</span>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">Mục tiêu Calo nạp</span>
              <span className="text-2xl font-black font-mono tabular-nums text-emerald-700 dark:text-emerald-300 mt-1 block">
                {targetCalories} <span className="text-xs font-normal text-emerald-600">kcal</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F6EDE2] dark:bg-[#251E16] border border-[#EADBCA] dark:border-[#3D3325]">
              <span className="text-xs font-semibold text-[#DDA15E] block">Mục tiêu Nước</span>
              <span className="text-2xl font-bold font-mono tabular-nums text-[#C86446] dark:text-[#E89279] mt-1 block">
                {targetWaterMl} <span className="text-xs font-normal text-[#7A8B7F]">ml</span>
              </span>
            </div>
          </div>

          {/* Macro Distribution */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Phân bổ Macro hàng ngày:
              </span>
              <span className="text-slate-500">
                Protein {targetProtein}g ({Math.round((proteinKcal / targetCalories) * 100)}%) · Carbs {targetCarbs}g ({Math.round(((targetCarbs * 4) / targetCalories) * 100)}%) · Fat {targetFat}g ({Math.round(((targetFat * 9) / targetCalories) * 100)}%)
              </span>
            </div>

            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all ${
                saved ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Đã cập nhật mục tiêu!</span>
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  <span>Lưu & Áp dụng mục tiêu này</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
