import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/Pramanit logo.png';
import {
    Users,
    ShieldCheck,
    Zap,
    TrendingUp,
    Search,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    Clock,
    UserPlus,
    Loader,
    ShieldAlert,
    ChevronDown,
    ExternalLink,
    Filter,
    LayoutDashboard,
    Sun,
    Moon,
    Monitor
} from 'lucide-react';

const AdminPanel = ({ theme, setTheme }) => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        totalUsers: 0,
        proUsers: 0,
        totalCerts: 0,
        activeCorrections: 0
    });

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const [pendingVerifications, setPendingVerifications] = useState([]);
    const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'pending'
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedUserForReject, setSelectedUserForReject] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
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
            setPendingVerifications(res.data);
        } catch (err) {
            console.error('Failed to fetch pending verifications', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const [resUsers, resStats] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
            ]);

            const usersData = resUsers.data || [];
            setUsers(usersData);

            const total = usersData.length;
            const pro = usersData.filter(u => u.planType === 'pro').length;
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
            setSelectedUserForReject(null);
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
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
                <Loader className="text-violet-500 animate-spin" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-500">
            {/* Dedicated Admin Command Center Top Bar */}
            <header className="glass sticky top-0 z-50 px-6 py-4 border-b border-[var(--glass-border)] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <div className="w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center p-1.5 border border-slate-200">
                        <img src={logo} alt="Pramanit Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <span className="text-xl font-black tracking-tight text-[var(--text-heading)] block leading-none">Pramanit</span>
                        <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Admin Command Center</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            const modes = ['system', 'dark', 'light'];
                            const nextIndex = (modes.indexOf(theme) + 1) % modes.length;
                            setTheme(modes[nextIndex]);
                        }}
                        className="p-2.5 bg-[var(--bg-input)] border border-[var(--border-muted)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors flex items-center gap-2 text-xs font-bold"
                        title={`Theme: ${theme}`}
                    >
                        {theme === 'light' && <Sun size={16} className="text-amber-500" />}
                        {theme === 'dark' && <Moon size={16} className="text-violet-400" />}
                        {theme === 'system' && <Monitor size={16} className="text-blue-400" />}
                        <span className="capitalize text-[11px] font-extrabold hidden sm:inline">{theme}</span>
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-all active:scale-95"
                    >
                        <LayoutDashboard size={14} /> Issuer Dashboard
                    </button>
                </div>
            </header>

            <div className="pt-10 pb-20 max-w-7xl mx-auto px-6">
                {/* Hero / Header */}
                <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-violet-500/10 rounded-xl text-violet-500">
                                <ShieldCheck size={28} />
                            </div>
                            <span className="text-sm font-black text-violet-500 uppercase tracking-[0.2em]">Management Suite</span>
                        </div>
                        <h1 className="text-5xl font-black text-[var(--text-heading)] tracking-tight mb-4">Admin Command Center</h1>
                        <p className="text-xl text-[var(--text-muted)] font-medium max-w-2xl">
                            Monitor platform growth, manage user subscriptions, and analyze certificate ecosystem performance.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 shrink-0 active:scale-95 self-start md:self-center"
                    >
                        <LayoutDashboard size={18} /> Back to Dashboard
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Issuers', value: stats.totalUsers, icon: Users, color: 'violet' },
                        { label: 'Pro Subscriptions', value: stats.proUsers, icon: Zap, color: 'amber' },
                        { label: 'Certs Generated', value: stats.totalCerts, icon: TrendingUp, color: 'emerald' },
                        { label: 'Security Alerts', value: stats.activeCorrections, icon: ShieldAlert, color: 'rose' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-[var(--bg-card)] p-8 rounded-[2rem] border border-[var(--border-muted)] shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all">
                            <div className={`absolute top-0 right-0 p-10 bg-${stat.color}-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-${stat.color}-500/10 transition-colors`} />
                            <stat.icon className={`text-${stat.color}-500 mb-6 relative z-10`} size={32} />
                            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-1 relative z-10">{stat.label}</h3>
                            <p className="text-4xl font-black text-[var(--text-heading)] relative z-10">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* User Directory & Pending Approvals Tabs Section */}
                <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="p-8 border-b border-[var(--border-muted)] flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setActiveTab('directory')}
                                className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'directory' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-white/5 text-[var(--text-muted)] hover:text-white'}`}
                            >
                                User Directory ({users.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'pending' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'bg-white/5 text-[var(--text-muted)] hover:text-white'}`}
                            >
                                Pending Identity Approvals ({pendingVerifications.length})
                                {pendingVerifications.length > 0 && (
                                    <span className="ml-2 w-2 h-2 rounded-full bg-amber-400 inline-block animate-ping" />
                                )}
                            </button>
                        </div>
                        {activeTab === 'directory' && (
                            <div className="relative group w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by email or organization..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-[var(--bg-input)] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-[var(--text-main)] outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium"
                                />
                            </div>
                        )}
                    </div>

                    {activeTab === 'directory' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5 text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                                        <th className="px-8 py-5"># Account Info</th>
                                        <th className="px-8 py-5">Current Plan</th>
                                        <th className="px-8 py-5">Verification Status</th>
                                        <th className="px-8 py-5">Joined on</th>
                                        <th className="px-8 py-5 text-right">Subscription Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-white/5 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 ${u.planType === 'pro' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'} rounded-2xl flex items-center justify-center font-black text-lg border border-white/5`}>
                                                        {u.email[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-[var(--text-heading)] leading-tight">{u.email}</p>
                                                        <p className="text-xs text-[var(--text-muted)] font-bold mt-0.5">{u.orgName || 'No Organization Set'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${u.planType === 'pro'
                                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                    : 'bg-[var(--bg-input)] text-[var(--text-muted)] border border-white/5'
                                                    }`}>
                                                    {u.planType === 'pro' ? <Zap size={10} /> : <div className="w-2 h-2 rounded-full bg-slate-500" />}
                                                    {u.planType} Plan
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    {u.verification_status === 'approved' ? (
                                                        <CheckCircle size={16} className="text-emerald-500" />
                                                    ) : (
                                                        <Clock size={16} className="text-amber-500" />
                                                    )}
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${u.verification_status === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {u.verification_status || 'Unverified'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-medium text-[var(--text-muted)]">
                                                {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    onClick={() => handleTogglePlan(u.id, u.planType)}
                                                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${u.planType === 'free'
                                                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/20'
                                                        : 'bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20'
                                                        }`}
                                                >
                                                    {u.planType === 'free' ? 'Upgrade to PRO' : 'Downgrade Account'}
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
                                <div className="p-16 text-center space-y-3">
                                    <ShieldCheck size={48} className="text-emerald-500 mx-auto" />
                                    <h3 className="text-xl font-black text-[var(--text-heading)]">No Pending Verification Requests</h3>
                                    <p className="text-xs text-[var(--text-muted)] font-bold">All issuer identity verification requests have been processed.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/5 text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                                            <th className="px-8 py-5">Category & Entity Name</th>
                                            <th className="px-8 py-5">Signer Info</th>
                                            <th className="px-8 py-5">Registration / Roll No.</th>
                                            <th className="px-8 py-5">Submitted ID Document</th>
                                            <th className="px-8 py-5 text-right">Admin Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {pendingVerifications.map((pu) => (
                                            <tr key={pu._id} className="hover:bg-white/5 transition-all">
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-[var(--text-heading)]">{pu.org_name || 'Unnamed Org'}</p>
                                                    <span className="text-[10px] font-black uppercase text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">
                                                        {pu.issuer_type === 'student_council' ? '🎓 Student Council' : '🏛️ Institution'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-bold text-[var(--text-main)]">{pu.full_name || 'N/A'}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">{pu.email} ({pu.designation || 'Signer'})</p>
                                                </td>
                                                <td className="px-8 py-6 font-mono font-bold text-xs text-amber-400">
                                                    #{pu.institution_id_number || 'No ID Provided'}
                                                </td>
                                                <td className="px-8 py-6">
                                                    {pu.official_id_url ? (
                                                        <a
                                                            href={pu.official_id_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white border border-violet-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 inline-flex"
                                                        >
                                                            <ExternalLink size={12} /> View Document
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-[var(--text-muted)] italic">No Doc Uploaded</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleVerifyAction(pu._id, 'approve')}
                                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt('Enter rejection reason for issuer:');
                                                                if (reason) handleVerifyAction(pu._id, 'reject', reason);
                                                            }}
                                                            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
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
        </div>
    );
};

export default AdminPanel;
