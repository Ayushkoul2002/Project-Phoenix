// ============================================
// PROJECT PHOENIX — ProfileSetup Wizard
// ============================================
// Redesigned metabolic onboarding wizard featuring
// warm human copywriting, direct typeable inputs + sliders,
// highly spacious spacing, and bright high-contrast theme components.
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronForward, IoChevronBack, IoFlame, IoNutrition, IoCalendar, IoPerson, IoBarbell } from 'react-icons/io5';
import { updateUserProfile, addWeightLog } from '../../firebase/firestoreService';

const ACTIVITY_MULTIPLIERS = [
  { id: 'sedentary', label: 'SEDENTARY / DESK JOB', desc: 'Little to no active daily exercise', factor: 1.2 },
  { id: 'lightly_active', label: 'LIGHTLY ACTIVE', desc: 'Light walking, yoga, or workouts 1-3 days/week', factor: 1.375 },
  { id: 'moderately_active', label: 'MODERATELY ACTIVE', desc: 'Regular gym sessions or sports 3-5 days/week', factor: 1.55 },
  { id: 'very_active', label: 'VERY ACTIVE', desc: 'Intense physical training or labor 6-7 days/week', factor: 1.725 },
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

  // Initialize target deadline to exactly 3 months from today
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

  // 3. Caloric surplus/deficit calculation to hit target by deadline
  const calculateTargets = () => {
    const wDelta = targetWeight - weight;
    
    // If target weight is essentially same as current
    if (Math.abs(wDelta) < 0.1) {
      return { calories: tdee, surplus: 0, bmr, tdee };
    }

    const tToday = new Date();
    const tDeadline = new Date(deadline);
    const diffTime = Math.max(86400000 * 7, tDeadline - tToday); // minimum 1 week
    const diffWeeks = diffTime / (86400000 * 7);
    
    const rate = wDelta / diffWeeks; // kg per week
    let caloricDelta = Math.round(rate * 1100);

    // Apply deficit/surplus limits to keep it healthy
    const maxDelta = 1000;
    if (caloricDelta > maxDelta) caloricDelta = maxDelta;
    if (caloricDelta < -maxDelta) caloricDelta = -maxDelta;

    let calGoal = tdee + caloricDelta;

    // Apply absolute safe floors
    const minSafe = gender === 'male' ? 1500 : 1200;
    const bmrMin = Math.round(bmr * 0.85);
    const absoluteMin = Math.max(minSafe, bmrMin);

    if (calGoal < absoluteMin) {
      calGoal = absoluteMin;
    }

    // Absolute safe ceiling
    if (calGoal > 4500) {
      calGoal = 4500;
    }

    // Protein goal based on current weight (2.0g per kg of bodyweight, min 60g)
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
      console.error('Error saving user profile:', e);
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
    <div className="fixed inset-0 bg-slate-900 text-slate-100 z-[100] flex flex-col overflow-y-auto safe-area-bottom pb-4">
      {/* Visual Contrast Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-slate-700 bg-slate-800/90 backdrop-blur-xl px-6 py-5 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-2">
          <IoPerson className="text-cyan-400" size={18} />
          <h2 className="text-sm font-extrabold tracking-widest text-cyan-300">USER PROFILE INITIALIZATION</h2>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-700/80 px-2.5 py-1 rounded-full">STEP {step} / 5</span>
      </header>

      {/* Spacious Main Body Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-6 py-6 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step-1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-7">
              <div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-1">PART 1: BASICS</span>
                <h3 className="text-xl font-black text-white tracking-wide">Tell us a bit about yourself</h3>
                <p className="text-xs text-slate-350 leading-relaxed mt-1">Please enter your age and select your sex classification so we can compute your resting energy baseline.</p>
              </div>

              {/* Age Typeable Selector */}
              <div className="space-y-3 bg-slate-800/95 border border-slate-700 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-200 tracking-wider">YOUR AGE (YEARS)</label>
                  <input
                    type="number" min="12" max="99" value={age}
                    onChange={(e) => setAge(Math.min(99, Math.max(12, Number(e.target.value) || 12)))}
                    className="w-16 bg-slate-900 border border-slate-650 rounded-xl px-2 py-1.5 text-center text-base font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold">12</span>
                  <input
                    type="range" min="12" max="99" value={age} onChange={(e) => setAge(Number(e.target.value))}
                    className="flex-1 accent-cyan-400 bg-slate-900 h-2 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">99</span>
                </div>
              </div>

              {/* Gender Choice */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-200 tracking-wider block">GENDER CLASSIFICATION</label>
                <div className="grid grid-cols-2 gap-4">
                  {GENDERS.map((g) => (
                    <button
                      key={g.id} type="button" onClick={() => setGender(g.id)}
                      className={`py-4 border rounded-2xl font-bold tracking-widest text-xs transition-all flex flex-col items-center justify-center ${
                        gender === g.id
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/10'
                          : 'border-slate-700 bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
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
            <motion.div key="step-2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-7">
              <div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-1">PART 2: BIOMETRICS</span>
                <h3 className="text-xl font-black text-white tracking-wide">What is your height & weight?</h3>
                <p className="text-xs text-slate-350 leading-relaxed mt-1">Height and weight inputs are used to calculate your specific resting energy consumption rate.</p>
              </div>

              {/* Height Selector */}
              <div className="space-y-3 bg-slate-800/95 border border-slate-700 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-200 tracking-wider">HEIGHT (CM)</label>
                  <input
                    type="number" min="100" max="230" value={height}
                    onChange={(e) => setHeight(Math.min(230, Math.max(100, Number(e.target.value) || 100)))}
                    className="w-20 bg-slate-900 border border-slate-650 rounded-xl px-2 py-1.5 text-center text-base font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold">100</span>
                  <input
                    type="range" min="100" max="230" value={height} onChange={(e) => setHeight(Number(e.target.value))}
                    className="flex-1 accent-cyan-400 bg-slate-900 h-2 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">230</span>
                </div>
              </div>

              {/* Current Weight Input */}
              <div className="space-y-3 bg-slate-800/95 border border-slate-700 rounded-2xl p-5 shadow-lg">
                <label className="text-xs font-bold text-slate-200 tracking-wider block">CURRENT WEIGHT (KG)</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setWeight(Math.max(30, Number((weight - 0.5).toFixed(1))))} className="w-12 h-12 bg-slate-700 border border-slate-600 hover:bg-slate-600 hover:border-slate-500 active:scale-95 text-slate-100 font-black rounded-xl text-xl flex items-center justify-center shadow-md">−</button>
                  <input
                    type="number" step="0.1" min="30" max="230" value={weight}
                    onChange={(e) => setWeight(Math.min(230, Math.max(30, Number(e.target.value) || 30)))}
                    className="flex-1 bg-slate-900 border border-slate-650 rounded-xl py-3 text-center text-xl font-bold font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                  <button type="button" onClick={() => setWeight(Number((weight + 0.5).toFixed(1)))} className="w-12 h-12 bg-slate-700 border border-slate-600 hover:bg-slate-600 hover:border-slate-500 active:scale-95 text-slate-100 font-black rounded-xl text-xl flex items-center justify-center shadow-md">+</button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step-3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-7">
              <div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-1">PART 3: TARGETS</span>
                <h3 className="text-xl font-black text-white tracking-wide">What is your weight goal?</h3>
                <p className="text-xs text-slate-350 leading-relaxed mt-1">Specify your desired body mass target and the deadline date you would like to achieve it by.</p>
              </div>

              {/* Target Weight Input */}
              <div className="space-y-3 bg-slate-800/95 border border-slate-700 rounded-2xl p-5 shadow-lg">
                <label className="text-xs font-bold text-slate-200 tracking-wider block">TARGET WEIGHT (KG)</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setTargetWeight(Math.max(30, Number((targetWeight - 0.5).toFixed(1))))} className="w-12 h-12 bg-slate-700 border border-slate-600 hover:bg-slate-600 hover:border-slate-500 active:scale-95 text-slate-100 font-black rounded-xl text-xl flex items-center justify-center shadow-md">−</button>
                  <input
                    type="number" step="0.1" min="30" max="230" value={targetWeight}
                    onChange={(e) => setTargetWeight(Math.min(230, Math.max(30, Number(e.target.value) || 30)))}
                    className="flex-1 bg-slate-900 border border-slate-650 rounded-xl py-3 text-center text-xl font-bold font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                  <button type="button" onClick={() => setTargetWeight(Number((targetWeight + 0.5).toFixed(1)))} className="w-12 h-12 bg-slate-700 border border-slate-600 hover:bg-slate-600 hover:border-slate-500 active:scale-95 text-slate-100 font-black rounded-xl text-xl flex items-center justify-center shadow-md">+</button>
                </div>
                <div className="flex justify-between items-center px-1 text-[10px] font-bold tracking-wider">
                  <span className="text-slate-400">PLAN DETAILS:</span>
                  {targetWeight > weight ? (
                    <span className="text-pink-400 font-black">▲ CONTROLLED BULK (+{(targetWeight - weight).toFixed(1)} KG)</span>
                  ) : targetWeight < weight ? (
                    <span className="text-emerald-400 font-black">▼ SAFE WEIGHT CUT (-{(weight - targetWeight).toFixed(1)} KG)</span>
                  ) : (
                    <span className="text-cyan-400 font-black">★ STABLE BODY RECOMP</span>
                  )}
                </div>
              </div>

              {/* Target Deadline Input */}
              <div className="space-y-3 bg-slate-800/95 border border-slate-700 rounded-2xl p-5 shadow-lg">
                <label className="text-xs font-bold text-slate-200 tracking-wider block">TARGET DEADLINE DATE</label>
                <div className="relative flex items-center bg-slate-900 border border-slate-650 rounded-xl px-4 py-3 shadow-inner">
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
              <div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-1">PART 4: ACTIVITY</span>
                <h3 className="text-xl font-black text-white tracking-wide">How active are you daily?</h3>
                <p className="text-xs text-slate-350 leading-relaxed mt-1">This multiplier estimate helps us calculate your dynamic Active Daily Calorie Expenditure (TDEE).</p>
              </div>

              {/* Activity Selector */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto scrollbar-thin pr-1">
                {ACTIVITY_MULTIPLIERS.map((a) => (
                  <button
                    key={a.id} type="button" onClick={() => setActivity(a.id)}
                    className={`w-full text-left p-4 border rounded-2xl flex flex-col gap-1 transition-all ${
                      activity === a.id
                        ? 'border-cyan-400 bg-cyan-500/25 text-cyan-300 shadow-md shadow-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-black tracking-wider uppercase block">{a.label}</span>
                    <span className="text-[10px] text-slate-400 tracking-wide font-medium mt-0.5">{a.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step-5" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-1">PART 5: RECAP</span>
                <h3 className="text-xl font-black text-white tracking-wide">Your Personalized Plan</h3>
                <p className="text-xs text-slate-350 leading-relaxed mt-1">The Phoenix calorie algorithms have optimized your daily nutritional targets based on your goals.</p>
              </div>

              {/* Assessment Report Terminal */}
              <div className="bg-slate-800/95 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-2.5 mb-1">
                  <IoBarbell className="text-emerald-400" size={18} />
                  <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">YOUR INDIVIDUALIZED ENERGY ASSESSMENT</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-3.5 flex flex-col justify-between shadow-inner">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Resting Calories (BMR)</span>
                    <span className="text-lg font-black text-white mt-1 leading-none">{targets.bmr} <span className="text-[9px] text-slate-500 font-normal">kcal</span></span>
                    <span className="text-[8px] text-slate-500 block leading-tight mt-1.5">What you burn just staying alive</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-3.5 flex flex-col justify-between shadow-inner">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Daily Active (TDEE)</span>
                    <span className="text-lg font-black text-white mt-1 leading-none">{targets.tdee} <span className="text-[9px] text-slate-500 font-normal">kcal</span></span>
                    <span className="text-[8px] text-slate-500 block leading-tight mt-1.5">What you burn with daily movement</span>
                  </div>
                </div>

                {/* Final calculated daily intake */}
                <div className="bg-slate-900 border border-cyan-400/40 rounded-xl p-4.5 relative shadow-inner">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 text-cyan-300">
                      <IoFlame size={18} className="text-cyan-300" />
                      <span className="text-[10px] font-black tracking-widest uppercase">DAILY TARGET INTAKE</span>
                    </div>
                    <span className="text-[8px] bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 px-2 py-0.5 rounded font-black">CALCULATED</span>
                  </div>
                  <div className="text-3xl font-black text-cyan-300 tracking-tighter mt-1">{targets.calories} <span className="text-xs text-slate-350 tracking-normal font-normal">kcal / day</span></div>
                  
                  {/* Deficit / Surplus readout */}
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-3 leading-normal flex items-center justify-between">
                    <span>PLAN INTENT:</span>
                    {targets.surplus > 0 ? (
                      <span className="text-pink-400 font-extrabold">+{targets.surplus} KCAL DAILY SURPLUS</span>
                    ) : targets.surplus < 0 ? (
                      <span className="text-emerald-400 font-extrabold">{targets.surplus} KCAL DAILY DEFICIT</span>
                    ) : (
                      <span className="text-cyan-400 font-extrabold">MAINTENANCE INTAKE</span>
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
                  <span className="text-[8px] text-slate-500 block uppercase tracking-wider mt-2.5">FUEL RECOVERY & MUSCLE REVENUE (2.0G / KG)</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Spacious Footer Navigation */}
      <footer className="border-t border-slate-700 bg-slate-800/90 backdrop-blur-xl px-6 py-5 flex items-center gap-4 shrink-0 sticky bottom-0 z-10 shadow-inner">
        {step > 1 ? (
          <button
            type="button" onClick={handlePrev}
            className="flex-1 py-3.5 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-650 rounded-xl text-xs font-bold tracking-widest transition-all min-h-[50px] flex items-center justify-center gap-1.5 uppercase shadow"
          >
            <IoChevronBack size={16} /> BACK
          </button>
        ) : (
          <div className="flex-1 text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-relaxed">
            PHOENIX INITIALIZATION PORTAL ACTIVE
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
            {saving ? 'CONFIGURING...' : 'START PROTOCOL'}
          </button>
        )}
      </footer>
    </div>
  );
};

export default ProfileSetup;
