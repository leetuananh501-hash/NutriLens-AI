import React from 'react';
import { Camera, ShieldAlert, Sparkles, X, ChevronRight, Utensils } from 'lucide-react';

interface MobileQuickScanSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMealScan: () => void;
  onSelectLabelScan: () => void;
}

export const MobileQuickScanSheet: React.FC<MobileQuickScanSheetProps> = ({
  isOpen,
  onClose,
  onSelectMealScan,
  onSelectLabelScan,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* iOS/Android Bottom Sheet */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1A201C] rounded-t-[36px] border-t border-[#EAE5DC] dark:border-[#27302A] p-6 pb-safe shadow-2xl z-10 animate-slide-up space-y-4">
        {/* Native Grab Handle */}
        <div className="w-12 h-1 bg-[#D8D2C6] dark:bg-[#3D4740] rounded-full mx-auto mb-2" />

        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#3D5C4E] dark:text-[#8FA89B]">NutriLens Wellness</span>
            <h3 className="font-editorial text-2xl italic font-normal text-[#243B30] dark:text-[#E8EDE9]">
              Bạn muốn soi nội dung nào?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] flex items-center justify-center text-[#7A8B7F] hover:text-[#243B30] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2 Big Touch Action Buttons (Deliciously Ella Style) */}
        <div className="space-y-3 pt-1">
          {/* Option 1: Meal Calorie Scanner */}
          <button
            onClick={() => {
              onClose();
              onSelectMealScan();
            }}
            className="w-full p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] hover:border-[#3D5C4E] flex items-center justify-between text-left group hover:scale-[1.01] active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#3D5C4E] text-[#FAF7F2] flex items-center justify-center shadow-sm shadow-[#3D5C4E]/20 shrink-0">
                <Camera className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#3D5C4E] dark:text-[#8FA89B] block">
                  Bữa ăn & Món ăn
                </span>
                <h4 className="text-sm font-bold text-[#243B30] dark:text-[#E8EDE9]">
                  Soi Calo & Bóc tách Dinh dưỡng
                </h4>
                <p className="text-xs text-[#7A8B7F] mt-0.5">
                  Chụp đĩa cơm, tô phở, salad... ước tính calo, đạm, xơ, carbs
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#7A8B7F] group-hover:text-[#3D5C4E] group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Option 2: Chemical Label Scanner */}
          <button
            onClick={() => {
              onClose();
              onSelectLabelScan();
            }}
            className="w-full p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] hover:border-[#C86446] flex items-center justify-between text-left group hover:scale-[1.01] active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#C86446] text-[#FAF7F2] flex items-center justify-center shadow-sm shadow-[#C86446]/20 shrink-0">
                <ShieldAlert className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#C86446] dark:text-[#E89279] block">
                  Bao bì & Nhãn thực phẩm
                </span>
                <h4 className="text-sm font-bold text-[#243B30] dark:text-[#E8EDE9]">
                  Soi Phụ Gia & Hóa Chất Đóng Hộp
                </h4>
                <p className="text-xs text-[#7A8B7F] mt-0.5">
                  Chụp bảng thành phần gia vị, sốt, nước ngọt... tư vấn Nên Mua hay Tránh
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#7A8B7F] group-hover:text-[#C86446] group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full py-3 text-center text-xs font-semibold text-[#7A8B7F] hover:text-[#243B30] dark:hover:text-[#FAF7F2] transition-colors"
        >
          Đóng lại
        </button>
      </div>
    </div>
  );
};
