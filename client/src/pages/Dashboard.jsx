import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, LayoutTemplate, Search, Loader, Mail, ChevronRight, X, Save } from 'lucide-react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Dashboard = ({ theme, setTheme }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('designs'); // 'designs' | 'email-templates'
    const [designs, setDesigns] = useState([]);
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State for Email Templates
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [templateForm, setTemplateForm] = useState({ name: '', subject: '', bodyHtml: '', isDefault: false });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'designs') {
                const res = await axios.get('http://localhost:5000/api/designs');
                setDesigns(res.data);
            } else {
                const res = await axios.get('http://localhost:5000/api/email-templates');
                setEmailTemplates(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm(`Are you sure you want to delete this ${type === 'designs' ? 'design' : 'template'}?`)) return;
        try {
            await axios.delete(`http://localhost:5000/api/${type}/${id}`);
            if (type === 'designs') {
                setDesigns(designs.filter(d => d.id !== id));
            } else {
                setEmailTemplates(emailTemplates.filter(t => t.id !== id));
            }
        } catch (err) {
            console.error('Failed to delete item', err);
        }
    };

    const handleSaveTemplate = async () => {
        if (!templateForm.name || !templateForm.subject || !templateForm.bodyHtml) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            // Since we don't have an update endpoint yet, we'll just handlecreate for now
            // Or if editing, maybe we should add update endpoint later properly.
            // For MVP, if editing, we might need to delete old and create new or implement PUT
            // Let's assume Create only for now or user deletes and recreates
            // Wait, "Allow senders to save their own Custom Templates... B. The Template Editor"

            if (editingTemplate) {
                alert('Update functionality coming soon. For now please create a new template.');
                return;
            }

            const res = await axios.post('http://localhost:5000/api/email-templates', templateForm);
            setEmailTemplates([res.data, ...emailTemplates]);
            setShowTemplateModal(false);
            setTemplateForm({ name: '', subject: '', bodyHtml: '', isDefault: false });
        } catch (err) {
            console.error('Failed to save template', err);
            alert('Failed to save template');
        }
    };

    const openTemplateModal = (template = null) => {
        if (template) {
            // Fetch full details if needed, but for list we might not have body
            // Actually getTemplates returns id, name, subject, is_default
            // We need to fetch body content
            axios.get(`http://localhost:5000/api/email-templates/${template.id}`).then(res => {
                setEditingTemplate(res.data);
                setTemplateForm({
                    name: res.data.name,
                    subject: res.data.subject,
                    bodyHtml: res.data.body_html,
                    isDefault: res.data.is_default
                });
                setShowTemplateModal(true);
            });
        } else {
            setEditingTemplate(null);
            setTemplateForm({ name: '', subject: '', bodyHtml: '', isDefault: false });
            setShowTemplateModal(true);
        }
    };

    const filteredItems = activeTab === 'designs'
        ? designs.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : emailTemplates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen bg-[var(--bg-main)] font-sans text-[var(--text-main)] transition-colors duration-500">
            <Header theme={theme} setTheme={setTheme} onGetStarted={() => window.location.href = '/'} />

            <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div>
                        <h1 className="text-4xl font-black text-[var(--text-heading)] tracking-tight mb-2">My Workspace</h1>
                        <p className="text-[var(--text-muted)] font-medium">Manage your designs and email templates.</p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative group flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-violet-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab === 'designs' ? 'designs' : 'templates'}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[var(--bg-input)] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-[var(--text-main)] outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium"
                            />
                        </div>
                        <button
                            onClick={() => activeTab === 'designs' ? window.location.href = '/' : openTemplateModal()}
                            className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-violet-600/20 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus size={18} />
                            New {activeTab === 'designs' ? 'Design' : 'Template'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-[var(--bg-card)] p-1 rounded-2xl border border-[var(--border-muted)] mb-10 w-fit">
                    <button
                        onClick={() => setActiveTab('designs')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'designs' ? 'bg-violet-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                        Designs
                    </button>
                    <button
                        onClick={() => setActiveTab('email-templates')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'email-templates' ? 'bg-violet-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                        Email Templates
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader className="text-violet-500 animate-spin" size={32} />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20 bg-[var(--glass)] rounded-[2.5rem] border border-[var(--glass-border)] animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            {activeTab === 'designs' ? <LayoutTemplate className="text-violet-400" size={32} /> : <Mail className="text-violet-400" size={32} />}
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-heading)] mb-2">No {activeTab.replace('-', ' ')} found</h3>
                        <p className="text-[var(--text-muted)] mb-8 max-w-sm mx-auto">It looks empty here. Start by creating your first {activeTab === 'designs' ? 'certificate design' : 'email template'}.</p>
                        <button
                            onClick={() => activeTab === 'designs' ? window.location.href = '/' : openTemplateModal()}
                            className="text-violet-400 hover:text-violet-300 font-bold underline underline-offset-4 transition-colors"
                        >
                            Create New
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredItems.map((item) => (
                            <div key={item.id} className="group bg-[var(--bg-card)] rounded-3xl border border-[var(--border-muted)] overflow-hidden hover:shadow-2xl hover:shadow-violet-900/10 hover:border-violet-500/30 transition-all duration-300 flex flex-col">
                                {activeTab === 'designs' ? (
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
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                            <button
                                                onClick={() => navigate('/', { state: { loadDesign: item } })}
                                                className="p-3 bg-white text-slate-900 rounded-xl hover:scale-110 active:scale-95 transition-transform shadow-lg"
                                                title="Edit Design"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id, 'designs')}
                                                className="p-3 bg-red-500 text-white rounded-xl hover:scale-110 active:scale-95 transition-transform shadow-lg"
                                                title="Delete Design"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // Email Template Card
                                    <div className="p-6 flex-1 flex flex-col relative">
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <button
                                                onClick={() => openTemplateModal(item)}
                                                className="p-2 bg-[var(--bg-input)] hover:bg-violet-500 hover:text-white rounded-lg transition-colors border border-[var(--border-muted)]"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id, 'email-templates')}
                                                className="p-2 bg-[var(--bg-input)] hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-[var(--border-muted)]"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
                                            <Mail className="text-violet-500" size={20} />
                                        </div>
                                        <h3 className="font-excep font-black text-lg text-[var(--text-heading)] mb-1 truncate pr-8">{item.name}</h3>
                                        <p className="text-xs text-[var(--text-muted)] font-bold mb-4 line-clamp-1">Subject: {item.subject}</p>
                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                            {item.is_default && (
                                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest border border-emerald-500/20">Default</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'designs' && (
                                    <div className="p-5 border-t border-[var(--border-muted)]">
                                        <h3 className="font-bold text-lg text-[var(--text-heading)] mb-1 truncate">{item.name}</h3>
                                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                                            Edited {new Date(item.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Email Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] w-full max-w-2xl rounded-3xl shadow-2xl border border-[var(--glass-border)] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-[var(--border-muted)] flex justify-between items-center">
                            <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">
                                {editingTemplate ? 'Edit Template' : 'New Email Template'}
                            </h2>
                            <button onClick={() => setShowTemplateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div>
                                <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Template Name</label>
                                <input
                                    type="text"
                                    value={templateForm.name}
                                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                    placeholder="e.g. Winner Notification"
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-3 px-4 outline-none focus:border-violet-500 transition-colors font-medium text-[var(--text-main)]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Email Subject</label>
                                <input
                                    type="text"
                                    value={templateForm.subject}
                                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                                    placeholder="e.g. Congratulations {{name}}!"
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-interactive)] rounded-xl py-3 px-4 outline-none focus:border-violet-500 transition-colors font-medium text-[var(--text-main)]"
                                />
                                <p className="text-[10px] text-[var(--text-muted)] mt-1 ml-1">Use {'{{name}}'} or {'{{event}}'} variables.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Email Body</label>
                                <div className="bg-[var(--bg-input)] rounded-xl overflow-hidden border border-[var(--border-interactive)] focus-within:border-violet-500 transition-colors text-slate-900">
                                    <ReactQuill
                                        theme="snow"
                                        value={templateForm.bodyHtml}
                                        onChange={(content) => setTemplateForm({ ...templateForm, bodyHtml: content })}
                                        className="bg-white min-h-[200px]"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={templateForm.isDefault}
                                    onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                />
                                <label htmlFor="isDefault" className="text-sm font-bold text-[var(--text-main)]">Set as default template</label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[var(--border-muted)] flex justify-end gap-4">
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="px-6 py-3 rounded-xl font-bold text-[var(--text-muted)] hover:bg-[var(--bg-input)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveTemplate}
                                className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-violet-600/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Dashboard;
