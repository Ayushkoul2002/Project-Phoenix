// ============================================
// PROJECT PHOENIX — ProfileSetup Wizard
// ============================================
// Aesthetic humanized setup wizard with warm COPY,
// direct numeric text fields next to range sliders,
// de-congested mobile margins, and highly visible neons.
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronForward, IoChevronBack, IoFlame, IoNutrition, IoCalendar, IoStatsChart, IoClose } from 'react-icons/io5';
import { updateUserProfile, addWeightLog } from '../../firebase/firestoreService';

const ACTIVITY_MULTIPLIERS = [
  { id: 'sedentary', label: 'SEDENTARY', desc: 'Mostly sitting (e.g. desk job, study)', factor: 1.2 },
  { id: 'lightly_active', label: 'LIGHTLY ACTIVE', desc: 'Light walking, active commute, or light workouts 1-3 days/week', factor: 1.375 },
  { id: 'moderately_active', label: 'MODERATELY ACTIVE', desc: 'Regular sports, gym sessions, or physical workouts 3-5 days/week', factor: 1.55 },
  { id: 'very_active', label: 'VERY ACTIVE', desc: 'Heavy physical training, athletic coaching, or labor 6-7 days/week', factor: 1.725 },
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

  // Live calculations
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

  // 3. Caloric target to reach goal
  const calculateTargets = () => {
    const wDelta = targetWeight - weight;
    
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

    // Protein Target: 2.0g per kg of current bodyweight (min 60g)
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

      await updateUserProfile(uid, profileData);
      await addWeightLog(uid, weight);

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
    <div className="fixed inset-0 bg-slate-900 text-slate-100 z-[100] flex flex-col overflow-y-auto safe-area-bottom pb-4 font-sans select-none">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.08),transparent_50%)] pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-slate-750 bg-slate-850/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-md">
        <div>
          <h2 className="text-sm font-extrabold tracking-wider text-cyan-300">BUILD YOUR BLUEPRINT</h2>
          <div className="text-[9px] text-slate-400 mt-0.5 tracking-wider uppercase font-semibold">STAGE {step} OF 5</div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress Indicators */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={`w-2 h-2 rounded-full transition-all duration-300 ${s === step ? 'bg-cyan-400 w-4 shadow shadow-cyan-400/40' : s < step ? 'bg-emerald-400' : 'bg-slate-700'}`} />
            ))}
          </div>

          {/* Cancel button if editing from settings */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              aria-label="Cancel Setup"
            >
              <IoClose size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-md w-full mx-auto px-6 py-6 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step-1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div className="text-center">
                <span className="text-3xl block mb-2">👋</span>
                <h3 className="text-lg font-bold text-white tracking-wide uppercase">Let's build your blueprint!</h3>
                <p className="text-xs text-slate-350 leading-relaxed mt-1">First, tell us a bit about yourself. This helps us optimize your metabolism calculation.</p>
              </div>

              {/* Age Selector */}
              <div className="space-y-3 bg-slate-850/80 border border-slate-750 rounded-2xl p-5 shadow">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-200 tracking-wider">YOUR AGE</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="12" max="90" value={age}
                      onChange={(e) => setAge(Math.min(90, Math.max(12, Number(e.target.value) || 12)))}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-center text-base font-extrabold text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-xs text-slate-500 font-bold">yrs</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-bold">12</span>
                  <input
                    type="range" min="12" max="90" value={age} onChange={(e) => setAge(Number(e.target.value))}
                    className="flex-1 accent-cyan-400 bg-slate-900 h-2 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 font-bold">90</span>
                </div>
              </div>

              {/* Gender Choice */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-200 tracking-wider block">GENDER</label>
                <div className="grid grid-cols-2 gap-4">
                  {GENDERS.map((g) => (
                    <button
                      key={g.id} type="button" onClick={() => setGender(g.id)}
                      className={`py-4 border rounded-2xl font-bold tracking-widest text-xs transition-all flex flex-col items-center justify-center ${
                        gender === g.id
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/10'
                          : 'border-slate-750 bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-sm font-black">{g.label}</span>
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
                <h3 className="text-lg font-bold text-white tracking-wide uppercase">Enter your body metrics</h3>
                <p className="text-xs text-slate-350 leading-relaxed mt-1">We need your height and current body mass to configure energy baseline outputs.</p>
              </div>

              {/* Height Selector */}
              <div className="space-y-3 bg-slate-850/80 border border-slate-750 rounded-2xl p-5 shadow">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-200 tracking-wider">HEIGHT (CM)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="100" max="230" value={height}
                      onChange={(e) => setHeight(Math.min(230, Math.max(100, Number(e.target.value) || 100)))}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-center text-base font-extrabold text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-xs text-slate-500 font-bold">cm</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-bold">100</span>
                  <input
                    type="range" min="100" max="230" value={height} onChange={(e) => setHeight(Number(e.target.value))}
                    className="flex-1 accent-cyan-400 bg-slate-900 h-2 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 font-bold">230</span>
                </div>
              </div>

              {/* Current Weight Input */}
              <div className="space-y-3 bg-slate-850/80 border border-slate-750 rounded-2xl p-5 shadow">
                <label className="text-xs font-bold text-slate-200 tracking-wider block">CURRENT WEIGHT (KG)</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setWeight(Math.max(30, Number((weight - 0.5).toFixed(1))))} className="w-12 h-12 bg-slate-700 border border-slate-600 hover:bg-slate-650 active:scale-95 text-slate-200 font-extrabold rounded-xl text-xl flex items-center justify-center shadow-sm">−</button>
                  <input
                    type="number" step="0.1" min="30" max="230" value={weight}
                    onChange={(e) => setWeight(Math.min(230, Math.max(30, Number(e.target.value) || 30)))}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-3 text-center text-xl font-bold font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                  <button type="button" onClick={() => setWeight(Number((weight + 0.5).toFixed(1)))} className="w-12 h-12 bg-slate-700 border border-slate-600 hover:bg-slate-650 active:scale-95 text-slate-200 font-extrabold rounded-xl text-xl flex items-center justify-center shadow-sm">+</button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step-3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div className="text-center">
                <span className="text-3xl block mb-2">🎯</span>
                <h3 className="text-lg font-bold text-white tracking-wide uppercase">Set your target goal</h3>
                <p className="text-xs text-slate-350 leading-relaxed mt-1">What is your ultimate mass target and the deadline date you would like to achieve it by?</p>
              </div>

              {/* Target Weight Input */}
              <div className="space-y-3 bg-slate-850/80 border border-slate-750 rounded-2xl p-5 shadow">
                <label className="text-xs font-bold text-slate-200 tracking-wider block">TARGET WEIGHT (KG)</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setTargetWeight(Math.max(30, Number((targetWeight - 0.5).toFixed(1))))} className="w-12 h-12 bg-slate-700 border border-slate-600 hover:bg-slate-650 active:scale-95 text-slate-200 font-extrabold rounded-xl text-xl flex items-center justify-center shadow-sm">−</button>
                  <input
                    type="number" step="0.1" min="30" max="230" value={targetWeight}
                    onChange={(e) => setTargetWeight(Math.min(230, Math.max(30, Number(e.target.value) || 30)))}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-3 text-center text-xl font-bold font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                  <button type="button" onClick={() => setTargetWeight(Number((targetWeight + 0.5).toFixed(1)))} className="w-12 h-12 bg-slate-700 border border-slate-600 hover:bg-slate-650 active:scale-95 text-slate-200 font-extrabold rounded-xl text-xl flex items-center justify-center shadow-sm">+</button>
                </div>
                <div className="flex justify-between items-center px-1 text-[10px] font-bold tracking-wider">
                  <span className="text-slate-400">DIRECTION:</span>
                  {targetWeight > weight ? (
                    <span className="text-pink-400 font-black">▲ GAIN SURPLUS (+{(targetWeight - weight).toFixed(1)} KG)</span>
                  ) : targetWeight < weight ? (
                    <span className="text-emerald-400 font-black">▼ DEFICIT SHRED (-{(weight - targetWeight).toFixed(1)} KG)</span>
                  ) : (
                    <span className="text-cyan-400 font-black">★ STABLE MAINTENANCE</span>
                  )}
                </div>
              </div>

              {/* Target Deadline Input */}
              <div className="space-y-3 bg-slate-850/80 border border-slate-750 rounded-2xl p-5 shadow">
                <label className="text-xs font-bold text-slate-200 tracking-wider block">TARGET DEADLINE DATE</label>
                <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
                  <IoCalendar className="text-cyan-400 mr-3 shrink-0" size={18} />
                  <input
                    type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} required
                    className="flex-1 bg-transparent text-slate-100 focus:outline-none font-mono text-base tracking-wider w-full select-none"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step-4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
              <div className="text-center">
                <span className="text-3xl block mb-2">🏃</span>
                <h3 className="text-lg font-bold text-white tracking-wide uppercase">How active is your lifestyle?</h3>
                <p className="text-xs text-slate-350 leading-relaxed mt-1">This estimate tells us how many calories you burn with daily movement and workouts.</p>
              </div>

              {/* Activity Selector */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto scrollbar-thin pr-1">
                {ACTIVITY_MULTIPLIERS.map((a) => (
                  <button
                    key={a.id} type="button" onClick={() => setActivity(a.id)}
                    className={`w-full text-left p-4 border rounded-2xl flex flex-col gap-1 transition-all ${
                      activity === a.id
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/10'
                        : 'border-slate-750 bg-slate-800/80 text-slate-300 hover:border-slate-650 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-black tracking-wider block">{a.label}</span>
                    <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">{a.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step-5" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div className="text-center">
                <span className="text-3xl block mb-2">🎉</span>
                <h3 className="text-lg font-bold text-white tracking-wide uppercase">Your Optimized Plan</h3>
                <p className="text-xs text-slate-350 leading-relaxed mt-1">We have generated your custom caloric and protein targets to hit your targets safely.</p>
              </div>

              {/* Assessment Report Terminal */}
              <div className="bg-slate-850/80 border border-slate-750 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-2.5 mb-1">
                  <IoStatsChart className="text-emerald-400 animate-pulse" size={18} />
                  <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">YOUR BLUEPRINT NUTRIENT SPECIFICATION</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-750 rounded-xl p-3.5 flex flex-col justify-between shadow-inner">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Resting Burn (BMR)</span>
                    <span className="text-base font-black text-white mt-1 leading-none">{targets.bmr} <span className="text-[8px] text-slate-500 font-normal">kcal</span></span>
                    <span className="text-[8px] text-slate-500 block leading-tight mt-1.5 font-medium">Burned just staying alive</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-750 rounded-xl p-3.5 flex flex-col justify-between shadow-inner">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Daily Active (TDEE)</span>
                    <span className="text-base font-black text-white mt-1 leading-none">{targets.tdee} <span className="text-[8px] text-slate-500 font-normal">kcal</span></span>
                    <span className="text-[8px] text-slate-500 block leading-tight mt-1.5 font-medium">Burned with daily movement</span>
                  </div>
                </div>

                {/* Final calculated daily intake */}
                <div className="bg-slate-900 border border-cyan-400/40 rounded-xl p-4.5 relative shadow-inner">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 text-cyan-300">
                      <IoFlame size={18} className="text-cyan-300" />
                      <span className="text-[10px] font-black tracking-widest uppercase">DAILY CALORIE GOAL</span>
                    </div>
                    <span className="text-[8px] bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 px-2 py-0.5 rounded font-black">OPTIMIZED</span>
                  </div>
                  <div className="text-3xl font-black text-cyan-300 tracking-tighter mt-1">{targets.calories} <span className="text-xs text-slate-350 tracking-normal font-normal">kcal / day</span></div>
                  
                  {/* Deficit / Surplus readout */}
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-3 leading-normal flex items-center justify-between">
                    <span>BUDGETING:</span>
                    {targets.surplus > 0 ? (
                      <span className="text-pink-400 font-extrabold">+{targets.surplus} KCAL GAIN SURPLUS</span>
                    ) : targets.surplus < 0 ? (
                      <span className="text-emerald-400 font-extrabold">{targets.surplus} KCAL SHRED DEFICIT</span>
                    ) : (
                      <span className="text-cyan-400 font-extrabold">MAINTENANCE TARGET</span>
                    )}
                  </div>
                </div>

                {/* Protein Target */}
                <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 shadow-inner">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <IoNutrition size={16} className="text-emerald-300" />
                      <span className="text-[10px] font-black tracking-widest uppercase">DAILY PROTEIN TARGET</span>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-300 tracking-tighter mt-1">{targets.protein} <span className="text-xs text-slate-350 tracking-normal font-normal">g / day</span></div>
                  <span className="text-[8px] text-slate-500 block uppercase tracking-wider mt-2.5 font-medium">To maintain lean mass & recovery (2.0g / kg)</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Spacious Footer Navigation */}
      <footer className="border-t border-slate-700 bg-slate-800/90 backdrop-blur-xl px-6 py-4 flex items-center gap-4 shrink-0 sticky bottom-0 z-10 shadow-inner">
        {step > 1 ? (
          <button
            type="button" onClick={handlePrev}
            className="flex-1 py-3.5 bg-slate-700 hover:bg-slate-650 text-slate-200 border border-slate-650 rounded-xl text-xs font-bold tracking-widest transition-all min-h-[50px] flex items-center justify-center gap-1.5 uppercase shadow"
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
