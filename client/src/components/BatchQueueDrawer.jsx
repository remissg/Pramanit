import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Clock,
    Play,
    XCircle,
    CheckCircle,
    AlertCircle,
    Loader,
    Shield,
    Calendar,
    Users,
    Sparkles,
    RefreshCw,
    X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BatchQueueDrawer({ isOpen, onClose }) {
    const { token } = useAuth();
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchBatches = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/scheduled-batches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBatches(res.data || []);
        } catch (err) {
            console.error('Failed to fetch scheduled batches:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchBatches();
            const interval = setInterval(fetchBatches, 10000); // Polling every 10s when drawer is open
            return () => clearInterval(interval);
        }
    }, [isOpen, token]);

    const handleRunNow = async (batchId) => {
        setActionLoading(batchId);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/run-batch-now/${batchId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchBatches();
        } catch (err) {
            alert('Failed to trigger batch dispatch: ' + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (batchId) => {
        if (!confirm('Are you sure you want to cancel this scheduled batch dispatch?')) return;
        setActionLoading(batchId);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/cancel-batch/${batchId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchBatches();
        } catch (err) {
            alert('Failed to cancel scheduled batch: ' + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(null);
        }
    };

    if (!isOpen) return null;

    const getPaceBadge = (pace) => {
        if (pace === 'fast') return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">⚡ Fast Pace (1.0s gap)</span>;
        if (pace === 'drip') return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">💧 High Drip (5.0s gap)</span>;
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">🛡️ Safe Pace (2.5s gap)</span>;
    };

    const getStatusBadge = (status) => {
        if (status === 'processing') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-violet-600 text-white animate-pulse"><Loader size={12} className="animate-spin" /> Processing Queue</span>;
        if (status === 'scheduled') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/30"><Clock size={12} /> Scheduled</span>;
        if (status === 'completed') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"><CheckCircle size={12} /> Completed</span>;
        if (status === 'cancelled') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-500/10 text-slate-400 border border-slate-500/30"><XCircle size={12} /> Cancelled</span>;
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-red-500/10 text-red-400 border border-red-500/30"><AlertCircle size={12} /> Failed</span>;
    };

    return (
        <div className="fixed inset-0 z-[600] flex justify-end bg-slate-950/80 backdrop-blur-lg animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-[var(--bg-card)] h-full border-l border-[var(--border-muted)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-6 border-b border-[var(--glass-border)] flex justify-between items-center bg-violet-600/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[var(--text-heading)] tracking-tight">
                                Batch Queue & Scheduler Manager
                            </h3>
                            <p className="text-xs font-bold text-[var(--text-muted)]">
                                Anti-Spam Rate Throttling Active
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchBatches}
                            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                            title="Refresh Queue"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Queue List */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                    {loading && batches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
                            <Loader size={32} className="animate-spin text-violet-500" />
                            <p className="text-xs font-bold uppercase tracking-widest">Loading Batch Dispatch Queue...</p>
                        </div>
                    ) : batches.length === 0 ? (
                        <div className="text-center py-16 p-8 border border-dashed border-[var(--border-muted)] rounded-3xl space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-violet-500/10 text-violet-400 flex items-center justify-center mx-auto border border-violet-500/20">
                                <Clock size={32} />
                            </div>
                            <h4 className="text-base font-black text-[var(--text-heading)]">No Scheduled Batches Found</h4>
                            <p className="text-xs font-bold text-[var(--text-muted)] max-w-sm mx-auto">
                                When you schedule certificate dispatches in Step 4, they will appear here with live progress bars and controls.
                            </p>
                        </div>
                    ) : (
                        batches.map((batch) => {
                            const progressPct = batch.total_recipients > 0 ? Math.min(100, Math.round((batch.processed_count / batch.total_recipients) * 100)) : 0;
                            return (
                                <div
                                    key={batch._id}
                                    className="p-5 bg-[var(--bg-input)] border border-[var(--border-muted)] rounded-3xl space-y-4 hover:border-violet-500/30 transition-all shadow-md"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-muted)] pb-3">
                                        <div>
                                            <h4 className="font-black text-base text-[var(--text-heading)]">{batch.design_name}</h4>
                                            <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">ID: {batch._id}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getPaceBadge(batch.dispatch_pace)}
                                            {getStatusBadge(batch.status)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">Scheduled Target</span>
                                            <p className="font-bold text-[var(--text-heading)] flex items-center gap-1">
                                                <Calendar size={12} className="text-violet-400" />
                                                {new Date(batch.scheduled_for).toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">Recipients</span>
                                            <p className="font-bold text-[var(--text-heading)] flex items-center gap-1">
                                                <Users size={12} className="text-violet-400" />
                                                {batch.total_recipients} Recipients
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">Progress</span>
                                            <p className="font-bold text-[var(--text-heading)]">
                                                {batch.processed_count} / {batch.total_recipients} ({progressPct}%)
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1.5">
                                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
                                            <div
                                                style={{ width: `${progressPct}%` }}
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    batch.status === 'completed'
                                                        ? 'bg-emerald-500'
                                                        : batch.status === 'processing'
                                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-400 animate-pulse'
                                                        : batch.status === 'cancelled'
                                                        ? 'bg-slate-600'
                                                        : 'bg-amber-500'
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    {batch.error_log && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 font-medium">
                                            Error: {batch.error_log}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        {batch.status === 'scheduled' && (
                                            <>
                                                <button
                                                    onClick={() => handleCancel(batch._id)}
                                                    disabled={actionLoading === batch._id}
                                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                                >
                                                    <XCircle size={14} /> Cancel Schedule
                                                </button>
                                                <button
                                                    onClick={() => handleRunNow(batch._id)}
                                                    disabled={actionLoading === batch._id}
                                                    className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all flex items-center gap-1.5 active:scale-95"
                                                >
                                                    <Play size={14} /> Run Now
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
