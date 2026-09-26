import { useEffect, useState } from 'react';
import { inventoryApi } from '../api/inventory';
import { locationsApi } from '../api/locations';
import Modal from '../components/Modal';
import { formatCurrency } from '../utils/format';
import { emitToast } from '../utils/notify';

export default function InventoryPage() {
    const [items, setItems] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [adjustingItem, setAdjustingItem] = useState(null);
    const [adjustForm, setAdjustForm] = useState({ locationId: '', quantity: '', reason: '' });
    const [submitting, setSubmitting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let active = true;
        Promise.all([inventoryApi.list(), locationsApi.list()])
            .then(([result, locationList]) => {
                if (!active) return;
                setItems(result || []);
                setLocations(locationList || []);
                setError('');
            })
            .catch((err) => { if (active) setError(err.message || 'Unable to load inventory.'); })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [refreshKey]);

    const openAdjustment = (item) => {
        setAdjustingItem(item);
        setAdjustForm({ locationId: locations[0]?.id || locations[0]?._id || '', quantity: '', reason: '' });
    };

    const handleAdjustment = async (event) => {
        event.preventDefault();
        if (!adjustingItem) return;

        setSubmitting(true);
        try {
            const quantity = Number(adjustForm.quantity);
            if (!Number.isFinite(quantity) || quantity === 0) {
                throw new Error('Enter a non-zero adjustment quantity. Use a positive number to add stock, or a negative number to remove stock.');
            }

            await inventoryApi.adjust({
                productId: adjustingItem.productId || adjustingItem.id,
                locationId: adjustForm.locationId || undefined,
                quantity,
                reason: adjustForm.reason || 'Manual inventory count adjustment',
            });

            setAdjustingItem(null);
            setAdjustForm({ locationId: '', quantity: '', reason: '' });
            emitToast('Inventory adjustment successfully recorded.');
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message || 'Unable to adjust inventory.');
            emitToast(err.message || 'Unable to adjust inventory.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Stock Control</p>
                    <h2>Inventory Levels & Free to Use Stock</h2>
                </div>
            </div>

            {loading && <div className="page-state">Loading warehouse inventory...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}
            {!loading && !error && items.length === 0 && <div className="page-state">No inventory records found.</div>}

            {!loading && !error && items.length > 0 && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Storage Locations</th>
                                <th>Unit Cost</th>
                                <th>On Hand</th>
                                <th>Reserved</th>
                                <th>Free to Use</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                const freeToUse = item.freeToUse ?? Math.max(0, (item.onHand || 0) - (item.reserved || 0));
                                return (
                                    <tr key={item.productId || item.id}>
                                        <td>
                                            <strong>{item.product}</strong>
                                        </td>
                                        <td>
                                            {item.locations?.length
                                                ? item.locations.map((loc) => loc.location).join(', ')
                                                : 'Main Warehouse Stock'}
                                        </td>
                                        <td>{formatCurrency(item.unitCost)}</td>
                                        <td><strong>{item.onHand ?? 0}</strong></td>
                                        <td><span style={{ color: 'var(--warning-text)', fontWeight: 600 }}>{item.reserved ?? 0}</span></td>
                                        <td>
                                            <span className={`status-badge ${freeToUse > 0 ? 'success' : freeToUse === 0 ? 'warning' : 'muted'}`}>
                                                {freeToUse} Free
                                            </span>
                                        </td>
                                        <td>
                                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => openAdjustment(item)}>
                                                Adjust Stock
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            <Modal
                isOpen={Boolean(adjustingItem)}
                onClose={() => setAdjustingItem(null)}
                title={`Adjust Stock — ${adjustingItem?.product || 'Product'}`}
            >
                <form className="entity-form" onSubmit={handleAdjustment}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted-text)' }}>
                        Current On Hand: <strong>{adjustingItem?.onHand ?? 0}</strong> | Reserved: <strong>{adjustingItem?.reserved ?? 0}</strong>
                    </p>

                    <div className="form-grid">
                        <label>
                            <span>Location</span>
                            <select
                                value={adjustForm.locationId}
                                onChange={(e) => setAdjustForm({ ...adjustForm, locationId: e.target.value })}
                            >
                                <option value="">Default Warehouse Stock</option>
                                {locations.map((loc) => (
                                    <option key={loc.id || loc._id} value={loc.id || loc._id}>
                                        {loc.name} ({loc.shortCode})
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Quantity Adjustment (+ / -)</span>
                            <input
                                type="number"
                                value={adjustForm.quantity}
                                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                                placeholder="e.g. 10 or -5"
                                required
                            />
                        </label>
                    </div>

                    <label>
                        <span>Adjustment Reason</span>
                        <input
                            type="text"
                            value={adjustForm.reason}
                            onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                            placeholder="Physical count / damage / discrepancy"
                        />
                    </label>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setAdjustingItem(null)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Applying...' : 'Apply Adjustment'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
