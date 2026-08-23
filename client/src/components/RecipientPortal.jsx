import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Download,
    Share2,
    Linkedin,
    CheckCircle,
    AlertCircle,
    Loader,
    Edit3,
    ShieldCheck,
    ExternalLink,
    ChevronRight,
    Award,
    Mail,
    Sparkles,
    ArrowLeft,
    Maximize2,
    Eye,
    Grid
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

export default function RecipientPortal({ theme, setTheme }) {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [certificate, setCertificate] = useState(null);
    const [certificatesList, setCertificatesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCorrectionForm, setShowCorrectionForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [submittingCorrection, setSubmittingCorrection] = useState(false);
    const [correctionMessage, setCorrectionMessage] = useState(null);
    const [searchEmail, setSearchEmail] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchStatus, setSearchStatus] = useState(null); // { type: 'success' | 'error', text: string }

    // Restore session from sessionStorage if user refreshes page or navigates back/forward
    useEffect(() => {
        if (token) return;

        const savedSession = sessionStorage.getItem('pramanit_vault_session');
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                if (parsed.certificates && parsed.certificates.length > 0) {
                    setCertificatesList(parsed.certificates);
                    setCertificate(parsed.activeCert || parsed.certificates[0]);
                    setSearchEmail(parsed.email || '');
                    setNewName((parsed.activeCert || parsed.certificates[0]).recipientName);
                    setViewMode(parsed.viewMode || (parsed.certificates.length > 1 ? 'grid' : 'detail'));
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error('Failed to parse saved vault session:', err);
            }
        }
    }, [token]);

    useEffect(() => {
        if (!token) {
            // If no token and no restored session, finish loading
            if (!sessionStorage.getItem('pramanit_vault_session')) {
                setLoading(false);
            }
            return;
        }

        const fetchCertificate = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/portal?token=${token}`);
                setCertificate(response.data);
                setCertificatesList([response.data]);
                setNewName(response.data.recipientName);
                setViewMode('detail');
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load certificate portal.');
            } finally {
                setLoading(false);
            }
        };

        fetchCertificate();
    }, [token]);

    // Auto-detect ?email= query parameter from email Magic Link
    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam && !token) {
            setSearchEmail(emailParam);
            const autoSearch = async () => {
                setSearchLoading(true);
                try {
                    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/find-certificates`, {
                        email: emailParam
                    });
                    if (response.data.certificates && response.data.certificates.length > 0) {
                        setCertificatesList(response.data.certificates);
                        setCertificate(response.data.certificates[0]);
                        setNewName(response.data.certificates[0].recipientName);
                        const initialMode = response.data.certificates.length > 1 ? 'grid' : 'detail';
                        setViewMode(initialMode);
                        setError(null);

                        sessionStorage.setItem('pramanit_vault_session', JSON.stringify({
                            email: emailParam,
                            certificates: response.data.certificates,
                            activeCert: response.data.certificates[0],
                            viewMode: initialMode
                        }));
                    }
                    setSearchStatus({ type: 'success', text: response.data.message });
                } catch (err) {
                    setSearchStatus({ type: 'error', text: err.response?.data?.message || 'Failed to process request.' });
                } finally {
                    setSearchLoading(false);
                }
            };
            autoSearch();
        }
    }, [searchParams, token]);

    const handleCorrectionSubmit = async (e) => {
        e.preventDefault();
        if (!newName.trim() || newName === certificate.recipientName) return;

        setSubmittingCorrection(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/request-correction`, {
                token: certificate.recipientToken || token,
                newName
            });
            setCorrectionMessage({ type: 'success', text: 'Request submitted! Your issuer will review it shortly.' });
            setShowCorrectionForm(false);
            setCertificate(prev => ({ ...prev, correctionRequested: true, correctionStatus: 'pending' }));
        } catch (err) {
            setCorrectionMessage({ type: 'error', text: 'Failed to submit request. Please try again.' });
        } finally {
            setSubmittingCorrection(false);
        }
    };

    const handleLinkedInShare = () => {
        const certUrl = `${window.location.origin}/verify/${certificate.certId}`;
        const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certificate.certificateTitle || 'Certificate')}&organizationName=${encodeURIComponent(certificate.orgName || certificate.issuerName)}&issueYear=${new Date(certificate.issueDate).getFullYear()}&issueMonth=${new Date(certificate.issueDate).getMonth() + 1}&certUrl=${encodeURIComponent(certUrl)}&certId=${encodeURIComponent(certificate.certId)}`;
        window.open(linkedInUrl, '_blank');
    };

    const handleDownload = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/certificates/download/${certificate.certId}`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `certificate-${certificate.recipientName.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    const [stepMode, setStepMode] = useState('email'); // 'email' | 'otp'
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'detail'
    const [zoomModalOpen, setZoomModalOpen] = useState(false);

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (!searchEmail.trim()) return;

        setSearchLoading(true);
        setSearchStatus(null);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/request-otp`, {
                email: searchEmail
            });
            setSearchStatus({ type: 'success', text: response.data.message });
            setStepMode('otp');
        } catch (err) {
            setSearchStatus({ type: 'error', text: err.response?.data?.message || 'Failed to process request.' });
        } finally {
            setSearchLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpCode.trim()) return;

        setOtpLoading(true);
        setSearchStatus(null);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/verify-otp`, {
                email: searchEmail,
                otp: otpCode
            });
            if (response.data.certificates && response.data.certificates.length > 0) {
                setCertificatesList(response.data.certificates);
                setCertificate(response.data.certificates[0]);
                setNewName(response.data.certificates[0].recipientName);
                const initialMode = 'grid'; // Always show list view first after searching
                setViewMode(initialMode);
                setError(null);

                // Update URL address bar to /portal?email=...
                navigate(`/portal?email=${encodeURIComponent(searchEmail.trim())}`, { replace: true });

                sessionStorage.setItem('pramanit_vault_session', JSON.stringify({
                    email: searchEmail.trim(),
                    certificates: response.data.certificates,
                    activeCert: response.data.certificates[0],
                    viewMode: initialMode
                }));
            }
            setSearchStatus({ type: 'success', text: response.data.message });
        } catch (err) {
            setSearchStatus({ type: 'error', text: err.response?.data?.message || 'Invalid or expired 6-digit PIN.' });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleLockVault = () => {
        sessionStorage.removeItem('pramanit_vault_session');
        setCertificatesList([]);
        setCertificate(null);
        setSearchStatus(null);
        setStepMode('email');
        setOtpCode('');
        navigate('/portal', { replace: true });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest animate-pulse">Entering Portal...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)]">
                <Header theme={theme} setTheme={setTheme} />
                <div className="pt-32 pb-20 px-6 flex items-center justify-center">
                    <div className="max-w-md w-full bg-[var(--bg-card)] border border-rose-500/20 rounded-3xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="text-rose-500" size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-[var(--text-heading)] mb-4 leading-tight">Access Denied</h2>
                        <p className="text-[var(--text-muted)] font-bold mb-8">{error}</p>
                        <button
                            onClick={() => {
                                setError(null);
                                navigate('/portal');
                            }}
                            className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl shadow-lg shadow-violet-500/20 transition-all active:scale-95"
                        >
                            Try Recovery Mode
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!token && !certificate) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] selection:bg-violet-500/30">
                <Header theme={theme} setTheme={setTheme} />
                <main className="pt-40 pb-20 max-w-7xl mx-auto px-6">
                    <div className="max-w-xl mx-auto text-center space-y-12">
                        <div className="space-y-4">
                            <div className="w-20 h-20 bg-violet-600/10 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-violet-500/10">
                                <Award className="text-violet-500" size={40} />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-[var(--text-heading)] tracking-tight">Find My Certificates</h1>
                            <p className="text-[var(--text-muted)] font-medium leading-relaxed max-w-md mx-auto">
                                Lost your original link? No problem. Enter your email address below and we'll send you all your verified credentials.
                            </p>
                        </div>

                        <div className="glass-card rounded-[32px] p-8 md:p-10 border border-[var(--glass-border)] shadow-2xl relative overflow-hidden group">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 blur-3xl -z-10 transition-all group-hover:bg-violet-600/10"></div>

                            {stepMode === 'email' ? (
                                <form onSubmit={handleSearchSubmit} className="space-y-6 relative">
                                    <div className="space-y-3 text-left">
                                        <label className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] ml-2">Registered Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
                                            <input
                                                type="email"
                                                required
                                                value={searchEmail}
                                                onChange={(e) => setSearchEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                className="w-full bg-[var(--bg-input)] border border-[var(--glass-border)] rounded-2xl py-5 pl-16 pr-6 text-[var(--text-main)] font-black outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all text-lg"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={searchLoading}
                                        className="w-full py-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg group"
                                    >
                                        {searchLoading ? <Loader className="animate-spin" size={20} /> : (
                                            <>
                                                Request Verification PIN
                                                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOtp} className="space-y-6 relative animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-3 text-left">
                                        <div className="flex justify-between items-center ml-2">
                                            <label className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em]">6-Digit PIN sent to {searchEmail}</label>
                                            <button
                                                type="button"
                                                onClick={() => setStepMode('email')}
                                                className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest"
                                            >
                                                Change Email
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-violet-500" size={20} />
                                            <input
                                                type="text"
                                                required
                                                maxLength={6}
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                placeholder="4 8 2 9 1 0"
                                                className="w-full bg-[var(--bg-input)] border border-violet-500/40 rounded-2xl py-5 pl-16 pr-6 text-[var(--text-main)] font-mono font-black tracking-[0.4em] outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-2xl text-center"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={otpLoading || otpCode.length < 6}
                                        className="w-full py-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg group"
                                    >
                                        {otpLoading ? <Loader className="animate-spin" size={20} /> : (
                                            <>
                                                Unlock Credential Vault
                                                <Sparkles size={20} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            {searchStatus && (
                                <div className={`mt-8 p-6 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 ${searchStatus.type === 'success'
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                                    : 'bg-rose-500/5 border-rose-500/20 text-rose-500'
                                    }`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${searchStatus.type === 'success' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                                        }`}>
                                        {searchStatus.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <p className="text-sm font-black tracking-tight leading-snug">
                                        {searchStatus.text}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="pt-8 flex flex-col items-center gap-6">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Secure Verification by Pramanit</p>
                            <div className="flex gap-4">
                                <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--glass-border)] opacity-40 grayscale group-hover:grayscale-0 transition-all">
                                    <ShieldCheck size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const formatDateDDMMYYYY = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] font-sans text-[var(--text-main)] selection:bg-violet-500/30">
            <Header theme={theme} setTheme={setTheme} />

            <main className="pt-32 md:pt-40 pb-20 max-w-7xl mx-auto px-4 md:px-6">

                {/* VIEW 1: Credential Vault Gallery Grid View */}
                {viewMode === 'grid' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] rounded-[2.5rem] p-8 border border-[var(--glass-border)] shadow-xl">
                            <div>
                                <span className="text-xs font-black uppercase tracking-widest text-violet-400 flex items-center gap-2 mb-2">
                                    <Sparkles size={16} /> Recipient Credential Vault &bull; {searchEmail || certificate?.recipientEmail}
                                </span>
                                <h1 className="text-3xl font-black text-[var(--text-heading)] tracking-tight">
                                    Certificates Awarded To You ({certificatesList.length})
                                </h1>
                                <p className="text-sm font-bold text-[var(--text-muted)] mt-1">
                                    Official credentials issued directly to your email address across all participating institutions.
                                </p>
                            </div>
                            <button
                                onClick={handleLockVault}
                                className="px-5 py-3 bg-[var(--bg-input)] hover:bg-rose-500/10 hover:text-rose-500 text-xs font-black uppercase tracking-widest text-[var(--text-muted)] rounded-2xl border border-[var(--glass-border)] transition-all active:scale-95 shrink-0"
                            >
                                🔒 Lock Vault Session
                            </button>
                        </div>

                        {/* 3-Column Certificate Gallery Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {certificatesList.map((cert, idx) => (
                                <div
                                    key={cert.certId || idx}
                                    onClick={() => {
                                        setCertificate(cert);
                                        setNewName(cert.recipientName);
                                        setViewMode('detail');
                                    }}
                                    className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-interactive)] hover:border-violet-500/60 p-6 flex flex-col justify-between shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full">
                                                #{idx + 1} &bull; Verified
                                            </span>
                                            <span className="text-[10px] font-mono font-bold text-slate-400">
                                                {formatDateDDMMYYYY(cert.issueDate)}
                                            </span>
                                        </div>

                                        {/* Certificate Image Thumbnail Preview */}
                                        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-[var(--glass-border)] aspect-[4/3] flex items-center justify-center group-hover:border-violet-500/40 transition-colors">
                                            <img
                                                src={cert.renderedImageUrl || `${import.meta.env.VITE_API_BASE_URL}/api/certificates/og-image/${cert.certId}`}
                                                alt={cert.certificateTitle}
                                                className="w-full h-full object-contain transition-transform group-hover:scale-105"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/assets/academic-template-D-Nc10FI.jpg';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-violet-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-black text-xs uppercase tracking-widest backdrop-blur-[2px]">
                                                <Eye size={18} /> Open Certificate
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-black text-[var(--text-heading)] group-hover:text-violet-400 transition-colors line-clamp-1">
                                                {cert.certificateTitle || 'Certificate of Achievement'}
                                            </h3>
                                            <p className="text-xs font-bold text-[var(--text-muted)] mt-1">
                                                Issued by {cert.orgName || cert.issuerName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-[var(--border-muted)] flex items-center justify-between">
                                        <span className="text-xs font-bold text-[var(--text-main)]">
                                            {cert.recipientName}
                                        </span>
                                        <div className="w-8 h-8 rounded-xl bg-violet-600/10 text-violet-500 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* VIEW 2: Dedicated Certificate Detail Page */}
                {viewMode === 'detail' && certificate && (
                    <div className="space-y-8 animate-in fade-in duration-500">

                        {/* Top Back Header & Switcher */}
                        {certificatesList.length > 1 && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-card)] rounded-[2.5rem] p-6 border border-[var(--glass-border)] shadow-xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className="flex items-center gap-3 px-5 py-3 bg-[var(--bg-input)] hover:bg-violet-600 hover:text-white text-xs font-black uppercase tracking-widest text-[var(--text-heading)] rounded-2xl border border-[var(--glass-border)] transition-all active:scale-95 shrink-0"
                                >
                                    <ArrowLeft size={16} /> Back to Credential Vault ({certificatesList.length})
                                </button>
                                <div className="flex gap-2 overflow-x-auto custom-scrollbar">
                                    {certificatesList.map((c, i) => (
                                        <button
                                            key={c.certId || i}
                                            onClick={() => {
                                                setCertificate(c);
                                                setNewName(c.recipientName);
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                certificate.certId === c.certId
                                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                                                    : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-white'
                                            }`}
                                        >
                                            #{i + 1} &bull; {c.certificateTitle || 'Certificate'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                            {/* Left Column: Achievement & High-Res Certificate Image Box */}
                            <div className="lg:col-span-8 space-y-8">
                                <div className="glass-card rounded-[32px] p-8 md:p-12 relative overflow-hidden border border-[var(--glass-border)] shadow-2xl">
                                    {/* Decorative elements */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[100px] -z-10"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -z-10"></div>

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/20 rotate-3">
                                                <Award className="text-white" size={32} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] mb-1">Official Achievement</p>
                                                <h1 className="text-3xl font-black text-[var(--text-heading)] tracking-tight">
                                                    {certificate.certificateTitle || 'Certification Portal'}
                                                </h1>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {certificate.orgLogoUrl && (
                                                <img src={certificate.orgLogoUrl} alt={certificate.orgName} className="h-10 object-contain opacity-80" />
                                            )}
                                            <div className="text-left md:text-right">
                                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">Issued By</p>
                                                <p className="text-sm font-black text-[var(--text-heading)] transition-colors">{certificate.orgName || certificate.issuerName}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* HIGH-RESOLUTION VISUAL CERTIFICATE PREVIEW CANVAS BOX */}
                                    <div className="relative group rounded-3xl overflow-hidden border border-[var(--glass-border)] shadow-2xl bg-slate-950 mb-10 flex justify-center items-center p-2 md:p-4">
                                        <img
                                            src={certificate.renderedImageUrl || `${import.meta.env.VITE_API_BASE_URL}/api/certificates/og-image/${certificate.certId}`}
                                            alt={certificate.certificateTitle}
                                            className="w-full h-auto max-h-[550px] object-contain rounded-2xl shadow-2xl transition-all group-hover:scale-[1.01]"
                                        />
                                        <button
                                            onClick={() => setZoomModalOpen(true)}
                                            className="absolute bottom-6 right-6 px-5 py-3 bg-black/80 hover:bg-violet-600 text-white rounded-2xl border border-white/20 backdrop-blur-md flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105"
                                        >
                                            <Maximize2 size={16} /> Full-Screen Zoom
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Recipient Name</label>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-heading)] to-[var(--text-muted)]">
                                                        {certificate.recipientName}
                                                    </p>
                                                    {certificate.correctionStatus === 'approved' && <CheckCircle size={18} className="text-emerald-500" />}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Issue Date</label>
                                                <p className="text-lg font-mono font-bold text-[var(--text-heading)]">
                                                    {formatDateDDMMYYYY(certificate.issueDate)}
                                                </p>
                                            </div>

                                            <div className="pt-6 border-t border-[var(--glass-border)] flex flex-wrap gap-4">
                                                <a
                                                    href={`${window.location.origin}/verify/${certificate.certId}`}
                                                    target="_blank"
                                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--glass)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-violet-500 rounded-xl border border-[var(--glass-border)] transition-all"
                                                >
                                                    <ShieldCheck size={14} />
                                                    Public Verification
                                                    <ExternalLink size={12} />
                                                </a>
                                                <button
                                                    onClick={handleDownload}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--glass)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-violet-500 rounded-xl border border-[var(--glass-border)] transition-all"
                                                >
                                                    <Download size={14} />
                                                    Certificate PDF
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-violet-600/5 rounded-3xl p-6 border border-violet-500/10 space-y-4">
                                            <div className="flex items-center gap-3 text-violet-500">
                                                <Share2 size={20} />
                                                <h4 className="font-black text-sm uppercase tracking-widest">Share Achievement</h4>
                                            </div>
                                            <p className="text-xs font-medium text-[var(--text-muted)] leading-relaxed">
                                                Add this certification to your professional identity. Verified credentials improve profile visibility by up to 6x.
                                            </p>
                                            <button
                                                onClick={handleLinkedInShare}
                                                className="w-full py-4 bg-[#0077b5] hover:bg-[#006399] text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-[#0077b5]/20 group"
                                            >
                                                <Linkedin size={20} className="group-hover:scale-110 transition-transform" />
                                                Add to LinkedIn
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Correction Section */}
                                <div className="glass-card rounded-[32px] p-8 border border-[var(--glass-border)] shadow-xl relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                                <Edit3 className="text-amber-500" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-[var(--text-heading)] tracking-tight">Need a fix?</h3>
                                                <p className="text-xs font-medium text-[var(--text-muted)]">Found a typo in your name? Request a quick correction.</p>
                                            </div>
                                        </div>
                                        {!showCorrectionForm && !certificate.correctionRequested && (
                                            <button
                                                onClick={() => setShowCorrectionForm(true)}
                                                className="px-6 py-3 bg-[var(--bg-input)] hover:bg-amber-500/10 hover:text-amber-500 border border-[var(--glass-border)] hover:border-amber-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                            >
                                                Request Correction
                                            </button>
                                        )}
                                        {certificate.correctionRequested && (
                                            <div className="px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                                                <Loader size={14} className="animate-spin text-amber-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Correction Pending</span>
                                            </div>
                                        )}
                                    </div>

                                    {showCorrectionForm && (
                                        <form onSubmit={handleCorrectionSubmit} className="mt-8 pt-8 border-t border-[var(--glass-border)] space-y-6 animate-in slide-in-from-top-4">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Corrected Name</label>
                                                <input
                                                    type="text"
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    placeholder="Enter your full name as it should appear"
                                                    className="w-full bg-[var(--bg-input)] border border-[var(--glass-border)] rounded-2xl px-6 py-4 text-[var(--text-main)] font-black focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex gap-4">
                                                <button
                                                    type="submit"
                                                    disabled={submittingCorrection || !newName.trim()}
                                                    className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl shadow-xl shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {submittingCorrection ? <Loader className="animate-spin" /> : 'Submit Correction'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCorrectionForm(false)}
                                                    className="px-8 py-4 bg-[var(--bg-input)] text-[var(--text-muted)] font-black rounded-2xl hover:bg-[var(--glass)] transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Issuer Info & Digital Badge */}
                            <div className="lg:col-span-4 space-y-8">
                                <div className="glass-card rounded-[32px] p-8 border border-[var(--glass-border)] shadow-xl relative overflow-hidden text-center space-y-6">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] text-left">Issued By</p>
                                    <div className="w-24 h-24 bg-[var(--bg-input)] rounded-3xl mx-auto flex items-center justify-center p-4 border border-[var(--glass-border)] shadow-inner">
                                        {certificate.orgLogoUrl ? (
                                            <img src={certificate.orgLogoUrl} alt={certificate.orgName} className="max-w-full max-h-full object-contain" />
                                        ) : (
                                            <CheckCircle className="text-violet-500" size={40} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl text-[var(--text-heading)]">{certificate.orgName || certificate.issuerName}</h3>
                                        <p className="text-xs font-bold text-emerald-500 mt-1">Verified Issuer</p>
                                    </div>
                                    <a
                                        href={`mailto:${certificate.issuerEmail || 'support@pramanit.org'}?subject=Inquiry regarding Certificate ${certificate.certId}`}
                                        className="w-full py-4 bg-[var(--bg-input)] hover:bg-[var(--glass)] text-[var(--text-heading)] font-black rounded-2xl border border-[var(--glass-border)] flex items-center justify-center gap-3 transition-all text-xs uppercase tracking-widest"
                                    >
                                        <Mail size={16} /> Contact Issuer
                                    </a>
                                </div>
                                <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[32px] p-8 text-white space-y-6 shadow-2xl shadow-violet-500/20 relative overflow-hidden">
                                    <div className="flex items-center gap-3">
                                        <Sparkles size={24} />
                                        <h3 className="font-black text-lg">Digital Badge</h3>
                                    </div>
                                    <p className="text-xs text-violet-100 font-medium leading-relaxed">
                                        Power your career with blockchain-grade verification. Every Pramanit credential is unique and immutable.
                                    </p>
                                    <div className="pt-4 border-t border-white/10 space-y-2 text-[10px] font-black uppercase tracking-widest text-violet-200">
                                        <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> VERIFIED STATUS</p>
                                        <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-violet-400"></span> 256-BIT HASHED</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
