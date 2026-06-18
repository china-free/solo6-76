import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, Wallet, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTripStore } from '@/store/tripStore';
import { calculateBudgetEstimate, calculateDays, sumBudget, formatCurrency } from '@/utils/budgetCalculator';
import { budgetLevelLabels, categoryLabels } from '@/types';
import type { BudgetLevel, BudgetEstimate } from '@/types';
import { getTodayString } from '@/utils/dateUtils';

interface FormData {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budgetLevel: BudgetLevel;
}

export const CreateTripPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const addTrip = useTripStore((state) => state.addTrip);
  const updateTrip = useTripStore((state) => state.updateTrip);
  const updateEstimatedBudget = useTripStore((state) => state.updateEstimatedBudget);
  const trips = useTripStore((state) => state.trips);

  const editingTrip = useMemo(
    () => (editId ? trips.find((t) => t.id === editId) : undefined),
    [trips, editId]
  );

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 2,
    budgetLevel: 'comfortable',
  });
  const [estimatedBudget, setEstimatedBudget] = useState<BudgetEstimate | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingTrip) {
      setFormData({
        destination: editingTrip.destination,
        startDate: editingTrip.startDate,
        endDate: editingTrip.endDate,
        travelers: editingTrip.travelers,
        budgetLevel: editingTrip.budgetLevel,
      });
      setEstimatedBudget(editingTrip.estimatedBudget);
    }
  }, [editingTrip]);

  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.travelers > 0) {
      const days = calculateDays(formData.startDate, formData.endDate);
      const budget = calculateBudgetEstimate(days, formData.travelers, formData.budgetLevel);
      setEstimatedBudget(budget);
    }
  }, [formData.startDate, formData.endDate, formData.travelers, formData.budgetLevel]);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.destination.trim()) {
      newErrors.destination = '请输入目的地';
    }
    if (!formData.startDate) {
      newErrors.startDate = '请选择出发日期';
    }
    if (!formData.endDate) {
      newErrors.endDate = '请选择返回日期';
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = '返回日期不能早于出发日期';
    }
    if (formData.travelers < 1) {
      newErrors.travelers = '人数至少为1人';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = () => {
    if (!estimatedBudget) return;

    if (editId) {
      updateTrip(editId, formData);
      updateEstimatedBudget(editId, estimatedBudget);
      navigate(`/trip/${editId}/budget`);
    } else {
      const newTrip = addTrip(formData);
      navigate(`/trip/${newTrip.id}/budget`);
    }
  };

  const handleBudgetChange = (category: keyof BudgetEstimate, value: number) => {
    if (!estimatedBudget) return;
    setEstimatedBudget({
      ...estimatedBudget,
      [category]: Math.max(0, value),
    });
  };

  const days = formData.startDate && formData.endDate
    ? calculateDays(formData.startDate, formData.endDate)
    : 0;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft size={18} />}
          onClick={() => navigate('/')}
          className="mb-6"
        >
          返回
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 font-display mb-2">
            {editId ? '编辑旅行' : '创建新旅行'}
          </h1>
          <p className="text-gray-500">
            {editId ? '修改你的旅行计划' : '只需几步，开始规划你的精彩旅程'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= s
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {s}
                </div>
                <span className={step >= s ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                  {s === 1 ? '基本信息' : '预算设置'}
                </span>
              </div>
              {s < 2 && (
                <div className={`w-20 h-1 rounded-full transition-all ${
                  step > 1 ? 'bg-primary-500' : 'bg-gray-100'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="text-primary-500" size={22} />
                旅行基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="目的地"
                placeholder="例如：云南大理、日本东京"
                value={formData.destination}
                onChange={(e) =>
                  setFormData({ ...formData, destination: e.target.value })
                }
                error={errors.destination}
                leftIcon={<MapPin size={18} />}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="出发日期"
                  type="date"
                  value={formData.startDate}
                  min={getTodayString()}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  error={errors.startDate}
                  leftIcon={<Calendar size={18} />}
                />
                <Input
                  label="返回日期"
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate || getTodayString()}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  error={errors.endDate}
                  leftIcon={<Calendar size={18} />}
                />
              </div>

              {days > 0 && (
                <div className="bg-primary-50 rounded-xl p-4 flex items-center gap-3">
                  <Sparkles className="text-primary-500" size={20} />
                  <p className="text-primary-700">
                    共 <span className="font-semibold">{days}</span> 天
                    <span className="font-semibold">{days - 1}</span> 晚
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="旅行人数"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.travelers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      travelers: parseInt(e.target.value) || 1,
                    })
                  }
                  error={errors.travelers}
                  leftIcon={<Users size={18} />}
                />
                <Select
                  label="预算级别"
                  value={formData.budgetLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budgetLevel: e.target.value as BudgetLevel,
                    })
                  }
                  options={[
                    { value: 'economy', label: budgetLevelLabels.economy },
                    { value: 'comfortable', label: budgetLevelLabels.comfortable },
                    { value: 'luxury', label: budgetLevelLabels.luxury },
                  ]}
                  leftIcon={<Wallet size={18} />}
                />
              </div>

              {estimatedBudget && (
                <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600">预估总预算</span>
                    <Badge variant="info">
                      {budgetLevelLabels[formData.budgetLevel]}
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-primary-600 font-display">
                    {formatCurrency(sumBudget(estimatedBudget))}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    系统根据您的选择自动估算，下一步可手动调整
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={handleNext} rightIcon={<span>→</span>}>
                  下一步
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="text-primary-500" size={22} />
                预算分配设置
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                系统已为您自动分配预算，您可以根据实际需求调整各项费用
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl p-5 text-white mb-6">
                <p className="text-white/80 text-sm">预估总预算</p>
                <p className="text-4xl font-bold font-display mt-1">
                  {estimatedBudget ? formatCurrency(sumBudget(estimatedBudget)) : '¥0'}
                </p>
              </div>

              {(Object.keys(estimatedBudget || {}) as Array<keyof BudgetEstimate>).map(
                (category) => (
                  <div
                    key={category}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {categoryLabels[category]}
                      </p>
                    </div>
                    <div className="w-48">
                      <Input
                        type="number"
                        min="0"
                        value={estimatedBudget?.[category] || 0}
                        onChange={(e) =>
                          handleBudgetChange(
                            category,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="text-right"
                      />
                    </div>
                    <span className="text-gray-500 w-16 text-right">元</span>
                  </div>
                )
              )}

              <div className="flex gap-4 pt-4">
                <Button variant="secondary" onClick={() => setStep(1)} fullWidth>
                  上一步
                </Button>
                <Button onClick={handleSubmit} fullWidth>
                  {editId ? '保存修改' : '创建旅行'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
