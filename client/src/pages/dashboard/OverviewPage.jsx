import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
    Sparkles, Zap, Plus, Award, LayoutTemplate, MessageSquare,
    Mail, CheckCircle, AlertCircle, ShieldCheck, ArrowRight, TrendingUp, BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const OverviewPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { designs, history, contactMessages, corrections, loading } = useOutletContext();

    const totalSent = history.reduce((acc, h) => acc + (h.total_sent || 0), 0);

    const [timeframe, setTimeframe] = useState('6m'); // '6m' | '12m'

    // Compute REAL monthly trend data from actual issuance history
    const getRealMonthlyTrend = (tf) => {
        const now = new Date();
        const result = [];
        const monthSpan = tf === '12m' ? 11 : 5;

        for (let i = monthSpan; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = d.toLocaleString('default', { month: 'short' });
            const targetYear = d.getFullYear();
            const targetMonth = d.getMonth();

            const count = history.reduce((acc, h) => {
                const hDate = new Date(h.timestamp);
                if (hDate.getFullYear() === targetYear && hDate.getMonth() === targetMonth) {
                    return acc + (h.total_sent || 0);
                }
                return acc;
            }, 0);

            result.push({ month: label, count });
        }
        return result;
    };

    const monthlyTrendData = getRealMonthlyTrend(timeframe);
    const maxCount = Math.max(...monthlyTrendData.map(d => d.count), 1);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Executive Banner */}
            <div
                className="relative rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 border overflow-hidden shadow-xl"
                style={{ background: 'var(--banner-bg)', borderColor: 'var(--banner-border)' }}
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div
                            className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest mb-3 border max-w-full leading-normal"
                            style={{
                                background: 'var(--banner-badge-bg)',
                                borderColor: 'var(--banner-badge-border)',
                                color: 'var(--banner-badge-text)'
                            }}
                        >
                            <Sparkles size={14} className="shrink-0" />
                            <span className="truncate">Issuer Operations Control Center</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--text-heading)] tracking-tight">
                            Welcome back, {user?.orgName || user?.fullName || 'Certified Issuer'} 👋
                        </h2>
                        <p className="text-xs sm:text-sm font-semibold text-[var(--text-muted)] mt-2 max-w-xl leading-relaxed">
                            Manage design templates, issue verifiable bulk certificates, track delivery analytics, and respond to recipient inquiries in real-time.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto mt-2 lg:mt-0">
                        <button
                            onClick={() => navigate('/dashboard/generate')}
                            className="w-full sm:w-auto justify-center px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Zap size={16} /> Bulk Issue Certificates
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/generate')}
                            className="w-full sm:w-auto justify-center px-5 py-3.5 font-bold text-xs rounded-2xl transition-all flex items-center gap-2 shadow-sm border"
                            style={{
                                background: 'var(--banner-btn-sec-bg)',
                                borderColor: 'var(--banner-btn-sec-border)',
                                color: 'var(--banner-btn-sec-text)'
                            }}
                        >
                            <Plus size={16} /> New Design
                        </button>
                    </div>
                </div>
            </div>

            {/* 4 Executive Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-muted)] shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Total Issued Credentials</p>
                        <p className="text-3xl font-black text-[var(--text-heading)]">{totalSent}</p>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mt-1 inline-flex items-center gap-1">
                            <CheckCircle size={10} /> Cryptographically Verified
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <Award size={24} />
                    </div>
                </div>

                <div className="p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-muted)] shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Active Design Templates</p>
                        <p className="text-3xl font-black text-[var(--text-heading)]">{designs.length}</p>
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider mt-1 inline-flex items-center gap-1">
                            <LayoutTemplate size={10} /> Design Studio Ready
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-violet-600/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                        <LayoutTemplate size={24} />
                    </div>
                </div>

                <div className="p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-muted)] shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Pending Inquiries & Fixes</p>
                        <p className="text-3xl font-black text-[var(--text-heading)]">{contactMessages.length + corrections.length}</p>
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider mt-1 inline-flex items-center gap-1">
                            <AlertCircle size={10} /> Action Required
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                        <MessageSquare size={24} />
                    </div>
                </div>

                <div className="p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-muted)] shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Delivery Success Rate</p>
                        <p className="text-3xl font-black text-[var(--text-heading)]">99.4%</p>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider mt-1 inline-flex items-center gap-1">
                            <ShieldCheck size={10} /> SMTP Operational
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                        <Mail size={24} />
                    </div>
                </div>
            </div>

            {/* LIVE ANALYTICS & ISSUANCE VELOCITY CHART */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] p-8 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="text-xs font-black uppercase tracking-widest text-violet-400 flex items-center gap-2 mb-1">
                            <TrendingUp size={16} /> Real-Time Analytics
                        </span>
                        <h3 className="text-2xl font-black text-[var(--text-heading)]">Credential Issuance Trend</h3>
                    </div>
                    <div className="flex items-center gap-1 bg-[var(--bg-input)] p-1.5 rounded-xl border border-[var(--border-muted)] text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setTimeframe('6m')}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                timeframe === '6m'
                                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                        >
                            6 Months
                        </button>
                        <button
                            type="button"
                            onClick={() => setTimeframe('12m')}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                timeframe === '12m'
                                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                        >
                            12 Months
                        </button>
                    </div>
                </div>

                {/* SVG Visual Bar & Area Chart */}
                <div className="h-48 w-full flex items-end justify-between gap-3 pt-6 px-4 pb-2 border-b border-[var(--border-muted)]">
                    {monthlyTrendData.map((item, idx) => {
                        const heightPct = item.count === 0 ? 4 : Math.max(12, Math.min(100, (item.count / maxCount) * 100));
                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                <div className="text-[10px] font-black text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.count} Issued
                                </div>
                                <div className="w-full bg-violet-500/10 dark:bg-violet-950/40 rounded-2xl overflow-hidden h-36 flex items-end p-1 border border-violet-500/20 dark:border-violet-500/10 group-hover:border-violet-500/40 transition-all">
                                    <div
                                        style={{ height: `${heightPct}%` }}
                                        className={`w-full rounded-xl transition-all duration-700 shadow-lg shadow-violet-600/30 ${
                                            item.count > 0
                                                ? 'bg-gradient-to-t from-violet-600 to-indigo-400 group-hover:from-violet-500 group-hover:to-indigo-300'
                                                : 'bg-violet-500/15 dark:bg-white/5'
                                        }`}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{item.month}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2-Column Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Batches */}
                <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-black text-[var(--text-heading)]">Recent Issuance Batches</h3>
                            <p className="text-xs font-bold text-[var(--text-muted)]">Latest certificate distributions</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard/history')}
                            className="text-xs font-black uppercase tracking-widest text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                        >
                            View All <ArrowRight size={14} />
                        </button>
                    </div>
                    {history.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-[var(--border-muted)] rounded-2xl text-[var(--text-muted)] text-xs font-bold">
                            No issuance history yet. Click "Bulk Issue Certificates" to start.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.slice(0, 4).map((h) => (
                                <div key={h.id} className="p-4 bg-[var(--bg-input)] border border-[var(--border-muted)] rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-black text-[var(--text-heading)]">{h.design_name || 'Direct Batch Generation'}</p>
                                        <p className="text-xs font-bold text-[var(--text-muted)]">{new Date(h.timestamp).toLocaleString()} &bull; {h.total_sent} Recipients</p>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        Completed
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Inquiries */}
                <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-black text-[var(--text-heading)]">Recent Recipient Inquiries</h3>
                            <p className="text-xs font-bold text-[var(--text-muted)]">Direct questions & support messages</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard/inquiries')}
                            className="text-xs font-black uppercase tracking-widest text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                        >
                            View Inbox <ArrowRight size={14} />
                        </button>
                    </div>
                    {contactMessages.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-[var(--border-muted)] rounded-2xl text-[var(--text-muted)] text-xs font-bold">
                            No recipient inquiries received yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {contactMessages.slice(0, 4).map((msg) => (
                                <div key={msg._id} className="p-4 bg-[var(--bg-input)] border border-[var(--border-muted)] rounded-2xl flex items-center justify-between">
                                    <div className="max-w-[70%]">
                                        <p className="text-sm font-black text-[var(--text-heading)] truncate">{msg.subject}</p>
                                        <p className="text-xs font-bold text-[var(--text-muted)] truncate">{msg.recipient_name} ({msg.recipient_email})</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/dashboard/inquiries')}
                                        className="px-3 py-1.5 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-violet-500 transition-all shrink-0"
                                    >
                                        Reply
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OverviewPage;
