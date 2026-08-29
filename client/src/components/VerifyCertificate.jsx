import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import {
    CheckCircle, AlertCircle, Calendar, User, ShieldCheck, Mail, Hash,
    Sparkles, Linkedin, Eye, ArrowRight, Copy, Twitter, Instagram,
    MessageCircle, Download, Check, ExternalLink, Shield, Award, Maximize2, X
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import logo from '../assets/Pramanit logo.png';

const InfoCard = ({ icon: Icon, label, value, color }) => {
    const colorStyles = {
        violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };

    return (
        <div className="p-6 bg-[var(--bg-card)]/80 backdrop-blur-xl border border-[var(--border-muted)] rounded-[2rem] hover:border-violet-500/30 transition-all duration-300 shadow-xl group">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 border ${colorStyles[color]} group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={20} />
            </div>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-black text-[var(--text-heading)] tracking-tight break-words">{value}</p>
        </div>
    );
};

const VerifyCertificate = ({ theme, setTheme }) => {
    const { id } = useParams();
    const [loading, setLoading] = useState(id !== 'HUB');
    const [certificate, setCertificate] = useState(null);
    const [error, setError] = useState(null);
    const [manualId, setManualId] = useState('');
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const [copiedCaption, setCopiedCaption] = useState(false);
    const [isFullImageOpen, setIsFullImageOpen] = useState(false);

    const fetchCertificate = async (searchId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/verify/${searchId}`);
            setCertificate(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Certificate verification failed.');
            setCertificate(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id && id !== 'HUB') {
            fetchCertificate(id);
        } else {
            setLoading(false);
        }
    }, [id]);

    const baseUrl = window.location.origin;
    const certUrl = window.location.href;
    const certImage = certificate
        ? (certificate.renderedImageUrl || certificate.rendered_image_url || `${import.meta.env.VITE_API_BASE_URL}/api/certificates/og-image/${certificate.certId}`)
        : `${baseUrl}/logo.png`;
    const certTitle = certificate ? `Verified: ${certificate.recipientName}'s Credential` : 'Verify Credential | Pramanit';
    const certDesc = certificate ? `Authentic achievement issued by ${certificate.orgName || 'Certified Organization'}. Verified via Pramanit Trust Standard.` : 'Verify the authenticity of Pramanit credentials.';

    const handleManualSearch = (e) => {
        e.preventDefault();
        if (manualId.trim()) {
            fetchCertificate(manualId.trim());
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(certUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                    <p className="text-violet-400 font-black uppercase tracking-widest text-[10px]">Verifying Credential Integrity...</p>
                </div>
            </div>
        );
    }

    if (!certificate && !loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] selection:bg-violet-500/30 transition-colors duration-500">
                <Header onGetStarted={() => window.location.href = '/'} theme={theme} setTheme={setTheme} />
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-violet-600/10 blur-[140px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/10 blur-[140px] rounded-full"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center pt-40 pb-20 px-6">
                    <div className="w-full max-w-xl text-center">
                        <div className="flex justify-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-2xl shadow-violet-500/20 transform -rotate-6">
                                    <img src={logo} alt="Pramanit Logo" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-3xl font-black text-[var(--text-heading)] tracking-tighter">Pramanit</span>
                            </div>
                        </div>
                        <div className="glass rounded-[3rem] p-10 md:p-12 border-[var(--glass-border)] shadow-2xl animate-in zoom-in-95 duration-500">
                            <h1 className="text-3xl font-black text-[var(--text-heading)] mb-2 tracking-tight transition-colors">Trust Verification Portal</h1>
                            <p className="text-[var(--text-muted)] text-xs mb-8 font-black uppercase tracking-widest transition-colors">Verify the authenticity of any Pramanit Credential</p>

                            <form onSubmit={handleManualSearch} className="relative group mb-6">
                                <input
                                    type="text"
                                    placeholder="Enter Certificate Serial ID (e.g. CERT-XXXX...)"
                                    value={manualId}
                                    onChange={(e) => setManualId(e.target.value)}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--glass-border)] rounded-2xl pl-6 pr-14 py-5 text-[var(--text-main)] font-mono text-xs font-bold focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all placeholder:text-[var(--text-muted)]"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-500 text-white p-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/20"
                                >
                                    <ArrowRight size={20} />
                                </button>
                            </form>

                            {error && (
                                <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                            )}

                            <div className="mt-10 pt-10 border-t border-[var(--glass-border)] grid grid-cols-2 gap-6">
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 transition-colors">Instant QR Scan</p>
                                    <p className="text-xs font-bold text-[var(--text-muted)] opacity-80 leading-relaxed transition-colors">Scan the security QR code on any certificate copy.</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 transition-colors">Manual Lookup</p>
                                    <p className="text-xs font-bold text-[var(--text-muted)] opacity-80 leading-relaxed transition-colors">Input the unique 36-character Serial ID found on the certificate.</p>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-[var(--glass-border)] flex flex-col items-center gap-3">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Recipient Recovery</p>
                                <a
                                    href="/portal"
                                    className="flex items-center gap-2 text-xs font-black text-violet-500 hover:text-violet-400 transition-colors group"
                                >
                                    Access Recipient Recovery Portal
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)] selection:bg-violet-500/30 transition-colors duration-500">
            <Helmet>
                <title>{certTitle}</title>
                <meta name="description" content={certDesc} />
                <meta property="og:title" content={certTitle} />
                <meta property="og:description" content={certDesc} />
                <meta property="og:image" content={certImage} />
                <meta property="og:url" content={certUrl} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={certTitle} />
                <meta name="twitter:description" content={certDesc} />
                <meta name="twitter:image" content={certImage} />

                {certificate && (
                    <script type="application/ld+json">
                        {JSON.stringify({
                            "@context": ["https://www.w3.org/ns/credentials/v2"],
                            "type": ["VerifiableCredential"],
                            "issuer": {
                                "type": "Profile",
                                "name": certificate.orgName,
                                "url": baseUrl
                            },
                            "credentialSubject": {
                                "id": certificate.recipientEmail || certUrl,
                                "name": certificate.recipientName,
                                "achievement": {
                                    "name": certificate.certificateTitle || "Professional Certificate",
                                    "description": certDesc,
                                    "image": certImage
                                }
                            }
                        })}
                    </script>
                )}
            </Helmet>

            <Header onGetStarted={() => window.location.href = '/'} theme={theme} setTheme={setTheme} />

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-violet-600/15 blur-[140px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-emerald-600/10 blur-[140px] rounded-full"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto pt-36 pb-20 px-4 sm:px-6">
                <div className="glass rounded-[3rem] p-6 sm:p-10 md:p-12 border-[var(--glass-border)] shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* Verified Status Banner */}
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="relative mb-6">
                            <div className="w-24 h-24 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] flex items-center justify-center shadow-2xl overflow-hidden group">
                                {certificate.orgLogoUrl ? (
                                    <img src={certificate.orgLogoUrl} alt={certificate.orgName} className="w-full h-full object-contain p-3" />
                                ) : (
                                    <ShieldCheck size={52} className="text-emerald-400" />
                                )}
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-4 ring-[var(--bg-main)] ${certificate.status === 'revoked' ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-white'}`}>
                                {certificate.status === 'revoked' ? <AlertCircle size={18} strokeWidth={3} /> : <Check size={18} strokeWidth={3} />}
                            </div>
                        </div>

                        {certificate.status === 'revoked' ? (
                            <div className="inline-flex items-center gap-2 px-5 py-2 bg-rose-500/10 border border-rose-500/30 rounded-full mb-4">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                <span className="text-xs font-black text-rose-400 uppercase tracking-widest">Revoked Credential &bull; Invalidated by Issuer</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-4">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Pramanit Authenticated Credential</span>
                            </div>
                        )}

                        {certificate.status === 'revoked' && (
                            <div className="w-full max-w-xl mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-bold text-center">
                                ⚠️ <strong>Security Notice:</strong> This certificate was officially revoked by <strong>{certificate.orgName || 'the issuing authority'}</strong> and is no longer valid for official use or verification.
                            </div>
                        )}

                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-heading)] tracking-tight mb-2">
                            {certificate.recipientName}
                        </h1>
                        <p className="text-sm font-bold text-violet-400 uppercase tracking-wider">
                            {certificate.certificateTitle || 'Certificate of Achievement'} &bull; {certificate.orgName || 'Certified Organization'}
                        </p>
                    </div>

                    {/* Action Toolbar */}
                    <div className="p-6 bg-[var(--bg-input)]/80 backdrop-blur-xl border border-[var(--border-muted)] rounded-3xl mb-12 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2">
                                <ShieldCheck size={16} className="text-emerald-400" /> Public Verification Standard
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {certificate.socialSettings?.allow_sharing !== false && (
                                <button
                                    onClick={() => {
                                        const issueDate = new Date(certificate.issueDate);
                                        const certName = certificate.certificateTitle || 'Verified Professional Credential';
                                        const params = new URLSearchParams({
                                            startTask: 'CERTIFICATION_NAME',
                                            name: certName,
                                            organizationName: certificate.orgName || 'Pramanit Trusted Issuer',
                                            issueYear: issueDate.getFullYear(),
                                            issueMonth: issueDate.getMonth() + 1,
                                            certId: certificate.certId,
                                            certUrl: window.location.href
                                        });
                                        window.open(`https://www.linkedin.com/profile/add?${params.toString()}`, '_blank');
                                    }}
                                    className="px-5 py-3.5 rounded-2xl bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
                                >
                                    <Linkedin size={16} /> Add to LinkedIn
                                </button>
                            )}

                            <button
                                onClick={handleCopyLink}
                                className="px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[var(--text-main)] border border-white/10 font-bold text-xs transition-all flex items-center gap-2"
                            >
                                {copiedLink ? (
                                    <>
                                        <Check size={16} className="text-emerald-400" /> <span className="text-emerald-400">Link Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} /> Copy Verification Link
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 4-Pillars Credential Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                        <InfoCard
                            icon={ShieldCheck}
                            label="Issuing Organization"
                            value={certificate.orgName || 'Certified Organization'}
                            color="emerald"
                        />
                        <InfoCard
                            icon={User}
                            label="Issued By (Signer)"
                            value={certificate.issuerName || 'Authorized Signer'}
                            color="violet"
                        />
                        <InfoCard
                            icon={ShieldCheck}
                            label="Issuer Designation"
                            value={certificate.issuerDesignation || 'Issuing Authority'}
                            color="blue"
                        />
                        <InfoCard
                            icon={Calendar}
                            label="Issue Date"
                            value={(() => {
                                const d = new Date(certificate.issueDate);
                                return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                            })()}
                            color="indigo"
                        />
                        <InfoCard
                            icon={User}
                            label="Recipient Name"
                            value={certificate.recipientName}
                            color="violet"
                        />
                        <InfoCard
                            icon={Eye}
                            label="Verification Scans"
                            value={`${certificate.scanCount || 0} Total Verification Hits`}
                            color="slate"
                        />
                    </div>

                    {/* INSTITUTION IDENTITY TRANSPARENCY CARD */}
                    {certificate.verificationStatus === 'approved' && (
                        <div className="p-6 bg-emerald-950/30 border border-emerald-500/30 rounded-3xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl animate-in fade-in duration-500">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                                    <ShieldCheck size={32} />
                                </div>
                                <div>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/40 mb-1">
                                        {certificate.issuerType === 'student_council' ? '🎓 Verified Campus Student Council' : '🏛️ Verified Educational Institution'}
                                    </span>
                                    <h4 className="text-lg font-black text-[var(--text-heading)]">
                                        Identity Verified & Authorized Issuer
                                    </h4>
                                    <p className="text-xs font-bold text-[var(--text-muted)] mt-0.5">
                                        Official Registration / Roll ID: <span className="text-emerald-400 font-mono">#{certificate.institutionIdNumber}</span>
                                        {certificate.verifiedAt && ` • Approved on ${new Date(certificate.verifiedAt).toLocaleDateString()}`}
                                    </p>
                                </div>
                            </div>

                            {certificate.officialIdUrl && (
                                <a
                                    href={certificate.officialIdUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 shrink-0 active:scale-95"
                                >
                                    <ExternalLink size={16} /> View Faculty Authorization Letter / ID
                                </a>
                            )}
                        </div>
                    )}

                    {/* Digital Fingerprint Block */}
                    <div className="p-6 bg-[var(--bg-input)]/80 backdrop-blur-xl border border-[var(--border-muted)] rounded-3xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Hash size={14} className="text-violet-400" />
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Cryptographic Serial ID (SHA-256)</p>
                            </div>
                            <p className="text-xs font-mono text-[var(--text-main)] font-bold break-all opacity-80">{certificate.certId}</p>
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(certificate.certId);
                                setCopiedId(true);
                                setTimeout(() => setCopiedId(false), 2500);
                            }}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-white border border-white/10 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
                        >
                            {copiedId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            {copiedId ? <span className="text-emerald-400">ID Copied!</span> : 'Copy ID'}
                        </button>
                    </div>

                    {/* Open Badges 3.0 Interoperability Notice */}
                    <div className="p-6 bg-violet-500/5 border border-violet-500/15 rounded-3xl flex items-center gap-4 mb-12">
                        <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/30 shrink-0">
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">Open Badges 3.0 Standard & Cloudinary CDN Immunity</p>
                            <p className="text-xs font-bold text-[var(--text-main)] opacity-80 leading-relaxed">
                                This credential features embedded Open Badges metadata and Cloudinary CDN storage. It remains permanently verifiable and immune to template deletion.
                            </p>
                        </div>
                    </div>

                    {/* Social Share & Caption Section */}
                    {certificate.socialSettings?.allow_sharing !== false && (
                        <div className="pt-10 border-t border-[var(--glass-border)]">
                            <h3 className="text-[var(--text-heading)] font-black text-xl mb-4">Share Your Verifiable Achievement</h3>

                            {/* Caption Copy Box */}
                            <div className="mb-8 p-6 bg-[var(--bg-input)] border border-[var(--border-muted)] rounded-3xl flex flex-col gap-3 shadow-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Suggested Share Caption</span>
                                    <button
                                        onClick={() => {
                                            const hashtags = certificate.socialSettings?.default_hashtags || '#Learning #ProfessionalDevelopment #Pramanit';
                                            const caption = `I'm excited to announce that I've earned my verified ${certificate.certificateTitle || 'certification'} from ${certificate.orgName || 'Pramanit'}! 🎓\n\nVerify my credential: ${certUrl}\n\n${hashtags}`;
                                            navigator.clipboard.writeText(caption);
                                            setCopiedCaption(true);
                                            setTimeout(() => setCopiedCaption(false), 2500);
                                        }}
                                        className="text-violet-400 hover:text-violet-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                                    >
                                        {copiedCaption ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        {copiedCaption ? <span className="text-emerald-400">Caption Copied!</span> : 'Copy Caption'}
                                    </button>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">
                                    "I'm excited to announce that I've earned my verified {certificate.certificateTitle || 'certification'} from {certificate.orgName || 'Pramanit'}! 🎓 Verify my credential: {certUrl}"
                                </p>
                            </div>

                            {/* Social Sharing Buttons */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <button
                                    onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certUrl)}`, '_blank', 'width=600,height=600')}
                                    className="flex items-center justify-center gap-2.5 p-4 bg-[#0a66c2]/10 border border-[#0a66c2]/30 hover:bg-[#0a66c2]/20 rounded-2xl transition-all group"
                                >
                                    <Linkedin size={18} className="text-[#0a66c2] group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-black text-[#0a66c2]">LinkedIn</span>
                                </button>

                                <button
                                    onClick={() => {
                                        const text = `I earned a verified ${certificate.certificateTitle || 'certificate'} from ${certificate.orgName}! 🎓`;
                                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(certUrl)}`, '_blank', 'width=600,height=400');
                                    }}
                                    className="flex items-center justify-center gap-2.5 p-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition-all group"
                                >
                                    <Twitter size={18} className="text-[var(--text-main)] group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-black text-[var(--text-main)]">X / Tweet</span>
                                </button>

                                <button
                                    onClick={() => {
                                        const text = `Check out my verified credential: ${certUrl}`;
                                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                    }}
                                    className="flex items-center justify-center gap-2.5 p-4 bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 rounded-2xl transition-all group"
                                >
                                    <MessageCircle size={18} className="text-[#25D366] group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-black text-[#25D366]">WhatsApp</span>
                                </button>

                                <a
                                    href={certImage}
                                    download={`certificate-${certificate.certId}.png`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2.5 p-4 bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 rounded-2xl transition-all group"
                                    title="Download image for Instagram Story"
                                >
                                    <Instagram size={18} className="text-pink-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-black text-pink-500">Story Image</span>
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Footer Authority Info */}
                    <div className="mt-12 text-center space-y-4 pt-10 border-t border-[var(--glass-border)]">
                        <div className="flex justify-center flex-col items-center gap-2">
                            <p className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Powered by</p>
                            <div className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                                <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/30">
                                    <Shield className="text-white" size={14} />
                                </div>
                                <span className="text-base font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent tracking-tighter">Pramanit</span>
                            </div>
                        </div>
                        <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-lg mx-auto transition-colors opacity-70">
                            This credential was generated using Pramanit cryptographic trust engine.<br />
                            Tampering with this document renders the digital fingerprint invalid.
                        </p>
                    </div>
                </div>
                <Footer />
            </div>

            {/* Full-Screen Image Lightbox Modal */}
            {isFullImageOpen && (
                <div className="fixed inset-0 z-[600] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <button
                        onClick={() => setIsFullImageOpen(false)}
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
                    >
                        <X size={24} />
                    </button>
                    <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center p-2">
                        <img
                            src={certImage}
                            alt={`Full certificate for ${certificate.recipientName}`}
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerifyCertificate;
