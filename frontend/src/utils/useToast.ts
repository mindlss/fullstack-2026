import { useContext } from 'react';
import { ToastContext, type ToastContextType } from '../app/lib/ToastProvider';

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};
