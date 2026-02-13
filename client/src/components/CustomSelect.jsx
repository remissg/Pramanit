import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ value, onChange, options, icon: Icon, placeholder = "Select...", className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 bg-[var(--bg-input)] px-4 py-3 rounded-2xl border transition-all w-full group overflow-hidden ${isOpen ? 'border-[var(--primary)] shadow-[0_0_20px_rgba(139,92,246,0.2)]' : 'border-[var(--border-interactive)] hover:border-[var(--primary)] shadow-sm'
                    }`}
            >
                {Icon && <Icon size={16} className={`shrink-0 transition-all ${isOpen ? 'text-[var(--primary)] opacity-100' : 'text-violet-400 opacity-60 group-hover:opacity-100'}`} />}
                <span className="text-[var(--text-main)] text-sm font-black truncate flex-grow text-left tracking-tight transition-colors">
                    {selectedOption?.name || placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-[var(--text-muted)] transition-transform duration-500 shrink-0 ${isOpen ? 'rotate-180 text-[var(--primary)]' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-[var(--bg-main)]/95 backdrop-blur-3xl border border-[var(--glass-border)] rounded-[24px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] z-[200] py-3 animate-in fade-in zoom-in-95 duration-300 ring-1 ring-white/10">
                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center justify-between w-full px-5 py-3 text-sm font-bold transition-all hover:bg-violet-500/10 group relative ${value === option.value ? 'text-[var(--primary)] bg-violet-600/5' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                    }`}
                            >
                                <span
                                    className="relative z-10 transition-transform group-hover:translate-x-1 duration-300"
                                    style={{ fontFamily: option.value.includes('"') || (option.value !== option.name && !option.value.startsWith('#')) ? option.value : 'inherit' }}
                                >
                                    {option.name}
                                </span>
                                {value === option.value && (
                                    <div className="flex items-center gap-2 relative z-10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                                        <Check size={16} className="text-[var(--primary)]" />
                                    </div>
                                )}
                                {value === option.value && (
                                    <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary)] rounded-r-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
