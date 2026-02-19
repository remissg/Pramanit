import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Privacy = () => {
    const [theme, setTheme] = React.useState('light');

    return (
        <div className="min-h-screen bg-[var(--bg-main)] font-sans text-[var(--text-main)] transition-colors duration-500 flex flex-col">
            <Header theme={theme} setTheme={setTheme} />

            <main className="flex-grow pt-32 pb-20 px-6 max-w-4xl mx-auto w-full">
                <div className="glass-card rounded-[32px] p-8 md:p-12 border border-[var(--glass-border)] shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-black text-[var(--text-heading)] mb-8 tracking-tight">Privacy Policy</h1>

                    <div className="space-y-6 text-[var(--text-muted)] leading-relaxed font-medium text-sm md:text-base">
                        <p className="text-lg font-bold text-[var(--text-heading)]">Last Updated: February 2026</p>

                        <h2 className="text-xl font-black text-[var(--text-heading)] mt-8">1. Information We Collect</h2>
                        <p>
                            We collect information necessary to provide our certification services, including names, email addresses, and organizational details required for issuing credentials.
                        </p>

                        <h2 className="text-xl font-black text-[var(--text-heading)] mt-8">2. How We Use Your Data</h2>
                        <p>
                            Your data is used solely for the purpose of generating, issuing, verifying, and recovering certificates. We do not sell your personal information to third parties.
                        </p>

                        <h2 className="text-xl font-black text-[var(--text-heading)] mt-8">3. Data Security</h2>
                        <p>
                            We implement industry-standard security measures, including encryption and secure access controls, to protect your data from unauthorized access.
                        </p>

                        <h2 className="text-xl font-black text-[var(--text-heading)] mt-8">4. Contact Us</h2>
                        <p>
                            If you have questions about this policy, please contact us at privacy@pramanit.com.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Privacy;
