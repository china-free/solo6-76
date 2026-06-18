import type { BudgetLevel, BudgetEstimate } from '@/types';

const budgetPerDay: Record<BudgetLevel, { min: number; max: number }> = {
  economy: { min: 300, max: 500 },
  comfortable: { min: 600, max: 1000 },
  luxury: { min: 1200, max: 2000 },
};

const categoryRatio: Record<keyof BudgetEstimate, number> = {
  transportation: 0.25,
  accommodation: 0.30,
  food: 0.20,
  tickets: 0.15,
  shopping: 0.05,
  other: 0.05,
};

export function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

export function calculateBudgetEstimate(
  days: number,
  travelers: number,
  budgetLevel: BudgetLevel
): BudgetEstimate {
  const range = budgetPerDay[budgetLevel];
  const avgPerDay = (range.min + range.max) / 2;
  const totalBudget = avgPerDay * days * travelers;

  const estimate: BudgetEstimate = {
    transportation: Math.round(totalBudget * categoryRatio.transportation),
    accommodation: Math.round(totalBudget * categoryRatio.accommodation),
    food: Math.round(totalBudget * categoryRatio.food),
    tickets: Math.round(totalBudget * categoryRatio.tickets),
    shopping: Math.round(totalBudget * categoryRatio.shopping),
    other: Math.round(totalBudget * categoryRatio.other),
  };

  return estimate;
}

export function sumBudget(budget: BudgetEstimate): number {
  return Object.values(budget).reduce((sum, val) => sum + val, 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export function getBudgetStatus(
  totalBudget: number,
  totalSpent: number
): { status: 'ok' | 'warning' | 'danger'; percentage: number } {
  const percentage = calculatePercentage(totalSpent, totalBudget);
  if (percentage >= 100) {
    return { status: 'danger', percentage };
  } else if (percentage >= 80) {
    return { status: 'warning', percentage };
  }
  return { status: 'ok', percentage };
}
