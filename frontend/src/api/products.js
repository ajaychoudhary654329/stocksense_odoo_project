import { request } from './client';

export const productsApi = {
    list: (search = '') => {
        const query = new URLSearchParams({ limit: '1000' });
        if (search) query.set('search', search);
        return request(`/products?${query.toString()}`);
    },
    getById: (id) => request(`/products/${id}`),
    create: (payload) => request('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
    update: (id, payload) => request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
    remove: (id) => request(`/products/${id}`, { method: 'DELETE' }),
};
