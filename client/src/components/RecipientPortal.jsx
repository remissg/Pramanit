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
    Award
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

export default function RecipientPortal({ theme, setTheme }) {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCorrectionForm, setShowCorrectionForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [submittingCorrection, setSubmittingCorrection] = useState(false);
    const [correctionMessage, setCorrectionMessage] = useState(null);

    useEffect(() => {
        if (!token) {
            setError('Access token is missing. Please use the link provided in your email.');
            setLoading(false);
            return;
        }

        const fetchCertificate = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/certificates/portal?token=${token}`);
                setCertificate(response.data);
                setNewName(response.data.recipientName);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load certificate portal.');
            } finally {
                setLoading(false);
            }
        };

        fetchCertificate();
    }, [token]);

    const handleCorrectionSubmit = async (e) => {
        e.preventDefault();
        if (!newName.trim() || newName === certificate.recipientName) return;

        setSubmittingCorrection(true);
        try {
            await axios.post('http://localhost:5000/api/certificates/request-correction', {
                token,
                newName
            });
            setCorrectionMessage({ type: 'success', text: 'Request submitted! Your issuer will review it shortly.' });
            setShowCorrectionForm(false);
            // Update local state to show pending
            setCertificate(prev => ({ ...prev, correctionRequested: true, correctionStatus: 'pending' }));
        } catch (err) {
            setCorrectionMessage({ type: 'error', text: 'Failed to submit request. Please try again.' });
        } finally {
            setSubmittingCorrection(false);
        }
    };

    const handleLinkedInShare = () => {
        if (!certificate) return;

        const baseUrl = "https://www.linkedin.com/profile/add";
        const params = new URLSearchParams({
            startTask: "CERTIFICATION_NAME",
            name: certificate.issuerName + " Certification",
            organizationName: certificate.orgName || "Pramanit",
            issueYear: new Date(certificate.issueDate).getFullYear(),
            issueMonth: new Date(certificate.issueDate).getMonth() + 1,
            certUrl: `http://localhost:5173/verify/${certificate.certId}`,
            certId: certificate.certId
        });

        window.open(`${baseUrl}?${params.toString()}`, '_blank');
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
                            onClick={() => navigate('/')}
                            className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl shadow-lg shadow-violet-500/20 transition-all active:scale-95"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)] font-sans text-[var(--text-main)] selection:bg-violet-500/30">
            <Header theme={theme} setTheme={setTheme} />

            <main className="pt-32 md:pt-40 pb-20 max-w-7xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: Achievement Details */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="glass-card rounded-[32px] p-8 md:p-12 relative overflow-hidden border border-[var(--glass-border)] shadow-2xl">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[100px] -z-10"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -z-10"></div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/20 rotate-3">
                                        <Award className="text-white" size={32} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] mb-1">Official Achievement</p>
                                        <h1 className="text-3xl font-black text-[var(--text-heading)] tracking-tight">Certification Portal</h1>
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
                                        <p className="text-lg font-bold text-[var(--text-heading)]">
                                            {new Date(certificate.issueDate).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-[var(--glass-border)] flex flex-wrap gap-4">
                                        <a
                                            href={`http://localhost:5173/verify/${certificate.certId}`}
                                            target="_blank"
                                            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--glass)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-violet-500 rounded-xl border border-[var(--glass-border)] transition-all"
                                        >
                                            <ShieldCheck size={14} />
                                            Public Verification
                                            <ExternalLink size={12} />
                                        </a>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--glass)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-violet-500 rounded-xl border border-[var(--glass-border)] transition-all">
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

                            {correctionMessage && (
                                <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${correctionMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                    {correctionMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                    <p className="text-xs font-bold uppercase tracking-widest">{correctionMessage.text}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Issuer Info */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="glass-card rounded-[32px] p-8 border border-[var(--glass-border)] shadow-xl">
                            <h3 className="font-black text-[var(--text-heading)] tracking-tight mb-6 uppercase text-xs tracking-widest text-violet-500">Issued by</h3>
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-24 h-24 bg-gradient-to-br from-[var(--bg-input)] to-[var(--glass)] rounded-[32px] flex items-center justify-center border border-[var(--glass-border)] p-4 shadow-inner">
                                    {certificate.orgLogoUrl ? (
                                        <img src={certificate.orgLogoUrl} alt={certificate.orgName} className="w-full h-full object-contain" />
                                    ) : (
                                        <CheckCircle className="text-violet-500/50" size={40} />
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-[var(--text-heading)]">{certificate.orgName || certificate.issuerName}</h4>
                                    <p className="text-xs font-bold text-[var(--text-muted)]">{certificate.issuerDesignation || 'Verified Issuer'}</p>
                                </div>
                                <div className="w-full pt-6 border-t border-[var(--glass-border)] space-y-4">
                                    <a
                                        href={`mailto:${certificate.issuerEmail}`}
                                        className="w-full py-4 bg-[var(--bg-input)] hover:bg-[var(--glass)] text-[var(--text-main)] border border-[var(--glass-border)] font-black rounded-2xl flex items-center justify-center gap-3 transition-all group"
                                    >
                                        <Mail size={18} className="group-hover:-rotate-6 transition-transform" />
                                        Contact Issuer
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[32px] p-8 text-white shadow-2xl shadow-violet-500/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Sparkles size={16} />
                                </div>
                                <h4 className="font-black text-sm uppercase tracking-widest">Digital Badge</h4>
                            </div>
                            <p className="text-sm font-bold opacity-90 leading-relaxed mb-6">
                                Power your career with blockchain-grade verification. Every Pramanit credential is unique and immutable.
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-xs font-black">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                                    VERIFIED STATUS
                                </div>
                                <div className="flex items-center gap-3 text-xs font-black opacity-60">
                                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                                    256-BIT HASHED
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
