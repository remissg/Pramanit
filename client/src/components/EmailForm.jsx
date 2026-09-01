import React, { useState, useEffect } from 'react';
import { Mail, Type, ShieldCheck, ChevronDown, Check, LayoutTemplate, Tag } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useAuth } from '../context/AuthContext';

const EmailForm = ({ config, onChange, templates = [] }) => {
    const { user } = useAuth();
    const [showTemplates, setShowTemplates] = useState(false);
    const [showMergeTags, setShowMergeTags] = useState(false);
    const [isPreview, setIsPreview] = useState(false);
    const quillRef = React.useRef(null);

    useEffect(() => {
        if (user && !config.issuerName) {
            const defaultIssuer = user.orgName || user.fullName || user.org_name || user.full_name || '';
            if (defaultIssuer) {
                onChange({ ...config, issuerName: defaultIssuer });
            }
        }
    }, [user, config.issuerName]);

    const SAMPLE_DATA = {
        '{{name}}': 'Joydip Maiti',
        '{{event_name}}': 'Web Development Workshop 2026',
        '{{certificate_link}}': 'https://pramanit.io/verify/SAMPLE-UUID-1234',
        '{{issuer_name}}': config.issuerName || 'Pramanit Academy',
        '{{cert_id}}': 'D7F336B9-DF5E-4C04-8E1A-C90B60829871'
    };

    const renderPreview = (text) => {
        let result = text || '';
        Object.entries(SAMPLE_DATA).forEach(([tag, val]) => {
            const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            result = result.replace(regex, `<span class="preview-pill">${val}</span>`);
        });
        return result;
    };

    const renderPreviewPlain = (text) => {
        let result = text || '';
        Object.entries(SAMPLE_DATA).forEach(([tag, val]) => {
            const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            result = result.replace(regex, val);
        });
        return result;
    };

    // Register a custom blot for merge tags if Quill is available
    React.useEffect(() => {
        const Quill = ReactQuill.Quill;
        if (Quill) {
            const Inline = Quill.import('blots/inline');
            class MergeTagBlot extends Inline {
                static create(value) {
                    const node = super.create();
                    node.setAttribute('class', 'merge-tag');
                    node.setAttribute('spellcheck', 'false');
                    node.textContent = value;
                    return node;
                }
                static formats(node) {
                    return true;
                }
            }
            MergeTagBlot.blotName = 'merge-tag';
            MergeTagBlot.tagName = 'span';
            Quill.register(MergeTagBlot);
        }
    }, []);

    const mergeTags = [
        { label: 'Recipient Name', value: '{{name}}' },
        { label: 'Event Name', value: '{{event_name}}' },
        { label: 'Certificate Link', value: '{{certificate_link}}' },
        { label: 'Issuer Name', value: '{{issuer_name}}' },
        { label: 'Certificate ID', value: '{{cert_id}}' },
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange({ ...config, [name]: value });
    };

    const handleBodyChange = (content) => {
        onChange({ ...config, body: content });
    };

    const selectTemplate = (template) => {
        onChange({
            ...config,
            subject: template.subject,
            body: template.body_html
        });
        setShowTemplates(false);
    };

    const insertTag = (tag) => {
        const quill = quillRef.current?.getEditor();
        if (quill) {
            const range = quill.getSelection(true);
            if (range) {
                quill.insertEmbed(range.index, 'merge-tag', tag, 'user');
                quill.setSelection(range.index + 1, 0, 'user');
            }
        }
        setShowMergeTags(false);
    };

    // Group templates by type
    const systemTemplates = templates.filter(t => t.is_system);
    const userTemplates = templates.filter(t => !t.is_system);

    return (
        <div className="space-y-6 w-full max-w-2xl mx-auto transition-colors">
            {/* Custom CSS for merge tag highlighting in Quill */}
            <style>
                {`
                .ql-editor .merge-tag {
                    background-color: rgba(99, 102, 241, 0.1);
                    color: #6366f1;
                    padding: 0 4px;
                    border-radius: 4px;
                    font-weight: bold;
                    border: 1px solid rgba(99, 102, 241, 0.2);
                }
                .preview-pill {
                    background-color: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: 700;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }
                `}
            </style>

            {/* Template Selector */}
            {templates.length > 0 && (
                <div className="relative mb-8">
                    <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-violet-600/5 hover:bg-violet-600/10 border border-violet-500/20 rounded-2xl text-[var(--text-heading)] font-bold transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500">
                                <LayoutTemplate size={18} />
                            </div>
                            <span>Load from Template...</span>
                        </div>
                        <ChevronDown size={18} className={`text-[var(--text-muted)] transition-transform duration-300 ${showTemplates ? 'rotate-180' : ''}`} />
                    </button>

                    {showTemplates && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[400px] overflow-y-auto">

                            {/* System Blueprints */}
                            {systemTemplates.length > 0 && (
                                <div className="border-b border-[var(--border-muted)]/50 pb-2">
                                    <div className="px-5 py-2 bg-violet-500/5 text-[9px] font-black uppercase tracking-widest text-violet-400">Recommended Blueprints</div>
                                    {systemTemplates.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => selectTemplate(template)}
                                            className="w-full text-left px-5 py-3 hover:bg-[var(--bg-input)] transition-colors flex items-center justify-between group"
                                        >
                                            <div>
                                                <p className="font-bold text-[var(--text-heading)] text-sm">{template.name}</p>
                                                <p className="text-[10px] text-[var(--text-muted)] truncate max-w-sm">{template.subject}</p>
                                            </div>
                                            {config.subject === template.subject && <Check size={14} className="text-violet-500" />}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* User Templates */}
                            {userTemplates.length > 0 && (
                                <div>
                                    <div className="px-5 py-2 bg-slate-500/5 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Your Saved Templates</div>
                                    {userTemplates.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => selectTemplate(template)}
                                            className="w-full text-left px-5 py-3 hover:bg-[var(--bg-input)] transition-colors flex items-center justify-between group"
                                        >
                                            <div>
                                                <p className="font-bold text-[var(--text-heading)] text-sm">{template.name}</p>
                                                <p className="text-[10px] text-[var(--text-muted)] truncate max-w-sm">{template.subject}</p>
                                            </div>
                                            {config.subject === template.subject && <Check size={14} className="text-violet-500" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Issuer Name */}
            <div className="relative">
                <label className="block text-sm font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 transition-colors">Issuer / Organization Name</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <ShieldCheck size={18} className="text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        name="issuerName"
                        value={config.issuerName || ''}
                        onChange={handleChange}
                        placeholder={user?.orgName || user?.fullName || 'e.g. Pramanit Academy'}
                        className="block w-full pl-12 pr-4 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-[var(--text-main)] font-bold focus:ring-2 focus:ring-violet-500/50 outline-none transition-all placeholder-[var(--text-muted)] opacity-80 focus:opacity-100"
                    />
                </div>
            </div>

            <div className="relative">
                <label className="block text-sm font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 transition-colors">Email Subject</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Type size={18} className="text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        name="subject"
                        value={isPreview ? renderPreviewPlain(config.subject) : config.subject}
                        onChange={handleChange}
                        readOnly={isPreview}
                        placeholder="Congratulations! Your Course Certificate"
                        className={`block w-full pl-12 pr-4 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-[var(--text-main)] font-bold focus:ring-2 focus:ring-violet-500/50 outline-none transition-all placeholder-[var(--text-muted)] opacity-80 focus:opacity-100 ${isPreview ? 'cursor-not-allowed border-emerald-500/30 text-emerald-500' : ''}`}
                    />
                </div>
            </div>

            <div className="relative">
                <div className="flex items-center justify-between mb-2 px-1">
                    <label className="block text-sm font-black text-[var(--text-muted)] uppercase tracking-widest transition-colors">
                        Email Body
                        <span className="text-[10px] lowercase font-black text-violet-500 ml-2">(Use {"{name}"} for dynamic recipient name)</span>
                    </label>
                    <button
                        onClick={() => setIsPreview(!isPreview)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isPreview ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-violet-600/10 text-violet-500 border border-violet-500/20 hover:bg-violet-600/20'}`}
                    >
                        {isPreview ? <Check size={12} /> : <Tag size={12} />}
                        {isPreview ? 'Live Preview Active' : 'Preview Layout'}
                    </button>
                </div>
                <div className="relative group bg-[var(--bg-input)] rounded-2xl border border-[var(--border-interactive)] focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/50 overflow-hidden text-slate-900">
                    <div className="bg-slate-50 border-b border-slate-200 p-2 flex justify-end">
                        <div className="relative">
                            <button
                                onClick={() => setShowMergeTags(!showMergeTags)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-600 hover:text-violet-600 hover:border-violet-200 transition-all shadow-sm"
                            >
                                <Tag size={12} />
                                Insert Merge Tag
                                <ChevronDown size={12} className={`transition-transform ${showMergeTags ? 'rotate-180' : ''}`} />
                            </button>

                            {showMergeTags && (
                                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                    {mergeTags.map(tag => (
                                        <button
                                            key={tag.value}
                                            onClick={() => insertTag(tag.value)}
                                            className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                                        >
                                            {tag.label} <span className="text-slate-400 font-medium ml-1">({tag.value})</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {!isPreview ? (
                        <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={config.body || ''}
                            onChange={handleBodyChange}
                            placeholder="Hi {{name}}, write your message here..."
                            className="bg-white min-h-[150px]"
                        />
                    ) : (
                        <div
                            className="p-6 bg-white min-h-[200px] prose prose-slate max-w-none prose-sm"
                            dangerouslySetInnerHTML={{ __html: renderPreview(config.body) }}
                        />
                    )}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider mt-3 transition-colors">
                    Tip: Use <code className="bg-violet-500/10 px-2 py-0.5 rounded-lg text-violet-400 border border-violet-500/20">{'{{column_name}}'}</code> to insert data from your CSV.
                </p>
            </div>

            {/* Anti-Spam Pacing & Scheduling Controls */}
            <div className="pt-6 border-t border-[var(--glass-border)] space-y-6">
                <div>
                    <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">
                        Dispatch Schedule & Timing
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => onChange({ ...config, isScheduled: false })}
                            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                                !config.isScheduled
                                    ? 'bg-violet-600/10 border-violet-500 text-violet-400 font-black shadow-lg shadow-violet-600/10'
                                    : 'bg-[var(--bg-input)] border-[var(--border-interactive)] text-[var(--text-muted)] hover:border-violet-500/40'
                            }`}
                        >
                            <div>
                                <p className="text-sm font-bold text-[var(--text-heading)]">🚀 Dispatch Immediately</p>
                                <p className="text-[10px] text-[var(--text-muted)]">Process and send emails right after confirmation</p>
                            </div>
                            {!config.isScheduled && <Check size={18} className="text-violet-500" />}
                        </button>

                        <button
                            type="button"
                            onClick={() => onChange({ ...config, isScheduled: true })}
                            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                                config.isScheduled
                                    ? 'bg-violet-600/10 border-violet-500 text-violet-400 font-black shadow-lg shadow-violet-600/10'
                                    : 'bg-[var(--bg-input)] border-[var(--border-interactive)] text-[var(--text-muted)] hover:border-violet-500/40'
                            }`}
                        >
                            <div>
                                <p className="text-sm font-bold text-[var(--text-heading)]">⏰ Schedule for Later</p>
                                <p className="text-[10px] text-[var(--text-muted)]">Pick a target date & time for background dispatch</p>
                            </div>
                            {config.isScheduled && <Check size={18} className="text-violet-500" />}
                        </button>
                    </div>

                    {config.isScheduled && (
                        <div className="mt-4 p-4 bg-violet-950/40 border border-violet-500/30 rounded-2xl space-y-2 animate-in fade-in duration-300">
                            <label className="block text-[10px] font-black text-violet-300 uppercase tracking-wider">Select Date & Time for Dispatch</label>
                            <input
                                type="datetime-local"
                                value={config.scheduledFor || ''}
                                onChange={(e) => onChange({ ...config, scheduledFor: e.target.value })}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl p-3 text-xs font-bold text-[var(--text-main)] outline-none focus:border-violet-500"
                            />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">
                        🛡️ Anti-Spam Email Pacing (Prevents Spam Filter Flags)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { id: 'safe', label: 'Safe Inbox Pace', gap: '2.5s gap', desc: 'Recommended for Gmail/Outlook primary inbox', badge: 'Recommended' },
                            { id: 'fast', label: 'Fast Pace', gap: '1.0s gap', desc: 'For dedicated custom SMTP relays', badge: 'High Speed' },
                            { id: 'drip', label: 'High Safety Drip', gap: '5.0s gap', desc: 'Maximum domain reputation safety', badge: 'Ultra Safe' }
                        ].map((pace) => (
                            <button
                                key={pace.id}
                                type="button"
                                onClick={() => onChange({ ...config, dispatchPace: pace.id })}
                                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                                    (config.dispatchPace || 'safe') === pace.id
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                                        : 'bg-[var(--bg-input)] border-[var(--border-interactive)] text-[var(--text-muted)] hover:border-emerald-500/40'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-black text-[var(--text-heading)]">{pace.label}</span>
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{pace.gap}</span>
                                </div>
                                <p className="text-[10px] text-[var(--text-muted)] leading-snug">{pace.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-[var(--glass-border)] transition-colors">
                <div className="flex flex-col sm:flex-gap lg:flex-row gap-4 items-stretch lg:items-end">
                    <div className="flex-grow">
                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1 transition-colors">Send a Test Email</label>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            id="test-email-input"
                            className="block w-full px-5 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold text-[var(--text-main)] focus:ring-2 focus:ring-violet-500/50 outline-none transition-all placeholder-[var(--text-muted)]"
                        />
                    </div>
                    <button
                        onClick={async () => {
                            const email = document.getElementById('test-email-input').value;
                            if (!email) return toast.error('Please enter an email address');

                            try {
                                const btn = document.getElementById('test-btn');
                                const originalText = btn.innerText;
                                btn.innerText = 'Sending...';
                                btn.disabled = true;

                                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/test-email`, {
                                    email,
                                    issuerName: config.issuerName,
                                    subject: config.subject,
                                    body: config.body
                                });
                                toast.success('Test email sent! Check your inbox.');
                                btn.innerText = originalText;
                                btn.disabled = false;
                            } catch (e) {
                                toast.error('Failed to send test email.');
                                console.error(e);
                            }
                        }}
                        id="test-btn"
                        className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-black rounded-2xl shadow-lg shadow-violet-500/20 transition-all active:scale-95 whitespace-nowrap lg:h-[58px]"
                    >
                        Send Test
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailForm;
