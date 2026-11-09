import { MealLogEntry, ProductLabelAnalysis, NutriBadge, NutriRankInfo } from '../types';

export const TIERS = [
  { level: 1, name: 'Người Khởi Hành Thực Dưỡng', english: 'Mindful Starter', minXp: 0, maxXp: 180 },
  { level: 2, name: 'Nhà Khám Phá Nhãn Sạch', english: 'Clean Label Scout', minXp: 180, maxXp: 450 },
  { level: 3, name: 'Chiến Binh Sức Khỏe', english: 'Health Warrior', minXp: 450, maxXp: 850 },
  { level: 4, name: 'Chuyên Gia Phụ Gia & Lối Sống', english: 'Additive Expert', minXp: 850, maxXp: 1400 },
  { level: 5, name: 'Bậc Thầy Sống Khỏe & Tươi Trẻ', english: 'Feel Better Master', minXp: 1400, maxXp: 2200 },
];

export function calculateNutriRank(
  labels: ProductLabelAnalysis[],
  meals: MealLogEntry[],
  waterMl: number = 0
): NutriRankInfo {
  const totalLabels = labels.length;
  const buyLabels = labels.filter((l) => l.verdict === 'BUY');
  const passLabels = labels.filter((l) => l.verdict === 'PASS');
  const totalAdditivesIdentified = labels.reduce((acc, l) => acc + (l.additives?.length || 0), 0);
  const totalFiberToday = meals.reduce((acc, m) => acc + (m.fiber || 0), 0);
  const highHealthMeals = meals.filter((m) => (m.healthScore || 0) >= 80);

  // Compute Clean Score average
  const totalCleanScores = labels.reduce((acc, l) => acc + (l.cleanScore || 0), 0);
  const cleanScoreAvg = totalLabels > 0 ? Math.round(totalCleanScores / totalLabels) : 85;

  // Define Badge catalog
  const badges: NutriBadge[] = [
    {
      id: 'health_warrior',
      name: 'Health Warrior',
      titleVi: 'Chiến Binh Sức Khỏe',
      description: 'Lựa chọn các sản phẩm & bữa ăn đạt chuẩn dinh dưỡng tự nhiên cao (điểm từ 80+).',
      criteria: 'Quét & chọn tối thiểu 3 sản phẩm Nên Mua (BUY) hoặc bữa ăn đạt 80+ điểm.',
      iconName: 'ShieldCheck',
      category: 'clean_food',
      rarity: 'epic',
      isUnlocked: buyLabels.length + highHealthMeals.length >= 3,
      currentCount: Math.min(buyLabels.length + highHealthMeals.length, 3),
      targetCount: 3,
      unit: 'mục',
      progressPercent: Math.min(Math.round(((buyLabels.length + highHealthMeals.length) / 3) * 100), 100),
      rewardXp: 150,
      unlockedAt: buyLabels.length + highHealthMeals.length >= 3 ? 'Đã kích hoạt' : undefined,
    },
    {
      id: 'additive_expert',
      name: 'Additive Expert',
      titleVi: 'Chuyên Gia Phụ Gia',
      description: 'Bóc tách mã E-numbers, chất tạo ngọt và phụ gia nhân tạo trên bao bì đóng gói.',
      criteria: 'Quét từ 3 sản phẩm chứa phụ gia hoặc nhận diện thành công từ 5 mã E-numbers.',
      iconName: 'FlaskConical',
      category: 'additive',
      rarity: 'rare',
      isUnlocked: totalAdditivesIdentified >= 5 || totalLabels >= 3,
      currentCount: Math.min(totalAdditivesIdentified, 5),
      targetCount: 5,
      unit: 'chất',
      progressPercent: Math.min(Math.round((totalAdditivesIdentified / 5) * 100), 100),
      rewardXp: 120,
      unlockedAt: totalAdditivesIdentified >= 5 || totalLabels >= 3 ? 'Đã kích hoạt' : undefined,
    },
    {
      id: 'clean_food_hunter',
      name: 'Clean Food Hunter',
      titleVi: 'Thợ Săn Thực Phẩm Sạch',
      description: 'Khám phá và xây dựng giỏ hàng thực dưỡng sạch, giàu nguyên liệu toàn phần.',
      criteria: 'Lưu trữ từ 4 sản phẩm sạch điểm Clean Score ≥ 80 vào nhật ký.',
      iconName: 'Sparkles',
      category: 'clean_food',
      rarity: 'rare',
      isUnlocked: buyLabels.filter((l) => l.cleanScore >= 80).length >= 4,
      currentCount: Math.min(buyLabels.filter((l) => l.cleanScore >= 80).length, 4),
      targetCount: 4,
      unit: 'sản phẩm',
      progressPercent: Math.min(Math.round((buyLabels.filter((l) => l.cleanScore >= 80).length / 4) * 100), 100),
      rewardXp: 100,
      unlockedAt: buyLabels.filter((l) => l.cleanScore >= 80).length >= 4 ? 'Đã kích hoạt' : undefined,
    },
    {
      id: 'fiber_champion',
      name: 'Fiber Champion',
      titleVi: 'Vô Địch Chất Xơ',
      description: 'Cung cấp năng lượng cho hệ vi sinh đường ruột với chất xơ thực vật dồi dào.',
      criteria: 'Nạp tối thiểu 25g chất xơ tự nhiên trong ngày theo chuẩn Deliciously Ella.',
      iconName: 'Leaf',
      category: 'fiber',
      rarity: 'epic',
      isUnlocked: totalFiberToday >= 25,
      currentCount: Math.round(totalFiberToday),
      targetCount: 25,
      unit: 'g xơ',
      progressPercent: Math.min(Math.round((totalFiberToday / 25) * 100), 100),
      rewardXp: 140,
      unlockedAt: totalFiberToday >= 25 ? 'Đã đạt hôm nay' : undefined,
    },
    {
      id: 'hydration_master',
      name: 'Hydration Master',
      titleVi: 'Bậc Thầy Thủy Hóa',
      description: 'Duy trì làn da và cơ thể luôn tràn đầy sức sống với lượng nước khoáng lý tưởng.',
      criteria: 'Đạt tối thiểu 2.000ml nước trong một ngày.',
      iconName: 'Droplet',
      category: 'hydration',
      rarity: 'common',
      isUnlocked: waterMl >= 2000,
      currentCount: waterMl,
      targetCount: 2000,
      unit: 'ml',
      progressPercent: Math.min(Math.round((waterMl / 2000) * 100), 100),
      rewardXp: 80,
      unlockedAt: waterMl >= 2000 ? 'Đã đạt hôm nay' : undefined,
    },
    {
      id: 'codex_guardian',
      name: 'Codex Guardian',
      titleVi: 'Vệ Binh Tiêu Chuẩn Codex',
      description: 'Tỉnh táo phát hiện và loại bỏ các loại gia vị, sốt ướp chứa phụ gia rủi ro cao.',
      criteria: 'Soi & phát hiện thành công 2 sản phẩm thuộc nhóm Nên Tránh (PASS).',
      iconName: 'ShieldAlert',
      category: 'additive',
      rarity: 'rare',
      isUnlocked: passLabels.length >= 2,
      currentCount: Math.min(passLabels.length, 2),
      targetCount: 2,
      unit: 'nhãn',
      progressPercent: Math.min(Math.round((passLabels.length / 2) * 100), 100),
      rewardXp: 110,
      unlockedAt: passLabels.length >= 2 ? 'Đã kích hoạt' : undefined,
    },
    {
      id: 'mindful_ritualist',
      name: 'Mindful Ritualist',
      titleVi: 'Nghi Thức Lành Mạnh',
      description: 'Lắng nghe cơ thể và ghi nhận đầy đủ các bữa ăn để xây dựng phản xạ dinh dưỡng.',
      criteria: 'Ghi nhận từ 3 bữa ăn lành mạnh trong ngày.',
      iconName: 'HeartHandshake',
      category: 'mindfulness',
      rarity: 'common',
      isUnlocked: meals.length >= 3,
      currentCount: Math.min(meals.length, 3),
      targetCount: 3,
      unit: 'bữa',
      progressPercent: Math.min(Math.round((meals.length / 3) * 100), 100),
      rewardXp: 90,
      unlockedAt: meals.length >= 3 ? 'Đã hoàn thành' : undefined,
    },
    {
      id: 'feel_better_legend',
      name: 'Feel Better Legend',
      titleVi: 'Huyền Thoại Feel Better',
      description: 'Bậc thầy thẩm định nhãn mác & dinh dưỡng tự nhiên chuẩn Deliciously Ella.',
      criteria: 'Mở khóa tối thiểu 5 huy hiệu và tích lũy trên 600 điểm XP.',
      iconName: 'Trophy',
      category: 'clean_food',
      rarity: 'legendary',
      isUnlocked: false, // Calculated dynamically below
      currentCount: 0,
      targetCount: 5,
      unit: 'huy hiệu',
      progressPercent: 0,
      rewardXp: 300,
    },
  ];

  // Calculate base XP:
  // - 25 XP per scanned label
  // - 15 XP per additive decoded
  // - 35 XP per BUY verdict product
  // - 20 XP per logged meal
  // - 30 XP if water >= 1500ml
  // - plus XP from each unlocked badge!
  let baseActivityXp =
    totalLabels * 25 +
    totalAdditivesIdentified * 15 +
    buyLabels.length * 35 +
    meals.length * 20 +
    (waterMl >= 1500 ? 30 : 0) +
    (totalFiberToday >= 20 ? 40 : 0);

  let badgeXp = 0;
  let unlockedCount = 0;

  badges.forEach((b) => {
    if (b.id !== 'feel_better_legend' && b.isUnlocked) {
      badgeXp += b.rewardXp;
      unlockedCount += 1;
    }
  });

  // Evaluate the legendary badge
  const legendBadge = badges.find((b) => b.id === 'feel_better_legend');
  if (legendBadge) {
    legendBadge.currentCount = unlockedCount;
    legendBadge.progressPercent = Math.min(Math.round((unlockedCount / 5) * 100), 100);
    if (unlockedCount >= 5 && baseActivityXp + badgeXp >= 600) {
      legendBadge.isUnlocked = true;
      legendBadge.unlockedAt = 'Đã mở khóa';
      badgeXp += legendBadge.rewardXp;
      unlockedCount += 1;
    }
  }

  const totalXp = baseActivityXp + badgeXp;

  // Determine current tier
  let activeTier = TIERS[0];
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (totalXp >= TIERS[i].minXp) {
      activeTier = TIERS[i];
      break;
    }
  }

  const currentLevelXp = totalXp - activeTier.minXp;
  const levelSpan = activeTier.maxXp - activeTier.minXp;
  const progressToNextLevel = Math.min(Math.round((currentLevelXp / levelSpan) * 100), 100);

  return {
    tierName: activeTier.name,
    tierEnglish: activeTier.english,
    tierLevel: activeTier.level,
    totalXp,
    currentLevelXp: totalXp,
    nextLevelXp: activeTier.maxXp,
    progressToNextLevel,
    unlockedBadgesCount: unlockedCount,
    totalBadgesCount: badges.length,
    cleanScoreAvg,
    scannedProductsCount: totalLabels,
    passAdditivesAvoided: passLabels.length,
    badges,
  };
}
