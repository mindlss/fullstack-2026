/* eslint-disable react-refresh/only-export-components */
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { usersApi, ApiError } from 'shared/api';

type AuthStatus = 'unknown' | 'authed' | 'guest';

type AuthContextValue = {
    status: AuthStatus;
    isAuthed: boolean;
    refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>('unknown');

    console.log(import.meta.env.VITE_API_BASE_URL);

    const refresh = useCallback(async () => {
        try {
            await usersApi.me();
            setStatus('authed');
        } catch (e: unknown) {
            if (e instanceof ApiError) {
                if (e.status === 401 || e.status === 403) {
                    setStatus('guest');
                    return;
                }
            }
            setStatus('guest');
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    useEffect(() => {
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) {
                void refresh();
            }
        };

        window.addEventListener('pageshow', onPageShow);
        return () => window.removeEventListener('pageshow', onPageShow);
    }, [refresh]);

    const value = useMemo<AuthContextValue>(
        () => ({
            status,
            isAuthed: status === 'authed',
            refresh,
        }),
        [status, refresh],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider />');
    return ctx;
}
