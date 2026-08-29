import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, Radio, Zap, Save, CheckCircle2, Loader, Server, AlertTriangle, DollarSign, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const AdminSettingsPage = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const [settings, setSettings] = useState({
        maintenance_mode: false,
        announcement_banner: 'Pramanit Verifiable Credential Engine Active',
        enforce_tier_limits: false,
        free_cert_limit: 50,
        pro_cert_limit: 10000,
        pro_monthly_price: 1499,
        pro_annual_price: 14990,
        currency_symbol: '₹',
        free_features: [
            '50 Certificates / Month',
            'Standard QR Verification Badge',
            'CSV Bulk Certificate Issue',
            'Basic Email Templates'
        ],
        pro_features: [
            '10,000 Certificates / Month',
            'Custom Institutional Logo & Watermarks',
            'Custom Subdomain & QR Branding',
            'Dedicated Custom SMTP Email Relay',
            'Batch ZIP Download & Analytics',
            '24/7 Priority Support & SLA'
        ],
        fallback_smtp_host: 'smtp.gmail.com',
        fallback_smtp_port: 587
    });

    const [newFreeFeature, setNewFreeFeature] = useState('');
    const [newProFeature, setNewProFeature] = useState('');

    useEffect(() => {
        fetchSettings();
    }, [token]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                setSettings(prev => ({ ...prev, ...res.data }));
            }
        } catch (err) {
            console.error('Failed to fetch admin settings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg('');
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/settings`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettings(prev => ({ ...prev, ...(res.data.settings || {}) }));
            setSuccessMsg('Platform pricing and system settings saved successfully!');
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            console.error('Failed to save admin settings', err);
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const addFeature = (tier) => {
        if (tier === 'free' && newFreeFeature.trim()) {
            setSettings(prev => ({ ...prev, free_features: [...prev.free_features, newFreeFeature.trim()] }));
            setNewFreeFeature('');
        } else if (tier === 'pro' && newProFeature.trim()) {
            setSettings(prev => ({ ...prev, pro_features: [...prev.pro_features, newProFeature.trim()] }));
            setNewProFeature('');
        }
    };

    const removeFeature = (tier, index) => {
        if (tier === 'free') {
            setSettings(prev => ({ ...prev, free_features: prev.free_features.filter((_, i) => i !== index) }));
        } else {
            setSettings(prev => ({ ...prev, pro_features: prev.pro_features.filter((_, i) => i !== index) }));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader className="text-rose-500 animate-spin" size={40} />
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">Global Tier & System Settings</h2>
                    <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                        Configure PRO subscription pricing, tier quotas, feature checklists, and platform maintenance mode.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                    Save Tier Settings
                </button>
            </div>

            {/* Success Feedback Alert */}
            {successMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-bold animate-in fade-in">
                    <CheckCircle2 size={18} />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* 1. Pricing & Currency Section */}
            <div className="bg-[var(--bg-card)] rounded-[2rem] p-6 border border-[var(--border-muted)] space-y-4 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[var(--text-heading)]">Subscription Pricing & Currency</h3>
                        <p className="text-[11px] text-[var(--text-muted)] font-medium">Set the PRO plan monthly and annual subscription rates</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider block mb-1">Currency Symbol</label>
                        <select
                            value={settings.currency_symbol}
                            onChange={(e) => setSettings(prev => ({ ...prev, currency_symbol: e.target.value }))}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2.5 px-3 text-xs font-bold text-[var(--text-main)] outline-none focus:border-rose-500"
                        >
                            <option value="₹">₹ (INR)</option>
                            <option value="$">$ (USD)</option>
                            <option value="€">€ (EUR)</option>
                            <option value="£">£ (GBP)</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider block mb-1">PRO Monthly Rate</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-[var(--text-muted)]">{settings.currency_symbol}</span>
                            <input
                                type="number"
                                value={settings.pro_monthly_price}
                                onChange={(e) => setSettings(prev => ({ ...prev, pro_monthly_price: Number(e.target.value) }))}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2.5 pl-8 pr-3 text-xs font-bold text-[var(--text-main)] outline-none focus:border-rose-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider block mb-1">PRO Annual Rate (Yearly)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-[var(--text-muted)]">{settings.currency_symbol}</span>
                            <input
                                type="number"
                                value={settings.pro_annual_price}
                                onChange={(e) => setSettings(prev => ({ ...prev, pro_annual_price: Number(e.target.value) }))}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2.5 pl-8 pr-3 text-xs font-bold text-[var(--text-main)] outline-none focus:border-rose-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Tier Limits Enforcement & Quotas */}
            <div className="bg-[var(--bg-card)] rounded-[2rem] p-6 border border-[var(--border-muted)] space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-[var(--text-heading)]">Tier Quota Enforcement</h3>
                            <p className="text-[11px] text-[var(--text-muted)] font-medium">Toggle limit checks ON or OFF for testing</p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, enforce_tier_limits: !prev.enforce_tier_limits }))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.enforce_tier_limits ? 'bg-violet-600' : 'bg-slate-700'}`}
                    >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${settings.enforce_tier_limits ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                </div>

                {!settings.enforce_tier_limits ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] font-bold text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 size={14} className="shrink-0" />
                        <span>UNLIMITED TESTING MODE: Monthly certificate quotas are currently disabled so development testing is never stopped.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider block mb-1">Free Tier Monthly Limit</label>
                            <input
                                type="number"
                                value={settings.free_cert_limit}
                                onChange={(e) => setSettings(prev => ({ ...prev, free_cert_limit: Number(e.target.value) }))}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2 px-3 text-xs font-bold text-[var(--text-main)] outline-none focus:border-rose-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider block mb-1">PRO Tier Monthly Limit</label>
                            <input
                                type="number"
                                value={settings.pro_cert_limit}
                                onChange={(e) => setSettings(prev => ({ ...prev, pro_cert_limit: Number(e.target.value) }))}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2 px-3 text-xs font-bold text-[var(--text-main)] outline-none focus:border-rose-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Feature Lists Editor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Free Features */}
                <div className="bg-[var(--bg-card)] rounded-[2rem] p-6 border border-[var(--border-muted)] space-y-3 shadow-md">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-heading)]">Free Plan Included Features</h3>
                    <div className="space-y-2">
                        {settings.free_features.map((feat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-[var(--border-muted)] text-xs font-semibold text-[var(--text-main)]">
                                <span>{feat}</span>
                                <button type="button" onClick={() => removeFeature('free', idx)} className="text-rose-400 hover:text-rose-300">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <input
                            type="text"
                            placeholder="Add new Free feature..."
                            value={newFreeFeature}
                            onChange={(e) => setNewFreeFeature(e.target.value)}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2 px-3 text-xs font-medium text-[var(--text-main)] outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => addFeature('free')}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1"
                        >
                            <Plus size={14} /> Add
                        </button>
                    </div>
                </div>

                {/* Pro Features */}
                <div className="bg-[var(--bg-card)] rounded-[2rem] p-6 border border-[var(--border-muted)] space-y-3 shadow-md">
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">PRO Plan Premium Features</h3>
                    <div className="space-y-2">
                        {settings.pro_features.map((feat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-[var(--border-muted)] text-xs font-semibold text-[var(--text-main)]">
                                <span>{feat}</span>
                                <button type="button" onClick={() => removeFeature('pro', idx)} className="text-rose-400 hover:text-rose-300">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <input
                            type="text"
                            placeholder="Add new PRO feature..."
                            value={newProFeature}
                            onChange={(e) => setNewProFeature(e.target.value)}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2 px-3 text-xs font-medium text-[var(--text-main)] outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => addFeature('pro')}
                            className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1"
                        >
                            <Plus size={14} /> Add
                        </button>
                    </div>
                </div>

            </div>

            {/* 4. Maintenance & Announcement Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Maintenance Mode */}
                <div className="bg-[var(--bg-card)] rounded-[2rem] p-6 border border-[var(--border-muted)] space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-[var(--text-heading)]">Maintenance Mode</h3>
                                <p className="text-[11px] text-[var(--text-muted)] font-medium">Pause certificate generation during upgrades</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, maintenance_mode: !prev.maintenance_mode }))}
                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenance_mode ? 'bg-amber-500' : 'bg-slate-700'}`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${settings.maintenance_mode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                </div>

                {/* Broadcast Banner */}
                <div className="bg-[var(--bg-card)] rounded-[2rem] p-6 border border-[var(--border-muted)] space-y-3 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                            <Radio size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-[var(--text-heading)]">Broadcast Banner</h3>
                            <p className="text-[11px] text-[var(--text-muted)] font-medium">Message visible at top of issuer screens</p>
                        </div>
                    </div>

                    <input
                        type="text"
                        placeholder="e.g. Platform Upgrade Active..."
                        value={settings.announcement_banner}
                        onChange={(e) => setSettings(prev => ({ ...prev, announcement_banner: e.target.value }))}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-2 px-3 text-xs font-bold text-[var(--text-main)] outline-none"
                    />
                </div>

            </div>
        </form>
    );
};

export default AdminSettingsPage;
