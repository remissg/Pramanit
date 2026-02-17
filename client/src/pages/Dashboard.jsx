import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, LayoutTemplate, Search, Loader, Mail, ChevronRight, X, Save, History, BarChart3, Users, ExternalLink, Copy, Settings, Globe, Shield, Upload, Eye, EyeOff, Info, Zap, Lock, UserCheck, UserX, AlertCircle, Wand2, Sparkles, Book, FileJson, Share2, MessageSquare } from 'lucide-react';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DeveloperGuide from '../components/DeveloperGuide';

const Dashboard = ({ theme, setTheme }) => {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState('designs'); // 'designs' | 'email-templates' | 'history' | 'settings' | 'developer' | 'corrections'
    const [showGuide, setShowGuide] = useState(false);
    const [designs, setDesigns] = useState([]);
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [history, setHistory] = useState([]);
    const [corrections, setCorrections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSmtpPass, setShowSmtpPass] = useState(false);
    const [settings, setSettings] = useState({
        orgName: user?.orgName || '',
        orgLogoUrl: user?.orgLogo || '',
        fullName: user?.fullName || '',
        designation: user?.designation || '',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        defaultHashtags: '#Pramanit #Certified #Professional',
        allowSharing: true
    });
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State for Email Templates
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showSmtpGuide, setShowSmtpGuide] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [templateForm, setTemplateForm] = useState({ name: '', subject: '', bodyHtml: '', isDefault: false });

    // AI Content Generation State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);

    // Developer API State
    const [apiKey, setApiKey] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [rotatingKey, setRotatingKey] = useState(false);
    const [updatingWebhook, setUpdatingWebhook] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

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
                static formats(node) { return true; }
            }
            MergeTagBlot.blotName = 'merge-tag';
            MergeTagBlot.tagName = 'span';
            try { Quill.register(MergeTagBlot); } catch (e) { }
        }
    }, []);

    useEffect(() => {
        if (user) {
            setSettings(prev => ({
                ...prev,
                orgName: user.orgName || user.org_name || '',
                orgLogoUrl: user.orgLogo || user.org_logo_url || '',
                fullName: user.fullName || user.full_name || '',
                designation: user.designation || '',
            }));
        }
    }, [user]);

    useEffect(() => {
        fetchData();
        fetchProfile();
    }, [activeTab, user]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`);
            const data = res.data;
            setSettings(prev => ({
                ...prev,
                orgName: data.org_name || '',
                orgLogoUrl: data.org_logo_url || '',
                fullName: data.full_name || '',
                designation: data.designation || '',
                smtpHost: data.smtp_host || '',
                smtpPort: data.smtp_port || 587,
                smtpUser: data.smtp_user || '',
                // smtpPass is kept as is (empty or what user types)
                defaultHashtags: data.social_settings?.default_hashtags || '#CertiFlow #Certified #Professional',
                allowSharing: data.social_settings?.allow_sharing ?? true
            }));
        } catch (err) {
            console.error('Failed to fetch profile', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'designs') {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/designs`);
                setDesigns(res.data);
            } else if (activeTab === 'email-templates') {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/email-templates`);
                setEmailTemplates(res.data);
            } else if (activeTab === 'history') {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/history`);
                setHistory(res.data);
            } else if (activeTab === 'corrections') {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/corrections`);
                setCorrections(res.data);
            } else if (activeTab === 'developer') {
                await fetchDeveloperSettings();
            }
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/update-profile`, settings);
            alert('Settings updated successfully!');
        } catch (err) {
            console.error('Failed to update settings', err);
            alert('Failed to update settings');
        }
    };

    const handleClone = async (id) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/designs/${id}/clone`);
            setDesigns([res.data, ...designs]);
            alert('Design cloned successfully!');
        } catch (err) {
            console.error('Failed to clone design', err);
            alert('Failed to clone design');
        }
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm(`Are you sure you want to delete this ${type === 'designs' ? 'design' : 'template'}?`)) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/${type}/${id}`);
            if (type === 'designs') {
                setDesigns(designs.filter(d => d.id !== id));
            } else {
                setEmailTemplates(emailTemplates.filter(t => t.id !== id));
            }
        } catch (err) {
            console.error('Failed to delete item', err);
        }
    };

    const handleSaveTemplate = async () => {
        if (!templateForm.name || !templateForm.subject || !templateForm.bodyHtml) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            // Since we don't have an update endpoint yet, we'll just handlecreate for now
            // Or if editing, maybe we should add update endpoint later properly.
            // For MVP, if editing, we might need to delete old and create new or implement PUT
            // Let's assume Create only for now or user deletes and recreates
            // Wait, "Allow senders to save their own Custom Templates... B. The Template Editor"

            if (editingTemplate) {
                alert('Update functionality coming soon. For now please create a new template.');
                return;
            }

            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/email-templates`, templateForm);
            setEmailTemplates([res.data, ...emailTemplates]);
            setShowTemplateModal(false);
            setTemplateForm({ name: '', subject: '', bodyHtml: '', isDefault: false });
        } catch (err) {
            console.error('Failed to save template', err);
            alert('Failed to save template');
        }
    };

    const handleAiSuggest = async () => {
        if (!aiPrompt) return alert('Please describe your event first.');
        setAiGenerating(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/ai/generate-content`, {
                eventDescription: aiPrompt
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { title, subject, emailBody } = res.data;
            setTemplateForm({
                ...templateForm,
                name: title || templateForm.name,
                subject: subject || res.data.title || templateForm.subject,
                bodyHtml: emailBody || templateForm.bodyHtml
            });
            setShowAiModal(false);
            setAiPrompt('');
        } catch (err) {
            console.error('AI Suggestion failed', err);
            alert('AI failed to generate content. Please ensure your GEMINI_API_KEY is configured.');
        } finally {
            setAiGenerating(false);
        }
    };

    const fetchDeveloperSettings = async () => {
        try {
            const apiRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/external/keys`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApiKey(apiRes.data.apiKey);
            setWebhookUrl(user?.webhook_url || '');
        } catch (err) {
            console.error('Failed to fetch API settings', err);
        }
    };

    const handleRotateKey = async () => {
        if (!confirm('Are you sure? Your existing API key will stop working immediately.')) return;
        setRotatingKey(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/external/keys/rotate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApiKey(res.data.apiKey);
            alert('API Key Rotated Successfully! ✨');
        } catch (err) {
            console.error('Rotation failed', err);
        } finally {
            setRotatingKey(false);
        }
    };

    const handleUpdateWebhook = async () => {
        setUpdatingWebhook(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/external/webhook/url`, { url: webhookUrl }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Webhook URL Updated! 📡');
        } catch (err) {
            console.error('Webhook update failed', err);
        } finally {
            setUpdatingWebhook(false);
        }
    };

    const handleCorrectionAction = async (id, action) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/corrections/action`, { id, action });
            setCorrections(corrections.filter(c => c.id !== id));
            alert(`Correction ${action}d successfully!`);
        } catch (err) {
            console.error('Failed to process correction action', err);
            alert('Failed to process correction action');
        }
    };

    const openTemplateModal = (template = null) => {
        if (template) {
            // Fetch full details if needed, but for list we might not have body
            // Actually getTemplates returns id, name, subject, is_default
            // We need to fetch body content
            axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/email-templates/${template.id}`).then(res => {
                setEditingTemplate(res.data);
                setTemplateForm({
                    name: res.data.name,
                    subject: res.data.subject,
                    bodyHtml: res.data.body_html,
                    isDefault: res.data.is_default
                });
                setShowTemplateModal(true);
            });
        } else {
            setEditingTemplate(null);
            setTemplateForm({ name: '', subject: '', bodyHtml: '', isDefault: false });
            setShowTemplateModal(true);
        }
    };

    const filteredItems = activeTab === 'designs'
        ? designs.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : activeTab === 'email-templates'
            ? emailTemplates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
            : activeTab === 'history'
                ? history.filter(h => (h.design_name || 'Generic').toLowerCase().includes(searchTerm.toLowerCase()))
                : corrections.filter(c => c.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) || c.requestedName.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen bg-[var(--bg-main)] font-sans text-[var(--text-main)] transition-colors duration-500">
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
                `}
            </style>
            <Header theme={theme} setTheme={setTheme} onGetStarted={() => window.location.href = '/'} />

            <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div>
                        <h1 className="text-4xl font-black text-[var(--text-heading)] tracking-tight mb-2">My Workspace</h1>
                        <p className="text-[var(--text-muted)] font-medium">Manage your designs and email templates.</p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative group flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab === 'designs' ? 'designs' : 'templates'}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[var(--bg-input)] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-[var(--text-main)] outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium"
                            />
                        </div>
                        <button
                            onClick={() => activeTab === 'designs' ? navigate('/generate') : openTemplateModal()}
                            className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-violet-600/20 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus size={18} />
                            New {activeTab === 'designs' ? 'Design' : 'Template'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-[var(--bg-card)] p-1 rounded-2xl border border-[var(--border-muted)] mb-10 w-fit">
                    <button
                        onClick={() => setActiveTab('designs')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'designs' ? 'bg-violet-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                        Designs
                    </button>
                    <button
                        onClick={() => setActiveTab('email-templates')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'email-templates' ? 'bg-violet-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                        Email Templates
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-violet-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                        Issuance History
                    </button>
                    <button
                        onClick={() => setActiveTab('corrections')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'corrections' ? 'bg-violet-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                        Corrections {corrections.length > 0 && <span className="ml-2 bg-amber-500 text-[10px] px-1.5 py-0.5 rounded-full">{corrections.length}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-violet-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                        Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('developer')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'developer' ? 'bg-violet-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                        Developer
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader className="text-violet-500 animate-spin" size={32} />
                    </div>
                ) : activeTab === 'settings' ? (
                    <div className="max-w-4xl mx-auto w-full space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Branding Section */}
                        <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] p-10 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="relative">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                                        <Globe size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-[var(--text-heading)]">Organization Branding</h2>
                                        <p className="text-sm text-[var(--text-muted)] font-bold">Customize how your certificates and emails appear to recipients.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Organization Name</label>
                                        <input
                                            type="text"
                                            value={settings.orgName}
                                            onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold"
                                            placeholder="Enter Org Name"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Logo URL</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={settings.orgLogoUrl}
                                                onChange={(e) => setSettings({ ...settings, orgLogoUrl: e.target.value })}
                                                className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold pr-12"
                                                placeholder="https://..."
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-violet-500">
                                                <Upload size={18} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Full Name (Signer)</label>
                                        <input
                                            type="text"
                                            value={settings.fullName}
                                            onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold"
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Designation</label>
                                        <input
                                            type="text"
                                            value={settings.designation}
                                            onChange={(e) => setSettings({ ...settings, designation: e.target.value })}
                                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold"
                                            placeholder="e.g. Director of Operations"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SMTP Section */}
                        <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] p-10 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="relative">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <Shield size={24} />
                                    </div>
                                    <div className="flex-1 flex justify-between items-start">
                                        <div>
                                            <h2 className="text-2xl font-black text-[var(--text-heading)]">Custom SMTP Settings</h2>
                                            <p className="text-sm text-[var(--text-muted)] font-bold">Send emails from your own domain (e.g. hello@yourbrand.com)</p>
                                        </div>
                                        <button
                                            onClick={() => setShowSmtpGuide(true)}
                                            className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all group/info"
                                            title="How this works"
                                        >
                                            <Info size={20} className="group-hover/info:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">SMTP Host</label>
                                        <input
                                            type="text"
                                            value={settings.smtpHost}
                                            onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold"
                                            placeholder="smtp.gmail.com"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">SMTP Port</label>
                                        <input
                                            type="number"
                                            value={settings.smtpPort}
                                            onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold"
                                            placeholder="587"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">SMTP User</label>
                                        <input
                                            type="text"
                                            value={settings.smtpUser}
                                            onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold"
                                            placeholder="hello@yourbrand.com"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">SMTP Password</label>
                                        <div className="relative group/pass">
                                            <input
                                                type={showSmtpPass ? 'text' : 'password'}
                                                value={settings.smtpPass}
                                                onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                                                className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold pr-12 transition-all focus:border-violet-500/50"
                                                placeholder="••••••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSmtpPass(!showSmtpPass)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-violet-500 transition-colors"
                                            >
                                                {showSmtpPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 flex justify-end">
                                    <button
                                        onClick={handleSaveSettings}
                                        className="px-12 py-5 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-3xl shadow-xl shadow-violet-500/20 transition-all active:scale-95 flex items-center gap-3"
                                    >
                                        <Save size={20} />
                                        Save All Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'developer' ? (
                    <div className="max-w-4xl mx-auto w-full space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-heading)] mb-2 tracking-tight">Developer API</h3>
                                <div className="flex items-center gap-4">
                                    <p className="text-[var(--text-muted)] font-bold text-sm">Empower your systems to issue certificates programmatically.</p>
                                    <button
                                        onClick={() => setShowGuide(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 hover:bg-violet-500 hover:text-white text-violet-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 border border-violet-500/20"
                                    >
                                        <Book size={16} />
                                        Read Guide
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* API Key Section */}
                                <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-violet-600/20 text-violet-500 rounded-xl">
                                            <Lock size={20} />
                                        </div>
                                        <h4 className="font-black text-[var(--text-heading)] uppercase tracking-widest text-xs">Public API Access</h4>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Your API Key</label>
                                        <div className="relative group/key">
                                            <input
                                                type={showApiKey ? "text" : "password"}
                                                value={apiKey || 'Generate a key to get started'}
                                                readOnly
                                                className="w-full bg-[var(--bg-input)] border border-white/5 rounded-2xl py-4 px-5 pr-24 text-[var(--text-main)] font-mono text-sm outline-none shadow-inner"
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                <button
                                                    onClick={() => setShowApiKey(!showApiKey)}
                                                    className="p-2 hover:bg-white/5 rounded-xl text-[var(--text-muted)] transition-colors"
                                                >
                                                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(apiKey);
                                                        alert('API Key Copied!');
                                                    }}
                                                    className="p-2 hover:bg-white/5 rounded-xl text-violet-500 transition-colors"
                                                >
                                                    <Copy size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRotateKey}
                                            disabled={rotatingKey}
                                            className="w-full py-4 bg-violet-600/10 hover:bg-violet-600 hover:text-white text-violet-500 font-black rounded-2xl transition-all flex items-center justify-center gap-2 border border-violet-500/20"
                                        >
                                            {rotatingKey ? <Loader className="animate-spin" size={18} /> : <History size={18} />}
                                            {apiKey ? 'Rotate API Key' : 'Generate API Key'}
                                        </button>
                                    </div>
                                </div>

                                {/* Webhook Section */}
                                <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-emerald-600/20 text-emerald-500 rounded-xl">
                                            <Globe size={20} />
                                        </div>
                                        <h4 className="font-black text-[var(--text-heading)] uppercase tracking-widest text-xs">Real-time Webhooks</h4>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Endpoint URL</label>
                                        <input
                                            type="url"
                                            value={webhookUrl}
                                            onChange={(e) => setWebhookUrl(e.target.value)}
                                            placeholder="https://your-api.com/webhooks/certiflow"
                                            className="w-full bg-[var(--bg-input)] border border-white/5 rounded-2xl py-4 px-5 text-[var(--text-main)] font-medium outline-none focus:border-emerald-500/50 transition-all shadow-inner"
                                        />
                                        <button
                                            onClick={handleUpdateWebhook}
                                            disabled={updatingWebhook}
                                            className="w-full py-4 bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-500 font-black rounded-2xl transition-all flex items-center justify-center gap-2 border border-emerald-500/20"
                                        >
                                            {updatingWebhook ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                                            Update Webhook
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-violet-600/5 border border-violet-500/10 p-8 rounded-[2rem] space-y-4">
                                <div className="flex items-center gap-3">
                                    <Info className="text-violet-500" size={20} />
                                    <h5 className="font-black text-[var(--text-heading)]">API Documentation Snippet</h5>
                                </div>
                                <p className="text-sm text-[var(--text-muted)] font-bold">Use the following endpoint to issue certificates from your own applications:</p>
                                <div className="bg-[#0f172a] p-6 rounded-2xl font-mono text-[10px] md:text-xs text-slate-300 overflow-x-auto shadow-2xl border border-white/5">
                                    <div className="flex justify-between items-center mb-4 text-slate-500">
                                        <span>POST /api/external/issue</span>
                                        <span className="text-emerald-500">Authorization: X-API-KEY</span>
                                    </div>
                                    <pre className="text-violet-400">
                                        {`curl -X POST ${import.meta.env.VITE_API_BASE_URL}/api/external/issue \\
-H "X-API-KEY: YOUR_KEY" \\
-H "Content-Type: application/json" \\
-d '{
  "recipient_name": "John Doe",
  "recipient_email": "john@example.com",
  "metadata": { "course": "React Mastery" }
}'`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20 bg-[var(--glass)] rounded-[2.5rem] border border-[var(--border-interactive)] animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            {activeTab === 'designs' ? <LayoutTemplate className="text-violet-400" size={32} /> : activeTab === 'email-templates' ? <Mail className="text-violet-400" size={32} /> : activeTab === 'history' ? <History className="text-violet-400" size={32} /> : <AlertCircle className="text-violet-400" size={32} />}
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-heading)] mb-2">No {activeTab.replace('-', ' ')} found</h3>
                        <p className="text-[var(--text-muted)] mb-8 max-w-sm mx-auto">It looks empty here. {activeTab !== 'history' ? `Start by creating your first ${activeTab === 'designs' ? 'certificate design' : 'email template'}.` : 'You haven\'t issued any certificates yet.'}</p>
                        {activeTab !== 'history' && (
                            <button
                                onClick={() => activeTab === 'designs' ? navigate('/generate') : openTemplateModal()}
                                className="text-violet-400 hover:text-violet-300 font-bold underline underline-offset-4 transition-colors"
                            >
                                Create New
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {activeTab === 'history' ? (
                            <div className="col-span-full bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/5">
                                                <th className="px-8 py-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-white/10">Date</th>
                                                <th className="px-8 py-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-white/10">Design</th>
                                                <th className="px-8 py-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-white/10">Total Sent</th>
                                                <th className="px-8 py-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-white/10">Destination</th>
                                                <th className="px-8 py-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-white/10 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredItems.map((record) => (
                                                <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-8 py-5 text-sm font-bold text-[var(--text-main)] border-b border-white/5">
                                                        {new Date(record.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="px-8 py-5 border-b border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
                                                                <LayoutTemplate size={14} className="text-violet-500" />
                                                            </div>
                                                            <span className="font-bold text-sm text-[var(--text-main)]">{record.design_name || 'Direct Generation'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 border-b border-white/5">
                                                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-violet-600/10 text-violet-500 rounded-full text-xs font-black">
                                                            <Users size={12} /> {record.total_sent}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-[var(--text-muted)] text-sm font-medium border-b border-white/5 truncate max-w-xs">
                                                        {record.recipient_list_ref || 'Individual Send'}
                                                    </td>
                                                    <td className="px-8 py-5 text-right border-b border-white/5">
                                                        <button className="p-2 hover:text-violet-500 transition-colors" title="View Details">
                                                            <ExternalLink size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : activeTab === 'corrections' ? (
                            <div className="col-span-full bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/5">
                                                <th className="px-8 py-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-white/10">Original Name</th>
                                                <th className="px-8 py-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-white/10">Requested Name</th>
                                                <th className="px-8 py-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-white/10">Cert ID</th>
                                                <th className="px-8 py-5 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-white/10 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredItems.map((record) => (
                                                <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-8 py-5 text-sm font-bold text-[var(--text-muted)] border-b border-white/5">
                                                        {record.recipientName}
                                                    </td>
                                                    <td className="px-8 py-5 border-b border-white/5">
                                                        <span className="font-black text-sm text-violet-500">{record.requestedName}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-[var(--text-muted)] text-xs font-medium border-b border-white/5">
                                                        {record.certId}
                                                    </td>
                                                    <td className="px-8 py-5 text-right border-b border-white/5 space-x-2">
                                                        <button
                                                            onClick={() => handleCorrectionAction(record.id, 'approve')}
                                                            className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                                                            title="Approve & Update Certificate"
                                                        >
                                                            <UserCheck size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleCorrectionAction(record.id, 'reject')}
                                                            className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                                            title="Reject Request"
                                                        >
                                                            <UserX size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : filteredItems.map((item) => (
                            <div key={item.id} className="group bg-[var(--bg-card)] rounded-3xl border border-[var(--border-muted)] overflow-hidden hover:shadow-2xl hover:shadow-violet-900/10 hover:border-violet-500/30 transition-all duration-300 flex flex-col">
                                {activeTab === 'designs' ? (
                                    <div className="aspect-video bg-slate-900 relative overflow-hidden">
                                        {item.preview_url ? (
                                            <img
                                                src={item.preview_url}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                <LayoutTemplate className="text-slate-600" size={32} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                            <button
                                                onClick={() => navigate('/generate', { state: { loadDesign: item } })}
                                                className="p-3 bg-white text-slate-900 rounded-xl hover:scale-110 active:scale-95 transition-transform shadow-lg"
                                                title="Edit Design"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleClone(item.id)}
                                                className="p-3 bg-emerald-500 text-white rounded-xl hover:scale-110 active:scale-95 transition-transform shadow-lg"
                                                title="Clone Design"
                                            >
                                                <Copy size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id, 'designs')}
                                                className="p-3 bg-red-500 text-white rounded-xl hover:scale-110 active:scale-95 transition-transform shadow-lg"
                                                title="Delete Design"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // Email Template Card
                                    <div className="p-6 flex-1 flex flex-col relative">
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <button
                                                onClick={() => openTemplateModal(item)}
                                                className="p-2 bg-[var(--bg-input)] hover:bg-violet-500 hover:text-white rounded-lg transition-colors border border-[var(--border-muted)]"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id, 'email-templates')}
                                                className="p-2 bg-[var(--bg-input)] hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-[var(--border-muted)]"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
                                            <Mail className="text-violet-500" size={20} />
                                        </div>
                                        <h3 className="font-excep font-black text-lg text-[var(--text-heading)] mb-1 truncate pr-8">{item.name}</h3>
                                        <p className="text-xs text-[var(--text-muted)] font-bold mb-4 line-clamp-1">Subject: {item.subject}</p>
                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                            {item.is_default && (
                                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest border border-emerald-500/20">Default</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'designs' && (
                                    <div className="p-5 border-t border-[var(--border-muted)]">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-lg text-[var(--text-heading)] truncate pr-2">{item.name}</h3>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(item.id);
                                                    alert('Design ID Copied! 📋');
                                                }}
                                                className="shrink-0 flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-input)] hover:bg-violet-500 hover:text-white text-[var(--text-muted)] rounded-lg text-[10px] font-mono border border-[var(--border-muted)] transition-all"
                                                title="Copy Design ID"
                                            >
                                                ID: {item.id ? item.id.substring(0, 6) : '...'}
                                                <Copy size={10} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                                            Edited {new Date(item.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Email Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] w-full max-w-2xl rounded-3xl shadow-2xl border border-[var(--glass-border)] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-[var(--border-muted)] flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">
                                    {editingTemplate ? 'Edit Template' : 'New Email Template'}
                                </h2>
                                {!editingTemplate && (
                                    <button
                                        onClick={() => setShowAiModal(true)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 text-violet-500 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-violet-500 hover:text-white transition-all shadow-sm active:scale-95"
                                    >
                                        <Wand2 size={14} />
                                        Magic AI
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setShowTemplateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div>
                                <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Template Name</label>
                                <input
                                    type="text"
                                    value={templateForm.name}
                                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                    placeholder="e.g. Winner Notification"
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-3 px-4 outline-none focus:border-violet-500 transition-colors font-medium text-[var(--text-main)]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Email Subject</label>
                                <input
                                    type="text"
                                    value={templateForm.subject}
                                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                                    placeholder="e.g. Congratulations {{name}}!"
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-3 px-4 outline-none focus:border-violet-500 transition-colors font-medium text-[var(--text-main)]"
                                />
                                <p className="text-[10px] text-[var(--text-muted)] mt-1 ml-1">Use {'{{name}}'} or {'{{event}}'} variables.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Email Body</label>
                                <div className="bg-[var(--bg-input)] rounded-xl overflow-hidden border border-[var(--border-interactive)] focus-within:border-violet-500 transition-colors text-slate-900">
                                    <ReactQuill
                                        theme="snow"
                                        value={templateForm.bodyHtml}
                                        onChange={(content) => setTemplateForm({ ...templateForm, bodyHtml: content })}
                                        className="bg-white min-h-[200px]"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={templateForm.isDefault}
                                    onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                />
                                <label htmlFor="isDefault" className="text-sm font-bold text-[var(--text-main)]">Set as default template</label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[var(--border-muted)] flex justify-end gap-4">
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="px-6 py-3 rounded-xl font-bold text-[var(--text-muted)] hover:bg-[var(--bg-input)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveTemplate}
                                className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-violet-600/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Save size={18} />
                                {editingTemplate?.is_system ? 'Save as Personal Template' : editingTemplate ? 'Update Template' : 'Save Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SMTP Guide Modal */}
            {showSmtpGuide && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-[var(--border-muted)] flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="p-8 border-b border-[var(--border-muted)] flex justify-between items-center bg-emerald-500/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center">
                                    <Info size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">SMTP Setup Guide</h2>
                            </div>
                            <button onClick={() => setShowSmtpGuide(false)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                            <section className="space-y-4">
                                <h3 className="text-lg font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                    <Globe size={18} /> 1. Professional Appearance
                                </h3>
                                <div className="bg-[var(--bg-input)] p-6 rounded-3xl border border-[var(--border-muted)]">
                                    <p className="text-[var(--text-main)] font-bold leading-relaxed">
                                        Currently, certificates come from <code className="text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded">no-reply@certiflow.com</code>. Once you set your own SMTP:
                                    </p>
                                    <ul className="mt-4 space-y-2 text-[var(--text-muted)] font-medium">
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            <span className="font-bold">From:</span> awards@yourcompany.com
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            <span className="font-bold">Sender Name:</span> Your Organization Name
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-lg font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                    <Shield size={18} /> 2. Avoiding Spam Filters
                                </h3>
                                <p className="text-[var(--text-muted)] font-bold leading-relaxed pl-7">
                                    System emails often get flagged as "Promotions". By using your official mail server, you achieve a <span className="text-emerald-500">100% inbox delivery rate</span>.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-lg font-black text-violet-500 uppercase tracking-widest flex items-center gap-2">
                                    <Lock size={18} /> How to get your SMTP Password
                                </h3>
                                <div className="bg-[var(--bg-input)] p-6 rounded-3xl border border-[var(--border-muted)] space-y-4">
                                    <p className="text-xs text-[var(--text-muted)] font-bold italic">For security, major providers (Gmail, Outlook) require an <span className="text-violet-500 underline underline-offset-4 decoration-violet-500/30">App Password</span> instead of your regular one.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                            <p className="text-xs font-black text-emerald-500 mb-2 uppercase tracking-[0.1em]">Google / Gmail</p>
                                            <ol className="text-[11px] text-[var(--text-muted)] font-bold space-y-1">
                                                <li>1. Enable <span className="text-[var(--text-main)]">2-Step Verification</span>.</li>
                                                <li>2. Search for <span className="text-[var(--text-main)]">"App Passwords"</span> in Security.</li>
                                                <li>3. Create one and use that 16-digit code here.</li>
                                            </ol>
                                        </div>
                                        <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                            <p className="text-xs font-black text-blue-500 mb-2 uppercase tracking-[0.1em]">Outlook / Microsoft</p>
                                            <ol className="text-[11px] text-[var(--text-muted)] font-bold space-y-1">
                                                <li>1. Go to <span className="text-[var(--text-main)]">Security Basics</span>.</li>
                                                <li>2. Select <span className="text-[var(--text-main)]">Advanced Security Options</span>.</li>
                                                <li>3. Click <span className="text-[var(--text-main)]">Create a new app password</span>.</li>
                                            </ol>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-[10px] text-[var(--text-muted)] font-bold flex items-center gap-2">
                                            <Info size={12} className="text-violet-500" />
                                            Don't worry, your credentials are <span className="text-violet-500">AES-256 Encrypted</span> on our server.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-lg font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                    <Zap size={18} /> 3. How it Works
                                </h3>
                                <div className="space-y-4 pl-7">
                                    <div className="relative border-l-2 border-emerald-500/30 pl-6 space-y-6">
                                        <div>
                                            <p className="font-black text-[var(--text-heading)]">Step A: One-Time Setup</p>
                                            <p className="text-sm text-[var(--text-muted)] font-medium">Enter your details. (e.g., Gmail uses host <code className="text-violet-500">smtp.gmail.com</code>, port <code className="text-violet-500">587</code> + "App Password")</p>
                                        </div>
                                        <div>
                                            <p className="font-black text-[var(--text-heading)]">Step B: Automatic Usage</p>
                                            <p className="text-sm text-[var(--text-muted)] font-medium">Click "Issue & Mail" – CertiFlow logs into your server and sends the files instantly.</p>
                                        </div>
                                        <div>
                                            <p className="font-black text-[var(--text-heading)]">Step C: Tracking</p>
                                            <p className="text-sm text-[var(--text-muted)] font-medium">You can see sent emails directly in your provider's "Sent" folder.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="bg-violet-600/10 p-6 rounded-3xl border border-violet-500/20 flex items-start gap-4">
                                <Shield className="text-violet-500 mt-1 shrink-0" size={20} />
                                <div>
                                    <p className="font-black text-violet-500 text-sm italic">Encryption Shield Active</p>
                                    <p className="text-xs text-[var(--text-muted)] font-bold mt-1">Your SMTP credentials are encrypted with AES-256 before being stored. Only the mail server ever sees your password.</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 border-t border-[var(--border-muted)] bg-[var(--bg-input)]/50 flex justify-end">
                            <button
                                onClick={() => setShowSmtpGuide(false)}
                                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                            >
                                Got it, thanks!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Suggestion Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-[var(--border-muted)] overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-white/5 bg-violet-500/5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-violet-600 text-white rounded-xl">
                                    <Sparkles size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">AI Content Assistant</h2>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] font-bold">Describe your event and our AI will draft the perfect template.</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] px-1">Describe your event</label>
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="e.g. A 3-day React workshop for beginners hosted by Google Developer Group. Focus on 'Mastering Hooks'."
                                    className="w-full bg-[var(--bg-input)] border border-white/5 rounded-2xl py-4 px-5 text-[var(--text-main)] outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium min-h-[120px] resize-none"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowAiModal(false)}
                                    className="flex-1 px-8 py-4 rounded-2xl font-black text-[var(--text-muted)] hover:bg-[var(--bg-input)] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAiSuggest}
                                    disabled={aiGenerating || !aiPrompt}
                                    className="flex-[2] bg-violet-600 hover:bg-violet-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-violet-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
                                >
                                    {aiGenerating ? (
                                        <Loader className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            Generate Content
                                            <Wand2 size={18} className="group-hover:rotate-12 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Developer Guide Modal */}
            <DeveloperGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

            <Footer />
        </div>
    );
};

export default Dashboard;
