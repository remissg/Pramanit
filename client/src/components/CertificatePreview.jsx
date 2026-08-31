import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Type, Move, Palette, Minus, Plus, Eye, Sparkles, CaseSensitive, Italic, Underline, Bold, Search, ChevronDown, Check, QrCode, Wand2, Loader, Save } from 'lucide-react';
import axios from 'axios';
import QRCode from 'qrcode';
import CustomSelect from './CustomSelect';
import QRCustomizerModal from './QRCustomizerModal';

const FONTS = [
    { name: 'Inter', value: 'Inter' },
    { name: 'Montserrat', value: 'Montserrat' },
    { name: 'Outfit', value: 'Outfit' },
    { name: 'Raleway', value: 'Raleway' },
    { name: 'Playfair Display', value: '"Playfair Display"' },
    { name: 'Serif', value: 'serif' },
    { name: 'Cursive', value: 'cursive' },
    { name: 'Monospace', value: 'monospace' },
    { name: 'Times New Roman', value: '"Times New Roman"' },
    { name: 'Old English', value: '"UnifrakturMaguntia"' },
    { name: 'Pacifico', value: '"Pacifico"' },
];

const CertificatePreview = ({
    templateFile,
    fields,
    onFieldsChange,
    activeFieldId,
    onActiveFieldChange,
    previewData,
    qrConfig,
    onQrConfigChange,
    onSave, // New Prop
    isSaving, // New Prop
    orgLogoUrl
}) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [scale, setScale] = useState(1);
    const imageRef = useRef(null);
    const containerRef = useRef(null);
    const [imageSize, setImageSize] = useState({ width: 1000, height: 1000 });
    const [guidelines, setGuidelines] = useState({ h: false, v: false });
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [customizerOpen, setCustomizerOpen] = useState(false);

    useEffect(() => {
        if (templateFile) {
            const url = URL.createObjectURL(templateFile);
            setImageUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [templateFile]);

    const handleImageLoad = (e) => {
        const visualImage = e.target;
        setImageSize({ width: visualImage.naturalWidth, height: visualImage.naturalHeight });
        updateScale();
    };

    // Derived visual dimensions (always based on 1000px width standard)
    const visualDimensions = {
        width: 1000,
        height: 1000 * (imageSize.height / (imageSize.width || 1000))
    };

    const updateScale = () => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.clientWidth;
            const targetWidth = 1000; // Expected desktop width
            if (containerWidth < targetWidth) {
                setScale(containerWidth / targetWidth);
            } else {
                setScale(1);
            }
        }
    };

    useEffect(() => {
        window.addEventListener('resize', updateScale);
        updateScale();
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    const updateField = (id, updates) => {
        const newFields = fields.map(f => f.id === id ? { ...f, ...updates } : f);
        onFieldsChange(newFields);
    };

    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDrag = (id, data, boxSize, isQr = false) => {
        if (!imageRef.current) return;

        const { centerX, centerY } = data;

        // Manual Boundary Clamping
        const minX = boxSize.width / 2;
        const maxX = visualDimensions.width - (boxSize.width / 2);
        const minY = boxSize.height / 2;
        const maxY = visualDimensions.height - (boxSize.height / 2);

        let clampedX = Math.max(minX, Math.min(maxX, centerX));
        let clampedY = Math.max(minY, Math.min(maxY, centerY));

        const containerCenterX = visualDimensions.width / 2;
        const containerCenterY = visualDimensions.height / 2;

        const threshold = visualDimensions.width * 0.015;
        const isNearCenterX = Math.abs(clampedX - containerCenterX) < threshold;
        const isNearCenterY = Math.abs(clampedY - containerCenterY) < threshold;

        setGuidelines({ h: isNearCenterY, v: isNearCenterX });

        if (isQr) {
            onQrConfigChange({
                ...qrConfig,
                x: clampedX / (visualDimensions.width || 1000),
                y: clampedY / (visualDimensions.height || 1000)
            });
        } else {
            updateField(id, {
                x: clampedX / (visualDimensions.width || 1000),
                y: clampedY / (visualDimensions.height || 1000)
            });
        }
    };

    const handleDragStop = () => {
        setGuidelines({ h: false, v: false });
        setIsDragging(false);
    };

    const activeField = fields.find(f => f.id === activeFieldId);

    return (
        <div className="w-full max-w-5xl mx-auto overflow-visible transition-all duration-500">
            {/* Toolbar - Sticky on Mobile */}
            <div className="sticky top-[72px] md:top-0 z-[100] glass border-b border-[var(--glass-border)] bg-[var(--bg-main)]/98 backdrop-blur-2xl transition-all shadow-2xl">
                <div className="p-4 md:p-6 flex flex-col items-stretch gap-4 md:gap-6">
                    <div className="flex items-center justify-between gap-4 md:gap-6 w-full flex-wrap">
                        <h3 className="text-[var(--text-heading)] font-black hidden lg:flex items-center gap-2 transition-colors whitespace-nowrap">
                            <Type size={18} className="text-violet-400" />
                            Designer
                        </h3>

                        {onSave && (
                            <button
                                onClick={onSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                                <span className="hidden sm:inline">Save Design</span>
                            </button>
                        )}

                        <div className="flex items-center gap-2 flex-grow md:flex-grow-0 order-1 md:order-none">
                            <CustomSelect
                                value={activeFieldId || ''}
                                onChange={(id) => onActiveFieldChange(id)}
                                options={fields.map(f => ({ name: f.label, value: f.id }))}
                                icon={Type}
                                className="flex-grow max-w-[140px] md:max-w-none"
                            />

                            {activeField && (
                                <CustomSelect
                                    value={activeField.fontFamily}
                                    onChange={(val) => updateField(activeField.id, { fontFamily: val })}
                                    options={FONTS}
                                    className="w-32 md:w-40"
                                />
                            )}
                        </div>

                        <div className="flex items-center gap-2 order-2 md:order-none">
                            {/* QR Toggle */}
                            <button
                                onClick={() => onQrConfigChange({ ...qrConfig, isVisible: !qrConfig.isVisible })}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${qrConfig.isVisible
                                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                                    : 'bg-[var(--bg-input)] border-[var(--border-interactive)] text-[var(--text-muted)] hover:border-violet-500/30'
                                    }`}
                                title="Verification QR Code"
                            >
                                <QrCode size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">QR Verify</span>
                            </button>

                            {activeField && (
                                <button
                                    onClick={() => updateField(activeField.id, { isVisible: !activeField.isVisible })}
                                    className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all shrink-0 ${activeField.isVisible ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20' : 'bg-[var(--bg-input)] border-[var(--border-interactive)] text-[var(--text-muted)]'
                                        }`}
                                    title={activeField.isVisible ? 'Field Visible' : 'Field Hidden'}
                                >
                                    {activeField.isVisible ? <Eye size={18} /> : <Eye size={18} className="opacity-40" />}
                                </button>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            {activeField ? (
                                <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar md:flex-wrap animate-in slide-in-from-top-2 duration-300 w-full md:w-auto transition-all">
                                    {/* Color Toggle / Palette */}
                                    <div className="flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl px-2 py-1.5 shadow-sm transition-colors order-first">
                                        {[
                                            { name: 'White', value: '#FFFFFF' },
                                            { name: 'Black', value: '#000000' },
                                            { name: 'Gold', value: '#D4AF37' },
                                            { name: 'Violet', value: '#8b5cf6' }
                                        ].map(preset => (
                                            <button
                                                key={preset.value}
                                                onClick={() => updateField(activeField.id, { color: preset.value })}
                                                className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${activeField.color === preset.value ? 'border-violet-400 ring-2 ring-violet-500/20' : 'border-[var(--glass-border)]'}`}
                                                style={{ backgroundColor: preset.value }}
                                                title={preset.name}
                                            />
                                        ))}
                                        <div className="w-px h-4 bg-[var(--border-interactive)] mx-1"></div>
                                        <div className="w-px h-4 bg-[var(--border-interactive)] mx-1"></div>
                                        <div className="relative group/color w-8 h-8 flex items-center justify-center">
                                            <input
                                                type="color"
                                                value={activeField.color}
                                                onChange={(e) => updateField(activeField.id, { color: e.target.value })}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                                                title="Choose Custom Color"
                                            />
                                            <div
                                                className="w-8 h-8 rounded-xl border border-[var(--border-interactive)] flex items-center justify-center transition-all group-hover/color:border-violet-500/50 group-hover/color:scale-105 shadow-sm"
                                                style={{ backgroundColor: `${activeField.color}15` }}
                                            >
                                                <Palette size={16} style={{ color: activeField.color }} className="drop-shadow-sm" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-main)]/50 rounded-lg border border-[var(--border-interactive)] focus-within:border-violet-500/50 transition-all ml-1 group/hex">
                                            <span className="text-[10px] font-black text-violet-400 opacity-50 group-focus-within/hex:opacity-100 transition-opacity">#</span>
                                            <input
                                                type="text"
                                                value={activeField.color.replace('#', '')}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
                                                    if (val.length <= 6) {
                                                        updateField(activeField.id, { color: val.length === 6 || val.length === 3 ? `#${val}` : `#${val}`.padEnd(7, val[val.length - 1] || '0') });
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    let val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
                                                    if (val.length < 6 && val.length > 0) {
                                                        val = val.padEnd(6, val[val.length - 1]);
                                                        updateField(activeField.id, { color: `#${val}` });
                                                    }
                                                }}
                                                className="bg-transparent text-[10px] font-mono font-black text-[var(--text-main)] w-[54px] outline-none transition-colors"
                                                placeholder="FFFFFF"
                                                title="Enter Hex Code"
                                            />
                                        </div>
                                    </div>

                                    {/* Font Size Group */}
                                    <div className="flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl px-2 py-1.5 shadow-sm transition-colors">
                                        <button
                                            onClick={() => updateField(activeField.id, { fontSize: Math.max(8, activeField.fontSize - 2) })}
                                            className="p-1 hover:bg-violet-600/10 rounded-lg text-violet-400 transition-colors"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <div className="flex items-center gap-1 min-w-[45px] justify-center">
                                            <span className="text-[10px] font-black text-[var(--text-main)] transition-colors">{activeField.fontSize}</span>
                                            <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-tight">px</span>
                                        </div>
                                        <button
                                            onClick={() => updateField(activeField.id, { fontSize: Math.min(200, activeField.fontSize + 2) })}
                                            className="p-1 hover:bg-violet-600/10 rounded-lg text-violet-400 transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    {/* Style Toggles Group */}
                                    <div className="flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl px-1.5 py-1.5 shadow-sm transition-colors">
                                        <button
                                            onClick={() => updateField(activeField.id, { isBold: !activeField.isBold })}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeField.isBold ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-[var(--text-muted)] hover:bg-violet-600/10 hover:text-violet-400'}`}
                                            title="Bold"
                                        >
                                            <Bold size={14} />
                                        </button>
                                        <button
                                            onClick={() => updateField(activeField.id, { isItalic: !activeField.isItalic })}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeField.isItalic ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-[var(--text-muted)] hover:bg-violet-600/10 hover:text-violet-400'}`}
                                            title="Italic"
                                        >
                                            <Italic size={14} />
                                        </button>
                                        <button
                                            onClick={() => updateField(activeField.id, { isUnderline: !activeField.isUnderline })}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeField.isUnderline ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-[var(--text-muted)] hover:bg-violet-600/10 hover:text-violet-400'}`}
                                            title="Underline"
                                        >
                                            <Underline size={14} />
                                        </button>
                                    </div>

                                    {/* Text Case Group */}
                                    <div className="flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl px-1.5 py-1.5 shadow-sm transition-colors">
                                        <button
                                            onClick={() => updateField(activeField.id, { textCase: 'normal' })}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeField.textCase === 'normal' || !activeField.textCase ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-[var(--text-muted)] hover:bg-violet-600/10 hover:text-violet-400'}`}
                                            title="Normal Case"
                                        >
                                            <span className="text-[10px] font-black">Aa</span>
                                        </button>
                                        <button
                                            onClick={() => updateField(activeField.id, { textCase: 'uppercase' })}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeField.textCase === 'uppercase' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-[var(--text-muted)] hover:bg-violet-600/10 hover:text-violet-400'}`}
                                            title="UPPERCASE"
                                        >
                                            <span className="text-[10px] font-black">AA</span>
                                        </button>
                                    </div>

                                    {/* Edit Text Block */}
                                    <div className="flex items-center gap-2 bg-[var(--bg-input)] px-3 py-1.5 rounded-xl border border-[var(--border-interactive)] transition-all hover:border-violet-500/50 group">
                                        <CaseSensitive size={16} className="text-violet-400 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                                        <input
                                            type="text"
                                            value={activeField.label}
                                            onChange={(e) => updateField(activeField.id, { label: e.target.value })}
                                            className="bg-transparent text-[var(--text-main)] text-xs font-bold focus:outline-none outline-none transition-all w-24"
                                            placeholder="Edit label..."
                                        />
                                    </div>
                                </div>
                            ) : <div className="flex-grow"></div>}

                            {qrConfig.isVisible && (
                                <div className="flex flex-wrap items-center gap-3 bg-violet-600/5 border border-violet-500/20 rounded-2xl px-3.5 py-2 animate-in zoom-in-95 duration-300">
                                    {/* QR Size Stepper */}
                                    <div className="flex items-center gap-2 pr-3 border-r border-violet-500/10">
                                        <QrCode size={14} className="text-violet-500" />
                                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Size</span>
                                        <button
                                            type="button"
                                            onClick={() => onQrConfigChange({ ...qrConfig, size: Math.max(40, qrConfig.size - 10) })}
                                            className="p-1 hover:bg-violet-600/10 rounded-lg text-violet-500 transition-colors"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="text-[10px] font-black text-violet-600 min-w-[30px] text-center">{qrConfig.size}px</span>
                                        <button
                                            type="button"
                                            onClick={() => onQrConfigChange({ ...qrConfig, size: Math.min(300, qrConfig.size + 10) })}
                                            className="p-1 hover:bg-violet-600/10 rounded-lg text-violet-500 transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    {/* QR Studio & Shapes Button */}
                                    <button
                                        type="button"
                                        onClick={() => setCustomizerOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black rounded-xl text-[9px] uppercase tracking-widest shadow-md shadow-violet-600/30 transition-all active:scale-95 mr-2"
                                    >
                                        <Wand2 size={12} />
                                        Shapes & Studio
                                    </button>

                                    {/* Color Theme Presets */}
                                    <div className="flex items-center gap-1.5 pr-3 border-r border-violet-500/10">
                                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mr-1">Presets</span>
                                        {[
                                            { name: 'Onyx', dark: '#000000', light: '#ffffff' },
                                            { name: 'Violet', dark: '#4f46e5', light: '#f5f3ff' },
                                            { name: 'Emerald', dark: '#047857', light: '#ecfdf5' },
                                            { name: 'Rose', dark: '#be123c', light: '#fff1f2' },
                                            { name: 'Amber', dark: '#b45309', light: '#fffbeb' },
                                            { name: 'Cyber', dark: '#06b6d4', light: '#0f172a' },
                                        ].map(preset => (
                                            <button
                                                key={preset.name}
                                                type="button"
                                                title={`${preset.name} Theme`}
                                                onClick={() => onQrConfigChange({ ...qrConfig, darkColor: preset.dark, lightColor: preset.light })}
                                                className="w-5 h-5 rounded-full border border-violet-500/30 flex items-center justify-center p-0.5 hover:scale-110 transition-transform shadow-sm"
                                                style={{ backgroundColor: preset.light }}
                                            >
                                                <div className="w-full h-full rounded-full" style={{ backgroundColor: preset.dark }} />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Pattern Style Picker */}
                                    <div className="flex items-center gap-1.5 pr-3 border-r border-violet-500/10">
                                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mr-1">Pattern</span>
                                        {[
                                            { id: 'square', label: '🔳 Square' },
                                            { id: 'dots', label: '🟣 Dots' },
                                            { id: 'rounded', label: '⏹️ Rounded' },
                                        ].map(style => (
                                            <button
                                                key={style.id}
                                                type="button"
                                                onClick={() => onQrConfigChange({ ...qrConfig, dotStyle: style.id })}
                                                className={`px-2 py-0.5 text-[9px] font-black rounded-lg transition-all ${ (qrConfig.dotStyle || 'square') === style.id ? 'bg-violet-600 text-white shadow-sm' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                                            >
                                                {style.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Frame Style Picker */}
                                    <div className="flex items-center gap-1.5 pr-3 border-r border-violet-500/10">
                                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mr-1">Frame</span>
                                        {[
                                            { id: 'card', label: '🎴 Card' },
                                            { id: 'bordered', label: '🖼️ Border' },
                                            { id: 'transparent', label: '✨ Glass' },
                                        ].map(frame => (
                                            <button
                                                key={frame.id}
                                                type="button"
                                                onClick={() => onQrConfigChange({ ...qrConfig, frameStyle: frame.id })}
                                                className={`px-2 py-0.5 text-[9px] font-black rounded-lg transition-all ${ (qrConfig.frameStyle || 'card') === frame.id ? 'bg-violet-600 text-white shadow-sm' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                                            >
                                                {frame.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom Color Pickers */}
                                    <div className="flex items-center gap-2 pr-3 border-r border-violet-500/10">
                                        <label className="flex items-center gap-1 cursor-pointer" title="QR Code Dark Module Color">
                                            <input
                                                type="color"
                                                value={qrConfig.darkColor || '#000000'}
                                                onChange={(e) => onQrConfigChange({ ...qrConfig, darkColor: e.target.value })}
                                                className="w-5 h-5 rounded-lg border border-violet-500/30 cursor-pointer bg-transparent"
                                            />
                                            <span className="text-[9px] font-mono text-slate-400">Dark</span>
                                        </label>
                                        <label className="flex items-center gap-1 cursor-pointer" title="QR Code Background Color">
                                            <input
                                                type="color"
                                                value={qrConfig.lightColor || '#ffffff'}
                                                onChange={(e) => onQrConfigChange({ ...qrConfig, lightColor: e.target.value })}
                                                className="w-5 h-5 rounded-lg border border-violet-500/30 cursor-pointer bg-transparent"
                                            />
                                            <span className="text-[9px] font-mono text-slate-400">BG</span>
                                        </label>
                                    </div>

                                    {/* Center Logo Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => onQrConfigChange({ ...qrConfig, showLogo: !(qrConfig.showLogo ?? true) })}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border transition-all ${qrConfig.showLogo ?? true
                                            ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-violet-500/30'
                                        }`}
                                    >
                                        <Sparkles size={12} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Org Badge</span>
                                    </button>

                                    {/* Serial ID Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => onQrConfigChange({ ...qrConfig, showManualId: !qrConfig.showManualId })}
                                        className={`flex items-center gap-2 px-3 py-1 rounded-xl border transition-all ${qrConfig.showManualId
                                            ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-violet-500/30'
                                        }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${qrConfig.showManualId ? 'bg-white' : 'bg-slate-500'} transition-colors`}></div>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Show Serial</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative overflow-auto pt-24 p-4 md:p-12 flex flex-col items-center bg-[var(--glass)] min-h-[45vh] md:min-h-[700px] transition-colors no-scrollbar shadow-inner" ref={containerRef}>
                    {imageUrl ? (
                        <div
                            className="relative mx-auto"
                            style={{
                                width: `${1000 * scale * zoom * 0.92}px`,
                                height: `${(1000 * (imageSize.height / (imageSize.width || 1))) * scale * zoom * 0.92}px`,
                            }}
                        >
                            <div
                                className={`relative shadow-[0_0_100px_rgba(0,0,0,0.1)] rounded-sm overflow-hidden border border-[var(--glass-border)] origin-top-left flex-shrink-0 ${isDragging ? '' : 'transition-all duration-500'}`}
                                style={{
                                    transform: `scale(${scale * zoom * 0.92})`,
                                    width: '1000px',
                                    height: `${1000 * (imageSize.height / (imageSize.width || 1))}px`,
                                    position: 'absolute',
                                    top: 0,
                                    left: 0
                                }}
                            >
                                <img
                                    ref={imageRef}
                                    src={imageUrl}
                                    alt="Certificate Template"
                                    className="w-full h-auto block select-none"
                                    onLoad={handleImageLoad}
                                    draggable={false}
                                />

                                {/* Guidelines */}
                                {guidelines.v && <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-violet-400 shadow-[0_0_15px_rgba(167,139,250,1)] z-0 pointer-events-none transition-opacity"></div>}
                                {guidelines.h && <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-violet-400 shadow-[0_0_15px_rgba(167,139,250,1)] z-0 pointer-events-none transition-opacity"></div>}

                                {fields.filter(f => f.isVisible).map(field => (
                                    <DraggableField
                                        key={field.id}
                                        field={field}
                                        visualSize={visualDimensions}
                                        isActive={field.id === activeFieldId}
                                        previewData={previewData}
                                        onStart={handleDragStart}
                                        onDrag={(data, boxSize) => handleDrag(field.id, data, boxSize)}
                                        onStop={handleDragStop}
                                        onActivate={() => onActiveFieldChange(field.id)}
                                        zoomScale={scale * zoom * 0.92}
                                    />
                                ))}

                                {qrConfig.isVisible && (
                                    <DraggableQR
                                        config={qrConfig}
                                        visualSize={visualDimensions}
                                        onStart={handleDragStart}
                                        onDrag={(data, boxSize) => handleDrag(null, data, boxSize, true)}
                                        onStop={handleDragStop}
                                        zoomScale={scale * zoom * 0.92}
                                        orgLogoUrl={orgLogoUrl}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500 h-80 w-full gap-4">
                            <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center animate-pulse">
                                <Eye size={32} className="text-slate-600" />
                            </div>
                            <p className="font-bold text-slate-600 tracking-tight">No template selected</p>
                        </div>
                    )}
                </div>

                <div className="glass p-3 md:p-4 px-8 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest hidden md:flex justify-between border-t border-[var(--glass-border)] transition-colors">
                    <span className="flex items-center gap-2">
                        <Sparkles size={12} className="text-violet-400" />
                        Resolution: {imageSize.width} x {imageSize.height}
                    </span>
                    <span className="flex items-center gap-2">
                        <QrCode size={12} className="text-violet-400" />
                        Security: UUID + SHA-256 Hashing Active
                    </span>
                </div>
            </div>
            <QRCustomizerModal
                isOpen={customizerOpen}
                onClose={() => setCustomizerOpen(false)}
                qrConfig={qrConfig}
                onQrConfigChange={onQrConfigChange}
            />
        </div>
    );
};

const DraggableQR = ({ config, visualSize, onStart, onDrag, onStop, zoomScale, orgLogoUrl }) => {
    const nodeRef = useRef(null);
    const canvasRef = useRef(null);
    const boxSize = { width: config.size || 80, height: config.size || 80 };
    const darkColor = config.darkColor || config.color || '#000000';
    const lightColor = config.lightColor || config.bgColor || '#ffffff';
    const dotStyle = config.dotStyle || 'square';
    const externalEye = config.externalEye || 'square';
    const internalEye = config.internalEye || 'square';
    const frameStyle = config.frameStyle || 'card';
    const logoUrl = config.logoUrl || orgLogoUrl;

    const pixelPos = {
        x: (config.x * visualSize.width) - (boxSize.width / 2),
        y: (config.y * visualSize.height) - (boxSize.height / 2)
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = 2; // HiDPI canvas for crisp preview
        const width = boxSize.width * dpr;
        const height = boxSize.height * dpr;
        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);

        const qrX = width / 2;
        const qrY = height / 2;
        const qrSize = width * 0.9;

        try {
            const qr = QRCode.create('https://pramanit.io/verify/sample', { errorCorrectionLevel: config.scannability || 'H' });
            const count = qr.modules.size;
            const cellSize = qrSize / count;

            ctx.save();

            // Background Card / Frame
            if (frameStyle === 'card' || frameStyle === 'bordered') {
                ctx.fillStyle = lightColor === 'transparent' ? '#ffffff' : lightColor;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(qrX - qrSize / 2 - 4, qrY - qrSize / 2 - 4, qrSize + 8, qrSize + 8, 10);
                else ctx.rect(qrX - qrSize / 2 - 4, qrY - qrSize / 2 - 4, qrSize + 8, qrSize + 8);
                ctx.fill();

                if (frameStyle === 'bordered') {
                    ctx.strokeStyle = darkColor;
                    ctx.lineWidth = Math.max(1.5, qrSize * 0.02);
                    ctx.stroke();
                }
            } else if (lightColor && lightColor !== 'transparent') {
                ctx.fillStyle = lightColor;
                ctx.fillRect(qrX - qrSize / 2, qrY - qrSize / 2, qrSize, qrSize);
            }

            const isFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= count - 7) || (r >= count - 7 && c < 7);
            const showLogo = (config.showLogo ?? true) && logoUrl;
            const centerStart = Math.floor(count * 0.36);
            const centerEnd = Math.ceil(count * 0.64);
            const isCenterLogo = (r, c) => showLogo && (r >= centerStart && r <= centerEnd && c >= centerStart && c <= centerEnd);

            // Draw Body Modules
            ctx.fillStyle = darkColor;
            for (let r = 0; r < count; r++) {
                for (let c = 0; c < count; c++) {
                    if (isFinder(r, c) || isCenterLogo(r, c)) continue;
                    if (!qr.modules.get(r, c)) continue;

                    const mx = (qrX - qrSize / 2) + (c * cellSize);
                    const my = (qrY - qrSize / 2) + (r * cellSize);

                    ctx.beginPath();
                    if (dotStyle === 'dots') {
                        ctx.arc(mx + cellSize / 2, my + cellSize / 2, cellSize * 0.42, 0, Math.PI * 2);
                    } else if (dotStyle === 'rounded') {
                        if (ctx.roundRect) ctx.roundRect(mx, my, cellSize, cellSize, cellSize * 0.38);
                        else ctx.rect(mx, my, cellSize, cellSize);
                    } else if (dotStyle === 'diamond') {
                        const cx = mx + cellSize / 2;
                        const cy = my + cellSize / 2;
                        const h = cellSize / 2;
                        ctx.moveTo(cx, cy - h);
                        ctx.lineTo(cx + h, cy);
                        ctx.lineTo(cx, cy + h);
                        ctx.lineTo(cx - h, cy);
                        ctx.closePath();
                    } else {
                        ctx.rect(mx, my, cellSize + 0.3, cellSize + 0.3);
                    }
                    ctx.fill();
                }
            }

            // Draw 3 Finder Eyes
            const drawEye = (ex, ey) => {
                const eyeSize = cellSize * 7;
                const borderSize = eyeSize * (1 / 7);
                const holeSize = eyeSize * (5 / 7);
                const innerSize = eyeSize * (3 / 7);

                // Outer Frame
                ctx.fillStyle = darkColor;
                ctx.beginPath();
                if (externalEye === 'circle') ctx.arc(ex + eyeSize / 2, ey + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
                else if (externalEye === 'rounded') {
                    if (ctx.roundRect) ctx.roundRect(ex, ey, eyeSize, eyeSize, eyeSize * 0.3);
                    else ctx.rect(ex, ey, eyeSize, eyeSize);
                } else if (externalEye === 'leaf') {
                    if (ctx.roundRect) ctx.roundRect(ex, ey, eyeSize, eyeSize, [eyeSize * 0.4, 0, eyeSize * 0.4, 0]);
                    else ctx.rect(ex, ey, eyeSize, eyeSize);
                } else ctx.rect(ex, ey, eyeSize, eyeSize);
                ctx.fill();

                // Cutout Hole
                ctx.fillStyle = lightColor === 'transparent' ? '#ffffff' : lightColor;
                const holeX = ex + borderSize;
                const holeY = ey + borderSize;
                ctx.beginPath();
                if (externalEye === 'circle') ctx.arc(ex + eyeSize / 2, ey + eyeSize / 2, holeSize / 2, 0, Math.PI * 2);
                else if (externalEye === 'rounded' || externalEye === 'leaf') {
                    if (ctx.roundRect) ctx.roundRect(holeX, holeY, holeSize, holeSize, holeSize * 0.25);
                    else ctx.rect(holeX, holeY, holeSize, holeSize);
                } else ctx.rect(holeX, holeY, holeSize, holeSize);
                ctx.fill();

                // Inner Dot
                ctx.fillStyle = darkColor;
                const dotX = ex + borderSize * 2;
                const dotY = ey + borderSize * 2;
                ctx.beginPath();
                if (internalEye === 'circle') ctx.arc(ex + eyeSize / 2, ey + eyeSize / 2, innerSize / 2, 0, Math.PI * 2);
                else if (internalEye === 'rounded') {
                    if (ctx.roundRect) ctx.roundRect(dotX, dotY, innerSize, innerSize, innerSize * 0.35);
                    else ctx.rect(dotX, dotY, innerSize, innerSize);
                } else if (internalEye === 'diamond') {
                    const cx = ex + eyeSize / 2;
                    const cy = ey + eyeSize / 2;
                    const r = innerSize / 2;
                    ctx.moveTo(cx, cy - r);
                    ctx.lineTo(cx + r, cy);
                    ctx.lineTo(cx, cy + r);
                    ctx.lineTo(cx - r, cy);
                    ctx.closePath();
                } else ctx.rect(dotX, dotY, innerSize, innerSize);
                ctx.fill();
            };

            const originX = qrX - qrSize / 2;
            const originY = qrY - qrSize / 2;
            drawEye(originX, originY);
            drawEye(originX + (count - 7) * cellSize, originY);
            drawEye(originX, originY + (count - 7) * cellSize);

            // Draw Center Logo Overlay
            if (showLogo) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const logoSize = qrSize * 0.28;
                    const lx = qrX - logoSize / 2;
                    const ly = qrY - logoSize / 2;
                    ctx.fillStyle = lightColor === 'transparent' ? '#ffffff' : lightColor;
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(lx - 3, ly - 3, logoSize + 6, logoSize + 6, 6);
                    else ctx.rect(lx - 3, ly - 3, logoSize + 6, logoSize + 6);
                    ctx.fill();
                    ctx.drawImage(img, lx, ly, logoSize, logoSize);
                };
                img.src = logoUrl;
            }

            ctx.restore();
        } catch (e) {
            console.error('Client QR Render Error:', e);
        }
    }, [config, logoUrl, boxSize.width, boxSize.height, darkColor, lightColor, dotStyle, externalEye, internalEye, frameStyle]);

    return (
        <Draggable
            position={pixelPos}
            scale={zoomScale}
            onStart={onStart}
            onDrag={(e, data) => {
                onDrag({
                    centerX: data.x + (boxSize.width / 2),
                    centerY: data.y + (boxSize.height / 2)
                }, boxSize);
            }}
            onStop={onStop}
            nodeRef={nodeRef}
        >
            <div
                ref={nodeRef}
                className="absolute top-0 left-0 cursor-move z-[60] group"
            >
                <div
                    className="flex flex-col items-center justify-center group-hover:scale-105 transition-all relative"
                    style={{
                        width: `${boxSize.width}px`,
                        height: `${boxSize.height}px`,
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full object-contain pointer-events-none drop-shadow-md rounded-xl"
                    />

                    {config.showManualId && (
                        <div className="absolute top-[105%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 pointer-events-none">
                            <p className="text-[6px] font-black text-slate-500 uppercase tracking-[.2em] whitespace-nowrap">Security Serial</p>
                            <p className="text-[7px] font-mono font-black text-violet-600 bg-white border border-violet-200 px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                                CERT-XXXX-XXXX
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Draggable>
    );
};

const DraggableField = ({ field, visualSize, isActive, previewData, onStart, onDrag, onStop, onActivate, zoomScale }) => {
    const nodeRef = useRef(null);
    const [boxSize, setBoxSize] = useState({ width: 0, height: 0 });

    // Measure the actual box size whenever content or styling changes
    useEffect(() => {
        if (nodeRef.current) {
            setBoxSize({
                width: nodeRef.current.offsetWidth,
                height: nodeRef.current.offsetHeight
            });
        }
    }, [field, previewData, visualSize]);

    // Calculate top-left based on stored center point
    const pixelPos = {
        x: (field.x * visualSize.width) - (boxSize.width / 2),
        y: (field.y * visualSize.height) - (boxSize.height / 2)
    };

    // Robust Data Lookup for Preview
    const getPreviewValue = () => {
        const recData = previewData?.data || previewData;
        if (!recData) return field.label;

        const fieldId = (field.id || '').trim().toLowerCase();

        // 1. Try exact match
        if (recData[field.id] !== undefined) return recData[field.id];

        // 2. Try case-insensitive matching
        const matchingKey = Object.keys(recData).find(k => k.trim().toLowerCase() === fieldId);
        if (matchingKey) return recData[matchingKey];

        return field.label;
    };

    const displayValue = getPreviewValue();
    const transformedValue = field.textCase === 'uppercase' ? displayValue.toString().toUpperCase() : displayValue;

    return (
        <Draggable
            position={pixelPos}
            scale={zoomScale}
            onStart={onStart}
            onDrag={(e, data) => {
                // Return the new center to the parent
                onDrag({
                    centerX: data.x + (boxSize.width / 2),
                    centerY: data.y + (boxSize.height / 2)
                }, boxSize);
            }}
            onStop={(e, data) => onStop && onStop(data)}
            nodeRef={nodeRef}
        >
            <div
                ref={nodeRef}
                className={`absolute top-0 left-0 cursor-move group ${isActive ? 'z-50' : 'z-10'} ${boxSize.width === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                onMouseDown={onActivate}
            >
                <div
                    className={`border-2 rounded px-3 py-1.5 whitespace-nowrap shadow-xl flex flex-col items-center ${isActive
                        ? 'border-violet-400 bg-violet-600/10 scale-105 ring-4 ring-violet-500/10'
                        : 'border-slate-500/50 bg-black/20 hover:border-violet-400/50'
                        } transition-colors duration-300`}
                    style={{
                        fontSize: `${field.fontSize}px`,
                        fontFamily: field.fontFamily,
                        color: field.color,
                        lineHeight: 1,
                        textTransform: field.textCase === 'uppercase' ? 'uppercase' : 'none',
                        fontStyle: field.isItalic ? 'italic' : 'normal',
                        textDecoration: field.isUnderline ? 'underline' : 'none',
                        fontWeight: field.isBold ? 'bold' : 'normal'
                    }}
                >
                    <span className="opacity-80">
                        {transformedValue}
                    </span>
                    {isActive && (
                        <div className="absolute -bottom-6 bg-violet-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-lg whitespace-nowrap">
                            Active
                        </div>
                    )}
                </div>
                {/* Precision Crosshair - Now represents the CENTER point visually */}
                <div className={`absolute top-1/2 left-1/2 w-4 h-0.5 -translate-x-1/2 -translate-y-1/2 ${isActive ? 'bg-violet-400' : 'bg-slate-400 opacity-20'}`}></div>
                <div className={`absolute top-1/2 left-1/2 w-0.5 h-4 -translate-x-1/2 -translate-y-1/2 ${isActive ? 'bg-violet-400' : 'bg-slate-400 opacity-20'}`}></div>
            </div>
        </Draggable>
    );
};

export default CertificatePreview;
