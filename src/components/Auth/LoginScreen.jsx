// ============================================
// PROJECT PHOENIX — Cyberpunk Terminal Login
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginUser, signupUser, resetUserPassword } from '../../firebase/authService';

const LoginScreen = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
        ? 'ACCESS DENIED — Invalid credentials'
        : err.code === 'auth/email-already-in-use'
        ? 'AGENT EXISTS — Email already registered'
        : err.code === 'auth/weak-password'
        ? 'WEAK CIPHER — Password must be 6+ characters'
        : err.code === 'auth/user-not-found'
        ? 'NOT FOUND — No registered account found with this email'
        : `ERROR: ${err.message}`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Scanline overlay */}
      <div className="scanline-overlay" />
      
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Terminal Header */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-4xl font-bold font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400"
            animate={{ textShadow: ['0 0 20px rgba(6,182,212,0.5)', '0 0 40px rgba(6,182,212,0.8)', '0 0 20px rgba(6,182,212,0.5)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            PHOENIX
          </motion.h1>
          <p className="text-slate-500 text-xs font-mono mt-2 tracking-[0.3em]">
            SECURE TERMINAL v2.0
          </p>
        </div>

        {/* Terminal Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-cyan-500/5">
          {/* Mode Toggle */}
          <div className="flex mb-6 bg-slate-800/50 rounded-xl p-1 border border-slate-700/30">
            <button
              type="button"
              onClick={() => { setIsSignup(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-mono font-semibold transition-all duration-300 ${
                !isSignup
                  ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10 border border-cyan-500/30'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              ACCESS TERMINAL
            </button>
            <button
              type="button"
              onClick={() => { setIsSignup(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-mono font-semibold transition-all duration-300 ${
                isSignup
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10 border border-emerald-500/30'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              CREATE AGENT
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {isForgot ? (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider">
                      AGENT_ID (EMAIL)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 text-slate-200 font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                      placeholder="Enter registered email..."
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={isSignup ? 'signup' : 'login'}
                  initial={{ opacity: 0, x: isSignup ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isSignup ? -20 : 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider">
                      AGENT_ID (EMAIL)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 text-slate-200 font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                      placeholder="agent@phoenix.sys"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider">
                      CIPHER_KEY (PASSWORD)
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 text-slate-200 font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                      placeholder="••••••••••••"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 text-amber-400 text-xs font-mono"
                >
                  ⚠ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-emerald-400 text-xs font-mono leading-relaxed"
                >
                  ✓ {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className={`w-full py-3.5 rounded-xl font-mono font-bold text-sm tracking-wider transition-all duration-300 ${
                isForgot
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                  : isSignup
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  PROCESSING...
                </span>
              ) : isForgot ? (
                'SEND RESET LINK →'
              ) : isSignup ? (
                'CREATE AGENT →'
              ) : (
                'ACCESS TERMINAL →'
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-700/30 text-center">
            {isForgot ? (
              <p className="text-slate-600 text-xs font-mono">
                REMEMBERED PASSWORD?{' '}
                <button
                  type="button"
                  onClick={() => { setIsForgot(false); setError(''); setSuccessMsg(''); }}
                  className="text-cyan-500 hover:text-cyan-400 transition-colors font-bold"
                >
                  ACCESS TERMINAL
                </button>
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-600 text-xs font-mono">
                  {isSignup ? 'EXISTING AGENT?' : 'NEW RECRUIT?'}{' '}
                  <button
                    type="button"
                    onClick={() => { setIsSignup(!isSignup); setError(''); setSuccessMsg(''); }}
                    className="text-cyan-500 hover:text-cyan-400 transition-colors font-bold"
                  >
                    {isSignup ? 'ACCESS TERMINAL' : 'CREATE AGENT'}
                  </button>
                </p>
                {!isSignup && (
                  <button
                    type="button"
                    onClick={() => { setIsForgot(true); setError(''); setSuccessMsg(''); }}
                    className="text-[11px] font-mono text-slate-500 hover:text-cyan-400 transition-colors block mx-auto underline tracking-wider"
                  >
                    FORGOT PASSWORD?
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-4 flex justify-between items-center px-2">
          <span className="text-[10px] font-mono text-slate-600">SYS.STATUS: ONLINE</span>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            SECURE
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
