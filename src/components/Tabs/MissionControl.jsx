// ============================================
// PROJECT PHOENIX — TAB 1: MISSION CONTROL
// ============================================
// Overall challenge dashboard with lifetime
// stats, today's snapshot, and visual progress.
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { IoTrophy, IoFlame, IoFitness, IoStatsChart } from 'react-icons/io5';
import { subscribeDateFoodLogs, subscribeAllFoodLogs, subscribeWeightLogs } from '../../firebase/firestoreService';

const CALORIE_TARGET = 2436;
const PROTEIN_TARGET = 100;
const WEIGHT_START = 41.0;
const WEIGHT_GOAL = 49.0;
const DEADLINE = new Date('2026-10-28T00:00:00');
const CHALLENGE_START = new Date('2026-05-28');

const MissionControl = ({ uid, selectedDate, profile }) => {
  const [todayLogs, setTodayLogs] = useState([]);
  const [allFoodLogs, setAllFoodLogs] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });

  const isToday = !selectedDate || selectedDate.toDateString() === new Date().toDateString();

  // Dynamic Targets from User Profile with safe fallbacks
  const calorieTarget = profile?.calorieTarget || 2436;
  const proteinTarget = profile?.proteinTarget || 100;
  const weightStart = profile?.currentWeight || 41.0;
  const weightGoal = profile?.targetWeight || 49.0;

  // Memoize date parsing to prevent infinite render loops!
  const deadlineStr = profile?.deadline || '2026-10-28T00:00:00';
  const deadlineDate = useMemo(() => new Date(deadlineStr), [deadlineStr]);

  const challengeStartStr = profile?.updatedAt?.toDate 
    ? profile.updatedAt.toDate().toISOString() 
    : (profile?.updatedAt ? new Date(profile.updatedAt).toISOString() : '2026-05-28T00:00:00');
  const challengeStart = useMemo(() => new Date(challengeStartStr), [challengeStartStr]);

  useEffect(() => { const u = subscribeDateFoodLogs(uid, selectedDate || new Date(), setTodayLogs); return () => u(); }, [uid, selectedDate]);
  useEffect(() => { const u = subscribeAllFoodLogs(uid, setAllFoodLogs); return () => u(); }, [uid]);
  useEffect(() => { const u = subscribeWeightLogs(uid, setWeightLogs); return () => u(); }, [uid]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = Math.max(0, deadlineDate - now);
      setCountdown({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [deadlineDate]);

  // Stats
  const todayCal = todayLogs.reduce((s, l) => s + (l.calories || 0), 0);
  const todayPro = todayLogs.reduce((s, l) => s + (l.protein || 0), 0);
  const isOverdrive = todayCal > calorieTarget;
  const caloriePercent = Math.min((todayCal / calorieTarget) * 100, 100);
  const proteinPercent = Math.min((todayPro / proteinTarget) * 100, 100);

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : weightStart;
  const weightProgress = Math.max(0, Math.min(100, ((latestWeight - weightStart) / (weightGoal - weightStart)) * 100));
  const weightToGo = (weightGoal - latestWeight).toFixed(1);

  const totalCalEver = allFoodLogs.reduce((s, l) => s + (l.calories || 0), 0);
  const totalMeals = allFoodLogs.length;
  const now = new Date();
  const daysSinceStart = Math.max(1, Math.floor((now - challengeStart) / 86400000));
  const totalDays = Math.max(1, Math.floor((deadlineDate - challengeStart) / 86400000));
  const avgDaily = totalMeals > 0 ? Math.round(totalCalEver / daysSinceStart) : 0;

  const dailyCals = {};
  allFoodLogs.forEach((l) => {
    const d = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    dailyCals[k] = (dailyCals[k] || 0) + (l.calories || 0);
  });
  const daysHit = Object.values(dailyCals).filter((c) => c >= calorieTarget).length;
  const daysLogged = Object.keys(dailyCals).length;

  // SVG ring
  const radius = 85;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (caloriePercent / 100) * circ;
  const ringColor = isOverdrive ? '#d946ef' : '#10b981';
  const ringGlow = isOverdrive ? '0 0 25px rgba(217,70,239,0.5)' : '0 0 16px rgba(16,185,129,0.4)';

  return (
    <div className="px-6 pt-5 pb-8 max-w-lg mx-auto relative">
      {/* Header + Countdown */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-extrabold font-mono tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
          PROJECT PHOENIX
        </h1>
        <div className="mt-3 flex justify-center gap-2">
          {[{ v: countdown.d, l: 'DAYS' }, { v: countdown.h, l: 'HOURS' }, { v: countdown.m, l: 'MINS' }, { v: countdown.s, l: 'SECS' }].map((i) => (
            <div key={i.l} className="bg-slate-900/90 border border-slate-800/60 rounded-xl px-3 py-1.5 min-w-[52px] shadow-lg shadow-black/40">
              <div className="text-base font-extrabold font-mono text-cyan-400 leading-none">{String(i.v).padStart(2, '0')}</div>
              <div className="text-[7px] font-mono text-slate-500 uppercase tracking-widest mt-1">{i.l}</div>
            </div>
          ))}
        </div>
        <div className="text-[9px] font-mono text-slate-500 tracking-wider mt-3 bg-slate-900/40 border border-slate-800/30 rounded-full px-3.5 py-1 inline-block">
          DAY <span className="text-cyan-400 font-bold">{daysSinceStart}</span> OF <span className="text-slate-400">{totalDays}</span> • <span className="text-emerald-400 font-bold">{Math.max(0, Math.floor((deadlineDate - now) / 86400000))} DAYS</span> REMAINING
        </div>
      </div>

      {!isToday && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-2.5 text-center text-[10px] font-mono text-amber-400 uppercase tracking-widest mb-6 shadow-inner shadow-black/20 animate-pulse">
          ⚠️ TIME TRAVEL SENSOR ACTIVE • SPECTATING {selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
        </div>
      )}

      {/* Central Ring Centerpiece */}
      <div className="flex flex-col items-center justify-center mb-6 relative">
        <div className="relative shrink-0">
          {/* Futuristic backglow */}
          <div className="absolute inset-0 rounded-full bg-slate-950 blur-xl opacity-60 -z-10" />
          <svg width="220" height="220" viewBox="0 0 220 220" className="transform -rotate-90">
            <circle cx="110" cy="110" r={radius} stroke="#0f172a" strokeWidth="12" fill="none" />
            <motion.circle cx="110" cy="110" r={radius} stroke={ringColor} strokeWidth="12" fill="none" strokeLinecap="round"
              strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: 'easeOut' }} style={{ filter: `drop-shadow(${ringGlow})` }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isToday ? (
              isOverdrive ? (
                <span className="text-[9px] font-mono font-bold text-fuchsia-400 tracking-widest overdrive-pulse mb-1">⚡ OVERDRIVE</span>
              ) : (
                <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-widest mb-1">STATUS: ACTIVE</span>
              )
            ) : (
              <span className="text-[9px] font-mono font-bold text-amber-400 tracking-widest mb-1">HISTORICAL RECORD</span>
            )}
            <span className="text-4xl font-extrabold font-mono text-white tracking-tighter leading-none">{todayCal}</span>
            <span className="text-[11px] font-mono text-slate-500 mt-1">/ {calorieTarget} kcal</span>
            {isOverdrive && (
              <span className="text-[9px] font-mono text-fuchsia-400 mt-1 bg-fuchsia-500/10 px-2.5 py-0.5 rounded-full border border-fuchsia-500/20">
                +{todayCal - calorieTarget} surplus
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RPG Secondary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Protein gauge */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">PROTEIN</span>
              <span className="text-xs font-bold font-mono text-emerald-400">{todayPro.toFixed(0)}g</span>
            </div>
            <div className="text-[9px] font-mono text-slate-600">Goal: {proteinTarget}g</div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/40">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" initial={{ width: 0 }} animate={{ width: `${proteinPercent}%` }} transition={{ duration: 0.8 }} />
            </div>
            <span className="text-[8px] font-mono text-slate-500 block mt-1.5 text-right">{proteinPercent.toFixed(0)}% HIT</span>
          </div>
        </div>

        {/* Level / Weight badge */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/30 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">AVATAR LEVEL</span>
              <span className="text-lg font-extrabold font-mono text-cyan-400 tracking-tight leading-none mt-1 block">LVL {latestWeight}</span>
            </div>
            <div className="text-[8px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded uppercase font-semibold">KG</div>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/40">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400" initial={{ width: 0 }} animate={{ width: `${weightProgress}%` }} transition={{ duration: 0.8 }} />
            </div>
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-[8px] font-mono text-slate-600">{weightStart}kg</span>
              <span className="text-[8px] font-mono text-slate-500">{weightToGo}kg left</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Challenge Stats */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { icon: IoFlame, color: 'text-amber-400', label: 'AVG/DAY', value: avgDaily, unit: 'kcal' },
          { icon: IoTrophy, color: 'text-emerald-400', label: 'DAYS HIT', value: daysHit, unit: `/${daysLogged}d` },
          { icon: IoStatsChart, color: 'text-cyan-400', label: 'TOTAL', value: totalCalEver >= 1000 ? `${(totalCalEver/1000).toFixed(0)}k` : totalCalEver, unit: 'kcal' },
          { icon: IoFitness, color: 'text-fuchsia-400', label: 'MEALS', value: totalMeals, unit: 'logged' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900/40 border border-slate-900/60 rounded-xl p-2.5 text-center shadow-md">
            <s.icon className={`${s.color} mx-auto mb-1`} size={15} />
            <span className="text-[8px] font-mono text-slate-500 block uppercase tracking-wider">{s.label}</span>
            <span className={`text-sm font-bold font-mono ${s.color} block mt-0.5`}>{s.value}</span>
            <span className="text-[8px] font-mono text-slate-600 block mt-0.5">{s.unit}</span>
          </div>
        ))}
      </div>

      {/* Today's Log Chronicles */}
      <div className="bg-slate-900/40 border border-slate-900/60 rounded-2xl p-4 mb-6 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/40 pb-2">
          <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">
            {isToday ? "TODAY'S CHRONICLES" : `${selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()}'S CHRONICLES`}
          </span>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">{todayLogs.length} LOGS</span>
        </div>
        {todayLogs.length > 0 ? (
          <div className="space-y-1.5">
            {todayLogs.slice(-6).map((l) => (
              <div key={l.id} className="flex items-center justify-between bg-slate-950/40 border border-slate-800/20 hover:border-slate-800/40 rounded-xl px-3 py-2 transition-all">
                <span className="text-xs font-mono text-slate-300 truncate flex-1 mr-2">{l.foodName}</span>
                <span className="text-xs font-mono text-emerald-400 shrink-0 font-bold">{l.calories} kcal</span>
              </div>
            ))}
            {todayLogs.length > 6 && (
              <span className="text-[9px] font-mono text-slate-500 block text-center mt-2 uppercase tracking-widest">
                + {todayLogs.length - 6} MORE CHRONICLES
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs font-mono text-slate-600 text-center py-6">
            {isToday ? 'NO CHRONICLES RECORDED TODAY — TAP "+" TO LOG' : 'NO CHRONICLES RECORDED FOR THIS DAY'}
          </p>
        )}
      </div>
    </div>
  );
};

export default MissionControl;
