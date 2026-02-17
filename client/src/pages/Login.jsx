import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, ShieldCheck, Sparkles, Briefcase, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/CertiFlow logo (1).png';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [orgName, setOrgName] = useState('');
    const [fullName, setFullName] = useState('');
    const [designation, setDesignation] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || { pathname: '/' };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password, orgName, fullName, designation);
            }
            navigate(from.pathname, { state: from.state, replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/20 blur-[150px] rounded-full"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[150px] rounded-full"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div
                        className="inline-flex items-center gap-3 mb-6 cursor-pointer group/logo"
                        onClick={() => navigate('/')}
                    >
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl group-hover/logo:scale-110 transition-transform duration-300">
                            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                        </div>
                        <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tighter group-hover/logo:text-violet-400 transition-colors">Certi<span className="text-violet-500">Flow</span></h1>
                    </div>
                    <p className="text-[var(--text-muted)] font-medium text-lg">
                        {isLogin ? 'Welcome back to your workspace.' : 'Start issuing credentials today.'}
                    </p>
                </div>

                <div className="glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-500">
                    <div className="flex bg-[var(--bg-input)] p-1 rounded-2xl mb-8 relative">
                        <div
                            className={`absolute inset-y-1 w-[calc(50%-4px)] bg-violet-600 rounded-xl transition-all duration-300 shadow-lg ${isLogin ? 'left-1' : 'left-[calc(50%+4px)]'}`}
                        ></div>
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-3 text-sm font-bold relative z-10 transition-colors ${isLogin ? 'text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-3 text-sm font-bold relative z-10 transition-colors ${!isLogin ? 'text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-[var(--bg-input)] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[var(--text-main)] outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-slate-600 font-medium"
                                            placeholder="Your Name"
                                            required={!isLogin}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Designation</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            value={designation}
                                            onChange={(e) => setDesignation(e.target.value)}
                                            className="w-full bg-[var(--bg-input)] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[var(--text-main)] outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-slate-600 font-medium"
                                            placeholder="Job Title"
                                            required={!isLogin}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isLogin && (
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Organization</label>
                                <div className="relative">
                                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        className="w-full bg-[var(--bg-input)] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[var(--text-main)] outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-slate-600 font-medium"
                                        placeholder="Company or School Name"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[var(--bg-input)] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[var(--text-main)] outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-slate-600 font-medium"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[var(--bg-input)] border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-[var(--text-main)] outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-slate-600 font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-violet-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {isLogin && (
                                <div className="flex justify-end mt-1">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/forgot-password')}
                                        className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors tracking-tight"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold animate-in slide-in-from-top-2">
                                <ShieldCheck size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl transition-all transform active:scale-[0.98] shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 group mt-4"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>{isLogin ? 'Access Workspace' : 'Create Account'}</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                        <p className="text-[var(--text-muted)] text-sm font-medium">
                            Just want to explore?
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="text-violet-400 hover:text-violet-300 font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                            <ArrowRight size={14} className="rotate-180" />
                            Back to Home
                        </button>
                    </div>
                </div>

                <p className="text-center mt-8 text-[var(--text-muted)] text-sm font-medium">
                    Trusted by 10,000+ Issuers Worldwide
                </p>
            </div>
        </div>
    );
};

export default Login;
