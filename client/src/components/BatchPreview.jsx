import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check, LayoutGrid, Square } from 'lucide-react';

const BatchPreview = ({ previews, onClose, onConfirm, selectedIndices = [], onToggleSelection }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewMode, setViewMode] = useState('carousel'); // 'carousel' or 'grid'

    const next = () => setCurrentIndex((prev) => (prev + 1) % previews.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + previews.length) % previews.length);

    if (!previews || previews.length === 0) return null;

    const isAllSelected = selectedIndices.length === previews.length;
    const isNoneSelected = selectedIndices.length === 0;

    const toggleAll = () => {
        if (isAllSelected) {
            onToggleSelection([]);
        } else {
            onToggleSelection(previews.map((_, i) => i));
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-6">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Batch Preview Gallery</h3>
                            <p className="text-sm text-slate-500 font-medium">Reviewing {previews.length} generated samples</p>
                        </div>

                        <button
                            onClick={toggleAll}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isAllSelected ? 'bg-violet-600 text-white border-violet-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-violet-300'}`}
                        >
                            {isAllSelected ? <Check size={14} /> : <Square size={14} />}
                            {isAllSelected ? 'All Selected' : 'Select All'}
                        </button>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                        <button
                            onClick={() => setViewMode('carousel')}
                            className={`p-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all ${viewMode === 'carousel' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Square size={16} /> Slideshow
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all ${viewMode === 'grid' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutGrid size={16} /> Gallery
                        </button>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
                    {viewMode === 'carousel' ? (
                        <div className="h-full flex items-center justify-center relative">
                            <button onClick={prev} className="absolute left-0 p-3 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl shadow-xl transition-all hover:scale-110 z-10 border border-slate-100">
                                <ChevronLeft size={28} />
                            </button>

                            <div className="max-w-3xl w-full">
                                <div className="bg-white p-2 rounded-2xl shadow-2xl border border-slate-100 overflow-hidden group relative">
                                    <div className="absolute top-4 left-4 z-20">
                                        <button
                                            onClick={() => onToggleSelection(
                                                selectedIndices.includes(currentIndex)
                                                    ? selectedIndices.filter(i => i !== currentIndex)
                                                    : [...selectedIndices, currentIndex]
                                            )}
                                            className={`p-3 rounded-2xl shadow-2xl transition-all active:scale-95 border-2 ${selectedIndices.includes(currentIndex) ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/80 backdrop-blur-md border-white text-slate-400 opacity-60 hover:opacity-100'}`}
                                        >
                                            <Check size={24} className={selectedIndices.includes(currentIndex) ? 'stroke-[3]' : 'opacity-0'} />
                                            {!selectedIndices.includes(currentIndex) && <Square size={24} className="absolute inset-0 m-auto" />}
                                        </button>
                                    </div>
                                    <img
                                        src={previews[currentIndex].image}
                                        alt={`Preview for ${previews[currentIndex].name}`}
                                        className={`w-full h-auto object-contain rounded-xl transition-opacity duration-300 ${selectedIndices.includes(currentIndex) ? 'opacity-100' : 'opacity-40 grayscale-[0.5]'}`}
                                    />
                                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                        <p className="text-lg font-bold text-center drop-shadow-md">{previews[currentIndex].name}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-center gap-1.5 flex-wrap">
                                    {previews.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-8 bg-violet-600' : selectedIndices.includes(idx) ? 'w-2 bg-violet-300' : 'w-2 bg-slate-200'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button onClick={next} className="absolute right-0 p-3 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl shadow-xl transition-all hover:scale-110 z-10 border border-slate-100">
                                <ChevronRight size={28} />
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
                            {previews.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all cursor-pointer group relative ${selectedIndices.includes(idx) ? 'border-violet-500 shadow-xl ring-2 ring-violet-500/10' : 'border-slate-200 hover:shadow-lg'}`}
                                    onClick={() => onToggleSelection(
                                        selectedIndices.includes(idx)
                                            ? selectedIndices.filter(i => i !== idx)
                                            : [...selectedIndices, idx]
                                    )}
                                >
                                    <div className="absolute top-3 left-3 z-10">
                                        <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${selectedIndices.includes(idx) ? 'bg-violet-600 border-violet-500 text-white shadow-lg' : 'bg-white/80 backdrop-blur-md border-white text-slate-300'}`}>
                                            {selectedIndices.includes(idx) ? <Check size={18} className="stroke-[3]" /> : <Square size={18} />}
                                        </div>
                                    </div>
                                    <div className="aspect-[4/3] bg-slate-100 relative">
                                        <img src={item.image} alt={item.name} className={`w-full h-full object-cover transition-all duration-300 ${selectedIndices.includes(idx) ? 'opacity-100' : 'opacity-40 grayscale-[0.5]'}`} />
                                        <div className="absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/5 transition-colors flex items-center justify-center">
                                            <div
                                                className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all border border-white"
                                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); setViewMode('carousel'); }}
                                            >
                                                <LayoutGrid size={24} className="text-violet-600" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white border-t border-slate-50">
                                        <p className={`font-bold text-sm truncate transition-colors ${selectedIndices.includes(idx) ? 'text-violet-700' : 'text-slate-800'}`}>
                                            {item.name}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 bg-white flex justify-end items-center gap-6">
                    <p className="text-sm text-slate-500 mr-auto font-medium hidden sm:block">
                        {isNoneSelected ? 'Please select at least one recipient' : `${selectedIndices.length} of ${previews.length} selected for generation`}
                    </p>
                    <button onClick={onClose} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all active:scale-95">
                        Back to Edit
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isNoneSelected}
                        className={`flex items-center gap-2 px-10 py-3 font-bold rounded-2xl shadow-xl transition-all active:scale-95 ${isNoneSelected ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-200 hover:-translate-y-0.5'}`}
                    >
                        <Check size={22} className="stroke-[3]" /> Launch Batch ({selectedIndices.length})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BatchPreview;
