import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Users, Wallet, MapPin, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { TripStatusBadge, BudgetBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { Trip } from '@/types';
import { useTripStore } from '@/store/tripStore';
import { getTripDuration } from '@/utils/dateUtils';
import { sumBudget, formatCurrency } from '@/utils/budgetCalculator';
import { useState } from 'react';
import { ConfirmModal } from '../ui/Modal';

interface TripCardProps {
  trip: Trip;
}

export const TripCard: React.FC<TripCardProps> = ({ trip }) => {
  const navigate = useNavigate();
  const deleteTrip = useTripStore((state) => state.deleteTrip);
  const allExpenses = useTripStore((state) => state.expenses);
  const allActivities = useTripStore((state) => state.activities);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const expenses = useMemo(
    () => allExpenses.filter((e) => e.tripId === trip.id),
    [allExpenses, trip.id]
  );
  const activities = useMemo(
    () => allActivities.filter((a) => a.tripId === trip.id),
    [allActivities, trip.id]
  );

  const totalBudget = sumBudget(trip.estimatedBudget);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const handleDelete = () => {
    deleteTrip(trip.id);
    setShowDeleteModal(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.trip-menu')) return;
    navigate(`/trip/${trip.id}/budget`);
  };

  const getBudgetColor = () => {
    if (budgetPercentage >= 100) return 'bg-red-500';
    if (budgetPercentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <>
      <Card hover padding="none" className="overflow-hidden" onClick={handleCardClick}>
        <div className="h-40 bg-gradient-to-br from-primary-400 via-primary-500 to-accent-400 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-4 w-20 h-20 bg-white rounded-full blur-2xl" />
            <div className="absolute bottom-4 right-8 w-32 h-32 bg-white rounded-full blur-3xl" />
          </div>
          <div className="absolute top-4 left-4">
            <TripStatusBadge status={trip.status} />
          </div>
          <div className="absolute top-4 right-4 trip-menu">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              >
                <MoreVertical size={18} />
              </button>
              {showMenu && (
                <div
                  className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => {
                      setShowMenu(false);
                      navigate(`/trip/new?edit=${trip.id}`);
                    }}
                  >
                    <Edit size={14} />
                    编辑
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteModal(true);
                    }}
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 text-white">
              <MapPin size={18} />
              <h3 className="text-xl font-bold font-display">{trip.destination}</h3>
            </div>
          </div>
        </div>

        <CardContent className="p-5">
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <CalendarDays size={14} />
              <span>{getTripDuration(trip.startDate, trip.endDate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{trip.travelers}人</span>
            </div>
            <div className="flex items-center gap-1">
              <Wallet size={14} />
              <span>{activities.length}项活动</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-400">预算</p>
              <p className="text-lg font-bold text-gray-800">
                {formatCurrency(totalBudget)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">已花费</p>
              <p className="text-lg font-bold text-accent-500">
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <BudgetBadge percentage={budgetPercentage} />
          </div>

          <div className="progress-bar">
            <div
              className={`progress-fill ${getBudgetColor()}`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="删除旅行"
        description={`确定要删除"${trip.destination}"的旅行计划吗？所有相关的预算和行程数据将被永久删除。`}
        confirmText="删除"
        variant="danger"
      />
    </>
  );
};
