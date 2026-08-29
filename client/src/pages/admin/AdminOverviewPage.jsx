import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Users, Zap, TrendingUp, ShieldAlert, ShieldCheck, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

const AdminOverviewPage = () => {
    const { stats, pendingVerifications, users, loading } = useOutletContext();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Executive Hero Banner */}
            <div
                className="relative rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 border overflow-hidden shadow-xl"
                style={{ background: 'var(--banner-bg)', borderColor: 'var(--banner-border)' }}
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10 space-y-3">
                    <div
                        className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest mb-2 border leading-normal"
                        style={{
                            background: 'rgba(244, 63, 94, 0.12)',
                            borderColor: 'rgba(244, 63, 94, 0.25)',
                            color: '#fb7185'
                        }}
                    >
                        <ShieldCheck size={14} className="shrink-0" />
                        <span>System Administration Suite</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--text-heading)] tracking-tight">
                        Admin Command Center 👋
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-[var(--text-muted)] max-w-xl leading-relaxed">
                        Monitor overall system usage, manage institution authority approvals, track pro subscriptions, and ensure compliance.
                    </p>
                </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Issuers', value: stats.totalUsers, icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                    { label: 'Pro Subscriptions', value: stats.proUsers, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Certs Generated', value: stats.totalCerts, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Pending Reviews', value: pendingVerifications.length, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10' }
                ].map((stat, i) => (
                    <div key={i} className="p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-muted)] shadow-xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-[var(--text-heading)]">{stat.value}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center border border-[var(--border-muted)]`}>
                            <stat.icon className={stat.color} size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Action Alert for Pending Approvals */}
            {pendingVerifications.length > 0 ? (
                <div className="p-6 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 rounded-[2rem] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl shrink-0">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-[var(--text-heading)]">
                                {pendingVerifications.length} Identity Verification {pendingVerifications.length === 1 ? 'Request' : 'Requests'} Pending
                            </h3>
                            <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                                Institutional identity documents have been submitted and are awaiting admin review.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/admin/verifications')}
                        className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 active:scale-95"
                    >
                        <span>Review Approvals</span>
                        <ArrowRight size={14} />
                    </button>
                </div>
            ) : (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
                    <div>
                        <h3 className="text-sm font-black text-[var(--text-heading)]">All Identity Verifications Complete</h3>
                        <p className="text-xs font-medium text-[var(--text-muted)]">There are no pending identity documents requiring administrative approval.</p>
                    </div>
                </div>
            )}

            {/* Recent Issuer Directory Snippet */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] p-6 md:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-[var(--text-heading)] tracking-tight">Recent Registered Issuers</h3>
                        <p className="text-xs font-semibold text-[var(--text-muted)]">Overview of registered accounts and subscription status.</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-extrabold rounded-xl border border-[var(--border-muted)] transition-all flex items-center gap-1.5"
                    >
                        <span>View Full Directory</span>
                        <ArrowRight size={12} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.slice(0, 6).map((u) => (
                        <div key={u.id} className="p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-muted)] flex items-center gap-3">
                            <div className={`w-10 h-10 ${u.planType === 'pro' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-400'} rounded-xl flex items-center justify-center font-black text-sm border border-[var(--border-muted)] shrink-0`}>
                                {u.email[0].toUpperCase()}
                            </div>
                            <div className="truncate flex-1">
                                <p className="font-black text-xs text-[var(--text-heading)] truncate">{u.email}</p>
                                <span className="text-[10px] font-bold text-[var(--text-muted)] block truncate">{u.orgName || 'No Org Name'}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${u.planType === 'pro' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-[var(--text-muted)]'}`}>
                                {u.planType}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminOverviewPage;
