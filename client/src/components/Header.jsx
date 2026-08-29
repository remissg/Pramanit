import React from 'react';
import { ArrowRight, Sun, Moon, Monitor, LogOut, LayoutDashboard, ShieldCheck, CheckCircle2, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/Pramanit logo.png';

const Header = ({ theme, setTheme }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const toggleTheme = () => {
        const modes = ['light', 'dark', 'system'];
        const nextIndex = (modes.indexOf(theme) + 1) % modes.length;
        setTheme(modes[nextIndex]);
    };

    const ThemeIcon = () => {
        if (theme === 'light') return <Sun size={18} />;
        if (theme === 'dark') return <Moon size={18} />;
        return <Monitor size={18} />;
    };

    return (
        <header className="sticky top-0 left-0 right-0 z-[100] bg-[var(--bg-main)]/90 backdrop-blur-xl border-b border-[var(--border-muted)] px-6 py-4 transition-all duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Brand Logo & Title */}
                <div className="flex items-center gap-3 group cursor-pointer shrink-0" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform duration-300 border border-[var(--border-muted)]">
                        <img src={logo} alt="Pramanit Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-rose-500 via-violet-500 to-indigo-500 bg-clip-text text-transparent whitespace-nowrap">
                        Pramanit
                    </span>
                </div>

                {/* Public Header Navigation Links */}
                <nav className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <button
                        onClick={() => navigate('/pricing')}
                        className={`hover:text-rose-400 transition-colors ${location.pathname === '/pricing' ? 'text-rose-500 font-black' : ''}`}
                    >
                        Pricing Plans
                    </button>
                    <button
                        onClick={() => navigate('/verify/HUB')}
                        className="hover:text-rose-400 transition-colors flex items-center gap-1.5"
                    >
                        <ShieldCheck size={14} className="text-emerald-400" /> Verify Badge
                    </button>
                    <button
                        onClick={() => navigate('/portal')}
                        className="hover:text-rose-400 transition-colors"
                    >
                        Recipient Portal
                    </button>
                    <button
                        onClick={() => navigate('/about')}
                        className="hover:text-rose-400 transition-colors"
                    >
                        About Us
                    </button>
                </nav>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="w-10 h-10 bg-[var(--bg-card)] rounded-xl border border-[var(--border-muted)] flex items-center justify-center text-[var(--text-muted)] hover:text-rose-400 transition-all shrink-0 shadow-sm"
                        title={`Current: ${theme}`}
                    >
                        <ThemeIcon />
                    </button>

                    {user ? (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="group flex items-center gap-2 bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 whitespace-nowrap"
                        >
                            <LayoutDashboard size={16} />
                            Go to Dashboard
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="group flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 whitespace-nowrap"
                        >
                            Log In
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
