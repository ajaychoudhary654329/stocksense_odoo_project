import { request } from './client';

export const authApi = {
    register: (values) => request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(values),
    }),
    login: (values) => request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
    }),
    forgotPassword: (values) => request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(values),
    }),
    me: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),
};
