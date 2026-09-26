import { useEffect, useEffectEvent, useState } from 'react';
import { movesApi } from '../api/moves';
import MoveDetailsModal from '../components/MoveDetailsModal';
import OperationKanban from '../components/OperationKanban';
import StatusBadge from '../components/StatusBadge';
import ViewToggle from '../components/ViewToggle';
import { formatDate } from '../utils/format';

export default function MovesPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [view, setView] = useState('list');
    const [detailId, setDetailId] = useState(null);

    const loadMoves = useEffectEvent(async () => {
        try {
            setLoading(true);
            const result = await movesApi.list({ search, type });
            setItems(result || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Unable to load move history.');
        } finally {
            setLoading(false);
        }
    });

    useEffect(() => {
        const timeout = setTimeout(() => loadMoves(), 200);
        return () => clearTimeout(timeout);
    }, [search, type]);

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Inventory Audit & Traceability</p>
                    <h2>Stock Move History</h2>
                </div>
            </div>

            <div className="toolbar">
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by reference, contact or product..."
                />
                <select value={type} onChange={(event) => setType(event.target.value)}>
                    <option value="">All Movement Types</option>
                    <option value="IN">IN (Incoming Stock)</option>
                    <option value="OUT">OUT (Outgoing Deliveries)</option>
                    <option value="ADJUSTMENT">ADJUSTMENT</option>
                </select>
                <ViewToggle value={view} onChange={setView} />
            </div>

            {loading && <div className="page-state">Loading move history...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}
            {!loading && !error && items.length === 0 && <div className="page-state">No stock moves recorded.</div>}

            {!loading && !error && items.length > 0 && view === 'kanban' && (
                <OperationKanban items={items} statuses={['DONE']} onSelect={(item) => setDetailId(item.id || item._id)} />
            )}

            {!loading && !error && items.length > 0 && view === 'list' && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Movement Reference</th>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Product</th>
                                <th>From Location</th>
                                <th>To Location</th>
                                <th>Quantity</th>
                                <th>Contact</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr
                                    key={item.id || item._id}
                                    className={`move-row ${item.type === 'IN' ? 'move-in' : item.type === 'OUT' ? 'move-out' : 'move-adjustment'}`}
                                >
                                    <td>
                                        <button
                                            type="button"
                                            className="text-button"
                                            onClick={() => setDetailId(item.id || item._id)}
                                        >
                                            {item.reference}
                                        </button>
                                    </td>
                                    <td>{formatDate(item.date || item.createdAt)}</td>
                                    <td>
                                        <span className={`movement-type ${item.type === 'IN' ? 'in' : item.type === 'OUT' ? 'out' : 'adjust'}`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td><strong>{item.product || '—'}</strong></td>
                                    <td>{item.from || '—'}</td>
                                    <td>{item.to || '—'}</td>
                                    <td><strong>{item.quantity}</strong></td>
                                    <td>{item.contact || '—'}</td>
                                    <td><StatusBadge status={item.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Move Details Modal */}
            <MoveDetailsModal id={detailId} onClose={() => setDetailId(null)} />
        </div>
    );
}
