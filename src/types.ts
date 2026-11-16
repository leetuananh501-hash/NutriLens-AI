export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodIngredient {
  name: string;
  weightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AnalyzedMeal {
  dishName: string;
  vietnameseName: string;
  estimatedTotalGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ingredients: FoodIngredient[];
  healthScore: number;
  healthSummary: string;
  dietaryTags: string[];
  advice: string;
}

export interface MealLogEntry extends AnalyzedMeal {
  id: string;
  mealType: MealType;
  loggedAt: string;
  imageUrl?: string;
}

export type RiskLevel = 'safe' | 'moderate' | 'high_concern';

export interface ChemicalAdditive {
  code: string;
  name: string;
  category: string;
  riskLevel: RiskLevel;
  purpose: string;
  healthEffects: string;
}

export interface NutritionAlerts {
  highSodium: boolean;
  highSugar: boolean;
  transFat: boolean;
  hasHiddenChemicals: boolean;
}

export interface ProductLabelAnalysis {
  productName: string;
  brandName?: string;
  category: string;
  verdict: 'BUY' | 'CONSIDER' | 'PASS';
  verdictHeadline: string;
  cleanScore: number;
  summary: string;
  rawIngredients: string[];
  additives: ChemicalAdditive[];
  healthWarnings: string[];
  nutritionAlerts: NutritionAlerts;
  betterAlternatives: string[];
  labelImageUrl?: string;
  scannedAt?: string;
}

export interface UserNutritionProfile {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetWaterMl: number;
  currentWeight: number;
  goalWeight: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  dietGoal: 'lose_weight' | 'maintain' | 'gain_muscle';
}

export type BadgeCategory = 'additive' | 'clean_food' | 'fiber' | 'hydration' | 'mindfulness';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface NutriBadge {
  id: string;
  name: string; // e.g., 'Health Warrior'
  titleVi: string; // 'Chiến Binh Sức Khỏe'
  description: string;
  criteria: string;
  iconName: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  isUnlocked: boolean;
  progressPercent: number; // 0 - 100
  currentCount: number;
  targetCount: number;
  unit: string;
  unlockedAt?: string;
  rewardXp: number;
}

export interface NutriRankInfo {
  tierName: string; // 'Chiến Binh Thực Dưỡng'
  tierEnglish: string; // 'Health Warrior'
  tierLevel: number; // 1 to 5
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressToNextLevel: number; // 0 - 100
  unlockedBadgesCount: number;
  totalBadgesCount: number;
  cleanScoreAvg: number;
  scannedProductsCount: number;
  passAdditivesAvoided: number;
  badges: NutriBadge[];
}

export type PlannerGoalMode = 'lose_weight' | 'family_clean' | 'gain_muscle';

export interface PlannedMealSlot {
  slot: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  slotLabel: string;
  dishName: string;
  portionNote: string;
  calories: number;
  protein: number;
  fiber: number;
  carbs: number;
  fat: number;
}

export interface DayMealPlan {
  dayIndex: number; // 0 = Thứ 2 ... 6 = Chủ Nhật
  dayLabel: string;
  shortLabel: string;
  totalCalories: number;
  totalProtein: number;
  totalFiber: number;
  meals: PlannedMealSlot[];
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: 'protein' | 'produce' | 'grains' | 'pantry';
  categoryLabel: string;
  checked: boolean;
}

export interface WeeklyMealPlan {
  goalMode: PlannerGoalMode;
  goalTitle: string;
  dailyCalorieTarget: number;
  generatedAt: string;
  source: 'ai' | 'local';
  days: DayMealPlan[];
  groceryList: GroceryItem[];
}

export interface ProductComparisonCriteria {
  sugarTeaspoons: number;
  sugarLabel: string;
  sugarRisk: 'low' | 'moderate' | 'high';
  sensitiveAdditives: string[];
  additivesCount: number;
  highConcernCount: number;
  upfLevel: 'minimal' | 'moderate' | 'ultra_processed';
  upfLabel: string;
  purityScore: number;
}

export interface ProductComparisonResult {
  winner: 'A' | 'B' | 'TIE';
  productA: ProductComparisonCriteria & {
    badgeLabel: string;
    badgeTone: 'buy' | 'consider' | 'warning';
    reason: string;
  };
  productB: ProductComparisonCriteria & {
    badgeLabel: string;
    badgeTone: 'buy' | 'consider' | 'warning';
    reason: string;
  };
  summaryVerdict: string;
  familyAdvice: string;
}

