import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Terms = () => {
    const [theme, setTheme] = React.useState('light');

    return (
        <div className="min-h-screen bg-[var(--bg-main)] font-sans text-[var(--text-main)] transition-colors duration-500 flex flex-col">
            <Header theme={theme} setTheme={setTheme} />

            <main className="flex-grow pt-32 pb-20 px-6 max-w-4xl mx-auto w-full">
                <div className="glass-card rounded-[32px] p-8 md:p-12 border border-[var(--glass-border)] shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-black text-[var(--text-heading)] mb-8 tracking-tight">Terms of Service</h1>

                    <div className="space-y-6 text-[var(--text-muted)] leading-relaxed font-medium text-sm md:text-base">
                        <p className="text-lg font-bold text-[var(--text-heading)]">Last Updated: February 2026</p>

                        <h2 className="text-xl font-black text-[var(--text-heading)] mt-8">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using Pramanit, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                        </p>

                        <h2 className="text-xl font-black text-[var(--text-heading)] mt-8">2. Use of Service</h2>
                        <p>
                            You agree to use Pramanit only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account.
                        </p>

                        <h2 className="text-xl font-black text-[var(--text-heading)] mt-8">3. Intellectual Property</h2>
                        <p>
                            The service and its original content, features, and functionality are owned by Pramanit and are protected by international copyright, trademark, and other intellectual property laws.
                        </p>

                        <h2 className="text-xl font-black text-[var(--text-heading)] mt-8">4. Termination</h2>
                        <p>
                            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Terms;
