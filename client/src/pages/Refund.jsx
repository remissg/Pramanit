import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Refund = ({ theme, setTheme }) => {
    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300 flex flex-col">
            <Header theme={theme} setTheme={setTheme} />

            <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
                <div className="bg-[var(--bg-card)] rounded-[2.5rem] p-8 sm:p-12 border border-[var(--border-muted)] shadow-xl space-y-8">
                    <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-heading)] tracking-tight">
                        Refund & Cancellation Policy
                    </h1>
                    <p className="text-xs font-bold text-[var(--text-muted)]">Last updated: August 29, 2026</p>

                    <div className="space-y-6 text-xs leading-relaxed text-[var(--text-main)] font-medium">
                        <section className="space-y-2">
                            <h2 className="text-lg font-black text-[var(--text-heading)]">1. Subscription Plans & Cancellations</h2>
                            <p>
                                Pramanit offers monthly and annual subscription plans for verified institutional issuers. You may cancel your subscription at any time through your Dashboard Settings. Upon cancellation, your PRO features will remain active until the end of your current billing cycle.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-black text-[var(--text-heading)]">2. Refund Eligibility</h2>
                            <p>
                                We offer a 7-day money-back guarantee for first-time PRO tier subscriptions if you are dissatisfied with our services or experience technical incompatibilities. Refund requests submitted within 7 days of initial subscription signup will receive a full refund.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-black text-[var(--text-heading)]">3. Certificate Issuance Non-Refundability</h2>
                            <p>
                                Once a verifiable certificate has been cryptographically generated and anchored to SHA-256 hashes, the cryptographic processing costs for that specific credential batch cannot be reversed. Individual certificate generation credits consumed prior to cancellation are non-refundable.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-black text-[var(--text-heading)]">4. Processing Refunds</h2>
                            <p>
                                Approved refunds are processed back to the original payment method within 5 to 7 business days depending on your payment provider or banking institution.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-black text-[var(--text-heading)]">5. Contact Support</h2>
                            <p>
                                For billing questions or refund requests, please contact our support team at <a href="mailto:billing@pramanit.io" className="text-rose-400 font-bold underline">billing@pramanit.io</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Refund;
