import { useEffect, useEffectEvent, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { productsApi } from '../api/products';
import { receiptsApi } from '../api/receipts';
import { warehousesApi } from '../api/warehouses';
import Modal from '../components/Modal';
import OperationKanban from '../components/OperationKanban';
import StatusBadge from '../components/StatusBadge';
import ViewToggle from '../components/ViewToggle';
import { formatDate } from '../utils/format';
import { emitToast } from '../utils/notify';

const emptyForm = { warehouseId: '', contact: '', scheduledDate: '', lines: [{ productId: '', quantity: 1 }] };

export default function ReceiptsPage() {
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

    const loadReceipts = useEffectEvent(async () => {
        try {
            setLoading(true);
            const [receiptList, warehouseList, productList] = await Promise.all([
                receiptsApi.list({ search, status }),
                warehousesApi.list(),
                productsApi.list(),
            ]);
            setItems(receiptList || []);
            setWarehouses(warehouseList || []);
            setProducts(productList || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Unable to load receipts.');
        } finally {
            setLoading(false);
        }
    });

    useEffect(() => {
        const timeout = setTimeout(() => loadReceipts(), 200);
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
                throw new Error('Complete all receipt details before saving.');
            }

            if (editingId) {
                await receiptsApi.update(editingId, payload);
            } else {
                await receiptsApi.create(payload);
            }

            setIsModalOpen(false);
            setForm(emptyForm);
            emitToast(editingId ? 'Receipt updated.' : 'Receipt created.');
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to save receipt.');
            emitToast(err.message || 'Unable to save receipt.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusAction = async (receipt, nextStatus) => {
        try {
            await receiptsApi.setStatus(receipt.id || receipt._id, nextStatus);
            emitToast(nextStatus === 'READY' ? 'Receipt marked ready.' : 'Receipt completed and inventory updated.');
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to update receipt status.');
            emitToast(err.message || 'Unable to update receipt status.', 'error');
        }
    };

    const handleCancel = async (receipt) => {
        if (!window.confirm(`Cancel receipt ${receipt.reference}?`)) return;
        try {
            await receiptsApi.cancel(receipt.id || receipt._id);
            emitToast('Receipt cancelled.');
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to cancel receipt.');
            emitToast(err.message || 'Unable to cancel receipt.', 'error');
        }
    };

    const handlePrint = async (receipt) => {
        try {
            await receiptsApi.print(receipt.id || receipt._id);
        } catch (err) {
            emitToast(err.message || 'Unable to print receipt.', 'error');
        }
    };

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Stock Inflow</p>
                    <h2>Receipt Operations</h2>
                </div>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                    + Create Receipt
                </button>
            </div>

            <div className="toolbar">
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search reference (e.g. WH/IN/0001) or contact..."
                />
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="READY">READY</option>
                    <option value="DONE">DONE</option>
                    <option value="CANCELLED">CANCELLED</option>
                </select>
                <ViewToggle value={view} onChange={setView} />
            </div>

            {loading && <div className="page-state">Loading receipts...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}
            {!loading && !error && items.length === 0 && <div className="page-state">No receipts found.</div>}

            {!loading && !error && items.length > 0 && view === 'kanban' && (
                <OperationKanban
                    items={items}
                    statuses={['DRAFT', 'READY', 'DONE', 'CANCELLED']}
                    onSelect={(item) => navigate(`/receipts/${item.id || item._id}`)}
                />
            )}

            {!loading && !error && items.length > 0 && view === 'list' && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Receive From (Contact)</th>
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
                                            <Link to={`/receipts/${itemId}`} className="text-button">
                                                {item.reference}
                                            </Link>
                                        </td>
                                        <td>{item.contact || '—'}</td>
                                        <td>{item.warehouseId?.name || 'Main Warehouse'}</td>
                                        <td>{formatDate(item.scheduledDate)}</td>
                                        <td><StatusBadge status={item.status} /></td>
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
                                                {item.status === 'READY' && (
                                                    <button type="button" className="btn btn-primary btn-sm" onClick={() => handleStatusAction(item, 'DONE')}>
                                                        Validate
                                                    </button>
                                                )}
                                                {!['DONE', 'CANCELLED'].includes(item.status) && (
                                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleCancel(item)}>
                                                        Cancel
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

            {/* Receipt Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Receipt' : 'New Receipt'}>
                <form className="entity-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <label>
                            <span>Warehouse</span>
                            <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} required>
                                <option value="">Select Warehouse</option>
                                {warehouses.map((w) => (
                                    <option key={w.id || w._id} value={w.id || w._id}>{w.name} ({w.shortCode})</option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Receive From (Contact / Vendor)</span>
                            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Vendor Name" required />
                        </label>

                        <label>
                            <span>Scheduled Date</span>
                            <input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} required />
                        </label>
                    </div>

                    <div className="lines-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Products</span>
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
                            {submitting ? 'Saving...' : editingId ? 'Update Receipt' : 'Create Receipt'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
