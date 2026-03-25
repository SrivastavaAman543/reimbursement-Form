import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExpenseForm from './components/ExpenseForm';
import FinanceDashboard from './pages/FinanceDashboard';
import RequestsList from './pages/RequestsList';
import LoginPage from './pages/LoginPage';
import Toast from './components/Toast';
import { useTranslation } from './contexts/TranslationContext';

function App() {
  const { lang, setLang, t } = useTranslation();
  const [view, setView] = useState('form');
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    return 'dark';
  });

  // Auth state
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setView('form');
  };

  useEffect(() => {
    const handleSuccess = () => setShowToast(true);
    window.addEventListener('expense-submitted', handleSuccess);
    return () => {
      window.removeEventListener('expense-submitted', handleSuccess);
    };
  }, []);

  const handleLogin = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
  };

  if (!token || !user) {
    return <LoginPage t={t} onLogin={handleLogin} />;
  }

  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-800 dark:text-slate-200 flex flex-col transition-colors duration-200">
      {/* ─────────── HEADER ─────────── */}
      <header className="w-full bg-navy-900/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200 dark:border-navy-700 transition-colors">
        <div className="w-full px-4 md:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              className="p-2 text-slate-600 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-navy-700 rounded-xl transition-all"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center cursor-pointer group shrink-0" onClick={() => setView('form')}>
              <img src="/logo.png" alt="Oges Logo" className="h-8 w-auto transform group-hover:scale-105 transition-transform duration-300" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-navy-700" />
            
            <div className="flex items-center gap-2">
              <div className="flex bg-navy-800 p-0.5 rounded-lg border border-navy-700 h-9">
                <button onClick={() => setLang('en')} className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${lang === 'en' ? 'bg-white dark:bg-navy-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  EN
                </button>
                <button onClick={() => setLang('hi')} className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${lang === 'hi' ? 'bg-white dark:bg-navy-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  HI
                </button>
              </div>

              <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center bg-navy-800 border border-navy-700 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-navy-700 rounded-lg transition-all" title="Toggle Theme">
                {theme === 'dark' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
            </div>

            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 pl-3 pr-1.5 py-1 sm:py-1.5 bg-navy-800 border border-navy-700 rounded-xl transition-all hover:bg-navy-700 group ring-offset-navy-950 focus:ring-2 focus:ring-accent/30 outline-none"
              >
                <div className="flex flex-col items-end leading-none">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-accent transition-colors">{user.username}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 opacity-70 group-hover:opacity-100">{user.user_role}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold ring-2 ring-transparent group-hover:ring-accent/20 transition-all shadow-glow-amber/10">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div 
                    key="user-menu"
                    initial={{ opacity: 0, scale: 0.95, y: 10, x: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10, x: 10 }}
                    className="absolute right-0 top-full mt-1 w-full bg-navy-900 border border-navy-700/50 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                  >
                    <div className="p-1">
                      <button 
                        onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-400 hover:text-danger-400 hover:bg-danger/10 rounded-lg transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────── MAIN ─────────── */}
      <main className="w-full flex-grow flex relative">
        {/* ─── GLOBAL SIDEBAR ─── */}
        <aside className={`shrink-0 absolute md:static z-20 left-0 top-0 h-full bg-navy-900 border-r border-slate-200 dark:border-navy-700 transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-60 px-4 translate-x-0 opacity-100' : 'w-0 px-0 -translate-x-full md:translate-x-0 opacity-0 md:opacity-100'}`}>
          <div className="w-52 min-w-[13rem] py-6">
            <div className="flex items-center justify-between mb-8 md:hidden">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t.menu || 'Menu'}</h2>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-900 dark:text-white hover:bg-slate-200/50 dark:hover:bg-navy-700/50 dark:hover:bg-white/5 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              <button onClick={() => { setView('form'); if(window.innerWidth < 768) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${view === 'form' ? 'bg-accent/15 text-accent border border-accent/20' : 'text-slate-600 dark:text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-navy-700/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent'}`}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>New Request</span>
              </button>

              {user.user_role === 'ADMIN' && (
                <button onClick={() => { setView('admin'); setActiveAdminTab('dashboard'); if(window.innerWidth < 768) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${view === 'admin' && activeAdminTab === 'dashboard' ? 'bg-accent/15 text-accent border border-accent/20' : 'text-slate-600 dark:text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-navy-700/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent'}`}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>{t.dashboard_link || 'Dashboard'}</span>
                </button>
              )}

              <button onClick={() => { setView('admin'); setActiveAdminTab('requests'); if(window.innerWidth < 768) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${view === 'admin' && activeAdminTab === 'requests' ? 'bg-accent/15 text-accent border border-accent/20' : 'text-slate-600 dark:text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-navy-700/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent'}`}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>{user.user_role === 'ADMIN' ? (t.request_list_link || 'Request List') : (t.my_requests || 'My Requests')}</span>
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/20 dark:bg-navy-950/70 backdrop-blur-sm z-10 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ─── CONTENT AREA ─── */}
        <div className="flex-1 min-w-0 px-4 md:px-6 py-6 transition-all duration-300">
          <AnimatePresence mode="wait">
            {view === 'form' ? (
              <motion.div key="form" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="w-full">
                <div className="mb-8 max-w-[1280px] mx-auto">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t.app_title}</h1>
                  <p className="mt-1.5 text-slate-600 dark:text-slate-500 dark:text-slate-400 text-sm font-medium">{t.form_subtitle}</p>
                </div>
                <ExpenseForm t={t} currentLang={lang} token={token} />
              </motion.div>
            ) : (
              <motion.div key="admin" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="w-full">
                {activeAdminTab === 'dashboard' ? (
                  <FinanceDashboard t={t} token={token} user={user} />
                ) : (
                  <RequestsList t={t} token={token} user={user} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {showToast && <Toast message={t.success} onClose={() => setShowToast(false)} />}
    </div>
  );
}

export default App;
