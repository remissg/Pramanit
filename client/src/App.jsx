import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react';
import FileUpload from './components/FileUpload';
import CertificatePreview from './components/CertificatePreview';
import EmailForm from './components/EmailForm';

function App() {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState({ template: null, data: null });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [emailConfig, setEmailConfig] = useState({ subject: '', body: '' });
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [result, setResult] = useState(null);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setStatus('uploading');
    const formData = new FormData();
    formData.append('template', files.template);
    formData.append('data', files.data);
    formData.append('nameX', position.x);
    formData.append('nameY', position.y);
    formData.append('subject', emailConfig.subject);
    formData.append('body', emailConfig.body);
    // Add default font settings if needed
    formData.append('fontSize', '40');
    formData.append('fontColor', '#000000');

    try {
      // Assuming backend is at http://localhost:5000 based on standard setup
      const response = await axios.post('http://localhost:5000/api/certificates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
      setStatus('success');
      setStep(4);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const steps = [
    { id: 1, title: "Upload Files", subtitle: "Certificate Template & Recipient List" },
    { id: 2, title: "Customize", subtitle: "Position the Name" },
    { id: 3, title: "Configure Email", subtitle: "Subject & Message" },
    { id: 4, title: "Finish", subtitle: "Sending Status" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-violet-200 selection:text-violet-900">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white mb-6 shadow-lg shadow-violet-200">
            <Sparkles size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-3">
            Certi<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">Flow</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Automate your certificate generation and delivery workflow in seconds.
          </p>
        </header>

        {/* Progress Steps */}
        <div className="mb-12 max-w-3xl mx-auto">
          <div className="flex justify-between items-center relative">
            {/* Connecting Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>

            {steps.map((s, i) => {
              const isActive = s.id === step;
              const isCompleted = s.id < step;

              return (
                <div key={s.id} className="flex flex-col items-center bg-gray-50 px-2">
                  <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-4 transition-all duration-300
                                ${isActive ? 'border-violet-500 bg-white text-violet-600 scale-110 shadow-lg' :
                      isCompleted ? 'border-violet-500 bg-violet-500 text-white' : 'border-gray-200 bg-gray-100 text-gray-400'}
                             `}>
                    {isCompleted ? <CheckCircle size={18} /> : s.id}
                  </div>
                  <span className={`mt-2 text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-violet-600' : 'text-gray-400'}`}>
                    {s.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100 min-h-[500px] flex flex-col">
          <div className="p-8 md:p-12 flex-grow">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col justify-center"
                >
                  <FileUpload files={files} onFilesSelected={setFiles} />
                </motion.div>
              )}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <CertificatePreview
                    templateFile={files.template}
                    initialPosition={position}
                    onPositionChange={setPosition}
                  />
                </motion.div>
              )}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col justify-center"
                >
                  <EmailForm config={emailConfig} onChange={setEmailConfig} />
                </motion.div>
              )}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center h-full flex flex-col items-center justify-center p-8"
                >
                  {status === 'uploading' ? (
                    <div className="flex flex-col items-center text-violet-600">
                      <Loader2 size={64} className="animate-spin mb-6" />
                      <h3 className="text-2xl font-bold mb-2">Processing...</h3>
                      <p className="text-gray-500">Generating certificates and sending emails.</p>
                    </div>
                  ) : status === 'success' ? (
                    <div className="flex flex-col items-center text-emerald-600">
                      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={40} />
                      </div>
                      <h3 className="text-2xl font-bold mb-2 text-gray-900">All Done!</h3>
                      <p className="text-gray-500 mb-8">
                        Successfully processed batch.
                        {result && <span className="block mt-2 font-mono text-sm bg-gray-100 p-2 rounded">Sent: {result.results?.success?.length || 0} | Failed: {result.results?.failed?.length || 0}</span>}
                      </p>
                      <button
                        onClick={() => { setStep(1); setFiles({ template: null, data: null }); setStatus('idle'); }}
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-colors"
                      >
                        Start New Batch
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-red-500">
                      <AlertCircle size={64} className="mb-6" />
                      <h3 className="text-2xl font-bold mb-2 text-gray-900">Something went wrong</h3>
                      <p className="text-gray-500 mb-8">Failed to process the batch. Please check the server logs.</p>
                      <button
                        onClick={() => setStep(3)}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer / Navigation */}
          {step < 4 && (
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${step === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
              >
                Back
              </button>

              <button
                onClick={step === 3 ? handleSubmit : handleNext}
                disabled={
                  (step === 1 && (!files.template || !files.data)) ||
                  (step === 3 && (!emailConfig.subject || !emailConfig.body))
                }
                className={`
                            px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-violet-200 flex items-center gap-2 transition-all
                            ${(step === 1 && (!files.template || !files.data)) || (step === 3 && (!emailConfig.subject || !emailConfig.body))
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:scale-105 hover:shadow-violet-300'
                  }
                        `}
              >
                {step === 3 ? (
                  <>
                    <Send size={18} />
                    Send Certificates
                  </>
                ) : (
                  "Next Step"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
