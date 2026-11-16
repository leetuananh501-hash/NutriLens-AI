import React, { useMemo, useRef, useState } from 'react';
import {
  X,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Camera,
  Loader2,
  Candy,
  FlaskConical,
  Leaf,
  Baby,
} from 'lucide-react';
import { ProductLabelAnalysis } from '../types';
import { SAMPLE_LABELS } from '../data/sampleData';
import { estimateProductLabel } from '../data/nutritionEstimator';
import { compareTwoProducts } from '../services/nutritionPlannerService';
import { normalizeLabelNumbers, roundInt } from '../utils/numberFormat';

interface ProductComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelHistory: ProductLabelAnalysis[];
  initialIndexA?: number;
  initialIndexB?: number;
  onSaveNewLabel?: (analysis: ProductLabelAnalysis) => void;
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  isOpen,
  onClose,
  labelHistory,
  initialIndexA = 0,
  initialIndexB = 1,
  onSaveNewLabel,
}) => {
  // Build deduplicated pool of saved products + supermarket sample items
  const productPool = useMemo<ProductLabelAnalysis[]>(() => {
    const merged: ProductLabelAnalysis[] = [...labelHistory];
    for (const sample of SAMPLE_LABELS) {
      if (!merged.some((item) => item.productName === sample.data.productName)) {
        merged.push(normalizeLabelNumbers(sample.data));
      }
    }
    return merged;
  }, [labelHistory]);

  const safeIdxA = initialIndexA >= 0 && initialIndexA < productPool.length ? initialIndexA : 0;
  const safeIdxB =
    initialIndexB >= 0 && initialIndexB < productPool.length && initialIndexB !== safeIdxA
      ? initialIndexB
      : productPool.length > 1
      ? safeIdxA === 0
        ? 1
        : 0
      : 0;

  const [indexA, setIndexA] = useState<number>(safeIdxA);
  const [indexB, setIndexB] = useState<number>(safeIdxB);
  const [customA, setCustomA] = useState<ProductLabelAnalysis | null>(null);
  const [customB, setCustomB] = useState<ProductLabelAnalysis | null>(null);
  const [scanningSlot, setScanningSlot] = useState<'A' | 'B' | null>(null);
  const [aiVerdictNote, setAiVerdictNote] = useState<string | null>(null);
  const [isAiComparing, setIsAiComparing] = useState<boolean>(false);

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  const productA = customA || productPool[Math.min(indexA, Math.max(0, productPool.length - 1))];
  const productB = customB || productPool[Math.min(indexB, Math.max(0, productPool.length - 1))];

  const comparison = useMemo(() => {
    if (!productA || !productB) return null;
    return compareTwoProducts(productA, productB);
  }, [productA, productB]);

  if (!isOpen || productPool.length === 0 || !comparison) return null;

  const compressQuickPhoto = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 640;
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
            resolve(typeof e.target?.result === 'string' ? e.target.result : '');
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.65));
        };
        img.onerror = () => resolve(typeof e.target?.result === 'string' ? e.target.result : '');
        img.src = typeof e.target?.result === 'string' ? e.target.result : '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleQuickScanSlot = async (slot: 'A' | 'B', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningSlot(slot);
    setAiVerdictNote(null);

    try {
      const base64 = await compressQuickPhoto(file);
      let analyzed: ProductLabelAnalysis | null = null;

      if (navigator.onLine && base64) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 14000);
        try {
          const res = await fetch('/api/analyze-label', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64,
              mimeType: 'image/jpeg',
              productNameHint: file.name.replace(/\.[^/.]+$/, ''),
            }),
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (res.ok) {
            const parsed = (await res.json()) as ProductLabelAnalysis;
            if (parsed && parsed.productName) {
              analyzed = normalizeLabelNumbers({
                ...parsed,
                labelImageUrl: base64,
                scannedAt: new Date().toISOString(),
              });
            }
          }
        } catch {
          clearTimeout(timer);
        }
      }

      if (!analyzed) {
        analyzed = normalizeLabelNumbers({
          ...estimateProductLabel(file.name, base64 || true),
          labelImageUrl: base64 || undefined,
          scannedAt: new Date().toISOString(),
        });
      }

      if (slot === 'A') {
        setCustomA(analyzed);
      } else {
        setCustomB(analyzed);
      }

      if (onSaveNewLabel) {
        onSaveNewLabel(analyzed);
      }
    } finally {
      setScanningSlot(null);
      e.target.value = '';
    }
  };

  const handleDeepAiCompare = async () => {
    setIsAiComparing(true);
    try {
      if (!navigator.onLine) {
        setAiVerdictNote(comparison.summaryVerdict);
        return;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch('/api/compare-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productA, productB }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = (await res.json()) as { verdictText?: string };
        if (json.verdictText) {
          setAiVerdictNote(json.verdictText);
          return;
        }
      }
      setAiVerdictNote(comparison.summaryVerdict);
    } catch {
      setAiVerdictNote(comparison.summaryVerdict);
    } finally {
      setIsAiComparing(false);
    }
  };

  const renderBadgeStamp = (badge: {
    badgeLabel: string;
    badgeTone: 'buy' | 'consider' | 'warning';
  }) => {
    if (badge.badgeTone === 'buy') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EBF3EE] dark:bg-[#17261E] text-[#3D5C4E] dark:text-[#8FC2A6] border border-[#C8DFCC] dark:border-[#2B4636] whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>[{badge.badgeLabel}]</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FDF8EE] dark:bg-[#292114] text-[#B87B28] dark:text-[#EBB97B] border border-[#EFDCAD] dark:border-[#4A3B22] whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>[{badge.badgeLabel}]</span>
      </span>
    );
  };

  const renderUpfBadge = (upfLevel: 'minimal' | 'moderate' | 'ultra_processed', label: string) => {
    const colorClass =
      upfLevel === 'minimal'
        ? 'text-[#3D5C4E] dark:text-[#8FC2A6] bg-[#EBF3EE] dark:bg-[#17261E]'
        : upfLevel === 'ultra_processed'
        ? 'text-[#C86446] dark:text-[#F09A82] bg-[#FFF5F3] dark:bg-[#2A1B18]'
        : 'text-[#B87B28] dark:text-[#EBB97B] bg-[#FDF8EE] dark:bg-[#292114]';
    return (
      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${colorClass}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#121614]/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1A201C] rounded-[28px] sm:rounded-[32px] max-w-3xl w-full max-h-[92vh] overflow-y-auto scrollbar-hide border border-[#EAE5DC] dark:border-[#27302A] shadow-2xl p-4 sm:p-7 space-y-5 animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#F0EBE1] dark:border-[#27302A]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF5F3] dark:bg-[#2A1B18] border border-[#FDDBD4] dark:border-[#4D2D27] text-[#C86446] flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#C86446] dark:text-[#F09A82]">
                <span>Soi Hàng Siêu Thị</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#7A8B7F]">So Sánh Đối Đầu AI</span>
              </div>
              <h2 className="font-editorial text-xl sm:text-2xl italic font-normal text-[#243B30] dark:text-[#E8EDE9] leading-snug">
                Đặt lên bàn cân: Sản phẩm nào sạch hơn?
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng so sánh"
            className="w-9 h-9 rounded-full border border-[#EAE5DC] dark:border-[#27302A] flex items-center justify-center text-[#7A8B7F] hover:bg-[#FAF7F2] dark:hover:bg-[#151916] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Selectors + Quick Camera Scan for A & B */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Selector A */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3D5C4E] dark:text-[#8FA89B]">
                Sản phẩm A
              </span>
              <button
                type="button"
                onClick={() => fileInputARef.current?.click()}
                disabled={scanningSlot === 'A'}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C86446] hover:underline whitespace-nowrap"
              >
                {scanningSlot === 'A' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3" />
                )}
                <span>Quét nhãn mới</span>
              </button>
              <input
                ref={fileInputARef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleQuickScanSlot('A', e)}
              />
            </div>

            <select
              value={customA ? 'custom' : indexA}
              onChange={(e) => {
                setCustomA(null);
                setAiVerdictNote(null);
                setIndexA(Number(e.target.value));
              }}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#1A201C] border border-[#EAE5DC] dark:border-[#27302A] text-[#243B30] dark:text-[#E8EDE9] focus:outline-none focus:ring-2 focus:ring-[#3D5C4E]"
            >
              {customA && <option value="custom">📷 {customA.productName}</option>}
              {productPool.map((item, idx) => (
                <option key={`sel-a-${idx}`} value={idx}>
                  {item.productName} ({roundInt(item.cleanScore)}/100)
                </option>
              ))}
            </select>
          </div>

          {/* Selector B */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C86446] dark:text-[#F09A82]">
                Sản phẩm B
              </span>
              <button
                type="button"
                onClick={() => fileInputBRef.current?.click()}
                disabled={scanningSlot === 'B'}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C86446] hover:underline whitespace-nowrap"
              >
                {scanningSlot === 'B' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3" />
                )}
                <span>Quét nhãn mới</span>
              </button>
              <input
                ref={fileInputBRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleQuickScanSlot('B', e)}
              />
            </div>

            <select
              value={customB ? 'custom' : indexB}
              onChange={(e) => {
                setCustomB(null);
                setAiVerdictNote(null);
                setIndexB(Number(e.target.value));
              }}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#1A201C] border border-[#EAE5DC] dark:border-[#27302A] text-[#243B30] dark:text-[#E8EDE9] focus:outline-none focus:ring-2 focus:ring-[#C86446]"
            >
              {customB && <option value="custom">📷 {customB.productName}</option>}
              {productPool.map((item, idx) => (
                <option key={`sel-b-${idx}`} value={idx}>
                  {item.productName} ({roundInt(item.cleanScore)}/100)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Head-to-Head VS Header Cards */}
        <div className="relative grid grid-cols-2 gap-2.5 sm:gap-4 items-stretch">
          {/* VS Center Badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#243B30] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#243B30] text-[10px] font-black flex items-center justify-center shadow-md border-2 border-white dark:border-[#1A201C]">
            VS
          </div>

          {/* Card A */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between space-y-2.5 ${
              comparison.winner === 'A'
                ? 'bg-[#EBF3EE]/70 dark:bg-[#17261E]/70 border-[#3D5C4E] dark:border-[#5F8060]'
                : 'bg-[#FAF7F2] dark:bg-[#151916] border-[#EAE5DC] dark:border-[#27302A]'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A8B7F]">
                  Sản phẩm A
                </span>
                {renderBadgeStamp(comparison.productA)}
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#243B30] dark:text-[#E8EDE9] line-clamp-2 leading-snug">
                {productA.productName}
              </h3>
              <p className="text-[11px] text-[#6A786E] dark:text-[#9DAEA3] line-clamp-2">
                {comparison.productA.reason}
              </p>
            </div>

            <div className="pt-2 border-t border-[#EAE5DC] dark:border-[#27302A] flex items-baseline justify-between">
              <span className="text-[11px] text-[#7A8B7F]">Độ sạch</span>
              <span className="text-lg sm:text-xl font-black font-mono tabular-nums text-[#243B30] dark:text-[#E8EDE9]">
                {comparison.productA.purityScore}
                <span className="text-[10px] font-normal text-[#7A8B7F]">/100</span>
              </span>
            </div>
          </div>

          {/* Card B */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between space-y-2.5 ${
              comparison.winner === 'B'
                ? 'bg-[#EBF3EE]/70 dark:bg-[#17261E]/70 border-[#3D5C4E] dark:border-[#5F8060]'
                : 'bg-[#FAF7F2] dark:bg-[#151916] border-[#EAE5DC] dark:border-[#27302A]'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A8B7F]">
                  Sản phẩm B
                </span>
                {renderBadgeStamp(comparison.productB)}
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#243B30] dark:text-[#E8EDE9] line-clamp-2 leading-snug">
                {productB.productName}
              </h3>
              <p className="text-[11px] text-[#6A786E] dark:text-[#9DAEA3] line-clamp-2">
                {comparison.productB.reason}
              </p>
            </div>

            <div className="pt-2 border-t border-[#EAE5DC] dark:border-[#27302A] flex items-baseline justify-between">
              <span className="text-[11px] text-[#7A8B7F]">Độ sạch</span>
              <span className="text-lg sm:text-xl font-black font-mono tabular-nums text-[#243B30] dark:text-[#E8EDE9]">
                {comparison.productB.purityScore}
                <span className="text-[10px] font-normal text-[#7A8B7F]">/100</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3 Core Comparison Criteria Table */}
        <div className="rounded-2xl border border-[#EAE5DC] dark:border-[#27302A] overflow-hidden divide-y divide-[#F0EBE1] dark:divide-[#27302A]">
          {/* Criterion 1: Real Sugar Equivalent */}
          <div className="p-3.5 sm:p-4 bg-[#FAF7F2]/60 dark:bg-[#151916]/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#243B30] dark:text-[#E8EDE9]">
              <Candy className="w-4 h-4 text-[#DDA15E] shrink-0" />
              <span>1. Lượng đường thực tế & đường ẩn</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1A201C] border border-[#EAE5DC] dark:border-[#27302A]">
                <p
                  className={`font-semibold ${
                    comparison.productA.sugarRisk === 'high'
                      ? 'text-[#C86446]'
                      : comparison.productA.sugarRisk === 'moderate'
                      ? 'text-[#B87B28]'
                      : 'text-[#3D5C4E] dark:text-[#8FC2A6]'
                  }`}
                >
                  {comparison.productA.sugarLabel}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1A201C] border border-[#EAE5DC] dark:border-[#27302A]">
                <p
                  className={`font-semibold ${
                    comparison.productB.sugarRisk === 'high'
                      ? 'text-[#C86446]'
                      : comparison.productB.sugarRisk === 'moderate'
                      ? 'text-[#B87B28]'
                      : 'text-[#3D5C4E] dark:text-[#8FC2A6]'
                  }`}
                >
                  {comparison.productB.sugarLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Criterion 2: Toxic Additives & Sensitive Ingredients for Kids/Pregnant Mothers */}
          <div className="p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#243B30] dark:text-[#E8EDE9]">
                <FlaskConical className="w-4 h-4 text-[#C86446] shrink-0" />
                <span>2. Phụ gia & chất bảo quản nhạy cảm</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#7A8B7F] whitespace-nowrap">
                <Baby className="w-3 h-3" /> Trẻ nhỏ & Bà bầu
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] space-y-1">
                <span className="font-mono font-bold text-[#243B30] dark:text-[#E8EDE9] block">
                  {comparison.productA.additivesCount} phụ gia ({comparison.productA.highConcernCount} đáng lo)
                </span>
                {comparison.productA.sensitiveAdditives.length > 0 ? (
                  <p className="text-[11px] text-[#C86446] leading-snug">
                    {comparison.productA.sensitiveAdditives.slice(0, 2).join(', ')}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#3D5C4E] dark:text-[#8FC2A6]">
                    Không thấy E407, E150d, E621 hay Aspartame
                  </p>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] space-y-1">
                <span className="font-mono font-bold text-[#243B30] dark:text-[#E8EDE9] block">
                  {comparison.productB.additivesCount} phụ gia ({comparison.productB.highConcernCount} đáng lo)
                </span>
                {comparison.productB.sensitiveAdditives.length > 0 ? (
                  <p className="text-[11px] text-[#C86446] leading-snug">
                    {comparison.productB.sensitiveAdditives.slice(0, 2).join(', ')}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#3D5C4E] dark:text-[#8FC2A6]">
                    Không thấy E407, E150d, E621 hay Aspartame
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Criterion 3: UPF / Purity Ratio */}
          <div className="p-3.5 sm:p-4 bg-[#FAF7F2]/60 dark:bg-[#151916]/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#243B30] dark:text-[#E8EDE9]">
              <Leaf className="w-4 h-4 text-[#3D5C4E] shrink-0" />
              <span>3. Độ tinh khiết & mức độ siêu chế biến (UPF)</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1A201C] border border-[#EAE5DC] dark:border-[#27302A] space-y-1">
                {renderUpfBadge(comparison.productA.upfLevel, comparison.productA.upfLabel)}
                <span className="text-[11px] text-[#7A8B7F] block">
                  {productA.rawIngredients.length} thành phần trên nhãn
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1A201C] border border-[#EAE5DC] dark:border-[#27302A] space-y-1">
                {renderUpfBadge(comparison.productB.upfLevel, comparison.productB.upfLabel)}
                <span className="text-[11px] text-[#7A8B7F] block">
                  {productB.rawIngredients.length} thành phần trên nhãn
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Smart Verdict Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#3D5C4E] to-[#2D4A3C] text-white space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-[#DDA15E] shrink-0" />
              <span>Phán quyết thông minh từ AI NutriLens</span>
            </div>
            <button
              type="button"
              onClick={handleDeepAiCompare}
              disabled={isAiComparing}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[11px] font-semibold transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {isAiComparing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Đang phân tích...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3 h-3" />
                  <span>Phân tích sâu thêm</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-white/95">
            {aiVerdictNote || comparison.summaryVerdict}
          </p>
          <p className="text-[11px] text-white/80 pt-1 border-t border-white/15">
            {comparison.familyAdvice}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-[#243B30] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#243B30] text-xs font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Đóng bảng so sánh
          </button>
        </div>
      </div>
    </div>
  );
};
