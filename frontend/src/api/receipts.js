import { request } from './client';
import { openPrintDocument } from '../utils/printDocument';

export const receiptsApi = {
    list: (params = {}) => {
        const query = new URLSearchParams();
        query.set('limit', '1000');
        if (params.search) query.set('search', params.search);
        if (params.status) query.set('status', params.status);
        return request(`/receipts${query.toString() ? `?${query.toString()}` : ''}`);
    },
    getById: (id) => request(`/receipts/${id}`),
    create: (payload) => request('/receipts', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
    update: (id, payload) => request(`/receipts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
    setStatus: (id, status) => request(`/receipts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    }),
    cancel: (id) => request(`/receipts/${id}/cancel`, { method: 'POST' }),
    print: (id) => openPrintDocument(`/receipts/${id}/print`),
};
