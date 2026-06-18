import React, { useEffect } from 'react';
import { Plus, Map, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TripCard } from '@/components/features/TripCard';
import { useTripStore } from '@/store/tripStore';
import { sumBudget, formatCurrency } from '@/utils/budgetCalculator';

export const TripListPage: React.FC = () => {
  const navigate = useNavigate();
  const trips = useTripStore((state) => state.trips);
  const expenses = useTripStore((state) => state.expenses);
  const initialize = useTripStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const totalTrips = trips.length;
  const totalBudget = trips.reduce(
    (sum, trip) => sum + sumBudget(trip.estimatedBudget),
    0
  );
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const sortedTrips = [...trips].sort((a, b) => {
    const statusOrder = { ongoing: 0, planning: 1, completed: 2 };
    if (a.status !== b.status) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={20} className="text-yellow-300" />
                  <span className="text-white/80 text-sm">欢迎回来，旅行者！</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold font-display mb-2">
                  规划你的下一次冒险
                </h1>
                <p className="text-white/80 max-w-lg">
                  轻松规划旅行行程，追踪每一笔花费，让每一次旅行都尽在掌握
                </p>
              </div>

              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Plus size={20} />}
                onClick={() => navigate('/trip/new')}
                className="hidden md:flex"
              >
                创建新旅行
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-8">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
                <p className="text-white/70 text-sm mb-1">旅行计划</p>
                <p className="text-3xl font-bold">{totalTrips}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
                <p className="text-white/70 text-sm mb-1">总预算</p>
                <p className="text-3xl font-bold">{formatCurrency(totalBudget)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
                <p className="text-white/70 text-sm mb-1">已花费</p>
                <p className="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 font-display flex items-center gap-2">
            <Map size={24} className="text-primary-500" />
            我的旅行
          </h2>

          <Button
            variant="primary"
            leftIcon={<Plus size={18} />}
            onClick={() => navigate('/trip/new')}
            className="md:hidden"
          >
            创建新旅行
          </Button>
        </div>

        {sortedTrips.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Map size={36} className="text-primary-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              还没有旅行计划
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              开始规划你的第一次旅行吧！输入目的地、日期和人数，系统会自动为你估算预算
            </p>
            <Button
              leftIcon={<Plus size={18} />}
              onClick={() => navigate('/trip/new')}
            >
              创建第一个旅行
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTrips.map((trip, index) => (
              <div
                key={trip.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <TripCard trip={trip} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
