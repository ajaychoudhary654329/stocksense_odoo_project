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
                    <p className="eyebrow">Traceability</p>
                    <h2>Move history</h2>
                </div>
            </div>

            <div className="toolbar">
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by reference or contact"
                />
                <select value={type} onChange={(event) => setType(event.target.value)}>
                    <option value="">All types</option>
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                    <option value="ADJUSTMENT">ADJUSTMENT</option>
                </select>
                <ViewToggle value={view} onChange={setView} />
            </div>

            {loading && <div className="page-state">Loading move history...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}
            {!loading && !error && items.length === 0 && <div className="page-state">No stock moves found.</div>}

            {!loading && !error && items.length > 0 && view === 'kanban' && (
                <OperationKanban items={items} statuses={['DONE']} onSelect={(item) => setDetailId(item.id || item._id)} />
            )}

            {!loading && !error && items.length > 0 && view === 'list' && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id || item._id} className={`move-row ${item.type === 'IN' ? 'move-in' : item.type === 'OUT' ? 'move-out' : 'move-adjustment'}`}>
                                    <td><button type="button" className="text-button" onClick={() => setDetailId(item.id || item._id)}>{item.reference}</button></td>
                                    <td>{item.contact || '—'}</td>
                                    <td><StatusBadge status={item.status} /></td>
                                    <td>{formatDate(item.date || item.createdAt)}</td>
                                    <td>{item.from || '—'}</td>
                                    <td>{item.to || '—'}</td>
                                    <td>{item.product || '—'}</td>
                                    <td>{item.quantity}</td>
                                    <td><span className={`movement-type ${item.type === 'IN' ? 'in' : item.type === 'OUT' ? 'out' : 'adjust'}`}>{item.type}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <MoveDetailsModal open={Boolean(detailId)} id={detailId} onClose={() => setDetailId(null)} />
        </div>
    );
}
