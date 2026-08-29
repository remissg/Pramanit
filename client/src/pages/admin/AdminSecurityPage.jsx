import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader, Search, ChevronLeft, ChevronRight, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const AdminSecurityPage = () => {
    const { token } = useAuth();
    const [securityLogs, setSecurityLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        fetchSecurityLogs();
    }, [token]);

    const fetchSecurityLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/security-logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSecurityLogs(res.data || []);
        } catch (err) {
            console.error('Failed to fetch admin security logs', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // Filter security logs
    const filteredLogs = securityLogs.filter(log => {
        const query = searchTerm.toLowerCase();
        return (log.id && log.id.toLowerCase().includes(query)) ||
            (log.type && log.type.toLowerCase().includes(query)) ||
            (log.location && log.location.toLowerCase().includes(query)) ||
            (log.ip && log.ip.toLowerCase().includes(query));
    });

    // Pagination calculations
    const totalRecords = filteredLogs.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);
    const currentRecords = filteredLogs.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader className="text-rose-500 animate-spin" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Title & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">System Security & Health Audit Logs</h2>
                    <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                        Monitor real-time authentication events, identity verification status changes, and platform rate-limiting compliance.
                    </p>
                </div>

                {/* Search Input */}
                <div className="relative group w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-rose-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search IP, event or issuer name..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-[var(--text-main)] outline-none focus:border-rose-500"
                    />
                </div>
            </div>

            {/* Table Container Card */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    {filteredLogs.length === 0 ? (
                        <div className="p-16 text-center space-y-3">
                            <ShieldCheck size={48} className="text-emerald-400 mx-auto" />
                            <h3 className="text-lg font-black text-[var(--text-heading)]">No Security Logs Match Query</h3>
                            <p className="text-xs text-[var(--text-muted)] font-medium">Try clearing your search query to view all security audit events.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest border-b border-[var(--border-muted)]">
                                    <th className="px-6 py-4">Audit ID & Event Type</th>
                                    <th className="px-6 py-4">Issuer / Origin Info</th>
                                    <th className="px-6 py-4">IP Address</th>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4 text-right">Defense Outcome</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-muted)]">
                                {currentRecords.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-mono font-bold text-xs text-rose-400">#{log.id}</p>
                                            <p className="text-xs font-black text-[var(--text-heading)] mt-0.5">{log.type}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-[var(--text-main)]">{log.location}</p>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                                            {log.ip}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-[var(--text-muted)]">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${log.status === 'approved' || log.status === 'authorized' || log.status === 'protected' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {log.status === 'approved' ? '✅ Approved' : log.status === 'authorized' ? '✅ Authorized' : log.status === 'protected' ? '🛡️ Sentinel Active' : '⚠️ Action Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls Footer */}
                {filteredLogs.length > 0 && (
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

export default AdminSecurityPage;
