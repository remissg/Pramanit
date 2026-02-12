import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FileUpload = ({ onFilesSelected, files }) => {
    const onDrop = useCallback((acceptedFiles) => {
        // Separate files based on type
        const newFiles = { ...files };

        acceptedFiles.forEach(file => {
            if (file.type.startsWith('image/')) {
                newFiles.template = file;
            } else if (file.type.includes('csv') || file.type.includes('sheet') || file.name.endsWith('.csv')) {
                newFiles.data = file;
            }
        });

        onFilesSelected(newFiles);
    }, [files, onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg'],
            'text/csv': ['.csv']
        }
    });

    const removeFile = (type) => {
        const newFiles = { ...files };
        delete newFiles[type];
        onFilesSelected(newFiles);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
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
                            Upload Certificate Template (PNG/JPG) & Recipient List (CSV)
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
