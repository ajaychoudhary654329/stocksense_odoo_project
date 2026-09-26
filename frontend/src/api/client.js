const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('stocksense_token');
    const isPublicAuthRequest = ['/auth/register', '/auth/login', '/auth/forgot-password']
        .includes(endpoint.split('?')[0]);

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (!isPublicAuthRequest && token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
        const message = payload?.error?.message || payload?.message || 'Request failed';
        const error = new Error(message);
        error.status = response.status;
        error.code = payload?.error?.code;
        error.payload = payload;

        if (response.status === 401 && !isPublicAuthRequest) {
            localStorage.removeItem('stocksense_token');
            window.location.href = '/login';
        }

        throw error;
    }

    return payload?.data !== undefined ? payload.data : payload;
}

export { API_URL, request };
