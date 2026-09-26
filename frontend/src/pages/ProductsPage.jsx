import { useEffect, useEffectEvent, useState } from 'react';
import { productsApi } from '../api/products';
import Modal from '../components/Modal';
import { formatCurrency } from '../utils/format';
import { emitToast } from '../utils/notify';

const emptyForm = { code: '', name: '', unitCost: '' };

export default function ProductsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const loadProducts = useEffectEvent(async () => {
        try {
            setLoading(true);
            const result = await productsApi.list(search);
            setItems(result || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Unable to load products.');
        } finally {
            setLoading(false);
        }
    });

    useEffect(() => {
        const timeout = setTimeout(() => loadProducts(), 200);
        return () => clearTimeout(timeout);
    }, [search, refreshKey]);

    const openCreateModal = () => {
        setEditingId(null);
        setForm(emptyForm);
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        setEditingId(product.id || product._id);
        setForm({
            code: product.code || '',
            name: product.name || '',
            unitCost: product.unitCost ?? '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                code: form.code.trim(),
                name: form.name.trim(),
                unitCost: Number(form.unitCost),
            };

            if (!payload.code || !payload.name || Number.isNaN(payload.unitCost)) {
                throw new Error('Code, name, and unit cost are required.');
            }

            if (editingId) {
                await productsApi.update(editingId, payload);
                emitToast('Product updated successfully.');
            } else {
                await productsApi.create(payload);
                emitToast('Product created successfully.');
            }

            setIsModalOpen(false);
            setForm(emptyForm);
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to save product.');
            emitToast(err.message || 'Unable to save product.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (product) => {
        if (!window.confirm(`Are you sure you want to delete ${product.name}?`)) return;

        try {
            await productsApi.remove(product.id || product._id);
            emitToast('Product deleted.');
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to delete product.');
            emitToast(err.message || 'Unable to delete product.', 'error');
        }
    };

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Master Data</p>
                    <h2>Product Catalog</h2>
                </div>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                    + Add New Product
                </button>
            </div>

            <div className="toolbar">
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by code (e.g. DESK001) or name..."
                />
            </div>

            {loading && <div className="page-state">Loading products...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}
            {!loading && !error && items.length === 0 && <div className="page-state">No products found.</div>}

            {!loading && !error && items.length > 0 && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>SKU / Code</th>
                                <th>Product Name</th>
                                <th>Unit Cost</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id || item._id}>
                                    <td><strong>[{item.code}]</strong></td>
                                    <td>{item.name}</td>
                                    <td>{formatCurrency(item.unitCost)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEditModal(item)}>
                                                Edit
                                            </button>
                                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(item)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Product Form Modal */}
            <Modal isOpen={isModalOpen} title={editingId ? 'Edit Product' : 'Add New Product'} onClose={() => setIsModalOpen(false)}>
                <form className="entity-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <label>
                            <span>Product SKU / Code</span>
                            <input
                                value={form.code}
                                onChange={(event) => setForm((curr) => ({ ...curr, code: event.target.value }))}
                                placeholder="e.g. DESK001"
                                required
                            />
                        </label>
                        <label>
                            <span>Product Name</span>
                            <input
                                value={form.name}
                                onChange={(event) => setForm((curr) => ({ ...curr, name: event.target.value }))}
                                placeholder="e.g. Standing Executive Desk"
                                required
                            />
                        </label>
                    </div>

                    <label>
                        <span>Unit Cost</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.unitCost}
                            onChange={(event) => setForm((curr) => ({ ...curr, unitCost: event.target.value }))}
                            placeholder="0.00"
                            required
                        />
                    </label>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
