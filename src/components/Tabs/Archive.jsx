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
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, AreaChart, Area,
} from 'recharts';
import { subscribeWeightLogs, addWeightLog, deleteWeightLog, subscribeAllFoodLogs } from '../../firebase/firestoreService';



const WeightTooltip = ({ active, payload, label }) => {
  if (active && payload?.[0]) return (
    <div className="bg-slate-800 border border-slate-600/50 rounded-lg px-3 py-1.5 shadow-xl">
      <p className="text-[8px] font-mono text-slate-400">{label}</p>
      <p className="text-sm font-mono font-bold text-emerald-400">{payload[0].value} kg</p>
    </div>
  );
  return null;
};

const CalTooltip = ({ active, payload, label }) => {
  if (active && payload?.[0]) return (
    <div className="bg-slate-800 border border-slate-600/50 rounded-lg px-3 py-1.5 shadow-xl">
      <p className="text-[8px] font-mono text-slate-400">{label}</p>
      <p className="text-sm font-mono font-bold text-amber-400">{payload[0].value} kcal</p>
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
  const challengeEnd = profile?.deadline ? new Date(profile.deadline) : new Date('2026-10-28');

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
  const weightToGo = (weightGoal - latestWeight).toFixed(1);
  const weightPct = Math.max(0, Math.min(100, ((latestWeight - weightStart) / (weightGoal - weightStart)) * 100));

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
    <div className="px-4 pt-3 pb-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-base font-bold font-mono tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">PROGRESS</h2>
        <p className="text-[8px] font-mono text-slate-600 tracking-wider mt-0.5">CHALLENGE ANALYTICS & WEIGHT LOG</p>
      </div>

      {/* Challenge Timeline */}
      <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-2.5 mb-2.5">
        <div className="flex justify-between mb-1">
          <span className="text-[8px] font-mono text-slate-400">CHALLENGE</span>
          <span className="text-[8px] font-mono text-cyan-400">DAY {daysSince} / {totalDays}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-fuchsia-500" initial={{ width: 0 }} animate={{ width: `${challengePct}%` }} transition={{ duration: 1 }} />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[7px] font-mono text-slate-600">{challengeStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()}</span>
          <span className="text-[7px] font-mono text-slate-600">{daysLeft}d left</span>
          <span className="text-[7px] font-mono text-slate-600">{challengeEnd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()}</span>
        </div>
      </div>

      {/* Weight Progress */}
      <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-2.5 mb-2.5">
        <div className="flex items-end gap-2 mb-1.5">
          <IoScale className="text-emerald-400 shrink-0" size={14} />
          <span className="text-xl font-bold font-mono text-emerald-400">{latestWeight}</span>
          <span className="text-[10px] font-mono text-slate-500 mb-0.5">kg</span>
          <span className={`text-[10px] font-mono font-bold mb-0.5 ml-auto ${Number(totalGain) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {Number(totalGain) >= 0 ? '▲' : '▼'}{Math.abs(Number(totalGain))}kg
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-0.5">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" initial={{ width: 0 }} animate={{ width: `${weightPct}%` }} transition={{ duration: 1 }} />
        </div>
        <div className="flex justify-between">
          <span className="text-[7px] font-mono text-slate-600">{weightStart}kg</span>
          <span className="text-[7px] font-mono text-slate-600">{weightToGo}kg to go</span>
          <span className="text-[7px] font-mono text-slate-600">{weightGoal}kg</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-1.5 mb-2.5">
        <div className="bg-slate-900/60 border border-slate-800/40 rounded-xl p-2 text-center">
          <span className="text-[7px] font-mono text-slate-500 block">AVG/DAY</span>
          <span className="text-sm font-bold font-mono text-amber-400">{avgDaily}</span>
          <span className="text-[7px] font-mono text-slate-600 block">kcal</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/40 rounded-xl p-2 text-center">
          <span className="text-[7px] font-mono text-slate-500 block">TARGET HIT</span>
          <span className="text-sm font-bold font-mono text-emerald-400">{daysHit}</span>
          <span className="text-[7px] font-mono text-slate-600 block">days</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/40 rounded-xl p-2 text-center">
          <span className="text-[7px] font-mono text-slate-500 block">TOTAL</span>
          <span className="text-sm font-bold font-mono text-cyan-400">{totalCalEver >= 1000 ? `${(totalCalEver/1000).toFixed(0)}k` : totalCalEver}</span>
          <span className="text-[7px] font-mono text-slate-600 block">kcal</span>
        </div>
      </div>

      {/* Weight Chart */}
      {weightChartData.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-2.5 mb-2.5">
          <span className="text-[8px] font-mono text-slate-400 tracking-wider block mb-1">WEIGHT GRAPH</span>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={weightChartData} margin={{ top: 5, right: 5, bottom: 5, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fontSize: 8, fontFamily: 'monospace', fill: '#64748b' }} axisLine={{ stroke: '#334155' }} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fontFamily: 'monospace', fill: '#64748b' }} axisLine={{ stroke: '#334155' }} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip content={<WeightTooltip />} />
              <ReferenceLine y={weightGoal} stroke="#06b6d4" strokeDasharray="6 4" strokeWidth={1} />
              <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
                style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.5))' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Calorie Chart */}
      {calChartData.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-2.5 mb-2.5">
          <span className="text-[8px] font-mono text-slate-400 tracking-wider block mb-1">DAILY CALORIES</span>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={calChartData} margin={{ top: 5, right: 5, bottom: 5, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fontSize: 8, fontFamily: 'monospace', fill: '#64748b' }} axisLine={{ stroke: '#334155' }} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fontFamily: 'monospace', fill: '#64748b' }} axisLine={{ stroke: '#334155' }} tickLine={false} />
              <Tooltip content={<CalTooltip />} />
              <ReferenceLine y={calorieTarget} stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={1} />
              <defs><linearGradient id="calG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} /></linearGradient></defs>
              <Area type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={1.5} fill="url(#calG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weight Log Input */}
      <form onSubmit={handleLogWeight} className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-2.5 mb-2.5">
        <span className="text-[8px] font-mono text-slate-400 tracking-wider block mb-1.5">LOG WEIGHT</span>
        <div className="flex gap-2">
          <input type="number" step="0.1" min="0" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="kg..." required
            className="flex-1 min-w-0 bg-slate-800/60 border border-slate-600/30 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 box-border" />
          <motion.button type="submit" disabled={logging} whileTap={{ scale: 0.95 }}
            className={`px-4 rounded-lg font-mono font-bold text-sm min-h-[44px] min-w-[44px] transition-all ${logSuccess ? 'bg-emerald-500 text-white' : 'bg-cyan-600/80 hover:bg-cyan-600 text-white'} disabled:opacity-50`}>
            {logSuccess ? '✓' : 'LOG'}
          </motion.button>
        </div>
      </form>

      {/* Weight Log History (with DELETE) */}
      {weightLogs.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-2.5">
          <span className="text-[8px] font-mono text-slate-400 tracking-wider block mb-1.5">WEIGHT HISTORY — TAP 🗑 TO DELETE</span>
          <div className="space-y-1 max-h-[25vh] overflow-y-auto scrollbar-thin">
            {[...weightLogs].reverse().map((log) => {
              const d = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
              return (
                <div key={log.id} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-2.5 py-2 min-h-[40px]">
                  <span className="text-[10px] font-mono text-slate-500">
                    {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-slate-300">{log.weight} kg</span>

                    {/* Delete confirm */}
                    {confirmDelete === log.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDeleteWeight(log.id)} disabled={deleting === log.id}
                          className="text-[8px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded hover:bg-red-500/30 transition-colors min-w-[40px]">
                          {deleting === log.id ? '...' : 'YES'}
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="text-[8px] font-mono text-slate-500 px-1.5 py-1 rounded hover:text-slate-300">NO</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(log.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" aria-label="Delete">
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
