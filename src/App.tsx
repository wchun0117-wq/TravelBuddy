/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Check, Plus, Users, X, UserPlus, Shield, ShieldAlert, Link2, Globe, ArrowLeft, Sparkles, Camera, Search, FileSpreadsheet, FileText, Image } from 'lucide-react';
import { BottomNav } from './components/BottomNav';
import { Itinerary } from './components/Itinerary';
import { Checklist } from './components/Checklist';
import { malaysiaTrip as initialTrip } from './data/malaysiaTrip';
import { cn } from './lib/utils';
import { Trip, DayPlan, ItineraryDetail, Collaborator, UserRole, PackingCategory } from './types';

import { generateItinerary, generateItineraryFromImage, parseExcel, parseWord } from './services/geminiService';

const DEFAULT_PACKING_LIST = [
  { category: "证件类", items: ["护照", "身份证", "Visa (需提前)", "入境卡 (需提前)", "机酒行程单 (需提前)", "保险 (需提前)"] },
  { category: "防晒用品", items: ["防晒霜/喷雾", "防晒衣", "墨镜", "防晒面罩", "帽子", "骑行面罩", "防晒手套"] },
  { category: "潜水/海边", items: ["一次性咬嘴", "防晒腿袜", "防晒泥", "速干浴巾", "手机防水袋", "水母衣", "潜水袜"] },
  { category: "舒适提升", items: ["颈枕", "眼罩", "过滤花洒 (需提前)"] },
  { category: "必带项目", items: ["转换插头 (需提前)", "充电宝", "随身WiFi (需提前)", "流量卡/电话卡 (需提前)", "现金"] },
  { category: "以防万一", items: ["驱蚊液", "必备药 (需提前)", "雨伞/雨衣"] }
];

const getInitialPackingCategories = () => DEFAULT_PACKING_LIST.map((cat, idx) => ({
  id: `cat-${idx}`,
  name: cat.category,
  items: cat.items.map((text, i) => ({
    id: `item-${idx}-${i}`,
    text,
    completed: false
  }))
}));

const mapAiPackingList = (aiPackingList?: any[]) => {
  if (!aiPackingList || !Array.isArray(aiPackingList) || aiPackingList.length === 0) {
    return getInitialPackingCategories();
  }
  return aiPackingList.map((cat: any, idx: number) => ({
    id: `cat-${idx}-${Date.now()}`,
    name: cat.category || cat.name || "其他准备",
    items: (Array.isArray(cat.items) ? cat.items : []).map((text: any, i: number) => ({
      id: `item-${idx}-${i}-${Date.now()}`,
      text: String(text),
      completed: false
    }))
  }));
};

export default function App() {
  const [view, setView] = useState<'auth' | 'home' | 'detail'>('auth');
  const [activeTab, setActiveTab] = useState('itinerary');
  const [isEditMode, setIsEditMode] = useState(false);
  const [trip, setTrip] = useState<Trip>({
    ...initialTrip,
    packingList: {
      'user-1': getInitialPackingCategories()
    }
  });
  const [trips, setTrips] = useState<Trip[]>([{
    ...initialTrip,
    packingList: {
      'user-1': getInitialPackingCategories()
    }
  }]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentUserRole] = useState<UserRole>('admin');
  const [currentUserId] = useState('user-1'); // Simulated current user ID

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'image' | 'excel' | 'word' | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  const triggerFileInput = (type: 'image' | 'excel' | 'word') => {
    if (fileInputRef.current) {
      setImportType(type);
      if (type === 'image') {
        fileInputRef.current.accept = "image/*";
      } else if (type === 'excel') {
        fileInputRef.current.accept = ".xlsx, .xls";
      } else if (type === 'word') {
        fileInputRef.current.accept = ".docx, .doc";
      }
      fileInputRef.current.value = ''; // clear
      fileInputRef.current.click();
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsGenerating(true);
    setImportStatus('正在读取上传的文件...');
    try {
      let resultTrip: any = null;

      if (importType === 'image') {
        setImportStatus('正在解析图片行程 (OCR)...');
        const base64 = await fileToBase64(file);
        const base64Clean = base64.split(',')[1] || base64;
        resultTrip = await generateItineraryFromImage(base64Clean, file.type);
      } else if (importType === 'excel') {
        setImportStatus('正在读取Excel数据...');
        const text = await parseExcel(file);
        if (!text.trim()) throw new Error("Excel文件内容为空");
        setImportStatus('正在解析并生成智能行程...');
        resultTrip = await generateItinerary(`以下是从行程Excel文件中提取的内容，请基于它生成详细的行程计划并保持模板格式一致:\n${text}`);
      } else if (importType === 'word') {
        setImportStatus('正在读取Word文档内容...');
        const text = await parseWord(file);
        if (!text.trim()) throw new Error("Word文档内容为空");
        setImportStatus('正在解析并生成智能行程...');
        resultTrip = await generateItinerary(`以下是从行程Word文件中提取的内容，请基于它生成详细的行程计划并保持模板格式一致:\n${text}`);
      }

      if (resultTrip) {
        setImportStatus('正在初始化计划模板...');
        const newTrip: Trip = {
          ...resultTrip,
          id: `trip-${Date.now()}`,
          collaborators: [
            { id: '1', name: '我 (管理员)', avatar: 'https://picsum.photos/seed/user1/100/100', role: 'admin', email: 'admin@example.com' }
          ],
          packingList: {
            [currentUserId]: mapAiPackingList(resultTrip.packingList)
          }
        };

        setTrips([newTrip, ...trips]);
        setTrip(newTrip);
        setView('detail');
        setShowNewTripModal(false);
      }
    } catch (error: any) {
      console.error(error);
      alert(`一键导入失败: ${error.message || error}`);
    } finally {
      setIsGenerating(false);
      setImportType(null);
      setImportStatus('');
    }
  };

  const handleUpdateItinerary = (newItinerary: DayPlan[]) => {
    const sortedItinerary = newItinerary.map(day => ({
      ...day,
      details: [...day.details].sort((a, b) => a.time.localeCompare(b.time))
    }));
    setTrip({ ...trip, itinerary: sortedItinerary });
  };

  const handleUpdateDayTitle = (dayId: number, title: string) => {
    const newItinerary = trip.itinerary.map(day => 
      day.id === dayId ? { ...day, title } : day
    );
    handleUpdateItinerary(newItinerary);
  };

  const handleAddDay = () => {
    const lastDay = trip.itinerary[trip.itinerary.length - 1];
    const newId = (lastDay?.id || 0) + 1;
    const newDay: DayPlan = {
      id: newId,
      date: '新日期',
      day: '周几',
      location: '新地点',
      title: '新行程标题',
      details: []
    };
    handleUpdateItinerary([...trip.itinerary, newDay]);
  };

  const handleDeleteDay = (dayId: number) => {
    handleUpdateItinerary(trip.itinerary.filter(d => d.id !== dayId));
  };

  const handleAddItem = (dayId: number) => {
    const newItinerary = trip.itinerary.map(day => {
      if (day.id === dayId) {
        const newItem: ItineraryDetail = {
          id: `item-${Date.now()}`,
          time: '12:00',
          iconName: 'MapPin',
          text: '新行程点',
          sub: '备注信息'
        };
        return { ...day, details: [...day.details, newItem] };
      }
      return day;
    });
    handleUpdateItinerary(newItinerary);
  };

  const handleDeleteItem = (dayId: number, itemId: string) => {
    const newItinerary = trip.itinerary.map(day => {
      if (day.id === dayId) {
        return { ...day, details: day.details.filter(item => item.id !== itemId) };
      }
      return day;
    });
    handleUpdateItinerary(newItinerary);
  };

  const handleUpdateItem = (dayId: number, itemId: string, updates: Partial<ItineraryDetail>) => {
    const newItinerary = trip.itinerary.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          details: day.details.map(item => item.id === itemId ? { ...item, ...updates } : item)
        };
      }
      return day;
    });
    handleUpdateItinerary(newItinerary);
  };

  const handleUpdateCollaboratorRole = (collabId: string, newRole: UserRole) => {
    if (currentUserRole !== 'admin') return;
    const newCollaborators = trip.collaborators.map(c => 
      c.id === collabId ? { ...c, role: newRole } : c
    );
    setTrip({ ...trip, collaborators: newCollaborators });
  };

  const handleUpdatePackingList = (categories: PackingCategory[]) => {
    const newPackingList = {
      ...(trip.packingList || {}),
      [currentUserId]: categories
    };
    setTrip({ ...trip, packingList: newPackingList });
    // Also update in trips list
    setTrips(trips.map(t => t.id === trip.id ? { ...t, packingList: newPackingList } : t));
  };

  const handleUpdateBudget = (newBudget: number) => {
    const updatedTrip = { ...trip, budget: newBudget };
    setTrip(updatedTrip);
    setTrips(trips.map(t => t.id === trip.id ? updatedTrip : t));
  };

  const currentUserPackingList = trip.packingList?.[currentUserId] || getInitialPackingCategories();

  const canEdit = currentUserRole === 'admin' || currentUserRole === 'editor';

  const handleAiCreate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const generatedTrip = await generateItinerary(aiPrompt);
      const newTrip: Trip = {
        ...generatedTrip,
        id: `trip-${Date.now()}`,
        collaborators: [
          { id: '1', name: '我 (管理员)', avatar: 'https://picsum.photos/seed/user1/100/100', role: 'admin', email: 'admin@example.com' }
        ],
        packingList: {
          [currentUserId]: mapAiPackingList(generatedTrip.packingList)
        }
      };
      setTrips([newTrip, ...trips]);
      setTrip(newTrip);
      setView('detail');
      setShowNewTripModal(false);
      setAiPrompt('');
    } catch (error) {
      alert('生成行程失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center overflow-hidden">
      {/* Phone Container */}
      <div className="w-[393px] h-[852px] bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] relative rounded-[50px] border-[8px] border-slate-800">
        
        <AnimatePresence mode="wait">
          {view === 'auth' ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 relative flex flex-col overflow-hidden bg-slate-900"
            >
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000" 
                  className="w-full h-full object-cover opacity-50 scale-110"
                  alt="Auth Background"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-slate-900/60 to-slate-900" />
              </div>

              <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-8 py-20 pt-[120px]">
                <div className="text-center space-y-6">
                  <motion.div 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-20 h-20 bg-blue-600 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/40">
                      <Globe size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-[0.12em] text-white leading-none mb-4">
                      TRAVEL<span className="text-blue-500">BUDDY</span>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium tracking-[0.3em] uppercase">智能协作旅行助手</p>
                  </motion.div>
                </div>

                <motion.button
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setView('home')}
                  className="w-full py-6 bg-white text-slate-900 rounded-[32px] font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  开启旅程
                </motion.button>
              </div>
            </motion.div>
          ) : view === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-hidden bg-slate-50"
            >
              {/* Home Header */}
              <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 pb-6 pt-[70px] z-40 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">TravelBuddy</span>
                </div>
                <h1 className="text-[36px] font-black tracking-tight text-slate-900">我的计划</h1>
              </header>

              {/* Plans List */}
              <main className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {trips.map((t) => (
                  <motion.div 
                    key={t.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setTrip(t);
                      setView('detail');
                    }}
                    className="relative h-64 rounded-[40px] overflow-hidden shadow-2xl shadow-blue-100/50 group cursor-pointer"
                  >
                    <img 
                      src={t.cover} 
                      alt={t.name} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                          {t.status}
                        </span>
                        <div className="flex items-center gap-1 text-white/80 text-[11px] font-bold">
                          <Users size={12} /> {t.collaborators.length} 位协作者
                        </div>
                      </div>
                      <h2 className="text-2xl font-black text-white mb-1 leading-tight">{t.name}</h2>
                    </div>
                  </motion.div>
                ))}

                {/* New Plan Entry */}
                <button 
                  onClick={() => setShowNewTripModal(true)}
                  className="w-full h-32 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    <Plus size={28} strokeWidth={2.5} />
                  </div>
                  <span className="text-[12px] font-black uppercase tracking-[0.2em]">开启新旅程</span>
                </button>
              </main>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col overflow-hidden bg-slate-50"
            >
              {/* Detail Header */}
              <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 pb-4 pt-[60px] z-40 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setView('home')}
                    className="w-11 h-11 rounded-[22px] bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors active:scale-90"
                  >
                    <ArrowLeft size={22} />
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">行程详情</span>
                    </div>
                    <h1 className="text-[20px] font-black tracking-tight text-slate-900 leading-tight">智能协作助手</h1>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {canEdit && (
                    <button 
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-[22px] text-[14px] font-black transition-all active:scale-95",
                        isEditMode 
                          ? "bg-blue-600 text-white shadow-xl shadow-blue-200" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {isEditMode ? <Check size={16} strokeWidth={3} /> : <Edit2 size={16} strokeWidth={3} />}
                      {isEditMode ? '完成' : '编辑'}
                    </button>
                  )}
                </div>
              </header>

        {/* Main Content (Scrollable) */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pb-[calc(110px+env(safe-area-inset-bottom))]">
          <AnimatePresence mode="wait">
            {activeTab === 'itinerary' && (
              <motion.div
                key="itinerary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {/* Trip Hero */}
                <div className="px-4 pt-5 pb-2">
                  <div className="relative h-52 rounded-[32px] overflow-hidden shadow-xl shadow-blue-100 mb-6 group">
                    <img 
                      src={trip.cover} 
                      alt="Cover" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                            {trip.status}
                          </span>
                          <button 
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-1 text-white/80 text-[10px] font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded-full transition-colors"
                          >
                            <Users size={10} /> {trip.collaborators.length} 位协作者
                          </button>
                        </div>
                        {currentUserRole === 'admin' && (
                          <button 
                            onClick={() => setShowInviteModal(true)}
                            className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                          >
                            <UserPlus size={14} />
                          </button>
                        )}
                      </div>
                      <h2 className="text-[24px] font-black text-white mb-0.5 leading-tight">{trip.name}</h2>
                      <p className="text-white/60 text-[13px] font-medium">
                        4月25日 — 5月5日 · 11 天深度探索
                      </p>
                    </div>
                  </div>
                </div>

                {/* Itinerary Component */}
                <Itinerary 
                  itinerary={trip.itinerary} 
                  isEditMode={isEditMode}
                  onAddDay={handleAddDay}
                  onDeleteDay={handleDeleteDay}
                  onUpdateDayTitle={handleUpdateDayTitle}
                  onAddItem={handleAddItem}
                  onDeleteItem={handleDeleteItem}
                  onUpdateItem={handleUpdateItem}
                />
              </motion.div>
            )}

            {activeTab === 'checklist' && (
              <motion.div
                key="checklist"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Checklist 
                  categories={currentUserPackingList} 
                  onUpdateCategories={handleUpdatePackingList} 
                  isEditMode={isEditMode}
                />
              </motion.div>
            )}

            {activeTab === 'research' && (
              <motion.div
                key="research"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 space-y-6"
              >
                <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-dashed border-slate-200">
                  <Search size={32} className="text-slate-300 mb-3" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">调研模块开发中</p>
                  <p className="text-slate-300 text-[10px] mt-2">这里将展示目的地攻略、机票酒店比价等信息</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'expenses' && (
              <motion.div
                key="expenses"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 space-y-6"
              >
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-black mb-4 flex items-center justify-between">
                    <span>旅行总预算</span>
                    {isEditMode && (
                      <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-full animate-pulse">
                        编辑状态
                      </span>
                    )}
                  </h3>
                  {isEditMode ? (
                    <div className="flex items-center gap-2 border-b-2 border-blue-500 pb-1">
                      <span className="text-3xl font-black text-blue-600">¥</span>
                      <input
                        id="budget-input"
                        type="number"
                        value={trip.budget ?? 12500}
                        onChange={(e) => handleUpdateBudget(Number(e.target.value) || 0)}
                        className="text-3xl font-black text-blue-600 focus:outline-none w-full bg-transparent"
                        placeholder="请输入预算金额"
                      />
                    </div>
                  ) : (
                    <div className="text-3xl font-black text-blue-600">¥ {(trip.budget ?? 12500).toLocaleString()}</div>
                  )}
                  <p className="text-slate-400 text-xs mt-2">
                    {isEditMode ? "可直接输入修改全新预算金额" : "包含机票、酒店及日常开销（点击顶部“编辑”按钮即可进行修改）"}
                  </p>
                </div>

                {/* Admin Only Section */}
                {currentUserRole === 'admin' ? (
                  <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield size={18} />
                      <h3 className="text-lg font-black">个人预算管理 (仅管理员)</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-80">我的支出</span>
                        <span className="font-bold">¥ 3,200</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-80">剩余额度</span>
                        <span className="font-bold">¥ {Math.max(0, (trip.budget ?? 12500) - 3200).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-dashed border-slate-200">
                    <ShieldAlert size={32} className="text-slate-300 mb-3" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">无权访问个人预算模块</p>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </motion.div>
    )}
  </AnimatePresence>

        {/* New Trip Modal */}
        <AnimatePresence>
          {showNewTripModal && (
            <div className="absolute inset-0 z-[100] flex items-end justify-center">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isGenerating && setShowNewTripModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full bg-white rounded-t-[40px] p-8 z-10 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black">开启新旅程</h3>
                  <button 
                    disabled={isGenerating}
                    onClick={() => setShowNewTripModal(false)} 
                    className="p-2 bg-slate-100 rounded-full text-slate-400 disabled:opacity-50"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6 relative">
                  {/* Hidden file input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                  />

                  {/* AI Create Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Sparkles size={18} />
                      <span className="text-xs font-black uppercase tracking-widest">AI 智能创建</span>
                    </div>
                    <div className="relative">
                      <textarea
                        disabled={isGenerating}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="例如：清明节4.4-4.6三天去河南旅游，去爬一天嵩山，另外两天去洛阳..."
                        className="w-full h-32 bg-slate-50 border-none rounded-3xl p-5 text-sm focus:ring-2 focus:ring-blue-500 transition-all resize-none placeholder:text-slate-300"
                      />
                      <button
                        disabled={isGenerating || !aiPrompt.trim()}
                        onClick={handleAiCreate}
                        className="absolute bottom-4 right-4 bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                      >
                        {isGenerating ? '生成中...' : '开始生成'}
                      </button>
                    </div>
                  </div>

                  <div className="h-[1px] bg-slate-100" />

                  {/* Import Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Globe size={18} />
                      <span className="text-xs font-black uppercase tracking-widest">一键导入支持格式</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: '图片/OCR', icon: Camera, type: 'image' },
                        { label: 'Excel 行程', icon: FileSpreadsheet, type: 'excel' },
                        { label: 'Word 攻略', icon: FileText, type: 'word' }
                      ].map((item, idx) => (
                        <button 
                          key={idx}
                          id={`import-btn-${item.type}`}
                          disabled={isGenerating}
                          onClick={() => triggerFileInput(item.type as 'image' | 'excel' | 'word')}
                          className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 rounded-3xl hover:bg-blue-50 hover:text-blue-600 transition-all group disabled:opacity-50 cursor-pointer"
                        >
                          <item.icon size={20} className="text-slate-400 group-hover:text-blue-500" />
                          <span className="text-[10px] font-bold">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Premium status loader during generation */}
                  {isGenerating && (
                    <div className="absolute inset-x-0 -bottom-8 -top-8 bg-white/95 backdrop-blur-sm rounded-b-[40px] z-50 flex flex-col items-center justify-center p-8 text-center space-y-4 h-[calc(100%+64px)]">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <Sparkles size={24} className="text-blue-500 absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-800">{importStatus || '智能规划完美行程中...'}</p>
                        <p className="text-xs text-slate-400 mt-1.5">AI正在深度解析文档并匹配 Unsplash 壁纸...</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Invite Modal */}
        <AnimatePresence>
          {showInviteModal && (
            <div className="absolute inset-0 z-[100] flex items-end justify-center">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowInviteModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full bg-white rounded-t-[40px] p-8 z-10 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black">管理协作者</h3>
                  <button onClick={() => setShowInviteModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6 mb-10">
                  {trip.collaborators.map(collab => (
                    <div key={collab.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={collab.avatar} className="w-10 h-10 rounded-2xl" alt={collab.name} />
                        <div>
                          <div className="text-sm font-bold text-slate-900">{collab.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{collab.email}</div>
                        </div>
                      </div>
                      {currentUserRole === 'admin' && collab.role !== 'admin' ? (
                        <select 
                          className="text-[10px] font-black bg-slate-50 border-none rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500"
                          value={collab.role}
                          onChange={(e) => handleUpdateCollaboratorRole(collab.id, e.target.value as UserRole)}
                        >
                          <option value="editor">可编辑</option>
                          <option value="viewer">仅查看</option>
                        </select>
                      ) : (
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-widest">
                          {collab.role === 'admin' ? '管理员' : collab.role === 'editor' ? '可编辑' : '仅查看'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      alert('链接已复制，请前往微信粘贴分享给好友！');
                    }}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-100 active:scale-[0.98] transition-all"
                  >
                    <Link2 size={18} /> 复制邀请链接
                  </button>
                  <p className="text-center text-[10px] text-slate-400 font-medium">
                    邀请好友加入，共同规划完美的旅程
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation (Only in Detail View) */}
        {view === 'detail' && (
          <div className="absolute bottom-0 left-0 right-0 z-50">
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
        @supports (backdrop-filter: blur(20px)) {
          .backdrop-blur-xl {
            backdrop-filter: blur(20px);
          }
        }
      `}} />
    </div>
  );
}
