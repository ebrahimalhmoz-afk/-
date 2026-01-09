
import React from 'react';
import { Page } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  coins: number;
  soundEnabled: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, setCurrentPage, coins, soundEnabled }) => {
  const navItems = [
    { id: Page.Dashboard, icon: '🏠', label: 'الرئيسية' },
    { id: Page.Challenges, icon: '🏆', label: 'التحديات' },
    { id: Page.Ads, icon: '📺', label: 'إعلانات' },
    { id: Page.AI_Coach, icon: '🤖', label: 'المدرب' },
    { id: Page.Store, icon: '🎁', label: 'المتجر' },
    { id: Page.Profile, icon: '👤', label: 'حسابي' },
  ];

  const playClick = () => {
    if (!soundEnabled) return;
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-simple-click-630.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {}); // Ignore autoplay blocks
  };

  const handleNavClick = (page: Page) => {
    if (currentPage !== page) {
      playClick();
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 max-w-md mx-auto relative shadow-2xl border-x border-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          StepRewards
        </h1>
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          <span className="text-yellow-400 font-bold">🪙 {coins.toLocaleString()}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 p-4">
        {children}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 flex justify-around items-center p-3 z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              currentPage === item.id ? 'text-emerald-400 scale-110' : 'text-slate-500'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
