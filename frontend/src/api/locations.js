import { request } from './client';

export const locationsApi = {
    list: () => request('/locations'),
    getById: (id) => request(`/locations/${id}`),
    create: (payload) => request('/locations', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
    update: (id, payload) => request(`/locations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
};
