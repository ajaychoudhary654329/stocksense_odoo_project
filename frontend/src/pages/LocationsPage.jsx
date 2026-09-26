import { useEffect, useState } from 'react';
import { locationsApi } from '../api/locations';
import { warehousesApi } from '../api/warehouses';
import Modal from '../components/Modal';

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
            } else {
                await locationsApi.create(payload);
            }

            setIsModalOpen(false);
            setForm(emptyForm);
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to save location.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Layout</p>
                    <h2>Locations</h2>
                </div>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>Add location</button>
            </div>

            {loading && <div className="page-state">Loading locations...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}
            {!loading && !error && items.length === 0 && <div className="page-state">No locations found.</div>}

            {!loading && !error && items.length > 0 && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Short Code</th>
                                <th>Warehouse</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id || item._id}>
                                    <td>{item.name}</td>
                                    <td>{item.shortCode}</td>
                                    <td>{item.warehouseId?.name || '—'}</td>
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

            <Modal open={isModalOpen} title={editingId ? 'Edit location' : 'Add location'} onClose={() => setIsModalOpen(false)}>
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
                            <span>Warehouse</span>
                            <select value={form.warehouseId} onChange={(event) => setForm((curr) => ({ ...curr, warehouseId: event.target.value }))} required>
                                <option value="">Select warehouse</option>
                                {warehouses.map((warehouse) => (
                                    <option key={warehouse.id || warehouse._id} value={warehouse.id || warehouse._id}>{warehouse.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : editingId ? 'Save changes' : 'Create location'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
