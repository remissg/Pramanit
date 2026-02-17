import React from 'react';
import { FileText, Send, Layout, ShieldCheck, ArrowRight } from 'lucide-react';
import logo from '../assets/Pramanit logo.png';

const Hero = ({ onGetStarted }) => {
    return (
        <div className="relative pt-32 pb-20 overflow-hidden bg-gradient-premium">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-violet-600/10 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-pink-500/5 blur-[100px] rounded-full"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <img src={logo} alt="Logo" className="w-4 h-4 object-contain" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] transition-colors">The Modern Standard for Certificates</span>
                </div>

                <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-gradient animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    Design, Generate, & <br className="hidden md:block" /> Distribute with <span className="text-violet-500">Ease</span>.
                </h1>

                <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10 font-bold leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 transition-colors">
                    Pramanit is the all-in-one professional toolkit for creating stunning certificates at scale. Upload, Design, and Send in seconds.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
                    <button
                        onClick={onGetStarted}
                        className="w-full sm:w-auto px-10 py-5 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 group"
                    >
                        Start Generating Now
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <a
                        href="/verify/HUB"
                        className="w-full sm:w-auto px-10 py-5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-black rounded-2xl transition-all flex items-center justify-center gap-3"
                    >
                        <ShieldCheck size={20} />
                        Verify Credential
                    </a>
                    <a
                        href="#features"
                        className="w-full sm:w-auto px-10 py-5 glass hover:bg-white/5 text-[var(--text-main)] font-black rounded-2xl transition-all"
                    >
                        Explore Features
                    </a>
                </div>

                {/* Feature Cards Grid (Compact) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-24 animate-in fade-in slide-in-from-bottom-24 duration-1000">
                    <FeatureItem icon={<Layout size={20} />} title="Dynamic Designer" desc="Drag & drop anything" />
                    <FeatureItem icon={<FileText size={20} />} title="Batch Processing" desc="Process 1000s at once" />
                    <FeatureItem icon={<Send size={20} />} title="Email Delivery" desc="Send directly to inbox" />
                    <FeatureItem icon={<ShieldCheck size={20} />} title="Verify Results" desc="Real-time progress" />
                </div>
            </div>
        </div>
    );
};

const FeatureItem = ({ icon, title, desc }) => (
    <div className="glass-card p-6 text-left rounded-2xl group hover:border-violet-500/50 transition-all duration-500 cursor-default">
        <div className="w-10 h-10 bg-violet-600/10 rounded-xl flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all duration-500">
            {icon}
        </div>
        <h3 className="text-[var(--text-main)] font-black mb-1 text-sm tracking-tight transition-colors">{title}</h3>
        <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest transition-colors">{desc}</p>
    </div>
);

export default Hero;
