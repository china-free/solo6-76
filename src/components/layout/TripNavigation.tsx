import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Wallet, CalendarDays, FileText, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTripStore } from '@/store/tripStore';
import { Button } from '../ui/Button';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

export const TripNavigation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const trips = useTripStore((state) => state.trips);
  const trip = React.useMemo(() => trips.find((t) => t.id === id), [trips, id]);

  if (!trip) return null;

  const navItems: NavItem[] = [
    {
      path: `/trip/${id}/budget`,
      label: '预算追踪',
      icon: <Wallet size={18} />,
    },
    {
      path: `/trip/${id}/itinerary`,
      label: '行程规划',
      icon: <CalendarDays size={18} />,
    },
    {
      path: `/trip/${id}/plan`,
      label: '行程单',
      icon: <FileText size={18} />,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={18} />}
          onClick={() => navigate('/')}
        >
          返回
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-400 rounded-2xl flex items-center justify-center">
            <Map className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 font-display">
              {trip.destination}
            </h2>
            <p className="text-sm text-gray-500">
              {trip.startDate} 至 {trip.endDate} · {trip.travelers}人
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-300',
              isActive(item.path)
                ? 'bg-primary-500 text-white shadow-md shadow-primary-200'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
