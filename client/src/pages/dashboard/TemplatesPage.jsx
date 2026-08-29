import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Mail, Edit, Trash2, X, Wand2, Sparkles, Check, Save } from 'lucide-react';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const TemplatesPage = () => {
    const { emailTemplates, setEmailTemplates, refetch, loading } = useOutletContext();
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [templateForm, setTemplateForm] = useState({ name: '', subject: '', bodyHtml: '', isDefault: false });

    // AI Generator Modal
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);

    // Register custom Blot for variable highlighting
    useEffect(() => {
        const Quill = ReactQuill.Quill;
        if (Quill) {
            const Inline = Quill.import('blots/inline');
            class MergeTagBlot extends Inline {
                static create(value) {
                    const node = super.create();
                    node.setAttribute('class', 'merge-tag');
                    node.textContent = value;
                    return node;
                }
                static formats() { return true; }
            }
            MergeTagBlot.blotName = 'merge-tag';
            MergeTagBlot.tagName = 'span';
            try { Quill.register(MergeTagBlot); } catch (e) { }
        }
    }, []);

    const openTemplateModal = (template = null) => {
        if (template) {
            setEditingTemplate(template);
            setTemplateForm({
                name: template.name,
                subject: template.subject,
                bodyHtml: template.body_html,
                isDefault: template.is_default
            });
        } else {
            setEditingTemplate(null);
            setTemplateForm({ name: '', subject: '', bodyHtml: '', isDefault: false });
        }
        setShowTemplateModal(true);
    };

    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        try {
            if (editingTemplate) {
                await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/email-templates/${editingTemplate.id}`, templateForm);
            } else {
                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/email-templates`, templateForm);
            }
            setShowTemplateModal(false);
            refetch();
        } catch (err) {
            console.error('Failed to save email template', err);
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm('Are you sure you want to delete this email template?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/email-templates/${id}`);
            setEmailTemplates(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error('Failed to delete email template', err);
        }
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setAiGenerating(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/email-templates/generate-ai`, { prompt: aiPrompt });
            setTemplateForm(prev => ({
                ...prev,
                subject: res.data.subject || prev.subject,
                bodyHtml: res.data.bodyHtml || prev.bodyHtml
            }));
            setShowAiModal(false);
            setAiPrompt('');
        } catch (err) {
            console.error('AI Generation Failed', err);
        } finally {
            setAiGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-card)] rounded-[2.5rem] p-8 border border-[var(--glass-border)] shadow-xl">
                <div>
                    <span className="text-xs font-black uppercase tracking-widest text-violet-400 flex items-center gap-2 mb-2">
                        <Sparkles size={16} /> SMTP Notification Templates
                    </span>
                    <h2 className="text-3xl font-black text-[var(--text-heading)] tracking-tight">
                        Email Templates ({emailTemplates.length})
                    </h2>
                    <p className="text-sm font-bold text-[var(--text-muted)] mt-1">
                        Customize email notifications sent to recipients when credentials are issued.
                    </p>
                </div>
                <button
                    onClick={() => openTemplateModal()}
                    className="px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 active:scale-95 shrink-0"
                >
                    <Plus size={18} /> New Template
                </button>
            </div>

            {/* Templates Grid */}
            {emailTemplates.length === 0 ? (
                <div className="text-center py-20 bg-[var(--glass)] rounded-[2.5rem] border border-[var(--border-interactive)] animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="text-violet-400" size={32} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-heading)] mb-2">No email templates found</h3>
                    <p className="text-[var(--text-muted)] mb-8 max-w-sm mx-auto">Start by creating your first SMTP email template.</p>
                    <button
                        onClick={() => openTemplateModal()}
                        className="text-violet-400 hover:text-violet-300 font-bold underline underline-offset-4 transition-colors"
                    >
                        Create New Template
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {emailTemplates.map((item) => (
                        <div key={item.id} className="group bg-[var(--bg-card)] rounded-3xl border border-[var(--border-muted)] overflow-hidden hover:shadow-2xl hover:border-violet-500/30 transition-all duration-300 flex flex-col p-6 relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
                                    <Mail className="text-violet-500" size={20} />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openTemplateModal(item)}
                                        className="p-2 bg-[var(--bg-input)] hover:bg-violet-600 hover:text-white rounded-lg transition-colors border border-[var(--border-muted)] text-[var(--text-muted)]"
                                        title="Edit Template"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTemplate(item.id)}
                                        className="p-2 bg-[var(--bg-input)] hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-[var(--border-muted)] text-[var(--text-muted)]"
                                        title="Delete Template"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-black text-lg text-[var(--text-heading)] mb-1 truncate">{item.name}</h3>
                            <p className="text-xs text-[var(--text-muted)] font-bold mb-4 line-clamp-1">Subject: {item.subject}</p>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                                {item.is_default && (
                                    <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest border border-emerald-500/20">Default</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Email Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] w-full max-w-2xl rounded-3xl shadow-2xl border border-[var(--glass-border)] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-[var(--border-muted)] flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">
                                    {editingTemplate ? 'Edit Template' : 'New Email Template'}
                                </h2>
                                {!editingTemplate && (
                                    <button
                                        onClick={() => setShowAiModal(true)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 text-violet-500 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-violet-500 hover:text-white transition-all active:scale-95"
                                    >
                                        <Wand2 size={14} /> Magic AI
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setShowTemplateModal(false)} className="text-[var(--text-muted)] hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveTemplate} className="p-6 overflow-y-auto space-y-6">
                            <div>
                                <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Template Name</label>
                                <input
                                    type="text"
                                    value={templateForm.name}
                                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                    placeholder="e.g. Winner Notification"
                                    required
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-3 px-4 outline-none focus:border-violet-500 font-medium text-[var(--text-main)]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Email Subject</label>
                                <input
                                    type="text"
                                    value={templateForm.subject}
                                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                                    placeholder="e.g. Congratulations {Name}, here is your certificate!"
                                    required
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-3 px-4 outline-none focus:border-violet-500 font-medium text-[var(--text-main)]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Email Body</label>
                                <ReactQuill
                                    value={templateForm.bodyHtml}
                                    onChange={(content) => setTemplateForm({ ...templateForm, bodyHtml: content })}
                                    theme="snow"
                                    className="bg-[var(--bg-input)] rounded-xl border border-[var(--border-interactive)] overflow-hidden"
                                />
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-muted)]">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text-main)]">
                                    <input
                                        type="checkbox"
                                        checked={templateForm.isDefault}
                                        onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                                        className="rounded text-violet-600 focus:ring-violet-500"
                                    />
                                    Set as default template
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowTemplateModal(false)}
                                        className="px-5 py-2.5 rounded-xl border border-[var(--border-muted)] text-xs font-bold text-[var(--text-muted)] hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-600/30"
                                    >
                                        Save Template
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Generator Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[var(--glass-border)] space-y-4">
                        <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
                            <h3 className="text-xl font-black text-[var(--text-heading)] flex items-center gap-2">
                                <Wand2 className="text-violet-500" size={20} /> AI Email Generator
                            </h3>
                            <button onClick={() => setShowAiModal(false)} className="text-[var(--text-muted)] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] font-bold">
                            Describe the purpose of your email (e.g. "Formal certificate notification for hackathon winners").
                        </p>
                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Enter prompt for AI..."
                            rows={4}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl p-3 text-xs text-[var(--text-main)] outline-none focus:border-violet-500"
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="px-4 py-2 text-xs font-bold text-[var(--text-muted)]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAiGenerate}
                                disabled={aiGenerating || !aiPrompt.trim()}
                                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-600/30 flex items-center gap-2"
                            >
                                {aiGenerating ? <Sparkles className="animate-spin" size={14} /> : <Wand2 size={14} />}
                                {aiGenerating ? 'Generating...' : 'Generate AI Email'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplatesPage;
