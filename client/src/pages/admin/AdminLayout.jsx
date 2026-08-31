import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
    ShieldCheck, Users, ShieldAlert, LayoutDashboard, Sun, Moon, Monitor,
    LogOut, Menu, X, ChevronRight, Zap, CheckCircle2, FileText, Activity, Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/Pramanit logo.png';

const AdminLayout = ({ theme, setTheme }) => {
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [pendingVerifications, setPendingVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        proUsers: 0,
        totalCerts: 0,
        activeCorrections: 4
    });

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/dashboard', { replace: true });
            return;
        }
        fetchAllAdminData();
    }, [user, token, navigate]);

    const fetchAllAdminData = async () => {
        setLoading(true);
        try {
            const [usersRes, pendingRes] = await Promise.allSettled([
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/pending-verifications`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (usersRes.status === 'fulfilled' && usersRes.value.data) {
                const uList = usersRes.value.data;
                setUsers(uList);
                setStats({
                    totalUsers: uList.length,
                    proUsers: uList.filter(u => u.planType === 'pro').length,
                    totalCerts: uList.length * 15,
                    activeCorrections: 4
                });
            }

            if (pendingRes.status === 'fulfilled' && pendingRes.value.data) {
                setPendingVerifications(pendingRes.value.data);
            }
        } catch (err) {
            console.error('Failed to fetch admin data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAction = async (targetUserId, action, reason = '') => {
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/verify-user`, {
                targetUserId,
                action,
                rejectionReason: reason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`User verification ${action}d successfully.`);
            fetchAllAdminData();
        } catch (err) {
            console.error('Failed to verify user', err);
            toast.error('Action failed.');
        }
    };

    const handleTogglePlan = async (userId, currentPlan) => {
        const newPlan = currentPlan === 'free' ? 'pro' : 'free';
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/users/${userId}/toggle-plan`, {
                planType: newPlan
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, planType: newPlan } : u));
            toast.success(`User plan updated to ${newPlan.toUpperCase()}`);
        } catch (err) {
            console.error('Failed to toggle plan', err);
            toast.error('Failed to update plan.');
        }
    };

    // Close mobile drawer on route navigation
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const navSections = [
        {
            title: 'ADMINISTRATION & METRICS',
            items: [
                { path: '/admin', label: 'Admin Overview', icon: ShieldCheck, exact: true },
                { path: '/admin/users', label: 'User Directory', icon: Users },
                {
                    path: '/admin/verifications',
                    label: 'Identity Approvals',
                    icon: ShieldAlert,
                    badge: pendingVerifications.length > 0 ? pendingVerifications.length : null,
                    badgeColor: 'bg-amber-500'
                }
            ]
        },
        {
            title: 'GLOBAL GOVERNANCE',
            items: [
                { path: '/admin/credentials', label: 'Credential Audit', icon: FileText },
                { path: '/admin/security', label: 'Security Audit Logs', icon: Activity },
                { path: '/admin/settings', label: 'System Settings', icon: Settings }
            ]
        },
        {
            title: 'QUICK SWITCH',
            items: [
                { path: '/dashboard', label: 'Issuer Workspace', icon: LayoutDashboard }
            ]
        }
    ];

    const currentTitle =
        location.pathname === '/admin' ? 'Admin Overview' :
        location.pathname === '/admin/users' ? 'User Directory' :
        location.pathname === '/admin/verifications' ? 'Identity Approvals' :
        location.pathname === '/admin/credentials' ? 'Credential Audit' :
        location.pathname === '/admin/security' ? 'Security & Logs' :
        location.pathname === '/admin/settings' ? 'System Settings' : 'Admin Control Center';

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex transition-colors duration-500 font-sans selection:bg-rose-500/30">
            {/* MOBILE BACKDROP DRAWER */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-40 lg:hidden animate-in fade-in"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* SIDEBAR NAVIGATION */}
            <aside className={`
                fixed lg:sticky top-0 left-0 h-screen w-72 bg-[var(--bg-card)] border-r border-[var(--border-muted)]
                flex flex-col justify-between z-50 transition-transform duration-300 shadow-2xl lg:shadow-none
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div>
                    {/* Brand Header */}
                    <div className="p-6 border-b border-[var(--border-muted)] flex items-center justify-between">
                        <Link to="/admin" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-md border border-slate-200 group-hover:scale-105 transition-transform">
                                <img src={logo} alt="Pramanit Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="font-black text-lg text-[var(--text-heading)] leading-none tracking-tight">Pramanit</h1>
                                <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Admin Control</span>
                            </div>
                        </Link>
                        <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 text-[var(--text-muted)] hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)]">
                        {navSections.map((section, idx) => (
                            <div key={idx} className="space-y-2">
                                <h2 className="px-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                    {section.title}
                                </h2>
                                <div className="space-y-1">
                                    {section.items.map((item) => {
                                        const isActive = item.exact
                                            ? location.pathname === item.path
                                            : location.pathname.startsWith(item.path) && item.path !== '/admin';
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={`
                                                    w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-extrabold text-xs transition-all duration-300
                                                    ${isActive
                                                        ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-600/30'
                                                        : 'text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-white/5'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon size={18} className={isActive ? 'text-white' : 'text-rose-400'} />
                                                    <span>{item.label}</span>
                                                </div>
                                                {item.badge && (
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white ${item.badgeColor || 'bg-rose-500'}`}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Footer Account Card */}
                <div className="p-4 border-t border-[var(--border-muted)] bg-white/5">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-muted)]">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center font-black text-xs shrink-0">
                                AD
                            </div>
                            <div className="truncate">
                                <p className="text-xs font-black text-[var(--text-heading)] truncate">{user?.fullName || user?.email || 'Administrator'}</p>
                                <span className="text-[9px] font-black uppercase text-rose-400">Super Admin</span>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            title="Sign Out"
                            className="p-2 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 min-w-0 flex flex-col min-h-screen">
                {/* Header Navbar */}
                <header className="sticky top-0 z-30 bg-[var(--bg-card)]/80 backdrop-blur-xl border-b border-[var(--border-muted)] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl border border-[var(--border-muted)]"
                        >
                            <Menu size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                                <span>Admin Suite</span>
                                <ChevronRight size={10} />
                                <span className="text-rose-400">{currentTitle}</span>
                            </div>
                            <h1 className="text-xl font-black text-[var(--text-heading)] tracking-tight">
                                {currentTitle}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Theme Controller */}
                        <button
                            onClick={() => {
                                const modes = ['system', 'dark', 'light'];
                                const nextIndex = (modes.indexOf(theme) + 1) % modes.length;
                                setTheme(modes[nextIndex]);
                            }}
                            className="p-2.5 bg-[var(--bg-input)] border border-[var(--border-muted)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors flex items-center gap-2 text-xs font-bold"
                            title={`Theme: ${theme}`}
                        >
                            {theme === 'light' && <Sun size={16} className="text-amber-500" />}
                            {theme === 'dark' && <Moon size={16} className="text-violet-400" />}
                            {theme === 'system' && <Monitor size={16} className="text-blue-400" />}
                            <span className="capitalize text-xs font-bold hidden sm:inline">{theme}</span>
                        </button>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <LayoutDashboard size={14} /> Issuer Workspace
                        </button>
                    </div>
                </header>

                {/* Page View Body */}
                <div className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto space-y-8">
                    <Outlet context={{
                        users,
                        pendingVerifications,
                        stats,
                        loading,
                        handleTogglePlan,
                        handleVerifyAction,
                        refetch: fetchAllAdminData
                    }} />
                </div>
            </main>
            <Toaster position="top-right" toastOptions={{ style: { background: '#0f172a', color: '#fff', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '1rem', fontWeight: 700 } }} />
        </div>
    );
};

export default AdminLayout;
