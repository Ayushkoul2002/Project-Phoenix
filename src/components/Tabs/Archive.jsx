// ============================================
// PROJECT PHOENIX — TAB 4: OVERALL PROGRESS
// ============================================
// Weight tracking with DELETE support, charts,
// and overall challenge analytics.
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoScale, IoTrendingUp, IoFlame, IoCalendar, IoTrophy, IoTrash, IoClose } from 'react-icons/io5';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, AreaChart, Area, LabelList,
} from 'recharts';
import { subscribeWeightLogs, addWeightLog, deleteWeightLog, subscribeAllFoodLogs } from '../../firebase/firestoreService';

const WeightTooltip = ({ active, payload, label }) => {
  if (active && payload?.[0]) return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-md">
      <p className="text-[8px] font-bold text-slate-400">{label}</p>
      <p className="text-sm font-black text-emerald-600">{payload[0].value} kg</p>
    </div>
  );
  return null;
};

const CalTooltip = ({ active, payload, label }) => {
  if (active && payload?.[0]) return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-md">
      <p className="text-[8px] font-bold text-slate-400">{label}</p>
      <p className="text-sm font-black text-amber-600">{payload[0].value} kcal</p>
    </div>
  );
  return null;
};

const Archive = ({ uid, profile }) => {
  const [weightLogs, setWeightLogs] = useState([]);
  const [allFoodLogs, setAllFoodLogs] = useState([]);
  const [weightInput, setWeightInput] = useState('');
  const [logging, setLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { const u = subscribeWeightLogs(uid, setWeightLogs); return () => u(); }, [uid]);
  useEffect(() => { const u = subscribeAllFoodLogs(uid, setAllFoodLogs); return () => u(); }, [uid]);

  const weightStart = profile?.currentWeight || 41.0;
  const weightGoal = profile?.targetWeight || 49.0;
  const calorieTarget = profile?.calorieTarget || 2436;
  const challengeStart = profile?.updatedAt?.toDate ? profile.updatedAt.toDate() : (profile?.updatedAt ? new Date(profile.updatedAt) : new Date('2026-05-28'));
  const challengeEnd = (() => {
    const deadlineStr = profile?.deadline || '2026-10-28';
    if (deadlineStr.length === 10 && deadlineStr.includes('-')) {
      const [year, month, day] = deadlineStr.split('-').map(Number);
      return new Date(year, month - 1, day, 23, 59, 59);
    }
    return new Date(deadlineStr);
  })();

  const handleLogWeight = async (e) => {
    e.preventDefault();
    const w = parseFloat(weightInput);
    if (!w || w <= 0 || logging) return;
    setLogging(true);
    try {
      await addWeightLog(uid, w);
      setLogSuccess(true);
      setWeightInput('');
      setTimeout(() => setLogSuccess(false), 1000);
    } catch (e) { console.error(e); }
    finally { setLogging(false); }
  };

  const handleDeleteWeight = async (docId) => {
    setDeleting(docId);
    try {
      await deleteWeightLog(uid, docId);
    } catch (e) { console.error(e); }
    finally { setDeleting(null); setConfirmDelete(null); }
  };

  // Chart data
  const weightChartData = weightLogs.map((log) => {
    const d = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
    return { date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), weight: log.weight };
  });

  const dailyCals = {};
  allFoodLogs.forEach((l) => {
    const d = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
    const k = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    dailyCals[k] = (dailyCals[k] || 0) + (l.calories || 0);
  });
  const calChartData = Object.entries(dailyCals).map(([date, calories]) => ({ date, calories }));

  // Stats
  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : weightStart;
  const firstWeight = weightLogs.length > 0 ? weightLogs[0].weight : weightStart;
  const totalGain = (latestWeight - firstWeight).toFixed(1);

  const isBulk = weightGoal >= weightStart;
  const isGoalCrushed = isBulk ? (latestWeight >= weightGoal) : (latestWeight <= weightGoal);
  
  let weightPct = 0;
  if (isGoalCrushed) {
    weightPct = 100;
  } else {
    const totalDelta = weightGoal - weightStart;
    const currentDelta = latestWeight - weightStart;
    weightPct = totalDelta === 0 ? 100 : Math.max(0, Math.min(100, (currentDelta / totalDelta) * 100));
  }

  const weightToGoValue = Math.abs(weightGoal - latestWeight).toFixed(1);

  const now = new Date();
  const daysSince = Math.max(1, Math.floor((now - challengeStart) / 86400000));
  const daysLeft = Math.max(0, Math.floor((challengeEnd - now) / 86400000));
  const totalDays = Math.max(1, Math.floor((challengeEnd - challengeStart) / 86400000));
  const challengePct = Math.min(100, (daysSince / totalDays) * 100);

  const totalCalEver = allFoodLogs.reduce((s, l) => s + (l.calories || 0), 0);
  const uniqueDays = new Set(allFoodLogs.map((l) => { const d = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; })).size;
  const avgDaily = uniqueDays > 0 ? Math.round(totalCalEver / uniqueDays) : 0;
  const daysHit = Object.values(dailyCals).filter((c) => c >= calorieTarget).length;

  return (
    <div className="px-6 pt-5 pb-8 max-w-lg mx-auto font-sans">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-600 to-cyan-600 uppercase">PROGRESS</h2>
        <p className="text-[9px] font-bold text-slate-450 tracking-wider mt-2 uppercase">CHALLENGE ANALYTICS & WEIGHT LOG</p>
      </div>

      {/* Challenge Timeline */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-5 shadow-sm">
        <div className="flex justify-between mb-1.5 items-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">CHALLENGE TIMELINE</span>
          <span className="text-[10px] font-bold text-cyan-600">DAY {daysSince} / {totalDays}</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-fuchsia-500" initial={{ width: 0 }} animate={{ width: `${challengePct}%` }} transition={{ duration: 1 }} />
        </div>
        <div className="flex justify-between mt-2.5">
          <span className="text-[8px] font-bold text-slate-450">{challengeStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()}</span>
          <span className="text-[8px] font-extrabold text-cyan-600">{daysLeft} DAYS LEFT</span>
          <span className="text-[8px] font-bold text-slate-455">{challengeEnd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()}</span>
        </div>
      </div>

      {/* Weight Progress */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">WEIGHT MASS TRACKER</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${Number(totalGain) >= 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-250' : 'text-red-700 bg-red-50 border border-red-250'}`}>
            {Number(totalGain) >= 0 ? '▲' : '▼'} {Math.abs(Number(totalGain))} KG DELTA
          </span>
        </div>
        <div className="flex items-end gap-1.5 mb-3">
          <IoScale className="text-emerald-600 shrink-0" size={18} />
          <span className="text-2xl font-black text-slate-900 leading-none">{latestWeight}</span>
          <span className="text-xs font-bold text-slate-400 mb-0.5">kg current</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 mb-2.5">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" initial={{ width: 0 }} animate={{ width: `${weightPct}%` }} transition={{ duration: 1 }} />
        </div>
        <div className="flex justify-between">
          <span className="text-[8px] font-bold text-slate-450">{weightStart}kg start</span>
          {isGoalCrushed ? (
            <span className="text-[8px] font-black text-emerald-600 animate-pulse">✓ GOAL CRUSHED! 🎉</span>
          ) : (
            <span className="text-[8px] font-extrabold text-emerald-600">{weightToGoValue}kg to reach goal</span>
          )}
          <span className="text-[8px] font-bold text-slate-455">{weightGoal}kg goal</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-sm">
          <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">AVG DAILY</span>
          <span className="text-base font-black text-amber-600 block mt-1 leading-none">{avgDaily}</span>
          <span className="text-[8px] font-bold text-slate-450 block mt-1">kcal</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-sm">
          <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">TARGET HIT</span>
          <span className="text-base font-black text-emerald-600 block mt-1 leading-none">{daysHit}</span>
          <span className="text-[8px] font-bold text-slate-450 block mt-1">days</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-sm">
          <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">TOTAL FUEL</span>
          <span className="text-base font-black text-cyan-600 block mt-1 leading-none">{totalCalEver >= 1000 ? `${(totalCalEver/1000).toFixed(0)}k` : totalCalEver}</span>
          <span className="text-[8px] font-bold text-slate-450 block mt-1">kcal</span>
        </div>
      </div>

      {/* Weight Chart */}
      {weightChartData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-5 shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 tracking-wider block uppercase mb-4">Weight History Graph</span>
          <ResponsiveContainer width="100%" height={140} className="outline-none focus:outline-none" style={{ outline: 'none' }}>
            <LineChart data={weightChartData} onClick={() => {}} margin={{ top: 5, right: 5, bottom: 5, left: -22 }} className="outline-none focus:outline-none" style={{ outline: 'none' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 8, fontFamily: 'sans-serif', fontWeight: '600', fill: '#94a3b8' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fontFamily: 'sans-serif', fontWeight: '600', fill: '#94a3b8' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} domain={['dataMin - 3', 'dataMax + 3']} />
              <ReferenceLine y={weightGoal} stroke="#06b6d4" strokeDasharray="6 4" strokeWidth={1} />
              <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ r: 3.5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                style={{ filter: 'drop-shadow(0 2px 6px rgba(16,185,129,0.2))' }}>
                <LabelList dataKey="weight" position="top" offset={8} 
                  formatter={(v, entry, index) => {
                    // Always show on first and last point
                    if (index === 0 || index === weightChartData.length - 1) return `${v}kg`;
                    // Show other intermediate points only if total points <= 6 to prevent overlapping
                    if (weightChartData.length <= 6) return `${v}kg`;
                    return '';
                  }}
                  style={{ fontSize: 8, fontFamily: 'sans-serif', fontWeight: '800', fill: '#047857' }} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Calorie Chart */}
      {calChartData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-5 shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 tracking-wider block uppercase mb-4">Daily Caloric Chronology</span>
          <ResponsiveContainer width="100%" height={130} className="outline-none focus:outline-none" style={{ outline: 'none' }}>
            <AreaChart data={calChartData} onClick={() => {}} margin={{ top: 5, right: 5, bottom: 5, left: -22 }} className="outline-none focus:outline-none" style={{ outline: 'none' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 8, fontFamily: 'sans-serif', fontWeight: '600', fill: '#94a3b8' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fontFamily: 'sans-serif', fontWeight: '600', fill: '#94a3b8' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <ReferenceLine y={calorieTarget} stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={1} />
              <defs><linearGradient id="calG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01} /></linearGradient></defs>
              <Area type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={1.5} fill="url(#calG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weight Log Input */}
      <form onSubmit={handleLogWeight} className="bg-white border border-slate-200 rounded-3xl p-5 mb-5 shadow-sm">
        <span className="text-[9px] font-bold text-slate-450 tracking-wider block uppercase mb-2">LOG DAILY WEIGHT</span>
        <div className="flex gap-2">
          <input type="number" step="0.1" min="0" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="Enter kg (e.g. 62.5)..." required
            className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white box-border transition-all" />
          <motion.button type="submit" disabled={logging} whileTap={{ scale: 0.95 }}
            className={`px-5 rounded-xl font-bold text-sm min-h-[44px] min-w-[56px] transition-all cursor-pointer shadow-sm ${logSuccess ? 'bg-emerald-600 text-white shadow-emerald-500/10' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/10'} disabled:opacity-50`}>
            {logSuccess ? '✓' : 'LOG'}
          </motion.button>
        </div>
      </form>

      {/* Weight Log History (with DELETE) */}
      {weightLogs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 tracking-wider block uppercase mb-3">Weight History Log</span>
          <div className="space-y-2 max-h-[25vh] overflow-y-auto scrollbar-thin pr-1">
            {[...weightLogs].reverse().map((log) => {
              const d = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
              return (
                <div key={log.id} className="flex items-center justify-between bg-slate-50 border border-slate-200/50 hover:border-slate-200 rounded-xl px-3.5 py-3 min-h-[44px] shadow-sm transition-all">
                  <span className="text-[11px] font-bold text-slate-500 font-sans">
                    {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-800 font-sans">{log.weight} kg</span>

                    {/* Delete confirm */}
                    {confirmDelete === log.id ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleDeleteWeight(log.id)} disabled={deleting === log.id}
                          className="text-[9px] font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors min-w-[40px] cursor-pointer">
                          {deleting === log.id ? '...' : 'YES'}
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="text-[9px] font-bold text-slate-400 hover:text-slate-700 px-1.5 py-1 rounded cursor-pointer">NO</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(log.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer" aria-label="Delete">
                        <IoTrash size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Archive;
