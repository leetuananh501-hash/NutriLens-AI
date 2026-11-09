import React from 'react';
import { NutriRankInfo } from '../types';
import { 
  ShieldCheck, 
  FlaskConical, 
  Leaf, 
  Droplet, 
  Trophy, 
  Sparkles, 
  ChevronRight, 
  Award,
  Flame,
  ShieldAlert
} from 'lucide-react';

interface NutriRankCardProps {
  rankInfo: NutriRankInfo;
  onOpenDetails: () => void;
}

export const NutriRankCard: React.FC<NutriRankCardProps> = ({ rankInfo, onOpenDetails }) => {
  // Select top 3 badges to highlight
  const highlightBadges = rankInfo.badges.slice(0, 3);

  const getBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const props = { className: `w-4 h-4 ${isUnlocked ? 'text-[#FAF7F2]' : 'text-[#7A8B7F]'}` };
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck {...props} />;
      case 'FlaskConical':
        return <FlaskConical {...props} />;
      case 'Leaf':
        return <Leaf {...props} />;
      case 'Droplet':
        return <Droplet {...props} />;
      case 'ShieldAlert':
        return <ShieldAlert {...props} />;
      default:
        return <Award {...props} />;
    }
  };

  return (
    <section className="bg-white dark:bg-[#1A201C] rounded-[32px] p-5 sm:p-7 border border-[#EAE5DC] dark:border-[#27302A] shadow-xs transition-colors space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F6EDE2] dark:bg-[#2A2319] border border-[#EADBCA] dark:border-[#3D3325] flex items-center justify-center text-[#DDA15E] shrink-0 shadow-xs">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#C86446] dark:text-[#E89279]">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Hệ Thống Nutri-Rank</span>
              <span aria-hidden="true" className="text-[#D8D2C6]">·</span>
              <span className="text-[#7A8B7F]">Cấp {rankInfo.tierLevel}/5</span>
            </div>
            <h2 className="font-editorial text-2xl font-normal italic text-[#243B30] dark:text-[#E8EDE9]">
              {rankInfo.tierName}
            </h2>
          </div>
        </div>

        <button
          onClick={onOpenDetails}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#243B30] dark:text-[#FAF7F2] bg-[#FAF7F2] dark:bg-[#151916] hover:bg-[#F0EBE1] dark:hover:bg-[#232B25] border border-[#EAE5DC] dark:border-[#27302A] rounded-full transition-all group"
        >
          <span>Xem tất cả huy hiệu ({rankInfo.unlockedBadgesCount}/{rankInfo.totalBadgesCount})</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#7A8B7F]" />
        </button>
      </div>

      {/* Progress & Stats Bar */}
      <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#151916] border border-[#EAE5DC] dark:border-[#27302A] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#6A786E] dark:text-[#9DAEA3]">
            <Flame className="w-4 h-4 text-[#C86446]" />
            <span>Tiến độ thăng hạng:</span>
            <strong className="text-[#243B30] dark:text-[#E8EDE9] font-mono">{rankInfo.totalXp} XP</strong>
          </div>
          <span className="text-[#7A8B7F] text-[11px]">
            Tiếp theo: <strong className="font-mono text-[#243B30] dark:text-[#E8EDE9]">{rankInfo.nextLevelXp} XP</strong>
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-[#EAE5DC] dark:bg-[#232B25] h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#DDA15E] via-[#C86446] to-[#3D5C4E] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(rankInfo.progressToNextLevel, 8)}%` }}
          />
        </div>

        {/* Unboxed Metadata Stats */}
        <div className="flex flex-wrap items-center justify-between gap-y-2 pt-1 text-[11px] text-[#7A8B7F] dark:text-[#8E9F93]">
          <div className="flex items-center gap-1.5">
            <span>Đã thẩm định:</span>
            <strong className="text-[#243B30] dark:text-[#E8EDE9] font-mono">{rankInfo.scannedProductsCount} nhãn</strong>
          </div>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <div className="flex items-center gap-1.5">
            <span>Độ sạch bình quân:</span>
            <strong className="text-[#3D5C4E] dark:text-[#8FA89B] font-mono font-semibold">{rankInfo.cleanScoreAvg}/100</strong>
          </div>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <div className="flex items-center gap-1.5">
            <span>Cảnh báo phụ gia đã tránh:</span>
            <strong className="text-[#C86446] dark:text-[#E89279] font-mono font-semibold">{rankInfo.passAdditivesAvoided} nhóm</strong>
          </div>
        </div>
      </div>

      {/* Featured Badges Row */}
      <div className="space-y-2">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-[#7A8B7F] dark:text-[#8E9F93] block">
          Huy hiệu tiêu biểu đang tích lũy:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {highlightBadges.map((badge) => (
            <div
              key={badge.id}
              onClick={onOpenDetails}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                badge.isUnlocked
                  ? 'bg-[#F4F7F4] dark:bg-[#1B241E] border-[#D0DAD0] dark:border-[#2C3B30]'
                  : 'bg-[#FAF7F2]/60 dark:bg-[#151916]/60 border-[#EAE5DC] dark:border-[#27302A] opacity-80'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  badge.isUnlocked
                    ? 'bg-[#3D5C4E] text-[#FAF7F2]'
                    : 'bg-[#EAE5DC] dark:bg-[#232B25] text-[#7A8B7F]'
                }`}
              >
                {getBadgeIcon(badge.iconName, badge.isUnlocked)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-semibold text-[#243B30] dark:text-[#E8EDE9] truncate">
                    {badge.name}
                  </h4>
                  {badge.isUnlocked ? (
                    <span className="text-[10px] font-bold text-[#3D5C4E] dark:text-[#8FA89B] shrink-0">
                      Đạt
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#7A8B7F] shrink-0">
                      {badge.currentCount}/{badge.targetCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#7A8B7F] dark:text-[#9DAEA3] truncate">
                  {badge.titleVi}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
