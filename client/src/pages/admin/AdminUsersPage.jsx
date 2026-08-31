import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Zap, CheckCircle, Clock, ChevronLeft, ChevronRight, Building2, FileText, ExternalLink, X, ZoomIn } from 'lucide-react';

const AdminUsersPage = () => {
    const { users, loading, handleTogglePlan, handleVerifyAction } = useOutletContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedUserForModal, setSelectedUserForModal] = useState(null);
    const [docPreviewUrl, setDocPreviewUrl] = useState(null);

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
                                const isVerified = u.verificationStatus === 'approved';

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
                                            <button
                                                onClick={() => setSelectedUserForModal(u)}
                                                className={`px-3.5 py-1.5 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5 inline-flex ${
                                                    isVerified
                                                        ? 'bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30'
                                                        : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-600/25'
                                                }`}
                                            >
                                                <ZoomIn size={14} />
                                                {isVerified ? 'Inspect Profile' : 'Inspect & Verify'}
                                            </button>
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
                                className="bg-[var(--bg-input)] border border-[var(--border-muted)] rounded-lg px-2 py-1 text-xs font-bold text-[var(--text-main)] outline-none"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span>entries per page (Showing {startIndex + 1} to {endIndex} of {totalRecords})</span>
                        </div>

                        <div className="flex items-center gap-1">
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

            {/* ── Inspection Modal ── */}
            {selectedUserForModal && (() => {
                const u = selectedUserForModal;
                const isVerified = u.verificationStatus === 'approved';
                const isOrgName = !!(u.orgName?.trim());
                const isLogo = !!(u.orgLogoUrl?.trim());
                const isSignerName = !!(u.fullName?.trim());
                const isDesignation = !!(u.designation?.trim());
                const isIdDoc = !!(u.officialIdUrl);
                const isComplete = isOrgName && isLogo && isSignerName && isDesignation && isIdDoc;

                return (
                    <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-[#1e1b4b] border border-violet-500/30 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-violet-500/20 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-violet-500/20 rounded-2xl flex items-center justify-center">
                                        <Building2 size={20} className="text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white">{u.orgName || u.institutionName || 'Issuer Profile'}</h3>
                                        <p className="text-[10px] text-slate-400 font-mono">Account ID: {u.id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedUserForModal(null)}
                                    className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1">Institutional Identity</p>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold block">Organization</span>
                                        <span className="text-xs font-bold text-white">{u.orgName || 'Not provided'}</span>
                                    </div>

                                    {/* Logo Image Preview */}
                                    <div className="space-y-1 py-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Organization Logo</span>
                                        {u.orgLogoUrl ? (
                                            <div className="flex items-center gap-3 p-2.5 bg-slate-900/80 rounded-2xl border border-white/10">
                                                <div
                                                    onClick={() => setDocPreviewUrl(u.orgLogoUrl)}
                                                    className="w-12 h-12 rounded-xl bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:6px_6px] flex items-center justify-center p-1 overflow-hidden shadow-inner shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                                    title="Click to inspect high-res logo"
                                                >
                                                    <img src={u.orgLogoUrl} alt="Logo" className="w-full h-full object-contain" onError={(e) => e.target.style.display = 'none'} />
                                                </div>
                                                <div className="min-w-0 flex-grow space-y-0.5">
                                                    <p className="text-[11px] font-bold text-emerald-400">✅ Logo Active</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDocPreviewUrl(u.orgLogoUrl)}
                                                        className="text-[10px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                                                    >
                                                        <ZoomIn size={12} /> Inspect High-Res Logo
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-[11px] font-bold text-rose-400">❌ No Logo Uploaded</span>
                                        )}
                                    </div>

                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold block">Category</span>
                                        <span className="text-xs font-black text-indigo-400">{u.issuerType || u.verificationCategory || 'institution'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold block">Parent Institution</span>
                                        <span className="text-xs font-bold text-white">{u.institutionName || 'Not specified'}</span>
                                    </div>
                                    {u.institutionIdNumber && (
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold block">Reg / Roll ID</span>
                                            <span className="text-xs font-mono font-bold text-amber-400">#{u.institutionIdNumber}</span>
                                        </div>
                                    )}
                                    {u.institutionWebsite && (
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold block">Website</span>
                                            <a href={u.institutionWebsite} target="_blank" rel="noreferrer" className="text-xs font-bold text-violet-400 hover:underline flex items-center gap-1">
                                                {u.institutionWebsite} <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1">Authorized Signer</p>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold block">Full Name</span>
                                        <span className="text-xs font-bold text-white">{u.fullName || 'Not provided'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold block">Designation</span>
                                        <span className="text-xs font-bold text-white">{u.designation || 'Not provided'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold block">Login Email</span>
                                        <span className="text-xs font-mono text-slate-300">{u.email}</span>
                                    </div>
                                    {u.facultyEmail && (
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold block">Faculty Email</span>
                                            <span className="text-xs font-mono text-slate-300">{u.facultyEmail}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ID Document Banner */}
                            {u.officialIdUrl ? (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-rose-400 shrink-0" size={20} />
                                        <div>
                                            <p className="text-xs font-black text-rose-300">Identity Verification File Uploaded</p>
                                            <p className="text-[10px] text-slate-400 font-semibold">Official Letterhead / ID Card / Tax Proof</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => setDocPreviewUrl(u.officialIdUrl)}
                                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
                                        >
                                            <ZoomIn size={14} /> Preview Document
                                        </button>
                                        <a
                                            href={u.officialIdUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-black transition-all flex items-center gap-1"
                                            title="Open in new tab"
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                                    <FileText className="text-slate-500 shrink-0" size={20} />
                                    <p className="text-xs font-bold text-slate-400">No identity proof document uploaded yet.</p>
                                </div>
                            )}

                            {/* Modal Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-violet-500/20">
                                <button
                                    onClick={() => setSelectedUserForModal(null)}
                                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                {!isVerified ? (
                                    <button
                                        onClick={() => {
                                            handleVerifyAction(u.id, 'approve');
                                            setSelectedUserForModal(null);
                                        }}
                                        disabled={!isComplete}
                                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed"
                                    >
                                        Approve Issuer Now
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            handleVerifyAction(u.id, 'reject', 'Admin revoked verification status.');
                                            setSelectedUserForModal(null);
                                        }}
                                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95"
                                    >
                                        Revoke Verification
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Document Preview Overlay Modal */}
            {docPreviewUrl && (
                <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-4xl bg-slate-900 border border-violet-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                                <FileText size={16} className="text-violet-400" /> Document Proof Preview
                            </h4>
                            <button
                                onClick={() => setDocPreviewUrl(null)}
                                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 flex-grow overflow-auto bg-slate-950 flex items-center justify-center min-h-[400px]">
                            {docPreviewUrl.endsWith('.pdf') || docPreviewUrl.includes('pdf') ? (
                                <iframe src={docPreviewUrl} className="w-full h-[600px] rounded-xl border-0" title="ID Document" />
                            ) : (
                                <img src={docPreviewUrl} alt="Uploaded Document Proof" className="max-w-full max-h-[600px] object-contain rounded-xl shadow-lg" />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
