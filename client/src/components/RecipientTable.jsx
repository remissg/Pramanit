import React, { useState, useMemo } from 'react';
import { Search, CheckSquare, Square, CheckCircle, AlertCircle, Trash2, Filter, Sparkles } from 'lucide-react';

const RecipientTable = ({
    headers = [],
    rows = [],
    selectedIndices = [],
    onToggleSelection,
    columnMapping = { name: '', email: '' },
    onDeleteRow,
    onCleanCsvData
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'valid', 'invalid', 'selected'

    // Helper for email validation
    const isValidEmail = (email) => {
        if (!email || typeof email !== 'string') return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    // Calculate processed rows with validity metadata
    const processedRows = useMemo(() => {
        return rows.map((row, idx) => {
            const emailVal = row[columnMapping.email] || row.email || '';
            const nameVal = row[columnMapping.name] || row.name || '';
            const valid = isValidEmail(emailVal);
            return {
                originalIndex: idx,
                data: row,
                email: emailVal,
                name: nameVal,
                isValidEmail: valid,
                isSelected: selectedIndices.includes(idx)
            };
        });
    }, [rows, columnMapping, selectedIndices]);

    // Compute duplicate email count
    const duplicateCount = useMemo(() => {
        const seen = new Set();
        let dupes = 0;
        processedRows.forEach(item => {
            if (item.email) {
                const norm = item.email.trim().toLowerCase();
                if (seen.has(norm)) {
                    dupes++;
                } else {
                    seen.add(norm);
                }
            }
        });
        return dupes;
    }, [processedRows]);

    // Filter rows based on search and status filter
    const filteredRows = useMemo(() => {
        return processedRows.filter(item => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                Object.values(item.data).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));

            if (!matchesSearch) return false;

            if (filterStatus === 'valid') return item.isValidEmail;
            if (filterStatus === 'invalid') return !item.isValidEmail;
            if (filterStatus === 'selected') return item.isSelected;

            return true;
        });
    }, [processedRows, searchTerm, filterStatus]);

    const isAllSelected = selectedIndices.length === rows.length && rows.length > 0;
    const validCount = processedRows.filter(r => r.isValidEmail).length;
    const invalidCount = processedRows.length - validCount;

    const handleToggleAll = () => {
        if (isAllSelected) {
            onToggleSelection([]);
        } else {
            onToggleSelection(rows.map((_, idx) => idx));
        }
    };

    const handleToggleRow = (originalIndex) => {
        if (selectedIndices.includes(originalIndex)) {
            onToggleSelection(selectedIndices.filter(i => i !== originalIndex));
        } else {
            onToggleSelection([...selectedIndices, originalIndex]);
        }
    };

    if (!rows || rows.length === 0) return null;

    // Additional display columns (excluding mapped name & email if present)
    const extraHeaders = headers.filter(h => h !== columnMapping.name && h !== columnMapping.email);

    return (
        <div className="bg-[var(--glass)] rounded-[24px] p-6 border border-[var(--glass-border)] space-y-4 animate-in fade-in zoom-in-95 duration-500 transition-colors">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[var(--glass-border)]">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-[var(--text-heading)] tracking-tight">Receiver List Preview</h3>
                        <span className="px-3 py-1 bg-violet-600/10 text-violet-400 rounded-full text-xs font-black border border-violet-500/20">
                            {rows.length} Total Recipients
                        </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-bold mt-1">
                        Inspect uploaded columns, emails, and select recipients for batch issuance.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1">
                        <CheckCircle size={12} className="text-emerald-400" /> {validCount} Valid
                    </span>
                    {invalidCount > 0 && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1">
                            <AlertCircle size={12} className="text-rose-400" /> {invalidCount} Invalid Email
                        </span>
                    )}
                    {duplicateCount > 0 && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                            <AlertCircle size={12} className="text-amber-400" /> {duplicateCount} Duplicate
                        </span>
                    )}
                    {onCleanCsvData && (duplicateCount > 0 || invalidCount > 0) && (
                        <button
                            onClick={onCleanCsvData}
                            className="ml-2 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                            title="Automatically purge duplicate emails and invalid address rows"
                        >
                            <Sparkles size={13} /> Clean CSV ({duplicateCount + invalidCount} Issues)
                        </button>
                    )}
                </div>
            </div>

            {/* Controls Bar: Search & Filter Pills */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search Box */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                    <input
                        type="text"
                        placeholder="Search name, email, or details..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-violet-500 transition-colors"
                    />
                </div>

                {/* Filter Tabs & Bulk Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="flex bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-interactive)] text-xs font-bold">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-3 py-1 rounded-lg transition-colors ${filterStatus === 'all' ? 'bg-violet-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                        >
                            All ({rows.length})
                        </button>
                        <button
                            onClick={() => setFilterStatus('selected')}
                            className={`px-3 py-1 rounded-lg transition-colors ${filterStatus === 'selected' ? 'bg-violet-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                        >
                            Selected ({selectedIndices.length})
                        </button>
                        <button
                            onClick={() => setFilterStatus('valid')}
                            className={`px-3 py-1 rounded-lg transition-colors ${filterStatus === 'valid' ? 'bg-violet-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                        >
                            Valid ({validCount})
                        </button>
                        {invalidCount > 0 && (
                            <button
                                onClick={() => setFilterStatus('invalid')}
                                className={`px-3 py-1 rounded-lg transition-colors ${filterStatus === 'invalid' ? 'bg-rose-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                            >
                                Invalid ({invalidCount})
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleToggleAll}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all ${isAllSelected ? 'bg-violet-600/20 text-violet-400 border-violet-500/40' : 'bg-[var(--bg-input)] border-[var(--border-interactive)] text-[var(--text-main)] hover:border-violet-500/50'}`}
                    >
                        {isAllSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                        {isAllSelected ? 'Deselect All' : 'Select All'}
                    </button>
                </div>
            </div>

            {/* Recipient Table */}
            <div className="overflow-x-auto rounded-2xl border border-[var(--glass-border)] max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--glass-border)] z-10">
                        <tr>
                            <th className="p-3 w-10 text-center">
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={handleToggleAll}
                                    className="rounded border-[var(--border-interactive)] text-violet-600 focus:ring-violet-500 cursor-pointer"
                                />
                            </th>
                            <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider">#</th>
                            <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider">Recipient Name</th>
                            <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider">Email Address</th>
                            <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                            {extraHeaders.map((h, i) => (
                                <th key={i} className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                            {onDeleteRow && <th className="p-3 font-black text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={5 + extraHeaders.length + (onDeleteRow ? 1 : 0)} className="p-8 text-center text-[var(--text-muted)] font-bold">
                                    No recipients match the current filter or search criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((item) => (
                                <tr
                                    key={item.originalIndex}
                                    className={`hover:bg-violet-500/5 transition-colors cursor-pointer ${item.isSelected ? 'bg-violet-600/5' : ''}`}
                                    onClick={() => handleToggleRow(item.originalIndex)}
                                >
                                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={item.isSelected}
                                            onChange={() => handleToggleRow(item.originalIndex)}
                                            className="rounded border-[var(--border-interactive)] text-violet-600 focus:ring-violet-500 cursor-pointer"
                                        />
                                    </td>
                                    <td className="p-3 font-mono text-[var(--text-muted)]">{item.originalIndex + 1}</td>
                                    <td className="p-3 font-bold text-[var(--text-main)]">{item.name || <span className="italic text-slate-400">Not Specified</span>}</td>
                                    <td className="p-3 font-mono text-[var(--text-main)]">{item.email || <span className="italic text-rose-400">Missing Email</span>}</td>
                                    <td className="p-3">
                                        {item.isValidEmail ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <CheckCircle size={10} /> Valid
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                <AlertCircle size={10} /> Invalid Email
                                            </span>
                                        )}
                                    </td>
                                    {extraHeaders.map((h, i) => (
                                        <td key={i} className="p-3 text-[var(--text-muted)] whitespace-nowrap">
                                            {String(item.data[h] ?? '')}
                                        </td>
                                    ))}
                                    {onDeleteRow && (
                                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => onDeleteRow(item.originalIndex)}
                                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                                title="Remove recipient"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Summary */}
            <div className="flex justify-between items-center text-xs text-[var(--text-muted)] font-bold pt-2">
                <span>Showing {filteredRows.length} of {rows.length} total recipients</span>
                <span className="text-violet-400">{selectedIndices.length} recipient(s) checked for sending</span>
            </div>
        </div>
    );
};

export default RecipientTable;
