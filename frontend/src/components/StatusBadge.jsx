export default function StatusBadge({ status }) {
    const tone = {
        DRAFT: 'neutral',
        READY: 'positive',
        WAITING: 'warning',
        DONE: 'success',
        CANCELLED: 'muted',
    }[status] || 'neutral';

    return <span className={`status-badge ${tone}`}>{status}</span>;
}
