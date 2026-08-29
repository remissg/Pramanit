import React from 'react';
import { Github, Twitter, Linkedin, Heart, ShieldCheck, Lock, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Pramanit logo.png';

const Footer = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <footer className="mt-10 border-t border-[var(--border-muted)] bg-[var(--bg-card)]/80 backdrop-blur-2xl transition-all duration-300 relative overflow-hidden">
            {/* Subtle Gradient Glow */}
            <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 py-8 relative z-10 space-y-6">

                {/* Top Row: Brand & Operational Status Badge */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[var(--border-muted)] gap-4">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(user ? '/dashboard' : '/')}>
                        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-md group-hover:scale-105 transition-transform duration-300 border border-[var(--border-muted)]">
                            <img src={logo} alt="Pramanit Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-rose-500 via-violet-500 to-indigo-500 bg-clip-text text-transparent block">
                                Pramanit
                            </span>
                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                                Enterprise Verifiable Credentials Engine
                            </span>
                        </div>
                    </div>

                    {/* Operational Status Pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Cryptographic Engine Operational (SHA-256)</span>
                    </div>
                </div>

                {/* Main 4-Column Compact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 py-2 border-b border-[var(--border-muted)] pb-6">

                    {/* Col 1: Description & Social Links */}
                    <div className="space-y-3">
                        <p className="text-[var(--text-muted)] text-[11px] font-medium leading-relaxed">
                            Empowering universities & academies to issue tamper-proof, cryptographically verifiable credentials at scale.
                        </p>

                        <div className="flex items-center gap-2">
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noreferrer"
                                className="w-8 h-8 bg-[var(--bg-input)] hover:bg-rose-500/10 hover:text-rose-400 text-[var(--text-muted)] rounded-lg border border-[var(--border-interactive)] flex items-center justify-center transition-all hover:scale-110"
                                title="GitHub"
                            >
                                <Github size={15} />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noreferrer"
                                className="w-8 h-8 bg-[var(--bg-input)] hover:bg-sky-500/10 hover:text-sky-400 text-[var(--text-muted)] rounded-lg border border-[var(--border-interactive)] flex items-center justify-center transition-all hover:scale-110"
                                title="Twitter"
                            >
                                <Twitter size={15} />
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noreferrer"
                                className="w-8 h-8 bg-[var(--bg-input)] hover:bg-blue-500/10 hover:text-blue-400 text-[var(--text-muted)] rounded-lg border border-[var(--border-interactive)] flex items-center justify-center transition-all hover:scale-110"
                                title="LinkedIn"
                            >
                                <Linkedin size={15} />
                            </a>
                        </div>
                    </div>

                    {/* Col 2: Solutions */}
                    <div className="space-y-2.5">
                        <h4 className="text-[var(--text-heading)] font-black uppercase text-[11px] tracking-widest flex items-center gap-1.5">
                            <Sparkles size={13} className="text-rose-500" /> Platform Solutions
                        </h4>
                        <ul className="space-y-2 text-[11px] font-bold text-[var(--text-muted)]">
                            <li>
                                <button onClick={() => navigate(user ? '/dashboard' : '/login')} className="hover:text-rose-400 transition-colors text-left">
                                    Issuer Workspace
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigate(user ? '/dashboard/generate' : '/login')} className="hover:text-rose-400 transition-colors text-left">
                                    CSV Bulk Certificate Generator
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/verify/HUB')} className="text-emerald-400 hover:text-emerald-300 transition-colors text-left flex items-center gap-1">
                                    <ShieldCheck size={13} /> Verify Credential Badge
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/portal')} className="hover:text-rose-400 transition-colors text-left">
                                    Recipient Credential Portal
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Col 3: Governance & Legal */}
                    <div className="space-y-2.5">
                        <h4 className="text-[var(--text-heading)] font-black uppercase text-[11px] tracking-widest flex items-center gap-1.5">
                            <Lock size={13} className="text-violet-500" /> Governance & Legal
                        </h4>
                        <ul className="space-y-2 text-[11px] font-bold text-[var(--text-muted)]">
                            <li>
                                <button onClick={() => navigate('/pricing')} className="text-rose-400 hover:text-rose-300 font-black transition-colors text-left flex items-center gap-1">
                                    Pricing & Pro Plans <ArrowRight size={11} />
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/about')} className="hover:text-rose-400 transition-colors text-left">About Us</button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/contact')} className="hover:text-rose-400 transition-colors text-left">Contact Support</button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/privacy')} className="hover:text-rose-400 transition-colors text-left">Privacy Policy</button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/terms')} className="hover:text-rose-400 transition-colors text-left">Terms of Service</button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/refund')} className="hover:text-rose-400 transition-colors text-left">Refund Policy</button>
                            </li>
                        </ul>
                    </div>

                    {/* Col 4: Trust Seal Card */}
                    <div className="bg-[var(--bg-input)] rounded-2xl p-4 border border-[var(--border-muted)] space-y-2 shadow-inner">
                        <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-black uppercase tracking-wider">
                            <ShieldCheck size={14} /> Cryptographic Trust
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] font-medium leading-normal">
                            All diplomas and certificates are anchored to SHA-256 hashes to guarantee non-repudiation.
                        </p>
                        <button
                            onClick={() => navigate('/verify/HUB')}
                            className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-[var(--text-heading)] border border-[var(--border-interactive)] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                        >
                            Inspect Verification Node <ExternalLink size={11} />
                        </button>
                    </div>

                </div>

                {/* Bottom Bar: Compact Copyright */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-bold text-[var(--text-muted)]">
                    <p>© {new Date().getFullYear()} Pramanit Inc. All rights reserved. Encrypted & Verifiable.</p>

                    <div className="flex items-center gap-1 group hover:text-rose-400 transition-colors cursor-pointer">
                        <span>Built with</span>
                        <Heart size={13} className="text-rose-500 fill-rose-500/20 group-hover:scale-125 transition-transform" />
                        <span>for Universities & Academies Worldwide</span>
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
