import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Type, Clipboard } from 'lucide-react';
import { uploadPDF, uploadText } from '../api';

const UploadZone = ({ onUploadSuccess }) => {
    const [mode, setMode] = useState('upload'); // 'upload' or 'paste'
    const [pastedText, setPastedText] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    const processFile = async (file) => {
        if (file.type !== 'application/pdf') {
            setError("Please upload a PDF file.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await uploadPDF(file);
            onUploadSuccess(data.courses, data.raw_text);
        } catch (err) {
            setError("Failed to process file. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasteProcess = async () => {
        if (!pastedText.trim()) {
            setError("Please paste some text first.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await uploadText(pastedText);
            onUploadSuccess(data.courses, data.raw_text);
        } catch (err) {
            setError("Failed to process text. Please ensure you copied correctly from the PDF.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Mode Switcher */}
            <div className="flex justify-center p-1 bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl w-fit mx-auto shadow-sm">
                <button
                    onClick={() => setMode('upload')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'upload'
                        ? 'bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white shadow-sm border border-gray-200/50 dark:border-white/5'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                        }`}
                >
                    <Upload className="w-4 h-4" />
                    PDF Upload
                </button>
                <button
                    onClick={() => setMode('paste')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'paste'
                        ? 'bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white shadow-sm border border-gray-200/50 dark:border-white/5'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                        }`}
                >
                    <Clipboard className="w-4 h-4" />
                    Paste Text
                </button>
            </div>

            {mode === 'upload' ? (
                <div className="space-y-4 animate-fade-in">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                        relative group cursor-pointer
                        border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200
                        ${isDragging
                                ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 scale-[1.01]'
                                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-[#1a1a1a]'
                            }
                    `}
                    >
                        <input
                            type="file"
                            onChange={handleFileSelect}
                            accept=".pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className={`
                            p-4 rounded-xl transition-all duration-300
                            ${isLoading ? 'bg-indigo-50 dark:bg-indigo-900/20 animate-pulse' : 'bg-gray-50 dark:bg-[#2c2c2c] group-hover:bg-gray-100 dark:group-hover:bg-[#333]'}
                        `}>
                                {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <FileText className="w-8 h-8 text-gray-400 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors" />
                                )}
                            </div>

                            <div className="space-y-1">
                                <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                                    {isLoading ? "Reading document..." : "Click or drag your PDF here"}
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">Supports text-based timetable PDFs only</p>
                            </div>
                        </div>
                    </div>

                    {/* Instruction Note */}
                    <div className="flex items-start gap-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">Important formatting note</p>
                            <p className="text-blue-600/80 dark:text-blue-400/80 text-xs mt-1 leading-relaxed">
                                Avoid scanned images. The PDF must contain selectable text for accurate extraction.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in">
                    <div className="relative">
                        <textarea
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            placeholder="Paste the raw text content of your timetable here..."
                            className="w-full h-56 p-5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700/50 rounded-2xl text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-4 focus:ring-gray-100 dark:focus:ring-white/5 transition-all custom-scrollbar resize-none text-sm leading-relaxed shadow-sm"
                        />
                        {pastedText && (
                            <button
                                onClick={() => setPastedText('')}
                                className="absolute top-4 right-4 p-1.5 bg-gray-100 dark:bg-[#2c2c2c] rounded-md text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                                title="Clear text"
                            >
                                <CheckCircle className="w-4 h-4 hidden" />
                                <span className="text-xs font-medium">Clear</span>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handlePasteProcess}
                        disabled={isLoading || !pastedText.trim()}
                        className={`
                            w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                            ${isLoading || !pastedText.trim()
                                ? 'bg-gray-100 dark:bg-[#2c2c2c] text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-sm hover:shadow-md'
                            }
                        `}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Type className="w-4 h-4" />
                        )}
                        {isLoading ? "Processing..." : "Process Text"}
                    </button>
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl flex items-center text-red-600 dark:text-red-400 animate-fade-in text-sm font-medium">
                    <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};

export default UploadZone;
