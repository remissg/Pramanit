import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Sparkles, Building2, Rocket, Clock, Bell, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from 'axios';

const PricingPage = ({ theme, setTheme }) => {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [settings, setSettings] = useState({
        pro_monthly_price: 1499,
        pro_annual_price: 14990,
        currency_symbol: '₹',
        free_cert_limit: 50,
        pro_cert_limit: 10000,
        enforce_tier_limits: false,
        free_features: [
            '50 Certificates / Month',
            'Standard QR Verification Badge',
            'CSV Bulk Certificate Issue',
            'Basic Email Templates'
        ],
        pro_features: [
            '10,000 Certificates / Month',
            'Custom Institutional Logo & Watermarks',
            'Custom Subdomain & QR Branding',
            'Dedicated Custom SMTP Email Relay',
            'Batch ZIP Download & Analytics',
            '24/7 Priority Support & SLA'
        ]
    });

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/public-settings`);
                if (res.data) setSettings(prev => ({ ...prev, ...res.data }));
            } catch (err) {
                console.error('Failed to fetch public pricing settings', err);
            }
        };
        fetchPricing();
    }, []);

    const currency = settings.currency_symbol || '₹';
    const monthlyRate = settings.pro_monthly_price || 1499;
    const annualMonthlyRate = Math.round((settings.pro_annual_price || 14990) / 12);
    const isLimitsEnforced = settings.enforce_tier_limits;

    const handleNotifyMe = (e) => {
        e.preventDefault();
        if (email.trim()) {
            setSubscribed(true);
            setTimeout(() => setSubscribed(false), 5000);
            setEmail('');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300 flex flex-col">
            <Header theme={theme} setTheme={setTheme} />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-16">
                {/* Hero Header */}
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    {!isLimitsEnforced ? (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-violet-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest animate-pulse shadow-sm">
                            <Rocket size={14} /> Institutional PRO Tier — Coming Soon
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-widest">
                            <Sparkles size={14} /> Flexible Institutional Plans
                        </div>
                    )}

                    <h1 className="text-4xl sm:text-5xl font-black text-[var(--text-heading)] tracking-tight">
                        Simple, Predictable Credential Pricing
                    </h1>
                    <p className="text-sm sm:text-base font-medium text-[var(--text-muted)] leading-relaxed">
                        {!isLimitsEnforced
                            ? "Pramanit is currently 100% Free & Unlocked for all accredited academies, universities, and training institutions during our Open Early-Access Preview."
                            : "Whether you are an independent academy or a university issuing thousands of degrees, Pramanit scales with your institution."
                        }
                    </p>

                    {/* Open Access Banner when limit enforcement is OFF */}
                    {!isLimitsEnforced && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center gap-3 text-emerald-400 text-xs font-bold shadow-md max-w-xl mx-auto mt-4 animate-in fade-in">
                            <ShieldCheck size={20} className="shrink-0 text-emerald-400" />
                            <span>EARLY ACCESS PROMOTION: All PRO Enterprise features (Custom Branding, SMTP, Subdomains) are currently UNLOCKED for all registered issuers.</span>
                        </div>
                    )}

                    {/* Billing Toggle */}
                    <div className="pt-4 flex items-center justify-center gap-4">
                        <span className={`text-xs font-black uppercase tracking-wider ${billingCycle === 'monthly' ? 'text-[var(--text-heading)]' : 'text-[var(--text-muted)]'}`}>
                            Monthly Billing
                        </span>

                        <button
                            type="button"
                            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
                            className="w-14 h-8 bg-white/10 rounded-full p-1 border border-[var(--border-interactive)] relative transition-colors"
                        >
                            <div className={`w-6 h-6 rounded-full bg-rose-600 shadow-md transition-transform ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>

                        <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-rose-400' : 'text-[var(--text-muted)]'}`}>
                            Annual Billing
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">SAVE ~17%</span>
                        </span>
                    </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

                    {/* Free Plan Card */}
                    <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] p-8 sm:p-10 space-y-8 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
                        <div className="space-y-6">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 text-[10px] font-black uppercase tracking-wider mb-3">
                                    Starter Issuer
                                </div>
                                <h3 className="text-2xl font-black text-[var(--text-heading)]">Free Tier</h3>
                                <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Perfect for small workshops, bootcamps, & initial testing.</p>
                            </div>

                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-[var(--text-heading)]">{currency}0</span>
                                <span className="text-xs font-bold text-[var(--text-muted)]">/ forever free</span>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-[var(--border-muted)]">
                                {settings.free_features.map((feat, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-xs font-bold text-[var(--text-main)]">
                                        <Check size={16} className="text-emerald-400 shrink-0" />
                                        <span>{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-[var(--text-main)] border border-[var(--border-interactive)] rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                        >
                            Get Started Free
                        </button>
                    </div>

                    {/* Pro Plan Card - Coming Soon or Active */}
                    <div className="bg-[var(--bg-card)] rounded-[2.5rem] border-2 border-rose-500/50 p-8 sm:p-10 space-y-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute -right-12 -top-12 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase tracking-widest">
                                        <Zap size={12} /> Institutional Pro
                                    </div>

                                    {!isLimitsEnforced && (
                                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                                            <Clock size={12} /> Launching Soon
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-2xl font-black text-[var(--text-heading)]">PRO Enterprise Tier</h3>
                                <p className="text-xs font-medium text-[var(--text-muted)] mt-1">For universities, accredited academies, & high-volume issuers.</p>
                            </div>

                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-rose-500">
                                    {currency}{billingCycle === 'annual' ? annualMonthlyRate : monthlyRate}
                                </span>
                                <span className="text-xs font-bold text-[var(--text-muted)]">
                                    / month {billingCycle === 'annual' ? `(billed ${currency}${settings.pro_annual_price}/yr)` : ''}
                                </span>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-[var(--border-muted)]">
                                {settings.pro_features.map((feat, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-xs font-bold text-[var(--text-heading)]">
                                        <Check size={16} className="text-rose-500 shrink-0" />
                                        <span>{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {isLimitsEnforced ? (
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-4 bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                Upgrade to PRO <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-4 bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-300 border border-amber-500/40 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <Sparkles size={16} /> Currently Unlocked in Free Early Access
                            </button>
                        )}
                    </div>

                </div>

                {/* Coming Soon Early-Bird Notification Banner */}
                {!isLimitsEnforced && (
                    <div className="max-w-3xl mx-auto bg-[var(--bg-card)] rounded-[2.5rem] p-8 border border-[var(--border-muted)] shadow-xl text-center space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center mx-auto border border-violet-500/20">
                            <Bell size={24} />
                        </div>

                        <h3 className="text-xl font-black text-[var(--text-heading)]">Get Notified When PRO Plans Launch</h3>
                        <p className="text-xs font-medium text-[var(--text-muted)] max-w-lg mx-auto">
                            Subscribe with your institutional email to lock in a 20% early-bird lifetime discount when official PRO subscriptions open.
                        </p>

                        {subscribed ? (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in max-w-md mx-auto">
                                <CheckCircle2 size={16} /> You're on the early-bird VIP launch list!
                            </div>
                        ) : (
                            <form onSubmit={handleNotifyMe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter institutional email..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl px-4 py-3 text-xs font-bold text-[var(--text-main)] outline-none focus:border-rose-500"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all shrink-0"
                                >
                                    Notify Me
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default PricingPage;
