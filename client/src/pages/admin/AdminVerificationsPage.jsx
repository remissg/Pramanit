import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShieldCheck, ExternalLink, FileText } from 'lucide-react';

const AdminVerificationsPage = () => {
    const { pendingVerifications, loading, handleVerifyAction } = useOutletContext();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Title */}
            <div>
                <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">
                    Institutional Identity Approvals
                </h2>
                <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                    Review official ID cards, tax registrations, and faculty permission letterheads submitted by issuers.
                </p>
            </div>

            {/* Content Table Card */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    {pendingVerifications.length === 0 ? (
                        <div className="p-16 text-center space-y-3">
                            <ShieldCheck size={48} className="text-emerald-400 mx-auto animate-pulse" />
                            <h3 className="text-xl font-black text-[var(--text-heading)]">No Pending Verification Requests</h3>
                            <p className="text-xs text-[var(--text-muted)] font-bold">
                                All institution & student council identity documents have been processed by system administrators.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest border-b border-[var(--border-muted)]">
                                    <th className="px-6 py-4">Entity Name & Category</th>
                                    <th className="px-6 py-4">Signer Information</th>
                                    <th className="px-6 py-4">Registration ID / Roll</th>
                                    <th className="px-6 py-4">ID Document</th>
                                    <th className="px-6 py-4 text-right">Approval Controls</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-muted)]">
                                {pendingVerifications.map((pu) => (
                                    <tr key={pu._id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-black text-xs text-[var(--text-heading)]">{pu.org_name || 'Unnamed Organization'}</p>
                                            <span className="text-[9px] font-black uppercase text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 mt-1 inline-block">
                                                {pu.issuer_type === 'student_council' ? '🎓 Student Council' : '🏛️ Institution'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-[var(--text-main)]">{pu.full_name || 'N/A'}</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">{pu.email} ({pu.designation || 'Signer'})</p>
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
                                                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 shadow-sm"
                                                >
                                                    <ExternalLink size={12} /> Preview ID
                                                </a>
                                            ) : (
                                                <span className="text-[10px] text-[var(--text-muted)] italic">No File Uploaded</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleVerifyAction(pu._id, 'approve')}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Enter rejection reason for issuer:');
                                                        if (reason) handleVerifyAction(pu._id, 'reject', reason);
                                                    }}
                                                    className="px-3 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
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
            </div>
        </div>
    );
};

export default AdminVerificationsPage;
