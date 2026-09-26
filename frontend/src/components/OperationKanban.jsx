import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/format';

export default function OperationKanban({ items, statuses, onSelect }) {
    return (
        <div className="kanban-board">
            {statuses.map((status) => {
                const matchingItems = items.filter((item) => item.status === status);
                return (
                    <section className="kanban-column" key={status}>
                        <header>
                            <h3>{status}</h3>
                            <span>{matchingItems.length}</span>
                        </header>
                        <div className="kanban-cards">
                            {matchingItems.length === 0 ? <p className="kanban-empty">No operations</p> : matchingItems.map((item) => (
                                <button type="button" className="operation-card" key={item.id || item._id} onClick={() => onSelect(item)}>
                                    <span className="operation-card-top">
                                        <strong>{item.reference}</strong>
                                        <StatusBadge status={item.status} />
                                    </span>
                                    <span>{item.contact || '—'}</span>
                                    <span>{item.warehouseId?.name || item.to || '—'}</span>
                                    <small>{formatDate(item.scheduledDate || item.date || item.createdAt)}</small>
                                </button>
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}