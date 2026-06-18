import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Share2, Copy, Download, Check, MapPin, CalendarDays, Users, Wallet, FileText, QrCode } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { TripNavigation } from '@/components/layout/TripNavigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useTripStore } from '@/store/tripStore';
import { sumBudget, formatCurrency } from '@/utils/budgetCalculator';
import { getDateRange, formatDate, formatDateWithWeekday, getTripDuration, formatDateShort } from '@/utils/dateUtils';
import { generateItineraryText, copyToClipboard, generateShareLink, generateShareCode, storeShareCode } from '@/utils/shareUtils';
import type { ExpenseCategory, ActivityType } from '@/types';
import { categoryLabels, activityTypeLabels, activityTypeColors, budgetLevelLabels, statusLabels } from '@/types';

export const PlanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const trips = useTripStore((state) => state.trips);
  const allExpenses = useTripStore((state) => state.expenses);
  const allActivities = useTripStore((state) => state.activities);

  const trip = useMemo(() => trips.find((t) => t.id === id), [trips, id]);
  const expenses = useMemo(
    () => allExpenses.filter((e) => e.tripId === id),
    [allExpenses, id]
  );
  const activities = useMemo(
    () => allActivities.filter((a) => a.tripId === id),
    [allActivities, id]
  );

  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [shareLink, setShareLink] = useState('');

  if (!trip) {
    return (
      <Layout>
        <div className="text-center py-20 text-gray-500">
          未找到该旅行计划
        </div>
      </Layout>
    );
  }

  const dates = useMemo(
    () => getDateRange(trip.startDate, trip.endDate),
    [trip.startDate, trip.endDate]
  );
  const totalBudget = sumBudget(trip.estimatedBudget);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const activitiesByDate = useMemo(() => {
    const result: Record<string, typeof activities> = {};
    dates.forEach((date) => {
      result[date] = activities
        .filter((a) => a.date === date)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    });
    return result;
  }, [activities, dates]);

  const expensesByCategory = useMemo(() => {
    const result: Record<ExpenseCategory, number> = {
      transportation: 0,
      accommodation: 0,
      food: 0,
      tickets: 0,
      shopping: 0,
      other: 0,
    };
    expenses.forEach((e) => {
      result[e.category] += e.amount;
    });
    return result;
  }, [expenses]);

  const handleShare = () => {
    const data = {
      trip,
      expenses,
      activities,
    };
    const link = generateShareLink(trip.id, data);
    const code = generateShareCode();
    storeShareCode(code, data);
    setShareLink(link);
    setShareCode(code);
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyItinerary = async () => {
    const text = generateItineraryText(trip, activities, expenses);
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadText = () => {
    const text = generateItineraryText(trip, activities, expenses);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${trip.destination}行程单.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <TripNavigation />

        <div className="flex justify-end mb-6">
          <div className="flex gap-3">
            <Button
              variant="secondary"
              leftIcon={<Copy size={18} />}
              onClick={handleCopyItinerary}
            >
              {copied ? '已复制' : '复制行程单'}
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Download size={18} />}
              onClick={handleDownloadText}
            >
              下载
            </Button>
            <Button
              leftIcon={<Share2 size={18} />}
              onClick={handleShare}
            >
              分享行程
            </Button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl p-8 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <FileText size={32} />
              </div>
              <div>
                <p className="text-white/70 text-sm">旅行行程单</p>
                <h1 className="text-3xl md:text-4xl font-bold font-display">
                  {trip.destination}
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  <CalendarDays size={14} />
                  <span>出行日期</span>
                </div>
                <p className="font-semibold">
                  {formatDate(trip.startDate, 'MM/dd')} - {formatDate(trip.endDate, 'MM/dd')}
                </p>
                <p className="text-white/70 text-xs mt-1">
                  {getTripDuration(trip.startDate, trip.endDate)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  <Users size={14} />
                  <span>出行人数</span>
                </div>
                <p className="font-semibold">{trip.travelers} 人</p>
                <p className="text-white/70 text-xs mt-1">
                  {budgetLevelLabels[trip.budgetLevel]}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  <Wallet size={14} />
                  <span>总预算</span>
                </div>
                <p className="font-semibold">{formatCurrency(totalBudget)}</p>
                <p className="text-white/70 text-xs mt-1">
                  已花 {formatCurrency(totalSpent)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  <MapPin size={14} />
                  <span>活动安排</span>
                </div>
                <p className="font-semibold">{activities.length} 项</p>
                <p className="text-white/70 text-xs mt-1">
                  {statusLabels[trip.status]}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays size={20} className="text-primary-500" />
              每日行程
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dates.map((date, dayIndex) => {
              const dayActivities = activitiesByDate[date] || [];

              return (
                <div
                  key={date}
                  className="mb-8 last:mb-0 animate-fade-in-up"
                  style={{ animationDelay: `${dayIndex * 0.1}s` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {dayIndex + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {formatDateWithWeekday(date)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {dayActivities.length} 项活动
                      </p>
                    </div>
                  </div>

                  {dayActivities.length === 0 ? (
                    <div className="ml-5 pl-8 py-6 border-l-2 border-dashed border-gray-200 text-gray-400 text-sm">
                      这一天还没有安排活动
                    </div>
                  ) : (
                    <div className="ml-5 pl-8 border-l-2 border-gray-200">
                      {dayActivities.map((activity, actIndex) => (
                        <div
                          key={activity.id}
                          className="relative mb-6 last:mb-0"
                        >
                          <div
                            className="absolute -left-[42px] w-6 h-6 rounded-full border-4 border-white shadow-md"
                            style={{ backgroundColor: activityTypeColors[activity.type] }}
                          />
                          <div className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-sm font-semibold text-primary-600 bg-white px-3 py-1 rounded-full shadow-sm">
                                    {activity.time}
                                  </span>
                                  <span
                                    className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                                    style={{
                                      backgroundColor: activityTypeColors[activity.type] + '20',
                                      color: activityTypeColors[activity.type],
                                    }}
                                  >
                                    {activityTypeLabels[activity.type]}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-gray-800 mb-1">
                                  {activity.title}
                                </h4>
                                {activity.location && (
                                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                                    <MapPin size={14} />
                                    <span>{activity.location}</span>
                                  </div>
                                )}
                                {activity.description && (
                                  <p className="text-gray-600 text-sm">
                                    {activity.description}
                                  </p>
                                )}
                                {activity.note && (
                                  <p className="text-xs text-gray-400 mt-2 bg-white rounded-lg px-3 py-2">
                                    💡 {activity.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {expenses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet size={20} className="text-primary-500" />
                费用统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {(Object.keys(expensesByCategory) as ExpenseCategory[]).map((category) => {
                  const amount = expensesByCategory[category];
                  if (amount === 0) return null;

                  return (
                    <div
                      key={category}
                      className="bg-gray-50 rounded-xl p-4"
                    >
                      <p className="text-sm text-gray-500 mb-1">
                        {categoryLabels[category]}
                      </p>
                      <p className="text-lg font-bold text-gray-800">
                        {formatCurrency(amount)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600">总预算</span>
                  <span className="text-gray-800 font-semibold">
                    {formatCurrency(totalBudget)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600">实际支出</span>
                  <span className="text-accent-500 font-semibold">
                    {formatCurrency(totalSpent)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="font-semibold text-gray-800">剩余预算</span>
                  <span
                    className={`text-lg font-bold ${totalBudget - totalSpent < 0 ? 'text-red-500' : 'text-green-500'}`}
                  >
                    {formatCurrency(totalBudget - totalSpent)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Modal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title="分享行程"
          size="md"
        >
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-white border-4 border-gray-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <QrCode size={64} className="text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">分享码</p>
                <p className="text-2xl font-bold font-mono tracking-widest text-primary-600">
                  {shareCode}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">分享链接</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 truncate font-mono">
                  {shareLink}
                </div>
                <Button onClick={handleCopyLink} size="sm">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            <div className="bg-primary-50 rounded-xl p-4">
              <p className="text-sm text-primary-700">
                💡 提示：您可以通过分享链接或分享码将此行程分享给同伴。分享链接有效期为7天。
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={handleCopyItinerary}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? '已复制行程单' : '复制行程单文本'}
              </Button>
              <Button variant="secondary" fullWidth onClick={handleDownloadText}>
                <Download size={16} />
                下载文本
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};
