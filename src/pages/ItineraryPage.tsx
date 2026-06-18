import React, { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2, Clock, MapPin, CalendarDays, GripVertical } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { TripNavigation } from '@/components/layout/TripNavigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { useTripStore } from '@/store/tripStore';
import { getDateRange, formatDateWithWeekday, formatDateShort, getDayOfTrip, getCurrentTimeString } from '@/utils/dateUtils';
import type { Activity, ActivityType } from '@/types';
import { activityTypeLabels, activityTypeColors } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

export const ItineraryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const trips = useTripStore((state) => state.trips);
  const allActivities = useTripStore((state) => state.activities);
  const addActivity = useTripStore((state) => state.addActivity);
  const updateActivity = useTripStore((state) => state.updateActivity);
  const deleteActivity = useTripStore((state) => state.deleteActivity);

  const trip = useMemo(() => trips.find((t) => t.id === id), [trips, id]);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    time: getCurrentTimeString(),
    location: '',
    title: '',
    description: '',
    type: 'sightseeing' as ActivityType,
    note: '',
  });

  const debouncedSelectedDate = useDebounce(selectedDate, 200);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const dates = useMemo(
    () => (trip ? getDateRange(trip.startDate, trip.endDate) : []),
    [trip]
  );

  React.useEffect(() => {
    if (!selectedDate && dates.length > 0) {
      setSelectedDate(dates[0]);
    }
  }, [selectedDate, dates]);

  const activities = useMemo(() => {
    if (!debouncedSelectedDate || !id) return [];
    return allActivities
      .filter((a) => a.tripId === id && a.date === debouncedSelectedDate)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [allActivities, id, debouncedSelectedDate]);

  const getActivitiesByDate = useCallback(
    (date: string) => {
      if (!id) return [];
      return allActivities
        .filter((a) => a.tripId === id && a.date === date)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },
    [allActivities, id]
  );

  if (!trip) {
    return (
      <Layout>
        <div className="text-center py-20 text-gray-500">
          未找到该旅行计划
        </div>
      </Layout>
    );
  }

  const handleOpenAddModal = () => {
    setEditingActivity(null);
    setFormData({
      time: getCurrentTimeString(),
      location: '',
      title: '',
      description: '',
      type: 'sightseeing',
      note: '',
    });
    setShowAddModal(true);
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      time: activity.time,
      location: activity.location,
      title: activity.title,
      description: activity.description || '',
      type: activity.type,
      note: activity.note || '',
    });
    setShowAddModal(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !selectedDate) return;

    if (editingActivity) {
      updateActivity(editingActivity.id, {
        time: formData.time,
        location: formData.location,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        note: formData.note,
        date: selectedDate,
      });
    } else {
      addActivity({
        tripId: trip.id,
        date: selectedDate,
        time: formData.time,
        location: formData.location,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        note: formData.note,
      });
    }
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    setDeletingActivity(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deletingActivity) {
      deleteActivity(deletingActivity);
      setShowDeleteModal(false);
      setDeletingActivity(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <TripNavigation />

        <div className="mb-6">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
            {dates.map((date, index) => {
              const dayActivities = getActivitiesByDate(date);
              const isSelected = selectedDate === date;

              return (
                <button
                  key={date}
                  onClick={() => handleDateChange(date)}
                  className={`shrink-0 px-5 py-4 rounded-2xl transition-all duration-300 text-left min-w-[140px] ${
                    isSelected
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-200'
                      : 'bg-white hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-medium ${isSelected ? 'text-white/80' : 'text-gray-500'}`}
                    >
                      第 {getDayOfTrip(date, trip.startDate)} 天
                    </span>
                    {dayActivities.length > 0 && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-600'}`}
                      >
                        {dayActivities.length}项
                      </span>
                    )}
                  </div>
                  <p
                    className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-800'}`}
                  >
                    {formatDateShort(date)}
                  </p>
                  <p
                    className={`text-xs ${isSelected ? 'text-white/70' : 'text-gray-400'}`}
                  >
                    {formatDateWithWeekday(date).split(' ')[1]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays size={20} className="text-primary-500" />
                {selectedDate && formatDateWithWeekday(selectedDate)}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {activities.length} 项活动安排
              </p>
            </div>
            <Button leftIcon={<Plus size={18} />} onClick={handleOpenAddModal}>
              添加活动
            </Button>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarDays size={36} className="text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  还没有安排活动
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  点击"添加活动"开始规划这一天的行程
                </p>
                <Button leftIcon={<Plus size={18} />} onClick={handleOpenAddModal}>
                  添加第一个活动
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-gray-200" />

                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="relative pl-14 animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div
                        className="absolute left-0 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-md"
                        style={{ backgroundColor: activityTypeColors[activity.type] }}
                      >
                        <Clock size={18} className="text-white" />
                      </div>

                      <Card className="p-5 hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
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

                            <h4 className="text-lg font-semibold text-gray-800 mb-1">
                              {activity.title}
                            </h4>

                            {activity.location && (
                              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                                <MapPin size={14} />
                                <span>{activity.location}</span>
                              </div>
                            )}

                            {activity.description && (
                              <p className="text-gray-600 text-sm mb-2">
                                {activity.description}
                              </p>
                            )}

                            {activity.note && (
                              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                                💡 {activity.note}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-1">
                            <button className="btn-icon text-gray-300 cursor-grab hover:text-gray-400">
                              <GripVertical size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(activity)}
                              className="btn-icon text-gray-400 hover:text-primary-500"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(activity.id)}
                              className="btn-icon text-gray-400 hover:text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={editingActivity ? '编辑活动' : '添加活动'}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit}>
                {editingActivity ? '保存修改' : '添加'}
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="时间"
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
              />
              <Select
                label="活动类型"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as ActivityType,
                  })
                }
                options={(Object.keys(activityTypeLabels) as ActivityType[]).map(
                  (type) => ({
                    value: type,
                    label: activityTypeLabels[type],
                  })
                )}
              />
            </div>
            <Input
              label="活动名称"
              placeholder="例如：游览故宫、午餐、乘坐高铁等"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
            <Input
              label="地点"
              placeholder="例如：故宫博物院、北京南站等"
              leftIcon={<MapPin size={16} />}
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
            <Textarea
              label="活动描述 (可选)"
              placeholder="描述活动的详细内容"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
            <Textarea
              label="备注 (可选)"
              placeholder="添加注意事项或提醒"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              rows={2}
            />
          </div>
        </Modal>

        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingActivity(null);
          }}
          onConfirm={confirmDelete}
          title="删除活动"
          description="确定要删除这个活动吗？此操作无法撤销。"
          confirmText="删除"
          variant="danger"
        />
      </div>
    </Layout>
  );
};
