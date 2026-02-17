import { Github, Twitter, Linkedin, Heart, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Pramanit logo.png';

const Footer = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    return (
        <footer className="glass-card mt-20 border-t-0 p-12 transition-all duration-500">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => navigate(user ? '/dashboard' : '/')}>
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg">
                                <img src={logo} alt="Pramanit Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-3xl font-black tracking-tighter bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent filter drop-shadow-sm">Pramanit</span>
                        </div>
                        <p className="text-[var(--text-muted)] text-sm max-w-sm mb-6 leading-relaxed transition-colors">
                            Empowering organizations to generate and distribute professional certificates at scale. Reliable, beautiful, and lightning fast.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="w-10 h-10 glass rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-violet-400 hover:scale-110 transition-all">
                                <Github size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 glass rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-sky-400 hover:scale-110 transition-all">
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 glass rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-blue-500 hover:scale-110 transition-all">
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[var(--text-main)] font-black uppercase text-xs tracking-widest mb-6 transition-colors">Product</h4>
                        <ul className="space-y-4 text-sm font-bold text-[var(--text-muted)]">
                            {!user ? (
                                <>
                                    <li><a href="#features" className="hover:text-violet-400 transition-colors">Features</a></li>
                                    <li><a href="#templates" className="hover:text-violet-400 transition-colors">Templates</a></li>
                                </>
                            ) : (
                                <>
                                    <li><button onClick={() => navigate('/dashboard')} className="hover:text-violet-400 transition-colors">My Dashboard</button></li>
                                    <li><button onClick={() => navigate('/generate')} className="hover:text-violet-400 transition-colors">Certificate Generator</button></li>
                                </>
                            )}
                            <li><button onClick={() => navigate('/verify/HUB')} className="text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-2">
                                <ShieldCheck size={14} />
                                Verify Certificate
                            </button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[var(--text-main)] font-black uppercase text-xs tracking-widest mb-6 transition-colors">Company</h4>
                        <ul className="space-y-4 text-sm font-bold text-[var(--text-muted)]">
                            <li><a href="#" className="hover:text-violet-400 transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-violet-400 transition-colors">Contact</a></li>
                            <li><a href="#" className="hover:text-violet-400 transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:text-violet-400 transition-colors">Terms</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-[var(--glass-border)] flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[var(--text-muted)] text-xs font-bold transition-colors">
                        © {new Date().getFullYear()} Pramanit INC. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1 text-[var(--text-muted)] text-xs font-bold group hover:text-violet-400 transition-colors cursor-pointer">
                        Built with <Heart size={12} className="text-rose-500 group-hover:scale-125 transition-transform" /> for professionals
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
