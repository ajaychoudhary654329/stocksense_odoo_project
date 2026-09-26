import { useEffect, useState } from 'react';
import { warehousesApi } from '../api/warehouses';
import Modal from '../components/Modal';
import { emitToast } from '../utils/notify';

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
                emitToast('Warehouse updated.');
            } else {
                await warehousesApi.create(payload);
                emitToast('Warehouse created.');
            }

            setIsModalOpen(false);
            setForm(emptyForm);
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to save warehouse.');
            emitToast(err.message || 'Unable to save warehouse.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Sites & Distribution</p>
                    <h2>Warehouses</h2>
                </div>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                    + Add Warehouse
                </button>
            </div>

            {loading && <div className="page-state">Loading warehouses...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}
            {!loading && !error && items.length === 0 && <div className="page-state">No warehouses configured.</div>}

            {!loading && !error && items.length > 0 && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Warehouse Name</th>
                                <th>Short Code</th>
                                <th>Address</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id || item._id}>
                                    <td><strong>{item.name}</strong></td>
                                    <td><span className="movement-type adjust">{item.shortCode}</span></td>
                                    <td>{item.address || '—'}</td>
                                    <td>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEditModal(item)}>
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Warehouse Form Modal */}
            <Modal isOpen={isModalOpen} title={editingId ? 'Edit Warehouse' : 'Add Warehouse'} onClose={() => setIsModalOpen(false)}>
                <form className="entity-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <label>
                            <span>Warehouse Name</span>
                            <input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Main Warehouse"
                                required
                            />
                        </label>
                        <label>
                            <span>Short Code</span>
                            <input
                                value={form.shortCode}
                                onChange={(e) => setForm({ ...form, shortCode: e.target.value })}
                                placeholder="e.g. WH"
                                required
                            />
                        </label>
                    </div>

                    <label>
                        <span>Address</span>
                        <input
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            placeholder="Physical address"
                        />
                    </label>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Warehouse'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
