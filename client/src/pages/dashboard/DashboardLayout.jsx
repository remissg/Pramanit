import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, LayoutTemplate, Mail, History, Edit3,
    MessageSquare, Settings, Globe, LogOut, ChevronLeft, ChevronRight,
    Menu, X, Sparkles, Zap, Shield, Award, Moon, Sun, Monitor, UserCheck, CreditCard,
    MoreHorizontal
} from 'lucide-react';
import axios from 'axios';
import logo from '../../assets/Pramanit logo.png';

const DashboardLayout = ({ theme, setTheme }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, token } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

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
        smtpPass: '',
        defaultHashtags: '#Pramanit #Certified #Professional',
        allowSharing: true,
        // Verification identity fields (loaded from profile)
        issuerType: 'institution',
        institutionName: '',
        institutionWebsite: '',
        facultyEmail: '',
        institutionIdNumber: '',
        officialIdUrl: '',
        verificationStatus: user?.verification_status || '',
        rejectionReason: '',
        verifiedAt: null,
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
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
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
                    orgName: data.org_name || data.orgName || prev.orgName,
                    orgLogoUrl: data.org_logo_url || data.orgLogo || prev.orgLogoUrl,
                    fullName: data.full_name || data.fullName || prev.fullName,
                    designation: data.designation || prev.designation,
                    certPrefix: data.cert_prefix || 'CERT',
                    smtpHost: data.smtp_host || '',
                    smtpPort: data.smtp_port || 587,
                    smtpUser: data.smtp_user || '',
                    smtpPass: '',  // Never pre-fill password from server for security
                    defaultHashtags: data.social_settings?.default_hashtags || '#Pramanit #Certified',
                    allowSharing: data.social_settings?.allow_sharing ?? true,
                    // Verification identity fields
                    issuerType: data.issuer_type || 'institution',
                    institutionName: data.institution_name || '',
                    institutionWebsite: data.institution_website || '',
                    facultyEmail: data.faculty_email || '',
                    institutionIdNumber: data.institution_id_number || '',
                    officialIdUrl: data.official_id_url || '',
                    verificationStatus: data.verification_status || '',
                    rejectionReason: data.rejection_reason || '',
                    verifiedAt: data.verified_at || null,
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
            {/* Desktop Sidebar (Ultra Premium Glassmorphism) */}
            <aside className={`hidden md:flex flex-col h-screen sticky top-0 border-r border-[var(--border-muted)] bg-[var(--bg-card)] backdrop-blur-2xl transition-all duration-300 z-30 shrink-0 ${collapsed ? 'w-20' : 'w-64'}`}>
                {/* Ambient Radial Background Glow */}
                <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-violet-600/10 via-rose-500/5 to-transparent pointer-events-none" />

                {/* Sidebar Header */}
                <div className="p-5 flex items-center justify-between border-b border-[var(--border-muted)] relative z-10">
                    {!collapsed && (
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
                            <div className="w-10 h-10 bg-white/95 rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-all transform -rotate-3">
                                <img src={logo} alt="Pramanit Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <span className="text-xl font-black tracking-tight text-[var(--text-heading)] block leading-none">Pramanit</span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[8px] font-black uppercase tracking-widest mt-1 shadow-sm">
                                    <Sparkles size={10} className="text-emerald-400 animate-pulse" /> v2.0 Enterprise
                                </span>
                            </div>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-10 h-10 bg-white/95 rounded-xl flex items-center justify-center p-1.5 shadow-lg mx-auto cursor-pointer hover:scale-105 transition-all" onClick={() => navigate('/dashboard')}>
                            <img src={logo} alt="Pramanit Logo" className="w-full h-full object-contain" />
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 hover:bg-white/10 text-[var(--text-muted)] hover:text-white rounded-xl transition-colors hidden md:block"
                        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Sidebar Navigation */}
                <div className="flex-1 py-6 px-3 overflow-y-auto space-y-6 custom-scrollbar relative z-10">
                    {navSections.map((sec, idx) => (
                        <div key={idx}>
                            {!collapsed && (
                                <p className="px-3 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2.5 opacity-70">
                                    {sec.title}
                                </p>
                            )}
                            <div className="space-y-1.5">
                                {sec.items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            end={item.exact}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all group relative ${
                                                    isActive
                                                        ? 'bg-gradient-to-r from-rose-600 via-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 font-black'
                                                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 border border-transparent hover:border-white/10'
                                                }`
                                            }
                                        >
                                            <Icon size={18} className="shrink-0 group-hover:scale-110 transition-transform" />
                                            {!collapsed && <span className="truncate">{item.label}</span>}
                                            {!collapsed && item.badge && (
                                                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black text-white shadow-sm ${item.badgeColor || 'bg-violet-600'}`}>
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

                {/* Sidebar User Sentinel Footer */}
                <div className="p-4 border-t border-[var(--border-muted)] relative z-10">
                    {!collapsed ? (
                        <div className="p-3.5 bg-[var(--bg-input)] border border-[var(--border-muted)] rounded-2xl flex items-center justify-between shadow-lg">
                            <div className="max-w-[130px]">
                                <p className="text-xs font-black text-[var(--text-heading)] truncate">{user?.fullName || 'Issuer'}</p>
                                <p className="text-[10px] text-[var(--text-muted)] truncate">{user?.orgName || 'Organization'}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
                                title="Sign Out"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={logout}
                            className="p-3 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors mx-auto block"
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
                <header className="h-20 pt-safe border-b border-[var(--border-muted)] bg-[var(--bg-card)]/80 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 text-[var(--text-muted)] hover:text-white rounded-xl">
                            <Menu size={22} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg md:text-xl font-black text-[var(--text-heading)] tracking-tight">
                                    Issuer Control Dashboard
                                </h1>
                                <span className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                    <Sparkles size={11} className="text-emerald-400 animate-pulse" /> v2.0 Production Grade
                                </span>
                            </div>
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
                <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-safe-content md:!pb-8">
                    <Outlet context={contextValue} />
                </main>
            </div>

            {/* Mobile Bottom Navigation Sheet overlay */}
            {mobileMoreOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
                    onClick={() => setMobileMoreOpen(false)}
                >
                    <div
                        className="fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-muted)] rounded-t-[2.5rem] p-6 space-y-5 animate-in slide-in-from-bottom duration-300 shadow-2xl max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-1.5 bg-[var(--border-muted)] rounded-full mx-auto" />
                        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-muted)]">
                            <h3 className="text-base font-black text-[var(--text-heading)] tracking-tight">
                                Workspace & Studio Menu
                            </h3>
                            <button
                                onClick={() => setMobileMoreOpen(false)}
                                className="p-1.5 text-[var(--text-muted)] hover:text-white rounded-xl bg-white/5"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <button
                                onClick={() => { navigate('/dashboard/email-templates'); setMobileMoreOpen(false); }}
                                className="p-3.5 bg-[var(--bg-input)] border border-[var(--border-muted)] hover:border-violet-500/30 rounded-2xl flex flex-col items-start gap-2 transition-all active:scale-95"
                            >
                                <div className="p-2 bg-violet-600/15 rounded-xl text-violet-400">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-[var(--text-heading)]">Email Templates</p>
                                    <p className="text-[10px] text-[var(--text-muted)] font-medium">Manage SMTP Layouts</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { navigate('/dashboard/corrections'); setMobileMoreOpen(false); }}
                                className="p-3.5 bg-[var(--bg-input)] border border-[var(--border-muted)] hover:border-violet-500/30 rounded-2xl flex flex-col items-start gap-2 transition-all active:scale-95 relative"
                            >
                                {corrections.filter(c => c.status === 'pending').length > 0 && (
                                    <span className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500 text-slate-950 font-black rounded-full text-[9px]">
                                        {corrections.filter(c => c.status === 'pending').length}
                                    </span>
                                )}
                                <div className="p-2 bg-amber-500/15 rounded-xl text-amber-400">
                                    <Edit3 size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-[var(--text-heading)]">Name Corrections</p>
                                    <p className="text-[10px] text-[var(--text-muted)] font-medium">Pending Requests</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { navigate('/dashboard/inquiries'); setMobileMoreOpen(false); }}
                                className="p-3.5 bg-[var(--bg-input)] border border-[var(--border-muted)] hover:border-violet-500/30 rounded-2xl flex flex-col items-start gap-2 transition-all active:scale-95 relative"
                            >
                                {contactMessages.filter(m => m.status === 'pending').length > 0 && (
                                    <span className="absolute top-3 right-3 px-2 py-0.5 bg-rose-500 text-white font-black rounded-full text-[9px]">
                                        {contactMessages.filter(m => m.status === 'pending').length}
                                    </span>
                                )}
                                <div className="p-2 bg-rose-500/15 rounded-xl text-rose-400">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-[var(--text-heading)]">Support Inquiries</p>
                                    <p className="text-[10px] text-[var(--text-muted)] font-medium">Recipient Support</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { navigate('/dashboard/settings'); setMobileMoreOpen(false); }}
                                className="p-3.5 bg-[var(--bg-input)] border border-[var(--border-muted)] hover:border-violet-500/30 rounded-2xl flex flex-col items-start gap-2 transition-all active:scale-95"
                            >
                                <div className="p-2 bg-indigo-500/15 rounded-xl text-indigo-400">
                                    <Settings size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-[var(--text-heading)]">Issuer Settings</p>
                                    <p className="text-[10px] text-[var(--text-muted)] font-medium">SMTP & Branding</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { navigate('/dashboard/developer'); setMobileMoreOpen(false); }}
                                className="p-3.5 bg-[var(--bg-input)] border border-[var(--border-muted)] hover:border-violet-500/30 rounded-2xl flex flex-col items-start gap-2 transition-all active:scale-95"
                            >
                                <div className="p-2 bg-cyan-500/15 rounded-xl text-cyan-400">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-[var(--text-heading)]">Developer API</p>
                                    <p className="text-[10px] text-[var(--text-muted)] font-medium">Keys & Webhooks</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { navigate('/dashboard/subscription'); setMobileMoreOpen(false); }}
                                className="p-3.5 bg-[var(--bg-input)] border border-[var(--border-muted)] hover:border-violet-500/30 rounded-2xl flex flex-col items-start gap-2 transition-all active:scale-95"
                            >
                                <div className="p-2 bg-emerald-500/15 rounded-xl text-emerald-400">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-[var(--text-heading)]">Subscription</p>
                                    <p className="text-[10px] text-[var(--text-muted)] font-medium">Tier & Usage</p>
                                </div>
                            </button>
                        </div>

                        {user?.role === 'admin' && (
                            <button
                                onClick={() => { navigate('/admin'); setMobileMoreOpen(false); }}
                                className="w-full p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Shield size={16} /> Admin Control Center
                            </button>
                        )}

                        <button
                            onClick={() => { logout(); setMobileMoreOpen(false); }}
                            className="w-full p-3.5 bg-white/5 border border-white/10 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                        >
                            <LogOut size={16} /> Sign Out Account
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation Bar (Fixed Native iOS/Android Safe Area Style) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)] backdrop-blur-xl border-t border-[var(--border-muted)] px-3 pt-1.5 pb-safe-nav flex items-center justify-around shadow-md">
                <NavLink
                    to="/dashboard"
                    end
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-black transition-all ${
                            isActive ? 'text-violet-400 scale-105' : 'text-[var(--text-muted)] hover:text-white'
                        }`
                    }
                >
                    <LayoutDashboard size={20} />
                    <span>Overview</span>
                </NavLink>

                <NavLink
                    to="/dashboard/designs"
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-black transition-all ${
                            isActive ? 'text-violet-400 scale-105' : 'text-[var(--text-muted)] hover:text-white'
                        }`
                    }
                >
                    <LayoutTemplate size={20} />
                    <span>Designs</span>
                </NavLink>

                {/* Featured Glowing Action Button (Generate) */}
                <button
                    onClick={() => navigate('/dashboard/generate')}
                    className={`flex flex-col items-center justify-center -mt-5 w-13 h-13 rounded-full bg-gradient-to-r from-rose-600 via-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-600/50 border-2 border-[var(--bg-main)] transform active:scale-95 transition-all ${
                        location.pathname === '/dashboard/generate' ? 'ring-4 ring-violet-500/40 scale-110' : ''
                    }`}
                    title="Bulk Certificate Issuance Wizard"
                >
                    <Zap size={22} className="fill-white" />
                </button>

                <NavLink
                    to="/dashboard/history"
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-black transition-all ${
                            isActive ? 'text-violet-400 scale-105' : 'text-[var(--text-muted)] hover:text-white'
                        }`
                    }
                >
                    <History size={20} />
                    <span>History</span>
                </NavLink>

                <NavLink
                    to="/dashboard/settings"
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-black transition-all relative ${
                            isActive ? 'text-violet-400 scale-105' : 'text-[var(--text-muted)] hover:text-white'
                        }`
                    }
                >
                    <Settings size={20} />
                    <span>Settings</span>
                </NavLink>
            </div>
        </div>
    );
};

export default DashboardLayout;
