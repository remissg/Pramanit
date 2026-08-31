import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', confirmVariant = 'danger' }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#1e1b4b] border border-violet-500/30 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${confirmVariant === 'danger' ? 'bg-rose-500/20 text-rose-400' : 'bg-violet-500/20 text-violet-400'}`}>
                            <AlertTriangle size={20} />
                        </div>
                        <h3 className="text-base font-black text-white">{title}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all">
                        <X size={18} />
                    </button>
                </div>

                <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                    {message}
                </p>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-violet-500/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-5 py-2 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 ${
                            confirmVariant === 'danger'
                                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                                : 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
