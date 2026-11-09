import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Minus, 
  Plus, 
  Info, 
  Flame, 
  UtensilsCrossed, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { AnalyzedMeal, MealType } from '../types';
import { SAMPLE_MEALS, SampleMealItem } from '../data/sampleData';
import { estimateMealNutrition } from '../data/nutritionEstimator';

interface MealScannerProps {
  initialMealType?: MealType;
  onSaveMeal: (meal: AnalyzedMeal, mealType: MealType, imageUrl?: string) => void;
  onCancel?: () => void;
}

export const MealScanner: React.FC<MealScannerProps> = ({
  initialMealType = 'lunch',
  onSaveMeal,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [textDescription, setTextDescription] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analyzedMeal, setAnalyzedMeal] = useState<AnalyzedMeal | null>(null);
  const [baseMealData, setBaseMealData] = useState<AnalyzedMeal | null>(null);
  const [portionScale, setPortionScale] = useState<number>(1.0);
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultSectionRef = useRef<HTMLDivElement>(null);

  // Automatically scroll down to the meal ingredients and nutrition section
  useEffect(() => {
    if (analyzedMeal) {
      const timer = setTimeout(() => {
        if (resultSectionRef.current) {
          resultSectionRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [analyzedMeal?.dishName, analyzedMeal?.vietnameseName]);

  // Helper to resize & compress image to max 1000px to ensure fast upload & processing
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload from file input with auto-compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime('image/jpeg');
    const compressedBase64 = await compressImage(file);
    if (compressedBase64) {
      setSelectedImage(compressedBase64);
      setAnalyzedMeal(null);
      setBaseMealData(null);
      setErrorMsg(null);
      setPortionScale(1.0);
    }
  };

  // Pick sample meal
  const handleSelectSample = (sample: SampleMealItem) => {
    setSelectedImage(sample.thumbnail);
    setImageMime('image/jpeg');
    setBaseMealData(JSON.parse(JSON.stringify(sample.data)));
    setAnalyzedMeal(JSON.parse(JSON.stringify(sample.data)));
    setPortionScale(1.0);
    setErrorMsg(null);
    setSavedSuccess(false);
  };

  // Client-side sanitizer for human-friendly error messages
  const getCleanErrorMessage = (rawMsg: string): string => {
    if (!rawMsg) return 'Đã có lỗi xảy ra khi phân tích hình ảnh. Vui lòng bấm thử lại.';
    let msg = rawMsg;
    try {
      if (typeof rawMsg === 'string' && rawMsg.trim().startsWith('{') && rawMsg.trim().endsWith('}')) {
        const parsed = JSON.parse(rawMsg.trim());
        if (parsed.error?.message) {
          msg = parsed.error.message;
        }
      }
    } catch {
      // keep msg
    }

    const lower = String(msg).toLowerCase();
    if (lower.includes('503') || lower.includes('high demand') || lower.includes('unavailable') || lower.includes('spikes in demand')) {
      return 'Máy chủ AI đang có lượng người dùng cao đột biến. Hệ thống đang sẵn sàng, vui lòng bấm "Thử lại ngay" để tiếp tục.';
    }
    if (lower.includes('429') || lower.includes('quota') || lower.includes('resource_exhausted')) {
      return 'Hệ thống đã đạt giới hạn lượt xử lý trong thời gian ngắn. Vui lòng đợi 5-10 giây và bấm thử lại.';
    }
    if (lower.includes('504') || lower.includes('502') || lower.includes('timeout')) {
      return 'Thời gian phản hồi bị trễ do mạng. Vui lòng bấm Thử lại ngay.';
    }
    return msg;
  };

  // Call backend API to analyze image
  const handleAnalyze = async () => {
    if (!selectedImage && !textDescription.trim()) {
      setErrorMsg('Vui lòng chọn hình ảnh món ăn hoặc nhập tên/mô tả món.');
      return;
    }

    if (!navigator.onLine) {
      // Offline fallback: Use local Vietnamese nutrition estimator
      setIsScanning(true);
      setTimeout(() => {
        const fallback = estimateMealNutrition(textDescription, selectedImage || undefined);
        setBaseMealData(JSON.parse(JSON.stringify(fallback)));
        setAnalyzedMeal(fallback);
        setPortionScale(1.0);
        setIsScanning(false);
      }, 400);
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    // Hard 10-second client-side timeout to prevent any infinite spinner
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage || undefined,
          mimeType: imageMime,
          description: textDescription,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let data: AnalyzedMeal | null = null;

      // Handle non-JSON or HTML responses (e.g. preview container waking up)
      if (responseText && !responseText.trim().startsWith('<')) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = null;
        }
      }

      // If server returned valid data with dishName, use it
      if (response.ok && data && (data as any).dishName) {
        setBaseMealData(JSON.parse(JSON.stringify(data)));
        setAnalyzedMeal(data);
        setPortionScale(1.0);
      } else {
        // Graceful automatic fallback: Use intelligent Vietnamese nutrition database
        console.warn('[MealScanner] Using instant intelligent nutrition estimation fallback');
        const fallback = estimateMealNutrition(textDescription, selectedImage || undefined);
        setBaseMealData(JSON.parse(JSON.stringify(fallback)));
        setAnalyzedMeal(fallback);
        setPortionScale(1.0);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('[MealScanner] Network fetch failed or timed out, falling back to local nutrition engine:', err?.message || err);
      // Instant intelligent fallback so user never experiences an infinite freeze
      const fallback = estimateMealNutrition(textDescription, selectedImage || undefined);
      setBaseMealData(JSON.parse(JSON.stringify(fallback)));
      setAnalyzedMeal(fallback);
      setPortionScale(1.0);
    } finally {
      clearTimeout(timeoutId);
      setIsScanning(false);
    }
  };

  // Adjust portion size dynamically
  const handleScaleChange = (newScale: number) => {
    if (!baseMealData) return;
    const clampedScale = Math.max(0.2, Math.min(3.0, Math.round(newScale * 10) / 10));
    setPortionScale(clampedScale);

    const updated: AnalyzedMeal = {
      ...baseMealData,
      estimatedTotalGrams: Math.round(baseMealData.estimatedTotalGrams * clampedScale),
      calories: Math.round(baseMealData.calories * clampedScale),
      protein: Math.round(baseMealData.protein * clampedScale * 10) / 10,
      carbs: Math.round(baseMealData.carbs * clampedScale * 10) / 10,
      fat: Math.round(baseMealData.fat * clampedScale * 10) / 10,
      fiber: Math.round((baseMealData.fiber || 0) * clampedScale * 10) / 10,
      ingredients: baseMealData.ingredients.map((ing) => ({
        ...ing,
        weightGrams: Math.round(ing.weightGrams * clampedScale),
        calories: Math.round(ing.calories * clampedScale),
        protein: Math.round(ing.protein * clampedScale * 10) / 10,
        carbs: Math.round(ing.carbs * clampedScale * 10) / 10,
        fat: Math.round(ing.fat * clampedScale * 10) / 10,
      })),
    };
    setAnalyzedMeal(updated);
  };

  const handleSave = () => {
    if (!analyzedMeal) return;
    onSaveMeal(analyzedMeal, mealType, selectedImage || undefined);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Info */}
      <div className="bg-white dark:bg-[#1A201C] rounded-[32px] p-6 sm:p-8 border border-[#EAE5DC] dark:border-[#27302A] shadow-xs">
        <div className="flex items-center gap-2 text-xs text-[#7A8B7F] mb-1">
          <span>AI Vision Multimodal</span>
          <span aria-hidden="true">·</span>
          <span>Nhận diện món ăn Việt & Dinh dưỡng sạch</span>
          <span aria-hidden="true">·</span>
          <span>Định lượng Calo & Macro tự nhiên</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl italic font-normal tracking-tight text-[#243B30] dark:text-[#E8EDE9]">
          Nhận diện Calo & Bóc tách món ăn
        </h1>
        <p className="text-xs sm:text-sm text-[#6A786E] dark:text-[#9DAEA3] mt-2">
          Chụp ảnh đĩa thức ăn hoặc bữa ăn hàng ngày. AI sẽ tự động nhận diện từng nguyên liệu tự nhiên, ước tính khối lượng và hàm lượng calo, đạm, xơ, carbs.
        </p>

        {/* Upload Zone & Controls */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Image Dropzone */}
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-[24px] p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[260px] overflow-hidden ${
                selectedImage
                  ? 'border-[#3D5C4E] bg-[#FAF7F2] dark:bg-[#151916]'
                  : 'border-[#D8D2C6] dark:border-[#333E37] hover:border-[#3D5C4E] hover:bg-[#FAF7F2]/60 dark:hover:bg-[#151916]/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedImage ? (
                <div className="relative w-full h-full flex flex-col items-center">
                  <img
                    src={selectedImage}
                    alt="Món ăn cần phân tích"
                    referrerPolicy="no-referrer"
                    className="max-h-56 w-auto rounded-2xl object-contain shadow-xs"
                  />
                  {isScanning && (
                    <div className="absolute inset-0 bg-[#243B30]/70 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white p-4">
                      <div className="w-10 h-10 rounded-full border-3 border-[#FAF7F2] border-t-transparent animate-spin mb-3" />
                      <span className="text-sm font-semibold tracking-wide">AI đang bóc tách món ăn...</span>
                      <span className="text-xs text-[#FAF7F2]/80 mt-1">Đang ước tính khẩu phần và dưỡng chất</span>
                    </div>
                  )}
                  <p className="text-xs text-[#7A8B7F] mt-2">
                    Bấm để chọn ảnh khác
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#EBF3EE] dark:bg-[#1B2921] text-[#3D5C4E] dark:text-[#8FA89B] flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#243B30] dark:text-[#E8EDE9] block">
                      Chụp ảnh hoặc Chọn ảnh đĩa ăn
                    </span>
                    <span className="text-xs text-[#7A8B7F] block mt-1">
                      Hỗ trợ mâm cơm, đĩa ăn gia đình, phở, bánh mì, salad...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Text Hint */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#243B30] dark:text-[#E8EDE9]">
                Mô tả thêm hoặc chạm chọn món (tăng độ chuẩn xác 100%):
              </label>
              <input
                type="text"
                value={textDescription}
                onChange={(e) => setTextDescription(e.target.value)}
                placeholder="VD: Cơm sườn 2 trứng ít mỡ hành, Phở nạm gầu, Salad ức gà..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3D5C4E] text-[#243B30] dark:text-[#E8EDE9]"
              />

              {/* Quick food suggestion chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[
                  'Cơm tấm sườn bì',
                  'Phở bò tái nạm',
                  'Bún bò Huế',
                  'Bánh mì thịt pate',
                  'Salad ức gà Eat Clean',
                  'Cơm gà xối mỡ',
                  'Bún chả Hà Nội',
                  'Bún riêu cua đồng',
                  'Cơm thịt kho tàu',
                  'Cơm cá kho tộ',
                ].map((dish) => (
                  <button
                    key={dish}
                    type="button"
                    onClick={() => setTextDescription(textDescription === dish ? '' : dish)}
                    className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                      textDescription === dish
                        ? 'bg-[#3D5C4E] text-[#FAF7F2] border-[#3D5C4E] font-medium shadow-xs'
                        : 'bg-[#FAF7F2] dark:bg-[#151916] text-[#6A786E] dark:text-[#9DAEA3] border-[#EAE5DC] dark:border-[#27302A] hover:border-[#3D5C4E]'
                    }`}
                  >
                    {dish}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={handleAnalyze}
                disabled={isScanning || (!selectedImage && !textDescription.trim())}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-5 text-xs sm:text-sm font-semibold text-[#FAF7F2] bg-[#3D5C4E] hover:bg-[#2D473B] disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-all shadow-xs"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang bóc tách dinh dưỡng...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Phân tích Calo AI</span>
                  </>
                )}
              </button>

              {selectedImage && (
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalyzedMeal(null);
                    setBaseMealData(null);
                  }}
                  className="px-4 py-3 border border-[#EAE5DC] dark:border-[#27302A] text-[#7A8B7F] hover:bg-[#FAF7F2] dark:hover:bg-[#151916] rounded-full transition-colors text-xs font-medium"
                  title="Xóa ảnh"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-3 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-rose-800 dark:text-rose-200">
                      Chưa thể hoàn tất phân tích AI
                    </p>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                      {errorMsg}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-rose-200/60 dark:border-rose-800/60">
                  <button
                    onClick={handleAnalyze}
                    disabled={isScanning}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Thử lại ngay
                  </button>
                  <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                    hoặc chọn một món mẫu bên phải
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sample Dishes to try immediately */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-[#7A8B7F] uppercase tracking-wider block">
              Hoặc thử ngay món ăn Việt Nam mẫu:
            </span>
            <div className="grid grid-cols-2 gap-3">
              {SAMPLE_MEALS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="p-3 text-left rounded-2xl border border-[#EAE5DC] dark:border-[#27302A] bg-[#FAF7F2] dark:bg-[#151916] hover:border-[#3D5C4E] hover:bg-white dark:hover:bg-[#1A201C] transition-all flex flex-col group"
                >
                  <img
                    src={sample.thumbnail}
                    alt={sample.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-24 object-cover rounded-xl mb-2 group-hover:scale-[1.02] transition-transform"
                  />
                  <h4 className="text-xs font-bold text-[#243B30] dark:text-[#E8EDE9] line-clamp-1">
                    {sample.name}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-[#7A8B7F] mt-1">
                    <span className="font-mono text-[#3D5C4E] dark:text-[#8FA89B] font-bold">{sample.data.calories} kcal</span>
                    <span>{sample.data.estimatedTotalGrams}g</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Result Section: Nutritional Breakdown & Portion Adjuster */}
      {analyzedMeal && (
        <div 
          ref={resultSectionRef}
          id="meal-results"
          className="bg-white dark:bg-[#1A201C] rounded-[32px] p-6 sm:p-8 border border-[#EAE5DC] dark:border-[#27302A] shadow-xs space-y-6 animate-fade-in scroll-mt-20"
        >
          {/* Header of Result */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#F0EBE1] dark:border-[#242D26]">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7A8B7F] mb-1">
                <span>{analyzedMeal.dishName}</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[#3D5C4E] dark:text-[#8FA89B]">
                  Điểm sức khỏe: {analyzedMeal.healthScore}/10
                </span>
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl italic font-normal tracking-tight text-[#243B30] dark:text-[#E8EDE9]">
                {analyzedMeal.vietnameseName}
              </h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {analyzedMeal.dietaryTags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium text-[#3D5C4E] dark:text-[#8FA89B] bg-[#F2F5F2] dark:bg-[#18231D] px-2.5 py-0.5 rounded-full border border-[#D8E2D8] dark:border-[#27382E]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Macro Pills */}
            <div className="text-right sm:text-right shrink-0">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                {analyzedMeal.calories}{' '}
                <span className="text-sm font-normal text-slate-500">kcal</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Tổng khối lượng: {analyzedMeal.estimatedTotalGrams}g
              </span>
            </div>
          </div>

          {/* Portion Scale Adjuster */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Điều chỉnh khẩu phần ăn thực tế:
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Nếu bạn ăn ít hơn hoặc nhiều hơn ước tính của AI, hãy chọn tỷ lệ bên dưới:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleScaleChange(portionScale - 0.1)}
                disabled={portionScale <= 0.3}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-40"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="w-16 text-center text-sm font-bold font-mono text-slate-900 dark:text-white">
                {Math.round(portionScale * 100)}%
              </span>

              <button
                onClick={() => handleScaleChange(portionScale + 0.1)}
                disabled={portionScale >= 2.5}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleScaleChange(1.0)}
                className="text-xs text-slate-500 hover:text-emerald-600 ml-2"
              >
                Chuẩn (100%)
              </button>
            </div>
          </div>

          {/* Macro 4-Column Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block">Đạm (Protein)</span>
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1 block">
                {analyzedMeal.protein}g
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-semibold text-[#DDA15E] block">Tinh bột (Carbs)</span>
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1 block">
                {analyzedMeal.carbs}g
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-semibold text-[#7A8B58] block">Chất béo (Fat)</span>
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1 block">
                {analyzedMeal.fat}g
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-semibold text-[#3D5C4E] dark:text-[#8FA89B] block">Chất xơ (Fiber)</span>
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1 block">
                {analyzedMeal.fiber || 0}g
              </span>
            </div>
          </div>

          {/* Detailed Ingredients Table */}
          <div id="meal-ingredients-table" className="space-y-3 scroll-mt-24">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Bóc tách nguyên liệu & hàm lượng tương ứng:
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Thành phần</th>
                    <th className="py-2.5 px-3">Khối lượng</th>
                    <th className="py-2.5 px-3">Calo</th>
                    <th className="py-2.5 px-3">Đạm</th>
                    <th className="py-2.5 px-3">Carb</th>
                    <th className="py-2.5 px-3">Fat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {analyzedMeal.ingredients.map((ing, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                        {ing.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{ing.weightGrams}g</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{ing.calories} kcal</td>
                      <td className="py-2.5 px-3 text-[#C86446]">{ing.protein}g</td>
                      <td className="py-2.5 px-3 text-[#DDA15E]">{ing.carbs}g</td>
                      <td className="py-2.5 px-3 text-[#7A8B58]">{ing.fat}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Nutrition Insight & Advice */}
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
              <Info className="w-4 h-4" />
              <span>Đánh giá dinh dưỡng từ AI:</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              {analyzedMeal.healthSummary}
            </p>
            {analyzedMeal.advice && (
              <p className="text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                💡 <strong>Lời khuyên:</strong> {analyzedMeal.advice}
              </p>
            )}
          </div>

          {/* Save to Log Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Lưu vào bữa:
              </span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      mealType === type
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {type === 'breakfast' ? 'Sáng' : type === 'lunch' ? 'Trưa' : type === 'dinner' ? 'Tối' : 'Phụ'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all ${
                savedSuccess
                  ? 'bg-emerald-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Đã lưu vào nhật ký!</span>
                </>
              ) : (
                <>
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Lưu vào Nhật ký hôm nay</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
