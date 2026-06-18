import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import type { ExpenseCategory, BudgetEstimate } from '@/types';
import { categoryLabels, categoryColors } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const CATEGORIES: ExpenseCategory[] = [
  'transportation',
  'accommodation',
  'food',
  'tickets',
  'shopping',
  'other',
];

interface BudgetComparisonChartProps {
  estimatedBudget: BudgetEstimate;
  actualExpenses: Record<ExpenseCategory, number>;
}

const BudgetComparisonChartInner: React.FC<BudgetComparisonChartProps> = ({
  estimatedBudget,
  actualExpenses,
}) => {
  const chartData = useMemo(() => {
    const labels = CATEGORIES.map((cat) => categoryLabels[cat]);
    const estimatedData = CATEGORIES.map((cat) => estimatedBudget[cat]);
    const actualData = CATEGORIES.map((cat) => actualExpenses[cat] || 0);

    return {
      labels,
      datasets: [
        {
          label: '预算',
          data: estimatedData,
          backgroundColor: 'rgba(30, 136, 229, 0.7)',
          borderColor: 'rgba(30, 136, 229, 1)',
          borderWidth: 2,
          borderRadius: 8,
        },
        {
          label: '实际花费',
          data: actualData,
          backgroundColor: 'rgba(255, 112, 67, 0.7)',
          borderColor: 'rgba(255, 112, 67, 1)',
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };
  }, [estimatedBudget, actualExpenses]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 300,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              const value = context.raw;
              return `${context.dataset.label}: ¥${value.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value: any) {
              return '¥' + value.toLocaleString();
            },
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    }),
    []
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>预算 vs 实际花费对比</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
};

export const BudgetComparisonChart = React.memo(BudgetComparisonChartInner);

interface ExpensePieChartProps {
  expenses: Record<ExpenseCategory, number>;
}

const ExpensePieChartInner: React.FC<ExpensePieChartProps> = ({ expenses }) => {
  const chartData = useMemo(() => {
    const categories = Object.entries(expenses)
      .filter(([, value]) => value > 0)
      .map(([key]) => key as ExpenseCategory);

    const labels = categories.map((cat) => categoryLabels[cat]);
    const data = categories.map((cat) => expenses[cat]);
    const colors = categories.map((cat) => categoryColors[cat]);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.map((c) => c + 'CC'),
          borderColor: colors,
          borderWidth: 2,
        },
      ],
    };
  }, [expenses]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 300,
      },
      plugins: {
        legend: {
          position: 'right' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              const total = context.dataset.data.reduce(
                (a: number, b: number) => a + b,
                0
              );
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${context.label}: ¥${context.raw.toLocaleString()} (${percentage}%)`;
            },
          },
        },
      },
    }),
    []
  );

  const hasData = Object.values(expenses).some((v) => v > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>支出分类占比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-400">
            暂无支出数据
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>支出分类占比</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <Pie data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
};

export const ExpensePieChart = React.memo(ExpensePieChartInner);
