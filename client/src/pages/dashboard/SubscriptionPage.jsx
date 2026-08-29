import React, { useState, useEffect } from 'react';
import { Zap, Check, ShieldCheck, Sparkles, Building2, ExternalLink, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const SubscriptionPage = () => {
    const { token, user } = useAuth();
    const [settings, setSettings] = useState({
        pro_monthly_price: 1499,
        currency_symbol: '₹',
        free_cert_limit: 50,
        pro_cert_limit: 10000,
        enforce_tier_limits: false
    });
    const [usageCount, setUsageCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubscriptionDetails();
    }, [token]);

    const fetchSubscriptionDetails = async () => {
        setLoading(true);
        try {
            const [setRes, histRes] = await Promise.allSettled([
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/public-settings`),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/history`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (setRes.status === 'fulfilled') setSettings(prev => ({ ...prev, ...setRes.value.data }));
            if (histRes.status === 'fulfilled') {
                const total = (histRes.value.data || []).reduce((acc, curr) => acc + (curr.total_certificates || curr.total_sent || 1), 0);
                setUsageCount(total);
            }
        } catch (err) {
            console.error('Failed to fetch subscription status', err);
        } finally {
            setLoading(false);
        }
    };

    const isPro = user?.plan_type === 'pro';
    const monthlyLimit = isPro ? settings.pro_cert_limit : settings.free_cert_limit;
    const usagePercent = settings.enforce_tier_limits ? Math.min(Math.round((usageCount / monthlyLimit) * 100), 100) : 5;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
            {/* Header Title */}
            <div>
                <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">Subscription & Billing Management</h2>
                <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                    View active subscription plan details, certificate usage meters, and institutional feature entitlements.
                </p>
            </div>

            {/* Current Active Plan Status Card */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] p-8 border border-[var(--border-muted)] shadow-xl relative overflow-hidden space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ${isPro ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                            {isPro ? <Zap size={28} /> : <ShieldCheck size={28} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-black text-[var(--text-heading)]">
                                    {isPro ? 'Institutional PRO Tier' : 'Free Starter Tier'}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isPro ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-white/10 text-[var(--text-muted)]'}`}>
                                    {isPro ? 'Active Enterprise' : 'Active Account'}
                                </span>
                            </div>
                            <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">
                                {isPro ? 'Full access to custom branding, custom domains, & priority SMTP dispatch.' : 'Standard certificate generation & QR verification.'}
                            </p>
                        </div>
                    </div>

                    {!isPro && (
                        settings.enforce_tier_limits ? (
                            <a
                                href="/pricing"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center gap-2 shrink-0"
                            >
                                Upgrade to PRO <ArrowUpRight size={16} />
                            </a>
                        ) : (
                            <div className="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shrink-0">
                                <Sparkles size={16} /> All PRO Features Unlocked
                            </div>
                        )
                    )}
                </div>

                {/* Monthly Quota Progress Bar */}
                <div className="p-6 bg-white/5 rounded-2xl border border-[var(--border-muted)] space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[var(--text-main)]">Monthly Certificate Quota Meter</span>
                        <span className="text-rose-400 font-mono">
                            {!settings.enforce_tier_limits ? `${usageCount} Issued (UNLIMITED TESTING)` : `${usageCount} / ${monthlyLimit} Issued`}
                        </span>
                    </div>

                    <div className="w-full h-3 bg-[var(--bg-input)] rounded-full overflow-hidden border border-[var(--border-interactive)]">
                        <div
                            className="h-full bg-gradient-to-r from-rose-500 to-violet-500 rounded-full transition-all duration-500"
                            style={{ width: `${settings.enforce_tier_limits ? usagePercent : 15}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Plan Feature Comparison Checklist */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] p-8 border border-[var(--border-muted)] shadow-xl space-y-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-heading)]">
                    Active {isPro ? 'PRO Enterprise' : 'Free Starter'} Plan Entitlements
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(isPro ? (settings.pro_features || []) : (settings.free_features || [])).map((feat, idx) => (
                        <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-[var(--border-muted)] flex items-center gap-3">
                            <Check size={18} className={isPro ? "text-amber-400 shrink-0" : "text-emerald-400 shrink-0"} />
                            <span className="text-xs font-bold text-[var(--text-heading)]">{feat}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPage;
