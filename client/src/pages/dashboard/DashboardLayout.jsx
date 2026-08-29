import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, LayoutTemplate, Mail, History, Edit3,
    MessageSquare, Settings, Globe, LogOut, ChevronLeft, ChevronRight,
    Menu, X, Sparkles, Zap, Shield, Award, Moon, Sun, Monitor, UserCheck, CreditCard
} from 'lucide-react';
import axios from 'axios';
import logo from '../../assets/Pramanit logo.png';

const DashboardLayout = ({ theme, setTheme }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, token } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Shared State across Dashboard pages
    const [designs, setDesigns] = useState([]);
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [history, setHistory] = useState([]);
    const [corrections, setCorrections] = useState([]);
    const [contactMessages, setContactMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        orgName: user?.orgName || '',
        orgLogoUrl: user?.orgLogo || '',
        fullName: user?.fullName || '',
        designation: user?.designation || '',
        certPrefix: 'CERT',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        defaultHashtags: '#Pramanit #Certified #Professional',
        allowSharing: true
    });

    const fetchAllDashboardData = async () => {
        setLoading(true);
        try {
            const [designsRes, templatesRes, historyRes, correctionsRes, messagesRes, profileRes] = await Promise.allSettled([
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/designs`),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/email-templates`),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/history`),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/corrections`),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/contact/messages`),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`)
            ]);

            if (designsRes.status === 'fulfilled') setDesigns(designsRes.value.data || []);
            if (templatesRes.status === 'fulfilled') setEmailTemplates(templatesRes.value.data || []);
            if (historyRes.status === 'fulfilled') setHistory(historyRes.value.data || []);
            if (correctionsRes.status === 'fulfilled') setCorrections(correctionsRes.value.data || []);
            if (messagesRes.status === 'fulfilled') setContactMessages(messagesRes.value.data?.messages || []);
            if (profileRes.status === 'fulfilled' && profileRes.value.data) {
                const data = profileRes.value.data;
                setSettings(prev => ({
                    ...prev,
                    orgName: data.org_name || prev.orgName,
                    orgLogoUrl: data.org_logo_url || prev.orgLogoUrl,
                    fullName: data.full_name || prev.fullName,
                    designation: data.designation || prev.designation,
                    certPrefix: data.cert_prefix || 'CERT',
                    smtpHost: data.smtp_host || '',
                    smtpPort: data.smtp_port || 587,
                    smtpUser: data.smtp_user || '',
                    defaultHashtags: data.social_settings?.default_hashtags || '#Pramanit #Certified',
                    allowSharing: data.social_settings?.allow_sharing ?? true
                }));
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchAllDashboardData();
        }
    }, [token]);

    // Close mobile drawer on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const navSections = [
        {
            title: 'STUDIO & ANALYTICS',
            items: [
                { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
                { path: '/dashboard/generate', label: 'Issue Certificates', icon: Zap },
                { path: '/dashboard/designs', label: 'Certificate Designs', icon: LayoutTemplate },
                { path: '/dashboard/email-templates', label: 'Email Templates', icon: Mail }
            ]
        },
        {
            title: 'RECORDS & INBOX',
            items: [
                { path: '/dashboard/history', label: 'Issuance History', icon: History },
                { path: '/dashboard/corrections', label: 'Name Corrections', icon: Edit3, badge: corrections.length > 0 ? corrections.length : null, badgeColor: 'bg-amber-500' },
                { path: '/dashboard/inquiries', label: 'Inquiries Inbox', icon: MessageSquare, badge: contactMessages.length > 0 ? contactMessages.length : null, badgeColor: 'bg-violet-600' }
            ]
        },
        {
            title: 'SYSTEM & INTEGRATIONS',
            items: [
                { path: '/dashboard/subscription', label: 'Subscription & Plan', icon: CreditCard },
                { path: '/dashboard/settings', label: 'Branding & Settings', icon: Settings },
                { path: '/dashboard/developer', label: 'Developer API', icon: Globe }
            ]
        }
    ];

    if (user?.role === 'admin') {
        navSections.push({
            title: 'ADMINISTRATION',
            items: [
                { path: '/admin', label: 'Admin Control Center', icon: Shield, badge: 'ADMIN', badgeColor: 'bg-rose-600' }
            ]
        });
    }

    const contextValue = {
        designs, setDesigns,
        emailTemplates, setEmailTemplates,
        history, setHistory,
        corrections, setCorrections,
        contactMessages, setContactMessages,
        settings, setSettings,
        loading,
        refetch: fetchAllDashboardData
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex font-sans selection:bg-violet-500/30">
            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex flex-col h-screen sticky top-0 border-r border-[var(--border-muted)] bg-[var(--bg-card)] transition-all duration-300 z-30 shrink-0 ${collapsed ? 'w-20' : 'w-64'}`}>
                {/* Sidebar Header */}
                <div className="p-6 flex items-center justify-between border-b border-[var(--border-muted)]">
                    {!collapsed && (
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-violet-500/10 transform -rotate-3">
                                <img src={logo} alt="Pramanit Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <span className="text-xl font-black tracking-tight text-[var(--text-heading)]">Pramanit</span>
                                <span className="block text-[9px] font-black text-violet-400 uppercase tracking-widest">Issuer Control</span>
                            </div>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg mx-auto cursor-pointer" onClick={() => navigate('/dashboard')}>
                            <img src={logo} alt="Pramanit Logo" className="w-full h-full object-contain" />
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 hover:bg-white/5 text-[var(--text-muted)] hover:text-white rounded-xl transition-colors hidden md:block"
                        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Sidebar Navigation */}
                <div className="flex-1 py-6 px-3 overflow-y-auto space-y-6 custom-scrollbar">
                    {navSections.map((sec, idx) => (
                        <div key={idx}>
                            {!collapsed && (
                                <p className="px-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
                                    {sec.title}
                                </p>
                            )}
                            <div className="space-y-1">
                                {sec.items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            end={item.exact}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-3 py-3 rounded-2xl text-xs font-bold transition-all group ${
                                                    isActive
                                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                                                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
                                                }`
                                            }
                                        >
                                            <Icon size={18} className="shrink-0 group-hover:scale-110 transition-transform" />
                                            {!collapsed && <span className="truncate">{item.label}</span>}
                                            {!collapsed && item.badge && (
                                                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black text-white ${item.badgeColor || 'bg-violet-600'}`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sidebar User Footer */}
                <div className="p-4 border-t border-[var(--border-muted)]">
                    {!collapsed ? (
                        <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] rounded-2xl flex items-center justify-between">
                            <div className="max-w-[130px]">
                                <p className="text-xs font-black text-[var(--text-heading)] truncate">{user?.orgName || user?.fullName || 'Issuer Account'}</p>
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Verified
                                </p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 rounded-xl transition-colors"
                                title="Sign Out"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={logout}
                            className="w-10 h-10 mx-auto flex items-center justify-center text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                            title="Sign Out"
                        >
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </aside>

            {/* Mobile Sidebar Overlay Drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)}>
                    <div className="w-72 bg-[var(--bg-card)] h-full p-6 flex flex-col space-y-6 animate-in slide-in-from-left duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-6 border-b border-[var(--border-muted)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg">
                                    <img src={logo} alt="Pramanit Logo" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-xl font-black text-[var(--text-heading)]">Pramanit</span>
                            </div>
                            <button onClick={() => setMobileOpen(false)} className="text-[var(--text-muted)] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6">
                            {navSections.map((sec, idx) => (
                                <div key={idx}>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">{sec.title}</p>
                                    <div className="space-y-1">
                                        {sec.items.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <NavLink
                                                    key={item.path}
                                                    to={item.path}
                                                    end={item.exact}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 px-3 py-3 rounded-2xl text-xs font-bold transition-all ${
                                                            isActive ? 'bg-violet-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-white/5'
                                                        }`
                                                    }
                                                >
                                                    <Icon size={18} />
                                                    <span>{item.label}</span>
                                                    {item.badge && (
                                                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black text-white ${item.badgeColor || 'bg-violet-600'}`}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={logout} className="p-3 bg-rose-500/10 text-rose-400 font-bold text-xs rounded-2xl flex items-center justify-center gap-2">
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Dashboard Top Header */}
                <header className="h-20 border-b border-[var(--border-muted)] bg-[var(--bg-card)]/80 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 text-[var(--text-muted)] hover:text-white rounded-xl">
                            <Menu size={22} />
                        </button>
                        <div>
                            <h1 className="text-lg md:text-xl font-black text-[var(--text-heading)] tracking-tight">
                                Issuer Control Dashboard
                            </h1>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider hidden sm:block">
                                Verifiable Credential Operations & Email Studio
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                                title="Admin Control Center"
                            >
                                <Shield size={14} className="text-rose-500" />
                                <span className="hidden sm:inline">Admin Panel</span>
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/dashboard/generate')}
                            className="px-3.5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-violet-600/30 transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                        >
                            <Zap size={14} />
                            <span className="hidden lg:inline">Bulk Issue</span>
                        </button>
                        <button
                            onClick={() => {
                                const modes = ['system', 'dark', 'light'];
                                const nextIndex = (modes.indexOf(theme) + 1) % modes.length;
                                setTheme(modes[nextIndex]);
                            }}
                            className="p-2.5 bg-[var(--bg-input)] border border-[var(--border-muted)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors flex items-center gap-2 text-xs font-bold"
                            title={`Theme: ${theme === 'system' ? 'Device (Default)' : theme === 'dark' ? 'Dark' : 'Light'}`}
                        >
                            {theme === 'light' && <Sun size={18} className="text-amber-500" />}
                            {theme === 'dark' && <Moon size={18} className="text-violet-400" />}
                            {theme === 'system' && <Monitor size={18} className="text-blue-400" />}
                            <span className="hidden sm:inline capitalize">
                                {theme === 'system' ? 'Device' : theme}
                            </span>
                        </button>
                    </div>
                </header>

                {/* Sub-page Outlet */}
                <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
                    <Outlet context={contextValue} />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
