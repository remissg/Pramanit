import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Users, ShieldCheck, Zap, TrendingUp, Search, CheckCircle, Clock, Loader,
    ShieldAlert, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminPage = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingVerifications, setPendingVerifications] = useState([]);
    const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'pending'
    const [stats, setStats] = useState({
        totalUsers: 0,
        proUsers: 0,
        totalCerts: 0,
        activeCorrections: 0
    });

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/dashboard', { replace: true });
            return;
        }
        fetchData();
        fetchPendingVerifications();
    }, [user, navigate]);

    const fetchPendingVerifications = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/pending-verifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingVerifications(res.data || []);
        } catch (err) {
            console.error('Failed to fetch pending verifications', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resUsers, resStats] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
            ]);

            const data = resUsers.data || [];
            setUsers(data);

            const total = data.length;
            const pro = data.filter(u => u.planType === 'pro').length;
            const realStats = resStats?.data;

            setStats({
                totalUsers: realStats?.totalUsers ?? total,
                proUsers: realStats?.proUsers ?? pro,
                totalCerts: realStats?.totalCerts ?? (total * 15),
                activeCorrections: realStats?.pendingReviews ?? 0
            });
        } catch (err) {
            console.error('Failed to fetch admin data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAction = async (targetUserId, action, reason = '') => {
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/verify-user`, {
                targetUserId,
                action,
                rejectionReason: reason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`User verification ${action}d successfully.`);
            fetchData();
            fetchPendingVerifications();
        } catch (err) {
            console.error('Failed to verify user', err);
            alert('Action failed.');
        }
    };

    const handleTogglePlan = async (userId, currentPlan) => {
        const newPlan = currentPlan === 'free' ? 'pro' : 'free';
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/users/${userId}/toggle-plan`, {
                planType: newPlan
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUsers(users.map(u => u.id === userId ? { ...u, planType: newPlan } : u));
        } catch (err) {
            console.error('Failed to toggle plan', err);
            alert('Failed to update plan. Please try again.');
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.orgName && u.orgName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader className="text-violet-500 animate-spin" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Banner */}
            <div
                className="relative rounded-[2.5rem] p-8 md:p-10 border overflow-hidden shadow-xl"
                style={{ background: 'var(--banner-bg)', borderColor: 'var(--banner-border)' }}
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10 space-y-3">
                    <div
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border"
                        style={{
                            background: 'rgba(244, 63, 94, 0.15)',
                            borderColor: 'rgba(244, 63, 94, 0.3)',
                            color: '#fb7185'
                        }}
                    >
                        <ShieldCheck size={14} /> Administration & Platform Oversight
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-[var(--text-heading)] tracking-tight">
                        Admin Command Center
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-[var(--text-muted)] max-w-xl leading-relaxed">
                        Monitor platform growth, verify institution credentials, manage subscriptions, and inspect system audit metrics.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Issuers', value: stats.totalUsers, icon: Users, color: 'text-violet-500' },
                    { label: 'Pro Subscriptions', value: stats.proUsers, icon: Zap, color: 'text-amber-500' },
                    { label: 'Certs Generated', value: stats.totalCerts, icon: TrendingUp, color: 'text-emerald-500' },
                    { label: 'Pending Reviews', value: pendingVerifications.length, icon: ShieldAlert, color: 'text-rose-500' }
                ].map((stat, i) => (
                    <div key={i} className="bg-[var(--bg-card)] p-6 rounded-[2rem] border border-[var(--border-muted)] shadow-xl relative overflow-hidden flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-[var(--text-heading)]">{stat.value}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-[var(--border-muted)]">
                            <stat.icon className={stat.color} size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Directory & Pending Approvals Table Card */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden shadow-xl">
                <div className="p-6 md:p-8 border-b border-[var(--border-muted)] flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('directory')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'directory' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                        >
                            User Directory ({users.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative ${activeTab === 'pending' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' : 'bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                        >
                            Pending Approvals ({pendingVerifications.length})
                            {pendingVerifications.length > 0 && (
                                <span className="ml-2 w-2 h-2 rounded-full bg-amber-400 inline-block animate-ping" />
                            )}
                        </button>
                    </div>

                    {activeTab === 'directory' && (
                        <div className="relative group w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search by email or organization..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-[var(--text-main)] outline-none focus:border-violet-500"
                            />
                        </div>
                    )}
                </div>

                {activeTab === 'directory' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest border-b border-[var(--border-muted)]">
                                    <th className="px-6 py-4">Account Info</th>
                                    <th className="px-6 py-4">Current Plan</th>
                                    <th className="px-6 py-4">Verification Status</th>
                                    <th className="px-6 py-4">Joined On</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-muted)]">
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 ${u.planType === 'pro' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-400'} rounded-xl flex items-center justify-center font-black text-sm border border-[var(--border-muted)]`}>
                                                    {u.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xs text-[var(--text-heading)]">{u.email}</p>
                                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">{u.orgName || 'No Org Set'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${u.planType === 'pro' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border-muted)]'}`}>
                                                {u.planType === 'pro' ? <Zap size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                                                {u.planType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs font-bold">
                                                {u.verification_status === 'approved' ? (
                                                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={14} /> Verified</span>
                                                ) : (
                                                    <span className="text-amber-400 flex items-center gap-1"><Clock size={14} /> Pending</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-[var(--text-muted)]">
                                            {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleTogglePlan(u.id, u.planType)}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 ${u.planType === 'free' ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-sm' : 'bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20'}`}
                                            >
                                                {u.planType === 'free' ? 'Upgrade PRO' : 'Downgrade'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {pendingVerifications.length === 0 ? (
                            <div className="p-12 text-center space-y-2">
                                <ShieldCheck size={40} className="text-emerald-400 mx-auto" />
                                <h3 className="text-lg font-black text-[var(--text-heading)]">No Pending Verification Requests</h3>
                                <p className="text-xs text-[var(--text-muted)] font-medium">All issuer identity verification submissions have been reviewed.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5 text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest border-b border-[var(--border-muted)]">
                                        <th className="px-6 py-4">Entity & Category</th>
                                        <th className="px-6 py-4">Signer Info</th>
                                        <th className="px-6 py-4">Reg ID</th>
                                        <th className="px-6 py-4">Document</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-muted)]">
                                    {pendingVerifications.map((pu) => (
                                        <tr key={pu._id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-xs text-[var(--text-heading)]">{pu.org_name || 'Unnamed Org'}</p>
                                                <span className="text-[9px] font-black uppercase text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                                                    {pu.issuer_type === 'student_council' ? '🎓 Student Council' : '🏛️ Institution'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-[var(--text-main)]">{pu.full_name || 'N/A'}</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">{pu.email}</p>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-xs text-amber-400">
                                                #{pu.institution_id_number || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {pu.official_id_url ? (
                                                    <a
                                                        href={pu.official_id_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-2.5 py-1 bg-violet-500/10 hover:bg-violet-600 text-violet-400 hover:text-white border border-violet-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1"
                                                    >
                                                        <ExternalLink size={10} /> View Document
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] text-[var(--text-muted)] italic">No Document</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleVerifyAction(pu._id, 'approve')}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const reason = prompt('Enter rejection reason for issuer:');
                                                            if (reason) handleVerifyAction(pu._id, 'reject', reason);
                                                        }}
                                                        className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
