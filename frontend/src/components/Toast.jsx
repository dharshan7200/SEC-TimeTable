import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <XCircle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />
    };

    const styles = {
        success: 'bg-green-900/95 border-green-500 text-green-100',
        error: 'bg-red-900/95 border-red-500 text-red-100',
        info: 'bg-blue-900/95 border-blue-500 text-blue-100'
    };

    return (
        <div className={`fixed top-24 right-6 z-[60] animate-slide-down`}>
            <div className={`${styles[type]} backdrop-blur-xl border-l-4 rounded-xl shadow-2xl p-4 pr-12 max-w-md min-w-[320px]`}>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {icons[type]}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium leading-relaxed">{message}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
