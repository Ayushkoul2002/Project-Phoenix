// ============================================
// PROJECT PHOENIX — ProfileSetup Wizard
// ============================================
// Redesigned metabolic onboarding wizard featuring
// a stunning high-contrast Athletic Light Theme,
// direct numeric text fields next to range sliders (bug-fixed),
// de-congested mobile margins, and highly visible modern neons.
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronForward, IoChevronBack, IoFlame, IoNutrition, IoCalendar, IoStatsChart, IoClose } from 'react-icons/io5';
import { updateUserProfile, addWeightLog } from '../../firebase/firestoreService';

const ACTIVITY_MULTIPLIERS = [
  { id: 'sedentary', label: 'SEDENTARY / INACTIVE', desc: 'Little or no daily exercise (e.g., desk job)', factor: 1.2 },
  { id: 'lightly_active', label: 'LIGHTLY ACTIVE', desc: 'Light walking or active workouts 1-3 days/week', factor: 1.375 },
  { id: 'moderately_active', label: 'MODERATELY ACTIVE', desc: 'Regular sports or training 3-5 days/week', factor: 1.55 },
  { id: 'very_active', label: 'VERY ACTIVE', desc: 'Heavy daily training or physical labor 6-7 days/week', factor: 1.725 },
];

const GENDERS = [
  { id: 'male', label: 'MALE' },
  { id: 'female', label: 'FEMALE' },
];

const ProfileSetup = ({ uid, onComplete, onCancel }) => {
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

  // Parse active numbers safely, allowing temporary empty string state
  const activeAge = age === '' ? 0 : Number(age);
  const activeHeight = height === '' ? 0 : Number(height);
  const activeWeight = weight === '' ? 0 : Number(weight);
  const activeTargetWeight = targetWeight === '' ? 0 : Number(targetWeight);

  // Live calculations
  const currentMultiplier = ACTIVITY_MULTIPLIERS.find((a) => a.id === activity)?.factor || 1.55;
  
  // 1. Mifflin-St Jeor BMR (with fallback values if currently typing / empty)
  const bmr = Math.round(
    10 * (activeWeight || 60.0) +
    6.25 * (activeHeight || 170) -
    5 * (activeAge || 24) +
    (gender === 'male' ? 5 : -161)
  );

  // 2. TDEE (Total Daily Energy Expenditure)
  const tdee = Math.round(bmr * currentMultiplier);

  // 3. Caloric target to reach goal
  const calculateTargets = () => {
    const w = activeWeight || 60.0;
    const tw = activeTargetWeight || 65.0;
    const wDelta = tw - w;
    
    if (Math.abs(wDelta) < 0.1) {
      return { calories: tdee, surplus: 0, bmr, tdee };
    }

    const tToday = new Date();
    const tDeadline = new Date(deadline);
    const diffTime = Math.max(86400000 * 7, tDeadline - tToday);
    const diffWeeks = diffTime / (86400000 * 7);
    
    const rate = wDelta / diffWeeks; // kg per week
    let caloricDelta = Math.round(rate * 1100);

    // Dynamic Deficit/Surplus Limits for Safety
    const maxDelta = 1000;
    if (caloricDelta > maxDelta) caloricDelta = maxDelta;
    if (caloricDelta < -maxDelta) caloricDelta = -maxDelta;

    let calGoal = tdee + caloricDelta;

    // Safety Floor
    const minSafe = gender === 'male' ? 1500 : 1200;
    const bmrMin = Math.round(bmr * 0.85);
    const absoluteMin = Math.max(minSafe, bmrMin);

    if (calGoal < absoluteMin) {
      calGoal = absoluteMin;
    }

    // Absolute Ceiling
    if (calGoal > 4500) {
      calGoal = 4500;
    }

    // Protein Target: 2.0g per kg of bodyweight
    const proGoal = Math.max(60, Math.round(w * 2.0));

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
    if (step === 1) {
      const parsedAge = Number(age);
      if (parsedAge < 12) setAge(12);
      else if (parsedAge > 90) setAge(90);
    } else if (step === 2) {
      const parsedHeight = Number(height);
      const parsedWeight = Number(weight);
      if (parsedHeight < 100) setHeight(100);
      else if (parsedHeight > 230) setHeight(230);
      
      if (parsedWeight < 30) setWeight(30);
      else if (parsedWeight > 230) setWeight(230);
    } else if (step === 3) {
      const parsedTargetWeight = Number(targetWeight);
      if (parsedTargetWeight < 30) setTargetWeight(30);
      else if (parsedTargetWeight > 230) setTargetWeight(230);
    }
    if (step < 5) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const finalAge = Math.max(12, Math.min(90, Number(age) || 24));
      const finalHeight = Math.max(100, Math.min(230, Number(height) || 170));
      const finalWeight = Math.max(30, Math.min(230, Number(weight) || 60.0));
      const finalTargetWeight = Math.max(30, Math.min(230, Number(targetWeight) || 65.0));

      const profileData = {
        age: finalAge,
        gender,
        height: finalHeight,
        currentWeight: finalWeight,
        targetWeight: finalTargetWeight,
        activity,
        deadline,
        bmr: targets.bmr,
        tdee: targets.tdee,
        calorieTarget: targets.calories,
        proteinTarget: targets.protein,
      };

      await updateUserProfile(uid, profileData);
      await addWeightLog(uid, finalWeight);

      if (onComplete) onComplete(profileData);
    } catch (e) {
      console.error('Error saving user goals:', e);
    } finally {
      setSaving(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.15 } },
  };

  return (
    <div className="fixed inset-0 bg-slate-50 text-slate-800 z-[100] flex flex-col overflow-y-auto safe-area-bottom pb-4 font-sans select-none">
      {/* Background Soft Athletic Tint */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.04),transparent_60%)] pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xl px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        <div>
          <h2 className="text-sm font-extrabold tracking-wider text-slate-900">SET UP YOUR BLUEPRINT</h2>
          <div className="text-[9px] text-slate-500 mt-0.5 tracking-wider uppercase font-semibold">STAGE {step} OF 5</div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress Dots */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={`w-2 h-2 rounded-full transition-all duration-300 ${s === step ? 'bg-cyan-600 w-4 shadow-sm' : s < step ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            ))}
          </div>

          {/* Cancel setup option */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              aria-label="Cancel Setup"
            >
              <IoClose size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-6 py-6 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step-1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div className="text-center">
                <span className="text-3xl block mb-2">👋</span>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-wide uppercase">Let's build your blueprint!</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">First, tell us a bit about yourself. This helps us optimize your metabolism calculation.</p>
              </div>

              {/* Age Selector */}
              <div className="space-y-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 tracking-wider">YOUR AGE</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="12" max="90" value={age}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAge(val === '' ? '' : Math.min(90, Number(val)));
                      }}
                    className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-center text-base font-extrabold text-cyan-600 focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-xs text-slate-400 font-bold">yrs</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold">12</span>
                  <input
                    type="range" min="12" max="90" value={activeAge || 24} onChange={(e) => setAge(Number(e.target.value))}
                    className="flex-1 accent-cyan-600 bg-slate-200 h-2 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">90</span>
                </div>
              </div>

              {/* Gender Choice */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 tracking-wider block">GENDER</label>
                <div className="grid grid-cols-2 gap-4">
                  {GENDERS.map((g) => (
                    <button
                      key={g.id} type="button" onClick={() => setGender(g.id)}
                      className={`py-4 border rounded-2xl font-bold tracking-widest text-xs transition-all flex flex-col items-center justify-center ${
                        gender === g.id
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-600 shadow-sm font-black'
                          : 'border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:border-slate-350'
                      }`}
                    >
                      <span className="text-sm">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step-2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div className="text-center">
                <span className="text-3xl block mb-2">📏</span>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-wide uppercase">Enter your body metrics</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">We need your height and current body mass to configure energy baseline outputs.</p>
              </div>

              {/* Height Selector */}
              <div className="space-y-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 tracking-wider">HEIGHT (CM)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="100" max="230" value={height}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHeight(val === '' ? '' : Math.min(230, Number(val)));
                      }}
                    className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-center text-base font-extrabold text-cyan-600 focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-xs text-slate-400 font-bold">cm</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold">100</span>
                  <input
                    type="range" min="100" max="230" value={activeHeight || 170} onChange={(e) => setHeight(Number(e.target.value))}
                    className="flex-1 accent-cyan-600 bg-slate-200 h-2 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">230</span>
                </div>
              </div>

              {/* Current Weight Input */}
              <div className="space-y-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <label className="text-xs font-bold text-slate-700 tracking-wider block">CURRENT WEIGHT (KG)</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setWeight(Math.max(30, Number((activeWeight - 0.5).toFixed(1))))} className="w-12 h-12 bg-slate-100 border border-slate-200 hover:bg-slate-200 active:scale-95 text-slate-700 font-black rounded-xl text-xl flex items-center justify-center shadow-sm">−</button>
                  <input
                    type="number" step="0.1" min="30" max="230" value={weight}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWeight(val === '' ? '' : Math.min(230, Number(val)));
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 text-center text-xl font-bold font-mono text-cyan-600 focus:outline-none focus:border-cyan-500"
                  />
                  <button type="button" onClick={() => setWeight(Number((activeWeight + 0.5).toFixed(1)))} className="w-12 h-12 bg-slate-100 border border-slate-200 hover:bg-slate-200 active:scale-95 text-slate-700 font-black rounded-xl text-xl flex items-center justify-center shadow-sm">+</button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step-3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div className="text-center">
                <span className="text-3xl block mb-2">🎯</span>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-wide uppercase">Set your target goal</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">What is your ultimate mass target and the deadline date you would like to achieve it by?</p>
              </div>

              {/* Target Weight Input */}
              <div className="space-y-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <label className="text-xs font-bold text-slate-700 tracking-wider block">TARGET WEIGHT (KG)</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setTargetWeight(Math.max(30, Number((activeTargetWeight - 0.5).toFixed(1))))} className="w-12 h-12 bg-slate-100 border border-slate-200 hover:bg-slate-200 active:scale-95 text-slate-700 font-black rounded-xl text-xl flex items-center justify-center shadow-sm">−</button>
                  <input
                    type="number" step="0.1" min="30" max="230" value={targetWeight}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTargetWeight(val === '' ? '' : Math.min(230, Number(val)));
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 text-center text-xl font-bold font-mono text-cyan-600 focus:outline-none focus:border-cyan-500"
                  />
                  <button type="button" onClick={() => setTargetWeight(Number((activeTargetWeight + 0.5).toFixed(1)))} className="w-12 h-12 bg-slate-100 border border-slate-200 hover:bg-slate-200 active:scale-95 text-slate-700 font-black rounded-xl text-xl flex items-center justify-center shadow-sm">+</button>
                </div>
                <div className="flex justify-between items-center px-1 text-[10px] font-bold tracking-wider">
                  <span className="text-slate-500">PLAN STRATEGY:</span>
                  {activeTargetWeight > activeWeight ? (
                    <span className="text-pink-600 font-black">▲ CONTROLLED BULK (+{(activeTargetWeight - activeWeight).toFixed(1)} KG)</span>
                  ) : activeTargetWeight < activeWeight ? (
                    <span className="text-emerald-600 font-black">▼ SAFE WEIGHT SHRED (-{(activeWeight - activeTargetWeight).toFixed(1)} KG)</span>
                  ) : (
                    <span className="text-cyan-600 font-black">★ STABLE RECOMPOSITION</span>
                  )}
                </div>
              </div>

              {/* Target Deadline Input */}
              <div className="space-y-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <label className="text-xs font-bold text-slate-700 tracking-wider block">TARGET DEADLINE DATE</label>
                <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 shadow-inner">
                  <IoCalendar className="text-cyan-600 mr-3 shrink-0" size={18} />
                  <input
                    type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} required
                    className="flex-1 bg-transparent text-slate-800 focus:outline-none font-mono text-base tracking-wider w-full select-none"
                    style={{ colorScheme: 'light' }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step-4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
              <div className="text-center">
                <span className="text-3xl block mb-2">🏃</span>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-wide uppercase">How active is your lifestyle?</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">This estimate tells us how many calories you burn with daily movement and workouts.</p>
              </div>

              {/* Activity Selector */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto scrollbar-thin pr-1">
                {ACTIVITY_MULTIPLIERS.map((a) => (
                  <button
                    key={a.id} type="button" onClick={() => setActivity(a.id)}
                    className={`w-full text-left p-4 border rounded-2xl flex flex-col gap-1 transition-all ${
                      activity === a.id
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-750 shadow-sm border-cyan-400/40'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-black tracking-wider block uppercase">{a.label}</span>
                    <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">{a.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step-5" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div className="text-center">
                <span className="text-3xl block mb-2">💪</span>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-wide uppercase">Your Personalized Plan</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">We have generated your custom caloric and protein targets to hit your targets safely.</p>
              </div>

              {/* Assessment Report Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-md">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-1">
                  <IoStatsChart className="text-emerald-500" size={18} />
                  <span className="text-[10px] text-slate-700 uppercase tracking-widest font-black">YOUR BLUEPRINT NUTRIENT METRICS</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex flex-col justify-between shadow-inner">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Resting Burn (BMR)</span>
                    <span className="text-lg font-black text-slate-900 mt-1 leading-none">{targets.bmr} <span className="text-[8px] text-slate-400 font-normal">kcal</span></span>
                    <span className="text-[8px] text-slate-500 block leading-tight mt-1.5 font-semibold">Calories burned staying alive</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex flex-col justify-between shadow-inner">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Daily Active (TDEE)</span>
                    <span className="text-lg font-black text-slate-900 mt-1 leading-none">{targets.tdee} <span className="text-[8px] text-slate-400 font-normal">kcal</span></span>
                    <span className="text-[8px] text-slate-500 block leading-tight mt-1.5 font-semibold">Calories burned with movement</span>
                  </div>
                </div>

                {/* Final calculated daily intake */}
                <div className="bg-slate-50 border border-cyan-300 rounded-xl p-4.5 relative shadow-inner">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 text-cyan-600">
                      <IoFlame size={18} className="text-cyan-500" />
                      <span className="text-[10px] font-black tracking-widest uppercase">DAILY CALORIE GOAL</span>
                    </div>
                    <span className="text-[8px] bg-cyan-100 border border-cyan-200 text-cyan-700 px-2 py-0.5 rounded font-black">OPTIMIZED</span>
                  </div>
                  <div className="text-3xl font-black text-cyan-600 tracking-tighter mt-1">{targets.calories} <span className="text-xs text-slate-500 tracking-normal font-normal">kcal / day</span></div>
                  
                  {/* Deficit / Surplus readout */}
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-3 leading-normal flex items-center justify-between font-bold">
                    <span>BUDGET STRATEGY:</span>
                    {targets.surplus > 0 ? (
                      <span className="text-pink-600">+{targets.surplus} KCAL DAILY SURPLUS</span>
                    ) : targets.surplus < 0 ? (
                      <span className="text-emerald-600">{targets.surplus} KCAL DAILY DEFICIT</span>
                    ) : (
                      <span className="text-cyan-600">MAINTENANCE TARGET</span>
                    )}
                  </div>
                </div>

                {/* Protein Target */}
                <div className="bg-slate-50 border border-emerald-250 rounded-xl p-4 shadow-inner">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <IoNutrition size={16} className="text-emerald-500" />
                      <span className="text-[10px] font-black tracking-widest uppercase">DAILY PROTEIN TARGET</span>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-600 tracking-tighter mt-1">{targets.protein} <span className="text-xs text-slate-500 tracking-normal font-normal">g / day</span></div>
                  <span className="text-[8px] text-slate-400 block uppercase tracking-wider mt-2.5 font-bold">To maintain lean mass & recovery (2.0g / kg)</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Spacious Footer Navigation */}
      <footer className="border-t border-slate-200 bg-white/95 backdrop-blur-xl px-6 py-4 flex items-center gap-4 shrink-0 sticky bottom-0 z-10 shadow-inner">
        {step > 1 ? (
          <button
            type="button" onClick={handlePrev}
            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold tracking-widest transition-all min-h-[50px] flex items-center justify-center gap-1.5 uppercase shadow-sm"
          >
            <IoChevronBack size={16} /> BACK
          </button>
        ) : (
          <div className="flex-1 text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-relaxed">
            PHOENIX NUTRITION PROFILE ENGINE
          </div>
        )}

        {step < 5 ? (
          <button
            type="button" onClick={handleNext}
            className="flex-1 py-3.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold tracking-widest transition-all min-h-[50px] flex items-center justify-center gap-1.5 uppercase shadow-md shadow-cyan-500/10"
          >
            NEXT <IoChevronForward size={16} />
          </button>
        ) : (
          <button
            type="button" onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs font-bold tracking-widest transition-all min-h-[50px] flex items-center justify-center gap-1.5 uppercase shadow-md shadow-emerald-500/15"
          >
            {saving ? 'CONFIGURING...' : 'CRUSH GOALS'}
          </button>
        )}
      </footer>
    </div>
  );
};

export default ProfileSetup;
