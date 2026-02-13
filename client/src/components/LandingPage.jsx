import React from 'react';
import Header from './Header';
import Hero from './Hero';
import Footer from './Footer';
import { Layout, Layers, Mail, ArrowRight, Sparkles, Filter, Check } from 'lucide-react';
import corporateTemplate from '../assets/corporate-template.png';
import creativeTemplate from '../assets/creative-template.png';
import academicTemplate from '../assets/academic-template.jpg';
import premiumTemplate from '../assets/premium-template.png';

const LandingPage = ({ onGetStarted, theme, setTheme, onSelectTemplate }) => {
    const [filter, setFilter] = React.useState('All');

    const templates = [
        {
            id: 1,
            title: 'Modern Corporate',
            category: 'Corporate',
            image: corporateTemplate,
        },
        {
            id: 2,
            title: 'Academic Excellence',
            category: 'Academic',
            image: academicTemplate,
        },
        {
            id: 3,
            title: 'Creative Achievement',
            category: 'Creative',
            image: creativeTemplate,
        },
        {
            id: 4,
            title: 'Minimalist Professional',
            category: 'Corporate',
            image: 'https://images.unsplash.com/photo-1606761560479-6646793ee52a?q=80&w=1000',
        },
        {
            id: 5,
            title: 'Artistic Certificate',
            category: 'Creative',
            image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000',
        },
        {
            id: 6,
            title: 'Elite Recognition',
            category: 'Premium',
            image: premiumTemplate,
        }
    ];

    const filteredTemplates = filter === 'All'
        ? templates
        : templates.filter(t => t.category === filter);

    return (
        <div className="min-h-screen bg-[var(--bg-main)] selection:bg-violet-500/30 transition-colors duration-500">
            <Header onGetStarted={onGetStarted} theme={theme} setTheme={setTheme} />

            <main>
                <Hero onGetStarted={onGetStarted} />

                {/* Templates Gallery Section */}
                <section id="templates" className="py-24 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                            <div className="max-w-xl">
                                <div className="inline-flex items-center gap-2 text-violet-400 font-black text-xs uppercase tracking-widest mb-4">
                                    <Sparkles size={14} />
                                    Explore Library
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black text-[var(--text-main)] tracking-tighter mb-4 transition-colors">Choose Your Canvas.</h2>
                                <p className="text-[var(--text-muted)] font-bold transition-colors text-lg">Start with a professional baseline and customize every detail in seconds.</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {['All', 'Corporate', 'Academic', 'Creative', 'Premium'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilter(cat)}
                                        className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${filter === cat
                                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                                            : 'glass text-[var(--text-muted)] hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredTemplates.map(template => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onSelect={() => onSelectTemplate(template.image, template.title)}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-[var(--bg-main)]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-20 px-6">
                            <h2 className="text-4xl md:text-6xl font-black text-[var(--text-main)] tracking-tighter mb-4 transition-colors">Powerful Features for Professionals</h2>
                            <p className="text-[var(--text-muted)] font-bold max-w-xl mx-auto transition-colors">Everything you need to automate your certification workflow without any complexity.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
                            <FeatureCard
                                title="Visual Template Designer"
                                desc="Place text, adjust typography, and see real-time updates with our advanced WYSIWYG editor."
                                icon={<Layout size={32} />}
                            />
                            <FeatureCard
                                title="Intelligent Batch Processing"
                                desc="Upload Excel or CSV files and generate 1000s of professional certificates in a single click."
                                icon={<Layers size={32} />}
                            />
                            <FeatureCard
                                title="Automated Email Delivery"
                                desc="Deliver your certificates directly to recipients' inboxes with automated SMTP integration."
                                icon={<Mail size={32} />}
                            />
                        </div>
                    </div>
                </section>

                {/* How it Works Section */}
                <section id="how-it-works" className="py-24 glass border-y border-[var(--glass-border)]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-20 px-6">
                            <h2 className="text-4xl md:text-6xl font-black text-[var(--text-main)] tracking-tighter mb-4 transition-colors">How it Works</h2>
                            <p className="text-[var(--text-muted)] font-bold max-w-xl mx-auto transition-colors">A simple, three-step process to transform your data into beautiful credentials.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative p-6">
                            {/* Connector lines (Desktop Only) */}
                            <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-violet-500/0 via-violet-500/30 to-violet-500/0 -translate-y-1/2 z-0"></div>

                            <Step number="01" title="Upload Template" desc="Upload your certificate image and the list of recipients." />
                            <Step number="02" title="Design Layout" desc="Drag & drop fields, style typography, and verify with live data." />
                            <Step number="03" title="Generate & Send" desc="Verify batch previews and send directly to participants." />
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

const TemplateCard = ({ template, onSelect }) => (
    <div className="group relative glass-card rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-600/20 border-white/5">
        <div className="aspect-[4/3] overflow-hidden relative">
            <img
                src={template.image}
                alt={template.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                <button
                    onClick={onSelect}
                    className="px-8 py-3 bg-white text-[#0f172a] font-black rounded-xl text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group/btn"
                >
                    Use Template
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                <button className="text-white/60 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
                    Preview Design
                </button>
            </div>

            {/* Category Tag */}
            <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-tighter transition-colors">
                    {template.category}
                </span>
            </div>
        </div>

        <div className="p-6 transition-colors">
            <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight transition-colors">{template.title}</h3>
                <Sparkles size={16} className="text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest transition-colors">Fully Customizable</p>
        </div>
    </div>
);

const FeatureCard = ({ title, desc, icon }) => (
    <div className="glass-card p-10 rounded-3xl group hover:border-violet-500/50 hover:bg-violet-600/5 transition-all duration-500">
        <div className="w-16 h-16 bg-violet-600/10 text-violet-500 rounded-2xl flex items-center justify-center mb-8 p-3 group-hover:bg-violet-600 group-hover:text-white transition-all duration-500">
            {icon}
        </div>
        <h3 className="text-2xl font-black text-[var(--text-main)] mb-4 tracking-tight transition-colors">{title}</h3>
        <p className="text-[var(--text-muted)] font-bold leading-relaxed mb-6 text-sm transition-colors">{desc}</p>
        <button className="text-violet-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 group/btn">
            Learn More <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
    </div>
);

const Step = ({ number, title, desc }) => (
    <div className="relative z-10 text-center">
        <div className="w-20 h-20 bg-violet-600 rounded-3xl flex items-center justify-center text-3xl font-black italic text-white shadow-2xl shadow-violet-500/50 mx-auto mb-8 border-4 border-[var(--bg-main)]">
            {number}
        </div>
        <h3 className="text-2xl font-black text-[var(--text-main)] mb-4 tracking-tight transition-colors">{title}</h3>
        <p className="text-[var(--text-muted)] font-bold text-sm leading-relaxed max-w-[200px] mx-auto transition-colors">{desc}</p>
    </div>
);

export default LandingPage;
