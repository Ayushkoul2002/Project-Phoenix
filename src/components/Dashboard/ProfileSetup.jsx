// ============================================
// PROJECT PHOENIX — ProfileSetup Wizard
// ============================================
// Multi-step metabolic wizard designed to calculate
// highly personalized daily caloric and protein targets,
// syncing immediately to Firebase Firestore or Mock databases.
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronForward, IoChevronBack, IoFlame, IoNutrition, IoSpeedometer, IoCalendar } from 'react-icons/io5';
import { updateUserProfile, addWeightLog } from '../../firebase/firestoreService';

const ACTIVITY_MULTIPLIERS = [
  { id: 'sedentary', label: 'SEDENTARY', desc: 'LITTLE OR NO EXERCISE', factor: 1.2 },
  { id: 'lightly_active', label: 'LIGHTLY ACTIVE', desc: 'LIGHT WORKOUTS 1-3 DAYS/WK', factor: 1.375 },
  { id: 'moderately_active', label: 'MODERATELY ACTIVE', desc: 'MODERATE WORKOUTS 3-5 DAYS/WK', factor: 1.55 },
  { id: 'very_active', label: 'VERY ACTIVE', desc: 'INTENSE TRAINING 6-7 DAYS/WK', factor: 1.725 },
];

const GENDERS = [
  { id: 'male', label: 'MALE' },
  { id: 'female', label: 'FEMALE' },
];

const ProfileSetup = ({ uid, onComplete }) => {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState(24);
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(60.0);
  const [targetWeight, setTargetWeight] = useState(65.0);
  const [activity, setActivity] = useState('moderately_active');

  // Initialize deadline to exactly 3 months from today
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });

  const [saving, setSaving] = useState(false);

  // Live Calculations based on current inputs
  const currentMultiplier = ACTIVITY_MULTIPLIERS.find((a) => a.id === activity)?.factor || 1.55;
  
  // 1. Mifflin-St Jeor BMR
  const bmr = Math.round(
    10 * weight +
    6.25 * height -
    5 * age +
    (gender === 'male' ? 5 : -161)
  );

  // 2. TDEE (Total Daily Energy Expenditure)
  const tdee = Math.round(bmr * currentMultiplier);

  // 3. Rate-based Calorie Deficit/Surplus Calculation to hit target by deadline
  const calculateTargets = () => {
    const wDelta = targetWeight - weight;
    
    // If weight target is identical, return TDEE (maintenance)
    if (Math.abs(wDelta) < 0.1) {
      return { calories: tdee, surplus: 0, bmr, tdee };
    }

    const tToday = new Date();
    const tDeadline = new Date(deadline);
    const diffTime = Math.max(86400000 * 7, tDeadline - tToday); // minimum 1 week
    const diffWeeks = diffTime / (86400000 * 7);
    
    // Weight rate change (kg/week)
    const rate = wDelta / diffWeeks;
    
    // 1 kg body weight delta = ~7700 kcal, so 1 kg/week = ~1100 kcal surplus/deficit per day
    let caloricDelta = Math.round(rate * 1100);

    // Apply strict deficit/surplus limits to guarantee health
    const maxDelta = 1000; // Cap deficit/surplus at 1000 kcal per day
    if (caloricDelta > maxDelta) caloricDelta = maxDelta;
    if (caloricDelta < -maxDelta) caloricDelta = -maxDelta;

    let calGoal = tdee + caloricDelta;

    // Apply absolute safe minimum thresholds
    const minSafe = gender === 'male' ? 1500 : 1200;
    const bmrMin = Math.round(bmr * 0.85);
    const absoluteMin = Math.max(minSafe, bmrMin);

    if (calGoal < absoluteMin) {
      calGoal = absoluteMin;
    }

    // Apply absolute maximum threshold
    if (calGoal > 4500) {
      calGoal = 4500;
    }

    // Protein goal based on current weight (2.0g per kg of current body weight)
    const proGoal = Math.max(60, Math.round(weight * 2.0));

    return {
      calories: Math.round(calGoal),
      protein: proGoal,
      bmr,
      tdee,
      surplus: calGoal - tdee,
      rate: rate,
    };
  };

  const targets = calculateTargets();

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const profileData = {
        age: Number(age),
        gender,
        height: Number(height),
        currentWeight: Number(weight),
        targetWeight: Number(targetWeight),
        activity,
        deadline,
        bmr: targets.bmr,
        tdee: targets.tdee,
        calorieTarget: targets.calories,
        proteinTarget: targets.protein,
      };

      // Save user profile settings
      await updateUserProfile(uid, profileData);

      // Automatically add initial weight entry to kick off graph if needed
      await addWeightLog(uid, weight);

      if (onComplete) onComplete(profileData);
    } catch (e) {
      console.error('Error saving agent profile:', e);
    } finally {
      setSaving(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.15 } },
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-300 z-[100] flex flex-col font-mono overflow-y-auto safe-area-bottom">
      {/* Background Cyberpunk Styling Grid & Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.1)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/10 via-slate-950 to-slate-950 pointer-events-none -z-10" />

      {/* Terminal Title Bar */}
      <header className="border-b border-cyan-500/20 bg-slate-900/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
          <h2 className="text-xs font-bold tracking-[0.25em] text-cyan-400">AGENT SETUP PROTOCOL</h2>
        </div>
        <span className="text-[10px] text-slate-500">STAGE {step}/5</span>
      </header>

      {/* Wizard Main Content Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-6 py-8 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step-1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div>
                <span className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold block mb-1">METRIC SET 01</span>
                <h3 className="text-lg font-bold text-white tracking-wider uppercase">Biological Classification</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide leading-relaxed mt-1">Specify your current biological age and sex classifications for metabolic baselines.</p>
              </div>

              {/* Age Input */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 tracking-wider">AGE (YEARS)</label>
                <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-xl p-2.5">
                  <input
                    type="range" min="12" max="90" value={age} onChange={(e) => setAge(Number(e.target.value))}
                    className="flex-1 accent-cyan-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xl font-extrabold text-cyan-400 font-mono w-12 text-right">{age}</span>
                </div>
              </div>

              {/* Gender Grid Selector */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 tracking-wider">SEX CLASSIFICATION</label>
                <div className="grid grid-cols-2 gap-3">
                  {GENDERS.map((g) => (
                    <button
                      key={g.id} type="button" onClick={() => setGender(g.id)}
                      className={`py-3.5 border rounded-xl font-bold tracking-widest text-xs transition-all flex flex-col items-center gap-1.5 ${
                        gender === g.id
                          ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5'
                          : 'border-slate-800 bg-slate-900/30 text-slate-500 hover:text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step-2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div>
                <span className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold block mb-1">METRIC SET 02</span>
                <h3 className="text-lg font-bold text-white tracking-wider uppercase">BIOMETRIC SPECIFICATIONS</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide leading-relaxed mt-1">Provide your precise stature measurements. Height and current mass coefficients determine energy consumption thresholds.</p>
              </div>

              {/* Height Selector */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 tracking-wider">STATURE HEIGHT (CM)</label>
                <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-xl p-2.5">
                  <input
                    type="range" min="100" max="230" value={height} onChange={(e) => setHeight(Number(e.target.value))}
                    className="flex-1 accent-cyan-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xl font-extrabold text-cyan-400 font-mono w-14 text-right">{height} <span className="text-[9px] text-slate-500 font-normal">cm</span></span>
                </div>
              </div>

              {/* Current Weight Input */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 tracking-wider">CURRENT BODY MASS (KG)</label>
                <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                  <button type="button" onClick={() => setWeight(Math.max(30, weight - 0.5))} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono rounded-lg text-lg flex items-center justify-center">−</button>
                  <span className="text-2xl font-extrabold font-mono text-cyan-400">{weight.toFixed(1)} <span className="text-xs text-slate-500 font-normal">kg</span></span>
                  <button type="button" onClick={() => setWeight(weight + 0.5)} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono rounded-lg text-lg flex items-center justify-center">+</button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step-3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div>
                <span className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold block mb-1">METRIC SET 03</span>
                <h3 className="text-lg font-bold text-white tracking-wider uppercase">MISSION OBJECTIVES</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide leading-relaxed mt-1">Configure your ultimate body mass target and target temporal deadline to initialize energy deficit calculations.</p>
              </div>

              {/* Target Weight Input */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 tracking-wider">TARGET BODY MASS (KG)</label>
                <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                  <button type="button" onClick={() => setTargetWeight(Math.max(30, targetWeight - 0.5))} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono rounded-lg text-lg flex items-center justify-center">−</button>
                  <span className="text-2xl font-extrabold font-mono text-cyan-400">{targetWeight.toFixed(1)} <span className="text-xs text-slate-500 font-normal">kg</span></span>
                  <button type="button" onClick={() => setTargetWeight(targetWeight + 0.5)} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono rounded-lg text-lg flex items-center justify-center">+</button>
                </div>
                <div className="flex justify-between items-center px-1 text-[8px] font-bold tracking-wider">
                  <span className="text-slate-500">DELTA DIRECTION</span>
                  {targetWeight > weight ? (
                    <span className="text-pink-400">⚡ BULK (+{(targetWeight - weight).toFixed(1)} KG)</span>
                  ) : targetWeight < weight ? (
                    <span className="text-emerald-400">⚡ CUT (-{(weight - targetWeight).toFixed(1)} KG)</span>
                  ) : (
                    <span className="text-cyan-400">⚡ RECOMP / MAINTENANCE</span>
                  )}
                </div>
              </div>

              {/* Target Deadline Input */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 tracking-wider">TARGET DEADLINE TEMPORAL DATE</label>
                <div className="relative flex items-center bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-3.5">
                  <IoCalendar className="text-cyan-400 mr-2.5 shrink-0" size={16} />
                  <input
                    type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} required
                    className="flex-1 bg-transparent text-slate-200 focus:outline-none font-mono text-sm tracking-wider w-full select-none"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step-4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
              <div>
                <span className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold block mb-1">METRIC SET 04</span>
                <h3 className="text-lg font-bold text-white tracking-wider uppercase">EXERTION COEFFICIENT</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide leading-relaxed mt-1">Assess your typical active daily energy dissipation factor to establish an accurate Total Daily Energy Expenditure (TDEE).</p>
              </div>

              {/* Activity Selector */}
              <div className="space-y-2 max-h-[48vh] overflow-y-auto scrollbar-thin space-y-2 pr-1">
                {ACTIVITY_MULTIPLIERS.map((a) => (
                  <button
                    key={a.id} type="button" onClick={() => setActivity(a.id)}
                    className={`w-full text-left p-3.5 border rounded-xl flex flex-col gap-1 transition-all ${
                      activity === a.id
                        ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-md shadow-cyan-500/5'
                        : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold tracking-widest">{a.label}</span>
                    <span className="text-[8px] text-slate-500 tracking-wider">{a.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step-5" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
              <div>
                <span className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold block mb-1">METRIC RESULTS</span>
                <h3 className="text-lg font-bold text-white tracking-wider uppercase">BIOLOGICAL ASSESSMENT</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide leading-relaxed mt-1">Review the generated metabolic calculations. The Phoenix algorithm has optimized your targets.</p>
              </div>

              {/* Assessment Report Terminal */}
              <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3.5 shadow-lg shadow-black/40">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-[8px] text-emerald-400 uppercase tracking-widest font-bold">OPTIMIZED CALORIC TARGET REPORT</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-slate-950/70 border border-slate-850 rounded-xl p-3 flex flex-col justify-between shadow-inner">
                    <span className="text-[7px] text-slate-500 uppercase tracking-wider block">BASAL BMR</span>
                    <span className="text-base font-extrabold text-slate-200 mt-1 leading-none">{targets.bmr} <span className="text-[8px] text-slate-500 font-normal">kcal</span></span>
                    <span className="text-[6px] text-slate-600 block mt-1">STATIONARY BURNING RATE</span>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-850 rounded-xl p-3 flex flex-col justify-between shadow-inner">
                    <span className="text-[7px] text-slate-500 uppercase tracking-wider block">DAILY TDEE</span>
                    <span className="text-base font-extrabold text-slate-200 mt-1 leading-none">{targets.tdee} <span className="text-[8px] text-slate-500 font-normal">kcal</span></span>
                    <span className="text-[6px] text-slate-600 block mt-1">ACTIVE SYSTEM EXPENDITURE</span>
                  </div>
                </div>

                {/* Final calculated daily intake */}
                <div className="bg-slate-950/70 border border-cyan-500/20 rounded-xl p-4 relative shadow-inner">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <IoFlame size={15} />
                      <span className="text-[9px] font-extrabold tracking-widest uppercase">DAILY TARGET INTAKE</span>
                    </div>
                    <span className="text-[7px] bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded font-bold">RECOMMENDED</span>
                  </div>
                  <div className="text-3xl font-extrabold text-cyan-400 tracking-tighter mt-1">{targets.calories} <span className="text-xs text-slate-400 tracking-normal font-normal">kcal / day</span></div>
                  
                  {/* Deficit / Surplus readout */}
                  <div className="text-[8px] text-slate-500 uppercase tracking-wider mt-2.5 leading-normal flex items-center justify-between">
                    <span>CALORIC BUDGETING STRATEGY</span>
                    {targets.surplus > 0 ? (
                      <span className="text-pink-400 font-bold">+{targets.surplus} KCAL SURPLUS</span>
                    ) : targets.surplus < 0 ? (
                      <span className="text-emerald-400 font-bold">{targets.surplus} KCAL DEFICIT</span>
                    ) : (
                      <span className="text-cyan-400 font-bold">0 KCAL DELTA (MAINTAIN)</span>
                    )}
                  </div>
                </div>

                {/* Protein Target */}
                <div className="bg-slate-950/70 border border-emerald-500/20 rounded-xl p-4 shadow-inner">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <IoNutrition size={15} />
                      <span className="text-[9px] font-extrabold tracking-widest uppercase">PROTEIN REQUISITION</span>
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-400 tracking-tighter mt-1">{targets.protein} <span className="text-xs text-slate-400 tracking-normal font-normal">g / day</span></div>
                  <span className="text-[7px] text-slate-500 block uppercase tracking-wider mt-2">OPTIMIZED FOR STRENGTH & REVENUE RECOVERY (2.0G / KG)</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation Bar */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 flex items-center gap-3 shrink-0">
        {step > 1 ? (
          <button
            type="button" onClick={handlePrev}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl text-xs font-mono font-bold tracking-widest transition-all min-h-[44px] flex items-center justify-center gap-1.5 uppercase"
          >
            <IoChevronBack size={14} /> BACK
          </button>
        ) : (
          <div className="flex-1 text-[8px] font-bold text-slate-600 tracking-wider leading-relaxed">
            SECURE PORTAL DATA TRANSFER COMMENCING
          </div>
        )}

        {step < 5 ? (
          <button
            type="button" onClick={handleNext}
            className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl text-xs font-mono font-bold tracking-widest transition-all min-h-[44px] flex items-center justify-center gap-1.5 uppercase shadow-lg shadow-cyan-500/10"
          >
            NEXT <IoChevronForward size={14} />
          </button>
        ) : (
          <button
            type="button" onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs font-mono font-bold tracking-widest transition-all min-h-[44px] flex items-center justify-center gap-1.5 uppercase shadow-lg shadow-emerald-500/15"
          >
            {saving ? 'CONFIGURING...' : 'INITIALIZE AGENT'}
          </button>
        )}
      </footer>
    </div>
  );
};

export default ProfileSetup;
