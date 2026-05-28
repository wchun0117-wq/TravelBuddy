import React from 'react';
import { Map, ListChecks, Search, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'itinerary', icon: Map, label: '行程' },
    { id: 'checklist', icon: ListChecks, label: '清单' },
    { id: 'research', icon: Search, label: '调研' },
    { id: 'expenses', icon: Wallet, label: '分账' },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent">
      <nav className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_15px_40px_rgba(0,0,0,0.08)] rounded-[28px] px-1.5 py-1.5 flex justify-around items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all relative px-4 py-2 rounded-[20px]",
                isActive ? "text-blue-600 bg-blue-50/50" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon size={19} strokeWidth={isActive ? 2.5 : 2} className={cn("transition-transform", isActive && "scale-105")} />
              <span className={cn("text-[9px] font-black uppercase tracking-widest", isActive ? "opacity-100" : "opacity-60")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
