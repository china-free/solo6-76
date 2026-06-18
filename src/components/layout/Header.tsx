import React from 'react';
import { MapPin, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 glass-effect border-b border-gray-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200 group-hover:scale-110 transition-transform">
            <MapPin className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display gradient-text">
              旅行规划助手
            </h1>
            <p className="text-xs text-gray-500 -mt-0.5">规划每一次精彩旅程</p>
          </div>
        </div>

        <Button
          leftIcon={<Plus size={18} />}
          onClick={() => navigate('/trip/new')}
        >
          创建新旅行
        </Button>
      </div>
    </header>
  );
};
