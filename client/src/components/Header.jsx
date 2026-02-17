import React, { useState } from 'react';
import { ArrowRight, Sun, Moon, Monitor, LogOut, User, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/CertiFlow logo (1).png';

const Header = ({ onGetStarted, theme, setTheme }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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
        <header className="fixed top-0 left-0 right-0 z-[100] glass px-6 py-4 transition-all duration-500">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3 group cursor-pointer shrink-0" onClick={() => navigate(user ? '/dashboard' : '/')}>
                    <div className="w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center p-1.5 group-hover:scale-110 transition-transform duration-300">
                        <img src={logo} alt="CertiFlow Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-[var(--text-main)] transition-colors whitespace-nowrap">Certi<span className="text-violet-500">Flow</span></span>
                </div>

                <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-[var(--text-muted)]">
                    {!user ? (
                        <>
                            <a href="#features" className="hover:text-[var(--text-main)] transition-colors">Features</a>
                            <a href="#how-it-works" className="hover:text-[var(--text-main)] transition-colors">How it Works</a>
                            <a href="#templates" className="hover:text-[var(--text-main)] transition-colors">Templates</a>
                        </>
                    ) : (
                        <>
                            <button onClick={() => navigate('/dashboard')} className="hover:text-[var(--text-main)] transition-colors">Dashboard</button>
                            <button onClick={() => navigate('/generate')} className="hover:text-[var(--text-main)] transition-colors">Certificate Generator</button>
                            {user?.role === 'admin' && (
                                <button onClick={() => navigate('/admin')} className="text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1.5">
                                    <ShieldCheck size={16} />
                                    Admin Panel
                                </button>
                            )}
                        </>
                    )}
                </nav>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="w-10 h-10 glass rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-violet-400 hover:scale-110 transition-all shrink-0"
                        title={`Current: ${theme}`}
                    >
                        <ThemeIcon />
                    </button>

                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex flex-col items-end mr-2">
                                <span className="text-xs font-bold text-[var(--text-heading)]">{user.orgName || 'User'}</span>
                                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{user.role || 'Member'}</span>
                            </div>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-10 h-10 glass rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-violet-400 hover:scale-110 transition-all shrink-0"
                                title="My Dashboard"
                            >
                                <LayoutDashboard size={18} />
                            </button>
                            <button
                                onClick={logout}
                                className="w-10 h-10 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95"
                                title="Log Out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="group flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-black px-5 py-2.5 rounded-xl shadow-lg shadow-violet-500/20 transition-all active:scale-95 whitespace-nowrap"
                        >
                            Log In
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </header >
    );
};

export default Header;
