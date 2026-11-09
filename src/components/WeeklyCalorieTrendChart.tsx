import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Flame, TrendingDown, Award, Sparkles, Calendar, Layers } from 'lucide-react';
import { MealLogEntry, UserNutritionProfile } from '../types';

interface WeeklyCalorieTrendChartProps {
  currentLogs: MealLogEntry[];
  profile: UserNutritionProfile;
}

interface DayData {
  dayLabel: string;
  shortDate: string;
  fullDate: string;
  calories: number;
  target: number;
  protein: number;
  carbs: number;
  fat: number;
  isToday: boolean;
}

export const WeeklyCalorieTrendChart: React.FC<WeeklyCalorieTrendChartProps> = ({
  currentLogs,
  profile,
}) => {
  const [chartMode, setChartMode] = useState<'calories' | 'macros'>('calories');

  // Compute today's total from actual meal logs
  const todayCalories = currentLogs.reduce((acc, m) => acc + m.calories, 0);
  const todayProtein = currentLogs.reduce((acc, m) => acc + m.protein, 0);
  const todayCarbs = currentLogs.reduce((acc, m) => acc + m.carbs, 0);
  const todayFat = currentLogs.reduce((acc, m) => acc + m.fat, 0);

  // Generate 7 days ending with today
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const fullDayNames = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];

  const now = new Date();
  const past6DaysSimulated = [
    { calOffset: -180, p: 128, c: 205, f: 54 },
    { calOffset: +50, p: 135, c: 228, f: 62 },
    { calOffset: -240, p: 122, c: 190, f: 51 },
    { calOffset: -110, p: 130, c: 215, f: 56 },
    { calOffset: -300, p: 140, c: 180, f: 49 },
    { calOffset: +80, p: 125, c: 235, f: 64 },
  ];

  const weeklyData: DayData[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dayOfWeek = d.getDay();
    const isToday = i === 0;

    let cal = profile.targetCalories;
    let prot = profile.targetProtein;
    let carb = profile.targetCarbs;
    let fat = profile.targetFat;

    if (isToday) {
      cal = todayCalories > 0 ? todayCalories : Math.round(profile.targetCalories * 0.72);
      prot = todayProtein > 0 ? todayProtein : Math.round(profile.targetProtein * 0.75);
      carb = todayCarbs > 0 ? todayCarbs : Math.round(profile.targetCarbs * 0.7);
      fat = todayFat > 0 ? todayFat : Math.round(profile.targetFat * 0.75);
    } else {
      const sim = past6DaysSimulated[6 - i];
      cal = profile.targetCalories + sim.calOffset;
      prot = sim.p;
      carb = sim.c;
      fat = sim.f;
    }

    weeklyData.push({
      dayLabel: dayNames[dayOfWeek],
      shortDate: `${d.getDate()}/${d.getMonth() + 1}`,
      fullDate: `${fullDayNames[dayOfWeek]}, ${d.getDate()}/${d.getMonth() + 1}`,
      calories: Math.round(cal),
      target: profile.targetCalories,
      protein: Math.round(prot),
      carbs: Math.round(carb),
      fat: Math.round(fat),
      isToday,
    });
  }

  // Calculate statistics
  const totalCalWeek = weeklyData.reduce((acc, d) => acc + d.calories, 0);
  const avgCalDay = Math.round(totalCalWeek / 7);
  const daysOnTarget = weeklyData.filter(
    (d) => Math.abs(d.calories - d.target) <= 150 || d.calories <= d.target
  ).length;
  const netWeeklyDeficit = profile.targetCalories * 7 - totalCalWeek;

  // Custom luxury tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayData = payload[0].payload;
      const diff = data.calories - data.target;

      return (
        <div className="bg-slate-950/95 dark:bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[210px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200">{data.fullDate}</span>
            {data.isToday && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                Hôm nay
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Năng lượng nạp:</span>
              <strong className="font-mono tabular-nums text-white text-sm">
                {data.calories.toLocaleString()} <span className="text-xs font-normal text-slate-400">kcal</span>
              </strong>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Mục tiêu:</span>
              <span className="font-mono text-slate-300">{data.target} kcal</span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400">Chênh lệch:</span>
              <span
                className={`font-mono font-bold ${
                  diff <= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {diff <= 0 ? `Thâm hụt ${Math.abs(diff)} kcal` : `Vượt ${diff} kcal`}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#27302A] grid grid-cols-3 gap-1 text-[10px] text-center font-mono">
            <div className="bg-[#2D1F1A] p-1 rounded text-[#E89279]">
              <span className="block text-[9px] text-[#C86446]">Đạm</span>
              {data.protein}g
            </div>
            <div className="bg-[#2A2319] p-1 rounded text-[#DDA15E]">
              <span className="block text-[9px] text-[#DDA15E]/80">Carb</span>
              {data.carbs}g
            </div>
            <div className="bg-[#1F271B] p-1 rounded text-[#B4C099]">
              <span className="block text-[9px] text-[#7A8B58]">Béo</span>
              {data.fat}g
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#1A201C] rounded-[28px] p-5 sm:p-7 border border-[#EAE5DC] dark:border-[#27302A] shadow-xs transition-all space-y-6">
      {/* 1. Header: Title, Luxury Aura, and View Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#3D5C4E] dark:text-[#8FA89B] font-semibold mb-1">
            <Sparkles className="w-4 h-4 text-[#3D5C4E]" />
            <span>Xu hướng dinh dưỡng 7 ngày qua</span>
            <span aria-hidden="true" className="text-[#D8E2D8] dark:text-[#27302A]">·</span>
            <span className="text-[#7A8B7F]">Nhịp độ tuần</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl italic font-normal tracking-tight text-[#243B30] dark:text-[#E8EDE9]">
            Biểu đồ cân bằng Calo
          </h2>
          <p className="text-xs text-[#7A8B7F] mt-0.5">
            Theo dõi tính nhất quán của mục tiêu thâm hụt và năng lượng nuôi dưỡng cơ thể
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#FAF7F2] dark:bg-[#151916] rounded-full border border-[#EAE5DC] dark:border-[#27302A] shrink-0 self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setChartMode('calories')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
              chartMode === 'calories'
                ? 'bg-[#3D5C4E] text-[#FAF7F2] shadow-xs'
                : 'text-[#6A786E] dark:text-[#9DAEA3] hover:text-[#243B30]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#DDA15E]" />
            <span>Đường Calo</span>
          </button>

          <button
            onClick={() => setChartMode('macros')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
              chartMode === 'macros'
                ? 'bg-[#3D5C4E] text-[#FAF7F2] shadow-xs'
                : 'text-[#6A786E] dark:text-[#9DAEA3] hover:text-[#243B30]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#3D5C4E]" />
            <span>Cột Macro</span>
          </button>
        </div>
      </div>

      {/* 2. Three Luxury Summary Micro-KPIs */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A]">
        <div className="text-center sm:text-left">
          <span className="text-[10px] sm:text-xs text-[#7A8B7F] uppercase tracking-wider block font-medium">
            Trung bình ngày
          </span>
          <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-[#243B30] dark:text-[#E8EDE9] mt-0.5">
            {avgCalDay.toLocaleString()}
            <span className="text-[10px] sm:text-xs font-normal text-[#7A8B7F] ml-1">kcal</span>
          </div>
        </div>

        <div className="text-center sm:text-left border-x border-[#EAE5DC] dark:border-[#27302A] px-2 sm:px-4">
          <span className="text-[10px] sm:text-xs text-[#7A8B7F] uppercase tracking-wider block font-medium">
            Thâm hụt ròng tuần
          </span>
          <div
            className={`text-lg sm:text-2xl font-bold font-mono tabular-nums mt-0.5 ${
              netWeeklyDeficit >= 0 ? 'text-[#3D5C4E] dark:text-[#8FA89B]' : 'text-[#C86446]'
            }`}
          >
            {netWeeklyDeficit >= 0 ? `-${netWeeklyDeficit}` : `+${Math.abs(netWeeklyDeficit)}`}
            <span className="text-[10px] sm:text-xs font-normal text-[#7A8B7F] ml-1">kcal</span>
          </div>
        </div>

        <div className="text-center sm:text-left">
          <span className="text-[10px] sm:text-xs text-[#7A8B7F] uppercase tracking-wider block font-medium">
            Tỷ lệ đạt chuẩn
          </span>
          <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-[#3D5C4E] dark:text-[#8FA89B] mt-0.5">
            {daysOnTarget}/7
            <span className="text-[10px] sm:text-xs font-normal text-[#7A8B7F] ml-1">ngày</span>
          </div>
        </div>
      </div>

      {/* 3. Recharts Interactive Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'calories' ? (
            <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sageCalorieGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3D5C4E" stopOpacity={0.4} />
                  <stop offset="60%" stopColor="#3D5C4E" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#3D5C4E" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#EAE5DC"
                strokeOpacity={0.8}
              />

              <XAxis
                dataKey="dayLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#7A8B7F', fontWeight: 600 }}
                dy={6}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 300', 'dataMax + 200']}
                tick={{ fontSize: 10, fill: '#7A8B7F', fontFamily: 'monospace' }}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Gold/Warm Reference line for Daily Target */}
              <ReferenceLine
                y={profile.targetCalories}
                stroke="#C86446"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Mục tiêu: ${profile.targetCalories}`,
                  fill: '#C86446',
                  fontSize: 10,
                  position: 'insideTopRight',
                  fontWeight: 600,
                }}
              />

              <Area
                type="monotone"
                dataKey="calories"
                stroke="#3D5C4E"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#sageCalorieGlow)"
                dot={{ r: 4, fill: '#3D5C4E', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, fill: '#243B30', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#EAE5DC"
                strokeOpacity={0.8}
              />

              <XAxis
                dataKey="dayLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#7A8B7F', fontWeight: 600 }}
                dy={6}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#7A8B7F', fontFamily: 'monospace' }}
              />

              <Tooltip content={<CustomTooltip />} />

              <Bar dataKey="protein" stackId="macros" fill="#C86446" radius={[0, 0, 0, 0]} name="Đạm (g)" />
              <Bar dataKey="carbs" stackId="macros" fill="#DDA15E" radius={[0, 0, 0, 0]} name="Carb (g)" />
              <Bar dataKey="fat" stackId="macros" fill="#7A8B58" radius={[4, 4, 0, 0]} name="Béo (g)" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* 4. Luxury Insight Banner */}
      <div className="pt-2 border-t border-[#F0EBE1] dark:border-[#242D26] flex items-center justify-between text-xs text-[#7A8B7F]">
        <div className="flex items-center gap-2">
          <span className="italic">
            {netWeeklyDeficit >= 0
              ? 'Thâm hụt tuần này tương đương giảm ~0.12kg mỡ thừa. Bạn đang duy trì phong độ rất xuất sắc.'
              : 'Năng lượng tuần này đang ở mức thặng dư nhẹ, rất thuận lợi cho việc phục hồi và phát triển cơ bắp.'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] shrink-0">
          <span className="flex items-center gap-1 text-[#C86446]">
            <span className="w-2 h-2 rounded-full bg-[#C86446] inline-block" /> Đạm
          </span>
          <span className="flex items-center gap-1 text-[#DDA15E]">
            <span className="w-2 h-2 rounded-full bg-[#DDA15E] inline-block" /> Carbs
          </span>
          <span className="flex items-center gap-1 text-[#7A8B58]">
            <span className="w-2 h-2 rounded-full bg-[#7A8B58] inline-block" /> Chất béo
          </span>
        </div>
      </div>
    </div>
  );
};
