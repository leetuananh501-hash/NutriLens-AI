import {
  DayMealPlan,
  GroceryItem,
  PlannedMealSlot,
  PlannerGoalMode,
  ProductComparisonCriteria,
  ProductComparisonResult,
  ProductLabelAnalysis,
  UserNutritionProfile,
  WeeklyMealPlan,
} from '../types';
import { roundInt } from '../utils/numberFormat';

export interface BodyInsightResult {
  headline: string;
  message: string;
  actionTag: string;
  tone: 'balanced' | 'fiber_low' | 'protein_low' | 'hydration_low' | 'surplus';
}

export function generateBodyInsight(params: {
  totalCalories: number;
  targetCalories: number;
  totalProtein: number;
  targetProtein: number;
  totalFiber: number;
  totalCarbs: number;
  targetCarbs: number;
  totalFat: number;
  targetFat: number;
  waterMl: number;
  targetWaterMl: number;
}): BodyInsightResult {
  const calPct = Math.round((params.totalCalories / Math.max(1, params.targetCalories)) * 100);
  const proteinPct = Math.round((params.totalProtein / Math.max(1, params.targetProtein)) * 100);
  const fiberPct = Math.round((params.totalFiber / 30) * 100);
  const waterPct = Math.round((params.waterMl / Math.max(1, params.targetWaterMl)) * 100);

  if (params.totalCalories === 0) {
    return {
      headline: 'Cơ thể đang sẵn sàng đón nguồn năng lượng sạch đầu ngày',
      message:
        'Hãy bắt đầu bằng một bữa sáng giàu đạm kết hợp chất xơ tự nhiên (như Phở bò ít bánh nhiều rau hoặc Salad trứng bơ) để giữ đường huyết ổn định suốt buổi sáng nhé!',
      actionTag: 'Gợi ý khởi động ngày mới',
      tone: 'balanced',
    };
  }

  if (fiberPct < 60) {
    const proteinPraise =
      proteinPct >= 55
        ? `Đạm hôm nay đạt ${proteinPct}% rất tốt 💪 `
        : `Năng lượng đang ở mức ${calPct}% mục tiêu, `;
    return {
      headline: `Chất xơ mới đạt ${fiberPct}% (${roundInt(params.totalFiber)}g / 30g chuẩn)`,
      message: `${proteinPraise}Nhưng chất xơ mới đạt ${fiberPct}% — hãy thêm 1 đĩa rau luộc, canh chua hoặc 1 phần trái cây ít ngọt vào bữa tối để nuôi hệ vi sinh đường ruột nhé!`,
      actionTag: 'Ưu tiên bổ sung rau xanh',
      tone: 'fiber_low',
    };
  }

  if (proteinPct < 60 && calPct >= 45) {
    return {
      headline: `Lượng đạm hiện mới đạt ${proteinPct}% (${roundInt(params.totalProtein)}g / ${roundInt(params.targetProtein)}g)`,
      message: `Chất xơ hôm nay rất ổn (${fiberPct}%), nhưng lượng đạm nuôi cơ vẫn còn thiếu hụt. Bữa kế tiếp bạn nên bổ sung thêm ức gà, cá hấp, trứng hoặc đậu phụ non để tránh mất cơ nhé!`,
      actionTag: 'Cần thêm đạm phục hồi',
      tone: 'protein_low',
    };
  }

  if (waterPct < 55) {
    return {
      headline: `Cơ thể mới nạp ${waterPct}% lượng nước mục tiêu`,
      message: `Tỷ lệ Đạm (${proteinPct}%) và Chất xơ (${fiberPct}%) đang đi đúng hướng, nhưng bạn đang uống hơi ít nước (${roundInt(params.waterMl)}ml). Hãy bổ sung thêm 1–2 ly nước lọc để trao đổi chất trơn tru hơn!`,
      actionTag: 'Nhắc nhở thủy hóa',
      tone: 'hydration_low',
    };
  }

  if (calPct > 108) {
    const overKcal = roundInt(params.totalCalories - params.targetCalories);
    return {
      headline: `Năng lượng đang dư ${overKcal} kcal so với mục tiêu`,
      message: `Hôm nay bạn đã nạp đầy đủ dưỡng chất (${proteinPct}% đạm, ${fiberPct}% chất xơ). Một buổi đi bộ nhanh 25–30 phút sau bữa tối sẽ giúp cơ thể tiêu hao nhẹ nhàng và ngủ sâu hơn!`,
      actionTag: 'Gợi ý vận động nhẹ',
      tone: 'surplus',
    };
  }

  return {
    headline: 'Nhịp độ dinh dưỡng hôm nay đang cân bằng tuyệt vời',
    message: `Tuyệt vời! Đạm (${proteinPct}%), Chất xơ (${fiberPct}%) và Calo (${calPct}%) đều nằm trong vùng tối ưu cho sức khỏe gia đình & phục hồi tế bào. Tiếp tục duy trì phong độ này nhé!`,
    actionTag: 'Trạng thái lý tưởng',
    tone: 'balanced',
  };
}

const SENSITIVE_ADDITIVE_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /E407|CARRAGEENAN/i, label: 'E407 (Carrageenan - dễ kích ứng ruột trẻ nhỏ)' },
  { pattern: /E150[CD]?|CARAMEL/i, label: 'E150c/d (Màu Caramel công nghiệp)' },
  { pattern: /E621|GLUTAMATE|MSG|BỘT NGỌT/i, label: 'E621 (Bột ngọt / MSG liều cao)' },
  { pattern: /E627|E631|E635|INOSINATE|GUANYLATE/i, label: 'E627/E631 (Siêu bột ngọt tăng Acid Uric)' },
  { pattern: /E950|E951|ASPARTAME|ACESULFAME/i, label: 'E950/E951 (Đường nhân tạo Aspartame)' },
  { pattern: /E211|BENZOATE/i, label: 'E211 (Natri Benzoat bảo quản)' },
  { pattern: /E110|E124|E102|E129|SUNSET|PONCEAU/i, label: 'E110/E124 (Phẩm màu Azo cảnh báo trẻ em)' },
];

function evaluateProductCriteria(product: ProductLabelAnalysis): ProductComparisonCriteria {
  const rawText = product.rawIngredients.join(' ').toLowerCase();
  const hasExplicitSugar =
    product.nutritionAlerts.highSugar ||
    /đường|sugar|glucose|fructose|sucrose|siro|syrup|mạch nha/.test(rawText);

  // Estimate sugar teaspoons visually based on ingredient position & alerts
  let sugarTeaspoons = 0;
  const firstTwoIngredients = product.rawIngredients.slice(0, 2).join(' ').toLowerCase();
  const topFiveIngredients = product.rawIngredients.slice(0, 5).join(' ').toLowerCase();

  if (product.nutritionAlerts.highSugar && /đường|sugar|fructose|syrup/.test(firstTwoIngredients)) {
    sugarTeaspoons = 4;
  } else if (product.nutritionAlerts.highSugar || /đường|sugar|fructose|syrup/.test(topFiveIngredients)) {
    sugarTeaspoons = 3;
  } else if (hasExplicitSugar) {
    sugarTeaspoons = 1;
  }

  const sugarLabel =
    sugarTeaspoons === 0
      ? 'Không đường tinh luyện (~0 thìa)'
      : sugarTeaspoons === 1
      ? 'Ít đường ẩn (~1 thìa cà phê)'
      : `Tương đương ${sugarTeaspoons} thìa cà phê đường`;

  const sugarRisk: 'low' | 'moderate' | 'high' =
    sugarTeaspoons >= 3 ? 'high' : sugarTeaspoons >= 1 ? 'moderate' : 'low';

  // Detect sensitive additives for kids & pregnant mothers
  const sensitiveSet = new Set<string>();
  for (const add of product.additives) {
    const combined = `${add.code} ${add.name}`;
    for (const rule of SENSITIVE_ADDITIVE_PATTERNS) {
      if (rule.pattern.test(combined)) {
        sensitiveSet.add(rule.label);
      }
    }
  }
  for (const raw of product.rawIngredients) {
    for (const rule of SENSITIVE_ADDITIVE_PATTERNS) {
      if (rule.pattern.test(raw)) {
        sensitiveSet.add(rule.label);
      }
    }
  }

  const sensitiveAdditives = Array.from(sensitiveSet);
  const additivesCount = product.additives.length;
  const highConcernCount = product.additives.filter((a) => a.riskLevel === 'high_concern').length;

  // Determine UPF (Ultra-Processed Food) classification
  const cleanScore = roundInt(product.cleanScore);
  let upfLevel: 'minimal' | 'moderate' | 'ultra_processed' = 'moderate';
  let upfLabel = 'Chế biến trung bình (NOVA 3)';

  if (cleanScore >= 78 && additivesCount <= 1 && !product.nutritionAlerts.hasHiddenChemicals) {
    upfLevel = 'minimal';
    upfLabel = 'Nguyên bản / Ít chế biến (Sạch)';
  } else if (cleanScore < 55 || additivesCount >= 3 || product.nutritionAlerts.hasHiddenChemicals) {
    upfLevel = 'ultra_processed';
    upfLabel = 'Siêu chế biến UPF (NOVA 4)';
  }

  return {
    sugarTeaspoons,
    sugarLabel,
    sugarRisk,
    sensitiveAdditives,
    additivesCount,
    highConcernCount,
    upfLevel,
    upfLabel,
    purityScore: cleanScore,
  };
}

export function compareTwoProducts(
  productA: ProductLabelAnalysis,
  productB: ProductLabelAnalysis
): ProductComparisonResult {
  const critA = evaluateProductCriteria(productA);
  const critB = evaluateProductCriteria(productB);

  const scoreA =
    critA.purityScore - critA.highConcernCount * 8 - critA.sugarTeaspoons * 3 - critA.sensitiveAdditives.length * 4;
  const scoreB =
    critB.purityScore - critB.highConcernCount * 8 - critB.sugarTeaspoons * 3 - critB.sensitiveAdditives.length * 4;

  const winner: 'A' | 'B' | 'TIE' =
    Math.abs(scoreA - scoreB) <= 3 && critA.purityScore === critB.purityScore
      ? 'TIE'
      : scoreA >= scoreB
      ? 'A'
      : 'B';

  const buildBadges = (
    crit: ProductComparisonCriteria,
    product: ProductLabelAnalysis,
    isWinner: boolean
  ): { badgeLabel: string; badgeTone: 'buy' | 'consider' | 'warning'; reason: string } => {
    if (winner === 'TIE') {
      return {
        badgeLabel: crit.purityScore >= 75 ? 'Nên mua ✓' : 'Cân nhắc ⚠️',
        badgeTone: crit.purityScore >= 75 ? 'buy' : 'consider',
        reason: `Độ sạch tương đương (${crit.purityScore}/100), ưu tiên chọn sản phẩm ít đường hơn.`,
      };
    }

    if (isWinner) {
      const cleanAdvantages: string[] = [];
      if (crit.additivesCount <= 1) cleanAdvantages.push('gần như không phụ gia');
      if (crit.sugarTeaspoons <= 1) cleanAdvantages.push('rất ít đường');
      if (crit.upfLevel === 'minimal') cleanAdvantages.push('ít qua xử lý công nghiệp');
      return {
        badgeLabel: 'Nên mua ✓',
        badgeTone: 'buy',
        reason:
          cleanAdvantages.length > 0
            ? `Độ sạch vượt trội (${crit.purityScore}/100), ${cleanAdvantages.join(', ')}.`
            : `Ít chất điều vị và bảo quản hơn đối thủ (${crit.purityScore}/100 điểm sạch).`,
      };
    }

    if (crit.sugarRisk === 'high') {
      return {
        badgeLabel: 'Nhiều đường ⚠️',
        badgeTone: 'warning',
        reason: `Chứa ${crit.sugarLabel.toLowerCase()} và ${crit.additivesCount} phụ gia công nghiệp.`,
      };
    }

    if (crit.highConcernCount > 0 || crit.sensitiveAdditives.length > 0) {
      return {
        badgeLabel: 'Cân nhắc ⚠️',
        badgeTone: 'warning',
        reason: `Có ${crit.sensitiveAdditives.length || crit.additivesCount} nhóm phụ gia cần hạn chế cho trẻ nhỏ & bà bầu.`,
      };
    }

    return {
      badgeLabel: product.verdict === 'PASS' ? 'Nên tránh ⚠️' : 'Cân nhắc ⚠️',
      badgeTone: 'consider',
      reason: `Mức độ chế biến cao hơn (${crit.purityScore}/100 điểm sạch).`,
    };
  };

  const badgeA = buildBadges(critA, productA, winner === 'A');
  const badgeB = buildBadges(critB, productB, winner === 'B');

  const winnerProduct = winner === 'A' ? productA : productB;
  const loserProduct = winner === 'A' ? productB : productA;
  const scoreDiff = Math.abs(critA.purityScore - critB.purityScore);

  const summaryVerdict =
    winner === 'TIE'
      ? `Hai sản phẩm "${productA.productName}" và "${productB.productName}" có hồ sơ độ sạch tương đương nhau (${critA.purityScore}/100). Hãy ưu tiên chọn loại có bảng thành phần ngắn hơn và ít muối/đường hơn.`
      : `Khuyên dùng "${winnerProduct.productName}" — đạt điểm độ sạch cao hơn ${scoreDiff} điểm so với "${loserProduct.productName}", đồng thời giảm đáng kể gánh nặng phụ gia tổng hợp và đường ẩn cho cả gia đình.`;

  const sensitiveTotal = critA.sensitiveAdditives.length + critB.sensitiveAdditives.length;
  const familyAdvice =
    sensitiveTotal > 0
      ? 'Lưu ý gia đình có trẻ nhỏ & phụ nữ mang thai: Tránh các mã màu Azo (E110/E124), siêu bột ngọt (E627/E631), đường hóa học (E950/E951) và chất ổn định E407 trong danh mục đối chiếu.'
      : 'Cả hai lựa chọn đều không chứa nhóm phụ gia cảnh báo cao cho trẻ nhỏ; vẫn nên kiểm soát tổng lượng muối và đường tiêu thụ hàng ngày.';

  return {
    winner,
    productA: { ...critA, ...badgeA },
    productB: { ...critB, ...badgeB },
    summaryVerdict,
    familyAdvice,
  };
}

export function mapDietGoalToPlannerMode(dietGoal: UserNutritionProfile['dietGoal']): PlannerGoalMode {
  if (dietGoal === 'lose_weight') return 'lose_weight';
  if (dietGoal === 'gain_muscle') return 'gain_muscle';
  return 'family_clean';
}

interface DayTemplate {
  breakfast: Omit<PlannedMealSlot, 'slot' | 'slotLabel'>;
  lunch: Omit<PlannedMealSlot, 'slot' | 'slotLabel'>;
  snack: Omit<PlannedMealSlot, 'slot' | 'slotLabel'>;
  dinner: Omit<PlannedMealSlot, 'slot' | 'slotLabel'>;
}

const VIETNAMESE_WEEK_TEMPLATES: Record<PlannerGoalMode, DayTemplate[]> = {
  lose_weight: [
    {
      breakfast: { dishName: 'Phở bò tái ít bánh, nhiều hành giá', portionNote: '1 tô vừa (130g bò nạc)', calories: 420, protein: 32, fiber: 4, carbs: 48, fat: 10 },
      lunch: { dishName: 'Ức gà áp chảo sốt mè rang & salad bơ', portionNote: '150g ức gà + 150g rau', calories: 460, protein: 40, fiber: 9, carbs: 22, fat: 22 },
      snack: { dishName: 'Sữa chua Hy Lạp không đường & hạt chia', portionNote: '1 hũ 100g + 10g hạt', calories: 160, protein: 12, fiber: 4, carbs: 14, fat: 6 },
      dinner: { dishName: 'Cá thu kho tộ nhạt & canh chua cá lóc thanh nhiệt', portionNote: '1/2 chén cơm gạo lứt + rau muống luộc', calories: 480, protein: 35, fiber: 8, carbs: 46, fat: 14 },
    },
    {
      breakfast: { dishName: 'Trứng gà ốp la (2 quả) & bánh mì nguyên cám', portionNote: '2 lát bánh mì + dưa leo cà chua', calories: 380, protein: 22, fiber: 5, carbs: 36, fat: 15 },
      lunch: { dishName: 'Bún chả giò hấp & gỏi cuốn tôm thịt', portionNote: '4 cuốn tôm thịt chấm tương nhẹ', calories: 450, protein: 30, fiber: 7, carbs: 52, fat: 12 },
      snack: { dishName: 'Ổi hồng tươi & 10 hạt hạnh nhân rang', portionNote: '1 trái ổi vừa + 12g hạt', calories: 170, protein: 5, fiber: 6, carbs: 20, fat: 8 },
      dinner: { dishName: 'Tôm sú hấp sả & rau cải thìa xào tỏi ít dầu', portionNote: '180g tôm + 200g cải thìa + nửa bát cơm', calories: 440, protein: 38, fiber: 7, carbs: 38, fat: 11 },
    },
    {
      breakfast: { dishName: 'Cháo yến mạch thịt bằm nấm rơm', portionNote: '50g yến mạch + 90g nạc heo', calories: 370, protein: 24, fiber: 6, carbs: 45, fat: 9 },
      lunch: { dishName: 'Cá hồi áp chảo chanh dây & bông cải xanh luộc', portionNote: '140g cá hồi + 120g gạo lứt', calories: 510, protein: 36, fiber: 8, carbs: 42, fat: 21 },
      snack: { dishName: 'Sinh tố bơ sữa hạt không đường', portionNote: '1 ly 220ml', calories: 190, protein: 6, fiber: 5, carbs: 14, fat: 12 },
      dinner: { dishName: 'Đậu phụ non sốt cà chua & canh bí đao tôm khô', portionNote: '200g đậu non + 1 chén cơm nhỏ', calories: 410, protein: 26, fiber: 8, carbs: 46, fat: 12 },
    },
    {
      breakfast: { dishName: 'Bún riêu cua đồng nhiều rau sống', portionNote: '1 tô vừa (bớt bún, thêm rau muống chẻ)', calories: 430, protein: 26, fiber: 6, carbs: 52, fat: 12 },
      lunch: { dishName: 'Cơm gạo lứt thịt bò xào bông cải xanh', portionNote: '130g bò thăn + 200g rau + 100g cơm', calories: 490, protein: 37, fiber: 7, carbs: 48, fat: 15 },
      snack: { dishName: '1 quả chuối chín & 1 ly sữa đậu nành ít đường', portionNote: '250ml sữa + 1 chuối', calories: 185, protein: 9, fiber: 4, carbs: 28, fat: 4 },
      dinner: { dishName: 'Cá diêu hồng hấp gừng hành & rau lang luộc', portionNote: '180g cá hấp + 200g rau lang', calories: 415, protein: 36, fiber: 8, carbs: 34, fat: 12 },
    },
    {
      breakfast: { dishName: 'Bánh cuốn nóng nhân thịt mộc nhĩ & chả lụa nạc', portionNote: '1 phần vừa + nhiều giá trụng', calories: 400, protein: 20, fiber: 4, carbs: 54, fat: 11 },
      lunch: { dishName: 'Salad ức gà nướng mật ong & trứng lòng đào', portionNote: '150g ức gà + 1 trứng + rau trộn giấm táo', calories: 455, protein: 42, fiber: 8, carbs: 24, fat: 19 },
      snack: { dishName: 'Thanh long trắng & hạt điều rang mộc', portionNote: '150g thanh long + 15g hạt điều', calories: 165, protein: 4, fiber: 4, carbs: 21, fat: 7 },
      dinner: { dishName: 'Canh chua cá bớp nấu dọc mùng & đậu bắp', portionNote: '150g cá bớp + 1 chén cơm nhỏ', calories: 450, protein: 33, fiber: 8, carbs: 46, fat: 13 },
    },
    {
      breakfast: { dishName: 'Khoai lang mật hấp & 2 quả trứng gà luộc', portionNote: '180g khoai lang + 2 trứng', calories: 360, protein: 17, fiber: 6, carbs: 48, fat: 11 },
      lunch: { dishName: 'Cơm cá kho tộ ít đường & dưa leo cà chua', portionNote: '140g cá + 120g cơm + 180g rau củ', calories: 495, protein: 33, fiber: 7, carbs: 54, fat: 14 },
      snack: { dishName: 'Táo xanh & bơ đậu phộng nguyên chất', portionNote: '1 quả táo + 1 thìa bơ đậu phộng', calories: 180, protein: 5, fiber: 5, carbs: 22, fat: 8 },
      dinner: { dishName: 'Mực hấp gừng sả & canh cải ngọt thịt bằm', portionNote: '160g mực + 1 tô canh cải lớn', calories: 420, protein: 35, fiber: 7, carbs: 36, fat: 12 },
    },
    {
      breakfast: { dishName: 'Phở gà ta thảo mộc xé phay (bỏ da)', portionNote: '1 tô vừa + hành ngò giá đỗ', calories: 410, protein: 30, fiber: 4, carbs: 50, fat: 9 },
      lunch: { dishName: 'Thịt nạc vai luộc cuốn bánh tráng rau sống', portionNote: '140g nạc heo + mắm nêm dứa + nhiều xà lách', calories: 470, protein: 34, fiber: 8, carbs: 48, fat: 15 },
      snack: { dishName: 'Sữa chua nha đam ít đường & hạt bí xanh', portionNote: '1 hũ + 10g hạt bí', calories: 155, protein: 8, fiber: 3, carbs: 18, fat: 6 },
      dinner: { dishName: 'Canh rong biển đậu phụ non & cá nục nướng giấy bạc', portionNote: '150g cá nục + canh rong biển thanh mát', calories: 435, protein: 36, fiber: 7, carbs: 35, fat: 14 },
    },
  ],
  family_clean: [
    {
      breakfast: { dishName: 'Phở bò thảo mộc Hà Nội nấu tại nhà', portionNote: '1 tô đầy đủ nước xương ninh sạch', calories: 510, protein: 35, fiber: 4, carbs: 62, fat: 13 },
      lunch: { dishName: 'Cơm cá kho tộ, canh chua cá lóc & rau muống luộc', portionNote: '1.5 chén cơm + 140g cá + 1 tô canh chua', calories: 640, protein: 38, fiber: 9, carbs: 78, fat: 16 },
      snack: { dishName: 'Chuối chín & sữa chua men sống ít đường', portionNote: '1 quả chuối + 1 hũ sữa chua', calories: 190, protein: 7, fiber: 4, carbs: 32, fat: 4 },
      dinner: { dishName: 'Ức gà áp chảo sốt mè, đậu que xào tỏi & canh bí đỏ', portionNote: '140g ức gà + 1 chén cơm + rau củ', calories: 560, protein: 38, fiber: 8, carbs: 56, fat: 18 },
    },
    {
      breakfast: { dishName: 'Bánh mì ốp la 2 trứng, dưa leo & ngò rí tươi', portionNote: '1 ổ bánh mì giòn + 2 trứng + ít pate sạch', calories: 460, protein: 22, fiber: 4, carbs: 52, fat: 18 },
      lunch: { dishName: 'Bún bò Huế bắp bò & rau sống bắp chuối', portionNote: '1 tô vừa, thêm nhiều rau thơm', calories: 580, protein: 36, fiber: 6, carbs: 66, fat: 17 },
      snack: { dishName: 'Đĩa trái cây theo mùa (ổi, thanh long, cam)', portionNote: '250g trái cây tươi', calories: 150, protein: 3, fiber: 6, carbs: 34, fat: 1 },
      dinner: { dishName: 'Thịt nạc kho trứng cút nước dừa & dưa giá, canh cải', portionNote: '120g thịt nạc + 3 trứng cút + 1 chén cơm', calories: 620, protein: 34, fiber: 7, carbs: 64, fat: 24 },
    },
    {
      breakfast: { dishName: 'Cháo thịt bằm bí đỏ & hành ngò ấm bụng', portionNote: '1 tô cháo đầy dinh dưỡng', calories: 420, protein: 24, fiber: 5, carbs: 56, fat: 10 },
      lunch: { dishName: 'Cơm cá hồi áp chảo sốt bơ tỏi & măng tây luộc', portionNote: '140g cá hồi + 1.5 chén cơm + măng tây', calories: 630, protein: 38, fiber: 7, carbs: 62, fat: 24 },
      snack: { dishName: 'Sữa hạt óc chó hạnh nhân tự xay', portionNote: '1 ly 250ml ít đường', calories: 180, protein: 6, fiber: 3, carbs: 16, fat: 10 },
      dinner: { dishName: 'Gỏi cuốn tôm thịt rau sống & súp rau củ hầm', portionNote: '5 cuốn tôm thịt + 1 chén súp rau', calories: 520, protein: 32, fiber: 8, carbs: 58, fat: 14 },
    },
    {
      breakfast: { dishName: 'Bún riêu cua đồng đậu rán & rau sống', portionNote: '1 tô riêu cua thanh mát', calories: 490, protein: 27, fiber: 5, carbs: 62, fat: 14 },
      lunch: { dishName: 'Cơm tôm rim mặn ngọt, su su xào & canh rau ngót', portionNote: '150g tôm + 1.5 chén cơm + 2 món rau', calories: 610, protein: 36, fiber: 8, carbs: 74, fat: 15 },
      snack: { dishName: 'Bánh flan trứng sữa ít đường hoặc táo tươi', portionNote: '1 phần nhẹ buổi chiều', calories: 165, protein: 6, fiber: 3, carbs: 22, fat: 6 },
      dinner: { dishName: 'Đậu phụ nhồi thịt sốt cà & canh bầu nấu tôm', portionNote: '2 miếng đậu nhồi + 1 chén cơm + canh bầu', calories: 575, protein: 34, fiber: 8, carbs: 58, fat: 20 },
    },
    {
      breakfast: { dishName: 'Bánh cuốn nhân thịt mộc nhĩ chả quế nạc', portionNote: '1 đĩa vừa + nhiều giá trụng', calories: 440, protein: 21, fiber: 4, carbs: 58, fat: 13 },
      lunch: { dishName: 'Cơm bò lúc lắc ớt chuông hành tây & salad giấm', portionNote: '140g bò thăn + 1.5 chén cơm + salad', calories: 650, protein: 40, fiber: 6, carbs: 68, fat: 22 },
      snack: { dishName: 'Khoai lang tím hấp & 1 ly sữa tươi không đường', portionNote: '1 củ nhỏ + 200ml sữa', calories: 200, protein: 8, fiber: 4, carbs: 32, fat: 4 },
      dinner: { dishName: 'Cá điêu hồng hấp xì dầu nấm đông cô & cải ngọt', portionNote: '170g cá + 1 chén cơm + rau luộc', calories: 540, protein: 36, fiber: 7, carbs: 56, fat: 16 },
    },
    {
      breakfast: { dishName: 'Mì Quảng tôm thịt trứng cút bánh tráng mè', portionNote: '1 tô vừa ít dầu + rau sống bắp chuối', calories: 530, protein: 30, fiber: 5, carbs: 64, fat: 16 },
      lunch: { dishName: 'Cơm gà luộc lá chanh (bỏ da) & nộm bắp cải rau răm', portionNote: '160g thịt gà + cơm nghệ + nộm rau', calories: 615, protein: 40, fiber: 7, carbs: 68, fat: 18 },
      snack: { dishName: 'Chè hạt sen long nhãn ít đường', portionNote: '1 chén nhỏ thanh nhiệt', calories: 170, protein: 4, fiber: 3, carbs: 36, fat: 1 },
      dinner: { dishName: 'Canh chua cá hồi măng chua & đậu bắp luộc chấm kho quẹt', portionNote: '140g cá hồi + 1 chén cơm + rau củ', calories: 570, protein: 34, fiber: 8, carbs: 54, fat: 22 },
    },
    {
      breakfast: { dishName: 'Xôi đậu xanh hạt sen chả lụa sạch', portionNote: '1 gói nhỏ + dưa góp', calories: 450, protein: 19, fiber: 5, carbs: 66, fat: 12 },
      lunch: { dishName: 'Lẩu riêu cua bắp bò gia đình (nhiều rau xanh)', portionNote: '150g bò + riêu cua + bún + nhiều rau mồng tơi', calories: 640, protein: 42, fiber: 8, carbs: 65, fat: 21 },
      snack: { dishName: 'Bưởi da xanh & hạt bí rang', portionNote: '3 múi bưởi + 15g hạt', calories: 160, protein: 5, fiber: 4, carbs: 20, fat: 7 },
      dinner: { dishName: 'Cơm gạo lứt mực xào cần tỏi & canh mướp mồng tơi', portionNote: '150g mực tươi + 1 chén cơm + canh rau', calories: 525, protein: 34, fiber: 8, carbs: 58, fat: 14 },
    },
  ],
  gain_muscle: [
    {
      breakfast: { dishName: 'Phở bò bắp nạm thêm thịt & 2 trứng chần', portionNote: '1 tô lớn (180g bò + 2 trứng)', calories: 660, protein: 50, fiber: 4, carbs: 68, fat: 19 },
      lunch: { dishName: 'Cơm gạo lứt ức gà áp chảo sốt mè & quả bơ', portionNote: '220g ức gà + 2 chén cơm + 1/2 quả bơ', calories: 760, protein: 62, fiber: 10, carbs: 74, fat: 22 },
      snack: { dishName: 'Chuối chín, yến mạch & sữa chua Hy Lạp hạt chia', portionNote: '2 chuối + 150g sữa chua + 30g yến mạch', calories: 360, protein: 18, fiber: 7, carbs: 56, fat: 7 },
      dinner: { dishName: 'Cá hồi áp chảo, khoai lang nướng & bông cải xanh', portionNote: '180g cá hồi + 250g khoai lang + rau xanh', calories: 680, protein: 46, fiber: 9, carbs: 62, fat: 26 },
    },
    {
      breakfast: { dishName: 'Bánh mì nguyên cám 3 trứng ốp la & thịt bò áp chảo', portionNote: '2 lát bánh mì + 3 trứng + 100g bò', calories: 620, protein: 44, fiber: 6, carbs: 48, fat: 26 },
      lunch: { dishName: 'Cơm tấm sườn nạc (ít mỡ) & chả trứng hấp', portionNote: '180g sườn nạc + 2 chén cơm + dưa leo', calories: 790, protein: 52, fiber: 6, carbs: 90, fat: 22 },
      snack: { dishName: 'Sinh tố bơ chuối bơ đậu phộng sữa tươi', portionNote: '1 ly lớn 350ml giàu năng lượng', calories: 390, protein: 16, fiber: 6, carbs: 42, fat: 18 },
      dinner: { dishName: 'Tôm sú rim tỏi ớt & canh chua cá thu thanh nhiệt', portionNote: '200g tôm + 120g cá thu + 1.5 chén cơm', calories: 660, protein: 54, fiber: 7, carbs: 66, fat: 18 },
    },
    {
      breakfast: { dishName: 'Bún bò Huế nhiều bắp bò, chả cua & giá sống', portionNote: '1 tô lớn giàu sắt & đạm', calories: 650, protein: 46, fiber: 5, carbs: 72, fat: 18 },
      lunch: { dishName: 'Cơm bò lúc lắc thăn nội & salad trứng bơ', portionNote: '200g bò thăn + 2 chén cơm + salad', calories: 780, protein: 56, fiber: 7, carbs: 82, fat: 24 },
      snack: { dishName: '2 quả trứng gà luộc & 2 củ khoai lang mật', portionNote: 'Bữa trước tập 60 phút', calories: 340, protein: 16, fiber: 6, carbs: 50, fat: 9 },
      dinner: { dishName: 'Ức gà sốt tiêu đen, đậu phụ non & rau cải thìa', portionNote: '200g ức gà + 100g đậu phụ + 1.5 chén cơm', calories: 670, protein: 58, fiber: 8, carbs: 68, fat: 16 },
    },
    {
      breakfast: { dishName: 'Xôi thịt gà xé phay (bỏ da) & trứng ốp la', portionNote: '1 phần xôi lớn + 150g gà xé + 1 trứng', calories: 630, protein: 42, fiber: 4, carbs: 76, fat: 16 },
      lunch: { dishName: 'Cơm cá kho tộ & thịt nạc vai luộc cuốn rau', portionNote: '160g cá + 100g nạc heo + 2 chén cơm', calories: 770, protein: 54, fiber: 7, carbs: 86, fat: 21 },
      snack: { dishName: 'Sữa đậu nành giàu đạm & hạt hạnh nhân, chuối', portionNote: '300ml sữa + 25g hạnh nhân + 1 chuối', calories: 350, protein: 16, fiber: 6, carbs: 36, fat: 16 },
      dinner: { dishName: 'Mực ống nhồi thịt bằm hấp gừng & canh bí đỏ', portionNote: '220g mực nhồi + 1.5 chén cơm + canh', calories: 650, protein: 48, fiber: 7, carbs: 66, fat: 19 },
    },
    {
      breakfast: { dishName: 'Cháo yến mạch thịt bò bằm & 2 lòng trắng + 1 trứng nguyên', portionNote: '70g yến mạch + 120g bò + trứng', calories: 590, protein: 44, fiber: 7, carbs: 64, fat: 16 },
      lunch: { dishName: 'Cơm gà xé (bỏ da) + gỏi bắp chuối & canh chua', portionNote: '220g ức đùi gà + 2 chén cơm + gỏi', calories: 760, protein: 56, fiber: 8, carbs: 84, fat: 19 },
      snack: { dishName: 'Sữa chua Hy Lạp, dâu tây & granola ít đường', portionNote: '150g sữa chua + 40g granola', calories: 320, protein: 18, fiber: 5, carbs: 38, fat: 10 },
      dinner: { dishName: 'Cá thu nướng giấy bạc, trứng hấp nấm & rau muống xào', portionNote: '180g cá thu + 1.5 chén cơm + rau xanh', calories: 690, protein: 50, fiber: 8, carbs: 66, fat: 23 },
    },
    {
      breakfast: { dishName: 'Mì Quảng tôm thịt gà xé thêm trứng cút', portionNote: '1 tô lớn + bánh tráng mè', calories: 640, protein: 42, fiber: 5, carbs: 74, fat: 18 },
      lunch: { dishName: 'Cơm thịt bò xào cần tỏi & đậu phụ sốt cà chua', portionNote: '180g bò + 100g đậu + 2 chén cơm', calories: 750, protein: 54, fiber: 8, carbs: 80, fat: 22 },
      snack: { dishName: 'Bánh mì đen kẹp bơ đậu phộng & chuối lát', portionNote: '2 lát bánh mì + 2 thìa bơ đậu phộng + 1 chuối', calories: 380, protein: 13, fiber: 7, carbs: 46, fat: 16 },
      dinner: { dishName: 'Thịt nạc kho trứng cút & canh cải xanh thịt bằm', portionNote: '160g nạc heo + 4 trứng cút + 1.5 chén cơm', calories: 680, protein: 48, fiber: 7, carbs: 66, fat: 22 },
    },
    {
      breakfast: { dishName: 'Bún riêu cua đồng thêm giò nạc & thịt bò', portionNote: '1 tô đầy đặn hậu tập cuối tuần', calories: 620, protein: 44, fiber: 6, carbs: 70, fat: 16 },
      lunch: { dishName: 'Cơm cá hồi áp chảo & ức gà nướng thảo mộc', portionNote: '120g cá hồi + 120g ức gà + 2 chén cơm', calories: 790, protein: 60, fiber: 8, carbs: 78, fat: 24 },
      snack: { dishName: 'Trái cây trộn sữa chua & hạt điều rang mộc', portionNote: '200g trái cây + sữa chua + 20g hạt', calories: 330, protein: 13, fiber: 5, carbs: 42, fat: 12 },
      dinner: { dishName: 'Gỏi cuốn tôm thịt nhiều đạm & canh rong biển thịt bò', portionNote: '6 cuốn tôm thịt + 1 tô canh bò rong biển', calories: 640, protein: 48, fiber: 8, carbs: 68, fat: 16 },
    },
  ],
};

const GROCERY_BUNDLES: Record<PlannerGoalMode, Array<Omit<GroceryItem, 'checked'>>> = {
  lose_weight: [
    { id: 'g-1', name: 'Ức gà tươi không da', quantity: '800g', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-2', name: 'Cá thu / Cá lóc / Cá diêu hồng tươi', quantity: '700g', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-3', name: 'Thịt bò thăn & thịt nạc vai', quantity: '500g', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-4', name: 'Tôm sú tươi & mực ống', quantity: '450g', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-5', name: 'Trứng gà ta & đậu phụ non', quantity: '10 quả trứng + 2 hộp đậu', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-6', name: 'Rau muống, cải thìa, rau lang & xà lách', quantity: '4 bó lớn', category: 'produce', categoryLabel: 'Rau Củ & Trái Cây' },
    { id: 'g-7', name: 'Bông cải xanh, cà chua, dưa leo, dọc mùng', quantity: '1.2 kg', category: 'produce', categoryLabel: 'Rau Củ & Trái Cây' },
    { id: 'g-8', name: 'Bơ sáp, chuối, ổi hồng & thanh long', quantity: '1 nải chuối + 2 bơ + 1kg quả', category: 'produce', categoryLabel: 'Rau Củ & Trái Cây' },
    { id: 'g-9', name: 'Gạo lứt dẻo, yến mạch cán dẹt & khoai lang mật', quantity: '1kg gạo lứt + 500g yến mạch + 500g khoai', category: 'grains', categoryLabel: 'Tinh Bột Chậm' },
    { id: 'g-10', name: 'Sữa chua Hy Lạp không đường, hạt chia & nước mắm cốt', quantity: '4 hũ + 1 túi hạt chia + 1 chai mắm truyền thống', category: 'pantry', categoryLabel: 'Gia Vị Sạch & Sữa' },
  ],
  family_clean: [
    { id: 'g-1', name: 'Cá lóc / Cá hồi / Cá diêu hồng tươi', quantity: '900g', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-2', name: 'Thịt bò bắp, thịt thăn & thịt nạc vai', quantity: '800g', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-3', name: 'Ức gà & thịt gà ta nguyên con chặt sẵn', quantity: '900g', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-4', name: 'Tôm đất tươi, cua đồng xay & mực ống', quantity: '600g', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-5', name: 'Trứng gà, trứng cút & đậu phụ sạch', quantity: '12 trứng gà + 1 vỉ trứng cút + 3 bìa đậu', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-6', name: 'Rau muống, mồng tơi, cải ngọt & rau ngót', quantity: '5 bó rau xanh', category: 'produce', categoryLabel: 'Rau Củ & Trái Cây' },
    { id: 'g-7', name: 'Bí đỏ, bầu xanh, măng tây, cà chua, dưa leo & thơm', quantity: '1.8 kg rau củ nấu canh', category: 'produce', categoryLabel: 'Rau Củ & Trái Cây' },
    { id: 'g-8', name: 'Chuối chín, bưởi da xanh, ổi & cam sành', quantity: '1 nải chuối + 1 quả bưởi + 1kg cam ổi', category: 'produce', categoryLabel: 'Rau Củ & Trái Cây' },
    { id: 'g-9', name: 'Gạo ST25 / gạo lứt, bánh phở tươi & bún tươi', quantity: '2kg gạo + 500g phở + 500g bún', category: 'grains', categoryLabel: 'Tinh Bột Chậm' },
    { id: 'g-10', name: 'Nước mắm cốt cá cơm, bột nêm nấm hữu cơ & sữa chua', quantity: '1 chai mắm sạch + 1 gói nêm nấm + 6 hũ sữa chua', category: 'pantry', categoryLabel: 'Gia Vị Sạch & Sữa' },
  ],
  gain_muscle: [
    { id: 'g-1', name: 'Ức gà tươi & đùi gà lọc xương', quantity: '1.4 kg', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-2', name: 'Thịt bò thăn & bắp bò hoa', quantity: '1.0 kg', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-3', name: 'Cá hồi phi lê & cá thu tươi', quantity: '850g', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-4', name: 'Tôm sú, mực ống & thịt nạc vai heo', quantity: '900g', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-5', name: 'Trứng gà ta, trứng cút & đậu phụ non', quantity: '20 quả trứng gà + 4 bìa đậu', category: 'protein', categoryLabel: 'Thịt, Cá & Đạm' },
    { id: 'g-6', name: 'Bông cải xanh, rau muống, cải thìa & cần tỏi tây', quantity: '5 bó + 2 cây bông cải', category: 'produce', categoryLabel: 'Rau Củ & Trái Cây' },
    { id: 'g-7', name: 'Quả bơ sáp, chuối chín & trái cây trộn', quantity: '3 quả bơ + 2 nải chuối', category: 'produce', categoryLabel: 'Rau Củ & Trái Cây' },
    { id: 'g-8', name: 'Gạo lứt, khoai lang mật & yến mạch nguyên hạt', quantity: '2kg gạo + 1.2kg khoai lang + 500g yến mạch', category: 'grains', categoryLabel: 'Tinh Bột Chậm' },
    { id: 'g-9', name: 'Bánh mì nguyên cám & granola ít đường', quantity: '1 ổ bánh mì đen + 1 gói granola', category: 'grains', categoryLabel: 'Tinh Bột Chậm' },
    { id: 'g-10', name: 'Sữa chua Hy Lạp, bơ đậu phộng nguyên chất & hạnh nhân', quantity: '6 hũ sữa chua + 1 lọ bơ đậu phộng + 250g hạt', category: 'pantry', categoryLabel: 'Gia Vị Sạch & Sữa' },
  ],
};

const DAY_LABELS = [
  { full: 'Thứ 2', short: 'T2' },
  { full: 'Thứ 3', short: 'T3' },
  { full: 'Thứ 4', short: 'T4' },
  { full: 'Thứ 5', short: 'T5' },
  { full: 'Thứ 6', short: 'T6' },
  { full: 'Thứ 7', short: 'T7' },
  { full: 'Chủ Nhật', short: 'CN' },
];

export function buildVietnameseWeeklyMealPlan(
  goalMode: PlannerGoalMode,
  targetCalories: number
): WeeklyMealPlan {
  const templates = VIETNAMESE_WEEK_TEMPLATES[goalMode];
  const baseDefaultCalories =
    goalMode === 'lose_weight' ? 1500 : goalMode === 'gain_muscle' ? 2450 : 1900;
  const scaleFactor = Math.max(0.8, Math.min(1.3, targetCalories / baseDefaultCalories));

  const scaleSlot = (
    slot: PlannedMealSlot['slot'],
    slotLabel: string,
    raw: Omit<PlannedMealSlot, 'slot' | 'slotLabel'>
  ): PlannedMealSlot => ({
    slot,
    slotLabel,
    dishName: raw.dishName,
    portionNote: raw.portionNote,
    calories: roundInt(raw.calories * scaleFactor),
    protein: roundInt(raw.protein * scaleFactor),
    fiber: roundInt(raw.fiber * scaleFactor),
    carbs: roundInt(raw.carbs * scaleFactor),
    fat: roundInt(raw.fat * scaleFactor),
  });

  const days: DayMealPlan[] = templates.map((tpl, idx) => {
    const meals: PlannedMealSlot[] = [
      scaleSlot('breakfast', 'Bữa Sáng', tpl.breakfast),
      scaleSlot('lunch', 'Bữa Trưa', tpl.lunch),
      scaleSlot('snack', 'Bữa Phụ', tpl.snack),
      scaleSlot('dinner', 'Bữa Tối', tpl.dinner),
    ];

    const totalCalories = roundInt(meals.reduce((s, m) => s + m.calories, 0));
    const totalProtein = roundInt(meals.reduce((s, m) => s + m.protein, 0));
    const totalFiber = roundInt(meals.reduce((s, m) => s + m.fiber, 0));

    return {
      dayIndex: idx,
      dayLabel: DAY_LABELS[idx].full,
      shortLabel: DAY_LABELS[idx].short,
      totalCalories,
      totalProtein,
      totalFiber,
      meals,
    };
  });

  const goalTitle =
    goalMode === 'lose_weight'
      ? 'Giảm mỡ thâm hụt lành mạnh'
      : goalMode === 'gain_muscle'
      ? 'Nuôi dưỡng & phát triển cơ bắp'
      : 'Ăn sạch cân bằng cho cả gia đình';

  const groceryList: GroceryItem[] = GROCERY_BUNDLES[goalMode].map((item) => ({
    ...item,
    checked: false,
  }));

  return {
    goalMode,
    goalTitle,
    dailyCalorieTarget: roundInt(targetCalories),
    generatedAt: new Date().toISOString(),
    source: 'local',
    days,
    groceryList,
  };
}
