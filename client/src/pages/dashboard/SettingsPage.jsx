import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Globe, Upload, Shield, Mail, CheckCircle, Save, Sparkles, Eye, EyeOff, Info, Check, Share2, HelpCircle, X, FileText, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const SettingsPage = () => {
    const { user, token } = useAuth();
    const { settings, setSettings, refetch, loading } = useOutletContext();
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showSmtpPass, setShowSmtpPass] = useState(false);
    const [showSmtpGuide, setShowSmtpGuide] = useState(false);

    // Verification Resubmission Form
    const [issuerTypeInput, setIssuerTypeInput] = useState(user?.issuer_type || 'institution');
    const [regIdInput, setRegIdInput] = useState(user?.institution_id_number || '');
    const [idDocFile, setIdDocFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [submittingVerification, setSubmittingVerification] = useState(false);

    useEffect(() => {
        if (!idDocFile) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(idDocFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [idDocFile]);

    const [gmailConnected, setGmailConnected] = useState(false);
    const [gmailEmail, setGmailEmail] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('gmail_connected');
        const connectedEmail = params.get('email');

        if (status === 'success') {
            setGmailConnected(true);
            setGmailEmail(connectedEmail);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleResubmitVerification = async (e) => {
        e.preventDefault();
        setSubmittingVerification(true);
        try {
            const formData = new FormData();
            formData.append('issuerType', issuerTypeInput);
            formData.append('institutionIdNumber', regIdInput);
            if (idDocFile) formData.append('officialIdDoc', idDocFile);

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/submit-verification`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Verification submitted successfully for administrative review!');
            refetch();
        } catch (err) {
            console.error('Failed to submit verification', err);
            alert('Failed to submit verification.');
        } finally {
            setSubmittingVerification(false);
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/update-profile`, {
                orgName: settings.orgName,
                fullName: settings.fullName,
                designation: settings.designation,
                certPrefix: settings.certPrefix,
                smtpHost: settings.smtpHost,
                smtpPort: Number(settings.smtpPort),
                smtpUser: settings.smtpUser,
                smtpPass: settings.smtpPass,
                defaultHashtags: settings.defaultHashtags,
                allowSharing: settings.allowSharing
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to save settings', err);
        } finally {
            setSaving(false);
        }
    };

    const handleConnectGmail = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google/connect`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.href = res.data.url;
        } catch (err) {
            console.error('Failed to connect Gmail', err);
        }
    };

    const handleDisconnectGmail = async () => {
        if (!window.confirm('Disconnect Gmail integration? System will revert to custom SMTP.')) return;
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google/disconnect`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGmailConnected(false);
            setGmailEmail('');
        } catch (err) {
            console.error('Failed to disconnect Gmail', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const isVerified = user?.verification_status === 'approved';
    const isPending = user?.verification_status === 'pending';
    const isRejected = user?.verification_status === 'rejected';

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
            {/* INSTITUTIONAL IDENTITY VERIFICATION STATUS BANNER */}
            <div
                className="rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border shadow-xl transition-all"
                style={{ background: 'var(--banner-bg)', borderColor: 'var(--banner-border)' }}
            >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1">
                        <span
                            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3 border max-w-full leading-normal"
                            style={{
                                background: 'var(--banner-badge-bg)',
                                borderColor: 'var(--banner-badge-border)',
                                color: 'var(--banner-badge-text)'
                            }}
                        >
                            <Shield size={14} className="shrink-0" />
                            <span className="truncate">{isVerified ? 'Officially Verified Authority' : isPending ? 'Identity Review Pending' : isRejected ? 'Verification Failed' : 'Verification Required'}</span>
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-[var(--text-heading)]">
                            {isVerified
                                ? (user?.issuer_type === 'student_council' ? 'Verified Campus Student Council' : 'Verified Educational Institution')
                                : isPending
                                    ? 'Verification Pending Admin Approval'
                                    : 'Verify Official Institution Identity'
                            }
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-[var(--text-muted)] mt-1.5 max-w-xl leading-relaxed">
                            {isVerified
                                ? `Registration ID / Roll No: #${user?.institution_id_number || 'N/A'} • Verified on ${new Date(user?.verified_at || Date.now()).toLocaleDateString()}`
                                : isPending
                                    ? 'Your official ID document & registration details have been submitted and are under review by Pramanit Administrators.'
                                    : 'To issue verifiable certificates, upload your official ID card or faculty permission letterhead for administrative approval.'
                            }
                        </p>

                        {(user?.official_id_url || (isPending || isVerified)) && (
                            <div className="mt-4 inline-flex items-center gap-3 p-2.5 bg-white/70 dark:bg-black/20 rounded-xl border border-violet-200 dark:border-violet-500/20 shadow-sm">
                                <FileText size={16} className="text-violet-600 dark:text-violet-400" />
                                <div className="text-[11px]">
                                    <span className="font-black text-[var(--text-heading)] block">Submitted Verification Document</span>
                                    <span className="text-[var(--text-muted)] font-medium">Official Identity File</span>
                                </div>
                                {user?.official_id_url && (
                                    <a
                                        href={user.official_id_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="ml-2 px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] rounded-lg transition-all flex items-center gap-1"
                                    >
                                        <Eye size={12} /> Preview
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {!isVerified && !isPending && (
                        <form
                            onSubmit={handleResubmitVerification}
                            className="space-y-2.5 shrink-0 p-4 rounded-2xl border w-full lg:w-72 shadow-lg mt-4 lg:mt-0"
                            style={{
                                background: 'var(--banner-btn-sec-bg)',
                                borderColor: 'var(--banner-btn-sec-border)'
                            }}
                        >
                            <div className="space-y-1">
                                <label className="block text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">Category</label>
                                <select
                                    value={issuerTypeInput}
                                    onChange={(e) => setIssuerTypeInput(e.target.value)}
                                    className="w-full bg-[var(--bg-card)] border border-[var(--border-interactive)] rounded-lg py-1.5 px-2.5 text-xs font-bold text-[var(--text-main)] outline-none focus:border-violet-500"
                                >
                                    <option value="institution">🏛️ Official Institution</option>
                                    <option value="student_council">🎓 Student Council</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">
                                    {issuerTypeInput === 'student_council' ? 'Roll / Reg No.' : 'Govt / Tax Reg No.'}
                                </label>
                                <input
                                    type="text"
                                    value={regIdInput}
                                    onChange={(e) => setRegIdInput(e.target.value)}
                                    placeholder="Enter Reg No."
                                    required
                                    className="w-full bg-[var(--bg-card)] border border-[var(--border-interactive)] rounded-lg py-1.5 px-2.5 text-xs font-bold text-[var(--text-main)] outline-none focus:border-violet-500 placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">Official ID Document</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="official-id-upload"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => setIdDocFile(e.target.files[0] || null)}
                                        required={!user?.official_id_url}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="official-id-upload"
                                        className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-dashed border-violet-400/40 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                    >
                                        <Upload size={12} />
                                        {idDocFile ? 'Change File' : 'Choose Document'}
                                    </label>
                                </div>
                            </div>

                            {/* Live Document Preview */}
                            {(previewUrl || user?.official_id_url) && (
                                <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase text-violet-500 tracking-wider flex items-center gap-1">
                                            <FileText size={10} /> Document Preview
                                        </span>
                                        {idDocFile && (
                                            <button
                                                type="button"
                                                onClick={() => setIdDocFile(null)}
                                                className="text-[9px] font-bold text-red-400 hover:text-red-500 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    {idDocFile?.type?.startsWith('image/') || (!idDocFile && user?.official_id_url?.match(/\.(jpeg|jpg|png|webp|gif)$/i)) ? (
                                        <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 max-h-24 flex items-center justify-center">
                                            <img
                                                src={previewUrl || user?.official_id_url}
                                                alt="ID Document Preview"
                                                className="w-full h-20 object-contain"
                                            />
                                            <a
                                                href={previewUrl || user?.official_id_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1"
                                            >
                                                <Eye size={12} /> View Full
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-1.5 bg-violet-500/10 rounded-lg border border-violet-500/20 text-[10px]">
                                            <div className="flex items-center gap-1.5 truncate">
                                                <FileText size={14} className="text-violet-500 shrink-0" />
                                                <span className="font-bold truncate text-[var(--text-main)]">
                                                    {idDocFile ? idDocFile.name : 'Uploaded_Document.pdf'}
                                                </span>
                                            </div>
                                            <a
                                                href={previewUrl || user?.official_id_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-violet-500 hover:text-violet-400 font-bold flex items-center gap-0.5 shrink-0 ml-1"
                                            >
                                                <ExternalLink size={10} /> View
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submittingVerification}
                                className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all active:scale-95 mt-1"
                            >
                                {submittingVerification ? 'Submitting...' : 'Submit Verification'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-10">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-card)] rounded-[2.5rem] p-8 border border-[var(--glass-border)] shadow-xl">
                    <div>
                        <span className="text-xs font-black uppercase tracking-widest text-violet-400 flex items-center gap-2 mb-2">
                            <Sparkles size={16} /> Issuer Configuration & Preferences
                        </span>
                        <h2 className="text-3xl font-black text-[var(--text-heading)] tracking-tight">
                            Settings & Organization Branding
                        </h2>
                        <p className="text-sm font-bold text-[var(--text-muted)] mt-1">
                            Customize your institution logo, signer details, social sharing, and SMTP integration.
                        </p>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 active:scale-95 shrink-0"
                    >
                        {saveSuccess ? <Check size={18} className="text-emerald-400" /> : <Save size={18} />}
                        {saveSuccess ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>

                {/* Branding Section */}
                <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] p-10 shadow-xl space-y-8">
                    <div className="flex items-center gap-4 border-b border-[var(--border-muted)] pb-6">
                        <div className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-[var(--text-heading)]">Organization Branding</h3>
                            <p className="text-xs text-[var(--text-muted)] font-bold">Customize how your certificates appear to recipients.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Organization Name</label>
                                {isVerified && (
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                        🔒 Verified & Locked
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={settings.orgName}
                                disabled={isVerified}
                                onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                                className={`w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-violet-500 ${isVerified ? 'opacity-60 cursor-not-allowed' : ''}`}
                                placeholder="Enter Org Name"
                            />
                        </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Organization Logo URL</label>
                        <input
                            type="text"
                            value={settings.orgLogoUrl}
                            onChange={(e) => setSettings({ ...settings, orgLogoUrl: e.target.value })}
                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-violet-500"
                            placeholder="https://..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Full Name (Authorized Signer)</label>
                        <input
                            type="text"
                            value={settings.fullName}
                            onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-violet-500"
                            placeholder="e.g. Dr. Aarav Sharma"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Signer Designation</label>
                        <input
                            type="text"
                            value={settings.designation}
                            onChange={(e) => setSettings({ ...settings, designation: e.target.value })}
                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-violet-500"
                            placeholder="e.g. Director of Academic Operations"
                        />
                    </div>
                </div>
            </div>

            {/* Social Sharing & Public Settings Section */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] p-10 shadow-xl space-y-8">
                <div className="flex items-center gap-4 border-b border-[var(--border-muted)] pb-6">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                        <Share2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-[var(--text-heading)]">Social Sharing & Verification Settings</h3>
                        <p className="text-xs text-[var(--text-muted)] font-bold">Configure default social media tags and public sharing settings.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Default Social Hashtags</label>
                        <input
                            type="text"
                            value={settings.defaultHashtags || '#Pramanit #Certified #Professional'}
                            onChange={(e) => setSettings({ ...settings, defaultHashtags: e.target.value })}
                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-violet-500"
                            placeholder="#Pramanit #Certified #Professional"
                        />
                    </div>
                    <div className="space-y-2 flex flex-col justify-center">
                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Recipient LinkedIn & Public Sharing</label>
                        <label className="flex items-center gap-3 cursor-pointer p-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl">
                            <input
                                type="checkbox"
                                checked={settings.allowSharing ?? true}
                                onChange={(e) => setSettings({ ...settings, allowSharing: e.target.checked })}
                                className="w-5 h-5 rounded text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-xs font-bold text-[var(--text-main)]">
                                Allow recipients to share credentials to LinkedIn & Twitter
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* SMTP Server Configuration Section */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] p-10 shadow-xl space-y-8">
                <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                            <Mail size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-[var(--text-heading)]">SMTP Email Server Integration</h3>
                            <p className="text-xs text-[var(--text-muted)] font-bold">Configure custom email sending credentials or Gmail OAuth.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowSmtpGuide(true)}
                        className="px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shrink-0"
                    >
                        <HelpCircle size={14} /> Setup Guide
                    </button>
                </div>

                {/* Gmail Integration Status */}
                <div className="p-6 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-black text-[var(--text-heading)]">Gmail OAuth Integration</p>
                        <p className="text-xs text-[var(--text-muted)] font-bold mt-0.5">
                            {gmailConnected ? `Connected to ${gmailEmail}` : 'Connect your Google account to send emails using official Gmail API.'}
                        </p>
                    </div>
                    {gmailConnected ? (
                        <button
                            type="button"
                            onClick={handleDisconnectGmail}
                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0"
                        >
                            Disconnect Gmail
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleConnectGmail}
                            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-600/30 transition-all shrink-0 flex items-center gap-2"
                        >
                            <Globe size={14} /> Connect Gmail
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">SMTP Host</label>
                        <input
                            type="text"
                            value={settings.smtpHost}
                            onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-violet-500"
                            placeholder="smtp.gmail.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">SMTP Port</label>
                        <input
                            type="number"
                            value={settings.smtpPort}
                            onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-violet-500"
                            placeholder="587"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">SMTP Username / Email</label>
                        <input
                            type="email"
                            value={settings.smtpUser}
                            onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                            className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-violet-500"
                            placeholder="notifications@yourorg.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">SMTP App Password</label>
                        <div className="relative">
                            <input
                                type={showSmtpPass ? 'text' : 'password'}
                                value={settings.smtpPass || ''}
                                onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                                className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-violet-500 pr-12"
                                placeholder="••••••••••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSmtpPass(!showSmtpPass)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                            >
                                {showSmtpPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </form>

            {/* SMTP Setup Guide Modal */}
            {showSmtpGuide && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-[var(--glass-border)] space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
                            <h3 className="text-xl font-black text-[var(--text-heading)] flex items-center gap-2">
                                <HelpCircle className="text-blue-500" size={20} /> SMTP Setup Guide
                            </h3>
                            <button onClick={() => setShowSmtpGuide(false)} className="text-[var(--text-muted)] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs font-bold text-[var(--text-main)] max-h-96 overflow-y-auto">
                            <div className="p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-muted)] space-y-2">
                                <p className="text-sm font-black text-violet-400">Option 1: Gmail OAuth (Recommended)</p>
                                <p className="text-[var(--text-muted)]">Click 'Connect Gmail' above to connect your official Google account securely without entering passwords.</p>
                            </div>
                            <div className="p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-muted)] space-y-2">
                                <p className="text-sm font-black text-blue-400">Option 2: Outlook / Microsoft 365 SMTP</p>
                                <p className="text-[var(--text-muted)]">Host: <code className="text-blue-400">smtp.office365.com</code> | Port: <code className="text-blue-400">587</code></p>
                                <p className="text-[var(--text-muted)]">Use your Office365 email and App Password generated under Microsoft Security Basics.</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setShowSmtpGuide(false)}
                                className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-widest"
                            >
                                Got It
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
