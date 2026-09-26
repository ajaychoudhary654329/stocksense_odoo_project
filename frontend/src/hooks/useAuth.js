import { useEffect, useState } from 'react';
import { authApi } from '../api/auth';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('stocksense_token')));

    const refresh = async () => {
        const token = localStorage.getItem('stocksense_token');
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const currentUser = await authApi.me();
            setUser(currentUser);
        } catch {
            localStorage.removeItem('stocksense_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!localStorage.getItem('stocksense_token')) return undefined;
        let active = true;
        authApi.me()
            .then((currentUser) => { if (active) setUser(currentUser); })
            .catch(() => {
                if (!active) return;
                localStorage.removeItem('stocksense_token');
                setUser(null);
            })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, []);

    return { user, setUser, loading, refresh };
}
