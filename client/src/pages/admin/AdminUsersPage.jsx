import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Zap, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminUsersPage = () => {
    const { users, loading, handleTogglePlan, handleVerifyAction } = useOutletContext();
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
                        Manage registered issuer accounts, inspect uploaded identity documents, and enforce 100% profile completion approval.
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
                                <th className="px-6 py-4">Account & Category</th>
                                <th className="px-6 py-4">Profile Completion</th>
                                <th className="px-6 py-4">Identity Document</th>
                                <th className="px-6 py-4">Verification State</th>
                                <th className="px-6 py-4 text-right">Admin Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-muted)]">
                            {currentRecords.map((u) => {
                                const isOrgName = !!(u.orgName && u.orgName.trim());
                                const isLogo = !!(u.orgLogoUrl && u.orgLogoUrl.trim());
                                const isSignerName = !!(u.fullName && u.fullName.trim());
                                const isDesignation = !!(u.designation && u.designation.trim());
                                const isIdDoc = !!(u.officialIdUrl && u.officialIdUrl.trim());

                                const completionCount = [isOrgName, isLogo, isSignerName, isDesignation, isIdDoc].filter(Boolean).length;
                                const completionPercent = completionCount * 20;
                                const isVerified = u.isVerified || u.verificationStatus === 'approved';

                                return (
                                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 ${u.planType === 'pro' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-400'} rounded-xl flex items-center justify-center font-black text-sm border border-[var(--border-muted)] shrink-0`}>
                                                    {u.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-xs text-[var(--text-heading)]">{u.email}</p>
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                                            {u.verificationCategory || u.issuer_type || 'Institution'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">
                                                        {u.orgName || 'No Organization Set'} {u.institutionName ? `(${u.institutionName})` : ''} • Signer: {u.fullName || 'N/A'} ({u.designation || 'N/A'})
                                                    </p>
                                                    {u.institutionIdNumber && (
                                                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                            Reg / Roll ID: <code className="text-violet-400 font-mono">{u.institutionIdNumber}</code> {u.facultyEmail ? `• Email: ${u.facultyEmail}` : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${completionPercent === 100 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                                        {completionPercent}% Complete
                                                    </span>
                                                </div>
                                                <div className="w-24 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-gradient-to-r from-rose-500 via-violet-600 to-emerald-400 h-full" style={{ width: `${completionPercent}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.officialIdUrl ? (
                                                <a
                                                    href={u.officialIdUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 font-bold text-xs rounded-lg border border-violet-500/30 transition-all"
                                                >
                                                    🔍 View Uploaded ID Proof
                                                </a>
                                            ) : (
                                                <span className="text-[11px] font-semibold text-rose-400/80">No ID Document Uploaded</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs font-bold">
                                                {isVerified ? (
                                                    <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20"><CheckCircle size={14} /> Verified Issuer</span>
                                                ) : u.verificationStatus === 'pending' ? (
                                                    <span className="text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20"><Clock size={14} /> Pending Approval</span>
                                                ) : (
                                                    <span className="text-slate-400 flex items-center gap-1 bg-slate-500/10 px-2.5 py-1 rounded-full border border-slate-500/20">Unverified</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {!isVerified ? (
                                                <button
                                                    onClick={() => handleVerifyAction(u.id, 'approve')}
                                                    disabled={completionPercent < 100 || !isIdDoc}
                                                    title={completionPercent < 100 ? 'Cannot approve. Issuer profile must be 100% complete.' : 'Approve Issuer'}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed"
                                                >
                                                    Approve & Verify
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleVerifyAction(u.id, 'reject', 'Admin revoked verification status.')}
                                                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-rose-500/30 transition-all active:scale-95"
                                                >
                                                    Revoke
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
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
