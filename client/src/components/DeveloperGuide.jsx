import React from 'react';
import { X, Copy, Check, FileJson, Server, Code, ArrowRight, Shield, Globe } from 'lucide-react';

const CodeBlock = ({ code, language = 'json' }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group rounded-xl overflow-hidden bg-[#0f172a] border border-[var(--border-muted)] my-4 shadow-lg">
            <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/5">
                <span className="text-xs font-mono text-slate-400">{language}</span>
                <button
                    onClick={handleCopy}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed custom-scrollbar">
                {code}
            </pre>
        </div>
    );
};

const Section = ({ title, icon: Icon, children }) => (
    <div className="mb-10 last:mb-0">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 border border-violet-500/10">
                <Icon size={20} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-heading)]">{title}</h3>
        </div>
        <div className="pl-13 space-y-4 text-sm text-[var(--text-muted)] leading-relaxed">
            {children}
        </div>
    </div>
);

const DeveloperGuide = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[var(--bg-card)] w-full max-w-4xl rounded-[2rem] shadow-2xl border border-[var(--glass-border)] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-8 border-b border-[var(--border-muted)] flex justify-between items-center bg-[var(--bg-muted)]/50">
                    <div>
                        <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight mb-1">Developer API Guide</h2>
                        <p className="text-sm font-bold text-[var(--text-muted)]">Integrate Pramanit generation into your own apps.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-muted)] hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-[var(--border-muted)]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {/* Intro */}
                    <div className="bg-violet-500/5 border border-violet-500/10 rounded-2xl p-6 mb-10">
                        <h4 className="font-bold text-violet-500 mb-2 flex items-center gap-2">
                            <Server size={18} />
                            The Core Concept
                        </h4>
                        <p className="text-sm text-[var(--text-muted)] mb-6 font-medium">
                            <strong className="text-[var(--text-heading)]">Design Once (GUI)</strong> → <strong className="text-[var(--text-heading)]">Issue Many (API)</strong>
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-[var(--bg-input)] p-5 rounded-xl border border-[var(--border-muted)] shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 block mb-2">Step 1</span>
                                <strong className="text-[var(--text-heading)] block mb-1">Create Design</strong>
                                <p className="text-xs text-[var(--text-muted)] font-medium">Use the visual editor to make a template.</p>
                            </div>
                            <div className="flex items-center justify-center text-[var(--text-muted)]">
                                <ArrowRight size={20} />
                            </div>
                            <div className="bg-[var(--bg-input)] p-5 rounded-xl border border-[var(--border-muted)] shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 block mb-2">Step 2</span>
                                <strong className="text-[var(--text-heading)] block mb-1">Get Design ID</strong>
                                <p className="text-xs text-[var(--text-muted)] font-medium">Copy the ID from your Dashboard.</p>
                            </div>
                            <div className="flex items-center justify-center text-[var(--text-muted)]">
                                <ArrowRight size={20} />
                            </div>
                            <div className="bg-[var(--bg-input)] p-5 rounded-xl border border-[var(--border-muted)] shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 block mb-2">Step 3</span>
                                <strong className="text-[var(--text-heading)] block mb-1">Send API Request</strong>
                                <p className="text-xs text-[var(--text-muted)] font-medium">Post JSON data to generate certs.</p>
                            </div>
                        </div>
                    </div>

                    <Section title="Authentication" icon={Shield}>
                        <p>All requests must include your API Key in the header.</p>
                        <CodeBlock code={`x-api-key: YOUR_SECRET_KEY`} language="header" />
                    </Section>

                    <Section title="Issue a Certificate" icon={Code}>
                        <p>
                            Send a POST request to <code>/api/external/issue</code>.
                            The <code>recipient</code> object keys must match the placeholders in your design (e.g. <code>{"{{name}}"}</code> in design becomes <code>name</code> in JSON).
                        </p>
                        <CodeBlock code={`POST /api/external/issue
Content-Type: application/json
X-API-KEY: YOUR_KEY

{
  "design_id": "65d8f9...", 
  "recipient": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "course": "React Mastery",
    "date": "2026-05-20"
  },
  "email_template_id": "optional_template_id"
}`} />
                    </Section>

                    <Section title="Webhooks" icon={Globe}>
                        <p>
                            Receive real-time updates when a certificate is issued. Configure your URL in the Developer Dashboard.
                        </p>
                        <CodeBlock code={`// Payload sent to your webhook
{
  "event": "certificate.issued",
  "data": {
    "recipient_email": "jane@example.com",
    "certificate_url": "https://pramanit.io/verify/...",
    "issued_at": "2026-05-20T10:00:00Z"
  }
}`} />
                    </Section>

                    <Section title="Embeddable 'Verified Issuer' Badge" icon={Globe}>
                        <p>
                            Embed an interactive <strong>"Verified by Pramanit"</strong> badge on your organization's website or LMS to showcase your official issuing authority.
                        </p>

                        <div className="my-6 p-6 bg-slate-900/80 rounded-2xl border border-violet-500/20 flex flex-col items-center justify-center gap-3 text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Live Badge Preview</span>
                            <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-violet-900/40 via-purple-900/40 to-slate-900 border border-violet-500/40 rounded-2xl shadow-xl">
                                <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
                                    <Shield size={20} className="text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-black text-white tracking-wide">Pramanit Verified Issuer</span>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    </div>
                                    <p className="text-[10px] font-mono text-slate-300">Official Verifiable Authority</p>
                                </div>
                            </div>
                        </div>

                        <CodeBlock
                            language="html"
                            code={`<!-- Pramanit Verified Issuer Badge Snippet -->
<div id="pramanit-badge" data-issuer="verified"></div>
<script src="${window.location.origin}/embed-badge.js" async></script>`}
                        />
                    </Section>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--border-muted)] bg-[var(--bg-muted)] flex justify-end rounded-b-[2rem]">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-[var(--bg-input)] hover:bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-xl font-bold text-[var(--text-main)] transition-all"
                    >
                        Close Guide
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeveloperGuide;
