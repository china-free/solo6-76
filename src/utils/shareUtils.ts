import type { Trip, Expense, Activity } from '@/types';
import { categoryLabels, activityTypeLabels } from '@/types';
import { formatDate, getTripDuration, formatCurrency } from '@/utils/dateUtils';

interface ShareData {
  trip: Trip;
  expenses: Expense[];
  activities: Activity[];
}

export function encodeShareData(data: ShareData): string {
  const jsonStr = JSON.stringify(data);
  const base64 = btoa(encodeURIComponent(jsonStr));
  return base64;
}

export function decodeShareData(encoded: string): ShareData | null {
  try {
    const jsonStr = decodeURIComponent(atob(encoded));
    return JSON.parse(jsonStr) as ShareData;
  } catch {
    return null;
  }
}

export function generateShareLink(tripId: string, data: ShareData): string {
  const encoded = encodeShareData(data);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?share=${encoded}&trip=${tripId}`;
}

export function parseShareLink(): ShareData | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('share');
  if (encoded) {
    return decodeShareData(encoded);
  }
  return null;
}

export function generateItineraryText(
  trip: Trip,
  activities: Activity[],
  expenses: Expense[]
): string {
  const lines: string[] = [];

  lines.push(`✈️ 旅行行程单 - ${trip.destination}`);
  lines.push('═'.repeat(40));
  lines.push(`📅 日期：${formatDate(trip.startDate)} 至 ${formatDate(trip.endDate)}`);
  lines.push(`⏱ 时长：${getTripDuration(trip.startDate, trip.endDate)}`);
  lines.push(`👥 人数：${trip.travelers}人`);
  lines.push(`💰 预算：${formatCurrency(Object.values(trip.estimatedBudget).reduce((a, b) => a + b, 0))}`);
  lines.push('');

  lines.push('📍 每日行程');
  lines.push('─'.repeat(40));

  const sortedActivities = [...activities].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  let currentDate = '';
  let dayCount = 1;

  sortedActivities.forEach((activity) => {
    if (activity.date !== currentDate) {
      currentDate = activity.date;
      lines.push('');
      lines.push(`第${dayCount}天 - ${formatDateWithWeekday(activity.date)}`);
      lines.push('');
      dayCount++;
    }
    lines.push(`  ${activity.time} | ${activityTypeLabels[activity.type]} | ${activity.title}`);
    if (activity.location) {
      lines.push(`         📍 ${activity.location}`);
    }
    if (activity.description) {
      lines.push(`         ${activity.description}`);
    }
    lines.push('');
  });

  if (expenses.length > 0) {
    lines.push('');
    lines.push('💰 费用统计');
    lines.push('─'.repeat(40));

    const categoryTotals: Record<string, number> = {};
    let total = 0;

    expenses.forEach((expense) => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
      total += expense.amount;
    });

    Object.entries(categoryTotals).forEach(([category, amount]) => {
      lines.push(`  ${categoryLabels[category as keyof typeof categoryLabels]}: ${formatCurrency(amount)}`);
    });

    lines.push('');
    lines.push(`  总计: ${formatCurrency(total)}`);
  }

  lines.push('');
  lines.push('═'.repeat(40));
  lines.push('📱 由旅行规划助手生成');

  return lines.join('\n');
}

function formatDateWithWeekday(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 ${weekday}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function storeShareCode(code: string, data: ShareData): void {
  try {
    const storage = localStorage.getItem('shareCodes') || '{}';
    const shareCodes = JSON.parse(storage);
    shareCodes[code] = {
      data,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    localStorage.setItem('shareCodes', JSON.stringify(shareCodes));
  } catch {
    console.error('Failed to store share code');
  }
}

export function getShareDataByCode(code: string): ShareData | null {
  try {
    const storage = localStorage.getItem('shareCodes') || '{}';
    const shareCodes = JSON.parse(storage);
    const entry = shareCodes[code];
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    return null;
  } catch {
    return null;
  }
}
