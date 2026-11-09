import React, { useState } from 'react';
import { NutriRankInfo, BadgeCategory } from '../types';
import { 
  X, 
  Trophy, 
  ShieldCheck, 
  FlaskConical, 
  Leaf, 
  Droplet, 
  Sparkles, 
  HeartHandshake, 
  ShieldAlert, 
  CheckCircle2, 
  Lock, 
  Flame, 
  HelpCircle,
  Award
} from 'lucide-react';

interface NutriRankModalProps {
  isOpen: boolean;
  onClose: () => void;
  rankInfo: NutriRankInfo;
}

export const NutriRankModal: React.FC<NutriRankModalProps> = ({ isOpen, onClose, rankInfo }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | BadgeCategory>('all');

  if (!isOpen) return null;

  const filteredBadges = rankInfo.badges.filter(
    (b) => selectedCategory === 'all' || b.category === selectedCategory
  );

  const getBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const props = { className: `w-5 h-5 ${isUnlocked ? 'text-[#FAF7F2]' : 'text-[#7A8B7F]'}` };
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck {...props} />;
      case 'FlaskConical':
        return <FlaskConical {...props} />;
      case 'Leaf':
        return <Leaf {...props} />;
      case 'Droplet':
        return <Droplet {...props} />;
      case 'Sparkles':
        return <Sparkles {...props} />;
      case 'HeartHandshake':
        return <HeartHandshake {...props} />;
      case 'ShieldAlert':
        return <ShieldAlert {...props} />;
      case 'Trophy':
        return <Trophy {...props} />;
      default:
        return <Award {...props} />;
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'text-[#DDA15E] bg-[#FDF6ED] dark:bg-[#2C2317] border-[#F5E2C5] dark:border-[#423421]';
      case 'epic':
        return 'text-[#C86446] bg-[#FBEFEA] dark:bg-[#2A1E18] border-[#F1D5C9] dark:border-[#4A2D23]';
      case 'rare':
        return 'text-[#3D5C4E] bg-[#F2F5F2] dark:bg-[#1A221D] border-[#D0DAD0] dark:border-[#27352D]';
      default:
        return 'text-[#7A8B7F] bg-[#FAF7F2] dark:bg-[#151916] border-[#EAE5DC] dark:border-[#27302A]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121614]/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-[#1A201C] rounded-[36px] max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-[#EAE5DC] dark:border-[#27302A] shadow-2xl p-6 sm:p-8 space-y-6 animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#F0EBE1] dark:border-[#27302A]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#F6EDE2] dark:bg-[#2A2319] border border-[#EADBCA] dark:border-[#3D3325] text-[#DDA15E] flex items-center justify-center shrink-0 shadow-xs">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-[#C86446] dark:text-[#E89279] font-medium">
                <span>Nutri-Rank & Huy Hiệu Dinh Dưỡng</span>
                <span aria-hidden="true" className="text-[#D8D2C6]">·</span>
                <span>Deliciously Ella Style</span>
              </div>
              <h2 className="font-editorial text-3xl font-normal italic tracking-tight text-[#243B30] dark:text-[#E8EDE9] mt-0.5">
                Bảng Vinh Danh Thực Dưỡng
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#EAE5DC] dark:border-[#27302A] flex items-center justify-center text-[#7A8B7F] hover:bg-[#FAF7F2] dark:hover:bg-[#151916] transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Tier Showcase Banner */}
        <div className="p-5 rounded-[28px] bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#7A8B7F]">Cấp bậc hiện tại</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h3 className="font-editorial text-2xl sm:text-3xl font-normal italic text-[#243B30] dark:text-[#E8EDE9]">
                  {rankInfo.tierName}
                </h3>
                <span className="text-xs font-mono text-[#C86446] dark:text-[#E89279] font-bold">
                  Lv.{rankInfo.tierLevel}
                </span>
              </div>
              <p className="text-xs text-[#6A786E] dark:text-[#9DAEA3] mt-1">
                Tích lũy kinh nghiệm qua việc soi nhãn phụ gia, chọn món ăn sạch và duy trì lối sống lành mạnh.
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0 bg-white dark:bg-[#1A201C] p-3.5 rounded-2xl border border-[#EAE5DC] dark:border-[#27302A]">
              <span className="text-[11px] text-[#7A8B7F] block">Tổng điểm kinh nghiệm</span>
              <span className="text-2xl font-black font-mono text-[#3D5C4E] dark:text-[#8FA89B]">
                {rankInfo.totalXp} <span className="text-xs font-normal text-[#7A8B7F]">XP</span>
              </span>
            </div>
          </div>

          {/* Progress to next level */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#7A8B7F]">
              <span>Tiến độ lên Cấp {rankInfo.tierLevel < 5 ? rankInfo.tierLevel + 1 : 5}</span>
              <span className="font-mono text-[#243B30] dark:text-[#E8EDE9]">
                {rankInfo.totalXp} / {rankInfo.nextLevelXp} XP ({rankInfo.progressToNextLevel}%)
              </span>
            </div>
            <div className="w-full bg-[#EAE5DC] dark:bg-[#232B25] h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#DDA15E] via-[#C86446] to-[#3D5C4E] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.max(rankInfo.progressToNextLevel, 6)}%` }}
              />
            </div>
          </div>

          {/* 4 Quick Stat Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="p-3 rounded-xl bg-white dark:bg-[#1A201C] border border-[#EAE5DC] dark:border-[#27302A] text-center">
              <span className="text-[11px] text-[#7A8B7F] block">Nhãn đã soi</span>
              <strong className="text-base font-mono text-[#243B30] dark:text-[#E8EDE9]">{rankInfo.scannedProductsCount}</strong>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#1A201C] border border-[#EAE5DC] dark:border-[#27302A] text-center">
              <span className="text-[11px] text-[#7A8B7F] block">Điểm sạch TB</span>
              <strong className="text-base font-mono text-[#3D5C4E] dark:text-[#8FA89B]">{rankInfo.cleanScoreAvg}/100</strong>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#1A201C] border border-[#EAE5DC] dark:border-[#27302A] text-center">
              <span className="text-[11px] text-[#7A8B7F] block">Huy hiệu đạt</span>
              <strong className="text-base font-mono text-[#DDA15E]">{rankInfo.unlockedBadgesCount}/{rankInfo.totalBadgesCount}</strong>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#1A201C] border border-[#EAE5DC] dark:border-[#27302A] text-center">
              <span className="text-[11px] text-[#7A8B7F] block">Phụ gia đã tránh</span>
              <strong className="text-base font-mono text-[#C86446]">{rankInfo.passAdditivesAvoided} nhóm</strong>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {[
              { id: 'all', label: 'Tất cả huy hiệu' },
              { id: 'clean_food', label: 'Thực phẩm sạch' },
              { id: 'additive', label: 'Phụ gia & Nhãn' },
              { id: 'fiber', label: 'Chất xơ tự nhiên' },
              { id: 'hydration', label: 'Thủy hóa' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 ${
                  selectedCategory === tab.id
                    ? 'bg-[#3D5C4E] text-[#FAF7F2] font-semibold shadow-xs'
                    : 'bg-[#FAF7F2] dark:bg-[#151916] text-[#6A786E] dark:text-[#9DAEA3] hover:bg-[#F2ECE1] dark:hover:bg-[#232B25]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {filteredBadges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  badge.isUnlocked
                    ? 'bg-[#F5F8F5] dark:bg-[#1B241E] border-[#D0DAD0] dark:border-[#2C3B30] shadow-xs'
                    : 'bg-[#FAF7F2]/50 dark:bg-[#151916]/50 border-[#EAE5DC] dark:border-[#27302A] opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                      badge.isUnlocked
                        ? 'bg-[#3D5C4E] text-[#FAF7F2]'
                        : 'bg-[#EAE5DC] dark:bg-[#232B25] text-[#7A8B7F]'
                    }`}
                  >
                    {getBadgeIcon(badge.iconName, badge.isUnlocked)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-[#243B30] dark:text-[#E8EDE9]">
                        {badge.name}
                      </h4>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRarityBadge(badge.rarity)}`}>
                        {badge.rarity.toUpperCase()}
                      </span>
                    </div>

                    <span className="text-xs font-medium text-[#C86446] dark:text-[#E89279] block">
                      {badge.titleVi}
                    </span>
                    <p className="text-xs text-[#6A786E] dark:text-[#9DAEA3] mt-1 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>

                {/* Criteria and Progress */}
                <div className="pt-2 border-t border-[#EAE5DC]/80 dark:border-[#27302A]/80 space-y-2 text-xs">
                  <div className="flex items-start gap-1.5 text-[11px] text-[#7A8B7F]">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Điều kiện: {badge.criteria}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-[#6A786E] dark:text-[#9DAEA3]">
                      Tiến độ: <strong className="font-mono text-[#243B30] dark:text-[#E8EDE9]">{badge.currentCount}/{badge.targetCount} {badge.unit}</strong>
                    </span>

                    {badge.isUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3D5C4E] dark:text-[#8FA89B]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã mở khóa (+{badge.rewardXp} XP)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#7A8B7F]">
                        <Lock className="w-3 h-3" />
                        {badge.progressPercent}%
                      </span>
                    )}
                  </div>

                  {!badge.isUnlocked && (
                    <div className="w-full bg-[#EAE5DC] dark:bg-[#232B25] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3D5C4E] rounded-full transition-all duration-500"
                        style={{ width: `${badge.progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info in Deliciously Ella philosophy */}
        <div className="p-4 rounded-2xl bg-[#F6EDE2] dark:bg-[#241E15] border border-[#EADBCA] dark:border-[#3D3325] text-xs text-[#6A786E] dark:text-[#C5B7A6] flex items-center justify-between gap-4">
          <p className="leading-relaxed">
            🌿 <strong>Triết lý dinh dưỡng tự nhiên</strong>: Nutri-Rank vinh danh sự kiên trì trong việc lựa chọn thực phẩm nguyên bản, sạch phụ gia và nuôi dưỡng cơ thể từ bên trong.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#3D5C4E] hover:bg-[#2D473B] text-[#FAF7F2] font-semibold text-xs rounded-full shrink-0 transition-colors shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
