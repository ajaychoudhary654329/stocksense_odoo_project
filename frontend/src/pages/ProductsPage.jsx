import { useEffect, useEffectEvent, useState } from 'react';
import { productsApi } from '../api/products';
import Modal from '../components/Modal';
import { formatCurrency } from '../utils/format';

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
            } else {
                await productsApi.create(payload);
            }

            setIsModalOpen(false);
            setForm(emptyForm);
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to save product.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (product) => {
        if (!window.confirm(`Delete ${product.name}?`)) return;

        try {
            await productsApi.remove(product.id || product._id);
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to delete product.');
        }
    };

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Catalog</p>
                    <h2>Products</h2>
                </div>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>Add product</button>
            </div>

            <div className="toolbar">
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products"
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
                                <th>Code</th>
                                <th>Name</th>
                                <th>Unit Cost</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id || item._id}>
                                    <td>{item.code}</td>
                                    <td>{item.name}</td>
                                    <td>{formatCurrency(item.unitCost)}</td>
                                    <td>
                                        <div className="action-group">
                                            <button type="button" className="btn btn-secondary small" onClick={() => openEditModal(item)}>Edit</button>
                                            <button type="button" className="btn btn-danger small" onClick={() => handleDelete(item)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal open={isModalOpen} title={editingId ? 'Edit product' : 'Add product'} onClose={() => setIsModalOpen(false)}>
                <form className="entity-form" onSubmit={handleSubmit}>
                    <div className="form-grid compact">
                        <label>
                            <span>Code</span>
                            <input value={form.code} onChange={(event) => setForm((curr) => ({ ...curr, code: event.target.value }))} required />
                        </label>
                        <label>
                            <span>Name</span>
                            <input value={form.name} onChange={(event) => setForm((curr) => ({ ...curr, name: event.target.value }))} required />
                        </label>
                        <label className="full-width">
                            <span>Unit Cost</span>
                            <input type="number" min="0" step="0.01" value={form.unitCost} onChange={(event) => setForm((curr) => ({ ...curr, unitCost: event.target.value }))} required />
                        </label>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : editingId ? 'Save changes' : 'Create product'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
