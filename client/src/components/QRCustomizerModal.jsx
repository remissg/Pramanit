import React, { useState } from 'react';
import { QrCode, X, Sparkles, Eye, Palette, ShieldCheck, Check, Layers, Image as ImageIcon } from 'lucide-react';

export const QR_BODY_STYLES = [
    { id: 'square', label: 'Classic Square', icon: '🔳' },
    { id: 'dots', label: 'Circular Dots', icon: '🟣' },
    { id: 'rounded', label: 'Soft Rounded', icon: '⏹️' },
    { id: 'diamond', label: 'Diamond Dots', icon: '🔹' },
];

export const QR_EXTERNAL_EYES = [
    { id: 'square', label: 'Classic Square', icon: '🔲' },
    { id: 'rounded', label: 'Smooth Rounded', icon: '▢' },
    { id: 'circle', label: 'Circular Ring', icon: '⭕' },
    { id: 'leaf', label: 'Leaf / Teardrop', icon: '🍃' },
];

export const QR_INTERNAL_EYES = [
    { id: 'square', label: 'Square Dot', icon: '⬛' },
    { id: 'rounded', label: 'Rounded Dot', icon: '◼️' },
    { id: 'circle', label: 'Circle Dot', icon: '⚫' },
    { id: 'diamond', label: 'Diamond Dot', icon: '🔷' },
];

export const QR_SCANNABILITY = [
    { id: 'L', label: 'Low (7%)', desc: 'Best for simple text without logo' },
    { id: 'M', label: 'Medium (15%)', desc: 'Standard scannability' },
    { id: 'Q', label: 'Quartile (25%)', desc: 'High reliability' },
    { id: 'H', label: 'High (30%)', desc: 'Recommended for Center Logo Overlay' },
];

export const QR_COLOR_PRESETS = [
    { name: 'Onyx', dark: '#000000', light: '#ffffff' },
    { name: 'Indigo', dark: '#4f46e5', light: '#f5f3ff' },
    { name: 'Emerald', dark: '#047857', light: '#ecfdf5' },
    { name: 'Rose', dark: '#be123c', light: '#fff1f2' },
    { name: 'Amber', dark: '#b45309', light: '#fffbeb' },
    { name: 'Cyber', dark: '#06b6d4', light: '#0f172a' },
];

export default function QRCustomizerModal({ isOpen, onClose, qrConfig, onQrConfigChange }) {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState('body'); // 'body', 'externalEye', 'internalEye', 'scannability', 'background'

    const updateConfig = (key, value) => {
        onQrConfigChange({ ...qrConfig, [key]: value });
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[var(--bg-card)] border border-[var(--border-muted)] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-[var(--border-muted)] flex items-center justify-between bg-violet-600/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-violet-600/20 text-violet-500 flex items-center justify-center">
                            <QrCode size={22} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[var(--text-heading)] tracking-tight">QR Code Styling Studio</h3>
                            <p className="text-xs font-medium text-[var(--text-muted)]">Customize matrix body, finder eyes, scannability & colors</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-xl hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Tabs (Exactly matching user screenshots) */}
                <div className="p-4 border-b border-[var(--border-muted)] bg-[var(--bg-main)]/50 overflow-x-auto no-scrollbar flex items-center gap-2">
                    {[
                        { id: 'body', label: 'Body Shape', icon: Layers },
                        { id: 'externalEye', label: 'External Eye', icon: Eye },
                        { id: 'internalEye', label: 'Internal Eye', icon: Eye },
                        { id: 'scannability', label: 'Scannability Level', icon: ShieldCheck },
                        { id: 'background', label: 'Colors & Frame', icon: Palette },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
                                    isActive
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25 scale-105'
                                        : 'bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10'
                                }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                    
                    {/* BODY SHAPES TAB */}
                    {activeTab === 'body' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Select Matrix Module Pattern</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {QR_BODY_STYLES.map(style => {
                                    const isSelected = (qrConfig.dotStyle || 'square') === style.id;
                                    return (
                                        <button
                                            key={style.id}
                                            onClick={() => updateConfig('dotStyle', style.id)}
                                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 text-center ${
                                                isSelected
                                                    ? 'border-violet-500 bg-violet-600/10 text-violet-400 shadow-md ring-2 ring-violet-500/20'
                                                    : 'border-[var(--border-muted)] bg-[var(--bg-main)]/40 hover:border-violet-500/30 text-[var(--text-muted)]'
                                            }`}
                                        >
                                            <span className="text-3xl">{style.icon}</span>
                                            <span className="text-xs font-bold text-[var(--text-main)]">{style.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* EXTERNAL EYE TAB */}
                    {activeTab === 'externalEye' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Select Outer Corner Frame Shape</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {QR_EXTERNAL_EYES.map(eye => {
                                    const isSelected = (qrConfig.externalEye || 'square') === eye.id;
                                    return (
                                        <button
                                            key={eye.id}
                                            onClick={() => updateConfig('externalEye', eye.id)}
                                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 text-center ${
                                                isSelected
                                                    ? 'border-violet-500 bg-violet-600/10 text-violet-400 shadow-md ring-2 ring-violet-500/20'
                                                    : 'border-[var(--border-muted)] bg-[var(--bg-main)]/40 hover:border-violet-500/30 text-[var(--text-muted)]'
                                            }`}
                                        >
                                            <span className="text-3xl">{eye.icon}</span>
                                            <span className="text-xs font-bold text-[var(--text-main)]">{eye.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* INTERNAL EYE TAB */}
                    {activeTab === 'internalEye' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Select Inner Corner Dot Shape</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {QR_INTERNAL_EYES.map(eye => {
                                    const isSelected = (qrConfig.internalEye || 'square') === eye.id;
                                    return (
                                        <button
                                            key={eye.id}
                                            onClick={() => updateConfig('internalEye', eye.id)}
                                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 text-center ${
                                                isSelected
                                                    ? 'border-violet-500 bg-violet-600/10 text-violet-400 shadow-md ring-2 ring-violet-500/20'
                                                    : 'border-[var(--border-muted)] bg-[var(--bg-main)]/40 hover:border-violet-500/30 text-[var(--text-muted)]'
                                            }`}
                                        >
                                            <span className="text-3xl">{eye.icon}</span>
                                            <span className="text-xs font-bold text-[var(--text-main)]">{eye.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* SCANNABILITY LEVEL TAB */}
                    {activeTab === 'scannability' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Error Correction & Redundancy Level</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {QR_SCANNABILITY.map(lvl => {
                                    const isSelected = (qrConfig.scannability || 'H') === lvl.id;
                                    return (
                                        <button
                                            key={lvl.id}
                                            onClick={() => updateConfig('scannability', lvl.id)}
                                            className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                                                isSelected
                                                    ? 'border-violet-500 bg-violet-600/10 text-violet-400 shadow-md ring-2 ring-violet-500/20'
                                                    : 'border-[var(--border-muted)] bg-[var(--bg-main)]/40 hover:border-violet-500/30 text-[var(--text-muted)]'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${isSelected ? 'border-violet-500 bg-violet-600 text-white' : 'border-slate-500'}`}>
                                                {isSelected && <Check size={12} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-[var(--text-main)]">{lvl.label}</p>
                                                <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">{lvl.desc}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* COLORS & BACKGROUND TAB */}
                    {activeTab === 'background' && (
                        <div className="space-y-6">
                            {/* Color Presets */}
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">Color Presets</h4>
                                <div className="flex flex-wrap gap-3">
                                    {QR_COLOR_PRESETS.map(preset => (
                                        <button
                                            key={preset.name}
                                            onClick={() => {
                                                updateConfig('darkColor', preset.dark);
                                                updateConfig('lightColor', preset.light);
                                            }}
                                            className="px-4 py-2.5 rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-main)]/50 hover:scale-105 transition-all flex items-center gap-2.5"
                                        >
                                            <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center p-0.5" style={{ backgroundColor: preset.light }}>
                                                <div className="w-full h-full rounded-full" style={{ backgroundColor: preset.dark }} />
                                            </div>
                                            <span className="text-xs font-bold text-[var(--text-main)]">{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Picker */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-main)]/40 flex items-center justify-between">
                                    <span className="text-xs font-bold text-[var(--text-main)]">QR Code Module Color</span>
                                    <input
                                        type="color"
                                        value={qrConfig.darkColor || '#000000'}
                                        onChange={(e) => updateConfig('darkColor', e.target.value)}
                                        className="w-8 h-8 rounded-xl cursor-pointer border-0 bg-transparent"
                                    />
                                </div>
                                <div className="p-4 rounded-2xl border border-[var(--border-muted)] bg-[var(--bg-main)]/40 flex items-center justify-between">
                                    <span className="text-xs font-bold text-[var(--text-main)]">Background Color</span>
                                    <input
                                        type="color"
                                        value={qrConfig.lightColor || '#ffffff'}
                                        onChange={(e) => updateConfig('lightColor', e.target.value)}
                                        className="w-8 h-8 rounded-xl cursor-pointer border-0 bg-transparent"
                                    />
                                </div>
                            </div>

                            {/* Frame Selector */}
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">Frame & Background Style</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'card', label: '🎴 Card Box' },
                                        { id: 'bordered', label: '🖼️ Bordered' },
                                        { id: 'transparent', label: '✨ Glass / Transparent' },
                                    ].map(frame => {
                                        const isSelected = (qrConfig.frameStyle || 'card') === frame.id;
                                        return (
                                            <button
                                                key={frame.id}
                                                onClick={() => updateConfig('frameStyle', frame.id)}
                                                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                                                    isSelected
                                                        ? 'border-violet-500 bg-violet-600 text-white shadow-md'
                                                        : 'border-[var(--border-muted)] bg-[var(--bg-main)]/40 text-[var(--text-muted)] hover:text-white'
                                                }`}
                                            >
                                                {frame.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-[var(--border-muted)] bg-[var(--bg-main)]/80 flex items-center justify-between">
                    <button
                        onClick={() => {
                            onQrConfigChange({
                                ...qrConfig,
                                dotStyle: 'square',
                                externalEye: 'square',
                                internalEye: 'square',
                                scannability: 'H',
                                darkColor: '#000000',
                                lightColor: '#ffffff',
                                frameStyle: 'card'
                            });
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-rose-500 transition-colors"
                    >
                        Reset Defaults
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-violet-600/30 active:scale-95 transition-all"
                    >
                        Apply QR Design
                    </button>
                </div>

            </div>
        </div>
    );
}
