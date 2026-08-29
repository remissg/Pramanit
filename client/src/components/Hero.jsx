import React from 'react';
import { FileText, Send, Layout, ShieldCheck, ArrowRight, Sparkles, CheckCircle2, Globe, Layers, Award } from 'lucide-react';
import logo from '../assets/Pramanit logo.png';
import { useNavigate } from 'react-router-dom';

const Hero = ({ onGetStarted }) => {
    const navigate = useNavigate();

    return (
        <div className="relative pt-32 pb-24 overflow-hidden bg-[var(--bg-main)]">
            {/* Background Ambient Glows */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-rose-500/10 via-violet-500/10 to-indigo-500/10 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-8">

                {/* Hero Badge Pill */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-muted)] shadow-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <img src={logo} alt="Logo" className="w-4 h-4 object-contain" />
                    <span className="text-xs font-black uppercase tracking-widest text-[var(--text-heading)]">
                        Enterprise Verifiable Credentials Standard
                    </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] text-[var(--text-heading)] max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                    Issue Tamper-Proof <br className="hidden sm:block" />
                    <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
                        Verifiable Credentials
                    </span> at Scale.
                </h1>

                {/* Sub-headline */}
                <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-3xl mx-auto font-semibold leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700">
                    Empowering universities, accredited academies, and training organizations to design, generate, and cryptographically anchor professional certificates in seconds.
                </p>

                {/* Call-to-Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-16 duration-700">
                    <button
                        onClick={onGetStarted}
                        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-rose-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        Issue Certificates Free
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                        onClick={() => navigate('/verify/HUB')}
                        className="w-full sm:w-auto px-8 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                        <ShieldCheck size={18} />
                        Verify Credential Badge
                    </button>

                    <button
                        onClick={() => navigate('/pricing')}
                        className="w-full sm:w-auto px-8 py-4 bg-[var(--bg-card)] hover:bg-white/5 text-[var(--text-main)] border border-[var(--border-interactive)] font-black text-xs uppercase tracking-wider rounded-2xl transition-all"
                    >
                        Pricing & Pro Plans
                    </button>
                </div>

                {/* Trust Metrics Ribbon */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-20 duration-700">
                    <div className="p-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-muted)] text-left space-y-1 shadow-sm">
                        <div className="flex items-center gap-2 text-rose-400">
                            <Award size={18} />
                            <span className="text-xl font-black text-[var(--text-heading)]">100,000+</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Credentials Issued</p>
                    </div>

                    <div className="p-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-muted)] text-left space-y-1 shadow-sm">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <ShieldCheck size={18} />
                            <span className="text-xl font-black text-[var(--text-heading)]">SHA-256</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Tamper-Proof Anchors</p>
                    </div>

                    <div className="p-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-muted)] text-left space-y-1 shadow-sm">
                        <div className="flex items-center gap-2 text-violet-400">
                            <Layers size={18} />
                            <span className="text-xl font-black text-[var(--text-heading)]">CSV Bulk</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Instant Generation</p>
                    </div>

                    <div className="p-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-muted)] text-left space-y-1 shadow-sm">
                        <div className="flex items-center gap-2 text-sky-400">
                            <Globe size={18} />
                            <span className="text-xl font-black text-[var(--text-heading)]">99.99%</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Verification Uptime</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Hero;
