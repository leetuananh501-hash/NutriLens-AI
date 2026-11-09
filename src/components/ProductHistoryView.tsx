import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  ExternalLink, 
  FlaskConical, 
  Flame, 
  ChevronRight, 
  X,
  Lightbulb,
  ArrowUpDown,
  Download,
  Wifi,
  WifiOff,
  RefreshCw,
  HardDrive,
  Database
} from 'lucide-react';
import { ProductLabelAnalysis, MealLogEntry } from '../types';
import { calculateNutriRank } from '../services/nutriRankService';
import { NutriRankCard } from './NutriRankCard';

interface ProductHistoryViewProps {
  labelHistory: ProductLabelAnalysis[];
  mealHistory: MealLogEntry[];
  onDeleteLabel: (index: number) => void;
  onDeleteMeal: (id: string) => void;
  onClearAllLabels: () => void;
  onOpenLabelScanner: () => void;
  onOpenMealScanner: () => void;
  onOpenNutriRank?: () => void;
  isOnline?: boolean;
  isSyncing?: boolean;
  pendingCount?: number;
  lastSyncedAt?: string | null;
  onSyncNow?: () => void;
}

export const ProductHistoryView: React.FC<ProductHistoryViewProps> = ({
  labelHistory,
  mealHistory,
  onDeleteLabel,
  onDeleteMeal,
  onClearAllLabels,
  onOpenLabelScanner,
  onOpenMealScanner,
  onOpenNutriRank,
  isOnline = true,
  isSyncing = false,
  pendingCount = 0,
  lastSyncedAt,
  onSyncNow,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'BUY' | 'CONSIDER' | 'PASS' | 'meals'>('all');
  const [selectedLabel, setSelectedLabel] = useState<ProductLabelAnalysis | null>(null);

  const nutriRankInfo = calculateNutriRank(labelHistory, mealHistory);

  // Stats calculation
  const totalLabels = labelHistory.length;
  const buyCount = labelHistory.filter((l) => l.verdict === 'BUY').length;
  const considerCount = labelHistory.filter((l) => l.verdict === 'CONSIDER').length;
  const passCount = labelHistory.filter((l) => l.verdict === 'PASS').length;

  // Filter labels
  const filteredLabels = labelHistory.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brandName && item.brandName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'meals') return false;
    return item.verdict === filterType;
  });

  // Filter meals if applicable
  const filteredMeals = mealHistory.filter((meal) => {
    if (filterType !== 'all' && filterType !== 'meals') return false;
    return (
      meal.vietnameseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meal.dishName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* 1. Header & Summary Stats Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">
              <History className="w-4 h-4" />
              <span>Sổ tay Thẩm định Sản phẩm & Món ăn</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-500">Lưu trữ trên thiết bị của bạn</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Lịch sử các sản phẩm đã tra cứu
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Xem lại danh mục các loại gia vị, thực phẩm đóng gói và món ăn đã được AI thẩm định độ sạch và phân tích phụ gia hóa học.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenLabelScanner}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
            >
              + Soi nhãn mới
            </button>
            {labelHistory.length > 0 && (
              <button
                onClick={onClearAllLabels}
                className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                title="Xóa toàn bộ lịch sử nhãn"
              >
                Xóa lịch sử
              </button>
            )}
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
            <span className="text-xs font-medium text-slate-500 block">Tổng đã thẩm định</span>
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-1 block">
              {totalLabels + mealHistory.length}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {totalLabels} nhãn · {mealHistory.length} món ăn
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>NÊN MUA (BUY)</span>
            </div>
            <span className="text-2xl font-black font-mono tabular-nums text-emerald-700 dark:text-emerald-300 mt-1 block">
              {buyCount}
            </span>
            <span className="text-[11px] text-emerald-600/80 mt-0.5 block">
              Sản phẩm sạch, an toàn
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>CÂN NHẮC (CONSIDER)</span>
            </div>
            <span className="text-2xl font-black font-mono tabular-nums text-amber-700 dark:text-amber-300 mt-1 block">
              {considerCount}
            </span>
            <span className="text-[11px] text-amber-600/80 mt-0.5 block">
              Nên dùng có liều lượng
            </span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
              <XCircle className="w-3.5 h-3.5" />
              <span>NÊN TRÁNH (PASS)</span>
            </div>
            <span className="text-2xl font-black font-mono tabular-nums text-rose-700 dark:text-rose-300 mt-1 block">
              {passCount}
            </span>
            <span className="text-[11px] text-rose-600/80 mt-0.5 block">
              Nhiều hóa chất / phụ gia
            </span>
          </div>
        </div>

        {/* Offline-First & Realtime Cloud Sync Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Lưu trữ Ngoại Tuyến (Offline-First)
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  Sẵn sàng 100% khi mất mạng
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {!isOnline
                  ? 'Bạn đang mất kết nối mạng. Tất cả sản phẩm và món ăn trên vẫn có thể tra cứu bình thường từ bộ nhớ máy.'
                  : pendingCount > 0
                  ? `Có ${pendingCount} thao tác ngoại tuyến đang chờ gửi lên máy chủ.`
                  : `Đã đồng bộ hóa an toàn với máy chủ ${lastSyncedAt ? 'lúc ' + new Date(lastSyncedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'mới nhất'}.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                !isOnline
                  ? 'bg-amber-100/60 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : 'bg-emerald-100/60 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              }`}
            >
              {!isOnline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ngoại tuyến</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Trực tuyến</span>
                </>
              )}
            </span>

            {onSyncNow && (
              <button
                onClick={onSyncNow}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#151916] hover:bg-[#FAF7F2] dark:hover:bg-[#232B25] text-[#243B30] dark:text-[#FAF7F2] rounded-lg border border-[#EAE5DC] dark:border-[#27302A] font-semibold transition-all active:scale-95 disabled:opacity-50"
                title="Đồng bộ thủ công với máy chủ"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#3D5C4E]' : ''}`} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nutri-Rank & Badge Overview */}
      <NutriRankCard
        rankInfo={nutriRankInfo}
        onOpenDetails={onOpenNutriRank || (() => {})}
      />

      {/* 2. Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên sản phẩm (nước mắm, hạt nêm, tương ớt, mì gói, phở...)"
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tất cả ({totalLabels + mealHistory.length})
          </button>

          <button
            onClick={() => setFilterType('BUY')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'BUY'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            Nên Mua ({buyCount})
          </button>

          <button
            onClick={() => setFilterType('CONSIDER')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'CONSIDER'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            Cân Nhắc ({considerCount})
          </button>

          <button
            onClick={() => setFilterType('PASS')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'PASS'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            Nên Tránh ({passCount})
          </button>

          <button
            onClick={() => setFilterType('meals')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'meals'
                ? 'bg-[#3D5C4E] text-[#FAF7F2] shadow-xs font-bold'
                : 'text-[#3D5C4E] dark:text-[#8FA89B] hover:bg-[#F2F5F2] dark:hover:bg-[#1A221D]'
            }`}
          >
            Món ăn ({mealHistory.length})
          </button>
        </div>
      </div>

      {/* 3. Products List Grid */}
      <div className="space-y-4">
        {filteredLabels.length === 0 && filteredMeals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 mx-auto flex items-center justify-center mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Không tìm thấy sản phẩm nào phù hợp
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Thử từ khóa khác hoặc bấm nút "Soi nhãn mới" để quét bảng thành phần sản phẩm tiếp theo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Render Scrutinized Labels */}
            {filteredLabels.map((item, idx) => (
              <div
                key={`label-${idx}`}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600/60 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.category}</span>
                      {item.brandName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate max-w-[140px]">{item.brandName}</span>
                        </>
                      )}
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-md shrink-0 ${
                        item.verdict === 'BUY'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.verdict === 'PASS'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {item.verdict === 'BUY' ? 'NÊN MUA' : item.verdict === 'PASS' ? 'NÊN TRÁNH' : 'CÂN NHẮC'}
                    </span>
                  </div>

                  {/* Product Title */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {item.productName}
                  </h3>

                  {/* Verdict Headline */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.verdictHeadline}
                  </p>

                  {/* Chemical Tags & Badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.additives.slice(0, 3).map((add, aIdx) => (
                      <span
                        key={aIdx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        {add.code}
                      </span>
                    ))}
                    {item.additives.length > 3 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{item.additives.length - 3} phụ gia khác
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Bar: Clean Score & Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      Độ sạch: <strong className="font-mono text-slate-900 dark:text-white">{item.cleanScore}/100</strong>
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 font-mono">
                      {item.additives.length} chất phụ gia
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedLabel(item)}
                      className="px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors flex items-center gap-1"
                    >
                      Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteLabel(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                      title="Xóa sản phẩm này khỏi lịch sử"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Render Scrutinized Meals if filter allows */}
            {filteredMeals.map((meal) => (
              <div
                key={`meal-${meal.id}`}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Bữa ăn dinh dưỡng</span>
                      <span aria-hidden="true">·</span>
                      <span>{meal.estimatedTotalGrams}g</span>
                    </div>

                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {meal.calories} kcal
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {meal.vietnameseName}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    {meal.healthSummary}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-[#7A8B7F] font-mono mt-3">
                    <span className="text-[#C86446]">P: {meal.protein}g</span>
                    <span className="text-[#DDA15E]">C: {meal.carbs}g</span>
                    <span className="text-[#7A8B58]">F: {meal.fat}g</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Điểm sức khỏe: <strong className="font-mono text-emerald-600">{meal.healthScore}/10</strong>
                  </span>
                  <button
                    onClick={() => onDeleteMeal(meal.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Xóa món ăn này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Detail Modal for Selected Product */}
      {selectedLabel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-scale-in">
            {/* Header of Modal */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-500">
                  {selectedLabel.category} {selectedLabel.brandName ? `· ${selectedLabel.brandName}` : ''}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedLabel.productName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedLabel(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Big Verdict Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                selectedLabel.verdict === 'BUY'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                  : selectedLabel.verdict === 'PASS'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-900 dark:text-rose-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-200'
              }`}
            >
              <div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold opacity-75">
                  Khuyến nghị mua sắm:
                </span>
                <h4 className="text-lg font-black mt-0.5">
                  {selectedLabel.verdict === 'BUY' ? 'NÊN MUA (BUY)' : selectedLabel.verdict === 'PASS' ? 'NÊN TRÁNH (PASS)' : 'CÂN NHẮC (CONSIDER)'}
                </h4>
                <p className="text-xs mt-0.5 opacity-90">{selectedLabel.verdictHeadline}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold uppercase opacity-75 block">Độ sạch</span>
                <span className="text-2xl font-black font-mono">{selectedLabel.cleanScore}/100</span>
              </div>
            </div>

            {/* Summary */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedLabel.summary}
            </p>

            {/* Chemical Additives Detailed List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
                <span>Các phụ gia hóa học ({selectedLabel.additives.length}):</span>
              </h4>

              {selectedLabel.additives.length === 0 ? (
                <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 p-3 rounded-lg">
                  Không chứa phụ gia hóa học tổng hợp.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedLabel.additives.map((add, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="font-mono text-slate-900 dark:text-white">{add.code} - {add.name}</strong>
                        <span className="text-[10px] text-slate-500">({add.category})</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">Mục đích: {add.purpose}</p>
                      <p className="text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-2 rounded">
                        Tác động sức khỏe: {add.healthEffects}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Alternatives */}
            {selectedLabel.betterAlternatives.length > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-xs space-y-1.5">
                <strong className="text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Gợi ý giải pháp thay thế sạch hơn:
                </strong>
                <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-0.5">
                  {selectedLabel.betterAlternatives.map((alt, i) => (
                    <li key={i}>{alt}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLabel(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
