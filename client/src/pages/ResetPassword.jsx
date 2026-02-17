import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, Loader, CheckCircle, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import logo from '../assets/CertiFlow logo (1).png';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setLoading(true);
        setError('');
        try {
            await axios.post('http://localhost:5000/api/auth/reset-password', {
                token,
                password
            });
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Token may be invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6 transition-colors duration-500">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-8">
                    <div
                        className="inline-flex items-center gap-3 mb-6 cursor-pointer group"
                        onClick={() => navigate('/')}
                    >
                        <div className="w-12 h-12 bg-white shadow-xl rounded-2xl flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                            <img src={logo} alt="CertiFlow Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-3xl font-black tracking-tighter text-[var(--text-main)] transition-colors">
                            Certi<span className="text-violet-500">Flow</span>
                        </span>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-muted)] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 p-12 bg-emerald-500/5 rounded-full -ml-12 -mt-12" />

                    {!submitted ? (
                        <>
                            <div className="relative z-10 mb-8">
                                <h1 className="text-3xl font-black text-[var(--text-heading)] mb-2">New Password</h1>
                                <p className="text-[var(--text-muted)] font-medium">
                                    Set a strong password to secure your CertiFlow workspace.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={20} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-[var(--bg-input)] border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-[var(--text-main)] outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-violet-500 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Confirm Password</label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={20} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-[var(--bg-input)] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[var(--text-main)] outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-2">
                                        <AlertCircle size={18} />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                                >
                                    {loading ? (
                                        <Loader className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            Change Password
                                            <CheckCircle size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center relative z-10 py-8 animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                <CheckCircle size={40} />
                            </div>
                            <h2 className="text-3xl font-black text-[var(--text-heading)] mb-4">Password Reset!</h2>
                            <p className="text-[var(--text-muted)] font-medium mb-8 leading-relaxed">
                                Your security is our priority. Your password has been updated successfully.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 bg-violet-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-violet-500/20 hover:bg-violet-500 transition-all"
                            >
                                Log in Now
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
