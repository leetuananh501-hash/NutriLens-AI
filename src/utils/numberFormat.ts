import { AnalyzedMeal, ProductLabelAnalysis } from '../types';

/**
 * Safely convert any numeric/string value to a rounded integer (units place).
 * Prevents IEEE-754 floating-point precision artifacts like 11.399999999999999.
 */
export function roundInt(value: unknown, fallback = 0): number {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? Math.round(num) : fallback;
}

/**
 * Normalize all numeric nutrition values on an AnalyzedMeal to whole integers.
 */
export function normalizeMealNumbers(meal: AnalyzedMeal): AnalyzedMeal {
  return {
    ...meal,
    estimatedTotalGrams: roundInt(meal.estimatedTotalGrams),
    calories: roundInt(meal.calories),
    protein: roundInt(meal.protein),
    carbs: roundInt(meal.carbs),
    fat: roundInt(meal.fat),
    fiber: roundInt(meal.fiber),
    healthScore: Math.max(1, Math.min(10, roundInt(meal.healthScore, 7))),
    ingredients: Array.isArray(meal.ingredients)
      ? meal.ingredients.map((ing) => ({
          ...ing,
          weightGrams: roundInt(ing.weightGrams),
          calories: roundInt(ing.calories),
          protein: roundInt(ing.protein),
          carbs: roundInt(ing.carbs),
          fat: roundInt(ing.fat),
        }))
      : [],
  };
}

/**
 * Normalize numeric values on a ProductLabelAnalysis to whole integers.
 */
export function normalizeLabelNumbers(label: ProductLabelAnalysis): ProductLabelAnalysis {
  return {
    ...label,
    cleanScore: Math.max(0, Math.min(100, roundInt(label.cleanScore, 50))),
  };
}
