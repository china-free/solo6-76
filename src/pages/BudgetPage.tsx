import React, { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2, PiggyBank, TrendingUp, AlertTriangle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { TripNavigation } from '@/components/layout/TripNavigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Badge, BudgetBadge } from '@/components/ui/Badge';
import { BudgetComparisonChart, ExpensePieChart } from '@/components/charts/BudgetCharts';
import { useTripStore } from '@/store/tripStore';
import { sumBudget, formatCurrency, getBudgetStatus } from '@/utils/budgetCalculator';
import { getTodayString, formatDateShort } from '@/utils/dateUtils';
import { useThrottle } from '@/hooks/useDebounce';
import type { ExpenseCategory, Expense } from '@/types';
import { categoryLabels, categoryColors } from '@/types';

const CHART_THROTTLE_MS = 250;
const FORM_DEBOUNCE_MS = 150;

const CATEGORY_INITIAL: Record<ExpenseCategory, number> = {
  transportation: 0,
  accommodation: 0,
  food: 0,
  tickets: 0,
  shopping: 0,
  other: 0,
};

export const BudgetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const trips = useTripStore((state) => state.trips);
  const allExpenses = useTripStore((state) => state.expenses);
  const addExpense = useTripStore((state) => state.addExpense);
  const updateExpense = useTripStore((state) => state.updateExpense);
  const deleteExpense = useTripStore((state) => state.deleteExpense);

  const trip = useMemo(() => trips.find((t) => t.id === id), [trips, id]);
  const expenses = useMemo(
    () => allExpenses.filter((e) => e.tripId === id),
    [allExpenses, id]
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [formData, setFormData] = useState({
    category: 'transportation' as ExpenseCategory,
    description: '',
    amount: '',
    date: getTodayString(),
    note: '',
  });

  const handleFormChange = useCallback(
    <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const throttledExpenses = useThrottle(expenses, CHART_THROTTLE_MS);
  const throttledFilterCategory = useThrottle(filterCategory, CHART_THROTTLE_MS);

  if (!trip) {
    return (
      <Layout>
        <div className="text-center py-20 text-gray-500">
          未找到该旅行计划
        </div>
      </Layout>
    );
  }

  const totalBudget = sumBudget(trip.estimatedBudget);
  const totalSpent = useMemo(
    () => throttledExpenses.reduce((sum, e) => sum + e.amount, 0),
    [throttledExpenses]
  );
  const remaining = totalBudget - totalSpent;
  const budgetStatus = useMemo(
    () => getBudgetStatus(totalBudget, totalSpent),
    [totalBudget, totalSpent]
  );

  const actualExpensesByCategory = useMemo(() => {
    const result: Record<ExpenseCategory, number> = { ...CATEGORY_INITIAL };
    throttledExpenses.forEach((e) => {
      result[e.category] += e.amount;
    });
    return result;
  }, [throttledExpenses]);

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];
    if (throttledFilterCategory !== 'all') {
      result = result.filter((e) => e.category === throttledFilterCategory);
    }
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, throttledFilterCategory]);

  const handleOpenAddModal = useCallback(() => {
    setEditingExpense(null);
    setFormData({
      category: 'transportation',
      description: '',
      amount: '',
      date: getTodayString(),
      note: '',
    });
    setShowAddModal(true);
  }, []);

  const handleEdit = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
      note: expense.note || '',
    });
    setShowAddModal(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formData.description.trim() || !formData.amount) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return;

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        category: formData.category,
        description: formData.description,
        amount,
        date: formData.date,
        note: formData.note,
      });
    } else {
      addExpense({
        tripId: trip.id,
        category: formData.category,
        description: formData.description,
        amount,
        date: formData.date,
        note: formData.note,
      });
    }
    setShowAddModal(false);
  }, [formData, editingExpense, addExpense, updateExpense, trip.id]);

  const handleDelete = useCallback((id: string) => {
    setDeletingExpense(id);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deletingExpense) {
      deleteExpense(deletingExpense);
      setShowDeleteModal(false);
      setDeletingExpense(null);
    }
  }, [deletingExpense, deleteExpense]);

  const getBudgetStatusColor = useCallback(() => {
    switch (budgetStatus.status) {
      case 'danger':
        return 'from-red-500 to-red-600';
      case 'warning':
        return 'from-yellow-500 to-yellow-600';
      default:
        return 'from-primary-500 to-accent-500';
    }
  }, [budgetStatus.status]);

  const handleFilterChange = useCallback((value: string) => {
    setFilterCategory(value);
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <TripNavigation />

        <div className={`bg-gradient-to-r ${getBudgetStatusColor()} rounded-3xl p-8 mb-8 text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <PiggyBank size={24} />
              <span className="text-white/80">预算概览</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-white/70 text-sm mb-1">总预算</p>
                <p className="text-2xl md:text-3xl font-bold font-display">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
              <div>
                <p className="text-white/70 text-sm mb-1">已花费</p>
                <p className="text-2xl md:text-3xl font-bold font-display">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div>
                <p className="text-white/70 text-sm mb-1">剩余预算</p>
                <p className={`text-2xl md:text-3xl font-bold font-display ${remaining < 0 ? 'text-red-200' : ''}`}>
                  {formatCurrency(remaining)}
                </p>
              </div>
              <div className="flex items-end">
                <div>
                  <p className="text-white/70 text-sm mb-1">使用进度</p>
                  <BudgetBadge percentage={budgetStatus.percentage} className="text-sm px-4 py-1.5" />
                </div>
              </div>
            </div>
            {budgetStatus.status !== 'ok' && (
              <div className="mt-4 flex items-center gap-2 text-white/90 bg-white/10 rounded-xl px-4 py-3">
                <AlertTriangle size={18} />
                <span className="text-sm">
                  {budgetStatus.status === 'danger'
                    ? '⚠️ 预算已超支，请控制支出！'
                    : '💡 预算使用已达80%，请注意控制支出'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <BudgetComparisonChart
            estimatedBudget={trip.estimatedBudget}
            actualExpenses={actualExpensesByCategory}
          />
          <ExpensePieChart expenses={actualExpensesByCategory} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {(Object.keys(trip.estimatedBudget) as Array<ExpenseCategory>).map((category) => {
            const estimated = trip.estimatedBudget[category];
            const actual = actualExpensesByCategory[category];
            const diff = estimated - actual;
            const percentage = estimated > 0 ? Math.round((actual / estimated) * 100) : 0;

            return (
              <Card key={category} className="p-4">
                <div
                  className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                  style={{ backgroundColor: categoryColors[category] + '20' }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: categoryColors[category] }}
                  />
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {categoryLabels[category]}
                </p>
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(actual)}
                </p>
                <p className="text-xs text-gray-400">
                  预算 {formatCurrency(estimated)}
                </p>
                <div className="progress-bar mt-3">
                  <div
                    className={`progress-fill ${percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <p
                  className={`text-xs mt-1.5 ${diff < 0 ? 'text-red-500' : 'text-green-500'}`}
                >
                  {diff < 0 ? `超支 ${formatCurrency(-diff)}` : `剩余 ${formatCurrency(diff)}`}
                </p>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={20} className="text-primary-500" />
                支出记录
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                共 {expenses.length} 笔支出
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={filterCategory}
                onChange={(e) => handleFilterChange(e.target.value)}
                options={[
                  { value: 'all', label: '全部分类' },
                  ...(Object.keys(categoryLabels) as ExpenseCategory[]).map((cat) => ({
                    value: cat,
                    label: categoryLabels[cat],
                  })),
                ]}
                className="w-36"
              />
              <Button leftIcon={<Plus size={18} />} onClick={handleOpenAddModal}>
                添加支出
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>暂无支出记录</p>
                <p className="text-sm mt-1">点击"添加支出"开始记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExpenses.map((expense, index) => (
                  <div
                    key={expense.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: categoryColors[expense.category] + '20' }}
                    >
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: categoryColors[expense.category] }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {expense.description}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <Badge variant="info">{categoryLabels[expense.category]}</Badge>
                        <span>{formatDateShort(expense.date)}</span>
                        {expense.note && (
                          <span className="truncate">· {expense.note}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-accent-500">
                        -{formatCurrency(expense.amount)}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="btn-icon text-gray-400 hover:text-primary-500"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="btn-icon text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={editingExpense ? '编辑支出' : '添加支出'}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit}>
                {editingExpense ? '保存修改' : '添加'}
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <Select
              label="费用分类"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as ExpenseCategory,
                })
              }
              options={(Object.keys(categoryLabels) as ExpenseCategory[]).map((cat) => ({
                value: cat,
                label: categoryLabels[cat],
              }))}
            />
            <Input
              label="支出描述"
              placeholder="例如：高铁票、酒店住宿、午餐等"
              value={formData.description}
              onChange={(e) =>
                handleFormChange('description', e.target.value)
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="金额 (元)"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  handleFormChange('amount', e.target.value)
                }
              />
              <Input
                label="日期"
                type="date"
                value={formData.date}
                min={trip.startDate}
                max={trip.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            <Textarea
              label="备注 (可选)"
              placeholder="添加备注信息"
              value={formData.note}
              onChange={(e) =>
                handleFormChange('note', e.target.value)
              }
              rows={3}
            />
          </div>
        </Modal>

        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingExpense(null);
          }}
          onConfirm={confirmDelete}
          title="删除支出记录"
          description="确定要删除这条支出记录吗？此操作无法撤销。"
          confirmText="删除"
          variant="danger"
        />
      </div>
    </Layout>
  );
};
