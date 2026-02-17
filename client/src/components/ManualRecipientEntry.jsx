import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Mail, Sparkles, Hash } from 'lucide-react';

const ManualRecipientEntry = ({ onDataChange }) => {
    // Load draft from localStorage if it exists
    const [headers, setHeaders] = useState(() => {
        const saved = localStorage.getItem('pramanit_manual_headers');
        return saved ? JSON.parse(saved) : ['Name', 'Email'];
    });

    const [rows, setRows] = useState(() => {
        const saved = localStorage.getItem('pramanit_manual_rows');
        return saved ? JSON.parse(saved) : [
            { Name: '', Email: '' },
            { Name: '', Email: '' }
        ];
    });

    // Magic Paste State
    const [showMagicPaste, setShowMagicPaste] = useState(false);
    const [pasteText, setPasteText] = useState('');

    const syncToParent = (currentHeaders, currentRows) => {
        onDataChange(currentHeaders, currentRows);
        localStorage.setItem('pramanit_manual_headers', JSON.stringify(currentHeaders));
        localStorage.setItem('pramanit_manual_rows', JSON.stringify(currentRows));
    };

    const addRow = () => {
        const newRow = headers.reduce((acc, h) => ({ ...acc, [h]: '' }), {});
        const nextRows = [...rows, newRow];
        setRows(nextRows);
        syncToParent(headers, nextRows);
    };

    const removeRow = (index) => {
        if (rows.length <= 1) return;
        const nextRows = rows.filter((_, i) => i !== index);
        setRows(nextRows);
        syncToParent(headers, nextRows);
    };

    const updateCell = (rowIndex, header, value) => {
        const nextRows = [...rows];
        nextRows[rowIndex][header] = value;
        setRows(nextRows);
        syncToParent(headers, nextRows);
    };

    const addHeader = () => {
        const newHeader = `Field ${headers.length + 1}`;
        const nextHeaders = [...headers, newHeader];
        const nextRows = rows.map(row => ({ ...row, [newHeader]: '' }));
        setHeaders(nextHeaders);
        setRows(nextRows);
        syncToParent(nextHeaders, nextRows);
    };

    const removeHeader = (headerName) => {
        if (headers.length <= 1) return;
        const nextHeaders = headers.filter(h => h !== headerName);
        const nextRows = rows.map(row => {
            const { [headerName]: _, ...rest } = row;
            return rest;
        });
        setHeaders(nextHeaders);
        setRows(nextRows);
        syncToParent(nextHeaders, nextRows);
    };

    const renameHeader = (oldName, newName) => {
        if (!newName.trim() || headers.includes(newName)) return;
        const nextHeaders = headers.map(h => h === oldName ? newName : h);
        const nextRows = rows.map(row => {
            const { [oldName]: val, ...rest } = row;
            return { ...rest, [newName]: val };
        });
        setHeaders(nextHeaders);
        setRows(nextRows);
        syncToParent(nextHeaders, nextRows);
    };

    const handleMagicPaste = () => {
        if (!pasteText.trim()) return;

        const lines = pasteText.split('\n').filter(line => line.trim());
        const newRows = lines.map(line => {
            // Try to find an email address
            const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            const email = emailMatch ? emailMatch[0] : '';

            // Assume the rest is the name (remove the email and special chars)
            let name = line.replace(email, '').replace(/[<>[\](),;:]/g, '').trim();

            // If name is empty, use the first part of the email
            if (!name && email) {
                name = email.split('@')[0].split(/[._+-]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            }

            return { Name: name || 'New Recipient', Email: email };
        });

        const nextRows = [...rows.filter(r => r.Name || r.Email), ...newRows];
        setRows(nextRows);
        setHeaders(['Name', 'Email']); // Reset to standard for magic paste for now to avoid complexity
        syncToParent(['Name', 'Email'], nextRows);
        setPasteText('');
        setShowMagicPaste(false);
    };

    // Initial sync
    useEffect(() => {
        syncToParent(headers, rows);
    }, []);

    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Magic Paste Modal */}
            {showMagicPaste && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-6">
                    <div className="bg-[var(--bg-card)] p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300 rounded-[32px] border border-[var(--glass-border)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-indigo-600"></div>
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="text-violet-500" size={24} />
                            <h3 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">Magic Paste</h3>
                        </div>
                        <p className="text-[var(--text-muted)] text-sm font-bold mb-4">Paste text from WhatsApp, Email, or CSV (Name & Email). We'll handle the rest! ✨</p>
                        <textarea
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            placeholder="John Doe <john@example.com>&#10;Jane Smith jane@test.com&#10;Alice, alice@work.com"
                            className="w-full h-48 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl p-4 text-sm font-medium text-[var(--text-main)] focus:outline-none focus:border-violet-500/50 transition-all mb-6 resize-none custom-scrollbar"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowMagicPaste(false)}
                                className="px-6 py-3 rounded-xl border border-[var(--border-interactive)] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMagicPaste}
                                className="px-8 py-3 rounded-xl bg-violet-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-violet-500 shadow-lg shadow-violet-900/20 transition-all flex items-center gap-2"
                            >
                                <Sparkles size={14} /> Parse & Add
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-violet-500" size={20} />
                    <h3 className="text-lg font-black text-[var(--text-heading)] tracking-tight transition-colors">Quick Entry Mode</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowMagicPaste(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-violet-900/20 hover:scale-105 transition-all active:scale-95"
                    >
                        <Sparkles size={14} /> Magic Paste
                    </button>
                    <button
                        onClick={addHeader}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600/10 text-violet-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-violet-500/20 hover:bg-violet-600/20 transition-all active:scale-95"
                    >
                        <Plus size={14} /> Add Column
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
                <table className="w-full border-separate border-spacing-y-2 border-spacing-x-0">
                    <thead>
                        <tr>
                            <th className="w-12 text-center text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pb-4">#</th>
                            {headers.map((header, hIdx) => (
                                <th key={hIdx} className="min-w-[180px] px-2 pb-4 text-left group">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-grow relative flex items-center">
                                            {header.toLowerCase().includes('name') ? <User size={12} className="absolute left-3 text-violet-400 opacity-60" /> :
                                                header.toLowerCase().includes('email') ? <Mail size={12} className="absolute left-3 text-violet-400 opacity-60" /> :
                                                    <Hash size={12} className="absolute left-3 text-violet-400 opacity-60" />}
                                            <input
                                                value={header}
                                                onChange={(e) => renameHeader(header, e.target.value)}
                                                className="bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2 pl-9 pr-3 text-xs font-black text-[var(--text-heading)] focus:outline-none focus:border-violet-500/50 w-full transition-all hover:border-violet-500/30"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeHeader(header)}
                                            className="p-2 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </th>
                            ))}
                            <th className="w-12"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rIdx) => (
                            <tr key={rIdx} className="group/row">
                                <td className="text-center">
                                    <span className="text-[10px] font-black text-[var(--text-muted)] opacity-30">{rIdx + 1}</span>
                                </td>
                                {headers.map((header, hIdx) => (
                                    <td key={hIdx} className="px-2">
                                        <input
                                            value={row[header]}
                                            onChange={(e) => updateCell(rIdx, header, e.target.value)}
                                            placeholder={`Enter ${header}...`}
                                            className="bg-[var(--glass)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-violet-500/50 w-full transition-all group-hover/row:border-violet-500/20"
                                        />
                                    </td>
                                ))}
                                <td className="px-2">
                                    <button
                                        onClick={() => removeRow(rIdx)}
                                        className="p-2 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover/row:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button
                onClick={addRow}
                className="w-full py-4 border-2 border-dashed border-[var(--border-interactive)] rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-violet-500 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group active:scale-[0.99]"
            >
                <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                Add Another Person
            </button>
        </div>
    );
};

export default ManualRecipientEntry;
