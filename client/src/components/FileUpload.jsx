import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, Image as ImageIcon, X, PenTool, LayoutTemplate, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import CertificateDesigner from './CertificateDesigner';

const FileUpload = ({ onFilesSelected, files, onlyTemplate = false }) => {
    const navigate = useNavigate();
    const [isDesigning, setIsDesigning] = useState(false);
    const [savedDesigns, setSavedDesigns] = useState([]);
    const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoadingDesigns(true);
            axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/designs`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => {
                setSavedDesigns(res.data || []);
                setIsLoadingDesigns(false);
            })
            .catch(err => {
                console.error("Failed to load saved design templates:", err);
                setIsLoadingDesigns(false);
            });
        }
    }, []);

    const selectSavedDesign = async (design) => {
        try {
            let file;
            if (design.preview_url && design.preview_url.startsWith('http')) {
                const res = await fetch(design.preview_url);
                const blob = await res.blob();
                file = new File([blob], `${design.name || 'Saved_Design'}.png`, { type: 'image/png' });
            } else {
                file = new File(["saved_template"], `${design.name || 'Saved_Design'}.png`, { type: 'image/png' });
            }
            const newFiles = { ...files, template: file, designId: design.id, designJson: design.design_json };
            onFilesSelected(newFiles);
        } catch (err) {
            console.error("Failed to select saved design:", err);
            const fallbackFile = new File(["saved_template"], `${design.name || 'Saved_Design'}.png`, { type: 'image/png' });
            onFilesSelected({ ...files, template: fallbackFile, designId: design.id, designJson: design.design_json });
        }
    };

    const onDrop = useCallback((acceptedFiles) => {
        // Separate files based on type
        const newFiles = { ...files };

        acceptedFiles.forEach(file => {
            if (file.type.startsWith('image/')) {
                newFiles.template = file;
            } else if (
                !onlyTemplate && (
                    file.type.includes('csv') ||
                    file.type.includes('sheet') ||
                    file.type.includes('excel') ||
                    file.type.includes('vnd.ms-excel') ||
                    file.name.endsWith('.csv') ||
                    file.name.endsWith('.xlsx') ||
                    file.name.endsWith('.xls')
                )
            ) {
                newFiles.data = file;
            }
        });

        onFilesSelected(newFiles);
    }, [files, onFilesSelected, onlyTemplate]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: onlyTemplate ? { 'image/*': ['.png', '.jpg', '.jpeg'] } : {
            'image/*': ['.png', '.jpg', '.jpeg'],
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        }
    });

    const removeFile = (type) => {
        const newFiles = { ...files };
        newFiles[type] = null;
        onFilesSelected(newFiles);
    };

    const handleDesignSave = (file) => {
        const newFiles = { ...files, template: file };
        onFilesSelected(newFiles);
        setIsDesigning(false);
    };

    if (isDesigning) {
        return <CertificateDesigner onSave={handleDesignSave} onCancel={() => setIsDesigning(false)} />;
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Saved Design Templates Picker */}
            {!files.template && savedDesigns.length > 0 && (
                <div className="space-y-3 bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-muted)] shadow-md animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[var(--text-heading)] font-black text-xs uppercase tracking-wider">
                            <LayoutTemplate size={16} className="text-violet-500" />
                            <span>Select Saved Certificate Template</span>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard/designs')}
                            className="text-[10px] font-bold text-violet-400 hover:underline"
                        >
                            View Library ({savedDesigns.length})
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {savedDesigns.slice(0, 6).map((design) => (
                            <div
                                key={design.id}
                                onClick={() => selectSavedDesign(design)}
                                className="group relative border border-[var(--border-muted)] rounded-xl overflow-hidden cursor-pointer hover:border-violet-500 transition-all bg-[var(--bg-input)] hover:shadow-lg hover:shadow-violet-500/10 p-2 space-y-2"
                            >
                                <div className="aspect-[4/3] bg-slate-900/50 rounded-lg overflow-hidden flex items-center justify-center relative">
                                    {design.preview_url ? (
                                        <img src={design.preview_url} alt={design.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                        <div className="text-slate-400 font-bold text-xs flex items-center gap-1">
                                            <ImageIcon size={24} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/30 transition-colors flex items-center justify-center">
                                        <span className="opacity-0 group-hover:opacity-100 bg-violet-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md transition-opacity flex items-center gap-1">
                                            <Check size={12} /> Select
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-[var(--text-main)] truncate text-center">{design.name || 'Untitled Design'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div
                {...getRootProps()}
                className={`
          relative border-2 border-dashed rounded-2xl p-10 transition-all duration-300 cursor-pointer text-center
          ${isDragActive ? 'border-violet-500 bg-violet-50' : 'border-gray-300 hover:border-violet-400 hover:bg-gray-50'}
        `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-4">
                    <div className={`p-4 rounded-full ${isDragActive ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Upload size={32} />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-gray-700">
                            {isDragActive ? "Drop files here..." : "Drag & drop your files here"}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            {onlyTemplate ? 'Upload Certificate Template (PNG/JPG)' : 'Upload Certificate Template (PNG/JPG) & Recipient List (CSV/Excel)'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {files.template && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="p-2 bg-pink-100 text-pink-500 rounded-lg">
                                <ImageIcon size={20} />
                            </div>
                            <div className="truncate">
                                <p className="text-sm font-medium text-gray-700 truncate">{files.template.name}</p>
                                <p className="text-xs text-gray-400">{(files.template.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); removeFile('template'); }}
                            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                )}

                {files.data && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="p-2 bg-emerald-100 text-emerald-500 rounded-lg">
                                <FileSpreadsheet size={20} />
                            </div>
                            <div className="truncate">
                                <p className="text-sm font-medium text-gray-700 truncate">{files.data.name}</p>
                                <p className="text-xs text-gray-400">{(files.data.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); removeFile('data'); }}
                            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
