import {
    createContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import ToastContainer from 'widgets/toastContainer';
import { onApiError } from 'shared/api/events';
import { ApiError, API_ERROR_CODES } from 'shared/api';

export interface Toast {
    id: string;
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    progress?: number;
}

export interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id' | 'progress'>) => void;
    removeToast: (id: string) => void;
    pauseToast: (id: string) => void;
    resumeToast: (id: string) => void;
    updateProgress: (id: string, progress: number) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
        new Map(),
    );
    const progressIntervals = useRef<
        Map<string, ReturnType<typeof setInterval>>
    >(new Map());
    const remainingTime = useRef<Map<string, number>>(new Map());
    const startTime = useRef<Map<string, number>>(new Map());

    const updateProgress = (id: string, progress: number) => {
        setToasts((prev) =>
            prev.map((toast) =>
                toast.id === id ? { ...toast, progress } : toast,
            ),
        );
    };

    const removeToast = (id: string) => {
        const timer = timers.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timers.current.delete(id);
        }

        const progressInterval = progressIntervals.current.get(id);
        if (progressInterval) {
            clearInterval(progressInterval);
            progressIntervals.current.delete(id);
        }

        remainingTime.current.delete(id);
        startTime.current.delete(id);

        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const addToast = (toast: Omit<Toast, 'id' | 'progress'>) => {
        const id = Math.random().toString(36).substring(2, 11);
        const newToast: Toast = { ...toast, id, progress: 0 };

        setToasts((prev) => [...prev, newToast]);

        const duration = toast.duration ?? 4000;
        if (duration > 0) {
            remainingTime.current.set(id, duration);
            startTime.current.set(id, Date.now());

            const timer = setTimeout(() => {
                removeToast(id);
            }, duration);
            timers.current.set(id, timer);

            const progressInterval = setInterval(() => {
                const start = startTime.current.get(id);
                if (!start) return;

                const elapsed = Date.now() - start;
                const progress = Math.min((elapsed / duration) * 100, 100);
                updateProgress(id, progress);

                if (progress >= 100) {
                    clearInterval(progressInterval);
                    progressIntervals.current.delete(id);
                }
            }, 50);

            progressIntervals.current.set(id, progressInterval);
        }
    };

    const pauseToast = (id: string) => {
        const timer = timers.current.get(id);
        const progressInterval = progressIntervals.current.get(id);

        if (timer) clearTimeout(timer);
        if (progressInterval) clearInterval(progressInterval);

        updateProgress(id, 0);
    };

    const resumeToast = (id: string) => {
        const toast = toasts.find((t) => t.id === id);
        if (!toast) return;

        const duration = toast.duration ?? 4000;

        remainingTime.current.set(id, duration);
        startTime.current.set(id, Date.now());

        const timer = setTimeout(() => {
            removeToast(id);
        }, duration);
        timers.current.set(id, timer);

        const progressInterval = setInterval(() => {
            const start = startTime.current.get(id);
            if (!start) return;

            const elapsed = Date.now() - start;
            const progress = Math.min((elapsed / duration) * 100, 100);
            updateProgress(id, progress);

            if (progress >= 100) {
                clearInterval(progressInterval);
                progressIntervals.current.delete(id);
            }
        }, 50);

        progressIntervals.current.set(id, progressInterval);
    };

    const lastRateToastAtRef = useRef(0);

    useEffect(() => {
        return onApiError((err) => {
            if (!(err instanceof ApiError)) return;

            const isRateLimit =
                err.status === 429 ||
                err.code === API_ERROR_CODES.TOO_MANY_REQUESTS;

            if (!isRateLimit) return;

            const now = Date.now();
            if (now - lastRateToastAtRef.current < 1500) return;
            lastRateToastAtRef.current = now;

            addToast({
                message: 'Слишком много попыток. Попробуйте позже.',
                type: 'warning',
                duration: 4000,
            });
        });
    }, []);

    return (
        <ToastContext.Provider
            value={{
                addToast,
                removeToast,
                pauseToast,
                resumeToast,
                updateProgress,
            }}
        >
            {children}
            <ToastContainer
                toasts={toasts}
                removeToast={removeToast}
                pauseToast={pauseToast}
                resumeToast={resumeToast}
            />
        </ToastContext.Provider>
    );
};
