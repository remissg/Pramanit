import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const About = () => {
    const [theme, setTheme] = React.useState('light'); // detailed state management can be lifted if needed

    return (
        <div className="min-h-screen bg-[var(--bg-main)] font-sans text-[var(--text-main)] transition-colors duration-500 flex flex-col">
            <Header theme={theme} setTheme={setTheme} />

            <main className="flex-grow pt-32 pb-20 px-6 max-w-4xl mx-auto w-full">
                <div className="glass-card rounded-[32px] p-8 md:p-12 border border-[var(--glass-border)] shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-black text-[var(--text-heading)] mb-8 tracking-tight">About Pramanit</h1>

                    <div className="space-y-6 text-[var(--text-muted)] leading-relaxed font-medium">
                        <p className="text-lg">
                            Pramanit is a next-generation credentialing platform designed to empower organizations with secure, verifiable, and beautiful certificates.
                        </p>

                        <p>
                            We believe that every achievement deserves recognition. Whether it's a workshop completion, a hackathon win, or a professional certification, our mission is to make the process of issuing and verifying credentials seamless and tamper-proof.
                        </p>

                        <h2 className="text-2xl font-black text-[var(--text-heading)] mt-8 mb-4">Our Mission</h2>
                        <p>
                            To build trust in the digital world by providing a standard for verifiable credentials that are easy to issue, delightful to receive, and simple to verify.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default About;
