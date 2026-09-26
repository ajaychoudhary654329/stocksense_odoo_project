import { useEffect, useEffectEvent, useState } from 'react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
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
    const [searchParams] = useSearchParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState(() => searchParams.get('status') || '');
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [view, setView] = useState('list');
    const [shortage, setShortage] = useState(null);
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
            const result = await deliveriesApi.setStatus(delivery.id || delivery._id, nextStatus);
            if (result?.status === 'WAITING' && result.warnings?.length) {
                setShortage({ reference: delivery.reference, warnings: result.warnings });
                emitToast('Delivery is waiting for available stock.', 'warning');
            } else {
                emitToast(nextStatus === 'READY' ? 'Delivery marked ready.' : 'Delivery completed.');
            }
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to update delivery status.');
            if (err.payload?.error?.warnings?.length) {
                setShortage({ reference: delivery.reference, warnings: err.payload.error.warnings });
            }
            emitToast(err.message || 'Unable to update delivery status.', 'error');
        }
    };

    const handleCancel = async (delivery) => {
        if (!window.confirm('Cancel this delivery?')) return;
        try {
            await deliveriesApi.cancel(delivery.id || delivery._id);
            emitToast('Delivery cancelled.');
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to cancel delivery.');
            emitToast(err.message || 'Unable to cancel delivery.', 'error');
        }
    };

    const handlePrint = async (delivery) => {
        try {
            await deliveriesApi.print(delivery.id || delivery._id);
        } catch (err) {
            emitToast(err.message || 'Unable to print delivery.', 'error');
        }
    };

    const productName = (productId) => {
        const product = products.find((item) => (item.id || item._id) === String(productId));
        return product ? `[${product.code}] ${product.name}` : String(productId);
    };

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Operations</p>
                    <h2>Deliveries</h2>
                </div>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>New delivery</button>
            </div>

            <div className="toolbar">
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by reference or contact"
                />
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">All statuses</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="READY">READY</option>
                    <option value="WAITING">WAITING</option>
                    <option value="DONE">DONE</option>
                    <option value="CANCELLED">CANCELLED</option>
                </select>
                <ViewToggle value={view} onChange={setView} />
            </div>

            {loading && <div className="page-state">Loading deliveries...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}
            {!loading && !error && items.length === 0 && <div className="page-state">No deliveries found.</div>}

            {!loading && !error && items.length > 0 && view === 'kanban' && (
                <OperationKanban items={items} statuses={['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELLED']} onSelect={(item) => navigate(`/deliveries/${item.id || item._id}`)} />
            )}

            {!loading && !error && items.length > 0 && view === 'list' && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Contact</th>
                                <th>Warehouse</th>
                                <th>Schedule Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id || item._id}>
                                    <td><Link className="text-button" to={`/deliveries/${item.id || item._id}`}>{item.reference}</Link></td>
                                    <td>{item.contact}</td>
                                    <td>{item.warehouseId?.name || '—'}</td>
                                    <td className={new Date(item.scheduledDate) < new Date(new Date().setHours(0, 0, 0, 0)) && !['DONE', 'CANCELLED'].includes(item.status) ? 'late-date' : ''}>{formatDate(item.scheduledDate)}</td>
                                    <td><StatusBadge status={item.status} /></td>
                                    <td>
                                        <div className="action-group">
                                            {(item.status === 'DRAFT' || item.status === 'WAITING') && <button type="button" className="btn btn-secondary small" onClick={() => openEditModal(item)}>Edit</button>}
                                            {item.status === 'DRAFT' && <button type="button" className="btn btn-primary small" onClick={() => handleStatusAction(item, 'READY')}>To Do</button>}
                                            {item.status === 'WAITING' && <button type="button" className="btn btn-primary small" onClick={() => handleStatusAction(item, 'READY')}>To Do</button>}
                                            {item.status === 'READY' && <button type="button" className="btn btn-primary small" onClick={() => handleStatusAction(item, 'DONE')}>Validate</button>}
                                            {item.status !== 'CANCELLED' && item.status !== 'DONE' && <button type="button" className="btn btn-danger small" onClick={() => handleCancel(item)}>Cancel</button>}
                                            {item.status === 'DONE' && <button type="button" className="btn btn-secondary small" onClick={() => handlePrint(item)}>Print</button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal open={isModalOpen} title={editingId ? 'Edit delivery' : 'Create delivery'} onClose={() => setIsModalOpen(false)}>
                <form className="entity-form" onSubmit={handleSubmit}>
                    <div className="form-grid compact">
                        <label>
                            <span>Warehouse</span>
                            <select value={form.warehouseId} onChange={(event) => setForm((current) => ({ ...current, warehouseId: event.target.value }))} required>
                                <option value="">Select warehouse</option>
                                {warehouses.map((warehouse) => (
                                    <option key={warehouse.id || warehouse._id} value={warehouse.id || warehouse._id}>{warehouse.name}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <span>Delivery Address</span>
                            <input value={form.contact} onChange={(event) => setForm((current) => ({ ...current, contact: event.target.value }))} required />
                        </label>
                        <label className="full-width">
                            <span>Schedule date</span>
                            <input type="date" value={form.scheduledDate} onChange={(event) => setForm((current) => ({ ...current, scheduledDate: event.target.value }))} required />
                        </label>
                        <label className="full-width">
                            <span>Responsible</span>
                            <input value={user?.loginId || ''} readOnly />
                        </label>
                    </div>

                    <div className="line-list">
                        <div className="inline-heading">
                            <strong>Products</strong>
                            <button type="button" className="btn btn-secondary small" onClick={addLine}>Add line</button>
                        </div>

                        {form.lines.map((line, index) => (
                            <div key={`${index}-line`} className="line-row">
                                <select value={line.productId} onChange={(event) => updateLine(index, 'productId', event.target.value)} required>
                                    <option value="">Select product</option>
                                    {products.map((product) => (
                                        <option key={product.id || product._id} value={product.id || product._id}>{product.name}</option>
                                    ))}
                                </select>
                                <input type="number" min="1" value={line.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} required />
                                {form.lines.length > 1 && <button type="button" className="btn btn-danger small" onClick={() => removeLine(index)}>Remove</button>}
                            </div>
                        ))}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : editingId ? 'Save changes' : 'Create delivery'}</button>
                    </div>
                </form>
            </Modal>
            <Modal open={Boolean(shortage)} title={`Stock shortage${shortage?.reference ? `: ${shortage.reference}` : ''}`} onClose={() => setShortage(null)}>
                {shortage && (
                    <div className="shortage-list">
                        <p>This delivery is waiting for stock. Quantities below are unavailable now.</p>
                        {shortage.warnings.map((warning) => (
                            <div className="shortage-row" key={warning.productId}>
                                <strong>{productName(warning.productId)}</strong>
                                <span>Requested {warning.requested}</span>
                                <span>Available {warning.available}</span>
                                <b>Short {warning.shortage}</b>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}
