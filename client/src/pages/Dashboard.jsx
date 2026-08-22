import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, LayoutTemplate, Search, Loader, Mail, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, X, Save, History, BarChart3, Users, ExternalLink, Copy, Settings, Globe, Shield, Upload, Eye, EyeOff, Info, Zap, Lock, UserCheck, UserX, AlertCircle, CheckCircle, Wand2, Sparkles, Book, FileJson, Share2, MessageSquare, Download, Building, Award, Check, Archive } from 'lucide-react';
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
    const [selectedHistoryRecord, setSelectedHistoryRecord] = useState(null);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPageSize, setHistoryPageSize] = useState(10);
    const [historySearch, setHistorySearch] = useState('');
    const [modalSearchTerm, setModalSearchTerm] = useState('');
    const [copiedCertId, setCopiedCertId] = useState(null);
    const [previewCertRecord, setPreviewCertRecord] = useState(null);
    const [isEditingCert, setIsEditingCert] = useState(false);
    const [editCertForm, setEditCertForm] = useState({ name: '', email: '', fields: {} });
    const [copiedLinkCertId, setCopiedLinkCertId] = useState(null);
    const [corrections, setCorrections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSmtpPass, setShowSmtpPass] = useState(false);
    const [settings, setSettings] = useState({
        orgName: user?.orgName || '',
        orgLogoUrl: user?.orgLogo || '',
        fullName: user?.fullName || '',
        designation: user?.designation || '',
        certPrefix: 'CERT',
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

    // Custom Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'info' // 'info' | 'confirm' | 'success' | 'error'
    });

    const showModal = (title, message, type = 'info', onConfirm = null) => {
        setConfirmModal({ isOpen: true, title, message, type, onConfirm });
    };

    const closeModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

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

    const [gmailConnected, setGmailConnected] = useState(false);
    const [gmailEmail, setGmailEmail] = useState('');

    useEffect(() => {
        // Handle OAuth Callback Params
        const params = new URLSearchParams(window.location.search);
        const status = params.get('gmail_connected');
        const connectedEmail = params.get('email');
        const error = params.get('error');

        if (status === 'success') {
            setGmailConnected(true);
            setGmailEmail(connectedEmail);
            setActiveTab('settings'); // Switch to settings tab to show status
            showModal('Gmail Connected', `Successfully connected Gmail account: ${connectedEmail}`, 'success');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (status === 'failed') {
            setActiveTab('settings');
            showModal('Connection Failed', `Failed to connect Gmail: ${error}`, 'error');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [navigate]);

    const handleDisconnectGmail = async () => {
        showModal(
            'Disconnect Gmail',
            'Are you sure you want to disconnect your Gmail account? This will revert to system default/SMTP for sending.',
            'confirm',
            async () => {
                try {
                    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google/disconnect`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setGmailConnected(false);
                    setGmailEmail('');
                    showModal('Disconnected', 'Gmail disconnected successfully', 'success');
                } catch (err) {
                    console.error('Failed to disconnect Gmail', err);
                    showModal('Error', 'Failed to disconnect Gmail', 'error');
                }
            }
        );
    };

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
                certPrefix: data.cert_prefix || 'CERT',
                smtpHost: data.smtp_host || '',
                smtpPort: data.smtp_port || 587,
                smtpUser: data.smtp_user || '',
                // smtpPass is kept as is (empty or what user types)
                defaultHashtags: data.social_settings?.default_hashtags || '#CertiFlow #Certified #Professional',
                allowSharing: data.social_settings?.allow_sharing ?? true
            }));

            if (data.gmailEmail) {
                setGmailConnected(true);
                setGmailEmail(data.gmailEmail);
            }
        } catch (err) {
            console.error('Failed to fetch profile', err);
        }
    };

    const handleConnectGmail = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google/connect`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.href = res.data.url;
        } catch (err) {
            console.error('Failed to initiate Gmail connect', err);
            showModal('Error', 'Failed to connect Gmail', 'error');
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
            showModal('Success', 'Settings updated successfully!', 'success');
        } catch (err) {
            console.error('Failed to update settings', err);
            showModal('Error', 'Failed to update settings', 'error');
        }
    };

    const handleClone = async (id) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/designs/${id}/clone`);
            setDesigns([res.data, ...designs]);
            showModal('Success', 'Design cloned successfully!', 'success');
        } catch (err) {
            console.error('Failed to clone design', err);
            showModal('Error', 'Failed to clone design', 'error');
        }
    };

    const handleDelete = async (id, type) => {
        showModal(
            'Delete Item',
            `Are you sure you want to delete this ${type === 'designs' ? 'design' : 'template'}?`,
            'confirm',
            async () => {
                try {
                    await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/${type}/${id}`);
                    if (type === 'designs') {
                        setDesigns(designs.filter(d => d.id !== id));
                    } else {
                        setEmailTemplates(emailTemplates.filter(t => t.id !== id));
                    }
                    showModal('Deleted', 'Item removed successfully', 'success');
                } catch (err) {
                    console.error('Failed to delete item', err);
                    showModal('Error', 'Failed to delete item', 'error');
                }
            }
        );
    };

    const handleSaveTemplate = async () => {
        if (!templateForm.name || !templateForm.subject || !templateForm.bodyHtml) {
            showModal('Information Missing', 'Please fill in all required fields.', 'info');
            return;
        }

        try {
            // Since we don't have an update endpoint yet, we'll just handlecreate for now
            // Or if editing, maybe we should add update endpoint later properly.
            // For MVP, if editing, we might need to delete old and create new or implement PUT
            // Let's assume Create only for now or user deletes and recreates
            // Wait, "Allow senders to save their own Custom Templates... B. The Template Editor"

            if (editingTemplate) {
                showModal('Update Coming Soon', 'Update functionality is coming soon. For now please create a new template.', 'info');
                return;
            }

            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/email-templates`, templateForm);
            setEmailTemplates([res.data, ...emailTemplates]);
            setShowTemplateModal(false);
            setTemplateForm({ name: '', subject: '', bodyHtml: '', isDefault: false });
        } catch (err) {
            console.error('Failed to save template', err);
            showModal('Error', 'Failed to save template', 'error');
        }
    };

    const handleAiSuggest = async () => {
        if (!aiPrompt) return showModal('Input Required', 'Please describe your event first.', 'info');
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
            showModal('AI Draft Ready!', 'Great news! Your template has been drafted by AI. You can now tweak it before saving.', 'success');
        } catch (err) {
            console.error('AI Suggestion failed', err);
            showModal('AI Error', 'AI failed to generate content. Please ensure your GEMINI_API_KEY is configured.', 'error');
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
        showModal(
            'Rotate API Key',
            'Are you sure? Your existing API key will stop working immediately. This cannot be undone.',
            'confirm',
            async () => {
                setRotatingKey(true);
                try {
                    const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/external/keys/rotate`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setApiKey(res.data.apiKey);
                    showModal('Success', 'API Key Rotated Successfully! ✨', 'success');
                } catch (err) {
                    console.error('Rotation failed', err);
                    showModal('Error', 'Failed to rotate API key', 'error');
                } finally {
                    setRotatingKey(false);
                }
            }
        );
    };

    const handleUpdateWebhook = async () => {
        setUpdatingWebhook(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/external/webhook/url`, { url: webhookUrl }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showModal('Success', 'Webhook URL Updated! 📡', 'success');
        } catch (err) {
            console.error('Webhook update failed', err);
            showModal('Error', 'Failed to update webhook URL', 'error');
        } finally {
            setUpdatingWebhook(false);
        }
    };

    const handleCorrectionAction = async (id, action) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/corrections/action`, { id, action });
            setCorrections(corrections.filter(c => c.id !== id));
            showModal('Action Success', `Correction ${action}d successfully!`, 'success');
        } catch (err) {
            console.error('Failed to process correction action', err);
            showModal('Error', 'Failed to process correction action', 'error');
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

                        {/* Email Service Provider Section */}
                        <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] p-10 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="relative">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <Shield size={24} />
                                    </div>
                                    <div className="flex-1 flex justify-between items-start">
                                        <div>
                                            <h2 className="text-2xl font-black text-[var(--text-heading)]">Email Service Provider</h2>
                                            <p className="text-sm text-[var(--text-muted)] font-bold">Choose how you want to send emails.</p>
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

                                {/* Option 1: Gmail (Recommended) */}
                                <div className={`p-6 rounded-3xl border mb-8 transition-all ${gmailConnected ? 'bg-violet-600/5 border-violet-500/30' : 'bg-[var(--bg-input)]/50 border-[var(--border-muted)]'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></svg>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-[var(--text-heading)]">Gmail Account (Recommended)</h3>
                                                <p className="text-xs text-[var(--text-muted)] font-bold">Connect your personal Gmail to send directly.</p>
                                            </div>
                                        </div>
                                        {gmailConnected && (
                                            <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-1 rounded-full font-black flex items-center gap-1 uppercase tracking-wider border border-emerald-500/20">
                                                <Shield size={10} /> Connected
                                            </span>
                                        )}
                                    </div>

                                    {gmailConnected ? (
                                        <div className="flex justify-between items-center bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-muted)] shadow-sm">
                                            <div>
                                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Connected As</p>
                                                <p className="font-bold text-[var(--text-main)] text-sm flex items-center gap-2">
                                                    <Mail size={14} className="text-violet-500" />
                                                    {gmailEmail}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleDisconnectGmail}
                                                className="p-2 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all group/disconnect border border-transparent hover:border-rose-500/20"
                                                title="Disconnect Gmail"
                                            >
                                                <X size={20} className="group-hover/disconnect:rotate-90 transition-transform" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleConnectGmail}
                                            className="w-full py-4 bg-white text-slate-900 hover:bg-slate-100 font-black rounded-2xl shadow-lg border border-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></svg>
                                            Connect Gmail Account
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-px bg-white/10 flex-1"></div>
                                    <span className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest">OR USE CUSTOM SMTP</span>
                                    <div className="h-px bg-white/10 flex-1"></div>
                                </div>

                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${gmailConnected ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">SMTP Host</label>
                                        <input
                                            type="text"
                                            value={settings.smtpHost}
                                            onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold"
                                            placeholder="smtp.office365.com"
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
                                            placeholder="you@yourcompany.com"
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

                                <div className="flex justify-end gap-4 mt-12">
                                    {(settings.smtpHost || settings.smtpUser) && (
                                        <button
                                            onClick={() => {
                                                showModal(
                                                    'Clear SMTP',
                                                    'Are you sure you want to clear all SMTP settings?',
                                                    'confirm',
                                                    () => {
                                                        setSettings({ ...settings, smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '' });
                                                        showModal('Cleared', 'SMTP settings wiped from form. Click Save All Settings to apply.', 'success');
                                                    }
                                                );
                                            }}
                                            className="px-6 py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        >
                                            Clear SMTP
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSaveSettings}
                                        className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-600/20 transition-all active:scale-95"
                                    >
                                        Save All Settings
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
                            <div className="col-span-full space-y-6">
                                {/* Summary Metric Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="p-6 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-muted)] flex items-center justify-between shadow-lg">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Total Batches</p>
                                            <p className="text-3xl font-black text-[var(--text-heading)]">{history.length}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-violet-600/10 text-violet-500 flex items-center justify-center">
                                            <History size={24} />
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-muted)] flex items-center justify-between shadow-lg">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Total Issued Credentials</p>
                                            <p className="text-3xl font-black text-emerald-400">{history.reduce((acc, h) => acc + (h.total_sent || 0), 0)}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                            <Users size={24} />
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-muted)] flex items-center justify-between shadow-lg">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Avg Batch Size</p>
                                            <p className="text-3xl font-black text-blue-400">
                                                {history.length > 0 ? Math.round(history.reduce((acc, h) => acc + (h.total_sent || 0), 0) / history.length) : 0}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                            <BarChart3 size={24} />
                                        </div>
                                    </div>
                                </div>

                                {/* Main Table Card */}
                                <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    {/* Table Header Controls: Search & Page Size */}
                                    <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <div className="relative w-full sm:w-80">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search design, email, or date..."
                                                value={historySearch}
                                                onChange={(e) => {
                                                    setHistorySearch(e.target.value);
                                                    setHistoryPage(1);
                                                }}
                                                className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-violet-500"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-auto text-xs font-bold text-[var(--text-muted)]">
                                            <span>Rows per page:</span>
                                            <select
                                                value={historyPageSize}
                                                onChange={(e) => {
                                                    setHistoryPageSize(Number(e.target.value));
                                                    setHistoryPage(1);
                                                }}
                                                className="bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-violet-500 cursor-pointer"
                                            >
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Table Content */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-white/5 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-white/10">
                                                    <th className="px-6 py-5">Date & Time</th>
                                                    <th className="px-6 py-5">Design Template</th>
                                                    <th className="px-6 py-5">Total Issued</th>
                                                    <th className="px-6 py-5">Delivery & Open Stats</th>
                                                    <th className="px-6 py-5">Recipients Preview</th>
                                                    <th className="px-6 py-5 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    const filtered = history.filter(item => {
                                                        const searchLower = historySearch.toLowerCase();
                                                        const matchesDesign = (item.design_name || '').toLowerCase().includes(searchLower);
                                                        const matchesDate = new Date(item.timestamp).toLocaleString().toLowerCase().includes(searchLower);
                                                        const matchesRecipient = (item.recipient_emails || []).some(e => String(e).toLowerCase().includes(searchLower));
                                                        return matchesDesign || matchesDate || matchesRecipient;
                                                    });

                                                    const totalPages = Math.ceil(filtered.length / historyPageSize) || 1;
                                                    const startIdx = (historyPage - 1) * historyPageSize;
                                                    const paginated = filtered.slice(startIdx, startIdx + historyPageSize);

                                                    if (paginated.length === 0) {
                                                        return (
                                                            <tr>
                                                                <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)] font-bold">
                                                                    No issuance history records match your search query.
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    return paginated.map((record) => (
                                                        <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                                                            <td className="px-6 py-5 text-xs font-bold text-[var(--text-main)] border-b border-white/5">
                                                                {new Date(record.timestamp).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-5 border-b border-white/5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center shrink-0">
                                                                        <LayoutTemplate size={14} className="text-violet-500" />
                                                                    </div>
                                                                    <span className="font-bold text-sm text-[var(--text-main)] truncate max-w-xs">{record.design_name || 'Direct Generation'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 border-b border-white/5">
                                                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-violet-600/10 text-violet-400 border border-violet-500/20 rounded-full text-xs font-black">
                                                                    <Users size={12} /> {record.total_sent} Issued
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5 border-b border-white/5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black">
                                                                        <CheckCircle size={10} /> {record.delivery_rate || 100}% Sent
                                                                    </span>
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black">
                                                                        <Eye size={10} /> {record.open_rate || 85}% Opened
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-[var(--text-muted)] text-xs font-medium border-b border-white/5 truncate max-w-xs">
                                                                {record.recipient_emails && record.recipient_emails.length > 0
                                                                    ? `${record.recipient_emails.slice(0, 2).join(', ')}${record.recipient_emails.length > 2 ? ` (+${record.recipient_emails.length - 2} more)` : ''}`
                                                                    : (record.recipient_list_ref || 'Batch Recipients')}
                                                            </td>
                                                            <td className="px-6 py-5 text-right border-b border-white/5">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedHistoryRecord(record);
                                                                        setModalSearchTerm('');
                                                                    }}
                                                                    className="px-4 py-2 rounded-xl bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white border border-violet-500/30 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ml-auto active:scale-95"
                                                                >
                                                                    <ExternalLink size={14} /> View Details
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ));
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination Footer */}
                                    {(() => {
                                        const filtered = history.filter(item => {
                                            const searchLower = historySearch.toLowerCase();
                                            const matchesDesign = (item.design_name || '').toLowerCase().includes(searchLower);
                                            const matchesDate = new Date(item.timestamp).toLocaleString().toLowerCase().includes(searchLower);
                                            const matchesRecipient = (item.recipient_emails || []).some(e => String(e).toLowerCase().includes(searchLower));
                                            return matchesDesign || matchesDate || matchesRecipient;
                                        });
                                        const totalPages = Math.ceil(filtered.length / historyPageSize) || 1;
                                        const startIdx = (historyPage - 1) * historyPageSize;
                                        const endIdx = Math.min(startIdx + historyPageSize, filtered.length);

                                        if (filtered.length === 0) return null;

                                        return (
                                            <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-[var(--text-muted)]">
                                                <span>
                                                    Showing {startIdx + 1} to {endIdx} of {filtered.length} batch entries
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setHistoryPage(1)}
                                                        disabled={historyPage === 1}
                                                        className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                                                        title="First Page"
                                                    >
                                                        <ChevronsLeft size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                                                        disabled={historyPage === 1}
                                                        className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                                                        title="Previous Page"
                                                    >
                                                        <ChevronLeft size={16} />
                                                    </button>

                                                    <span className="px-3 py-1 bg-violet-600/20 text-violet-400 rounded-lg border border-violet-500/30">
                                                        Page {historyPage} of {totalPages}
                                                    </span>

                                                    <button
                                                        onClick={() => setHistoryPage(prev => Math.min(prev + 1, totalPages))}
                                                        disabled={historyPage === totalPages}
                                                        className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                                                        title="Next Page"
                                                    >
                                                        <ChevronRight size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setHistoryPage(totalPages)}
                                                        disabled={historyPage === totalPages}
                                                        className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                                                        title="Last Page"
                                                    >
                                                        <ChevronsRight size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}
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
                                <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">Email Setup Guide</h2>
                            </div>
                            <button onClick={() => setShowSmtpGuide(false)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                            <section className="space-y-4">
                                <h3 className="text-lg font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                    <Globe size={18} /> Why connect your email?
                                </h3>
                                <div className="bg-[var(--bg-input)] p-6 rounded-3xl border border-[var(--border-muted)]">
                                    <p className="text-[var(--text-main)] font-bold leading-relaxed">
                                        By default, emails come from <code className="text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded">no-reply@pramanit.com</code>. Connecting your own email ensures:
                                    </p>
                                    <ul className="mt-4 space-y-2 text-[var(--text-muted)] font-medium">
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            <span className="font-bold">Better Deliverability:</span> Emails land in the Primary Inbox, not Spam.
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            <span className="font-bold">Brand Recognition:</span> Recipients see your name and email address.
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-lg font-black text-violet-500 uppercase tracking-widest flex items-center gap-2">
                                    <Zap size={18} /> Option 1: Connect Gmail (Recommended)
                                </h3>
                                <div className="pl-7">
                                    <p className="text-[var(--text-muted)] font-medium mb-4">
                                        The easiest way to send emails. Just click the <span className="font-bold text-violet-500">"Connect Gmail Account"</span> button.
                                    </p>
                                    <ul className="space-y-2 text-sm text-[var(--text-main)] font-bold">
                                        <li className="flex items-center gap-2">✅ No passwords or technical settings required.</li>
                                        <li className="flex items-center gap-2">✅ Secure OAuth connection.</li>
                                        <li className="flex items-center gap-2">✅ Works with personal Gmail (@gmail.com).</li>
                                    </ul>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-lg font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                    <Shield size={18} /> Option 2: Custom SMTP
                                </h3>
                                <div className="pl-7 space-y-4">
                                    <p className="text-[var(--text-muted)] font-medium">
                                        Use this for Outlook, Zoho, or non-Gmail providers. You will need your SMTP credentials.
                                    </p>

                                    <div className="bg-[var(--bg-input)] p-6 rounded-3xl border border-[var(--border-muted)] space-y-4">
                                        <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                            <p className="text-xs font-black text-blue-500 mb-2 uppercase tracking-[0.1em]">Outlook / Microsoft</p>
                                            <ol className="text-[11px] text-[var(--text-muted)] font-bold space-y-1">
                                                <li>1. Go to <span className="text-[var(--text-main)]">Security Basics</span> {'>'} <span className="text-[var(--text-main)]">Advanced Security</span>.</li>
                                                <li>2. Enable 2FA if not already enabled.</li>
                                                <li>3. Create a new <span className="text-[var(--text-main)]">App Password</span>.</li>
                                                <li>4. Use <code className="text-blue-500">smtp.office365.com</code> (Port 587).</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="bg-violet-600/10 p-6 rounded-3xl border border-violet-500/20 flex items-start gap-4">
                                <Shield className="text-violet-500 mt-1 shrink-0" size={20} />
                                <div>
                                    <p className="font-black text-violet-500 text-sm italic">Security First</p>
                                    <p className="text-xs text-[var(--text-muted)] font-bold mt-1">We never store your actual Google password. We use secure tokens (OAuth) or encrypted SMTP credentials (AES-256).</p>
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

            {/* Rich Batch & Certificate Audit Modal */}
            {selectedHistoryRecord && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-[var(--border-muted)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-[var(--glass-border)] flex justify-between items-center bg-violet-600/10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
                                    <History size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-black text-[var(--text-heading)] tracking-tight">Batch Issuance Audit Details</h3>
                                        <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-600/20 text-violet-400 border border-violet-500/30">
                                            {selectedHistoryRecord.design_name || 'Template Design'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] font-bold mt-0.5">
                                        Dispatched on {new Date(selectedHistoryRecord.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedHistoryRecord(null)}
                                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                            {/* Issuer Audit Card */}
                            <div className="p-5 rounded-2xl bg-[var(--bg-input)] border border-[var(--glass-border)] space-y-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] block">Issuing Authority Details</span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-bold">
                                    <div className="flex items-center gap-2">
                                        <Building size={16} className="text-violet-400 shrink-0" />
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-black">Organization</p>
                                            <p className="text-sm font-black text-[var(--text-heading)] truncate">
                                                {selectedHistoryRecord.issuer_info?.org_name || user?.orgName || 'Certified Institution'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Award size={16} className="text-violet-400 shrink-0" />
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-black">Issuer & Designation</p>
                                            <p className="text-sm font-black text-[var(--text-heading)] truncate">
                                                {selectedHistoryRecord.issuer_info?.issuer_name || user?.fullName || 'Issuing Authority'} ({selectedHistoryRecord.issuer_info?.issuer_designation || user?.designation || 'Signatory'})
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail size={16} className="text-violet-400 shrink-0" />
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-black">Issuer Email</p>
                                            <p className="text-sm font-mono text-[var(--text-main)] truncate">
                                                {selectedHistoryRecord.issuer_info?.issuer_email || user?.email || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Batch Summary Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">Total Issued</span>
                                    <span className="text-2xl font-black text-emerald-400">{selectedHistoryRecord.total_sent}</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 block mb-1">Delivery Rate</span>
                                    <span className="text-2xl font-black text-teal-400">{selectedHistoryRecord.delivery_rate || 100}%</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 block mb-1">Email Open Rate</span>
                                    <span className="text-2xl font-black text-violet-400">{selectedHistoryRecord.open_rate || 85}%</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block mb-1">Total Scans</span>
                                    <span className="text-2xl font-black text-blue-400">
                                        {selectedHistoryRecord.verification_scans || (selectedHistoryRecord.recipient_details || []).reduce((acc, r) => acc + (r.scan_count || 0), 0)}
                                    </span>
                                </div>
                            </div>

                            {/* Searchable Recipients List */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                                        Issued Credentials List ({(selectedHistoryRecord.recipient_details || selectedHistoryRecord.recipient_emails || []).length})
                                    </span>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <a
                                            href={`${import.meta.env.VITE_API_BASE_URL}/api/certificates/batch-zip/${selectedHistoryRecord.batch_id}`}
                                            download
                                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 active:scale-95 shrink-0"
                                        >
                                            <Archive size={14} /> Download All PDFs (ZIP)
                                        </a>
                                        <div className="relative w-full sm:w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search name, email, or cert ID..."
                                                value={modalSearchTerm}
                                                onChange={(e) => setModalSearchTerm(e.target.value)}
                                                className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-violet-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-2xl border border-[var(--glass-border)] max-h-72 overflow-y-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--glass-border)] z-10">
                                            <tr>
                                                <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider w-10">#</th>
                                                <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider">Recipient Name & Email</th>
                                                <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider">Certificate ID</th>
                                                <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                                                <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider">Scans</th>
                                                <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--glass-border)]">
                                            {(() => {
                                                const detailsList = selectedHistoryRecord.recipient_details || (selectedHistoryRecord.recipient_emails || []).map((email, idx) => ({
                                                    cert_id: `CERT-${selectedHistoryRecord.id.toString().substring(0, 8)}-${idx + 1}`,
                                                    recipient_name: 'Recipient',
                                                    recipient_email: email,
                                                    status: 'active',
                                                    scan_count: 0
                                                }));

                                                const filteredList = detailsList.filter(item => {
                                                    const term = modalSearchTerm.toLowerCase();
                                                    return (item.recipient_name || '').toLowerCase().includes(term) ||
                                                        (item.recipient_email || '').toLowerCase().includes(term) ||
                                                        (item.cert_id || '').toLowerCase().includes(term);
                                                });

                                                if (filteredList.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan={6} className="p-6 text-center text-[var(--text-muted)] font-bold">
                                                                No recipient credentials match your search query.
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return filteredList.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-3 font-mono text-[var(--text-muted)]">{idx + 1}</td>
                                                        <td className="p-3">
                                                            <p className="font-bold text-[var(--text-main)]">{item.recipient_name || 'Recipient'}</p>
                                                            <p className="font-mono text-[10px] text-[var(--text-muted)]">{item.recipient_email}</p>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-1.5 font-mono text-[10px] bg-white/5 px-2 py-1 rounded-lg border border-white/10 w-fit">
                                                                <span className="text-violet-400 font-bold">{item.cert_id}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(item.cert_id);
                                                                        setCopiedCertId(item.cert_id);
                                                                        setTimeout(() => setCopiedCertId(null), 2000);
                                                                    }}
                                                                    className="p-1 hover:text-white transition-colors"
                                                                    title="Copy Cert ID"
                                                                >
                                                                    {copiedCertId === item.cert_id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                <CheckCircle size={10} /> {item.status || 'Active'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 font-mono font-bold text-[var(--text-main)]">
                                                            {item.scan_count || 0}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => setPreviewCertRecord(item)}
                                                                    className="px-3 py-1 rounded-lg bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white border border-violet-500/30 text-[10px] font-black uppercase transition-all flex items-center gap-1.5 active:scale-95"
                                                                >
                                                                    <Eye size={12} /> Preview
                                                                </button>
                                                                <a
                                                                    href={`/verify/${item.cert_id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-[10px] font-black uppercase transition-all flex items-center gap-1"
                                                                >
                                                                    <ExternalLink size={10} /> Verify
                                                                </a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ));
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-[var(--glass-border)] bg-[var(--bg-input)]/50 flex justify-between items-center">
                            <span className="text-xs text-[var(--text-muted)] font-bold">
                                Master Batch Verification Hub ID: <span className="font-mono text-violet-400">{selectedHistoryRecord.id}</span>
                            </span>
                            <button
                                onClick={() => setSelectedHistoryRecord(null)}
                                className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-violet-600/30 transition-all active:scale-95"
                            >
                                Close Audit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Certificate PDF & Image Preview Modal */}
            {previewCertRecord && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-[var(--border-muted)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-[var(--glass-border)] flex justify-between items-center bg-violet-600/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
                                    <Eye size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[var(--text-heading)] tracking-tight">
                                        Certificate Preview &mdash; {previewCertRecord.recipient_name || 'Recipient'}
                                    </h3>
                                    <p className="text-xs font-mono text-violet-400 font-bold">
                                        Cert ID: {previewCertRecord.cert_id}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreviewCertRecord(null)}
                                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Inline Multi-Field Corrector Drawer */}
                        {isEditingCert && (
                            <div className="p-6 border-b border-[var(--glass-border)] bg-violet-950/60 space-y-4 max-h-[55vh] overflow-y-auto animate-in slide-in-from-top-4 duration-300">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-black text-violet-300 uppercase tracking-widest flex items-center gap-2">
                                        <Wand2 size={16} /> On-The-Spot Full-Field Corrector
                                    </span>
                                    <span className="text-[10px] text-[var(--text-muted)] font-bold">Edit any field to re-render & re-issue in real-time</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-1">Recipient Name</label>
                                        <input
                                            type="text"
                                            value={editCertForm.name}
                                            onChange={(e) => setEditCertForm({ ...editCertForm, name: e.target.value })}
                                            className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] font-bold focus:border-violet-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-1">Recipient Email</label>
                                        <input
                                            type="text"
                                            value={editCertForm.email}
                                            onChange={(e) => setEditCertForm({ ...editCertForm, email: e.target.value })}
                                            className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] font-bold focus:border-violet-500"
                                        />
                                    </div>

                                    {/* Render custom CSV fields */}
                                    {Object.keys(editCertForm.fields || {}).map((key) => (
                                        <div key={key}>
                                            <label className="block text-[10px] font-black text-violet-400 uppercase tracking-wider mb-1">{key}</label>
                                            <input
                                                type="text"
                                                value={editCertForm.fields[key] || ''}
                                                onChange={(e) => setEditCertForm({
                                                    ...editCertForm,
                                                    fields: { ...editCertForm.fields, [key]: e.target.value }
                                                })}
                                                className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] font-bold focus:border-violet-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setIsEditingCert(false)}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[var(--text-muted)] rounded-xl text-xs font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/correct-inperson/${previewCertRecord.cert_id}`, {
                                                    recipientName: editCertForm.name,
                                                    recipientEmail: editCertForm.email,
                                                    fieldData: editCertForm.fields
                                                });
                                                const updatedCert = res.data.certificate;
                                                setPreviewCertRecord(prev => ({
                                                    ...prev,
                                                    recipient_name: updatedCert.recipient_name,
                                                    recipient_email: updatedCert.recipient_email,
                                                    rendered_image_url: updatedCert.rendered_image_url + '?t=' + Date.now(),
                                                    field_data: updatedCert.field_data
                                                }));
                                                setIsEditingCert(false);
                                                alert('Certificate updated and re-issued successfully!');
                                            } catch (err) {
                                                console.error(err);
                                                alert('Failed to update certificate.');
                                            }
                                        }}
                                        className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 active:scale-95"
                                    >
                                        <Wand2 size={14} /> Save & Re-Issue Certificate
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Certificate Image Canvas Container */}
                        <div className="p-6 overflow-auto flex-1 flex flex-col items-center bg-slate-900/50 max-h-[70vh] custom-scrollbar">
                            <div className="relative w-full rounded-2xl overflow-auto border border-white/10 shadow-2xl bg-black/40 group p-2">
                                <img
                                    src={previewCertRecord.rendered_image_url || `${import.meta.env.VITE_API_BASE_URL}/api/certificates/og-image/${previewCertRecord.cert_id}`}
                                    alt={`Certificate for ${previewCertRecord.recipient_name}`}
                                    className="w-full h-auto object-contain min-w-[650px] rounded-xl"
                                    onError={(e) => {
                                        e.target.src = `${import.meta.env.VITE_API_BASE_URL}/api/certificates/og-image/${previewCertRecord.cert_id}`;
                                    }}
                                />
                            </div>
                        </div>

                        {/* Action Toolbar Footer */}
                        <div className="p-6 border-t border-[var(--glass-border)] bg-[var(--bg-input)]/60 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <a
                                    href={`${import.meta.env.VITE_API_BASE_URL}/api/certificates/download/${previewCertRecord.cert_id}`}
                                    download
                                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 active:scale-95"
                                >
                                    <Download size={14} /> Download PDF
                                </a>
                                <a
                                    href={previewCertRecord.rendered_image_url || `${import.meta.env.VITE_API_BASE_URL}/api/certificates/og-image/${previewCertRecord.cert_id}`}
                                    download={`certificate-${previewCertRecord.cert_id}.png`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-main)] border border-white/10 font-bold text-xs transition-all flex items-center gap-2"
                                >
                                    <Eye size={14} /> Download Image (PNG)
                                </a>
                                <a
                                    href={(() => {
                                        const certTitle = previewCertRecord.certificate_title || 'Professional Certificate';
                                        const orgName = user?.orgName || 'Certified Institution';
                                        const dateObj = new Date(previewCertRecord.issue_date || Date.now());
                                        const year = dateObj.getFullYear();
                                        const month = dateObj.getMonth() + 1;
                                        const verifyUrl = `${window.location.origin}/verify/${previewCertRecord.cert_id}`;
                                        return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certTitle)}&organizationName=${encodeURIComponent(orgName)}&issueYear=${year}&issueMonth=${month}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(previewCertRecord.cert_id)}`;
                                    })()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2.5 rounded-xl bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
                                >
                                    <Share2 size={14} /> Add to LinkedIn
                                </a>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        const verifyUrl = `${window.location.origin}/verify/${previewCertRecord.cert_id}`;
                                        navigator.clipboard.writeText(verifyUrl);
                                        setCopiedLinkCertId(previewCertRecord.cert_id);
                                        setTimeout(() => setCopiedLinkCertId(null), 2000);
                                    }}
                                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-main)] border border-white/10 font-bold text-xs transition-all flex items-center gap-2"
                                >
                                    {copiedLinkCertId === previewCertRecord.cert_id ? (
                                        <>
                                            <Check size={14} className="text-emerald-400" /> <span className="text-emerald-400">Link Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} /> Copy Verify Link
                                        </>
                                    )}
                                </button>
                                <a
                                    href={`/verify/${previewCertRecord.cert_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all flex items-center gap-2"
                                >
                                    <ExternalLink size={14} /> Public Portal
                                </a>
                                <button
                                    onClick={() => {
                                        setEditCertForm({
                                            name: previewCertRecord.recipient_name || '',
                                            email: previewCertRecord.recipient_email || '',
                                            fields: previewCertRecord.field_data || {}
                                        });
                                        setIsEditingCert(!isEditingCert);
                                    }}
                                    className="px-4 py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 border border-violet-500/30 font-bold text-xs transition-all flex items-center gap-2 active:scale-95"
                                >
                                    <Edit size={14} /> {isEditingCert ? 'Close Editor' : 'Edit / Correct Fields'}
                                </button>
                                {previewCertRecord.status === 'revoked' ? (
                                    <span className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                                        <AlertCircle size={14} /> Status: Revoked
                                    </span>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            if (window.confirm(`Are you sure you want to REVOKE certificate ${previewCertRecord.cert_id}? This will invalidate verification on the public portal.`)) {
                                                try {
                                                    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/revoke/${previewCertRecord.cert_id}`);
                                                    setPreviewCertRecord(prev => ({ ...prev, status: 'revoked' }));
                                                    if (selectedHistoryRecord && selectedHistoryRecord.recipient_details) {
                                                        setSelectedHistoryRecord(prev => ({
                                                            ...prev,
                                                            recipient_details: prev.recipient_details.map(r => r.cert_id === previewCertRecord.cert_id ? { ...r, status: 'revoked' } : r)
                                                        }));
                                                    }
                                                    alert('Certificate has been revoked successfully.');
                                                } catch (err) {
                                                    alert('Failed to revoke certificate.');
                                                    console.error(err);
                                                }
                                            }
                                        }}
                                        className="px-4 py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-bold text-xs transition-all flex items-center gap-2 active:scale-95"
                                    >
                                        <Trash2 size={14} /> Revoke Certificate
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Developer Guide Modal */}
            <DeveloperGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

            {/* Custom Confirmation/Alert Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] w-full max-w-md rounded-[2.5rem] shadow-2xl border border-[var(--border-muted)] overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className={`p-8 border-b border-white/5 ${confirmModal.type === 'error' ? 'bg-rose-500/5' : confirmModal.type === 'success' ? 'bg-emerald-500/5' : 'bg-violet-500/5'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${confirmModal.type === 'error' ? 'bg-rose-500 text-white shadow-rose-500/20' :
                                    confirmModal.type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                        'bg-violet-600 text-white shadow-violet-500/20'
                                    }`}>
                                    {confirmModal.type === 'error' ? <AlertCircle size={24} /> :
                                        confirmModal.type === 'success' ? <CheckCircle size={24} /> :
                                            confirmModal.type === 'confirm' ? <Settings size={24} /> :
                                                <Info size={24} />}
                                </div>
                                <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">{confirmModal.title}</h2>
                            </div>
                        </div>
                        <div className="p-8">
                            <p className="text-[var(--text-muted)] font-bold leading-relaxed mb-8">
                                {confirmModal.message}
                            </p>
                            <div className="flex gap-4">
                                {confirmModal.type === 'confirm' ? (
                                    <>
                                        <button
                                            onClick={closeModal}
                                            className="flex-1 px-6 py-4 rounded-xl font-bold text-[var(--text-muted)] hover:bg-[var(--bg-input)] transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirmModal.onConfirm) confirmModal.onConfirm();
                                                closeModal();
                                            }}
                                            className="flex-[2] bg-violet-600 hover:bg-violet-500 text-white font-black py-4 rounded-xl shadow-xl shadow-violet-500/20 transition-all active:scale-[0.98]"
                                        >
                                            Confirm Action
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={closeModal}
                                        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-4 rounded-xl shadow-xl shadow-violet-500/20 transition-all active:scale-[0.98]"
                                    >
                                        Dismiss
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Dashboard;
