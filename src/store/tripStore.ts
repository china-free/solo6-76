import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trip, Expense, Activity, TripStatus, BudgetEstimate, ExpenseCategory, ActivityType, BudgetLevel } from '@/types';
import { calculateBudgetEstimate, calculateDays } from '@/utils/budgetCalculator';
import { getMockData } from '@/utils/mockData';

interface TripState {
  trips: Trip[];
  expenses: Expense[];
  activities: Activity[];
  initialized: boolean;

  initialize: () => void;

  addTrip: (data: {
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    budgetLevel: BudgetLevel;
  }) => Trip;

  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  updateTripStatus: (id: string, status: TripStatus) => void;
  updateEstimatedBudget: (id: string, budget: BudgetEstimate) => void;

  addExpense: (data: {
    tripId: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    date: string;
    note?: string;
  }) => Expense;

  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addActivity: (data: {
    tripId: string;
    date: string;
    time: string;
    location: string;
    title: string;
    description?: string;
    type: ActivityType;
    note?: string;
  }) => Activity;

  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  reorderActivities: (tripId: string, date: string, orderedIds: string[]) => void;

  getTripById: (id: string) => Trip | undefined;
  getExpensesByTripId: (tripId: string) => Expense[];
  getActivitiesByTripId: (tripId: string) => Activity[];
  getActivitiesByTripAndDate: (tripId: string, date: string) => Activity[];

  importShareData: (data: {
    trip: Trip;
    expenses: Expense[];
    activities: Activity[];
  }) => void;
}

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      trips: [],
      expenses: [],
      activities: [],
      initialized: false,

      initialize: () => {
        if (get().initialized) return;

        const { trips, expenses, activities } = get();

        if (trips.length === 0 && expenses.length === 0 && activities.length === 0) {
          const mockData = getMockData();
          set({
            trips: mockData.trips,
            expenses: mockData.expenses,
            activities: mockData.activities,
            initialized: true,
          });
        } else {
          set({ initialized: true });
        }
      },

      addTrip: (data) => {
        const days = calculateDays(data.startDate, data.endDate);
        const estimatedBudget = calculateBudgetEstimate(days, data.travelers, data.budgetLevel);

        const newTrip: Trip = {
          id: `trip-${Date.now()}`,
          destination: data.destination,
          startDate: data.startDate,
          endDate: data.endDate,
          travelers: data.travelers,
          budgetLevel: data.budgetLevel,
          estimatedBudget,
          status: 'planning',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          trips: [...state.trips, newTrip],
        }));

        return newTrip;
      },

      updateTrip: (id, updates) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === id
              ? { ...trip, ...updates, updatedAt: new Date().toISOString() }
              : trip
          ),
        }));
      },

      deleteTrip: (id) => {
        set((state) => ({
          trips: state.trips.filter((trip) => trip.id !== id),
          expenses: state.expenses.filter((expense) => expense.tripId !== id),
          activities: state.activities.filter((activity) => activity.tripId !== id),
        }));
      },

      updateTripStatus: (id, status) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === id
              ? { ...trip, status, updatedAt: new Date().toISOString() }
              : trip
          ),
        }));
      },

      updateEstimatedBudget: (id, budget) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === id
              ? {
                  ...trip,
                  estimatedBudget: budget,
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        }));
      },

      addExpense: (data) => {
        const newExpense: Expense = {
          id: `exp-${Date.now()}`,
          tripId: data.tripId,
          category: data.category,
          description: data.description,
          amount: data.amount,
          date: data.date,
          note: data.note,
        };

        set((state) => ({
          expenses: [...state.expenses, newExpense],
        }));

        return newExpense;
      },

      updateExpense: (id, updates) => {
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id ? { ...expense, ...updates } : expense
          ),
        }));
      },

      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        }));
      },

      addActivity: (data) => {
        const state = get();
        const dateActivities = state.activities.filter(
          (a) => a.tripId === data.tripId && a.date === data.date
        );
        const maxSortOrder = dateActivities.reduce(
          (max, a) => Math.max(max, a.sortOrder),
          0
        );

        const newActivity: Activity = {
          id: `act-${Date.now()}`,
          tripId: data.tripId,
          date: data.date,
          time: data.time,
          location: data.location,
          title: data.title,
          description: data.description,
          type: data.type,
          note: data.note,
          sortOrder: maxSortOrder + 1,
        };

        set((state) => ({
          activities: [...state.activities, newActivity],
        }));

        return newActivity;
      },

      updateActivity: (id, updates) => {
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === id ? { ...activity, ...updates } : activity
          ),
        }));
      },

      deleteActivity: (id) => {
        set((state) => ({
          activities: state.activities.filter((activity) => activity.id !== id),
        }));
      },

      reorderActivities: (tripId, date, orderedIds) => {
        set((state) => ({
          activities: state.activities.map((activity) => {
            if (activity.tripId !== tripId || activity.date !== date) {
              return activity;
            }
            const newIndex = orderedIds.indexOf(activity.id);
            if (newIndex === -1) return activity;
            return { ...activity, sortOrder: newIndex + 1 };
          }),
        }));
      },

      getTripById: (id) => {
        return get().trips.find((trip) => trip.id === id);
      },

      getExpensesByTripId: (tripId) => {
        return get().expenses.filter((expense) => expense.tripId === tripId);
      },

      getActivitiesByTripId: (tripId) => {
        return get().activities.filter((activity) => activity.tripId === tripId);
      },

      getActivitiesByTripAndDate: (tripId, date) => {
        return get()
          .activities.filter((activity) => activity.tripId === tripId && activity.date === date)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      },

      importShareData: (data) => {
        const newTripId = `trip-${Date.now()}`;

        const importedTrip: Trip = {
          ...data.trip,
          id: newTripId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const importedExpenses: Expense[] = data.expenses.map((expense) => ({
          ...expense,
          id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tripId: newTripId,
        }));

        const importedActivities: Activity[] = data.activities.map((activity) => ({
          ...activity,
          id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tripId: newTripId,
        }));

        set((state) => ({
          trips: [...state.trips, importedTrip],
          expenses: [...state.expenses, ...importedExpenses],
          activities: [...state.activities, ...importedActivities],
        }));
      },
    }),
    {
      name: 'trip-planner-storage',
    }
  )
);
