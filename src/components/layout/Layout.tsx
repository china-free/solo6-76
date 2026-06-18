import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showHeader = true,
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1 container mx-auto px-4 py-8 animate-fade-in">
        {children}
      </main>
      <footer className="py-6 text-center text-sm text-gray-400">
        <p>✈️ 旅行规划助手 · 让每一次旅行更精彩</p>
      </footer>
    </div>
  );
};
