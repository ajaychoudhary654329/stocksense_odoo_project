import { request } from './client';

export const movesApi = {
    list: (params = {}) => {
        const query = new URLSearchParams();
        query.set('limit', '1000');
        if (params.search) query.set('search', params.search);
        if (params.type) query.set('type', params.type);
        return request(`/moves${query.toString() ? `?${query.toString()}` : ''}`);
    },
    getById: (id) => request(`/moves/${id}`),
};
