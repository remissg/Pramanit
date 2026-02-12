import React from 'react';
import { Mail, Type } from 'lucide-react';

const EmailForm = ({ config, onChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange({ ...config, [name]: value });
    };

    return (
        <div className="space-y-6 w-full max-w-2xl mx-auto">
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Type size={18} className="text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        name="subject"
                        value={config.subject}
                        onChange={handleChange}
                        placeholder="Congratulations! Your Course Certificate"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder-gray-300"
                    />
                </div>
            </div>

            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Body
                    <span className="text-xs font-normal text-gray-400 ml-2">(Use {"{name}"} for dynamic recipient name)</span>
                </label>
                <div className="relative group">
                    <div className="absolute top-3 left-3 pointer-events-none">
                        <Mail size={18} className="text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                    </div>
                    <textarea
                        name="body"
                        rows="5"
                        value={config.body}
                        onChange={handleChange}
                        placeholder="Hi {{name}},&#10;&#10;Congratulations on completing {{course}}!&#10;&#10;Best,&#10;CertiFlow"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder-gray-300 resize-none"
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Tip: Use <code className="bg-gray-100 px-1 rounded text-violet-600">{'{{column_name}}'}</code> to insert data from your CSV (e.g., {'{{name}}'}, {'{{course}}'}).
                </p>
            </div>

            <div className="pt-4 border-t border-gray-100">
                <div className="flex gap-4 items-end">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Send a Test Email</label>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            id="test-email-input"
                            className="block w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={async () => {
                            const email = document.getElementById('test-email-input').value;
                            if (!email) return alert('Please enter an email address');

                            try {
                                const btn = document.getElementById('test-btn');
                                const originalText = btn.innerText;
                                btn.innerText = 'Sending...';
                                btn.disabled = true;

                                await fetch('http://localhost:5000/api/certificates/test-email', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        email,
                                        subject: config.subject,
                                        body: config.body
                                    })
                                });
                                alert('Test email sent! Check your inbox.');
                                btn.innerText = originalText;
                                btn.disabled = false;
                            } catch (e) {
                                alert('Failed to send test email.');
                                console.error(e);
                            }
                        }}
                        id="test-btn"
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors h-[42px]"
                    >
                        Send Test
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailForm;
