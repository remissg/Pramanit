import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShieldCheck, ExternalLink, FileText, Building2, Eye, X, ZoomIn } from 'lucide-react';

/* ── Reusable info row for modal ── */
const InfoRow = ({ label, value, accent, mono, prefix = '', link = false, emptyLabel = 'N/A' }) => {
    const isEmpty = !value || String(value).trim() === '';
    const display = isEmpty ? emptyLabel : `${prefix}${value}`;

    const valueClass = isEmpty
        ? 'text-slate-500 italic'
        : accent === 'amber'
            ? 'text-amber-400 font-mono font-bold'
            : accent === 'indigo'
                ? 'text-indigo-300 font-bold'
                : mono
                    ? 'text-slate-200 font-mono'
                    : 'text-slate-200 font-semibold';

    return (
        <div className="flex gap-1 flex-wrap items-baseline">
            <span className="text-slate-400 font-semibold shrink-0">{label}:</span>
            {link && !isEmpty ? (
                <a href={value} target="_blank" rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 font-mono underline underline-offset-2 break-all transition-colors">
                    {display}
                </a>
            ) : (
                <span className={`break-all ${valueClass}`}>{display}</span>
            )}
        </div>
    );
};

const AdminVerificationsPage = () => {
    const { pendingVerifications, loading, handleVerifyAction } = useOutletContext();
    const [selectedIssuer, setSelectedIssuer] = useState(null);
    const [docPreviewUrl, setDocPreviewUrl] = useState(null); // inline doc preview

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* ── Header ── */}
            <div>
                <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">
                    Institutional Verification &amp; Audit Portal
                </h2>
                <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                    Inspect official identity proof documents, institutional registration IDs, faculty details, and authorization letters submitted by issuers.
                </p>
            </div>

            {/* ── Table Card ── */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    {pendingVerifications.length === 0 ? (
                        <div className="p-16 text-center space-y-3">
                            <ShieldCheck size={48} className="text-emerald-400 mx-auto animate-pulse" />
                            <h3 className="text-xl font-black text-[var(--text-heading)]">No Pending Verification Requests</h3>
                            <p className="text-xs text-[var(--text-muted)] font-bold">
                                All institutional &amp; student council identity submissions have been audited.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest border-b border-[var(--border-muted)]">
                                    <th className="px-6 py-4">Institution &amp; Category</th>
                                    <th className="px-6 py-4">Signer &amp; Contact</th>
                                    <th className="px-6 py-4">Registration ID / Roll</th>
                                    <th className="px-6 py-4">ID Proof Document</th>
                                    <th className="px-6 py-4 text-center">Full Audit</th>
                                    <th className="px-6 py-4 text-right">Approval Controls</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-muted)]">
                                {pendingVerifications.map((pu) => (
                                    <tr key={pu._id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-black text-xs text-[var(--text-heading)]">{pu.org_name || 'Unnamed Organization'}</p>
                                            <p className="text-[10px] text-[var(--text-muted)] font-semibold mt-0.5">{pu.institution_name || 'N/A'}</p>
                                            <span className="text-[9px] font-black uppercase text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20 mt-1.5 inline-block">
                                                {pu.verification_category || (pu.issuer_type === 'student_council' ? '🎓 Student Council' : '🏛️ Official Institution')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-[var(--text-main)]">{pu.full_name || 'N/A'}</p>
                                            <p className="text-[10px] font-mono text-[var(--text-muted)]">{pu.email}</p>
                                            <p className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">{pu.designation || 'Signer'}</p>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-xs text-amber-400">
                                            #{pu.institution_id_number || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {pu.official_id_url ? (
                                                <button onClick={() => setDocPreviewUrl(pu.official_id_url)}
                                                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer">
                                                    <ZoomIn size={12} /> Preview ID File
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-[var(--text-muted)] italic">No File Uploaded</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => setSelectedIssuer(pu)}
                                                className="px-3 py-1.5 bg-violet-500/10 hover:bg-violet-600 text-violet-400 hover:text-white border border-violet-500/20 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all inline-flex items-center gap-1.5">
                                                <Eye size={12} /> View Full Audit
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleVerifyAction(pu._id, 'approve')}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95">
                                                    Approve
                                                </button>
                                                <button onClick={() => {
                                                    const reason = prompt('Enter rejection reason for issuer:');
                                                    if (reason) handleVerifyAction(pu._id, 'reject', reason);
                                                }}
                                                    className="px-3 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all">
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

            {/* ── Audit Details Modal ── */}
            {selectedIssuer && (() => {
                // Compute real completeness from actual DB fields (same 5 as server validates)
                const mc = {
                    hasOrgName: !!(selectedIssuer.org_name?.trim()),
                    hasLogo: !!(selectedIssuer.org_logo_url?.trim()),
                    hasSignerName: !!(selectedIssuer.full_name?.trim()),
                    hasDesignation: !!(selectedIssuer.designation?.trim()),
                    hasIdDoc: !!(selectedIssuer.official_id_url?.trim()),
                };
                const missingFields = [
                    !mc.hasOrgName && 'Organization Name',
                    !mc.hasLogo && 'Organization Logo',
                    !mc.hasSignerName && 'Authorized Signer Name',
                    !mc.hasDesignation && 'Signer Designation',
                    !mc.hasIdDoc && 'Official ID Document',
                ].filter(Boolean);
                const isComplete = missingFields.length === 0;

                return (
                    <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                        <div
                            style={{ background: '#1e1b4b', border: '1px solid rgba(139,92,246,0.25)' }}
                            className="w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-violet-500/20 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-violet-500/20 rounded-2xl flex items-center justify-center">
                                        <Building2 size={20} className="text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white">{selectedIssuer.org_name || 'Issuer Details'}</h3>
                                        <p className="text-[10px] text-slate-400 font-semibold">Account ID: {selectedIssuer._id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedIssuer(null)}
                                    className="text-slate-400 hover:text-white font-black text-sm px-3 py-1 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                    ✕ Close
                                </button>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1">Institutional Identity</p>
                                    <InfoRow label="Organization" value={selectedIssuer.org_name} />
                                    
                                    {/* Logo Image Preview */}
                                    <div className="space-y-1 py-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Organization Logo</span>
                                        {selectedIssuer.org_logo_url ? (
                                            <div className="flex items-center gap-3 p-2.5 bg-slate-900/80 rounded-2xl border border-white/10">
                                                <div
                                                    onClick={() => setDocPreviewUrl(selectedIssuer.org_logo_url)}
                                                    className="w-12 h-12 rounded-xl bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:6px_6px] flex items-center justify-center p-1 overflow-hidden shadow-inner shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                                    title="Click to view full high-res logo"
                                                >
                                                    <img src={selectedIssuer.org_logo_url} alt="Logo" className="w-full h-full object-contain" onError={(e) => e.target.style.display = 'none'} />
                                                </div>
                                                <div className="min-w-0 flex-grow space-y-0.5">
                                                    <p className="text-[11px] font-bold text-emerald-400">✅ Logo Active</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDocPreviewUrl(selectedIssuer.org_logo_url)}
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

                                    <InfoRow label="Category" value={selectedIssuer.verification_category || selectedIssuer.issuer_type} accent="indigo" />
                                    <InfoRow label="Parent Institution" value={selectedIssuer.institution_name} />
                                    <InfoRow label="Reg / Roll ID" value={selectedIssuer.institution_id_number} accent="amber" prefix="#" />
                                    <InfoRow label="Website" value={selectedIssuer.institution_website} link />
                                </div>

                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1">Authorized Signer</p>
                                    <InfoRow label="Full Name" value={selectedIssuer.full_name} />
                                    <InfoRow label="Designation" value={selectedIssuer.designation} />
                                    <InfoRow label="Login Email" value={selectedIssuer.email} mono />
                                    <InfoRow label="Faculty Email" value={selectedIssuer.faculty_email} mono emptyLabel="Not provided" />
                                </div>
                            </div>

                            {/* Profile completeness warning */}
                            {!isComplete && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl">
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1.5">⚠️ Profile Incomplete — Cannot Approve</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                                        {missingFields.map(f => (
                                            <span key={f} className="text-[10px] text-amber-300 font-semibold">• {f}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Status Bar */}
                            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedIssuer.verification_status === 'pending' ? 'bg-amber-400 animate-pulse' : selectedIssuer.verification_status === 'approved' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                <span className="text-xs font-bold text-slate-300">
                                    Status: <span className="text-white font-black uppercase">{selectedIssuer.verification_status || 'unverified'}</span>
                                </span>
                                <span className={`ml-auto text-[10px] font-black ${isComplete ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {isComplete ? '✅ 100% Complete' : `⚠️ ${missingFields.length} field(s) missing`}
                                </span>
                            </div>

                            {/* ID Document Banner */}
                            {selectedIssuer.official_id_url ? (
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
                                            onClick={() => setDocPreviewUrl(selectedIssuer.official_id_url)}
                                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg">
                                            <ZoomIn size={14} /> Preview Document
                                        </button>
                                        <a href={selectedIssuer.official_id_url} target="_blank" rel="noopener noreferrer"
                                            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-black transition-all flex items-center gap-1"
                                            title="Open in new tab">
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

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-violet-500/20">
                                <button
                                    onClick={() => { handleVerifyAction(selectedIssuer._id, 'approve'); setSelectedIssuer(null); }}
                                    disabled={!isComplete}
                                    title={!isComplete ? `Cannot approve: missing ${missingFields.join(', ')}` : 'Approve this issuer'}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all ${
                                        isComplete
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 cursor-pointer'
                                            : 'bg-slate-600/30 text-slate-500 cursor-not-allowed border border-slate-600/20'
                                    }`}>
                                    {isComplete ? 'Approve Issuer Now' : `Profile Incomplete`}
                                </button>
                                <button
                                    onClick={() => {
                                        const reason = prompt('Enter rejection reason:');
                                        if (reason) { handleVerifyAction(selectedIssuer._id, 'reject', reason); setSelectedIssuer(null); }
                                    }}
                                    className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95">
                                    Reject Submission
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Fullscreen / Layered Document Preview Modal ── */}
            {docPreviewUrl && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    <div
                        style={{ background: '#0f172a', border: '1px solid rgba(139,92,246,0.3)' }}
                        className="w-full max-w-4xl h-[85vh] rounded-3xl p-5 shadow-2xl flex flex-col gap-4 relative animate-in zoom-in-95 duration-200"
                    >
                        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                            <div className="flex items-center gap-2 text-white font-black text-sm">
                                <FileText size={18} className="text-violet-400" />
                                <span>Verification Document Preview</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={docPreviewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                >
                                    <ExternalLink size={14} /> Open Original
                                </a>
                                <button
                                    onClick={() => setDocPreviewUrl(null)}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 w-full h-full bg-black/40 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center relative">
                            {docPreviewUrl.match(/\.(jpeg|jpg|png|webp|gif|svg)$/i) || !docPreviewUrl.endsWith('.pdf') ? (
                                <img
                                    src={docPreviewUrl}
                                    alt="Verification Document"
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                        // If image fails, switch to iframe fallback
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                            ) : null}
                            <iframe
                                src={docPreviewUrl}
                                title="ID Document"
                                className="w-full h-full border-0"
                                style={{ display: docPreviewUrl.endsWith('.pdf') ? 'block' : 'none' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVerificationsPage;
