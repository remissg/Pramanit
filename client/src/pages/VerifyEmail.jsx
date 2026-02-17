import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Loader, XCircle, CheckCircle, ArrowRight } from 'lucide-react';
import logo from '../assets/Pramanit logo.png';
import { useAuth } from '../context/AuthContext';

const VerifyEmail = () => {
    const { updateSession } = useAuth();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const token = searchParams.get('token');

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }

            try {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/verify-email?token=${token}`);
                setStatus('success');
                setMessage(res.data.message);

                // Auto-login: update context with returned token/user
                if (res.data.token && res.data.user) {
                    updateSession(res.data.user, res.data.token);
                }

                // Redirect after 2 seconds
                setTimeout(() => navigate('/dashboard'), 2000);
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
            }
        };

        verify();
    }, [token, navigate, updateSession]);

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/20 blur-[150px] rounded-full"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[150px] rounded-full"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                        </div>
                        <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tighter">Pramanit</h1>
                    </div>
                </div>

                <div className="glass p-10 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-xl text-center">
                    {status === 'verifying' && (
                        <div className="space-y-6">
                            <div className="w-20 h-20 bg-violet-600/10 rounded-full flex items-center justify-center mx-auto">
                                <Loader className="text-violet-500 animate-spin" size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-[var(--text-main)]">Verifying Email</h2>
                            <p className="text-[var(--text-muted)] font-medium">Please wait while we validate your account...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="text-green-500" size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-[var(--text-main)]">Account Verified!</h2>
                            <p className="text-[var(--text-muted)] font-medium">{message}</p>
                            <p className="text-xs text-violet-400 font-bold">Redirecting you to dashboard...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                                <XCircle className="text-red-500" size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-[var(--text-main)]">Verification Failed</h2>
                            <p className="text-[var(--text-muted)] font-medium">{message}</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                Back to Login <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
