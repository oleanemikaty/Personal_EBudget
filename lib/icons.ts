// Emoji presets for budget groups and sub-budgets

export const GROUP_ICONS: string[] = [
  '🏠', '🍳', '🚗', '💄', '🎮', '❤️', '🏖️', '📚', '💰',
  '🛒', '💼', '🏥', '🎁', '✈️', '📱', '🎵', '☕', '🍷',
  '🏋️', '🐾', '🔧', '🎨', '🌳', '⚡', '🚌', '🧾', '💳',
];

export const SUB_ICONS: string[] = [
  '💡', '🚿', '📶', '🏠', '🧹', '🔨', '🛒', '🍎', '🥬', '🥩',
  '🥤', '🍽️', '🔥', '💧', '⛽', '🅿️', '🛣️', '🚕', '🏍️', '🔧',
  '☕', '🎬', '🛍️', '📺', '🏝️', '💵', '🎁', '🎓', '📖', '💻',
  '📷', '🚙', '❤️', '🎂', '💊', '🐶', '🐱', '🪴', '🎸', '⚽',
];

export const GOAL_ICONS: string[] = [
  '🚨', '🏖️', '💼', '💻', '📷', '🚗', '🏠', '💍', '🎓', '📱',
  '🎮', '✈️', '🚲', '⌚', '🎧', '💰', '🏦', '🎯', '🏆', '🎁',
];

export const INCOME_ICONS: string[] = ['💼', '🎉', '💰', '📈', '🎁', '💵'];

export function randomIcon(icons: string[] = GROUP_ICONS): string {
  return icons[Math.floor(Math.random() * icons.length)];
}
