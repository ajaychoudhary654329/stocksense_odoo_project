import { request } from './client';

export const inventoryApi = {
    list: () => request('/inventory'),
    getByProduct: (productId) => request(`/inventory/${productId}`),
    adjust: (payload) => request('/inventory/adjustments', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
};
