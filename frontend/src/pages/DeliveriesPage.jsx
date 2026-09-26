import { useEffect, useEffectEvent, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { deliveriesApi } from '../api/deliveries';
import { productsApi } from '../api/products';
import { warehousesApi } from '../api/warehouses';
import Modal from '../components/Modal';
import OperationKanban from '../components/OperationKanban';
import StatusBadge from '../components/StatusBadge';
import ViewToggle from '../components/ViewToggle';
import { formatDate } from '../utils/format';
import { emitToast } from '../utils/notify';

const emptyForm = { warehouseId: '', contact: '', scheduledDate: '', lines: [{ productId: '', quantity: 1 }] };

export default function DeliveriesPage() {
    const navigate = useNavigate();
    const { user } = useOutletContext();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [view, setView] = useState('list');
    const [refreshKey, setRefreshKey] = useState(0);

    const loadDeliveries = useEffectEvent(async () => {
        try {
            setLoading(true);
            const [deliveryList, warehouseList, productList] = await Promise.all([
                deliveriesApi.list({ search, status }),
                warehousesApi.list(),
                productsApi.list(),
            ]);
            setItems(deliveryList || []);
            setWarehouses(warehouseList || []);
            setProducts(productList || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Unable to load deliveries.');
        } finally {
            setLoading(false);
        }
    });

    useEffect(() => {
        const timeout = setTimeout(() => loadDeliveries(), 200);
        return () => clearTimeout(timeout);
    }, [search, status, refreshKey]);

    const openCreateModal = () => {
        setEditingId(null);
        setForm({
            warehouseId: warehouses[0]?.id || warehouses[0]?._id || '',
            contact: '',
            scheduledDate: new Date().toISOString().slice(0, 10),
            lines: [{ productId: products[0]?.id || products[0]?._id || '', quantity: 1 }],
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingId(item.id || item._id);
        setForm({
            warehouseId: item.warehouseId?.id || item.warehouseId?._id || '',
            contact: item.contact || '',
            scheduledDate: item.scheduledDate ? new Date(item.scheduledDate).toISOString().slice(0, 10) : '',
            lines: (item.lines || []).map((line) => ({
                productId: line.productId?.id || line.productId?._id || '',
                quantity: line.quantity || 1,
            })),
        });
        setIsModalOpen(true);
    };

    const updateLine = (index, field, value) => {
        setForm((current) => ({
            ...current,
            lines: current.lines.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value } : line),
        }));
    };

    const addLine = () => {
        setForm((current) => ({
            ...current,
            lines: [...current.lines, { productId: products[0]?.id || products[0]?._id || '', quantity: 1 }],
        }));
    };

    const removeLine = (index) => {
        setForm((current) => ({
            ...current,
            lines: current.lines.filter((_, lineIndex) => lineIndex !== index),
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                warehouseId: form.warehouseId,
                contact: form.contact.trim(),
                scheduledDate: form.scheduledDate,
                responsibleUserId: user?.id,
                lines: form.lines.filter((line) => line.productId).map((line) => ({
                    productId: line.productId,
                    quantity: Number(line.quantity),
                })),
            };

            if (!payload.warehouseId || !payload.contact || !payload.scheduledDate || payload.lines.length === 0) {
                throw new Error('Complete all delivery details before saving.');
            }

            if (editingId) {
                await deliveriesApi.update(editingId, payload);
            } else {
                await deliveriesApi.create(payload);
            }

            setIsModalOpen(false);
            setForm(emptyForm);
            emitToast(editingId ? 'Delivery updated.' : 'Delivery created.');
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to save delivery.');
            emitToast(err.message || 'Unable to save delivery.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusAction = async (delivery, nextStatus) => {
        try {
            await deliveriesApi.setStatus(delivery.id || delivery._id, nextStatus);
            emitToast(nextStatus === 'READY' ? 'Delivery marked ready.' : 'Delivery completed and stock deducted.');
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to update delivery status.');
            emitToast(err.message || 'Unable to update delivery status.', 'error');
        }
    };

    const handlePrint = async (delivery) => {
        try {
            await deliveriesApi.print(delivery.id || delivery._id);
        } catch (err) {
            emitToast(err.message || 'Unable to print delivery slip.', 'error');
        }
    };

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Stock Outflow</p>
                    <h2>Delivery Operations</h2>
                </div>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                    + Create Delivery Order
                </button>
            </div>

            <div className="toolbar">
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search reference (e.g. WH/OUT/0001) or address..."
                />
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="WAITING">WAITING (Stock Shortage)</option>
                    <option value="READY">READY</option>
                    <option value="DONE">DONE</option>
                    <option value="CANCELLED">CANCELLED</option>
                </select>
                <ViewToggle value={view} onChange={setView} />
            </div>

            {loading && <div className="page-state">Loading deliveries...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}
            {!loading && !error && items.length === 0 && <div className="page-state">No deliveries found.</div>}

            {!loading && !error && items.length > 0 && view === 'kanban' && (
                <OperationKanban
                    items={items}
                    statuses={['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELLED']}
                    onSelect={(item) => navigate(`/deliveries/${item.id || item._id}`)}
                />
            )}

            {!loading && !error && items.length > 0 && view === 'list' && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Delivery Address / Contact</th>
                                <th>Warehouse</th>
                                <th>Scheduled Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                const itemId = item.id || item._id;
                                return (
                                    <tr key={itemId}>
                                        <td>
                                            <Link to={`/deliveries/${itemId}`} className="text-button">
                                                {item.reference}
                                            </Link>
                                        </td>
                                        <td>{item.contact || '—'}</td>
                                        <td>{item.warehouseId?.name || 'Main Warehouse'}</td>
                                        <td>{formatDate(item.scheduledDate)}</td>
                                        <td>
                                            <StatusBadge status={item.status} />
                                            {item.status === 'WAITING' && (
                                                <small style={{ display: 'block', color: 'var(--warning-text)', fontWeight: 600, marginTop: '2px' }}>
                                                    Stock Shortage
                                                </small>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {item.status === 'DRAFT' && (
                                                    <>
                                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleStatusAction(item, 'READY')}>
                                                            Mark Ready
                                                        </button>
                                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEditModal(item)}>
                                                            Edit
                                                        </button>
                                                    </>
                                                )}
                                                {item.status === 'WAITING' && (
                                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleStatusAction(item, 'READY')}>
                                                        Check Stock
                                                    </button>
                                                )}
                                                {item.status === 'READY' && (
                                                    <button type="button" className="btn btn-primary btn-sm" onClick={() => handleStatusAction(item, 'DONE')}>
                                                        Validate
                                                    </button>
                                                )}
                                                {item.status === 'DONE' && (
                                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handlePrint(item)}>
                                                        Print
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delivery Order Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Delivery Order' : 'New Delivery Order'}>
                <form className="entity-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <label>
                            <span>Source Warehouse</span>
                            <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} required>
                                <option value="">Select Warehouse</option>
                                {warehouses.map((w) => (
                                    <option key={w.id || w._id} value={w.id || w._id}>{w.name} ({w.shortCode})</option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Delivery Address / Contact</span>
                            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Customer / Destination" required />
                        </label>

                        <label>
                            <span>Scheduled Date</span>
                            <input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} required />
                        </label>
                    </div>

                    <div className="lines-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Requested Products</span>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>+ Add Line</button>
                        </div>

                        {form.lines.map((line, index) => (
                            <div key={index} className="line-row">
                                <select value={line.productId} onChange={(e) => updateLine(index, 'productId', e.target.value)} required>
                                    <option value="">Select Product</option>
                                    {products.map((p) => (
                                        <option key={p.id || p._id} value={p.id || p._id}>[{p.code}] {p.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    min="1"
                                    value={line.quantity}
                                    onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                                    placeholder="Qty"
                                    required
                                />
                                {form.lines.length > 1 && (
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeLine(index)}>✕</button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Saving...' : editingId ? 'Update Delivery' : 'Create Delivery'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
