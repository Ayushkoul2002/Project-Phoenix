// ============================================
// PROJECT PHOENIX — Aesthetic Motivation Login
// ============================================
// Redesigned login screen featuring a warm athletic
// gym freak theme, high contrast panels, modern inputs,
// and randomized motivational workout quotes.
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMail, IoLockClosed, IoFlame } from 'react-icons/io5';
import { loginUser, signupUser, resetUserPassword } from '../../firebase/authService';

const MOTIVATIONAL_QUOTES = [
  "Consistency beats talent. Show up every single day.",
  "Your only limit is you. Push harder, fuel smarter.",
  "Crush today's calorie targets. Build tomorrow's strength.",
  "No shortcuts. Just discipline, consistency, and progress.",
  "Make today count. Fuel your physical evolution.",
  "Suffer the pain of discipline, or suffer the pain of regret.",
  "Your body achieves what your mind believes. Train hard."
];

const LoginScreen = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Pick a single motivational quote on mount
  const [quote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (isForgot) {
        await resetUserPassword(email);
        setSuccessMsg('RESET LINK SENT — Check your email inbox to reset your password!');
      } else if (isSignup) {
        await signupUser(email, password);
      } else {
        await loginUser(email, password);
      }
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err.code === 'auth/email-already-in-use'
        ? 'This email is already registered'
        : err.code === 'auth/weak-password'
        ? 'Password must be at least 6 characters'
        : err.code === 'auth/user-not-found'
        ? 'No registered account found with this email'
        : `ERROR: ${err.message}`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-white to-emerald-50/20 flex items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Aesthetic Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-13 h-13 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-3"
          >
            <IoFlame size={26} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-widest text-slate-900 uppercase">
            PHOENIX
          </h1>
          <p className="text-slate-500 text-[10px] font-bold mt-1 tracking-[0.25em] uppercase">
            CRUSH TARGETS • CRUSH GOALS
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
          {/* Mode Switch Tab Bar */}
          <div className="flex mb-6 bg-slate-100 rounded-2xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => { setIsSignup(false); setIsForgot(false); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-3 rounded-xl text-xs font-extrabold tracking-wider transition-all ${
                !isSignup && !isForgot
                  ? 'bg-white text-cyan-600 shadow-sm border border-slate-200'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={() => { setIsSignup(true); setIsForgot(false); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-3 rounded-xl text-xs font-extrabold tracking-wider transition-all ${
                isSignup
                  ? 'bg-white text-emerald-600 shadow-sm border border-slate-200'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              REGISTER
            </button>
          </div>

          {/* Input Fields */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {isForgot ? (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                      Your Email Address
                    </label>
                    <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3.5 focus-within:border-cyan-500 focus-within:bg-white transition-all shadow-inner">
                      <IoMail className="text-slate-400 mr-2.5 shrink-0" size={16} />
                      <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                        className="flex-1 bg-transparent text-slate-800 text-sm focus:outline-none placeholder-slate-400"
                        placeholder="Enter registered email..."
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={isSignup ? 'signup' : 'login'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                      Email Address
                    </label>
                    <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3.5 focus-within:border-cyan-500 focus-within:bg-white transition-all shadow-inner">
                      <IoMail className="text-slate-400 mr-2.5 shrink-0" size={16} />
                      <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                        className="flex-1 bg-transparent text-slate-800 text-sm focus:outline-none placeholder-slate-400"
                        placeholder="Enter your email..."
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                      Password
                    </label>
                    <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3.5 focus-within:border-cyan-500 focus-within:bg-white transition-all shadow-inner">
                      <IoLockClosed className="text-slate-400 mr-2.5 shrink-0" size={16} />
                      <input
                        type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                        className="flex-1 bg-transparent text-slate-800 text-sm focus:outline-none placeholder-slate-400"
                        placeholder="••••••••••••"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notifications */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-xs font-semibold leading-relaxed"
                >
                  ⚠ {error}
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-xs font-semibold leading-relaxed"
                >
                  ✓ {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Submit Button */}
            <motion.button
              type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
              className={`w-full py-4 rounded-xl text-xs font-extrabold tracking-widest transition-all ${
                isForgot
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow shadow-cyan-500/10'
                  : isSignup
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow shadow-emerald-500/15'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow shadow-cyan-500/15'
              } disabled:opacity-50 min-h-[48px] uppercase cursor-pointer`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  PROCESSING...
                </span>
              ) : isForgot ? (
                'SEND RESET LINK'
              ) : isSignup ? (
                'START EVOLUTION'
              ) : (
                'SIGN IN'
              )}
            </motion.button>
          </form>

          {/* Toggle Footers */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            {isForgot ? (
              <p className="text-slate-500 text-xs font-medium">
                REMEMBERED CIPHER?{' '}
                <button
                  type="button"
                  onClick={() => { setIsForgot(false); setError(''); setSuccessMsg(''); }}
                  className="text-cyan-600 hover:text-cyan-500 font-bold ml-1 transition-colors cursor-pointer"
                >
                  SIGN IN
                </button>
              </p>
            ) : (
              <div className="space-y-3.5">
                <p className="text-slate-500 text-xs font-medium">
                  {isSignup ? 'ALREADY REGISTERED?' : 'NEW ATHLETE?'}{' '}
                  <button
                    type="button"
                    onClick={() => { setIsSignup(!isSignup); setError(''); setSuccessMsg(''); }}
                    className="text-cyan-600 hover:text-cyan-500 font-bold ml-1 transition-colors cursor-pointer"
                  >
                    {isSignup ? 'SIGN IN' : 'REGISTER'}
                  </button>
                </p>
                {!isSignup && (
                  <button
                    type="button"
                    onClick={() => { setIsForgot(true); setError(''); setSuccessMsg(''); }}
                    className="text-[11px] font-bold text-slate-400 hover:text-cyan-600 transition-colors block mx-auto underline tracking-wider uppercase cursor-pointer"
                  >
                    FORGOT PASSWORD?
                  </button>
                )}
              </div>
            )}

            {/* Warm Motivational Quote Centerpiece */}
            <div className="mt-6 text-center italic text-xs text-slate-500 max-w-xs mx-auto border-t border-slate-100 pt-4 leading-relaxed font-semibold">
              "{quote}"
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
