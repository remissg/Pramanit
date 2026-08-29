import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Globe, Lock, Key, Copy, Check, RefreshCw, Save, Sparkles, Book, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import DeveloperGuide from '../../components/DeveloperGuide';

const DeveloperPage = () => {
    const { token } = useAuth();
    const { loading } = useOutletContext();
    const [apiKey, setApiKey] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [rotatingKey, setRotatingKey] = useState(false);
    const [updatingWebhook, setUpdatingWebhook] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);
    const [savedWebhook, setSavedWebhook] = useState(false);

    useEffect(() => {
        fetchDevSettings();
    }, []);

    const fetchDevSettings = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/developer-settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApiKey(res.data.apiKey || '');
            setWebhookUrl(res.data.webhookUrl || '');
        } catch (err) {
            console.error('Failed to fetch developer settings', err);
        }
    };

    const handleRotateApiKey = async () => {
        if (!window.confirm('Rotate API Key? Your existing API key will be permanently invalidated immediately.')) return;
        setRotatingKey(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/rotate-api-key`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApiKey(res.data.apiKey);
            setShowApiKey(true);
        } catch (err) {
            console.error('Failed to rotate API Key', err);
        } finally {
            setRotatingKey(false);
        }
    };

    const handleSaveWebhook = async (e) => {
        e.preventDefault();
        setUpdatingWebhook(true);
        try {
            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/auth/webhook`, { webhookUrl }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSavedWebhook(true);
            setTimeout(() => setSavedWebhook(false), 2500);
        } catch (err) {
            console.error('Failed to update webhook URL', err);
        } finally {
            setUpdatingWebhook(false);
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
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-card)] rounded-[2.5rem] p-8 border border-[var(--glass-border)] shadow-xl">
                <div>
                    <span className="text-xs font-black uppercase tracking-widest text-violet-400 flex items-center gap-2 mb-2">
                        <Sparkles size={16} /> REST API & Webhooks Integration
                    </span>
                    <h2 className="text-3xl font-black text-[var(--text-heading)] tracking-tight">
                        Developer Portal
                    </h2>
                    <p className="text-sm font-bold text-[var(--text-muted)] mt-1">
                        Generate API keys for programmatically issuing credentials via HTTP REST APIs.
                    </p>
                </div>
            </div>

            {/* API Key Management */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] p-10 shadow-xl space-y-6">
                <div className="flex items-center gap-4 border-b border-[var(--border-muted)] pb-6">
                    <div className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                        <Key size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-[var(--text-heading)]">Secret API Key</h3>
                        <p className="text-xs text-[var(--text-muted)] font-bold">Use this bearer key to authenticate REST API requests.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative flex items-center">
                        <input
                            type={showApiKey ? 'text' : 'password'}
                            readOnly
                            value={apiKey || 'No API key generated yet.'}
                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-mono font-bold text-[var(--text-main)] pr-28 outline-none"
                        />
                        <div className="absolute right-4 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="p-2 text-[var(--text-muted)] hover:text-white"
                                title={showApiKey ? 'Hide Key' : 'Reveal Key'}
                            >
                                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            {apiKey && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(apiKey);
                                        setCopiedKey(true);
                                        setTimeout(() => setCopiedKey(false), 2000);
                                    }}
                                    className="p-2 text-[var(--text-muted)] hover:text-emerald-400"
                                    title="Copy API Key"
                                >
                                    {copiedKey ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                                </button>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleRotateApiKey}
                        disabled={rotatingKey}
                        className="px-5 py-2.5 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest border border-violet-500/20 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <RefreshCw size={14} className={rotatingKey ? 'animate-spin' : ''} />
                        {rotatingKey ? 'Rotating Key...' : 'Rotate API Key'}
                    </button>
                </div>
            </div>

            {/* Webhook Configuration */}
            <form onSubmit={handleSaveWebhook} className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] p-10 shadow-xl space-y-6">
                <div className="flex items-center gap-4 border-b border-[var(--border-muted)] pb-6">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                        <Globe size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-[var(--text-heading)]">Webhook Notifications Endpoint</h3>
                        <p className="text-xs text-[var(--text-muted)] font-bold">Receive instant HTTP POST payloads when certificates are verified or updated.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://yourserver.com/api/webhooks/pramanit"
                        className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-violet-500"
                    />
                    <button
                        type="submit"
                        disabled={updatingWebhook}
                        className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2"
                    >
                        {savedWebhook ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
                        {savedWebhook ? 'Webhook Saved!' : updatingWebhook ? 'Saving...' : 'Save Webhook URL'}
                    </button>
                </div>
            </form>

            {/* Interactive Developer API Documentation Component */}
            <DeveloperGuide apiKey={apiKey} />
        </div>
    );
};

export default DeveloperPage;
