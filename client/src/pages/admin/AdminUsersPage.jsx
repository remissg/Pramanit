import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Zap, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminUsersPage = () => {
    const { users, loading, handleTogglePlan } = useOutletContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.orgName && u.orgName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const totalRecords = filteredUsers.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);
    const currentRecords = filteredUsers.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Title Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">Issuer User Directory</h2>
                    <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                        Manage registered issuer accounts, view verification states, and adjust subscription plans.
                    </p>
                </div>

                <div className="relative group w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-rose-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search by email or organization..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-[var(--text-main)] outline-none focus:border-rose-500"
                    />
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest border-b border-[var(--border-muted)]">
                                <th className="px-6 py-4">Account Info</th>
                                <th className="px-6 py-4">Current Plan</th>
                                <th className="px-6 py-4">Verification Status</th>
                                <th className="px-6 py-4">Joined On</th>
                                <th className="px-6 py-4 text-right">Subscription Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-muted)]">
                            {currentRecords.map((u) => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 ${u.planType === 'pro' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-400'} rounded-xl flex items-center justify-center font-black text-sm border border-[var(--border-muted)] shrink-0`}>
                                                {u.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-xs text-[var(--text-heading)]">{u.email}</p>
                                                <p className="text-[11px] text-[var(--text-muted)] font-medium">{u.orgName || 'No Organization Set'}</p>
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
                                            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${u.planType === 'free' ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm' : 'bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20'}`}
                                        >
                                            {u.planType === 'free' ? 'Upgrade PRO' : 'Downgrade Account'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls Footer */}
                {filteredUsers.length > 0 && (
                    <div className="p-4 border-t border-[var(--border-muted)] flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 text-xs font-bold text-[var(--text-muted)]">
                        <div className="flex items-center gap-2">
                            <span>Show</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-lg px-2.5 py-1 text-xs font-bold text-[var(--text-main)] outline-none focus:border-rose-500"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span>entries per page (Showing {startIndex + 1} to {endIndex} of {totalRecords})</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="p-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] text-[var(--text-main)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                                .map((page, idx, arr) => {
                                    const prev = arr[idx - 1];
                                    const showEllipsis = prev && page - prev > 1;
                                    return (
                                        <React.Fragment key={page}>
                                            {showEllipsis && <span className="px-1 text-[var(--text-muted)]">...</span>}
                                            <button
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === page ? 'bg-rose-600 text-white shadow-md' : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-white border border-[var(--border-muted)]'}`}
                                            >
                                                {page}
                                            </button>
                                        </React.Fragment>
                                    );
                                })
                            }

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                className="p-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] text-[var(--text-main)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsersPage;
