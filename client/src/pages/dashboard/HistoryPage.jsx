import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    History, Search, Download, Users, CheckCircle, Eye,
    LayoutTemplate, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
    Sparkles, X, Award, Mail, Archive, Copy, Check, ExternalLink,
    Edit, Trash2, Wand2, Share2, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const HistoryPage = () => {
    const { user } = useAuth();
    const { history, loading } = useOutletContext();
    const [historySearch, setHistorySearch] = useState('');
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPageSize, setHistoryPageSize] = useState(10);

    // Selected Batch Audit Hub Modal State
    const [selectedHistoryRecord, setSelectedHistoryRecord] = useState(null);
    const [modalSearchTerm, setModalSearchTerm] = useState('');

    // Single Certificate Preview Modal State
    const [previewCertRecord, setPreviewCertRecord] = useState(null);
    const [certImageLoading, setCertImageLoading] = useState(true);
    const [isEditingCert, setIsEditingCert] = useState(false);
    const [editCertForm, setEditCertForm] = useState({ name: '', email: '', fields: {} });
    const [copiedCertId, setCopiedCertId] = useState(null);
    const [copiedLinkCertId, setCopiedLinkCertId] = useState(null);

    const handleExportCSV = () => {
        if (!history || history.length === 0) return;
        const headers = ['Date', 'Design Name', 'Total Sent', 'Delivery Rate (%)', 'Open Rate (%)', 'Recipients'];
        const rows = history.map(item => [
            `"${new Date(item.timestamp).toLocaleString()}"`,
            `"${item.design_name || 'Direct Generation'}"`,
            item.total_sent || 0,
            item.delivery_rate || 100,
            item.open_rate || 85,
            `"${(item.recipient_emails || []).join('; ')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Pramanit_Issuance_History_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filtered = history.filter(item => {
        const searchLower = historySearch.toLowerCase();
        const matchesDesign = (item.design_name || '').toLowerCase().includes(searchLower);
        const matchesDate = new Date(item.timestamp).toLocaleString().toLowerCase().includes(searchLower);
        const matchesRecipient = (item.recipient_emails || []).some(e => String(e).toLowerCase().includes(searchLower));
        return matchesDesign || matchesDate || matchesRecipient;
    });

    const totalPages = Math.ceil(filtered.length / historyPageSize) || 1;
    const startIdx = (historyPage - 1) * historyPageSize;
    const paginated = filtered.slice(startIdx, startIdx + historyPageSize);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Ultra Premium Header Banner */}
            <div
                className="relative rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 border overflow-hidden shadow-2xl transition-all duration-300"
                style={{ background: 'var(--banner-bg)', borderColor: 'var(--banner-border)' }}
            >
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest mb-3 border max-w-full leading-normal shadow-sm"
                            style={{
                                background: 'var(--banner-badge-bg)',
                                borderColor: 'var(--banner-badge-border)',
                                color: 'var(--banner-badge-text)'
                            }}
                        >
                            <Sparkles size={14} className="shrink-0 text-amber-400" />
                            <span className="truncate">Cryptographic Issuance Audit Log</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--text-heading)] tracking-tight">
                            Issuance History ({history.length} Batches)
                        </h2>
                        <p className="text-xs sm:text-sm font-semibold text-[var(--text-muted)] mt-2 max-w-xl leading-relaxed">
                            Audit past credential batches, inspect delivery success, track recipient interactions, and view cryptographically signed certificates.
                        </p>
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
                    >
                        <Download size={16} /> Export Audit CSV
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden shadow-xl">
                {/* Search & Pagination Bar */}
                <div className="p-6 border-b border-[var(--border-muted)] flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                        <input
                            type="text"
                            placeholder="Search design, email, or date..."
                            value={historySearch}
                            onChange={(e) => {
                                setHistorySearch(e.target.value);
                                setHistoryPage(1);
                            }}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--text-main)] outline-none focus:border-violet-500"
                        />
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto text-xs font-bold text-[var(--text-muted)]">
                        <span>Rows per page:</span>
                        <select
                            value={historyPageSize}
                            onChange={(e) => {
                                setHistoryPageSize(Number(e.target.value));
                                setHistoryPage(1);
                            }}
                            className="bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] outline-none cursor-pointer"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-white/10">
                                <th className="px-6 py-5">Date & Time</th>
                                <th className="px-6 py-5">Design Template</th>
                                <th className="px-6 py-5">Total Issued</th>
                                <th className="px-6 py-5">Delivery Stats</th>
                                <th className="px-6 py-5">Recipients Preview</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)] font-bold">
                                        No issuance history records match your search query.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((record) => (
                                    <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-5 text-xs font-bold text-[var(--text-main)] border-b border-white/5">
                                            {new Date(record.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 border-b border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center shrink-0">
                                                    <LayoutTemplate size={14} className="text-violet-500" />
                                                </div>
                                                <span className="font-bold text-sm text-[var(--text-main)] truncate max-w-xs">{record.design_name || 'Direct Generation'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 border-b border-white/5">
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-violet-600/10 text-violet-400 border border-violet-500/20 rounded-full text-xs font-black">
                                                <Users size={12} /> {record.total_sent} Issued
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 border-b border-white/5">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black">
                                                    <CheckCircle size={10} /> {record.delivery_rate || 100}% Sent
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black">
                                                    <Eye size={10} /> {record.open_rate || 85}% Opened
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-[var(--text-muted)] text-xs font-medium border-b border-white/5 truncate max-w-xs">
                                            {record.recipient_emails && record.recipient_emails.length > 0
                                                ? `${record.recipient_emails.slice(0, 2).join(', ')}${record.recipient_emails.length > 2 ? ` (+${record.recipient_emails.length - 2} more)` : ''}`
                                                : (record.recipient_list_ref || 'Batch Recipients')}
                                        </td>
                                        <td className="px-6 py-5 text-right border-b border-white/5">
                                            <button
                                                onClick={() => {
                                                    setSelectedHistoryRecord(record);
                                                    setModalSearchTerm('');
                                                }}
                                                className="px-4 py-2 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-[var(--border-muted)] flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-muted)]">
                            Page {historyPage} of {totalPages} ({filtered.length} items)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setHistoryPage(1)}
                                disabled={historyPage === 1}
                                className="p-2 rounded-xl border border-[var(--border-muted)] disabled:opacity-30 hover:bg-white/5 text-[var(--text-main)]"
                            >
                                <ChevronsLeft size={16} />
                            </button>
                            <button
                                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                disabled={historyPage === 1}
                                className="p-2 rounded-xl border border-[var(--border-muted)] disabled:opacity-30 hover:bg-white/5 text-[var(--text-main)]"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                                disabled={historyPage === totalPages}
                                className="p-2 rounded-xl border border-[var(--border-muted)] disabled:opacity-30 hover:bg-white/5 text-[var(--text-main)]"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                onClick={() => setHistoryPage(totalPages)}
                                disabled={historyPage === totalPages}
                                className="p-2 rounded-xl border border-[var(--border-muted)] disabled:opacity-30 hover:bg-white/5 text-[var(--text-main)]"
                            >
                                <ChevronsRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MASTER BATCH AUDIT HUB MODAL */}
            {selectedHistoryRecord && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-[var(--border-muted)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-[var(--glass-border)] flex justify-between items-center bg-violet-600/10">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 bg-violet-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                                        Batch Audit Hub
                                    </span>
                                    <span className="text-xs text-[var(--text-muted)] font-mono">ID: {selectedHistoryRecord.id}</span>
                                </div>
                                <h2 className="text-xl font-black text-[var(--text-heading)] tracking-tight mt-1">
                                    Issuance Details &mdash; {selectedHistoryRecord.design_name || 'Direct Generation'}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedHistoryRecord(null)}
                                className="p-2 text-[var(--text-muted)] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                            {/* Metadata Grid */}
                            <div className="p-6 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-muted)] grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <History size={16} className="text-violet-400 shrink-0" />
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-black">Issue Timestamp</p>
                                            <p className="text-sm font-bold text-[var(--text-main)]">
                                                {new Date(selectedHistoryRecord.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <LayoutTemplate size={16} className="text-violet-400 shrink-0" />
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-black">Design Template</p>
                                            <p className="text-sm font-bold text-[var(--text-main)]">
                                                {selectedHistoryRecord.design_name || 'Direct Generation'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Award size={16} className="text-violet-400 shrink-0" />
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-black">Issuer & Designation</p>
                                            <p className="text-sm font-black text-[var(--text-heading)] truncate">
                                                {selectedHistoryRecord.issuer_info?.issuer_name || user?.fullName || 'Issuing Authority'} ({selectedHistoryRecord.issuer_info?.issuer_designation || user?.designation || 'Signatory'})
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail size={16} className="text-violet-400 shrink-0" />
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-black">Issuer Email</p>
                                            <p className="text-sm font-mono text-[var(--text-main)] truncate">
                                                {selectedHistoryRecord.issuer_info?.issuer_email || user?.email || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Batch Summary Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">Total Issued</span>
                                    <span className="text-2xl font-black text-emerald-400">{selectedHistoryRecord.total_sent}</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 block mb-1">Delivery Rate</span>
                                    <span className="text-2xl font-black text-teal-400">{selectedHistoryRecord.delivery_rate || 100}%</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 block mb-1">Email Open Rate</span>
                                    <span className="text-2xl font-black text-violet-400">{selectedHistoryRecord.open_rate || 85}%</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block mb-1">Total Scans</span>
                                    <span className="text-2xl font-black text-blue-400">
                                        {selectedHistoryRecord.verification_scans || (selectedHistoryRecord.recipient_details || []).reduce((acc, r) => acc + (r.scan_count || 0), 0)}
                                    </span>
                                </div>
                            </div>

                            {/* Searchable Recipients Table */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                                        Issued Credentials List ({(selectedHistoryRecord.recipient_details || selectedHistoryRecord.recipient_emails || []).length})
                                    </span>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        {(selectedHistoryRecord.batch_id || selectedHistoryRecord.id || selectedHistoryRecord._id) && (
                                            <a
                                                href={`${import.meta.env.VITE_API_BASE_URL}/api/certificates/batch-zip/${selectedHistoryRecord.batch_id || selectedHistoryRecord.id || selectedHistoryRecord._id}`}
                                                download
                                                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 active:scale-95 shrink-0"
                                            >
                                                <Archive size={14} /> Download All PDFs (ZIP)
                                            </a>
                                        )}
                                        <div className="relative w-full sm:w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search name, email, or cert ID..."
                                                value={modalSearchTerm}
                                                onChange={(e) => setModalSearchTerm(e.target.value)}
                                                className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] outline-none focus:border-violet-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-2xl border border-[var(--border-muted)] max-h-72 overflow-y-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-muted)] z-10">
                                            <tr>
                                                <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider w-10">#</th>
                                                <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider">Recipient Name & Email</th>
                                                <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider">Certificate ID</th>
                                                <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                                                <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider">Scans</th>
                                                <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-muted)]">
                                            {(() => {
                                                const detailsList = selectedHistoryRecord.recipient_details || (selectedHistoryRecord.recipient_emails || []).map((email, idx) => ({
                                                    cert_id: `CERT-${selectedHistoryRecord.id.toString().substring(0, 8)}-${idx + 1}`,
                                                    recipient_name: 'Recipient',
                                                    recipient_email: email,
                                                    status: 'active',
                                                    scan_count: 0
                                                }));

                                                const filteredList = detailsList.filter(item => {
                                                    const term = modalSearchTerm.toLowerCase();
                                                    return (item.recipient_name || '').toLowerCase().includes(term) ||
                                                        (item.recipient_email || '').toLowerCase().includes(term) ||
                                                        (item.cert_id || '').toLowerCase().includes(term);
                                                });

                                                if (filteredList.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan={6} className="p-6 text-center text-[var(--text-muted)] font-bold">
                                                                No recipient credentials match your search query.
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return filteredList.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-3 font-mono text-[var(--text-muted)]">{idx + 1}</td>
                                                        <td className="p-3">
                                                            <p className="font-bold text-[var(--text-main)]">{item.recipient_name || 'Recipient'}</p>
                                                            <p className="font-mono text-[10px] text-[var(--text-muted)]">{item.recipient_email}</p>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-1.5 font-mono text-[10px] bg-white/5 px-2 py-1 rounded-lg border border-white/10 w-fit">
                                                                <span className="text-violet-400 font-bold">{item.cert_id}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(item.cert_id);
                                                                        setCopiedCertId(item.cert_id);
                                                                        setTimeout(() => setCopiedCertId(null), 2000);
                                                                    }}
                                                                    className="p-1 hover:text-white transition-colors"
                                                                    title="Copy Cert ID"
                                                                >
                                                                    {copiedCertId === item.cert_id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                <CheckCircle size={10} /> {item.status || 'Active'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 font-mono font-bold text-[var(--text-main)]">
                                                            {item.scan_count || 0}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setCertImageLoading(true);
                                                                        setPreviewCertRecord(item);
                                                                    }}
                                                                    className="px-3 py-1 rounded-lg bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white border border-violet-500/30 text-[10px] font-black uppercase transition-all flex items-center gap-1.5 active:scale-95"
                                                                >
                                                                    <Eye size={12} /> Preview
                                                                </button>
                                                                <a
                                                                    href={`/verify/${item.cert_id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-[10px] font-black uppercase transition-all flex items-center gap-1"
                                                                >
                                                                    <ExternalLink size={10} /> Verify
                                                                </a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ));
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-[var(--border-muted)] bg-[var(--bg-input)]/50 flex justify-between items-center">
                            <span className="text-xs text-[var(--text-muted)] font-bold">
                                Master Batch Verification Hub ID: <span className="font-mono text-violet-400">{selectedHistoryRecord.id}</span>
                            </span>
                            <button
                                onClick={() => setSelectedHistoryRecord(null)}
                                className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-violet-600/30 transition-all active:scale-95"
                            >
                                Close Audit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SINGLE CERTIFICATE PDF & IMAGE PREVIEW MODAL */}
            {previewCertRecord && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-[var(--border-muted)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-[var(--border-muted)] flex justify-between items-center bg-violet-600/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
                                    <Eye size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[var(--text-heading)] tracking-tight">
                                        Certificate Preview &mdash; {previewCertRecord.recipient_name || 'Recipient'}
                                    </h3>
                                    <p className="text-xs font-mono text-violet-400 font-bold">
                                        Cert ID: {previewCertRecord.cert_id}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreviewCertRecord(null)}
                                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Inline Multi-Field Corrector Drawer */}
                        {isEditingCert && (
                            <div className="p-6 border-b border-[var(--border-muted)] bg-violet-950/60 space-y-4 max-h-[55vh] overflow-y-auto animate-in slide-in-from-top-4 duration-300">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-black text-violet-300 uppercase tracking-widest flex items-center gap-2">
                                        <Wand2 size={16} /> On-The-Spot Full-Field Corrector
                                    </span>
                                    <span className="text-[10px] text-[var(--text-muted)] font-bold">Edit any field to re-render & re-issue in real-time</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-1">Recipient Name</label>
                                        <input
                                            type="text"
                                            value={editCertForm.name}
                                            onChange={(e) => setEditCertForm({ ...editCertForm, name: e.target.value })}
                                            className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] font-bold focus:border-violet-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-1">Recipient Email</label>
                                        <input
                                            type="text"
                                            value={editCertForm.email}
                                            onChange={(e) => setEditCertForm({ ...editCertForm, email: e.target.value })}
                                            className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] font-bold focus:border-violet-500"
                                        />
                                    </div>

                                    {/* Custom fields */}
                                    {Object.keys(editCertForm.fields || {}).map((key) => (
                                        <div key={key}>
                                            <label className="block text-[10px] font-black text-violet-400 uppercase tracking-wider mb-1">{key}</label>
                                            <input
                                                type="text"
                                                value={editCertForm.fields[key] || ''}
                                                onChange={(e) => setEditCertForm({
                                                    ...editCertForm,
                                                    fields: { ...editCertForm.fields, [key]: e.target.value }
                                                })}
                                                className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] font-bold focus:border-violet-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setIsEditingCert(false)}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[var(--text-muted)] rounded-xl text-xs font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/correct-inperson/${previewCertRecord.cert_id}`, {
                                                    recipientName: editCertForm.name,
                                                    recipientEmail: editCertForm.email,
                                                    fieldData: editCertForm.fields
                                                });
                                                const updatedCert = res.data.certificate;
                                                setPreviewCertRecord(prev => ({
                                                    ...prev,
                                                    recipient_name: updatedCert.recipient_name,
                                                    recipient_email: updatedCert.recipient_email,
                                                    rendered_image_url: updatedCert.rendered_image_url + '?t=' + Date.now(),
                                                    field_data: updatedCert.field_data
                                                }));
                                                setIsEditingCert(false);
                                                alert('Certificate updated and re-issued successfully!');
                                            } catch (err) {
                                                console.error(err);
                                                alert('Failed to update certificate.');
                                            }
                                        }}
                                        className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 active:scale-95"
                                    >
                                        <Wand2 size={14} /> Save & Re-Issue Certificate
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Certificate Image Canvas Container */}
                        <div className="p-3 sm:p-6 overflow-auto flex-1 flex flex-col items-center justify-center bg-slate-900/50 min-h-[220px] sm:min-h-[440px] max-h-[70vh] custom-scrollbar relative">
                            {certImageLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20 space-y-4 animate-in fade-in duration-300">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-violet-400">
                                            <Sparkles size={20} className="animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-black text-[var(--text-heading)] tracking-tight">Rendering Verifiable Credential</p>
                                        <p className="text-xs font-bold text-[var(--text-muted)]">Generating high-resolution layout preview...</p>
                                    </div>
                                </div>
                            )}
                            <div className={`relative w-full rounded-2xl overflow-auto border border-white/10 shadow-2xl bg-black/40 group p-1 sm:p-2 transition-opacity duration-500 ${certImageLoading ? 'opacity-0' : 'opacity-100'}`}>
                                <img
                                    src={previewCertRecord.rendered_image_url || `${import.meta.env.VITE_API_BASE_URL}/api/certificates/og-image/${previewCertRecord.cert_id}`}
                                    alt={`Certificate for ${previewCertRecord.recipient_name}`}
                                    className="w-full max-w-full h-auto object-contain rounded-xl mx-auto"
                                    onLoad={() => setCertImageLoading(false)}
                                    onError={(e) => {
                                        e.target.src = `${import.meta.env.VITE_API_BASE_URL}/api/certificates/og-image/${previewCertRecord.cert_id}`;
                                        setCertImageLoading(false);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Action Toolbar Footer */}
                        <div className="p-3 sm:p-6 border-t border-[var(--border-muted)] bg-[var(--bg-input)]/60 flex flex-wrap items-center justify-between gap-2 sm:gap-4 overflow-x-auto shrink-0">
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <a
                                    href={`${import.meta.env.VITE_API_BASE_URL}/api/certificates/download/${previewCertRecord.cert_id}`}
                                    download
                                    className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                                >
                                    <Download size={14} />
                                    <span className="hidden sm:inline">Download PDF</span>
                                    <span className="sm:hidden">PDF</span>
                                </a>
                                <a
                                    href={previewCertRecord.rendered_image_url || `${import.meta.env.VITE_API_BASE_URL}/api/certificates/og-image/${previewCertRecord.cert_id}`}
                                    download={`certificate-${previewCertRecord.cert_id}.png`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-main)] border border-white/10 font-bold text-xs transition-all flex items-center gap-1.5 shrink-0"
                                >
                                    <Eye size={14} />
                                    <span className="hidden sm:inline">Download Image (PNG)</span>
                                    <span className="sm:hidden">PNG</span>
                                </a>
                                <a
                                    href={(() => {
                                        const certTitle = previewCertRecord.certificate_title || 'Professional Certificate';
                                        const orgName = user?.orgName || 'Certified Institution';
                                        const dateObj = new Date(previewCertRecord.issue_date || Date.now());
                                        const year = dateObj.getFullYear();
                                        const month = dateObj.getMonth() + 1;
                                        const verifyUrl = `${window.location.origin}/verify/${previewCertRecord.cert_id}`;
                                        return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certTitle)}&organizationName=${encodeURIComponent(orgName)}&issueYear=${year}&issueMonth=${month}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(previewCertRecord.cert_id)}`;
                                    })()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/20 active:scale-95 shrink-0"
                                >
                                    <Share2 size={14} />
                                    <span className="hidden sm:inline">Add to LinkedIn</span>
                                    <span className="sm:hidden">LinkedIn</span>
                                </a>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <button
                                    onClick={() => {
                                        const verifyUrl = `${window.location.origin}/verify/${previewCertRecord.cert_id}`;
                                        navigator.clipboard.writeText(verifyUrl);
                                        setCopiedLinkCertId(previewCertRecord.cert_id);
                                        setTimeout(() => setCopiedLinkCertId(null), 2000);
                                    }}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-main)] border border-white/10 font-bold text-xs transition-all flex items-center gap-1.5 shrink-0"
                                >
                                    {copiedLinkCertId === previewCertRecord.cert_id ? (
                                        <>
                                            <Check size={14} className="text-emerald-400" /> <span className="text-emerald-400">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} />
                                            <span className="hidden sm:inline">Copy Verify Link</span>
                                            <span className="sm:hidden">Link</span>
                                        </>
                                    )}
                                </button>
                                <a
                                    href={`/verify/${previewCertRecord.cert_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all flex items-center gap-1.5 shrink-0"
                                >
                                    <ExternalLink size={14} />
                                    <span className="hidden sm:inline">Public Portal</span>
                                    <span className="sm:hidden">Portal</span>
                                </a>
                                <button
                                    onClick={() => {
                                        setEditCertForm({
                                            name: previewCertRecord.recipient_name || '',
                                            email: previewCertRecord.recipient_email || '',
                                            fields: previewCertRecord.field_data || {}
                                        });
                                        setIsEditingCert(!isEditingCert);
                                    }}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 border border-violet-500/30 font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                                >
                                    <Edit size={14} />
                                    <span className="hidden sm:inline">{isEditingCert ? 'Close Editor' : 'Edit / Correct Fields'}</span>
                                    <span className="sm:hidden">Edit</span>
                                </button>
                                {previewCertRecord.status === 'revoked' ? (
                                    <span className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                                        <AlertCircle size={14} /> Status: Revoked
                                    </span>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            if (window.confirm(`Are you sure you want to REVOKE certificate ${previewCertRecord.cert_id}? This will invalidate verification on the public portal.`)) {
                                                try {
                                                    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/revoke/${previewCertRecord.cert_id}`);
                                                    setPreviewCertRecord(prev => ({ ...prev, status: 'revoked' }));
                                                    if (selectedHistoryRecord && selectedHistoryRecord.recipient_details) {
                                                        setSelectedHistoryRecord(prev => ({
                                                            ...prev,
                                                            recipient_details: prev.recipient_details.map(r => r.cert_id === previewCertRecord.cert_id ? { ...r, status: 'revoked' } : r)
                                                        }));
                                                    }
                                                    alert('Certificate has been revoked successfully.');
                                                } catch (err) {
                                                    alert('Failed to revoke certificate.');
                                                    console.error(err);
                                                }
                                            }
                                        }}
                                        className="px-4 py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-bold text-xs transition-all flex items-center gap-2 active:scale-95"
                                    >
                                        <Trash2 size={14} /> Revoke Certificate
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
