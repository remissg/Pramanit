import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MessageSquare, Sparkles, Send, X, CheckCircle, Mail, Download } from 'lucide-react';
import axios from 'axios';

const InquiriesPage = () => {
    const { contactMessages, setContactMessages, refetch, loading } = useOutletContext();
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [replySuccess, setReplySuccess] = useState(false);

    const handleExportCSV = () => {
        if (!contactMessages || contactMessages.length === 0) return;
        const headers = ['Recipient Name', 'Recipient Email', 'Subject', 'Certificate ID', 'Status', 'Message'];
        const rows = contactMessages.map(msg => [
            `"${msg.recipient_name || ''}"`,
            `"${msg.recipient_email || ''}"`,
            `"${msg.subject || ''}"`,
            `"${msg.certificate_id || ''}"`,
            `"${msg.status || 'pending'}"`,
            `"${(msg.message || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Pramanit_Recipient_Inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!selectedMessage || !replyText.trim()) return;

        setSendingReply(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/contact/messages/${selectedMessage._id}/respond`, {
                response: replyText
            });
            setReplySuccess(true);
            setTimeout(() => {
                setReplySuccess(false);
                setReplyText('');
                setSelectedMessage(null);
                refetch();
            }, 2000);
        } catch (err) {
            console.error('Failed to send reply to recipient', err);
        } finally {
            setSendingReply(false);
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
                    <span className="text-xs font-black uppercase tracking-widest text-violet-400 flex items-center gap-2 mb-2">
                        <Sparkles size={16} /> Recipient Communication Inbox
                    </span>
                    <h2 className="text-3xl font-black text-[var(--text-heading)] tracking-tight">
                        Inquiries & Messages ({contactMessages.length})
                    </h2>
                    <p className="text-sm font-bold text-[var(--text-muted)] mt-1">
                        Read inquiries sent by recipients from their portal and respond directly via email.
                    </p>
                </div>
                <button
                    onClick={handleExportCSV}
                    disabled={contactMessages.length === 0}
                    className="px-6 py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 active:scale-95 shrink-0"
                >
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Messages Table Container */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden shadow-xl">
                {contactMessages.length === 0 ? (
                    <div className="p-16 text-center space-y-4">
                        <div className="w-16 h-16 bg-violet-500/10 text-violet-500 rounded-3xl mx-auto flex items-center justify-center">
                            <MessageSquare size={32} />
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-heading)]">No Inquiries Found</h3>
                        <p className="text-sm font-bold text-[var(--text-muted)]">When recipients send questions or feedback regarding their certificates, messages will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-white/10">
                                    <th className="px-8 py-5">Recipient</th>
                                    <th className="px-8 py-5">Subject</th>
                                    <th className="px-8 py-5">Cert Serial ID</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contactMessages.map((msg) => (
                                    <tr key={msg._id} className="hover:bg-white/5 transition-colors group border-b border-white/5">
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-black text-[var(--text-heading)]">{msg.recipient_name || 'Recipient'}</p>
                                            <p className="text-xs font-bold text-[var(--text-muted)]">{msg.recipient_email}</p>
                                        </td>
                                        <td className="px-8 py-5 font-bold text-sm text-[var(--text-heading)]">
                                            {msg.subject}
                                        </td>
                                        <td className="px-8 py-5 text-[var(--text-muted)] text-xs font-mono font-bold">
                                            {msg.certificate_id || 'N/A'}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                                msg.status === 'responded' || msg.status === 'resolved'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                                {msg.status || 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedMessage(msg);
                                                    setReplyText(msg.issuer_response || '');
                                                }}
                                                className="px-4 py-2 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                            >
                                                View & Reply
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Selected Message Reply Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-[var(--glass-border)] space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
                            <div>
                                <h3 className="text-xl font-black text-[var(--text-heading)]">Inquiry Details</h3>
                                <p className="text-xs font-bold text-[var(--text-muted)]">From: {selectedMessage.recipient_name} ({selectedMessage.recipient_email})</p>
                            </div>
                            <button onClick={() => setSelectedMessage(null)} className="text-[var(--text-muted)] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-muted)] space-y-2">
                            <p className="text-[10px] font-black uppercase text-violet-400">Subject: {selectedMessage.subject}</p>
                            <p className="text-sm font-medium text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                        </div>

                        {replySuccess ? (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                                <CheckCircle size={16} /> Official Email Response Sent Successfully!
                            </div>
                        ) : (
                            <form onSubmit={handleSendReply} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Write Official Email Reply</label>
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your response to the recipient..."
                                        rows={4}
                                        required
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl p-4 text-xs font-medium text-[var(--text-main)] outline-none focus:border-violet-500"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMessage(null)}
                                        className="px-5 py-2.5 rounded-xl border border-[var(--border-muted)] text-xs font-bold text-[var(--text-muted)]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sendingReply || !replyText.trim()}
                                        className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-600/30 flex items-center gap-2"
                                    >
                                        <Send size={14} /> {sendingReply ? 'Sending Email...' : 'Send Official Response'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InquiriesPage;
