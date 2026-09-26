import { request } from './client';

export const warehousesApi = {
    list: () => request('/warehouses'),
    getById: (id) => request(`/warehouses/${id}`),
    create: (payload) => request('/warehouses', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
    update: (id, payload) => request(`/warehouses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
};
