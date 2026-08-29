import React from 'react';
import Header from './Header';
import Hero from './Hero';
import Footer from './Footer';
import { Layout, Layers, Mail, ArrowRight, Sparkles, ShieldCheck, Zap, Award, CheckCircle2, Paintbrush } from 'lucide-react';
import corporateTemplate from '../assets/corporate-template.png';
import creativeTemplate from '../assets/creative-template.png';
import academicTemplate from '../assets/academic-template.jpg';
import premiumTemplate from '../assets/premium-template.png';
import gradientTemplate from '../assets/gradient-modern.png';
import patternTemplate from '../assets/pattern-tech.png';
import minimalistTemplate from '../assets/minimalist-clean.png';
import artisticTemplate from '../assets/artistic-watercolor.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = ({ onGetStarted, theme, setTheme, onSelectTemplate }) => {
    const [filter, setFilter] = React.useState('All');
    const navigate = useNavigate();
    const { user } = useAuth();

    const templates = [
        { id: 1, title: 'Gold Seal Corporate Honor', category: 'Corporate', image: corporateTemplate, tag: 'Official Seal' },
        { id: 2, title: 'Academic Degree Diploma', category: 'Academic', image: academicTemplate, tag: 'University Grade' },
        { id: 3, title: 'Creative Innovation Award', category: 'Creative', image: creativeTemplate, tag: 'Modern Abstract' },
        { id: 4, title: 'Executive Minimalist Certificate', category: 'Corporate', image: minimalistTemplate, tag: 'Clean & Sleek' },
        { id: 5, title: 'Artistic Achievement Baseline', category: 'Creative', image: artisticTemplate, tag: 'Watercolor Accent' },
        { id: 6, title: 'Elite Presidential Honor', category: 'Premium', image: premiumTemplate, tag: 'Gold Embossed' },
        { id: 7, title: 'Cyber Gradient Verifiable', category: 'Premium', image: gradientTemplate, tag: 'Dark Cyber' },
        { id: 8, title: 'Tech Geometric Framework', category: 'Corporate', image: patternTemplate, tag: 'Tech Grid' }
    ];

    const filteredTemplates = filter === 'All'
        ? templates
        : templates.filter(t => t.category === filter);

    const handleSelectTemplate = (template) => {
        if (onSelectTemplate) {
            onSelectTemplate(template.image, template.title);
        }
        navigate(user ? '/dashboard/designs' : '/login', {
            state: { templateImage: template.image, templateTitle: template.title }
        });
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] selection:bg-rose-500/30 transition-colors duration-300">
            <Header onGetStarted={onGetStarted} theme={theme} setTheme={setTheme} />

            <main>
                <Hero onGetStarted={onGetStarted} />

                {/* Templates Library Section */}
                <section id="templates" className="py-24 relative overflow-hidden bg-[var(--bg-main)]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                            <div className="max-w-xl">
                                <div className="inline-flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-widest mb-3">
                                    <Sparkles size={14} />
                                    Accredited Baseline Library
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black text-[var(--text-heading)] tracking-tight mb-3">
                                    Choose Your Canvas.
                                </h2>
                                <p className="text-[var(--text-muted)] font-semibold text-sm leading-relaxed">
                                    Start with an institutional gold-standard template or build custom layouts in our visual Studio.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {['All', 'Corporate', 'Academic', 'Creative', 'Premium'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilter(cat)}
                                        className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${filter === cat
                                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                                            : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white border border-[var(--border-muted)]'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {filteredTemplates.map(template => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onSelect={() => handleSelectTemplate(template)}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Studio & Generator Separation Section */}
                <section className="py-20 bg-gradient-to-b from-[var(--bg-main)] to-[var(--bg-card)] border-t border-[var(--border-muted)]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            
                            {/* Studio Card */}
                            <div className="bg-[var(--bg-card)] p-8 sm:p-10 rounded-[2.5rem] border border-[var(--border-muted)] shadow-xl space-y-6 relative overflow-hidden group hover:border-rose-500/40 transition-all">
                                <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-500/20">
                                    <Paintbrush size={28} />
                                </div>
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest">
                                        Phase 1: Design
                                    </div>
                                    <h3 className="text-2xl font-black text-[var(--text-heading)]">Certificate Design Studio</h3>
                                    <p className="text-xs font-medium text-[var(--text-muted)] leading-relaxed">
                                        Drag & drop text placeholders (`{"{{Recipient Name}}"}`), upload official university logos, attach gold seals, and save reusable template blueprints.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(user ? '/dashboard/designs' : '/login')}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-[var(--text-heading)] border border-[var(--border-interactive)] rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
                                >
                                    Open Design Studio <ArrowRight size={14} />
                                </button>
                            </div>

                            {/* Generator Card */}
                            <div className="bg-[var(--bg-card)] p-8 sm:p-10 rounded-[2.5rem] border border-[var(--border-muted)] shadow-xl space-y-6 relative overflow-hidden group hover:border-violet-500/40 transition-all">
                                <div className="w-14 h-14 bg-violet-500/10 text-violet-400 rounded-2xl flex items-center justify-center border border-violet-500/20">
                                    <Zap size={28} />
                                </div>
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest">
                                        Phase 2: Bulk Issue
                                    </div>
                                    <h3 className="text-2xl font-black text-[var(--text-heading)]">Bulk Issuance Engine</h3>
                                    <p className="text-xs font-medium text-[var(--text-muted)] leading-relaxed">
                                        Select your saved Studio blueprint, upload CSV recipient rosters, generate thousands of verifiable credentials, and dispatch automated emails in 1 click.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(user ? '/dashboard/generate' : '/login')}
                                    className="px-6 py-3 bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-2"
                                >
                                    Launch Bulk Generator <ArrowRight size={14} />
                                </button>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-[var(--bg-card)]/50 border-t border-[var(--border-muted)]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16 px-6 max-w-2xl mx-auto">
                            <div className="inline-flex items-center gap-2 text-violet-400 font-black text-xs uppercase tracking-widest mb-3">
                                <Zap size={14} /> Enterprise Suite
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-[var(--text-heading)] tracking-tight mb-3">
                                Built for High-Volume Issuers
                            </h2>
                            <p className="text-[var(--text-muted)] font-semibold text-sm leading-relaxed">
                                End-to-end automation designed for universities, academies, and enterprise certification workflows.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureCard
                                title="Visual Certificate Studio"
                                desc="Dynamic drag & drop canvas editor with real-time text positioning, custom logos, & vector signatures."
                                icon={<Layout size={24} />}
                            />
                            <FeatureCard
                                title="Intelligent CSV Automation"
                                desc="Upload student rosters in Excel or CSV to generate thousands of personalized diplomas in one batch."
                                icon={<Layers size={24} />}
                            />
                            <FeatureCard
                                title="SHA-256 Verifiable QR Engine"
                                desc="Every credential includes a tamper-proof verification QR code backed by cryptographic hashes."
                                icon={<ShieldCheck size={24} />}
                            />
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

const TemplateCard = ({ template, onSelect }) => (
    <div className="group relative bg-[var(--bg-card)] rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border border-[var(--border-muted)] flex flex-col justify-between p-3.5 shadow-lg">
        {/* Certificate Paper Frame */}
        <div className="aspect-[4/3] overflow-hidden relative rounded-2xl border border-white/10 bg-slate-900 shadow-inner group/img">
            <img
                src={template.image}
                alt={template.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105 opacity-90 group-hover/img:opacity-100"
            />

            {/* Premium Gold Seal Badge Overlay */}
            <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-400">
                    <Award size={14} />
                </div>
            </div>

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button
                    onClick={onSelect}
                    className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-xl"
                >
                    Customize in Studio
                    <ArrowRight size={14} />
                </button>
            </div>

            <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded-full text-[9px] font-black text-amber-400 uppercase tracking-wider border border-amber-500/30">
                    {template.tag || template.category}
                </span>
            </div>
        </div>

        <div className="p-3 pt-4 flex items-center justify-between">
            <div>
                <h3 className="text-xs font-black text-[var(--text-heading)] truncate">{template.title}</h3>
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">Gold Standard Canvas</p>
            </div>
            <Sparkles size={14} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
    </div>
);

const FeatureCard = ({ title, desc, icon }) => (
    <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-muted)] space-y-4 hover:border-rose-500/40 transition-all duration-300 shadow-sm">
        <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-500/20">
            {icon}
        </div>
        <h3 className="text-lg font-black text-[var(--text-heading)] tracking-tight">{title}</h3>
        <p className="text-[var(--text-muted)] font-medium text-xs leading-relaxed">{desc}</p>
    </div>
);

export default LandingPage;
