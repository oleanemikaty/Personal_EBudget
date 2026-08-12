import type { BudgetStatus, BudgetSummary } from './types';

export function getBudgetStatus(progress: number): BudgetStatus {
  if (progress >= 100) return 'exceeded';
  if (progress >= 91) return 'danger';
  if (progress >= 76) return 'warning';
  return 'normal';
}

export function getStatusText(status: BudgetStatus): string {
  switch (status) {
    case 'exceeded':
      return 'Exceeded';
    case 'danger':
      return 'Near Limit';
    case 'warning':
      return 'Watch';
    default:
      return 'On Track';
  }
}

export function computeSummary(budget: number, used: number): BudgetSummary {
  const progress = budget > 0 ? (used / budget) * 100 : 0;
  const remaining = budget - used;
  return {
    budget,
    used,
    remaining,
    progress,
    status: getBudgetStatus(progress),
  };
}

export function getStatusBadgeClass(status: BudgetStatus): string {
  switch (status) {
    case 'exceeded':
      return 'bg-red-700/10 text-red-700 dark:text-red-400';
    case 'danger':
      return 'bg-red-500/10 text-red-600 dark:text-red-400';
    case 'warning':
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
    default:
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  }
}

// Dynamic color by percentage used (0-100+)
// 0-50%: green, 51-75%: yellow-green, 76-90%: orange, 91-99%: red, 100%+: dark red
export function getProgressColor(progress: number): string {
  if (progress >= 100) return '#991b1b'; // dark red
  if (progress >= 91) return '#ef4444'; // red
  if (progress >= 76) return '#f97316'; // orange
  if (progress >= 51) return '#84cc16'; // yellow-green (lime)
  return '#22c55e'; // green
}

// Get a gradient from green to the current progress color
export function getProgressGradient(progress: number): string {
  const color = getProgressColor(progress);
  return `linear-gradient(90deg, #22c55e 0%, ${color} 100%)`;
}

// Get the text label for the percentage used
export function getProgressLabel(progress: number): string {
  return `${Math.round(progress)}% Used`;
}
