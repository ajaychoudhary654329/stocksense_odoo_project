import { request } from './client';
import { openPrintDocument } from '../utils/printDocument';

export const deliveriesApi = {
    list: (params = {}) => {
        const query = new URLSearchParams();
        query.set('limit', '1000');
        if (params.search) query.set('search', params.search);
        if (params.status) query.set('status', params.status);
        return request(`/deliveries${query.toString() ? `?${query.toString()}` : ''}`);
    },
    getById: (id) => request(`/deliveries/${id}`),
    create: (payload) => request('/deliveries', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
    update: (id, payload) => request(`/deliveries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
    setStatus: (id, status) => request(`/deliveries/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    }),
    cancel: (id) => request(`/deliveries/${id}/cancel`, { method: 'POST' }),
    print: (id) => openPrintDocument(`/deliveries/${id}/print`),
};
