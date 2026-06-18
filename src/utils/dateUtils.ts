import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(dateStr: string, pattern: string = 'yyyy年MM月dd日'): string {
  const date = parseISO(dateStr);
  return format(date, pattern, { locale: zhCN });
}

export function formatDateShort(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, 'MM/dd', { locale: zhCN });
}

export function formatDateWithWeekday(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, 'MM月dd日 EEEE', { locale: zhCN });
}

export function formatTime(timeStr: string): string {
  return timeStr;
}

export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = differenceInDays(end, start) + 1;

  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    dates.push(format(date, 'yyyy-MM-dd'));
  }

  return dates;
}

export function getTripDuration(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = differenceInDays(end, start) + 1;
  const nights = days - 1;
  return `${days}天${nights}晚`;
}

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getCurrentTimeString(): string {
  return format(new Date(), 'HH:mm');
}

export function isDateInRange(dateStr: string, startDate: string, endDate: string): boolean {
  const date = parseISO(dateStr);
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return date >= start && date <= end;
}

export function getDayOfTrip(dateStr: string, startDate: string): number {
  const date = parseISO(dateStr);
  const start = parseISO(startDate);
  return differenceInDays(date, start) + 1;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
