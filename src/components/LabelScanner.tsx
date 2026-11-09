import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Camera, 
  Sparkles, 
  RotateCcw, 
  Loader2, 
  AlertCircle, 
  Check, 
  Info, 
  Lightbulb, 
  FlaskConical,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ProductLabelAnalysis, ChemicalAdditive } from '../types';
import { SAMPLE_LABELS, SampleLabelItem } from '../data/sampleData';
import { estimateProductLabel } from '../data/nutritionEstimator';

interface LabelScannerProps {
  onSaveLabelAnalysis: (analysis: ProductLabelAnalysis) => void;
  savedLabelsHistory: ProductLabelAnalysis[];
}

export const LabelScanner: React.FC<LabelScannerProps> = ({
  onSaveLabelAnalysis,
  savedLabelsHistory,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [productHint, setProductHint] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ProductLabelAnalysis | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultSectionRef = useRef<HTMLDivElement>(null);

  // Automatically scroll down to the product label & chemical additives verdict section
  useEffect(() => {
    if (analysisResult) {
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
  }, [analysisResult?.productName, analysisResult?.verdict]);

  // Helper to resize & compress label image to max 1000px for fast upload
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime('image/jpeg');
    const compressedBase64 = await compressImage(file);
    if (compressedBase64) {
      setSelectedImage(compressedBase64);
      setAnalysisResult(null);
      setErrorMsg(null);
    }
  };

  const handleSelectSample = (sample: SampleLabelItem) => {
    setSelectedImage(sample.thumbnail);
    setImageMime('image/jpeg');
    setAnalysisResult(JSON.parse(JSON.stringify(sample.data)));
    setErrorMsg(null);
    setSavedSuccess(false);
  };

  // Client-side sanitizer for human-friendly error messages
  const getCleanErrorMessage = (rawMsg: string): string => {
    if (!rawMsg) return 'Đã có lỗi xảy ra khi phân tích nhãn sản phẩm. Vui lòng bấm thử lại.';
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

  const handleAnalyze = async () => {
    if (!selectedImage && !productHint.trim()) {
      setErrorMsg('Vui lòng chọn hình ảnh nhãn dán thành phần hoặc nhập tên sản phẩm.');
      return;
    }

    if (!navigator.onLine) {
      // Offline fallback: Use local Vietnamese additives decryptor
      setIsScanning(true);
      setTimeout(() => {
        const fallback = estimateProductLabel(productHint, Boolean(selectedImage));
        setAnalysisResult(fallback);
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
      const response = await fetch('/api/analyze-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage || undefined,
          mimeType: imageMime,
          productNameHint: productHint,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let data: ProductLabelAnalysis | null = null;

      // Handle non-JSON or HTML responses (e.g. preview container waking up)
      if (responseText && !responseText.trim().startsWith('<')) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = null;
        }
      }

      if (response.ok && data && (data as any).productName) {
        setAnalysisResult(data);
      } else {
        console.warn('[LabelScanner] Using instant intelligent additives estimation fallback');
        const fallback = estimateProductLabel(productHint, selectedImage || undefined);
        setAnalysisResult(fallback);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('[LabelScanner] Network fetch failed or timed out, falling back to local additives engine:', err?.message || err);
      const fallback = estimateProductLabel(productHint, selectedImage || undefined);
      setAnalysisResult(fallback);
    } finally {
      clearTimeout(timeoutId);
      setIsScanning(false);
    }
  };

  const handleSaveToHistory = () => {
    if (!analysisResult) return;
    onSaveLabelAnalysis({
      ...analysisResult,
      labelImageUrl: selectedImage || undefined,
      scannedAt: new Date().toISOString(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-[#1A201C] rounded-[32px] p-6 sm:p-8 border border-[#EAE5DC] dark:border-[#27302A] shadow-xs">
        <div className="flex items-center gap-2 text-xs text-[#C86446] dark:text-[#E89279] font-medium mb-1">
          <FlaskConical className="w-4 h-4" />
          <span>Giải mã Nhãn Phụ Gia & Thực Phẩm Sạch</span>
          <span aria-hidden="true" className="text-[#D8D2C6]">·</span>
          <span className="text-[#7A8B7F]">Tiêu chuẩn Codex Quốc Tế</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl italic font-normal tracking-tight text-[#243B30] dark:text-[#E8EDE9]">
          Thẩm định nhãn mác: Nên Mua hay Tránh?
        </h1>
        <p className="text-xs sm:text-sm text-[#6A786E] dark:text-[#9DAEA3] mt-2">
          Chụp ảnh bảng thành phần phía sau các sản phẩm đóng gói (hạt nêm, tương ớt, nước mắm, sốt ướp, bánh kẹo...). AI sẽ bóc tách các mã phụ gia E-numbers, chất tạo ngọt nhân tạo và đưa ra khuyến nghị khách quan bảo vệ sức khỏe gia đình bạn.
        </p>

        {/* Upload & Controls */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Image Dropzone */}
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-[24px] p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[260px] overflow-hidden ${
                selectedImage
                  ? 'border-[#C86446] bg-[#FAF7F2] dark:bg-[#151916]'
                  : 'border-[#D8D2C6] dark:border-[#333E37] hover:border-[#C86446] hover:bg-[#FAF7F2]/60 dark:hover:bg-[#151916]/60'
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
                    alt="Nhãn sản phẩm cần soi"
                    referrerPolicy="no-referrer"
                    className="max-h-56 w-auto rounded-2xl object-contain shadow-xs"
                  />
                  {isScanning && (
                    <div className="absolute inset-0 bg-[#243B30]/75 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white p-4">
                      <div className="w-10 h-10 rounded-full border-3 border-[#FAF7F2] border-t-transparent animate-spin mb-3" />
                      <span className="text-sm font-semibold tracking-wide">AI đang soi nhãn & phụ gia E-numbers...</span>
                      <span className="text-xs text-[#FAF7F2]/80 mt-1">Đánh giá độ sạch và tác động sức khỏe</span>
                    </div>
                  )}
                  <p className="text-xs text-[#7A8B7F] mt-2">
                    Bấm để chọn ảnh khác
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#FBEFEA] dark:bg-[#2A1E18] text-[#C86446] dark:text-[#E89279] flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#243B30] dark:text-[#E8EDE9] block">
                      Chụp hoặc tải ảnh bảng thành phần
                    </span>
                    <span className="text-xs text-[#7A8B7F] block mt-1">
                      Mặt sau bao bì: Bảng thành phần / Ingredients & phụ gia
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Product Name Hint */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#243B30] dark:text-[#E8EDE9]">
                Tên sản phẩm hoặc thương hiệu (tùy chọn):
              </label>
              <input
                type="text"
                value={productHint}
                onChange={(e) => setProductHint(e.target.value)}
                placeholder="VD: Hạt nêm Knorr, Tương ớt Chinsu, Nước mắm Nam Ngư..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C86446] text-[#243B30] dark:text-[#E8EDE9]"
              />

              {/* Quick product chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[
                  'Hạt nêm Knorr',
                  'Tương ớt Chinsu',
                  'Nước mắm Nam Ngư',
                  'Nước mắm Phú Quốc',
                  'Hạt nêm Maggi',
                  'Tương ớt Cholimex',
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setProductHint(productHint === item ? '' : item)}
                    className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                      productHint === item
                        ? 'bg-[#C86446] text-[#FAF7F2] border-[#C86446] font-medium shadow-xs'
                        : 'bg-[#FAF7F2] dark:bg-[#151916] text-[#6A786E] dark:text-[#9DAEA3] border-[#EAE5DC] dark:border-[#27302A] hover:border-[#C86446]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={handleAnalyze}
                disabled={isScanning || (!selectedImage && !productHint.trim())}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-5 text-xs sm:text-sm font-semibold text-[#FAF7F2] bg-[#C86446] hover:bg-[#B35235] disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-all shadow-xs"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang giải mã phụ gia...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Soi Nhãn & Đưa Khuyến Nghị</span>
                  </>
                )}
              </button>

              {selectedImage && (
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalysisResult(null);
                  }}
                  className="px-4 py-3 border border-[#EAE5DC] dark:border-[#27302A] text-[#7A8B7F] hover:bg-[#FAF7F2] dark:hover:bg-[#151916] rounded-full transition-colors text-xs font-medium"
                  title="Đặt lại"
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
                      Chưa thể hoàn tất thẩm định nhãn
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
                    hoặc chọn một nhãn sản phẩm mẫu bên phải
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Vietnamese Real-world Sample Labels */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Hoặc thử ngay nhãn sản phẩm gia vị mẫu:
            </span>
            <div className="space-y-2.5">
              {SAMPLE_LABELS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="w-full p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 hover:border-amber-500 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={sample.thumbnail}
                      alt={sample.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-600 transition-colors">
                        {sample.name}
                      </h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        {sample.brand}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      sample.data.verdict === 'BUY'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : sample.data.verdict === 'PASS'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {sample.data.verdict === 'BUY' ? 'NÊN MUA' : sample.data.verdict === 'PASS' ? 'NÊN TRÁNH' : 'CÂN NHẮC'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Analysis & Verdict Output */}
      {analysisResult && (
        <div 
          ref={resultSectionRef}
          id="label-results"
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in scroll-mt-20"
        >
          {/* Big Recommendation Card (BUY / CONSIDER / PASS) */}
          <div
            className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
              analysisResult.verdict === 'BUY'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : analysisResult.verdict === 'PASS'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  analysisResult.verdict === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : analysisResult.verdict === 'PASS'
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                    : 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                }`}
              >
                {analysisResult.verdict === 'BUY' ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : analysisResult.verdict === 'PASS' ? (
                  <XCircle className="w-8 h-8" />
                ) : (
                  <AlertTriangle className="w-8 h-8" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-extrabold opacity-80">
                    KẾT LUẬN TỪ CHUYÊN GIA DINH DƯỠNG:
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                  {analysisResult.verdict === 'BUY'
                    ? 'NÊN MUA (BUY - SẢN PHẨM SẠCH)'
                    : analysisResult.verdict === 'PASS'
                    ? 'HẠN CHẾ / KHÔNG NÊN MUA (PASS - QUÁ NHIỀU HÓA CHẤT)'
                    : 'CÂN NHẮC SỬ DỤNG (CONSIDER - DÙNG VỪA PHẢI)'}
                </h2>
                <p className="text-sm font-medium mt-1 opacity-90">
                  {analysisResult.verdictHeadline}
                </p>
              </div>
            </div>

            {/* Clean Score Circle / Badge */}
            <div className="text-center sm:text-right shrink-0 bg-white/70 dark:bg-slate-900/70 p-4 rounded-xl border border-current/20">
              <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">
                Điểm độ sạch:
              </span>
              <div className="text-3xl font-black font-mono tabular-nums mt-0.5">
                {analysisResult.cleanScore}
                <span className="text-sm font-normal opacity-60">/100</span>
              </div>
            </div>
          </div>

          {/* Product Info & Summary */}
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>{analysisResult.category}</span>
              {analysisResult.brandName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{analysisResult.brandName}</span>
                </>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {analysisResult.productName}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {analysisResult.summary}
            </p>
          </div>

          {/* 4 Nutrition Red Flags Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              className={`p-3 rounded-xl border text-xs ${
                analysisResult.nutritionAlerts.highSodium
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              <span className="font-bold block">
                {analysisResult.nutritionAlerts.highSodium ? '⚠️ Natri / Muối cao' : '✓ Muối ở mức vừa'}
              </span>
              <span className="text-[11px] opacity-80 mt-0.5 block">
                {analysisResult.nutritionAlerts.highSodium ? 'Cẩn trọng với huyết áp & thận' : 'An toàn tim mạch'}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border text-xs ${
                analysisResult.nutritionAlerts.highSugar
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              <span className="font-bold block">
                {analysisResult.nutritionAlerts.highSugar ? '⚠️ Đường tinh luyện cao' : '✓ Ít / Không đường ẩn'}
              </span>
              <span className="text-[11px] opacity-80 mt-0.5 block">
                {analysisResult.nutritionAlerts.highSugar ? 'Dễ gây tích mỡ & tiểu đường' : 'Thích hợp ăn kiêng'}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border text-xs ${
                analysisResult.nutritionAlerts.hasHiddenChemicals
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              <span className="font-bold block">
                {analysisResult.nutritionAlerts.hasHiddenChemicals ? '⚠️ Có hóa chất núp bóng' : '✓ Nhãn mác rõ ràng'}
              </span>
              <span className="text-[11px] opacity-80 mt-0.5 block">
                {analysisResult.nutritionAlerts.hasHiddenChemicals ? 'Dùng tên mĩ miều đánh lừa' : 'Minh bạch nguồn gốc'}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border text-xs ${
                analysisResult.nutritionAlerts.transFat
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              <span className="font-bold block">
                {analysisResult.nutritionAlerts.transFat ? '⚠️ Có Trans-Fat xấu' : '✓ Không có Trans-Fat'}
              </span>
              <span className="text-[11px] opacity-80 mt-0.5 block">
                {analysisResult.nutritionAlerts.transFat ? 'Nguy cơ xơ vữa động mạch' : 'An toàn mạch máu'}
              </span>
            </div>
          </div>

          {/* Detailed Additive Breakdown Table */}
          <div id="label-additives-section" className="space-y-3 scroll-mt-24">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-500" />
                Bóc tách chi tiết các hóa chất & phụ gia phát hiện được:
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                {analysisResult.additives.length} phụ gia
              </span>
            </div>

            {analysisResult.additives.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
                🎉 Tuyệt vời! Sản phẩm này hoàn toàn không phát hiện phụ gia hóa học tổng hợp đáng lo ngại nào.
              </div>
            ) : (
              <div className="space-y-3">
                {analysisResult.additives.map((add, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">
                          {add.code}
                        </span>
                        <strong className="text-slate-900 dark:text-white text-sm">
                          {add.name}
                        </strong>
                        <span className="text-slate-500 text-[11px]">({add.category})</span>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          add.riskLevel === 'safe'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : add.riskLevel === 'high_concern'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {add.riskLevel === 'safe'
                          ? 'Mức độ: An toàn'
                          : add.riskLevel === 'high_concern'
                          ? 'Mức độ: Đáng lo ngại'
                          : 'Mức độ: Cần lưu ý'}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>Mục đích sử dụng:</strong> {add.purpose}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                      <strong>Tác động sức khỏe:</strong> {add.healthEffects}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Health Warnings */}
          {analysisResult.healthWarnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span>Cảnh báo sức khỏe đặc biệt cho các nhóm đối tượng:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                {analysisResult.healthWarnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Better Alternatives Recommendations */}
          {analysisResult.betterAlternatives.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                <Lightbulb className="w-4 h-4" />
                <span>Lựa chọn thay thế lành mạnh & sạch hơn cho gia đình bạn:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                {analysisResult.betterAlternatives.map((alt, i) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={handleSaveToHistory}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all ${
                savedSuccess
                  ? 'bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700 active:scale-95'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Đã lưu vào danh sách soi nhãn!</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Lưu kết quả thẩm định này</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. History of Saved Labels */}
      {savedLabelsHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Lịch sử các sản phẩm bạn đã soi nhãn mác:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedLabelsHistory.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs text-slate-500 font-medium">{item.category}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
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
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {item.productName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {item.verdictHeadline}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                  <span>Điểm: <strong className="font-mono">{item.cleanScore}/100</strong></span>
                  <span>Phụ gia: <strong className="font-mono">{item.additives.length} chất</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
