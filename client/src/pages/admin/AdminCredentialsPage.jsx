import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, ExternalLink, FileCheck, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const AdminCredentialsPage = () => {
    const { token } = useAuth();
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        fetchGlobalCredentials();
    }, [token]);

    const fetchGlobalCredentials = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/admin/all-credentials`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCredentials(res.data || []);
        } catch (err) {
            console.error('Failed to fetch global admin credentials', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter by search
    const filteredCredentials = credentials.filter(c =>
        (c.id && c.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.recipientName && c.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.recipientEmail && c.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.orgName && c.orgName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Reset to page 1 when search changes
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // Pagination calculations
    const totalRecords = filteredCredentials.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);
    const currentRecords = filteredCredentials.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">
                        Global Credential Audit & Registry
                    </h2>
                    <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5 max-w-2xl leading-relaxed">
                        Read-only inspection of verifiable credentials issued across all institutions. Revocation authority remains strictly with the original issuing authority.
                    </p>
                </div>

                {/* Search Input */}
                <div className="relative group w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-rose-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search by ID, recipient, email or institution..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-[var(--text-main)] outline-none focus:border-rose-500"
                    />
                </div>
            </div>

            {/* Credential Registry Table Card */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    {filteredCredentials.length === 0 ? (
                        <div className="p-16 text-center space-y-3">
                            <FileCheck size={48} className="text-emerald-400 mx-auto" />
                            <h3 className="text-lg font-black text-[var(--text-heading)]">No Issued Credentials Found</h3>
                            <p className="text-xs text-[var(--text-muted)] font-medium">Issued certificates will appear here in real-time as issuers generate credentials.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest border-b border-[var(--border-muted)]">
                                    <th className="px-6 py-4">Credential ID</th>
                                    <th className="px-6 py-4">Recipient Name & Email</th>
                                    <th className="px-6 py-4">Issuing Authority</th>
                                    <th className="px-6 py-4">Issue Date</th>
                                    <th className="px-6 py-4">Cryptographic Status</th>
                                    <th className="px-6 py-4 text-right">Public Inspection</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-muted)]">
                                {currentRecords.map((c) => (
                                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-mono font-bold text-xs text-rose-400">#{c.id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-[var(--text-heading)]">{c.recipientName}</p>
                                            <p className="text-[11px] text-[var(--text-muted)] font-medium">{c.recipientEmail}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-main)]">
                                                <Building2 size={14} className="text-violet-400 shrink-0" />
                                                <span>{c.orgName || 'Verified Institution'}</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">Signer: {c.issuerName}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-[var(--text-muted)]">
                                            {new Date(c.issueDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                                                <CheckCircle size={14} /> Cryptographically Valid
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={`/verify/${c.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-[var(--text-main)] border border-[var(--border-muted)] rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 shadow-sm"
                                            >
                                                <ExternalLink size={12} /> Inspect Badge
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls Footer */}
                {filteredCredentials.length > 0 && (
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
                                <option value={100}>100</option>
                            </select>
                            <span>entries per page (Showing {startIndex + 1} to {endIndex} of {totalRecords})</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="p-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] text-[var(--text-main)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                                title="Previous Page"
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
                                title="Next Page"
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

export default AdminCredentialsPage;
