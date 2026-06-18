export type TripStatus = 'planning' | 'ongoing' | 'completed';

export type ExpenseCategory = 'transportation' | 'accommodation' | 'food' | 'tickets' | 'shopping' | 'other';

export type ActivityType = 'sightseeing' | 'food' | 'transportation' | 'shopping' | 'entertainment' | 'other';

export type BudgetLevel = 'economy' | 'comfortable' | 'luxury';

export interface BudgetEstimate {
  transportation: number;
  accommodation: number;
  food: number;
  tickets: number;
  shopping: number;
  other: number;
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budgetLevel: BudgetLevel;
  estimatedBudget: BudgetEstimate;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  tripId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Activity {
  id: string;
  tripId: string;
  date: string;
  time: string;
  location: string;
  title: string;
  description?: string;
  type: ActivityType;
  note?: string;
  sortOrder: number;
}

export interface AppState {
  trips: Trip[];
  expenses: Expense[];
  activities: Activity[];
}

export interface TripSummary {
  trip: Trip;
  totalBudget: number;
  totalSpent: number;
  daysCount: number;
  activitiesCount: number;
}

export const categoryLabels: Record<ExpenseCategory, string> = {
  transportation: '交通',
  accommodation: '住宿',
  food: '餐饮',
  tickets: '门票',
  shopping: '购物',
  other: '其他',
};

export const categoryColors: Record<ExpenseCategory, string> = {
  transportation: '#1E88E5',
  accommodation: '#FF7043',
  food: '#4DB6AC',
  tickets: '#9575CD',
  shopping: '#FFD54F',
  other: '#78909C',
};

export const activityTypeLabels: Record<ActivityType, string> = {
  sightseeing: '观光',
  food: '餐饮',
  transportation: '交通',
  shopping: '购物',
  entertainment: '娱乐',
  other: '其他',
};

export const activityTypeColors: Record<ActivityType, string> = {
  sightseeing: '#1E88E5',
  food: '#4DB6AC',
  transportation: '#FF7043',
  shopping: '#FFD54F',
  entertainment: '#9575CD',
  other: '#78909C',
};

export const budgetLevelLabels: Record<BudgetLevel, string> = {
  economy: '经济型',
  comfortable: '舒适型',
  luxury: '豪华型',
};

export const statusLabels: Record<TripStatus, string> = {
  planning: '规划中',
  ongoing: '进行中',
  completed: '已完成',
};
