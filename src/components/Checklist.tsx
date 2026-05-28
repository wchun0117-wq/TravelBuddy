import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Plus, Trash2, CheckCircle2, Circle, GripVertical } from 'lucide-react';
import { PackingCategory, PackingItem } from '../types';
import { cn } from '../lib/utils';

interface ChecklistProps {
  categories: PackingCategory[];
  onUpdateCategories: (categories: PackingCategory[]) => void;
  isEditMode: boolean;
}

export const Checklist: React.FC<ChecklistProps> = ({ categories, onUpdateCategories, isEditMode }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(categories.map(c => c.id)));

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleItem = (categoryId: string, itemId: string) => {
    const newCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
          )
        };
      }
      return cat;
    });
    onUpdateCategories(newCategories);
  };

  const deleteItem = (categoryId: string, itemId: string) => {
    const newCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.filter(item => item.id !== itemId)
        };
      }
      return cat;
    });
    onUpdateCategories(newCategories);
  };

  const addItem = (categoryId: string) => {
    const newCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        const newItem: PackingItem = {
          id: `item-${Date.now()}`,
          text: '',
          completed: false
        };
        return {
          ...cat,
          items: [...cat.items, newItem]
        };
      }
      return cat;
    });
    onUpdateCategories(newCategories);
  };

  const updateItemText = (categoryId: string, itemId: string, text: string) => {
    const newCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId ? { ...item, text } : item
          )
        };
      }
      return cat;
    });
    onUpdateCategories(newCategories);
  };

  return (
    <div className="space-y-4 px-4 pb-32 pt-4">
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const completedCount = category.items.filter(i => i.completed).length;
        const totalCount = category.items.length;

        return (
          <div key={category.id} className="bg-white rounded-[28px] shadow-sm border border-slate-100 overflow-hidden transition-all">
            {/* Category Header */}
            <div 
              className={cn(
                "p-5 flex justify-between items-center cursor-pointer active:bg-slate-50",
                isExpanded && "border-b border-slate-50"
              )}
              onClick={() => toggleCategory(category.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <span className="text-xs font-black">{completedCount}/{totalCount}</span>
                </div>
                <div>
                  <h3 className="text-[17px] font-black text-slate-900">{category.name}</h3>
                  <div className="w-24 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : 0 }}
                    />
                  </div>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={20} className="text-slate-300" />
              </motion.div>
            </div>

            {/* Items List */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                >
                  <div className="p-4 space-y-2">
                    {category.items.map((item) => (
                      <div key={item.id} className="relative overflow-hidden rounded-2xl">
                        {/* Delete Background */}
                        <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6">
                          <Trash2 size={20} className="text-white" />
                        </div>

                        <motion.div 
                          layout
                          drag="x"
                          dragConstraints={{ left: -80, right: 0 }}
                          dragElastic={0.1}
                          onDragEnd={(_, info) => {
                            if (info.offset.x < -50) {
                              deleteItem(category.id, item.id);
                            }
                          }}
                          className="relative z-10 bg-white flex items-center gap-3 p-3 group transition-colors"
                        >
                          <button 
                            onClick={() => toggleItem(category.id, item.id)}
                            className={cn(
                              "transition-colors shrink-0",
                              item.completed ? "text-blue-500" : "text-slate-300"
                            )}
                          >
                            {item.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                          </button>
                          
                          <input 
                            type="text"
                            value={item.text}
                            onChange={(e) => updateItemText(category.id, item.id, e.target.value)}
                            placeholder="输入清单项..."
                            className={cn(
                              "flex-1 bg-transparent border-none focus:ring-0 text-[15px] font-bold transition-all",
                              item.completed ? "text-slate-300 line-through" : "text-slate-700"
                            )}
                          />

                          <button 
                            onClick={() => deleteItem(category.id, item.id)}
                            className={cn(
                              "p-2 text-red-400 transition-all hover:text-red-600 shrink-0",
                              isEditMode ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
                            )}
                          >
                            <Trash2 size={18} />
                          </button>
                        </motion.div>
                      </div>
                    ))}

                    <button 
                      onClick={() => addItem(category.id)}
                      className="w-full py-3 mt-2 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-blue-100 hover:text-blue-500 hover:bg-blue-50/30 transition-all"
                    >
                      <Plus size={14} /> 新增项目
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
