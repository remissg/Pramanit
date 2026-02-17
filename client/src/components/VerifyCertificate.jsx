import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, AlertCircle, Calendar, User, ShieldCheck, Mail, Hash, Sparkles, Linkedin, Eye, ArrowRight, Copy, Twitter, Instagram, MessageCircle, Download } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import logo from '../assets/CertiFlow logo (1).png';

const InfoCard = ({ icon: Icon, label, value, color }) => {
    const colorStyles = {
        violet: 'bg-violet-500/10 text-violet-400',
        blue: 'bg-blue-500/10 text-blue-400',
        indigo: 'bg-indigo-500/10 text-indigo-400',
        slate: 'bg-slate-500/10 text-slate-400',
        emerald: 'bg-emerald-500/10 text-emerald-400'
    };

    return (
        <div className="p-6 bg-[var(--glass)] border border-[var(--glass-border)] rounded-[2rem] hover:bg-white/5 transition-all duration-300">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${colorStyles[color]}`}>
                <Icon size={20} />
            </div>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-[var(--text-main)] tracking-tight break-words">{value}</p>
        </div>
    );
};

const VerifyCertificate = ({ theme, setTheme }) => {
    const { id } = useParams();
    const [loading, setLoading] = useState(id !== 'HUB');
    const [certificate, setCertificate] = useState(null);
    const [error, setError] = useState(null);
    const [manualId, setManualId] = useState('');

    const fetchCertificate = async (searchId) => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/certificates/verify/${searchId}`);
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

    // SEO and Social Metadata managed via Helmet in render
    const baseUrl = window.location.origin;
    const certUrl = window.location.href;
    const certImage = certificate ? `http://localhost:5000/api/certificates/og-image/${certificate.certId}` : `${baseUrl}/logo.png`;
    const certTitle = certificate ? `Verified: ${certificate.recipientName}'s Credential` : 'Verify Credential | Pramanit';
    const certDesc = certificate ? `Authentic achievement issued by ${certificate.orgName}. Verified via Pramanit Trust Standard.` : 'Verify the authenticity of Pramanit credentials.';


    const handleManualSearch = (e) => {
        e.preventDefault();
        if (manualId.trim()) {
            fetchCertificate(manualId.trim());
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                    <p className="text-violet-400 font-black uppercase tracking-widest text-[10px]">Verifying Credential...</p>
                </div>
            </div>
        );
    }

    if (!certificate && !loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] selection:bg-violet-500/30 transition-colors duration-500">
                <Header onGetStarted={() => window.location.href = '/'} theme={theme} setTheme={setTheme} />
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center pt-40 pb-20 px-6">
                    <div className="w-full max-w-xl text-center">
                        <div className="flex justify-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-xl shadow-violet-500/10 transform -rotate-6">
                                    <img src={logo} alt="Pramanit Logo" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-3xl font-black text-[var(--text-heading)] tracking-tighter">Pramanit</span>
                            </div>
                        </div>
                        <div className="glass rounded-[3rem] p-12 border-[var(--glass-border)] shadow-2xl animate-in zoom-in-95 duration-500">
                            <h1 className="text-3xl font-black text-[var(--text-heading)] mb-2 tracking-tight transition-colors">Trust Standard Portal</h1>
                            <p className="text-[var(--text-muted)] text-sm mb-10 font-bold uppercase tracking-widest transition-colors">Verify the authenticity of any CertiFlow Credential</p>

                            <form onSubmit={handleManualSearch} className="relative group">
                                <input
                                    type="text"
                                    placeholder="Enter Verification ID (e.g. CERT-XXXX...)"
                                    value={manualId}
                                    onChange={(e) => setManualId(e.target.value)}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--glass-border)] rounded-2xl px-6 py-5 text-[var(--text-main)] font-mono text-sm focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all placeholder:text-[var(--text-muted)] group-hover:border-[var(--glass-border)]"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-500 text-white p-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/20"
                                >
                                    <ArrowRight size={20} />
                                </button>
                            </form>

                            {error && (
                                <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                            )}

                            <div className="mt-12 pt-12 border-t border-[var(--glass-border)] grid grid-cols-2 gap-8">
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 transition-colors">Automated</p>
                                    <p className="text-xs font-bold text-[var(--text-muted)] opacity-80 leading-relaxed transition-colors">Scan the secure QR code on any physical or digital copy.</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 transition-colors">Manual</p>
                                    <p className="text-xs font-bold text-[var(--text-muted)] opacity-80 leading-relaxed transition-colors">Input the unique 36-character Serial ID found on the certificate.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div >
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)] selection:bg-violet-500/30 transition-colors duration-500">
            <Helmet>
                <title>{certTitle}</title>
                <meta name="description" content={certDesc} />

                {/* Open Graph */}
                <meta property="og:title" content={certTitle} />
                <meta property="og:description" content={certDesc} />
                <meta property="og:image" content={certImage} />
                <meta property="og:url" content={certUrl} />
                <meta property="og:type" content="website" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={certTitle} />
                <meta name="twitter:description" content={certDesc} />
                <meta name="twitter:image" content={certImage} />

                {/* JSON-LD Structured Data */}
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
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto pt-40 pb-20 px-6">
                <div className="glass rounded-[3rem] p-8 md:p-12 border-[var(--glass-border)] shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl transition-transform hover:scale-105 duration-500 overflow-hidden group">
                            {certificate.orgLogoUrl ? (
                                <img src={certificate.orgLogoUrl} alt={certificate.orgName} className="w-full h-full object-contain p-2" />
                            ) : (
                                <ShieldCheck size={48} className="text-emerald-400" />
                            )}
                            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ShieldCheck size={32} className="text-white drop-shadow-lg" />
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-[var(--text-heading)] mb-2 tracking-tighter transition-colors">Verified Credential</h1>
                        <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.4em] mb-10 transition-colors flex items-center gap-3">
                            <span className="w-8 h-px bg-white/10"></span>
                            Authenticity Guaranteed
                            <span className="w-8 h-px bg-white/10"></span>
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mb-12 justify-center">
                        <div className="px-4 py-2 bg-[var(--glass)] border border-[var(--glass-border)] rounded-2xl flex items-center gap-2">
                            <Eye size={14} className="text-slate-400" />
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{certificate.scanCount || 0} Total Scans</span>
                        </div>
                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active Status</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoCard
                            icon={ShieldCheck}
                            label="Organization"
                            value={certificate.orgName || 'Professional Institution'}
                            color="emerald"
                        />
                        <InfoCard
                            icon={User}
                            label="Issued By (Signer)"
                            value={certificate.issuerName || 'Authorized Official'}
                            color="violet"
                        />
                        <InfoCard
                            icon={ShieldCheck}
                            label="Designation"
                            value={certificate.issuerDesignation || 'Issuing Authority'}
                            color="blue"
                        />
                        <InfoCard
                            icon={Calendar}
                            label="Issue Date"
                            value={new Date(certificate.issueDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            color="indigo"
                        />
                        <InfoCard
                            icon={User}
                            label="Recipient Name"
                            value={certificate.recipientName}
                            color="violet"
                        />
                        <InfoCard
                            icon={Hash}
                            label="Credential Status"
                            value={certificate.status === 'active' ? 'Verified & Valid' : 'Inactive'}
                            color="emerald"
                        />
                    </div>

                    <div className="mt-8 p-6 bg-[var(--glass)] border border-[var(--glass-border)] rounded-3xl">
                        <div className="flex items-center gap-3 mb-2">
                            <Hash size={14} className="text-violet-500" />
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Digital Fingerprint (Cert ID)</p>
                        </div>
                        <p className="text-xs font-mono text-[var(--text-main)] break-all opacity-70">{certificate.certId}</p>
                    </div>

                    <div className="mt-8 p-6 bg-violet-500/5 border border-violet-500/10 rounded-3xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/20">
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">Verifiable Achievement</p>
                            <p className="text-xs font-bold text-[var(--text-main)] opacity-70 leading-tight">This credential carries Open Badges 3.0 metadata for global interoperability.</p>
                        </div>
                    </div>

                    {/* Conditional Social Sharing */}
                    {certificate.socialSettings?.allow_sharing !== false && (
                        <>
                            <div className="mt-12 flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => {
                                        const issueDate = new Date(certificate.issueDate);
                                        const certName = certificate.certificateTitle || 'Verified Professional Credential';
                                        const params = new URLSearchParams({
                                            startTask: 'CERTIFICATION_NAME',
                                            name: certName,
                                            organizationName: certificate.orgName || 'CertiFlow Trusted Issuer',
                                            issueYear: issueDate.getFullYear(),
                                            issueMonth: issueDate.getMonth() + 1,
                                            certId: certificate.certId,
                                            certUrl: window.location.href
                                        });
                                        window.open(`https://www.linkedin.com/profile/add?${params.toString()}`, '_blank');
                                    }}
                                    className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-[#0077b5] hover:bg-[#005c8d] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#0077b5]/20 transition-all active:scale-95 group"
                                >
                                    <Linkedin size={18} className="group-hover:scale-110 transition-transform" />
                                    Add to Profile
                                </button>
                            </div>

                            {/* Social Share & Caption Section */}
                            <div className="mt-8 pt-8 border-t border-[var(--glass-border)] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                                <h3 className="text-[var(--text-heading)] font-black text-lg mb-4">Share Your Achievement</h3>
                                {/* Caption Copy (Full Width) */}
                                <div className="mb-8 relative group/caption">
                                    <div className="absolute inset-0 bg-violet-500/5 rounded-3xl blur-xl opacity-0 group-hover/caption:opacity-100 transition-opacity" />
                                    <div className="relative p-6 bg-[var(--bg-input)] border border-[var(--border-muted)] rounded-3xl flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Suggested Post Caption</span>
                                            <button
                                                onClick={() => {
                                                    const hashtags = certificate.socialSettings?.default_hashtags || '#Learning #ProfessionalDevelopment #CertiFlow';
                                                    const caption = `I'm excited to announce that I've just completed the ${certificate.certificateTitle || 'certification'}! 🎓\n\nThanks to ${certificate.orgName} for the great experience.\n\nVerify my credential here: ${window.location.href}\n\n${hashtags}`;
                                                    navigator.clipboard.writeText(caption);
                                                    alert('Caption copied to clipboard!');
                                                }}
                                                className="text-violet-500 hover:text-violet-400 text-xs font-bold flex items-center gap-1 transition-colors"
                                            >
                                                <Copy size={12} />
                                                Copy Text
                                            </button>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)] italic leading-relaxed line-clamp-3">
                                            "I'm excited to announce that I've just completed the {certificate.certificateTitle || 'certification'}! 🎓 Thanks to {certificate.orgName}..."
                                        </p>
                                    </div>
                                </div>

                                {/* Social Buttons Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* LinkedIn */}
                                    <button
                                        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=600')}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-[#0077b5]/10 border border-[#0077b5]/20 hover:bg-[#0077b5]/20 rounded-2xl group transition-all"
                                    >
                                        <Linkedin size={20} className="text-[#0077b5]" />
                                        <span className="text-[10px] font-black text-[#0077b5] uppercase tracking-widest">LinkedIn</span>
                                    </button>

                                    {/* X (Twitter) */}
                                    <button
                                        onClick={() => {
                                            const text = `I just earned a verified ${certificate.certificateTitle || 'certificate'} from ${certificate.orgName}! 🎓`;
                                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400');
                                        }}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-black/5 border border-black/10 hover:bg-black/10 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 rounded-2xl group transition-all"
                                    >
                                        <Twitter size={20} className="text-black dark:text-white" />
                                        <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest">X / Tweet</span>
                                    </button>

                                    {/* WhatsApp */}
                                    <button
                                        onClick={() => {
                                            const text = `Check out my verified certificate: ${window.location.href}`;
                                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                        }}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 rounded-2xl group transition-all"
                                    >
                                        <MessageCircle size={20} className="text-[#25D366]" />
                                        <span className="text-[10px] font-black text-[#25D366] uppercase tracking-widest">WhatsApp</span>
                                    </button>

                                    {/* Instagram (Download) */}
                                    <a
                                        href={certImage}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 rounded-2xl group transition-all cursor-pointer"
                                        title="Download image to share on Instagram Story"
                                    >
                                        <Instagram size={20} className="text-pink-500" />
                                        <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Story (DL)</span>
                                    </a>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="mt-12 text-center space-y-6">
                        <div className="flex justify-center flex-col items-center gap-4">
                            <p className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Powered by</p>
                            <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-crosshair opacity-60 hover:opacity-100">
                                <div className="w-5 h-5 bg-violet-600 rounded flex items-center justify-center p-1">
                                    <ShieldCheck className="text-white" size={12} />
                                </div>
                                <span className="text-sm font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent tracking-tighter">Pramanit</span>
                            </div>
                        </div>
                        <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-lg mx-auto transition-colors">
                            This credential was generated using Pramanit secure issuance engine.<br />
                            Tampering with this document will render the digital fingerprint invalid.
                        </p>
                        <a href="/" className="inline-flex items-center gap-2 text-violet-400 font-bold hover:text-violet-300 transition-colors uppercase tracking-[0.2em] text-[10px]">
                            <ArrowRight size={14} className="rotate-180" />
                            Explore Pramanit
                        </a>
                    </div>
                </div>
                <Footer />
            </div>
        </div>
    );
};

export default VerifyCertificate;
