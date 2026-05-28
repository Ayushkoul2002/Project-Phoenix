// ============================================
// PROJECT PHOENIX — TAB 2: THE QUEST VAULT
// ============================================
// Food dictionary with recents at top, search,
// category filter, custom food creation, and
// fast logging modal.
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSearch, IoAdd, IoClose, IoFlash, IoChevronDown, IoChevronUp, IoTime, IoTrash } from 'react-icons/io5';
import defaultFoods from '../../data/defaultFoods';
import { subscribeCustomFoods, addCustomFood, addFoodLog, subscribeAllFoodLogs, deleteCustomFood } from '../../firebase/firestoreService';

const CATEGORIES = ['All', 'Custom', 'Breads', 'Rice', 'Dal', 'Sabzi', 'Non-Veg', 'Eggs', 'Dairy', 'Breakfast', 'Snacks', 'Fruits', 'Dry Fruits', 'Drinks', 'Sweets', 'Supplements'];

const QuestVault = ({ uid, selectedDate }) => {
  const [customFoods, setCustomFoods] = useState([]);
  const [allFoodLogs, setAllFoodLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(() => {
    return localStorage.getItem('phoenix_active_category') || 'All';
  });
  const [selectedFood, setSelectedFood] = useState(null);
  const [servings, setServings] = useState(1);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCal, setCustomCal] = useState('');
  const [customPro, setCustomPro] = useState('');
  const [logSuccess, setLogSuccess] = useState(false);
  const [logging, setLogging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    localStorage.setItem('phoenix_active_category', activeCategory);
  }, [activeCategory]);

  useEffect(() => { const u = subscribeCustomFoods(uid, setCustomFoods); return () => u(); }, [uid]);
  useEffect(() => { const u = subscribeAllFoodLogs(uid, setAllFoodLogs); return () => u(); }, [uid]);

  const allFoods = useMemo(() => {
    const custom = customFoods.map((f) => ({ id: f.id, name: f.name, calories: f.calories, protein: f.protein, isCustom: true, category: 'Custom' }));
    return [...defaultFoods, ...custom].sort((a, b) => a.name.localeCompare(b.name));
  }, [customFoods]);

  // Recent foods (last 8 unique food names logged)
  const recentFoods = useMemo(() => {
    const seen = new Set();
    const recents = [];
    for (let i = allFoodLogs.length - 1; i >= 0 && recents.length < 8; i--) {
      const name = allFoodLogs[i].foodName;
      if (!seen.has(name)) {
        seen.add(name);
        const match = allFoods.find((f) => f.name === name);
        if (match) recents.push(match);
        else recents.push({ name, calories: allFoodLogs[i].calories, protein: allFoodLogs[i].protein });
      }
    }
    return recents;
  }, [allFoodLogs, allFoods]);

  const filteredFoods = useMemo(() => {
    let list = allFoods;
    if (activeCategory !== 'All') {
      list = list.filter((f) => f.category === activeCategory || (f.isCustom && activeCategory === 'Custom'));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return list;
  }, [allFoods, search, activeCategory]);

  // Determine what to display: if no search and no category filter, show recents + all
  const showRecents = !search.trim() && activeCategory === 'All' && recentFoods.length > 0;

  const handleLog = async () => {
    if (!selectedFood || logging) return;
    setLogging(true);
    try {
      await addFoodLog(uid, { foodName: selectedFood.name, calories: selectedFood.calories * servings, protein: selectedFood.protein * servings, logDate: selectedDate });
      setLogSuccess(true);
      setTimeout(() => { setLogSuccess(false); setSelectedFood(null); setServings(1); }, 800);
    } catch (e) { console.error('Log error:', e); }
    finally { setLogging(false); }
  };

  const handleAddCustom = async (e) => {
    e.preventDefault();
    if (!customName.trim() || !customCal) return;
    try {
      await addCustomFood(uid, { name: customName.trim(), calories: Number(customCal), protein: Number(customPro) || 0 });
      setCustomName(''); setCustomCal(''); setCustomPro(''); setShowAddCustom(false);
    } catch (e) { console.error(e); }
  };
  const handleDeleteCustomFood = async (id) => {
    try {
      await deleteCustomFood(uid, id);
    } catch (e) {
      console.error(e);
    }
  };  const FoodRow = ({ food, idx }) => (
    <motion.button
      whileHover={{ scale: 1.01, backgroundColor: 'rgba(241, 245, 249, 0.6)' }}
      whileTap={{ scale: 0.99 }}
      onClick={() => { setSelectedFood(food); setServings(1); }}
      className="w-full flex items-center justify-between bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 min-h-[44px] transition-all text-left shadow-sm cursor-pointer"
    >
      <div className="flex-1 min-w-0 mr-2 flex items-center gap-1.5 font-sans">
        <span className="text-[13px] font-bold text-slate-800 truncate">{food.name}</span>
        {food.isCustom && (
          <span className="text-[7px] font-extrabold text-cyan-600 bg-cyan-50 border border-cyan-200 px-1 rounded uppercase shrink-0">
            CST
          </span>
        )}
      </div>
      <div className="flex items-center gap-2.5 shrink-0 font-sans">
        <span className="text-xs font-black text-emerald-600">{food.calories} kcal</span>
        <span className="text-[9px] font-bold text-slate-450 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">{food.protein}g pro</span>
      </div>
    </motion.button>
  );

  return (
    <div className="px-6 pt-5 pb-8 max-w-lg mx-auto font-sans">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-br from-cyan-600 to-emerald-600 uppercase">QUEST VAULT</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-sm" />
          <span className="text-[9px] font-bold text-slate-450 tracking-wider uppercase">{allFoods.length} DATABASE RECORDS • SELECT TO LOG</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Query food database..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-sans text-slate-805 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all shadow-sm" />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2.5 mb-6 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-[9px] font-bold tracking-wider transition-all cursor-pointer ${
              activeCategory === cat ? 'bg-cyan-50 text-cyan-650 border border-cyan-200 shadow-sm font-black' : 'bg-slate-100/80 text-slate-450 border border-slate-200 hover:text-slate-650 hover:bg-slate-200/50'
            }`}>{cat.toUpperCase()}</button>
        ))}
      </div>

      {/* Add Custom Food Toggle */}
      <button onClick={() => setShowAddCustom(!showAddCustom)}
        className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-cyan-600 hover:text-cyan-750 transition-colors mb-3 py-1 min-h-[32px] uppercase cursor-pointer">
        {showAddCustom ? <IoChevronUp size={12} /> : <IoAdd size={12} />}
        {showAddCustom ? 'CLOSE CUSTOM FORM' : 'ADD CUSTOM MEAL FORMULA'}
      </button>

      {/* Add Custom Form */}
      <AnimatePresence>
        {showAddCustom && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddCustom} className="bg-white border border-slate-200 rounded-3xl p-5 mb-4 shadow-sm overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
                <span className="text-[8px] font-bold text-cyan-700 uppercase tracking-widest font-bold">NEW CUSTOM MEAL FORMULA</span>
              </div>
              <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Enter food name..." required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white box-border transition-all" />
              <div className="flex gap-3">
                <div className="flex-1">
                  <span className="text-[8px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">CALORIES (KCAL)</span>
                  <input type="number" value={customCal} onChange={(e) => setCustomCal(e.target.value)} placeholder="Kcal" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white box-border transition-all" />
                </div>
                <div className="flex-1">
                  <span className="text-[8px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">PROTEIN (GRAMS)</span>
                  <input type="number" value={customPro} onChange={(e) => setCustomPro(e.target.value)} placeholder="Grams"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white box-border transition-all" />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-cyan-500/10 min-h-[44px] uppercase tracking-wider cursor-pointer">
                Save Custom Food
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Food List container */}
      <div className="space-y-4 max-h-[50vh] overflow-y-auto scrollbar-thin pr-1">
        {/* Recent Foods Section */}
        {showRecents && (
          <div className="mb-2">
            <div className="flex items-center gap-1.5 mb-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-max">
              <IoTime size={12} className="text-amber-600" />
              <span className="text-[9px] font-bold text-amber-705 tracking-widest uppercase font-bold">FREQUENCY HOTLIST</span>
            </div>
            <div className="space-y-2">
              {recentFoods.map((food, idx) => <FoodRow key={`recent-${idx}`} food={food} idx={idx} />)}
            </div>
            <div className="border-t border-slate-200/80 my-4" />
            <span className="text-[9px] font-bold text-slate-450 tracking-widest uppercase font-bold block mb-2.5">VAULT REGISTRY</span>
          </div>
        )}

        {/* All/Filtered foods */}
        <div className="space-y-2">
          {filteredFoods.map((food, idx) => <FoodRow key={`${food.name}-${idx}`} food={food} idx={idx} />)}
        </div>
        {filteredFoods.length === 0 && <div className="text-center py-8 text-slate-400 text-[10px] font-bold w-full uppercase">NO MATCHING ITEMS IN REGISTRY</div>}
      </div>

      {/* Fast Log Modal */}
      <AnimatePresence>
        {selectedFood && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedFood(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 rounded-t-3xl p-5 z-[70] max-w-lg mx-auto safe-area-bottom shadow-2xl">
              <div className="w-10 h-1 bg-slate-350 rounded-full mx-auto mb-3" />
              
              {selectedDate && selectedDate.toDateString() !== new Date().toDateString() && (
                <div className="bg-amber-50 border border-amber-250 rounded-xl px-3 py-2 text-center text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-3 leading-tight">
                  ⚠️ TIME TRAVEL ACTIVE: LOGGING TO {selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()}
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-extrabold text-slate-900 truncate flex-1 mr-2">{selectedFood.name}</h3>
                {selectedFood.isCustom && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0 cursor-pointer"
                    aria-label="Delete Formula"
                  >
                    <IoTrash size={18} />
                  </button>
                )}
              </div>

              <div className="flex gap-3 mb-4">
                <span className="text-sm font-bold text-emerald-600">{(selectedFood.calories * servings).toFixed(0)} kcal</span>
                <span className="text-sm font-bold text-slate-500">{(selectedFood.protein * servings).toFixed(1)}g protein</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SERVINGS</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setServings(Math.max(0.5, servings - 0.5))} className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-extrabold text-lg flex items-center justify-center cursor-pointer shadow-sm">−</button>
                  <span className="text-lg font-black text-slate-800 min-w-[36px] text-center">{servings}</span>
                  <button onClick={() => setServings(servings + 0.5)} className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-extrabold text-lg flex items-center justify-center cursor-pointer shadow-sm">+</button>
                </div>
              </div>
              <motion.button onClick={handleLog} disabled={logging} whileTap={{ scale: 0.97 }}
                className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all min-h-[48px] flex items-center justify-center gap-2 uppercase cursor-pointer shadow-md ${
                  logSuccess ? 'bg-emerald-600 text-white shadow-emerald-500/10' : 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-cyan-500/10'
                } disabled:opacity-50`}>
                {logSuccess ? '✓ LOGGED' : <><IoFlash size={16} /> LOG IT</>}
              </motion.button>
              <button onClick={() => setSelectedFood(null)} className="w-full py-2 mt-1 text-slate-400 hover:text-slate-650 text-[10px] font-bold min-h-[40px] cursor-pointer">CANCEL</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-2xl p-6 z-[90] max-w-xs w-full text-center shadow-2xl"
            >
              <span className="text-3xl block mb-2">⚠️</span>
              <h4 className="text-sm font-extrabold text-slate-900 tracking-widest uppercase mb-2">PURGE RECORD?</h4>
              <p className="text-[10px] text-slate-500 mb-5 uppercase leading-normal font-medium">
                This action will delete the food formula for "{selectedFood?.name}" permanently.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-[11px] text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors min-h-[40px] uppercase font-bold cursor-pointer"
                >
                  RETAIN
                </button>
                <button
                  onClick={async () => {
                    await handleDeleteCustomFood(selectedFood.id);
                    setShowDeleteConfirm(false);
                    setSelectedFood(null); // Close the servings modal too!
                  }}
                  className="flex-1 py-2.5 rounded-xl text-[11px] text-white bg-red-600 hover:bg-red-500 transition-colors min-h-[40px] uppercase font-bold shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  PURGE
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestVault;
