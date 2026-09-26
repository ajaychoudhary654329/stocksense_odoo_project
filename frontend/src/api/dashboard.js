import { request } from './client';

export const dashboardApi = {
    getMetrics: () => request('/dashboard'),
};
