// ============================================
// PROJECT PHOENIX — TAB 3: THE MANIFEST LOG
// ============================================
// Day log with date navigation, custom styled 
// calendar modal, radial progress summary, and 
// compact chronological food records.
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoTrash, IoFlame, IoNutrition, IoChevronBack, IoChevronForward, IoCalendar } from 'react-icons/io5';
import { subscribeDateFoodLogs, deleteFoodLog } from '../../firebase/firestoreService';

const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const DAYS_SHORT = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

const formatDateLabel = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'TODAY';
  if (isSameDay(date, yesterday)) return 'YESTERDAY';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
};

const isToday = (date) => {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
};

const ManifestLog = ({ uid, selectedDate, setSelectedDate, profile }) => {
  const [foodLogs, setFoodLogs] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [logToDelete, setLogToDelete] = useState(null);
  
  // Custom Calendar Modal State
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    const unsub = subscribeDateFoodLogs(uid, selectedDate, setFoodLogs);
    return () => unsub();
  }, [uid, selectedDate]);

  const calorieTarget = profile?.calorieTarget || 2436;
  const proteinTarget = profile?.proteinTarget || 100;

  const totalCalories = foodLogs.reduce((sum, l) => sum + (l.calories || 0), 0);
  const totalProtein = foodLogs.reduce((sum, l) => sum + (l.protein || 0), 0);
  const caloriePercent = Math.min((totalCalories / calorieTarget) * 100, 100);
  const isOverdrive = totalCalories > calorieTarget;

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (caloriePercent / 100) * circumference;
  const ringColor = isOverdrive ? '#d946ef' : '#10b981';
  const ringGlow = isOverdrive ? '0 3px 10px rgba(217,70,239,0.15)' : '0 3px 10px rgba(16,185,129,0.12)';

  const handleDelete = async (docId) => {
    setDeleting(docId);
    try {
      await deleteFoodLog(uid, docId);
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setDeleting(null);
      setLogToDelete(null);
    }
  };

  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const toggleCalendar = () => {
    setCalendarMonth(new Date(selectedDate));
    setShowCalendar(!showCalendar);
  };

  // Custom Calendar Date Switching
  const prevMonth = () => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() - 1);
    setCalendarMonth(d);
  };

  const nextMonth = () => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() + 1);
    setCalendarMonth(d);
  };

  // Custom Calendar Days Generator
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const gridItems = [...blanks, ...days];

  return (
    <div className="px-6 pt-5 pb-8 max-w-lg mx-auto font-sans">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-br from-amber-600 to-emerald-600 uppercase">
          MANIFEST LOG
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-sm" />
          <span className="text-[9px] font-bold text-slate-450 tracking-wider uppercase">HISTORICAL CHRONICLES INDEX</span>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-3xl px-2.5 py-2 mb-5 shadow-sm">
        <button onClick={goToPrevDay} className="w-11 h-11 flex items-center justify-center text-slate-500 hover:text-cyan-600 active:scale-90 transition-all rounded-xl hover:bg-slate-100 cursor-pointer" aria-label="Previous day">
          <IoChevronBack size={18} />
        </button>
        <button onClick={toggleCalendar} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 hover:text-cyan-600 bg-slate-50 border border-slate-200 hover:border-cyan-400/50 rounded-xl transition-all min-h-[44px] shadow-inner tracking-wider cursor-pointer">
          <IoCalendar size={14} className="text-cyan-605" />
          <span>{formatDateLabel(selectedDate)}</span>
        </button>
        <button onClick={goToNextDay} className="w-11 h-11 flex items-center justify-center text-slate-500 hover:text-cyan-600 active:scale-90 transition-all rounded-xl hover:bg-slate-100 cursor-pointer" aria-label="Next day">
          <IoChevronForward size={18} />
        </button>
      </div>

      {/* Mini Ring + Summary */}
      <div className="flex items-center gap-5 bg-white border border-slate-200 rounded-3xl p-5 mb-5 shadow-sm">
        {/* Mini Radial Ring */}
        <div className="relative shrink-0">
          <svg width="86" height="86" viewBox="0 0 120 120" className="transform -rotate-90">
            <circle cx="60" cy="60" r={radius} stroke="#e2e8f0" strokeWidth="8" fill="none" />
            <motion.circle
              cx="60" cy="60" r={radius}
              stroke={ringColor} strokeWidth="8" fill="none" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(${ringGlow})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-black text-slate-900 leading-none">{totalCalories}</span>
            <span className="text-[8px] font-bold text-slate-450 mt-0.5">/{calorieTarget}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <IoFlame className="text-emerald-600 shrink-0" size={15} />
            <div className="flex-1">
              <div className="flex justify-between items-center leading-none">
                <span className="text-[8px] font-bold text-slate-400 tracking-wider">CALORIES</span>
                <span className="text-[10px] font-black text-emerald-605">{totalCalories} / {calorieTarget} kcal</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5 border border-slate-200/50">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                  initial={{ width: 0 }} animate={{ width: `${caloriePercent}%` }} transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IoNutrition className="text-cyan-600 shrink-0" size={15} />
            <div className="flex-1">
              <div className="flex justify-between items-center leading-none">
                <span className="text-[8px] font-bold text-slate-400 tracking-wider">PROTEIN</span>
                <span className="text-[10px] font-black text-cyan-605">{totalProtein.toFixed(1)}g / {proteinTarget}g</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5 border border-slate-200/50">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                  initial={{ width: 0 }} animate={{ width: `${Math.min((totalProtein / proteinTarget) * 100, 100)}%` }} transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          </div>
          {isOverdrive && (
            <span className="text-[8px] font-bold text-fuchsia-700 bg-fuchsia-50 px-2.5 py-0.5 rounded-full border border-fuchsia-200 inline-block mt-1 uppercase">
              ⚡ OVERDRIVE +{totalCalories - calorieTarget} kcal
            </span>
          )}
        </div>
      </div>

      {/* Go to Today Quick Action */}
      {!isToday(selectedDate) && (
        <button onClick={() => setSelectedDate(new Date())} className="w-full text-center text-[10px] font-bold text-cyan-600 hover:text-cyan-750 mb-4 py-2 bg-cyan-50 border border-cyan-200 rounded-2xl transition-all tracking-wider cursor-pointer shadow-sm">
          ↩ RE-SYNCHRONIZE TO TODAY
        </button>
      )}

      {/* Food Entries Timeline */}
      <div className="space-y-2 max-h-[45vh] overflow-y-auto scrollbar-thin pr-1">
        <AnimatePresence>
          {foodLogs.map((log, idx) => (
            <motion.div
              key={log.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl px-4 py-3.5 min-h-[52px] transition-all hover:shadow-cyan-500/5 shadow-sm"
            >
              {/* Index Number Badge */}
              <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-slate-500">{idx + 1}</span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 mr-2">
                <span className="text-[13px] font-bold text-slate-805 block truncate">{log.foodName}</span>
                <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider mt-0.5">CHRONICLE LOG</span>
              </div>

              {/* Stats & Actions */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-600 block">{log.calories} <span className="text-[8px] text-slate-400 font-bold uppercase">kcal</span></span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 min-w-[42px] text-center shadow-inner">
                  <span className="text-[10px] font-black text-slate-650 block leading-none">{log.protein}g</span>
                  <span className="text-[6px] font-bold text-slate-400 block uppercase mt-0.5">PRO</span>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => setLogToDelete(log)}
                  disabled={deleting === log.id}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  aria-label="Delete entry"
                >
                  {deleting === log.id ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                      className="inline-block w-4 h-4 border-2 border-slate-200 border-t-red-500 rounded-full" />
                  ) : (
                    <IoTrash size={13} />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {foodLogs.length === 0 && (
          <div className="text-center py-12 bg-slate-100/50 border border-slate-200 rounded-3xl shadow-sm">
            <div className="text-3xl mb-2.5">📋</div>
            <h4 className="text-xs font-bold text-slate-450 tracking-wider uppercase">NO RECORDS RETRIEVED</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">TAP QUEST VAULT TO ADD ENTRIES FOR THIS DAY</p>
          </div>
        )}
      </div>

      {/* ──────── Custom Calendar Modal ──────── */}
      <AnimatePresence>
        {showCalendar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCalendar(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-3xl p-5 z-[90] max-w-sm w-full shadow-2xl flex flex-col"
            >
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 border border-slate-200/60 rounded-lg text-slate-650 hover:text-cyan-600 active:scale-95 transition-all shadow-sm cursor-pointer">
                  <IoChevronBack size={16} />
                </button>
                <div className="text-center">
                  <span className="text-sm font-black text-slate-900 tracking-widest uppercase">
                    {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                  </span>
                </div>
                <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 border border-slate-200/60 rounded-lg text-slate-650 hover:text-cyan-600 active:scale-95 transition-all shadow-sm cursor-pointer">
                  <IoChevronForward size={16} />
                </button>
              </div>

              {/* Day Headers (SU, MO...) */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {DAYS_SHORT.map((day) => (
                  <span key={day} className="text-[8px] font-bold text-slate-400 tracking-wider uppercase">
                    {day}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {gridItems.map((day, idx) => {
                  if (day === null) return <div key={`blank-${idx}`} className="w-9 h-9" />;

                  const isSel = selectedDate.getDate() === day &&
                    selectedDate.getMonth() === calendarMonth.getMonth() &&
                    selectedDate.getFullYear() === calendarMonth.getFullYear();

                  const isTod = new Date().getDate() === day &&
                    new Date().getMonth() === calendarMonth.getMonth() &&
                    new Date().getFullYear() === calendarMonth.getFullYear();

                  return (
                    <motion.button
                      key={`day-${day}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
                        setShowCalendar(false);
                      }}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs transition-all font-bold cursor-pointer ${
                        isSel
                          ? 'bg-cyan-50 text-cyan-600 border border-cyan-300 shadow-sm shadow-cyan-500/10'
                          : isTod
                          ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 font-black shadow-inner'
                          : 'bg-transparent text-slate-450 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      {day}
                    </motion.button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowCalendar(false)}
                className="w-full mt-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold rounded-2xl transition-all uppercase tracking-wider min-h-[44px] cursor-pointer shadow-sm"
              >
                DISMISS CALENDAR
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal (Daily Log Purge) */}
      <AnimatePresence>
        {logToDelete && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLogToDelete(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-2xl p-6 z-[90] max-w-xs w-full text-center shadow-2xl"
            >
              <span className="text-3xl block mb-2">⚠️</span>
              <h4 className="text-sm font-extrabold text-slate-900 tracking-widest uppercase mb-2">PURGE RECORD?</h4>
              <p className="text-[10px] text-slate-500 mb-5 uppercase leading-normal font-medium">
                This action will delete the chronicle for "{logToDelete.foodName}" permanently.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLogToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl text-[11px] text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors min-h-[40px] uppercase font-bold cursor-pointer"
                >
                  RETAIN
                </button>
                <button
                  onClick={async () => {
                    await handleDelete(logToDelete.id);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-[11px] text-white bg-red-600 hover:bg-red-500 transition-colors min-h-[40px] uppercase font-bold shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  {deleting === logToDelete.id ? 'WIPING...' : 'PURGE'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManifestLog;
