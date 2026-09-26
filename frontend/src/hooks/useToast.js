import { useCallback, useState } from 'react';

export function useToast() {
    const [toasts, setToasts] = useState([]);

    const pushToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts((current) => [...current, { id, message, type }]);
        setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3500);
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    return { toasts, pushToast, dismissToast };
}
