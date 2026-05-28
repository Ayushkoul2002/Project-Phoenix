// ============================================
// PROJECT PHOENIX — Dashboard Shell
// ============================================
// Fixed bottom nav with 5 action slots, central
// raised "+" FAB, and Quick Log Food modal integration
// that redirects cleanly to Manifest Log upon logging.
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoShieldCheckmark, IoBook, IoList, IoStatsChart, IoLogOut, 
  IoAdd, IoClose, IoSearch, IoFlash, IoSettings, IoScale, IoSpeedometer, IoRefresh 
} from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../firebase/authService';
import { subscribeCustomFoods, subscribeAllFoodLogs, addFoodLog, subscribeUserProfile, wipeAllUserData } from '../../firebase/firestoreService';
import defaultFoods from '../../data/defaultFoods';
import MissionControl from '../Tabs/MissionControl';
import QuestVault from '../Tabs/QuestVault';
import ManifestLog from '../Tabs/ManifestLog';
import Archive from '../Tabs/Archive';
import ProfileSetup from './ProfileSetup';

const tabs = [
  { id: 'mission', label: 'MISSION', icon: IoShieldCheckmark },
  { id: 'quest', label: 'VAULT', icon: IoBook },
  { id: 'manifest', label: 'LOG', icon: IoList },
  { id: 'progress', label: 'PROGRESS', icon: IoStatsChart },
];

const tabVariants = {
  initial: (direction) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 350, damping: 30 },
  },
  exit: (direction) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.12 },
  }),
};

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Subscribe to user profile
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeUserProfile(user.uid, (data) => {
      setProfile(data);
      setProfileLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Quick Log FAB States
  const [showFAB, setShowFAB] = useState(false);
  const [fabSearch, setFabSearch] = useState('');
  const [fabSelected, setFabSelected] = useState(null);
  const [fabServings, setFabServings] = useState(1);
  const [fabLogging, setFabLogging] = useState(false);
  const [fabSuccess, setFabSuccess] = useState(false);
  const [customFoods, setCustomFoods] = useState([]);
  const [allFoodLogs, setAllFoodLogs] = useState([]);

  // Subscriptions for Quick Log data
  useEffect(() => {
    if (!user) return;
    const u = subscribeCustomFoods(user.uid, setCustomFoods);
    return () => u();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const u = subscribeAllFoodLogs(user.uid, setAllFoodLogs);
    return () => u();
  }, [user]);

  // All foods dictionary merged
  const allFoodsDict = useMemo(() => {
    const custom = customFoods.map((f) => ({ name: f.name, calories: f.calories, protein: f.protein, isCustom: true }));
    return [...defaultFoods, ...custom].sort((a, b) => a.name.localeCompare(b.name));
  }, [customFoods]);

  // Recent foods (last 10 unique food names)
  const recentFoods = useMemo(() => {
    const seen = new Set();
    const recents = [];
    for (let i = allFoodLogs.length - 1; i >= 0 && recents.length < 10; i--) {
      const name = allFoodLogs[i].foodName;
      if (!seen.has(name)) {
        seen.add(name);
        const match = allFoodsDict.find((f) => f.name === name);
        if (match) recents.push(match);
        else recents.push({ name, calories: allFoodLogs[i].calories, protein: allFoodLogs[i].protein });
      }
    }
    return recents;
  }, [allFoodLogs, allFoodsDict]);

  // Filtered foods for modal
  const fabFilteredFoods = useMemo(() => {
    if (!fabSearch.trim()) return recentFoods;
    const q = fabSearch.toLowerCase();
    return allFoodsDict.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 20);
  }, [fabSearch, allFoodsDict, recentFoods]);

  const handleTabChange = (idx) => {
    setDirection(idx > activeTab ? 1 : -1);
    setActiveTab(idx);
  };

  const handleLogout = async () => {
    try { await logoutUser(); } catch (e) { console.error('Logout error:', e); }
  };

  const handleFabLog = async () => {
    if (!fabSelected || fabLogging) return;
    setFabLogging(true);
    try {
      await addFoodLog(user.uid, { foodName: fabSelected.name, calories: fabSelected.calories * fabServings, protein: fabSelected.protein * fabServings, logDate: selectedDate });
      setFabSuccess(true);
      setTimeout(() => {
        setFabSuccess(false);
        setFabSelected(null);
        setFabServings(1);
        setFabSearch('');
        setShowFAB(false);
        
        // Auto-redirect active tab to LOG index (index 2)
        handleTabChange(2);
      }, 600);
    } catch (e) {
      console.error(e);
    } finally {
      setFabLogging(false);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 0: return <MissionControl uid={user.uid} selectedDate={selectedDate} profile={profile} />;
      case 1: return <QuestVault uid={user.uid} selectedDate={selectedDate} profile={profile} />;
      case 2: return <ManifestLog uid={user.uid} selectedDate={selectedDate} setSelectedDate={setSelectedDate} profile={profile} />;
      case 3: return <Archive uid={user.uid} profile={profile} />;
      default: return null;
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono text-slate-400">
        <span className="w-4 h-4 border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin mb-3" />
        <span className="text-[10px] tracking-[0.2em] text-cyan-400 animate-pulse">CONNECTING INTERFACE...</span>
      </div>
    );
  }

  if (!profile) {
    return <ProfileSetup uid={user.uid} onComplete={(data) => setProfile(data)} />;
  }

  if (isEditingProfile) {
    return <ProfileSetup uid={user.uid} onComplete={(data) => { setProfile(data); setIsEditingProfile(false); }} onCancel={() => setIsEditingProfile(false)} />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-950 text-slate-300 flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-3 py-2 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-slate-500 tracking-wider">PHOENIX_OS</span>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 hover:text-cyan-400 transition-colors p-2 min-w-[44px] min-h-[44px] justify-center"
          aria-label="Open Settings"
        >
          <IoSettings size={16} />
          <span className="hidden sm:inline font-bold tracking-wider">SETTINGS</span>
        </button>
      </header>

      {/* Content — bottom padding accounts for nav bar */}
      <main className="flex-1 overflow-y-auto pb-20 relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50 z-50 safe-area-bottom">
        <div className="flex items-stretch max-w-lg mx-auto relative px-1.5">
          
          {/* Left Tabs (Mission, Vault) */}
          <div className="flex-1 flex items-stretch">
            {tabs.slice(0, 2).map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = idx === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(idx)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-all duration-300 relative ${
                    isActive ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'
                  }`}
                  aria-label={tab.label}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBg"
                      className="absolute inset-x-1.5 inset-y-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={20} className="relative z-10" />
                  <span className="text-[9px] font-mono mt-0.5 relative z-10 tracking-wider">
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Central Raised "+" FAB Action Button */}
          <div className="w-14 flex items-center justify-center relative">
            <motion.button
              onClick={() => { setShowFAB(true); setFabSearch(''); setFabSelected(null); setFabServings(1); }}
              whileTap={{ scale: 0.9 }}
              className="absolute -top-5 w-13 h-13 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/35 border-4 border-slate-950 text-white z-20 active:shadow-cyan-500/55"
              aria-label="Log Food Action"
            >
              <IoAdd size={24} />
            </motion.button>
          </div>

          {/* Right Tabs (Log, Progress) */}
          <div className="flex-1 flex items-stretch">
            {tabs.slice(2, 4).map((tab, idx) => {
              const actualIdx = idx + 2;
              const Icon = tab.icon;
              const isActive = actualIdx === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(actualIdx)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-all duration-300 relative ${
                    isActive ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'
                  }`}
                  aria-label={tab.label}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBg"
                      className="absolute inset-x-1.5 inset-y-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={20} className="relative z-10" />
                  <span className="text-[9px] font-mono mt-0.5 relative z-10 tracking-wider">
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

        </div>
      </nav>

      {/* ──────── Quick Log FAB Modal (Mounted in Shell) ──────── */}
      <AnimatePresence>
        {showFAB && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowFAB(false); setFabSelected(null); }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700/50 rounded-t-2xl z-[70] max-w-lg mx-auto safe-area-bottom flex flex-col"
              style={{ height: '90dvh', maxHeight: '90dvh' }}
            >
              <div className="p-4 pb-2">
                <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold font-mono text-white tracking-wider">QUICK LOG</h3>
                  <button onClick={() => { setShowFAB(false); setFabSelected(null); }} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-300 rounded-lg"><IoClose size={20} /></button>
                </div>

                {selectedDate && selectedDate.toDateString() !== new Date().toDateString() && (
                  <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2 text-center text-[9px] font-mono text-amber-400 uppercase tracking-wider mb-3 leading-tight mx-0">
                    ⚠️ TIME TRAVEL ACTIVE: LOGGING TO {selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()}
                  </div>
                )}

                {!fabSelected ? (
                  <>
                    {/* Search */}
                    <div className="relative mb-3">
                      <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input type="text" value={fabSearch} onChange={(e) => setFabSearch(e.target.value)} placeholder="Search food..." autoFocus
                        className="w-full bg-slate-800/60 border border-slate-600/30 rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-650 focus:outline-none focus:border-cyan-500/40" />
                    </div>
                    {!fabSearch && recentFoods.length > 0 && <span className="text-[8px] font-mono text-slate-500 tracking-wider mb-1 block">RECENT</span>}
                    {fabSearch && <span className="text-[8px] font-mono text-slate-500 tracking-wider mb-1 block">RESULTS</span>}
                  </>
                ) : (
                  /* Selected food details */
                  <div>
                    <h4 className="text-base font-bold font-mono text-white mb-1">{fabSelected.name}</h4>
                    <div className="flex gap-3 mb-3">
                      <span className="text-sm font-mono text-emerald-400">{(fabSelected.calories * fabServings).toFixed(0)} kcal</span>
                      <span className="text-sm font-mono text-slate-400">{(fabSelected.protein * fabServings).toFixed(1)}g protein</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-800/60 rounded-xl p-3 mb-3">
                      <span className="text-[10px] font-mono text-slate-400">SERVINGS</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setFabServings(Math.max(0.5, fabServings - 0.5))} className="w-9 h-9 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-mono flex items-center justify-center">−</button>
                        <span className="text-lg font-bold font-mono text-white min-w-[32px] text-center">{fabServings}</span>
                        <button onClick={() => setFabServings(fabServings + 0.5)} className="w-9 h-9 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-mono flex items-center justify-center">+</button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setFabSelected(null)} className="flex-1 py-3 rounded-xl font-mono text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors min-h-[48px]">← BACK</button>
                      <motion.button onClick={handleFabLog} disabled={fabLogging} whileTap={{ scale: 0.97 }}
                        className={`flex-[2] py-3 rounded-xl font-mono font-bold text-sm tracking-wider transition-all min-h-[48px] flex items-center justify-center gap-2 ${
                          fabSuccess ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                        } disabled:opacity-50`}>
                        {fabSuccess ? '✓ LOGGED' : <><IoFlash size={14} /> LOG IT</>}
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>

              {/* Food list (scrollable) */}
              {!fabSelected && (
                <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1 scrollbar-thin">
                  {fabFilteredFoods.map((food, idx) => (
                    <button key={`${food.name}-${idx}`} onClick={() => { setFabSelected(food); setFabServings(1); }}
                      className="w-full flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/20 rounded-lg px-3 py-2.5 min-h-[44px] transition-all text-left">
                      <span className="text-[12px] font-mono text-slate-200 truncate flex-1 mr-2">{food.name}</span>
                      <div className="flex gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-emerald-400">{food.calories}</span>
                        <span className="text-[9px] font-mono text-slate-500">{food.protein}g</span>
                      </div>
                    </button>
                  ))}
                  {fabFilteredFoods.length === 0 && <p className="text-center text-[10px] font-mono text-slate-600 py-4">NO RESULTS</p>}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ──────── Settings Overlay Panel ──────── */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80]" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700/50 rounded-t-2xl z-[90] max-w-lg mx-auto safe-area-bottom flex flex-col font-mono"
              style={{ height: '85dvh', maxHeight: '85dvh' }}
            >
              <div className="p-5 pb-3 shrink-0 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <IoSettings className="text-cyan-400" size={18} />
                  <h3 className="text-sm font-bold text-white tracking-widest uppercase">SYSTEM SETTINGS</h3>
                </div>
                <button onClick={() => setShowSettings(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-200 rounded-xl bg-slate-800/40"><IoClose size={20} /></button>
              </div>

              {/* Scrollable Settings Panel */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
                
                {/* Metabolic Profile Info */}
                <div className="bg-slate-800/95 border border-slate-700 rounded-2xl p-5 space-y-3.5 shadow-lg">
                  <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                    <IoScale className="text-cyan-400" size={16} />
                    <span className="text-[10px] font-bold text-cyan-300 tracking-wider">YOUR METABOLIC PROFILE</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 text-xs font-semibold">
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 shadow-inner">
                      <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider">HEIGHT / AGE</span>
                      <span className="text-slate-200 font-bold font-mono mt-0.5 block">{profile.height} cm / {profile.age} yrs</span>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 shadow-inner">
                      <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider">CURRENT MASS</span>
                      <span className="text-slate-200 font-bold font-mono mt-0.5 block">{profile.currentWeight} kg</span>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 shadow-inner">
                      <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider">TARGET MASS</span>
                      <span className="text-pink-400 font-bold font-mono mt-0.5 block">{profile.targetWeight} kg</span>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 shadow-inner">
                      <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider">CALORIE INTAKE</span>
                      <span className="text-cyan-300 font-bold font-mono mt-0.5 block">{profile.calorieTarget} kcal/d</span>
                    </div>
                  </div>
                </div>

                {/* Primary Setting Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => { setIsEditingProfile(true); }}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white rounded-2xl text-xs font-bold tracking-widest transition-all min-h-[52px] flex items-center justify-center gap-2.5 uppercase shadow-md"
                  >
                    <IoSpeedometer className="text-cyan-400" size={16} />
                    Modify Goals & Profile
                  </button>

                  <button
                    onClick={() => setShowWipeConfirm(true)}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white rounded-2xl text-xs font-bold tracking-widest transition-all min-h-[52px] flex items-center justify-center gap-2.5 uppercase shadow-md"
                  >
                    <IoRefresh className="text-amber-400" size={16} />
                    Fresh Start / Reset Logs
                  </button>
                </div>
              </div>

              {/* Exit Terminal Action */}
              <div className="p-5 border-t border-slate-800 bg-slate-900 shrink-0">
                <button
                  onClick={handleLogout}
                  className="w-full py-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-2xl text-xs font-bold tracking-widest transition-all min-h-[52px] flex items-center justify-center gap-2 uppercase shadow-lg shadow-red-500/10"
                >
                  <IoLogOut size={16} />
                  Exit Terminal (Logout)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fresh Start / Reset Database Confirmation Modal */}
      <AnimatePresence>
        {showWipeConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowWipeConfirm(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-amber-500/30 rounded-2xl p-6 z-[110] max-w-xs w-full text-center shadow-2xl shadow-amber-500/10 font-mono"
            >
              <span className="text-3xl block mb-2">⚠️</span>
              <h4 className="text-sm font-bold text-white tracking-widest uppercase mb-2">FRESH START?</h4>
              <p className="text-[10px] text-slate-400 mb-5 uppercase leading-normal">
                This action will delete all food logs, weight entries, custom foods, and target goals. This cannot be undone!
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowWipeConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-[11px] text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-750 transition-colors min-h-[42px] uppercase font-bold"
                >
                  CANCEL
                </button>
                <button
                  onClick={async () => {
                    await wipeAllUserData(user.uid);
                    setShowWipeConfirm(false);
                    setShowSettings(false);
                    setProfile(null); // Triggers re-onboarding setup instantly!
                    setActiveTab(0); // Reset active tab back to Mission Control!
                  }}
                  className="flex-1 py-3 rounded-xl text-[11px] text-white bg-amber-600 hover:bg-amber-500 transition-colors min-h-[42px] uppercase font-bold shadow-lg shadow-amber-500/20"
                >
                  WIPE DATA
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
