import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, ShieldCheck, Sparkles, Briefcase, Eye, EyeOff, CheckCircle2, Upload, FileText } from 'lucide-react';
import logo from '../assets/Pramanit logo.png';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [fullName, setFullName] = useState('');
    const [designation, setDesignation] = useState('');
    const [issuerType, setIssuerType] = useState('institution'); // 'institution' | 'student_council'
    const [institutionIdNumber, setInstitutionIdNumber] = useState('');
    const [officialIdFile, setOfficialIdFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || { pathname: '/' };

    useEffect(() => {
        if (!officialIdFile) {
            setFilePreview(null);
            return;
        }
        if (officialIdFile.type.startsWith('image/')) {
            const url = URL.createObjectURL(officialIdFile);
            setFilePreview({ type: 'image', url, name: officialIdFile.name });
            return () => URL.revokeObjectURL(url);
        } else {
            setFilePreview({ type: 'file', name: officialIdFile.name });
        }
    }, [officialIdFile]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password, orgName, fullName, designation, issuerType, institutionIdNumber, officialIdFile);
            }
            navigate(from.pathname, { state: from.state, replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4 md:p-8 relative overflow-hidden transition-colors duration-500">
            {/* Ambient Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-violet-600/15 blur-[160px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-600/15 blur-[160px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-5xl my-auto">
                <div className="glass rounded-[2.5rem] border border-[var(--glass-border)] shadow-2xl overflow-hidden backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 animate-in zoom-in-95 duration-500">
                    
                    {/* LEFT PANEL - Brand & Security Showcase */}
                    <div className="lg:col-span-5 bg-gradient-to-br from-violet-600/10 via-indigo-600/10 to-slate-900/40 p-8 md:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[var(--glass-border)] relative overflow-hidden">
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
                        
                        <div className="relative z-10 space-y-8">
                            {/* Brand Header */}
                            <div 
                                className="inline-flex items-center gap-3.5 cursor-pointer group/logo"
                                onClick={() => navigate('/')}
                            >
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl group-hover/logo:scale-105 transition-transform duration-300">
                                    <img src={logo} alt="Pramanit Logo" className="w-7 h-7 object-contain" />
                                </div>
                                <span className="text-3xl font-black tracking-tighter text-[var(--text-heading)] group-hover/logo:text-violet-400 transition-colors">
                                    Pramanit
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-300 rounded-full text-xs font-black uppercase tracking-wider">
                                    <Sparkles size={12} /> Verifiable Credential Operations
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-[var(--text-heading)] leading-tight tracking-tight">
                                    Issue, Verify & Track Official Certificates
                                </h2>
                                <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] leading-relaxed">
                                    Join authorized educational institutions and student councils building tamper-proof digital credentials on blockchain security.
                                </p>
                            </div>

                            {/* Trust Highlights */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs font-semibold text-[var(--text-main)]">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    <span>Cryptographically Signed PDF & Verification QR Codes</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs font-semibold text-[var(--text-main)]">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    <span>Instant Bulk Email Delivery & Recipient Portal</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs font-semibold text-[var(--text-main)]">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    <span>Audit-Ready Correction & Inquiries Workflow</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Badge */}
                        <div className="pt-8 relative z-10">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)]">
                                <ShieldCheck size={16} className="text-violet-400" />
                                <span>Enterprise Grade Security • DID Protocol Ready</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL - Interactive Auth Studio */}
                    <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-[var(--bg-card)]">
                        
                        {/* Segmented Tab Switcher */}
                        <div className="flex bg-[var(--bg-input)] p-1.5 rounded-2xl mb-8 border border-[var(--border-muted)] relative shadow-inner">
                            <div
                                className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-violet-600 rounded-xl transition-all duration-300 shadow-md ${isLogin ? 'left-1.5' : 'left-[calc(50%+3px)]'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setIsLogin(true)}
                                className={`flex-1 py-3 text-xs md:text-sm font-black relative z-10 transition-colors uppercase tracking-wider ${isLogin ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'}`}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsLogin(false)}
                                className={`flex-1 py-3 text-xs md:text-sm font-black relative z-10 transition-colors uppercase tracking-wider ${!isLogin ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'}`}
                            >
                                Create Account
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5 group">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={16} />
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold text-[var(--text-main)] outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-[var(--text-muted)] opacity-80"
                                                    placeholder="e.g. Alex Morgan"
                                                    required={!isLogin}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 group">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Designation</label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={16} />
                                                <input
                                                    type="text"
                                                    value={designation}
                                                    onChange={(e) => setDesignation(e.target.value)}
                                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold text-[var(--text-main)] outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-[var(--text-muted)] opacity-80"
                                                    placeholder="e.g. Dean / President"
                                                    required={!isLogin}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Account Category</label>
                                        <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-interactive)]">
                                            <button
                                                type="button"
                                                onClick={() => setIssuerType('institution')}
                                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${issuerType === 'institution' ? 'bg-violet-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'}`}
                                            >
                                                🏛️ Institution
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIssuerType('student_council')}
                                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${issuerType === 'student_council' ? 'bg-violet-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'}`}
                                            >
                                                🎓 Student Council
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 group">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                            {issuerType === 'student_council' ? 'Club / Council Name' : 'Organization / University'}
                                        </label>
                                        <div className="relative">
                                            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={16} />
                                            <input
                                                type="text"
                                                value={orgName}
                                                onChange={(e) => setOrgName(e.target.value)}
                                                className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold text-[var(--text-main)] outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-[var(--text-muted)] opacity-80"
                                                placeholder={issuerType === 'student_council' ? 'e.g. Student Council Body' : 'e.g. Oxford University'}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 group">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                            {issuerType === 'student_council' ? 'Student Roll / Registration No.' : 'Govt / Tax / Accreditation Reg No.'}
                                        </label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={16} />
                                            <input
                                                type="text"
                                                value={institutionIdNumber}
                                                onChange={(e) => setInstitutionIdNumber(e.target.value)}
                                                className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold text-[var(--text-main)] outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-[var(--text-muted)] opacity-80"
                                                placeholder={issuerType === 'student_council' ? 'e.g. Roll #21BCE045' : 'e.g. Reg ID #US-98765'}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 group">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                            {issuerType === 'student_council' ? 'Official Student ID / Authorization Letter' : 'Accreditation Document / ID'}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="signup-official-file"
                                                accept="image/*,application/pdf"
                                                onChange={(e) => setOfficialIdFile(e.target.files[0] || null)}
                                                required
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="signup-official-file"
                                                className="flex items-center justify-between w-full bg-[var(--bg-input)] border border-dashed border-violet-400/40 hover:border-violet-500 rounded-2xl py-3 px-4 text-xs font-bold text-[var(--text-muted)] cursor-pointer transition-all"
                                            >
                                                <span className="flex items-center gap-2 truncate">
                                                    <Upload size={16} className="text-violet-500 shrink-0" />
                                                    <span className="truncate">{officialIdFile ? officialIdFile.name : 'Choose ID Document (Image or PDF)'}</span>
                                                </span>
                                                <span className="px-2.5 py-1 bg-violet-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 ml-2">
                                                    Browse
                                                </span>
                                            </label>
                                        </div>

                                        {filePreview && (
                                            <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 flex items-center justify-between text-xs font-bold text-[var(--text-main)]">
                                                <div className="flex items-center gap-2 truncate">
                                                    {filePreview.type === 'image' ? (
                                                        <img src={filePreview.url} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
                                                    ) : (
                                                        <FileText size={18} className="text-violet-500" />
                                                    )}
                                                    <span className="truncate text-[11px]">{filePreview.name}</span>
                                                </div>
                                                <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest shrink-0">Attached</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="space-y-1.5 group">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={16} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold text-[var(--text-main)] outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-[var(--text-muted)] opacity-80"
                                        placeholder="issuer@organization.edu"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={16} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl py-3.5 pl-11 pr-11 text-xs font-bold text-[var(--text-main)] outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-[var(--text-muted)] opacity-80"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-violet-500 transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {isLogin && (
                                    <div className="flex justify-end mt-1">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/forgot-password')}
                                            className="text-[11px] font-bold text-violet-500 hover:text-violet-400 transition-colors tracking-tight"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2.5 text-red-400 text-xs font-bold animate-in slide-in-from-top-2">
                                    <ShieldCheck size={16} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all transform active:scale-[0.98] shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 group mt-6"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>{isLogin ? 'Access Workspace' : 'Create Account'}</span>
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-[var(--border-muted)] flex flex-col items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="text-[var(--text-muted)] hover:text-[var(--text-main)] font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
                            >
                                <ArrowRight size={14} className="rotate-180" />
                                Back to Home
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;
