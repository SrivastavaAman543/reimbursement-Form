import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useTranslation } from '../contexts/TranslationContext';

const API = 'http://127.0.0.1:8000/api';

function LoginPage({ t, onLogin }) {
  const { lang, setLang } = useTranslation();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await axios.post(`${API}/register`, { username, email, password });
        setSuccess(t.register_success || 'Registration successful! Please login.');
        setMode('login');
        setPassword('');
      } else {
        const res = await axios.post(`${API}/login`, { username, password });
        const token = res.data.access_token;
        const userRes = await axios.get(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } });
        onLogin(token, userRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || (t.login_error || 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-navy-700 bg-navy-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500";

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <div className="flex bg-navy-800/80 backdrop-blur-md p-0.5 rounded-lg border border-navy-700 h-9 shrink-0 shadow-xl">
          <button onClick={() => setLang('en')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${lang === 'en' ? 'bg-white dark:bg-navy-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            EN
          </button>
          <button onClick={() => setLang('hi')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${lang === 'hi' ? 'bg-white dark:bg-navy-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            HI
          </button>
        </div>
      </div>

      {/* Animated blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/10 rounded-full filter blur-[120px] animate-blob" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full filter blur-[120px] animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute top-3/4 left-1/3 w-72 h-72 bg-purple-500/8 rounded-full filter blur-[100px] animate-blob" style={{ animationDelay: '4s' }} />

      <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }} className="w-full max-w-md relative z-10">
        <div className="glass-card rounded-2xl overflow-hidden shadow-elevated">
          <div className="p-8 sm:p-10 pb-6 text-center">
            <img src="/logo.png" alt="Oges Logo" className="h-10 w-auto mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              {mode === 'login' ? (t.login_title || 'Welcome Back') : (t.register_title || 'Create Account')}
            </h1>
            <p className="text-slate-600 dark:text-slate-500 dark:text-slate-400 text-sm font-medium">
              {mode === 'login' ? (t.login_subtitle || 'Sign in to manage expenses') : (t.register_subtitle || 'Create your account')}
            </p>
          </div>

          <div className="px-8 sm:px-10 pb-8 sm:pb-10">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 p-3 bg-success/10 border border-success/20 rounded-xl text-success text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                {success}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t.username || 'Username'}</label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600 dark:text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className={`${inputClass} pl-10`} placeholder={t.username_placeholder || 'Enter your username'} />
                </div>
              </div>

              {mode === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t.email_label || 'Email'}</label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600 dark:text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={`${inputClass} pl-10`} placeholder={t.email_placeholder || 'Enter your email'} />
                  </div>
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t.password || 'Password'}</label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600 dark:text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} className={`${inputClass} pl-10 pr-12`} placeholder={t.password_placeholder || 'Enter your password'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-600 dark:text-slate-400 dark:text-slate-500 hover:text-accent transition-colors focus:outline-none">
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button type="submit" disabled={loading} className="w-full py-3 px-6 bg-accent hover:bg-accent-600 text-slate-900 font-bold rounded-xl shadow-glow-amber hover:shadow-glow-amber-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2">
                  {loading ? (
                    <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>{t.loading || 'Please wait...'}</>
                  ) : mode === 'login' ? (t.login_btn || 'Sign In') : (t.register_btn || 'Create Account')}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-500 font-medium">
                {mode === 'login' ? (t.no_account || "Don't have an account?") : (t.have_account || 'Already have an account?')}
                <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }} className="ml-2 text-accent hover:text-accent-400 font-bold transition-colors">
                  {mode === 'login' ? (t.register_link || 'Register') : (t.login_link || 'Sign In')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
