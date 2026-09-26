export const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

export const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export const statusTone = (status) => {
    const map = {
        DRAFT: 'neutral',
        READY: 'positive',
        WAITING: 'warning',
        DONE: 'success',
        CANCELLED: 'muted',
    };

    return map[status] || 'neutral';
};
