import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Edit3, CheckCircle, AlertCircle, Sparkles, UserCheck, UserX, Download } from 'lucide-react';
import axios from 'axios';

const CorrectionsPage = () => {
    const { corrections, setCorrections, refetch, loading } = useOutletContext();
    const [actionLoading, setActionLoading] = useState(null);

    const handleExportCSV = () => {
        if (!corrections || corrections.length === 0) return;
        const headers = ['Original Name', 'Requested Name', 'Recipient Email', 'Status'];
        const rows = corrections.map(item => [
            `"${item.original_name}"`,
            `"${item.requested_name}"`,
            `"${item.recipient_email}"`,
            `"${item.status || 'pending'}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Pramanit_Name_Corrections_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleApproveCorrection = async (id) => {
        setActionLoading(id);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/corrections/${id}/approve`);
            refetch();
        } catch (err) {
            console.error('Failed to approve name correction', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectCorrection = async (id) => {
        setActionLoading(id);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/corrections/${id}/reject`);
            refetch();
        } catch (err) {
            console.error('Failed to reject name correction', err);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-card)] rounded-[2.5rem] p-8 border border-[var(--glass-border)] shadow-xl">
                <div>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2 mb-2">
                        <Sparkles size={16} /> Recipient Name Update Requests
                    </span>
                    <h2 className="text-3xl font-black text-[var(--text-heading)] tracking-tight">
                        Name Corrections ({corrections.length})
                    </h2>
                    <p className="text-sm font-bold text-[var(--text-muted)] mt-1">
                        Review recipient spelling fix requests and re-issue updated credentials with 1-click.
                    </p>
                </div>
                <button
                    onClick={handleExportCSV}
                    disabled={corrections.length === 0}
                    className="px-6 py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 active:scale-95 shrink-0"
                >
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Corrections Table */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden shadow-xl">
                {corrections.length === 0 ? (
                    <div className="p-16 text-center space-y-4">
                        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-3xl mx-auto flex items-center justify-center">
                            <Edit3 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-heading)]">No Correction Requests</h3>
                        <p className="text-sm font-bold text-[var(--text-muted)]">When recipients submit name spelling fixes on their certificates, they will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-white/10">
                                    <th className="px-6 py-5">Original Name</th>
                                    <th className="px-6 py-5">Requested New Name</th>
                                    <th className="px-6 py-5">Recipient Email</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {corrections.map((item) => (
                                    <tr key={item._id} className="hover:bg-white/5 transition-colors group border-b border-white/5">
                                        <td className="px-6 py-5 text-sm font-bold text-[var(--text-muted)] line-through">
                                            {item.original_name}
                                        </td>
                                        <td className="px-6 py-5 text-sm font-black text-emerald-400">
                                            {item.requested_name}
                                        </td>
                                        <td className="px-6 py-5 text-xs font-mono font-bold text-[var(--text-main)]">
                                            {item.recipient_email}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                                item.status === 'approved'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : item.status === 'rejected'
                                                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                                {item.status || 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {item.status === 'pending' || !item.status ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApproveCorrection(item._id)}
                                                        disabled={actionLoading === item._id}
                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center gap-1.5"
                                                    >
                                                        <UserCheck size={14} /> Approve & Reissue
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectCorrection(item._id)}
                                                        disabled={actionLoading === item._id}
                                                        className="px-3 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1"
                                                    >
                                                        <UserX size={14} /> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-[var(--text-muted)] italic">
                                                    Processed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CorrectionsPage;
