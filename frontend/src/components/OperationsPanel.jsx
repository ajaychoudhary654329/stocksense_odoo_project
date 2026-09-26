import StatusBadge from './StatusBadge';

export default function OperationsPanel({ title, items = [], actionLabel = 'View', onAction }) {
    return (
        <div className="panel-box">
            <div className="panel-header">
                <h3>{title}</h3>
            </div>
            {items.length === 0 ? (
                <div className="page-state small">No operations available.</div>
            ) : (
                <div className="stack-list">
                    {items.map((item) => (
                        <div key={item.id || item._id || item.reference} className="stack-item">
                            <div>
                                <strong>{item.reference || item.name}</strong>
                                <small>{item.contact || item.warehouseName || item.status}</small>
                            </div>
                            <div className="stack-actions">
                                {item.status && <StatusBadge status={item.status} />}
                                {onAction && (
                                    <button type="button" className="btn btn-secondary small" onClick={() => onAction(item)}>
                                        {actionLabel}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
