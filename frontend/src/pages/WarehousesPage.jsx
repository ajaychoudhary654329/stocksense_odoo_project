import { useEffect, useState } from 'react';
import { warehousesApi } from '../api/warehouses';
import Modal from '../components/Modal';

const emptyForm = { name: '', shortCode: '', address: '' };

export default function WarehousesPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let active = true;
        warehousesApi.list()
            .then((result) => {
                if (!active) return;
                setItems(result || []);
                setError('');
            })
            .catch((err) => { if (active) setError(err.message || 'Unable to load warehouses.'); })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [refreshKey]);

    const openCreateModal = () => {
        setEditingId(null);
        setForm(emptyForm);
        setIsModalOpen(true);
    };

    const openEditModal = (warehouse) => {
        setEditingId(warehouse.id || warehouse._id);
        setForm({
            name: warehouse.name || '',
            shortCode: warehouse.shortCode || '',
            address: warehouse.address || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                name: form.name.trim(),
                shortCode: form.shortCode.trim(),
                address: form.address.trim(),
            };

            if (!payload.name || !payload.shortCode) {
                throw new Error('Name and short code are required.');
            }

            if (editingId) {
                await warehousesApi.update(editingId, payload);
            } else {
                await warehousesApi.create(payload);
            }

            setIsModalOpen(false);
            setForm(emptyForm);
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to save warehouse.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Sites</p>
                    <h2>Warehouses</h2>
                </div>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>Add warehouse</button>
            </div>

            {loading && <div className="page-state">Loading warehouses...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}
            {!loading && !error && items.length === 0 && <div className="page-state">No warehouses found.</div>}

            {!loading && !error && items.length > 0 && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Short Code</th>
                                <th>Address</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id || item._id}>
                                    <td>{item.name}</td>
                                    <td>{item.shortCode}</td>
                                    <td>{item.address || '—'}</td>
                                    <td>
                                        <div className="action-group">
                                            <button type="button" className="btn btn-secondary small" onClick={() => openEditModal(item)}>Edit</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal open={isModalOpen} title={editingId ? 'Edit warehouse' : 'Add warehouse'} onClose={() => setIsModalOpen(false)}>
                <form className="entity-form" onSubmit={handleSubmit}>
                    <div className="form-grid compact">
                        <label>
                            <span>Name</span>
                            <input value={form.name} onChange={(event) => setForm((curr) => ({ ...curr, name: event.target.value }))} required />
                        </label>
                        <label>
                            <span>Short Code</span>
                            <input value={form.shortCode} onChange={(event) => setForm((curr) => ({ ...curr, shortCode: event.target.value }))} required />
                        </label>
                        <label className="full-width">
                            <span>Address</span>
                            <input value={form.address} onChange={(event) => setForm((curr) => ({ ...curr, address: event.target.value }))} />
                        </label>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : editingId ? 'Save changes' : 'Create warehouse'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
