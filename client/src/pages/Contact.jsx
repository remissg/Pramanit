import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Contact = () => {
    const [theme, setTheme] = React.useState('light');

    return (
        <div className="min-h-screen bg-[var(--bg-main)] font-sans text-[var(--text-main)] transition-colors duration-500 flex flex-col">
            <Header theme={theme} setTheme={setTheme} />

            <main className="flex-grow pt-32 pb-20 px-6 max-w-4xl mx-auto w-full">
                <div className="glass-card rounded-[32px] p-8 md:p-12 border border-[var(--glass-border)] shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-black text-[var(--text-heading)] mb-8 tracking-tight">Contact Us</h1>

                    <div className="space-y-6 text-[var(--text-muted)] leading-relaxed font-medium">
                        <p className="text-lg">
                            We'd love to verify your query within 24 hours. Reach out to us for support, feedback, or enterprise inquiries.
                        </p>

                        <div className="bg-[var(--glass)] p-6 rounded-2xl border border-[var(--glass-border)] mt-8">
                            <h3 className="text-xl font-black text-[var(--text-heading)] mb-4">Email</h3>
                            <a href="mailto:support@pramanit.com" className="text-violet-500 hover:text-violet-400 font-bold text-lg transition-colors">
                                support@pramanit.com
                            </a>
                        </div>

                        <div className="bg-[var(--glass)] p-6 rounded-2xl border border-[var(--glass-border)]">
                            <h3 className="text-xl font-black text-[var(--text-heading)] mb-4">Office</h3>
                            <p className="flex flex-col gap-1 text-[var(--text-muted)]">
                                <span>Pramanit INC.</span>
                                <span>123 Innovation Drive</span>
                                <span>Bangalore, India 560100</span>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;
