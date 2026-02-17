import { useState, useEffect } from 'react';
import FileForm from './components/FileUpload';
import CertificatePreview from './components/CertificatePreview';
import EmailForm from './components/EmailForm';
import BatchPreview from './components/BatchPreview';
import ManualRecipientEntry from './components/ManualRecipientEntry';
import axios from 'axios';
import { CheckCircle, Loader, ArrowRight, Eye, Sparkles, Send, User, Mail, BarChart3, TrendingUp, Users, ShieldCheck, Globe, LayoutTemplate } from 'lucide-react';
import CustomSelect from './components/CustomSelect';
import Papa from 'papaparse';

import * as XLSX from 'xlsx';

import { useRef } from 'react';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Footer from './components/Footer';
import VerifyCertificate from './components/VerifyCertificate';
import logo from './assets/Pramanit logo.png';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmailPage from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import RecipientPortal from './components/RecipientPortal';
import AdminPanel from './components/AdminPanel';

const VerificationNotice = () => {
  const { logout, user } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const getMailboxUrl = (email) => {
    if (!email) return null;
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain?.includes('gmail')) return { name: 'Gmail', url: 'https://mail.google.com/', icon: 'Mail' };
    if (domain?.includes('outlook') || domain?.includes('hotmail') || domain?.includes('live')) return { name: 'Outlook', url: 'https://outlook.live.com/', icon: 'Mail' };
    if (domain?.includes('yahoo')) return { name: 'Yahoo Mail', url: 'https://mail.yahoo.com/', icon: 'Mail' };
    if (domain?.includes('icloud')) return { name: 'iCloud Mail', url: 'https://www.icloud.com/mail/', icon: 'Mail' };
    return null;
  };

  const mailbox = getMailboxUrl(user?.email);

  const handleResend = async () => {
    try {
      setResending(true);
      await axios.post('http://localhost:5000/api/auth/resend-verification');
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-3xl p-8 shadow-2xl text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="text-amber-500" size={40} />
        </div>
        <h2 className="text-2xl font-black text-[var(--text-heading)] mb-4 leading-tight">Verify Your Email</h2>
        <p className="text-[var(--text-muted)] mb-8 font-medium leading-relaxed">
          Your account at <strong>{user?.email}</strong> is not verified yet. Please check your inbox and click the verification link to unlock all features.
        </p>

        <div className="space-y-4">
          {mailbox && (
            <a
              href={mailbox.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl shadow-lg shadow-violet-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
            >
              Open {mailbox.name}
              <Globe size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          )}

          <button
            onClick={() => window.location.reload()}
            className={`w-full py-4 ${mailbox ? 'bg-[var(--bg-input)] text-[var(--text-main)] border border-[var(--border-muted)]' : 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'} hover:bg-violet-500/10 hover:text-violet-500 hover:border-violet-500/20 font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2`}
          >
            I've Verified My Email
          </button>

          <div className="pt-4 border-t border-[var(--border-muted)] mt-6 space-y-3">
            <button
              onClick={handleResend}
              disabled={resending || resent}
              className="text-xs font-bold text-violet-500 hover:text-violet-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
            >
              {resending ? <Loader size={12} className="animate-spin" /> : resent ? <CheckCircle size={12} /> : null}
              {resent ? 'Verification Link Sent!' : 'Didn\'t get the email? Resend Link'}
            </button>
            <button
              onClick={logout}
              className="text-xs font-bold text-[var(--text-muted)] hover:text-rose-500 transition-colors"
            >
              Sign out and try another email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isVerified) {
    return <VerificationNotice />;
  }

  return children;
};

const ProtectedRoute = RequireAuth;

const AdminGuard = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// New: Prevent authenticated users from going to Landing or Login
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


import Watermark from './components/Watermark';

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('pramanit-theme') || 'system';
  });

  useEffect(() => {
    const applyTheme = (t) => {
      let resolvedTheme = t;
      if (t === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    };

    applyTheme(theme);
    localStorage.setItem('pramanit-theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const handleStartWithTemplate = (onGetStarted) => (templateUrl, templateName) => {
    // This is passed to MainApp now
  };

  return (
    <Router>
      <AuthProvider>
        <Watermark />
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard theme={theme} setTheme={setTheme} />
              </RequireAuth>
            }
          />
          <Route
            path="/generate"
            element={
              <RequireAuth>
                <MainApp theme={theme} setTheme={setTheme} />
              </RequireAuth>
            }
          />
          {/* Public Routing */}
          <Route path="/verify/:id" element={<VerifyCertificate theme={theme} setTheme={setTheme} />} />
          <Route path="/portal" element={<RecipientPortal theme={theme} setTheme={setTheme} />} />
          <Route path="/admin" element={
            <AdminGuard>
              <AdminPanel theme={theme} setTheme={setTheme} />
            </AdminGuard>
          } />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={<LandingPageWrapper theme={theme} setTheme={setTheme} />}
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

// Helper to handle LandingPage navigation
const LandingPageWrapper = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  return (
    <LandingPage
      onGetStarted={() => navigate('/generate')}
      onSelectTemplate={(url, name) => navigate('/generate', { state: { templateUrl: url, templateName: name } })}
      theme={theme}
      setTheme={setTheme}
    />
  );
};

function MainApp({ theme, setTheme }) {
  const { user, token } = useAuth();
  const location = useLocation();
  const [showApp, setShowApp] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState({ template: null, data: null });
  const [recipientSource, setRecipientSource] = useState('bulk'); // 'bulk' | 'manual'
  const abortBatchRef = useRef(false); // Ref to signal abort


  const handleStartWithTemplate = async (templateUrl, templateName) => {
    try {
      const response = await fetch(templateUrl);
      const blob = await response.blob();
      const file = new File([blob], `${templateName}.png`, { type: 'image/png' });
      setFiles(prev => ({ ...prev, template: file }));
      setShowApp(true);
      setRecipientSource('manual'); // Assume manual entry if starting from template
      setStep(2); // Jump directly to Designer since templates are blank
    } catch (error) {
      console.error("Failed to load template:", error);
      setShowApp(true);
    }
  };

  const [rawRows, setRawRows] = useState([]);
  const [availableHeaders, setAvailableHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({ name: '', email: '' });
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipientIndices, setSelectedRecipientIndices] = useState([]);
  const [fields, setFields] = useState([]); // [{ id, label, x, y, fontSize, fontFamily, color, isVisible, textCase, isItalic, isUnderline, isBold }]
  const [qrConfig, setQrConfig] = useState({ isVisible: false, x: 0.85, y: 0.85, size: 80, showManualId: false });
  const [activeFieldId, setActiveFieldId] = useState(null);

  // Default styling for new fields
  const defaultStyle = {
    fontSize: 40,
    fontFamily: 'Inter',
    color: '#000000',
    textCase: 'normal',
    isItalic: false,
    isUnderline: false,
    isBold: false
  };

  const [emailTemplates, setEmailTemplates] = useState([]);

  useEffect(() => {
    // If arriving from LandingPage with a chosen template
    if (location.state && location.state.templateUrl) {
      handleStartWithTemplate(location.state.templateUrl, location.state.templateName);
      // Clear state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (user) {
      axios.get('http://localhost:5000/api/email-templates')
        .then(res => setEmailTemplates(res.data))
        .catch(err => console.error(err));
    }
  }, [user]);

  useEffect(() => {
    if (location.state && location.state.loadDesign) {
      const design = location.state.loadDesign;

      const loadDesignData = (data) => {
        let designData = data;
        if (typeof designData === 'string') {
          try { designData = JSON.parse(designData); } catch (e) { console.error("Parse error", e); return; }
        }
        if (designData) {
          const { fields: loadedFields, qrConfig: loadedQr, emailConfig: loadedEmail } = designData;
          if (loadedFields) setFields(loadedFields);
          if (loadedQr) setQrConfig(loadedQr);
          if (loadedEmail) setEmailConfig(loadedEmail);
        }
      };

      if (design.design_json) {
        loadDesignData(design.design_json);
      } else if (design.id || design._id) {
        // Fetch full details if missing from list view
        axios.get(`http://localhost:5000/api/designs/${design.id || design._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => {
            if (res.data.design_json) {
              loadDesignData(res.data.design_json);
            }
          })
          .catch(err => console.error("Failed to fetch full design details", err));
      }

      // Restore template file from preview URL (Base64)
      if (design.preview_url) {
        fetch(design.preview_url)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `${design.name}.png`, { type: 'image/png' });
            setFiles(prev => ({ ...prev, template: file }));
            setShowApp(true);
            setStep(2); // Jump directly to customization
          })
          .catch(err => console.error("Failed to load template image", err));
      }

      // Clear state so we don't re-trigger on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location, token]);

  // Update recipients whenever rawRows or mapping changes
  useEffect(() => {
    if (rawRows.length > 0) {
      const mapped = rawRows.map(row => ({
        name: row[columnMapping.name] || '',
        email: row[columnMapping.email] || '',
        // Store the original row data for dynamic field replacement later
        data: row
      })).filter(r => r.name || r.email);
      setRecipients(mapped);
      setSelectedRecipientIndices(mapped.map((_, i) => i));
    }
  }, [rawRows, columnMapping]);
  const [emailConfig, setEmailConfig] = useState({ subject: '', body: '', issuerName: '' });
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error, previewing
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [showBatchPreview, setShowBatchPreview] = useState(false);

  const processHeaders = (headers, rows) => {
    setAvailableHeaders(headers);
    setRawRows(rows);

    // Auto-mapping for email/name tracking - Always update this for the recipient list
    const nameKey = headers.find(h => /name|recipient|person/i.test(h)) || headers[0];
    const emailKey = headers.find(h => /email|mail|address/i.test(h)) || headers[1];
    setColumnMapping({ name: nameKey, email: emailKey });

    // If fields already exist (e.g. from a saved design), DO NOT overwrite them
    // This allows the user to apply a saved layout to new data
    if (fields.length > 0) {
      console.log("Preserving existing design fields");
      return;
    }

    // Generate dynamic fields from headers ONLY if no design is loaded
    let primaryNameFound = false;
    const newFields = headers.map((header, index) => {
      const trimmedHeader = header.trim();

      // Heuristic to avoid making every name-like column visible
      let isVisible = false;
      const isNameLike = /name|recipient|person/i.test(trimmedHeader);

      if (isNameLike && !primaryNameFound) {
        isVisible = true;
        primaryNameFound = true;
      } else if (!isNameLike && /rank|sport|event|title|date|position/i.test(trimmedHeader)) {
        isVisible = true;
      }

      return {
        id: trimmedHeader,
        label: trimmedHeader,
        x: 0.5,
        y: 0.4 + (index * 0.1), // Start lower (0.4) to avoid typical header area
        ...defaultStyle,
        isVisible
      };
    });

    setFields(newFields);
    const firstVisible = newFields.find(f => f.isVisible) || newFields[0];
    setActiveFieldId(firstVisible?.id);
  };

  const handleFileChange = (newFiles) => {
    setFiles(prev => ({ ...prev, ...newFiles }));

    // If data changed, parse it locally
    if (newFiles.data) {
      const fileName = newFiles.data.name.toLowerCase();

      if (fileName.endsWith('.csv')) {
        Papa.parse(newFiles.data, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            processHeaders(results.meta.fields || [], results.data);
          }
        });
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length > 0) {
            processHeaders(Object.keys(jsonData[0]), jsonData);
          }
        };
        reader.readAsArrayBuffer(newFiles.data);
      }
    }
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBatchPreview = async () => {
    setStatus('previewing');
    const formData = new FormData();
    formData.append('template', files.template);
    if (files.data) {
      formData.append('data', files.data);
    } else if (recipientSource === 'manual') {
      formData.append('recipients', JSON.stringify(recipients));
    }
    formData.append('fields', JSON.stringify(fields.filter(f => f.isVisible)));
    formData.append('qrConfig', JSON.stringify(qrConfig));

    try {
      const response = await axios.post('http://localhost:5000/api/certificates/preview-batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviews(response.data.previews);
      setShowBatchPreview(true);
      setStatus('idle');
    } catch (error) {
      console.error("Preview failed", error);
      setStatus('error');
    }
  };

  const handleSubmit = async () => {
    setStatus('uploading');
    setResult(null);
    setProgress({ current: 0, total: recipients.length });

    try {
      // 1. Prepare (Upload Template once)
      abortBatchRef.current = false; // Reset abort signal
      const prepData = new FormData();
      prepData.append('template', files.template);
      const prepRes = await axios.post('http://localhost:5000/api/certificates/prepare-batch', prepData);
      const { templatePath } = prepRes.data;

      const results = { success: [], failed: [] };
      const selectedRecipients = recipients.filter((_, i) => selectedRecipientIndices.includes(i));
      setProgress({ current: 0, total: selectedRecipients.length });

      // 2. Process one-by-one for progress tracking
      for (let i = 0; i < selectedRecipients.length; i++) {
        if (abortBatchRef.current) {
          setStatus('idle'); // Or 'cancelled' if we had a specific state
          alert(`Batch stopped. Sent ${results.success.length} certificates.`);
          break;
        }
        const recipient = selectedRecipients[i];

        try {
          await axios.post('http://localhost:5000/api/certificates/process-single', {
            templatePath,
            recipient,
            fields: fields.filter(f => f.isVisible),
            subject: emailConfig.subject,
            body: emailConfig.body,
            issuerName: emailConfig.issuerName,
            qrConfig
          });
          results.success.push(recipient.email || recipient.name);
        } catch (err) {
          results.failed.push({
            email: recipient.email || recipient.name,
            error: err.response?.data?.message || err.message
          });
        }
        setProgress({ current: i + 1, total: selectedRecipients.length });
      }

      setResult({ count: results.success.length, failedCount: results.failed.length });
      setStatus('success');
      setStep(4);
    } catch (error) {
      console.error("Batch failed:", error);
      setStatus('error');
    }
  };

  const handleSaveDesign = async () => {
    if (!files || !files.template) return;

    const designName = prompt('Enter a name for this design:');
    if (!designName) return;

    setSaving(true);
    try {
      // Create a preview image (in a real app, uses canvas.toDataURL)
      // For now, we'll use a placeholder or the raw template if small enough
      // But effectively we need to upload the template file first or convert to base64

      const reader = new FileReader();
      reader.readAsDataURL(files.template);
      reader.onloadend = async () => {
        const base64data = reader.result;

        const designData = {
          name: designName,
          designJson: {
            fields,
            qrConfig,
            emailConfig,
            // We would typically store the background image URL here after upload
            // For MVP, we'll store the base64 (careful with size) or just metadata
          },
          previewUrl: base64data // Store base64 for preview (MVP)
        };

        await axios.post('http://localhost:5000/api/designs', designData);
        alert('Design saved successfully!');
      };
    } catch (error) {
      console.error('Failed to save design:', error);
      alert('Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  // Cleanup: Remove the nested LandingPage return since it now has its own route
  // if (!showApp) { ... }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] font-sans text-[var(--text-main)] selection:bg-violet-500/30 transition-colors duration-500">
      <Header
        onGetStarted={() => setShowApp(true)}
        theme={theme}
        setTheme={setTheme}
      />

      <div className="pt-32 md:pt-24 pb-8 md:pb-20 max-w-7xl mx-auto px-4 md:px-6 transition-all">
        {/* Progress Overlay during Upload */}
        {status === 'uploading' && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <div className="bg-[var(--bg-card)] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 rounded-3xl text-center border border-[var(--glass-border)]">
              <div className="w-20 h-20 rounded-2xl bg-violet-600/20 flex items-center justify-center mb-6 mx-auto">
                <Send className="text-violet-400 animate-bounce" size={32} />
              </div>
              <h3 className="text-2xl font-black text-[var(--text-heading)] mb-2 tracking-tight transition-colors">Sending Batch</h3>
              <p className="text-[var(--text-muted)] mb-8 font-bold transition-colors">Processing {progress.current} of {progress.total} certificates...</p>

              <div className="w-full h-3 bg-[var(--glass)] rounded-full overflow-hidden mb-4 p-0.5 border border-[var(--glass-border)]">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300 rounded-full shadow-[0_0_15px_rgba(124,58,237,0.5)]"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-violet-400 tracking-[0.2em] uppercase mb-6">Please do not close this tab</p>

              <button
                onClick={() => {
                  abortBatchRef.current = true;
                  // Optional: immediate visual feedback, though loop break handles it
                }}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
              >
                Stop Sending
              </button>
            </div>
          </div>
        )}

        <div className="text-center mb-10 md:mb-16 px-4 md:px-6">
          <h2 className="text-3xl md:text-6xl font-black text-[var(--text-heading)] tracking-tighter mb-4 transition-colors">Certificate <span className="text-violet-500">Generator</span></h2>
          <p className="text-[var(--text-muted)] text-[10px] md:text-sm font-bold max-w-xl mx-auto transition-colors uppercase tracking-widest">Transform your template into professional credentials.</p>

          {user && !user.isVerified && (
            <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl max-w-2xl mx-auto animate-in slide-in-from-top-4 duration-500 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-amber-500 font-bold text-xs">
                <ShieldCheck size={18} />
                <span>Your account is unverified. Please check your email to verify your identity.</span>
              </div>
              <button
                onClick={() => alert("Verification email resent! (Mock)")}
                className="px-4 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
              >
                Resend Email
              </button>
            </div>
          )}
        </div>

        <div className={`flex justify-between items-center relative px-12 max-w-3xl mx-auto ${step === 2 ? 'mb-8 md:mb-16' : 'mb-6 md:mb-16'}`}>
          <div className="absolute top-1/2 left-0 w-full h-1 bg-[var(--glass)] -z-0 transform -translate-y-1/2 rounded-full border border-[var(--glass-border)]"></div>
          <div className={`absolute top-1/2 left-0 h-1 bg-violet-600 -z-0 transform -translate-y-1/2 rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(124,58,237,0.5)]`} style={{ width: `${((step - 1) / 3) * 100}%` }}></div>

          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all duration-500 ${step >= i ? 'bg-violet-600 text-white shadow-2xl shadow-violet-500/40 scale-110' : 'bg-[var(--stepper-inactive)] text-[var(--text-muted)] border-2 border-[var(--border-muted)]'}`}>
              {step > i ? <CheckCircle size={24} /> : i}
            </div>
          ))}
        </div>

        {/* Main Content Card */}
        <div className="glass-card rounded-[2rem] md:rounded-[32px] p-6 md:p-12 min-h-[500px] md:min-h-[600px] relative overflow-hidden transition-all duration-500">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-3xl font-black text-[var(--text-heading)] tracking-tight transition-colors">Upload Resources</h2>
                {recipients.length > 0 && (
                  <div className="px-4 py-1.5 bg-violet-600/10 text-violet-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-violet-500/20 flex items-center gap-2">
                    <CheckCircle size={14} /> {recipients.length} Recipients Found
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-8">
                <div className="flex bg-[var(--bg-input)] p-1 rounded-2xl border border-[var(--border-interactive)] self-start">
                  <button
                    onClick={() => setRecipientSource('bulk')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${recipientSource === 'bulk' ? 'bg-violet-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-violet-500'}`}
                  >
                    Bulk Upload
                  </button>
                  <button
                    onClick={() => setRecipientSource('manual')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${recipientSource === 'manual' ? 'bg-violet-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-violet-500'}`}
                  >
                    Quick Entry
                  </button>
                </div>

                {recipientSource === 'bulk' ? (
                  <FileForm files={files} onFilesSelected={handleFileChange} />
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                    <FileForm
                      files={{ template: files.template }}
                      onlyTemplate={true}
                      onFilesSelected={(newFiles) => setFiles(prev => ({ ...prev, ...newFiles, data: null }))}
                    />
                    <ManualRecipientEntry onDataChange={processHeaders} />
                  </div>
                )}
              </div>

              {rawRows.length > 0 && (
                <div className="bg-[var(--glass)] rounded-[24px] p-8 border border-[var(--glass-border)] space-y-6 animate-in fade-in zoom-in-95 duration-500 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="text-violet-500" size={20} />
                    <h3 className="text-lg font-black text-[var(--text-heading)] tracking-tight transition-colors">Map Your Columns</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3 block group-hover:text-violet-400 transition-colors">Recipient Name Column</label>
                      <CustomSelect
                        value={columnMapping.name}
                        onChange={(val) => setColumnMapping(prev => ({ ...prev, name: val }))}
                        options={availableHeaders.map(h => ({ name: h, value: h }))}
                        icon={User}
                      />
                    </div>
                    <div className="group">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3 block group-hover:text-violet-400 transition-colors">Recipient Email Column</label>
                      <CustomSelect
                        value={columnMapping.email}
                        onChange={(val) => setColumnMapping(prev => ({ ...prev, email: val }))}
                        options={availableHeaders.map(h => ({ name: h, value: h }))}
                        icon={Mail}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-12 border-t border-[var(--glass-border)] mt-8">
                <button
                  onClick={handleNext}
                  disabled={!files.template}
                  className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 active:scale-95 group shadow-xl ${!files.template
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-900/20 hover:shadow-violet-900/40 hover:scale-105'}`}
                >
                  Next Step
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-3xl font-black text-[var(--text-heading)] tracking-tight transition-colors">Customize Layout</h2>
                <div></div>
              </div>
              <CertificatePreview
                templateFile={files.template}
                fields={fields}
                onFieldsChange={setFields}
                activeFieldId={activeFieldId}
                onActiveFieldChange={setActiveFieldId}
                previewData={recipients[0]}
                qrConfig={qrConfig}
                onQrConfigChange={setQrConfig}
                onSave={user ? handleSaveDesign : null}
                isSaving={saving}
              />
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-12 border-t border-[var(--glass-border)] mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-[var(--border-interactive)] text-[var(--text-muted)] hover:text-violet-500 hover:border-violet-500/50 font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-violet-900/20 hover:shadow-violet-900/40 transition-all flex items-center justify-center gap-3 group active:scale-95"
                >
                  Looks Good
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-3xl font-black text-[var(--text-heading)] tracking-tight transition-colors">Configure Email</h2>
              <div className="glass-card rounded-[24px] p-8 border border-[var(--glass-border)] shadow-inner transition-colors">
                <EmailForm config={emailConfig} onChange={setEmailConfig} templates={emailTemplates} />
              </div>

              <div className="flex flex-col sm:flex-row justify-between pt-12 border-t border-[var(--glass-border)] mt-8 items-center gap-6">
                <button
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-[var(--border-interactive)] text-[var(--text-muted)] hover:text-violet-500 hover:border-violet-500/50 font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                >
                  Back
                </button>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button
                    onClick={handleBatchPreview}
                    disabled={status === 'previewing'}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-[var(--border-interactive)] text-[var(--text-main)] hover:bg-violet-500/10 hover:border-violet-500/50 font-black transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    {status === 'previewing' ? <Loader className="animate-spin" size={18} /> : <Eye size={20} />}
                    Preview Batch
                  </button>

                  <button
                    onClick={handleSubmit}
                    className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-violet-900/20 hover:shadow-violet-900/40 hover:scale-105 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                  >
                    <Send size={20} className="group-hover:rotate-12 transition-transform" />
                    Launch Batch
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-in zoom-in duration-700 px-6">
              <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mb-8 shadow-violet-500/20 shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-500 p-4">
                <img src={logo} alt="CertiFlow Success" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-4xl font-black text-[var(--text-heading)] tracking-tight mb-4 leading-tight transition-colors">Batch Successful!</h2>
              <p className="text-[var(--text-muted)] font-bold max-w-sm mx-auto mb-10 leading-relaxed text-sm transition-colors">
                Congratulations! <span className="text-[var(--text-main)] font-black">{result?.count || 0} certificates</span> were generated and sent successfully.
                {result?.failedCount > 0 && (
                  <span className="block text-rose-400 mt-4 text-[10px] uppercase font-black tracking-widest bg-rose-500/10 py-2 rounded-xl border border-rose-500/20">
                    ⚠️ {result.failedCount} certificates failed
                  </span>
                )}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-white text-[#0f172a] px-10 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest mb-12"
              >
                Start New Batch
              </button>

              {/* Analytics Dashboard Preview */}
              <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-left animate-in slide-in-from-bottom-8 duration-1000 delay-300">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <BarChart3 className="text-violet-500" size={20} />
                      Trust Analytics
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time Credential Engagement</p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Live Tracking</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    icon={Globe}
                    label="Public Reach"
                    value={`${result?.count || 0}`}
                    sub="Global IDs"
                    color="violet"
                  />
                  <StatCard
                    icon={Users}
                    label="Verification Scans"
                    value="0"
                    sub="+0.0% today"
                    color="blue"
                  />
                  <StatCard
                    icon={ShieldCheck}
                    label="Trust Score"
                    value="100%"
                    sub="Safe & Secure"
                    color="emerald"
                  />
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Public Verification Hub</p>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                      <Globe size={12} className="text-violet-500" />
                      <span className="text-[10px] font-mono text-slate-300">certiflow.portal/verify</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/verify/HUB`);
                          alert('Master Portal Link copied!');
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <Mail size={12} className="text-slate-500 hover:text-white" />
                      </button>
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0f172a] bg-slate-800 flex items-center justify-center">
                        <User size={10} className="text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {
        showBatchPreview && (
          <BatchPreview
            previews={previews}
            selectedIndices={selectedRecipientIndices}
            onToggleSelection={setSelectedRecipientIndices}
            onClose={() => setShowBatchPreview(false)}
            onConfirm={() => {
              setShowBatchPreview(false);
              handleSubmit();
            }}
          />
        )
      }
    </div >
  );
}

export default App;

const StatCard = ({ icon: Icon, label, value, sub, color }) => {
  const colors = {
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  };

  return (
    <div className={`p-6 rounded-3xl border ${colors[color]} flex flex-col gap-3 transition-colors`}>
      <div className="flex items-center justify-between">
        <Icon size={18} opacity={0.8} />
        <TrendingUp size={14} className="opacity-40" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
        <p className="text-2xl font-black tracking-tight">{value}</p>
        <p className="text-[8px] font-bold uppercase tracking-wider opacity-40 mt-1">{sub}</p>
      </div>
    </div>
  );
};
