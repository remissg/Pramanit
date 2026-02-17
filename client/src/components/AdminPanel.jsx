import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
    Filter
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

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

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);

            // Calculate basic stats for the demo
            const total = res.data.length;
            const pro = res.data.filter(u => u.planType === 'pro').length;
            setStats({
                totalUsers: total,
                proUsers: pro,
                totalCerts: total * 15, // Mocked for demo
                activeCorrections: 4    // Mocked for demo
            });
        } catch (err) {
            console.error('Failed to fetch admin data', err);
        } finally {
            setLoading(false);
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
            <Header theme={theme} setTheme={setTheme} onGetStarted={() => { }} />

            <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
                {/* Hero / Header */}
                <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
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

                {/* User Table Section */}
                <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="p-8 border-b border-[var(--border-muted)] flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5">
                        <h2 className="text-2xl font-black text-[var(--text-heading)] flex items-center gap-3">
                            User Directory
                            <span className="text-xs px-2 py-1 bg-[var(--bg-input)] rounded-lg text-[var(--text-muted)] font-bold">{users.length} Total</span>
                        </h2>
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
                    </div>

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
                                                {u.isVerified ? (
                                                    <CheckCircle size={16} className="text-emerald-500" />
                                                ) : (
                                                    <Clock size={16} className="text-rose-500" />
                                                )}
                                                <span className={`text-xs font-bold ${u.isVerified ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {u.isVerified ? 'Verified' : 'Pending'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-medium text-[var(--text-muted)]">
                                            {new Date(u.createdAt).toLocaleDateString()}
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
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default AdminPanel;
