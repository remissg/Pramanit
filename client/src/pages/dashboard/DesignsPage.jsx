import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { Plus, LayoutTemplate, Edit, Copy, Trash2, Search, Check, Sparkles, Paintbrush, ArrowLeft, Award, Layers } from 'lucide-react';
import CertificateDesigner from '../../components/CertificateDesigner';
import axios from 'axios';
import corporateTemplate from '../../assets/corporate-template.png';
import creativeTemplate from '../../assets/creative-template.png';
import academicTemplate from '../../assets/academic-template.jpg';
import premiumTemplate from '../../assets/premium-template.png';

const DesignsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { designs, setDesigns, refetch, loading } = useOutletContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [isDesigning, setIsDesigning] = useState(false);
    const [initialTemplate, setInitialTemplate] = useState(null);

    // Baseline Preset Templates for Quick Creation
    const baselinePresets = [
        { title: 'Gold Seal Corporate', image: corporateTemplate, tag: 'Official' },
        { title: 'Academic Degree Diploma', image: academicTemplate, tag: 'University' },
        { title: 'Creative Award Layout', image: creativeTemplate, tag: 'Modern' },
        { title: 'Elite Honor Certificate', image: premiumTemplate, tag: 'Gold Embossed' }
    ];

    useEffect(() => {
        if (location.state?.templateImage) {
            setInitialTemplate(location.state.templateImage);
            setIsDesigning(true);
        }
    }, [location.state]);

    const handleClone = async (id) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/designs/${id}/clone`);
            refetch();
        } catch (err) {
            console.error('Failed to clone design', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this design template?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/designs/${id}`);
            setDesigns(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            console.error('Failed to delete design', err);
        }
    };

    const handleStartPreset = (img) => {
        setInitialTemplate(img);
        setIsDesigning(true);
    };

    const handleStartBlank = () => {
        setInitialTemplate(null);
        setIsDesigning(true);
    };

    const handleSaveDesign = (designData) => {
        setIsDesigning(false);
        setInitialTemplate(null);
        refetch();
    };

    const filteredDesigns = designs.filter(d =>
        (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            </div>
        );
    }

    // Active Visual Certificate Designer Canvas Studio Mode
    if (isDesigning) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between bg-[var(--bg-card)] p-4 px-6 rounded-2xl border border-[var(--border-muted)] shadow-md">
                    <button
                        onClick={() => {
                            setIsDesigning(false);
                            setInitialTemplate(null);
                        }}
                        className="flex items-center gap-2 text-xs font-black uppercase text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                        <ArrowLeft size={16} /> Exit Studio Canvas
                    </button>

                    <div className="flex items-center gap-2 text-xs font-black text-rose-400">
                        <Paintbrush size={16} /> Certificate Design Studio Active
                    </div>
                </div>

                <CertificateDesigner
                    initialTemplate={initialTemplate}
                    onSave={handleSaveDesign}
                    onCancel={() => {
                        setIsDesigning(false);
                        setInitialTemplate(null);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Top Creator Header Banner */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[var(--bg-card)] rounded-[2.5rem] p-6 sm:p-8 border border-[var(--border-muted)] shadow-xl overflow-hidden">
                <div className="space-y-1 flex-1 min-w-0">
                    <span className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
                        <Sparkles size={16} /> Certificate Design Creator & Studio
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] tracking-tight">
                        Design Studio Library ({designs.length})
                    </h2>
                    <p className="text-xs font-semibold text-[var(--text-muted)]">
                        Create custom certificate blueprints from scratch or customize accredited institutional templates.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={handleStartBlank}
                        className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Plus size={18} /> Create Blank Design
                    </button>
                </div>
            </div>

            {/* Baseline Templates Carousel Bar */}
            <div className="bg-[var(--bg-card)] rounded-[2rem] p-6 border border-[var(--border-muted)] space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-heading)] flex items-center gap-2">
                        <Award size={16} className="text-amber-400" /> Start from Accredited Baseline Canvas
                    </h3>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">1-Click Customize</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {baselinePresets.map((preset, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleStartPreset(preset.image)}
                            className="group relative bg-[var(--bg-input)] rounded-2xl overflow-hidden border border-[var(--border-interactive)] hover:border-rose-500/50 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-sm flex flex-col justify-between"
                        >
                            <div className="aspect-[4/3] overflow-hidden relative">
                                <img src={preset.image} alt={preset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/80 rounded-md text-[9px] font-black text-amber-400 uppercase tracking-wider">
                                    {preset.tag}
                                </div>
                            </div>
                            <div className="p-2.5 bg-slate-950/40 text-center">
                                <p className="text-[11px] font-black text-[var(--text-heading)] truncate">{preset.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search Filter Bar */}
            {designs.length > 0 && (
                <div className="flex items-center justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                        <input
                            type="text"
                            placeholder="Search your designs by title or serial ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-2xl pl-12 pr-4 py-3 text-xs font-bold text-[var(--text-main)] outline-none focus:border-rose-500 transition-all placeholder:text-[var(--text-muted)]"
                        />
                    </div>
                </div>
            )}

            {/* Custom Saved Designs Grid */}
            {filteredDesigns.length === 0 ? (
                <div className="text-center py-16 bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-muted)] shadow-xl space-y-4">
                    <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
                        <LayoutTemplate size={32} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-heading)]">No Saved Design Blueprints</h3>
                    <p className="text-xs font-semibold text-[var(--text-muted)] max-w-sm mx-auto">
                        Create custom certificate designs using our drag & drop Studio Creator or start from baseline canvases above.
                    </p>
                    <button
                        onClick={handleStartBlank}
                        className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                    >
                        <Paintbrush size={16} /> Open Canvas Studio
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredDesigns.map((item) => (
                        <div key={item.id} className="group bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-muted)] overflow-hidden hover:shadow-2xl hover:border-rose-500/30 transition-all duration-300 flex flex-col shadow-md">
                            <div className="aspect-video bg-slate-900 relative overflow-hidden">
                                {item.preview_url ? (
                                    <img
                                        src={item.preview_url}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                        <LayoutTemplate className="text-slate-600" size={32} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                    <button
                                        onClick={() => handleStartBlank()}
                                        className="p-3 bg-white text-slate-900 rounded-xl hover:scale-110 active:scale-95 transition-transform shadow-lg"
                                        title="Edit Design in Studio"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleClone(item.id)}
                                        className="p-3 bg-emerald-500 text-white rounded-xl hover:scale-110 active:scale-95 transition-transform shadow-lg"
                                        title="Clone Design"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-3 bg-rose-500 text-white rounded-xl hover:scale-110 active:scale-95 transition-transform shadow-lg"
                                        title="Delete Design"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-5 border-t border-[var(--border-muted)]">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-sm text-[var(--text-heading)] truncate pr-2">{item.name}</h3>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(item.id);
                                            setCopiedId(item.id);
                                            setTimeout(() => setCopiedId(null), 2000);
                                        }}
                                        className="shrink-0 flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-input)] hover:bg-rose-600 hover:text-white text-[var(--text-muted)] rounded-lg text-[10px] font-mono border border-[var(--border-muted)] transition-all"
                                    >
                                        {copiedId === item.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                        {copiedId === item.id ? 'Copied' : 'ID'}
                                    </button>
                                </div>
                                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                    Created: {new Date(item.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DesignsPage;
