import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Globe, Upload, Shield, Mail, CheckCircle, Save, Sparkles, Eye, EyeOff,
    Info, Check, Share2, HelpCircle, X, FileText, ExternalLink, Building2,
    User, Pen, IdCard, AlertTriangle, Lock
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';

/* ─── Field label helper ─── */
const Label = ({ children, required }) => (
    <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
        {children}{required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
);

/* ─── Input helper ─── */
const Input = ({ className = '', ...props }) => (
    <input
        {...props}
        className={`w-full px-5 py-3.5 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-violet-500 placeholder:text-slate-500 transition-colors ${className}`}
    />
);

/* ─── Section card ─── */
const Section = ({ icon, iconBg, title, subtitle, children }) => (
    <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-muted)] p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-4 border-b border-[var(--border-muted)] pb-5">
            <div className={`w-12 h-12 ${iconBg} text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0`}>
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-black text-[var(--text-heading)]">{title}</h3>
                <p className="text-xs text-[var(--text-muted)] font-semibold mt-0.5">{subtitle}</p>
            </div>
        </div>
        {children}
    </div>
);

const SettingsPage = () => {
    const { user, token } = useAuth();
    const { settings, setSettings, refetch, loading } = useOutletContext();

    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showSmtpPass, setShowSmtpPass] = useState(false);
    const [showSmtpGuide, setShowSmtpGuide] = useState(false);
    const [docModalUrl, setDocModalUrl] = useState(null);

    /* ── Verification fields — initialized from settings (populated by DashboardLayout profile fetch) ── */
    const [issuerTypeInput, setIssuerTypeInput] = useState(settings.issuerType || 'institution');
    const [institutionNameInput, setInstitutionNameInput] = useState(settings.institutionName || '');
    const [institutionWebsiteInput, setInstitutionWebsiteInput] = useState(settings.institutionWebsite || '');
    const [facultyEmailInput, setFacultyEmailInput] = useState(settings.facultyEmail || '');
    const [regIdInput, setRegIdInput] = useState(settings.institutionIdNumber || '');
    const [idDocFile, setIdDocFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [logoInputMode, setLogoInputMode] = useState('upload');

    const handleLogoFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Logo image file must be smaller than 5MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            setSettings(prev => ({ ...prev, orgLogoUrl: event.target.result }));
        };
        reader.readAsDataURL(file);
    };

    /* Sync fields whenever settings refreshes (i.e. after refetch() is called) */
    useEffect(() => {
        setIssuerTypeInput(settings.issuerType || 'institution');
        setInstitutionNameInput(settings.institutionName || '');
        setInstitutionWebsiteInput(settings.institutionWebsite || '');
        setFacultyEmailInput(settings.facultyEmail || '');
        setRegIdInput(settings.institutionIdNumber || '');
        // idDocFile intentionally kept — only reset if user explicitly clears it
    }, [settings.issuerType, settings.institutionName, settings.institutionWebsite, settings.facultyEmail, settings.institutionIdNumber]);

    /* ID doc file preview */
    useEffect(() => {
        if (!idDocFile) { setPreviewUrl(null); return; }
        const url = URL.createObjectURL(idDocFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [idDocFile]);

    /* Gmail OAuth callback */
    const [gmailConnected, setGmailConnected] = useState(false);
    const [gmailEmail, setGmailEmail] = useState('');
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('gmail_connected') === 'success') {
            setGmailConnected(true);
            setGmailEmail(params.get('email') || '');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    /* ── Profile completion check (same 5 fields server validates) ── */
    const isOrgName = !!(settings.orgName?.trim());
    const isLogo = !!(settings.orgLogoUrl?.trim());
    const isSignerName = !!(settings.fullName?.trim());
    const isDesignation = !!(settings.designation?.trim());
    const isIdDoc = !!(idDocFile || settings.officialIdUrl);
    const completionItems = [isOrgName, isLogo, isSignerName, isDesignation, isIdDoc];
    const completionCount = completionItems.filter(Boolean).length;
    const completionPercent = completionCount * 20;
    const isProfileComplete = completionPercent === 100;

    const isVerified = settings.verificationStatus === 'approved';
    const isPending = settings.verificationStatus === 'pending';
    const isRejected = settings.verificationStatus === 'rejected';

    /* ── Unified Save handler ── */
    const handleSaveAll = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Build update payload — only send smtpPass if user actually typed one
            const profilePayload = {
                orgName: settings.orgName,
                fullName: settings.fullName,
                designation: settings.designation,
                orgLogoUrl: settings.orgLogoUrl,
                certPrefix: settings.certPrefix || 'CERT',
                smtpHost: settings.smtpHost,
                smtpPort: Number(settings.smtpPort) || 587,
                smtpUser: settings.smtpUser,
                defaultHashtags: settings.defaultHashtags,
                allowSharing: settings.allowSharing
            };
            // Only include smtpPass if user typed something new
            if (settings.smtpPass && settings.smtpPass.trim()) {
                profilePayload.smtpPass = settings.smtpPass;
            }

            await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/auth/update-profile`,
                profilePayload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Save verification identity fields (only if not already approved)
            if (!isVerified) {
                const formData = new FormData();
                formData.append('issuerType', issuerTypeInput);
                formData.append('verificationCategory', issuerTypeInput);
                formData.append('institutionName', institutionNameInput);
                formData.append('institutionWebsite', institutionWebsiteInput);
                formData.append('facultyEmail', facultyEmailInput);
                formData.append('institutionIdNumber', regIdInput);
                if (idDocFile) formData.append('officialIdDoc', idDocFile);

                await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}/api/auth/submit-verification`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            setSaveSuccess(true);
            toast.success('Settings saved successfully!');
            setTimeout(() => setSaveSuccess(false), 3000);
            refetch();
        } catch (err) {
            console.error('Failed to save settings', err);
            toast.error(err?.response?.data?.message || 'Failed to save settings.');
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
        } catch (err) { console.error('Failed to connect Gmail', err); }
    };

    const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);

    const handleDisconnectGmail = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google/disconnect`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGmailConnected(false);
            setGmailEmail('');
            toast.success('Gmail integration disconnected.');
        } catch (err) {
            console.error('Failed to disconnect Gmail', err);
            toast.error('Failed to disconnect Gmail.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSaveAll} className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* ── Sticky Save Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-card)] rounded-[2.5rem] p-6 md:p-8 border border-[var(--glass-border)] shadow-xl">
                <div>
                    <span className="text-xs font-black uppercase tracking-widest text-violet-400 flex items-center gap-2 mb-1.5">
                        <Sparkles size={14} /> Issuer Profile &amp; Configuration
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-[var(--text-heading)] tracking-tight">
                        Settings &amp; Organization Branding
                    </h2>
                    <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                        All changes — branding, verification identity, and email settings — are saved together.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center shrink-0">
                    {/* Profile Completion Badge */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-black ${isProfileComplete
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                        {isProfileComplete ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                        {completionPercent}% {isProfileComplete ? 'Profile Complete' : 'Incomplete'}
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 active:scale-95 shrink-0 disabled:opacity-60"
                    >
                        {saveSuccess ? <Check size={18} className="text-emerald-300" /> : <Save size={18} />}
                        {saveSuccess ? 'Saved!' : saving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>
            </div>

            {/* ── Verification Status Banner ── */}
            <div className={`rounded-[2rem] p-5 border shadow-xl transition-all ${isVerified
                ? 'bg-emerald-500/8 border-emerald-500/25'
                : isPending
                    ? 'bg-amber-500/8 border-amber-500/25'
                    : isRejected
                        ? 'bg-rose-500/8 border-rose-500/25'
                        : 'bg-violet-500/8 border-violet-500/25'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isVerified ? 'bg-emerald-500/20' : isPending ? 'bg-amber-500/20' : 'bg-violet-500/20'}`}>
                        <Shield size={20} className={isVerified ? 'text-emerald-400' : isPending ? 'text-amber-400' : 'text-violet-400'} />
                    </div>
                    <div className="flex-1">
                        <p className={`text-sm font-black ${isVerified ? 'text-emerald-400' : isPending ? 'text-amber-400' : 'text-[var(--text-heading)]'}`}>
                            {isVerified ? '✅ Officially Verified Issuer' : isPending ? '⏳ Verification Under Admin Review' : isRejected ? '❌ Verification Rejected' : '⚠️ Verification Required to Issue Certificates'}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] font-semibold mt-0.5">
                            {isVerified
                                ? `Verified on ${new Date(settings.verifiedAt || Date.now()).toLocaleDateString()} • ID: #${settings.institutionIdNumber || 'N/A'}`
                                : isPending
                                    ? 'Your identity proof document is under admin audit. Certificate issuance unlocks upon approval.'
                                    : isRejected
                                        ? `Rejected: ${settings.rejectionReason || 'Profile requirements were not met.'} — Update and save again to resubmit.`
                                        : `Complete your profile to ${isProfileComplete ? '100%' : completionPercent + '% (need 100%)'} then save to submit for admin approval.`}
                        </p>
                    </div>
                    {isVerified && <Lock size={16} className="text-emerald-400 shrink-0" />}
                </div>

                {/* Progress bar */}
                {!isVerified && (
                    <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><Sparkles size={10} /> Profile Completion</span>
                            <span>{completionPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-700/40 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-rose-500 via-violet-500 to-emerald-400 h-full transition-all duration-700 rounded-full"
                                style={{ width: `${completionPercent}%` }} />
                        </div>
                        {!isProfileComplete && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                {!isOrgName && <span className="text-[9px] text-amber-400 font-bold">• Org Name</span>}
                                {!isLogo && <span className="text-[9px] text-amber-400 font-bold">• Org Logo URL</span>}
                                {!isSignerName && <span className="text-[9px] text-amber-400 font-bold">• Signer Name</span>}
                                {!isDesignation && <span className="text-[9px] text-amber-400 font-bold">• Designation</span>}
                                {!isIdDoc && <span className="text-[9px] text-amber-400 font-bold">• ID Document</span>}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Section 1: Institutional Identity & Verification ── */}
            <Section
                icon={<IdCard size={22} />}
                iconBg="bg-violet-600"
                title="Institutional Identity &amp; Verification"
                subtitle="These fields are sent to Pramanit administrators for identity audit and account approval."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label>Issuer Category</Label>
                            {isVerified && <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1"><Lock size={10} /> Locked</span>}
                        </div>
                        <select
                            value={issuerTypeInput}
                            disabled={isVerified}
                            onChange={(e) => setIssuerTypeInput(e.target.value)}
                            className={`w-full px-5 py-3.5 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-violet-500 transition-colors ${isVerified ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <option value="institution">🏛️ Official University / Institution</option>
                            <option value="faculty">👨‍🏫 Faculty Member / Academic Dept</option>
                            <option value="student_council">🎓 Student Council / Club Lead</option>
                            <option value="corporate">🏢 Corporate Enterprise</option>
                            <option value="independent">📚 Independent Educator</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label required>{issuerTypeInput === 'student_council' ? 'Student Roll / Reg No.' : issuerTypeInput === 'faculty' ? 'Faculty Employee ID' : 'Govt / Tax Reg No.'}</Label>
                            {isVerified && <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1"><Lock size={10} /> Locked</span>}
                        </div>
                        <Input
                            type="text"
                            value={regIdInput}
                            disabled={isVerified}
                            onChange={(e) => setRegIdInput(e.target.value)}
                            placeholder="Enter Registration / Employee No."
                            className={isVerified ? 'opacity-60 cursor-not-allowed' : ''}
                        />
                    </div>

                    {(issuerTypeInput === 'student_council' || issuerTypeInput === 'faculty') && (
                        <>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label>Parent College / University</Label>
                                    {isVerified && <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1"><Lock size={10} /> Locked</span>}
                                </div>
                                <Input
                                    type="text"
                                    value={institutionNameInput}
                                    disabled={isVerified}
                                    onChange={(e) => setInstitutionNameInput(e.target.value)}
                                    placeholder="e.g. Camellia Institute of Technology"
                                    className={isVerified ? 'opacity-60 cursor-not-allowed' : ''}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label>Institution Official Website</Label>
                                    {isVerified && <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1"><Lock size={10} /> Locked</span>}
                                </div>
                                <Input
                                    type="url"
                                    value={institutionWebsiteInput}
                                    disabled={isVerified}
                                    onChange={(e) => setInstitutionWebsiteInput(e.target.value)}
                                    placeholder="https://camelliait.ac.in"
                                    className={isVerified ? 'opacity-60 cursor-not-allowed' : ''}
                                />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <div className="flex items-center justify-between">
                                    <Label>Faculty / Advisor Contact Email</Label>
                                    {isVerified && <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1"><Lock size={10} /> Locked</span>}
                                </div>
                                <Input
                                    type="email"
                                    value={facultyEmailInput}
                                    disabled={isVerified}
                                    onChange={(e) => setFacultyEmailInput(e.target.value)}
                                    placeholder="advisor@camelliait.ac.in"
                                    className={isVerified ? 'opacity-60 cursor-not-allowed' : ''}
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-1.5 md:col-span-2">
                        <div className="flex items-center justify-between">
                            <Label required>Official ID Document</Label>
                            {isVerified && <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1"><Lock size={10} /> Locked</span>}
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] font-semibold -mt-1 mb-1.5">
                            Upload your official ID card, faculty permission letterhead, or student council authorization letter.
                        </p>

                        {/* Preview existing or selected */}
                        {(previewUrl || settings.officialIdUrl) && (
                            <div className="mb-3 p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] rounded-2xl flex items-center gap-3">
                                <FileText size={18} className="text-violet-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-[var(--text-heading)] truncate">
                                        {idDocFile ? idDocFile.name : 'Uploaded Verification Document'}
                                    </p>
                                    <p className="text-[10px] text-[var(--text-muted)]">Official Letterhead / ID Card / Tax Proof</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDocModalUrl(previewUrl || settings.officialIdUrl)}
                                    className="px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 dark:text-violet-300 rounded-xl flex items-center gap-1 text-[10px] font-bold shrink-0 transition-colors"
                                >
                                    <Eye size={12} /> Preview Document
                                </button>
                                {!isVerified && idDocFile && (
                                    <button type="button" onClick={() => setIdDocFile(null)}
                                        className="text-rose-400 hover:text-rose-300 text-[10px] font-bold shrink-0">Remove</button>
                                )}
                            </div>
                        )}

                        {!isVerified && (
                            <>
                                <label
                                    htmlFor="official-id-upload"
                                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 dark:text-violet-300 border-2 border-dashed border-violet-400/30 hover:border-violet-500/50 rounded-2xl text-xs font-bold cursor-pointer transition-all"
                                >
                                    <Upload size={16} />
                                    {idDocFile ? `${idDocFile.name} — Click to change` : (settings.officialIdUrl ? 'Replace existing document' : 'Upload ID Card / Letterhead / Authorization PDF')}
                                </label>
                                <input
                                    type="file"
                                    id="official-id-upload"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setIdDocFile(e.target.files[0] || null)}
                                    className="hidden"
                                />
                            </>
                        )}
                    </div>
                </div>
            </Section>

            {/* ── Section 2: Organization Branding ── */}
            <Section
                icon={<Globe size={22} />}
                iconBg="bg-violet-600"
                title="Organization Branding"
                subtitle="Customize how your name, logo, and signer details appear on issued certificates."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label required>Organization Name</Label>
                            {isVerified && (
                                <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                                    <Lock size={10} /> Verified &amp; Locked
                                </span>
                            )}
                        </div>
                        <Input
                            type="text"
                            value={settings.orgName}
                            disabled={isVerified}
                            onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                            placeholder="e.g. Camellia Institute of Technology"
                            className={isVerified ? 'opacity-60 cursor-not-allowed' : ''}
                        />
                    </div>

                    {/* Enhanced Organization Logo Upload & URL Section */}
                    <div className="space-y-3 md:col-span-2 bg-violet-600/5 p-5 rounded-3xl border border-violet-500/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <Label required>Organization Logo</Label>
                                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                    Upload a high-resolution logo. Transparent PNG or SVG (background removed) is strongly recommended for QR codes and certificate seals.
                                </p>
                            </div>
                            {isVerified ? (
                                <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1 shrink-0">
                                    <Lock size={10} /> Verified &amp; Locked
                                </span>
                            ) : (
                                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setLogoInputMode('upload')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${logoInputMode === 'upload' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Upload File
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLogoInputMode('url')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${logoInputMode === 'url' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Image URL
                                    </button>
                                </div>
                            )}
                        </div>

                        {!isVerified && logoInputMode === 'upload' && (
                            <div className="space-y-3">
                                <label
                                    htmlFor="org-logo-upload-input"
                                    className="flex flex-col items-center justify-center gap-2 w-full py-6 px-4 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border-2 border-dashed border-violet-500/30 hover:border-violet-500/60 rounded-2xl cursor-pointer transition-all text-center group"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Upload size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-violet-300">Click to upload logo (PNG, SVG, WEBP, JPEG, GIF, AVIF, BMP)</p>
                                        <p className="text-[10px] font-bold text-slate-400">Supports all image formats • Max file size: 5MB</p>
                                    </div>
                                </label>
                                <input
                                    type="file"
                                    id="org-logo-upload-input"
                                    accept="image/*"
                                    onChange={handleLogoFileUpload}
                                    className="hidden"
                                />
                            </div>
                        )}

                        {(!isVerified && logoInputMode === 'url') || isVerified ? (
                            <Input
                                type="text"
                                value={settings.orgLogoUrl}
                                disabled={isVerified}
                                onChange={(e) => setSettings({ ...settings, orgLogoUrl: e.target.value })}
                                placeholder="https://your-cdn.com/logo.png"
                                className={isVerified ? 'opacity-60 cursor-not-allowed' : ''}
                            />
                        ) : null}

                        {/* Clean Single Compact Logo Preview Card */}
                        {settings.orgLogoUrl && (
                            <div className="mt-3 flex items-center gap-4 p-3 bg-slate-900/60 rounded-2xl border border-violet-500/20 animate-in fade-in duration-200">
                                <div className="w-12 h-12 rounded-xl border border-white/10 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-inner">
                                    <img
                                        src={settings.orgLogoUrl}
                                        alt="Logo preview"
                                        className="w-full h-full object-contain"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                </div>
                                <div className="space-y-0.5 min-w-0 flex-grow">
                                    <p className="text-xs font-black text-white flex items-center gap-1.5">
                                        Logo Active
                                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Ready for QR Badges</span>
                                    </p>
                                    <p className="text-[10px] font-medium text-slate-400 truncate font-mono">{settings.orgLogoUrl.slice(0, 50)}...</p>
                                </div>
                                {!isVerified && (
                                    <button
                                        type="button"
                                        onClick={() => setSettings({ ...settings, orgLogoUrl: '' })}
                                        className="text-xs font-bold text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-xl hover:bg-rose-500/10 transition-colors shrink-0"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium">
                            <Sparkles size={14} className="shrink-0 text-amber-400" />
                            <span><strong>Tip:</strong> Need background removal? You can remove logo backgrounds for free at <a href="https://www.remove.bg" target="_blank" rel="noopener noreferrer" className="underline font-bold text-amber-200 hover:text-white">remove.bg</a> before uploading!</span>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label required>Full Name (Authorized Signer)</Label>
                            {isVerified && (
                                <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                                    <Lock size={10} /> Verified &amp; Locked
                                </span>
                            )}
                        </div>
                        <Input
                            type="text"
                            value={settings.fullName}
                            disabled={isVerified}
                            onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                            placeholder="e.g. Dr. Aarav Sharma"
                            className={isVerified ? 'opacity-60 cursor-not-allowed' : ''}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label required>Signer Designation</Label>
                            {isVerified && (
                                <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                                    <Lock size={10} /> Verified &amp; Locked
                                </span>
                            )}
                        </div>
                        <Input
                            type="text"
                            value={settings.designation}
                            disabled={isVerified}
                            onChange={(e) => setSettings({ ...settings, designation: e.target.value })}
                            placeholder="e.g. Director of Academic Operations"
                            className={isVerified ? 'opacity-60 cursor-not-allowed' : ''}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Certificate ID Prefix</Label>
                        <Input
                            type="text"
                            value={settings.certPrefix || ''}
                            onChange={(e) => setSettings({ ...settings, certPrefix: e.target.value })}
                            placeholder="e.g. CERT, MIT, ACAD"
                        />
                        <p className="text-[10px] text-[var(--text-muted)] font-semibold">Example: CERT-xxxx-xxxx</p>
                    </div>
                </div>
            </Section>

            {/* ── Section 3: Social Sharing ── */}
            <Section
                icon={<Share2 size={22} />}
                iconBg="bg-emerald-600"
                title="Social Sharing &amp; Public Settings"
                subtitle="Configure default hashtags and recipient sharing permissions."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <Label>Default Social Hashtags</Label>
                        <Input
                            type="text"
                            value={settings.defaultHashtags || '#Pramanit #Certified'}
                            onChange={(e) => setSettings({ ...settings, defaultHashtags: e.target.value })}
                            placeholder="#Pramanit #Certified #Professional"
                        />
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-center">
                        <Label>Recipient LinkedIn &amp; Public Sharing</Label>
                        <label className="flex items-center gap-3 cursor-pointer p-4 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl">
                            <input
                                type="checkbox"
                                checked={settings.allowSharing ?? true}
                                onChange={(e) => setSettings({ ...settings, allowSharing: e.target.checked })}
                                className="w-5 h-5 rounded text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-xs font-bold text-[var(--text-main)]">
                                Allow recipients to share credentials on LinkedIn &amp; Twitter
                            </span>
                        </label>
                    </div>
                </div>
            </Section>

            {/* ── Section 4: SMTP Email Configuration ── */}
            <Section
                icon={<Mail size={22} />}
                iconBg="bg-blue-600"
                title="SMTP Email Server Integration"
                subtitle="Configure custom email credentials or use Gmail OAuth for certificate delivery."
            >
                {/* Gmail Integration */}
                <div className="p-5 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-black text-[var(--text-heading)]">Gmail OAuth Integration</p>
                        <p className="text-xs text-[var(--text-muted)] font-semibold mt-0.5">
                            {gmailConnected ? `Connected to ${gmailEmail}` : 'Connect your Google account to send emails via the official Gmail API.'}
                        </p>
                    </div>
                    {gmailConnected ? (
                        <button type="button" onClick={() => setConfirmDisconnectOpen(true)}
                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0">
                            Disconnect Gmail
                        </button>
                    ) : (
                        <button type="button" onClick={handleConnectGmail}
                            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all shrink-0 flex items-center gap-2">
                            <Globe size={14} /> Connect Gmail
                        </button>
                    )}
                </div>

                <ConfirmModal
                    isOpen={confirmDisconnectOpen}
                    onClose={() => setConfirmDisconnectOpen(false)}
                    onConfirm={handleDisconnectGmail}
                    title="Disconnect Gmail Integration"
                    message="Are you sure you want to disconnect your Gmail integration? You will no longer be able to send certificates directly from your Gmail account."
                    confirmText="Disconnect"
                    confirmVariant="danger"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <Label>SMTP Host</Label>
                        <Input type="text" value={settings.smtpHost} onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })} placeholder="smtp.gmail.com" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>SMTP Port</Label>
                        <Input type="number" value={settings.smtpPort} onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })} placeholder="587" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>SMTP Username / Email</Label>
                        <Input type="email" value={settings.smtpUser} onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })} placeholder="notifications@yourorg.com" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>SMTP App Password</Label>
                        <div className="relative">
                            <Input
                                type={showSmtpPass ? 'text' : 'password'}
                                value={settings.smtpPass || ''}
                                onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                                placeholder="••••••••••••••••"
                                className="pr-12"
                            />
                            <button type="button" onClick={() => setShowSmtpPass(!showSmtpPass)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors">
                                {showSmtpPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="button" onClick={() => setShowSmtpGuide(true)}
                        className="px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5">
                        <HelpCircle size={14} /> SMTP Setup Guide
                    </button>
                </div>
            </Section>

            {/* ── Bottom Save Bar ── */}
            <div className="sticky bottom-4 z-30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--bg-card)]/90 backdrop-blur-xl rounded-[2rem] p-5 border border-[var(--glass-border)] shadow-2xl shadow-violet-900/20">
                <div className="text-xs font-bold text-[var(--text-muted)]">
                    {isProfileComplete && !isVerified
                        ? '✅ Profile complete — saving will also submit for admin approval.'
                        : !isProfileComplete
                            ? `⚠️ ${5 - completionCount} field(s) missing — verification submit disabled until 100%.`
                            : '🔒 Verified issuer — branding &amp; email settings only.'}
                </div>
                <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-violet-600/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-60 shrink-0"
                >
                    {saveSuccess ? <Check size={18} className="text-emerald-300" /> : <Save size={18} />}
                    {saveSuccess ? 'All Settings Saved!' : saving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>

            {/* ── SMTP Setup Guide Modal ── */}
            {showSmtpGuide && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-[var(--glass-border)] space-y-5 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
                            <h3 className="text-xl font-black text-[var(--text-heading)] flex items-center gap-2">
                                <HelpCircle className="text-blue-500" size={20} /> SMTP Setup Guide
                            </h3>
                            <button type="button" onClick={() => setShowSmtpGuide(false)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4 text-xs font-bold text-[var(--text-main)] max-h-96 overflow-y-auto">
                            <div className="p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-muted)] space-y-2">
                                <p className="text-sm font-black text-violet-400">Option 1: Gmail OAuth (Recommended)</p>
                                <p className="text-[var(--text-muted)]">Click 'Connect Gmail' to connect your official Google account securely without entering passwords.</p>
                            </div>
                            <div className="p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-muted)] space-y-2">
                                <p className="text-sm font-black text-blue-400">Option 2: Outlook / Microsoft 365 SMTP</p>
                                <p className="text-[var(--text-muted)]">Host: <code className="text-blue-400">smtp.office365.com</code> | Port: <code className="text-blue-400">587</code></p>
                                <p className="text-[var(--text-muted)]">Use your Office365 email and App Password from Microsoft Security Basics.</p>
                            </div>
                            <div className="p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-muted)] space-y-2">
                                <p className="text-sm font-black text-emerald-400">Option 3: Gmail App Password (Manual)</p>
                                <p className="text-[var(--text-muted)]">Host: <code className="text-emerald-400">smtp.gmail.com</code> | Port: <code className="text-emerald-400">587</code></p>
                                <p className="text-[var(--text-muted)]">Enable 2-Step Verification → Google Account → Security → App Passwords → Generate.</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setShowSmtpGuide(false)}
                            className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all">
                            Got it
                        </button>
                    </div>
                </div>
            )}

            {/* ── Document Preview Modal ── */}
            {docModalUrl && (
                <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    <div
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--glass-border)' }}
                        className="w-full max-w-4xl h-[85vh] rounded-3xl p-5 shadow-2xl border flex flex-col gap-4 relative animate-in zoom-in-95 duration-200"
                    >
                        <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
                            <div className="flex items-center gap-2 text-[var(--text-heading)] font-black text-sm">
                                <FileText size={18} className="text-violet-500" />
                                <span>Official ID Document Preview</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={docModalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                >
                                    <ExternalLink size={14} /> Open Original
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setDocModalUrl(null)}
                                    className="p-1.5 bg-[var(--bg-input)] hover:bg-slate-500/20 text-[var(--text-muted)] hover:text-[var(--text-heading)] rounded-xl transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 w-full h-full bg-black/10 dark:bg-black/40 rounded-2xl overflow-hidden border border-[var(--border-muted)] flex items-center justify-center relative">
                            {docModalUrl.match(/\.(jpeg|jpg|png|webp|gif|svg)$/i) || !docModalUrl.endsWith('.pdf') ? (
                                <img
                                    src={docModalUrl}
                                    alt="ID Document Preview"
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                            ) : null}
                            <iframe
                                src={docModalUrl}
                                title="Official ID Document"
                                className="w-full h-full border-0"
                                style={{ display: docModalUrl.endsWith('.pdf') ? 'block' : 'none' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
};

export default SettingsPage;
