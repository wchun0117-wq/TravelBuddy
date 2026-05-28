import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Plus, Trash2, MapPin, Clock, Plane, Utensils, Camera, Car, Coffee, Ship, Sunset, Sparkles, TrainFront, Hotel, Globe, Info } from 'lucide-react';

const IconMap: Record<string, any> = {
  Plane, Clock, Utensils, MapPin, Camera, Car, Coffee, Ship, Sunset, Sparkles, TrainFront, Hotel, Globe, Info
};

const getIcon = (name: string) => IconMap[name] || Info;
import { DayPlan, ItineraryDetail } from '../types';
import { cn } from '../lib/utils';

interface ItineraryProps {
  itinerary: DayPlan[];
  isEditMode: boolean;
  onAddDay: () => void;
  onDeleteDay: (id: number) => void;
  onUpdateDayTitle: (id: number, title: string) => void;
  onAddItem: (dayId: number) => void;
  onDeleteItem: (dayId: number, itemId: string) => void;
  onUpdateItem: (dayId: number, itemId: string, updates: Partial<ItineraryDetail>) => void;
}

export const Itinerary: React.FC<ItineraryProps> = ({ 
  itinerary, 
  isEditMode,
  onAddDay,
  onDeleteDay,
  onUpdateDayTitle,
  onAddItem,
  onDeleteItem,
  onUpdateItem
}) => {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));

  const toggleDay = (id: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedDays(newExpanded);
  };

  return (
    <div className="space-y-4 px-4 pb-24">
      {itinerary.map((day) => {
        const isExpanded = expandedDays.has(day.id);
        const transportItems = day.details.filter(d => d.isTransport);

        return (
          <div key={day.id} className="bg-white rounded-[28px] shadow-sm border border-slate-100 overflow-hidden transition-all">
            {/* Day Header */}
            <div 
              className={cn(
                "p-4 flex justify-between items-center cursor-pointer active:bg-slate-50",
                isExpanded && "border-b border-slate-50"
              )}
              onClick={() => toggleDay(day.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-600 rounded-2xl w-12 h-12 shrink-0">
                  <span className="text-[9px] font-black uppercase">{day.day}</span>
                  <span className="text-[17px] font-black leading-none">{day.date.includes('月') ? day.date.split('月')[1].replace('日', '') : day.date}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest truncate">{day.location}</span>
                    <div className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Day {day.id}</span>
                  </div>
                  
                  {isEditMode ? (
                    <input 
                      className="w-full text-[17px] font-bold text-slate-900 leading-tight bg-slate-50 border-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                      value={day.title}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdateDayTitle(day.id, e.target.value)}
                    />
                  ) : (
                    <h3 className="text-[17px] font-bold text-slate-900 leading-tight truncate">{day.title}</h3>
                  )}
                  
                  {/* Transport Icons in Collapsed View */}
                  {!isExpanded && transportItems.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {transportItems.map((item, idx) => {
                        const Icon = getIcon(item.iconName);
                        return (
                          <div key={idx} className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                            <Icon size={10} className="text-blue-500" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {isEditMode && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDay(day.id);
                    }}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={18} className="text-slate-300" />
                </motion.div>
              </div>
            </div>

            {/* Day Details (Accordion) */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-2 space-y-5 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[39px] top-6 bottom-8 w-[1.5px] bg-slate-100" />

                    {day.details.map((detail) => {
                      const Icon = getIcon(detail.iconName);
                      return (
                        <div key={detail.id} className="flex gap-3.5 relative group">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center z-10 border transition-all",
                            detail.isTransport 
                              ? "bg-blue-600 border-blue-100 text-white shadow-lg shadow-blue-100" 
                              : "bg-white border-slate-100 text-slate-400"
                          )}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 pt-0.5 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 mb-0.5">
                                {isEditMode ? (
                                  <input 
                                    className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border-none focus:ring-1 focus:ring-blue-500 w-20"
                                    value={detail.time}
                                    onChange={(e) => onUpdateItem(day.id, detail.id, { time: e.target.value })}
                                    placeholder="00:00"
                                  />
                                ) : (
                                  <span className={cn(
                                    "text-[10px] font-mono font-black px-1.5 py-0.5 rounded",
                                    detail.isTransport ? "bg-blue-50 text-blue-600" : "text-slate-400"
                                  )}>
                                    {detail.time}
                                  </span>
                                )}
                              </div>
                              {isEditMode && (
                                <button 
                                  onClick={() => onDeleteItem(day.id, detail.id)}
                                  className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                            {isEditMode ? (
                              <input 
                                className="w-full text-[15px] font-bold text-slate-800 bg-slate-50 border-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                value={detail.text}
                                onChange={(e) => onUpdateItem(day.id, detail.id, { text: e.target.value })}
                              />
                            ) : (
                              <h4 className={cn("text-[15px] font-bold", detail.isTransport ? "text-blue-900" : "text-slate-800")}>
                                {detail.text}
                              </h4>
                            )}
                            {isEditMode ? (
                              <input 
                                className="w-full text-[12px] text-slate-400 mt-0.5 font-medium bg-slate-50 border-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                value={detail.sub || ''}
                                onChange={(e) => onUpdateItem(day.id, detail.id, { sub: e.target.value })}
                                placeholder="添加备注..."
                              />
                            ) : detail.sub && (
                              <p className="text-[12px] text-slate-400 mt-0.5 font-medium">{detail.sub}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {isEditMode && (
                      <button 
                        onClick={() => onAddItem(day.id)}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-blue-200 hover:text-blue-500 transition-all"
                      >
                        <Plus size={14} /> 新增行程点
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {isEditMode && (
        <button 
          onClick={onAddDay}
          className="w-full py-5 border-2 border-dashed border-blue-200 rounded-[28px] bg-blue-50/30 text-blue-500 text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-50 transition-all"
        >
          <Plus size={18} /> 新增天数
        </button>
      )}
    </div>
  );
};
