import { useEffect, useState } from 'react';
import { locationsApi } from '../api/locations';
import { warehousesApi } from '../api/warehouses';
import Modal from '../components/Modal';
import { emitToast } from '../utils/notify';

const emptyForm = { name: '', shortCode: '', warehouseId: '' };

export default function LocationsPage() {
    const [items, setItems] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let active = true;
        Promise.all([locationsApi.list(), warehousesApi.list()])
            .then(([locations, warehouseList]) => {
                if (!active) return;
                setItems(locations || []);
                setWarehouses(warehouseList || []);
                setError('');
            })
            .catch((err) => { if (active) setError(err.message || 'Unable to load locations.'); })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [refreshKey]);

    const openCreateModal = () => {
        setEditingId(null);
        setForm({ ...emptyForm, warehouseId: warehouses[0]?.id || warehouses[0]?._id || '' });
        setIsModalOpen(true);
    };

    const openEditModal = (location) => {
        setEditingId(location.id || location._id);
        setForm({
            name: location.name || '',
            shortCode: location.shortCode || '',
            warehouseId: location.warehouseId?.id || location.warehouseId?._id || '',
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
                warehouseId: form.warehouseId,
            };

            if (!payload.name || !payload.shortCode || !payload.warehouseId) {
                throw new Error('Name, short code, and warehouse are required.');
            }

            if (editingId) {
                await locationsApi.update(editingId, payload);
                emitToast('Location updated.');
            } else {
                await locationsApi.create(payload);
                emitToast('Location created.');
            }

            setIsModalOpen(false);
            setForm(emptyForm);
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to save location.');
            emitToast(err.message || 'Unable to save location.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Internal Storage Layout</p>
                    <h2>Stock Locations</h2>
                </div>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                    + Add Location
                </button>
            </div>

            {loading && <div className="page-state">Loading stock locations...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}
            {!loading && !error && items.length === 0 && <div className="page-state">No locations configured.</div>}

            {!loading && !error && items.length > 0 && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Location Name</th>
                                <th>Short Code</th>
                                <th>Parent Warehouse</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id || item._id}>
                                    <td><strong>{item.name}</strong></td>
                                    <td><span className="movement-type adjust">{item.shortCode}</span></td>
                                    <td>{item.warehouseId?.name || '—'}</td>
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

            {/* Location Form Modal */}
            <Modal isOpen={isModalOpen} title={editingId ? 'Edit Location' : 'Add Location'} onClose={() => setIsModalOpen(false)}>
                <form className="entity-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <label>
                            <span>Location Name</span>
                            <input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Rack A / Shelf 2"
                                required
                            />
                        </label>
                        <label>
                            <span>Short Code</span>
                            <input
                                value={form.shortCode}
                                onChange={(e) => setForm({ ...form, shortCode: e.target.value })}
                                placeholder="e.g. Stock1"
                                required
                            />
                        </label>
                    </div>

                    <label>
                        <span>Parent Warehouse</span>
                        <select
                            value={form.warehouseId}
                            onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                            required
                        >
                            <option value="">Select Warehouse</option>
                            {warehouses.map((w) => (
                                <option key={w.id || w._id} value={w.id || w._id}>
                                    {w.name} ({w.shortCode})
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Location'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
