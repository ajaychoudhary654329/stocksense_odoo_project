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
        setAdjustForm({ locationId: '', quantity: '', reason: '' });
    };

    const handleAdjustment = async (event) => {
        event.preventDefault();
        if (!adjustingItem) return;

        setSubmitting(true);
        try {
            const quantity = Number(adjustForm.quantity);
            if (!Number.isFinite(quantity) || quantity === 0) {
                throw new Error('Enter a non-zero adjustment quantity. Use a negative number to remove stock.');
            }

            await inventoryApi.adjust({
                productId: adjustingItem.productId || adjustingItem.id,
                locationId: adjustForm.locationId || undefined,
                quantity,
                reason: adjustForm.reason || 'Manual adjustment',
            });

            setAdjustingItem(null);
            setAdjustForm({ locationId: '', quantity: '', reason: '' });
            emitToast('Inventory adjustment applied.');
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
                    <p className="eyebrow">Stock</p>
                    <h2>Inventory</h2>
                </div>
            </div>

            {loading && <div className="page-state">Loading inventory...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}
            {!loading && !error && items.length === 0 && <div className="page-state">No inventory records found.</div>}

            {!loading && !error && items.length > 0 && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Locations</th>
                                <th>Unit Cost</th>
                                <th>On Hand</th>
                                <th>Reserved</th>
                                <th>Free to Use</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.productId || item.id}>
                                    <td>{item.product}</td>
                                    <td>{item.locations?.length ? item.locations.map((location) => location.location).join(', ') : 'Main Stock'}</td>
                                    <td>{formatCurrency(item.unitCost)}</td>
                                    <td>{item.onHand}</td>
                                    <td>{item.reserved}</td>
                                    <td className={item.freeToUse <= 0 ? 'stock-empty' : ''}>{item.freeToUse}</td>
                                    <td>
                                        <button type="button" className="btn btn-secondary small" onClick={() => openAdjustment(item)}>Adjust</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal open={Boolean(adjustingItem)} title={`Adjust inventory: ${adjustingItem?.product || ''}`} onClose={() => setAdjustingItem(null)}>
                <form className="entity-form" onSubmit={handleAdjustment}>
                    <div className="form-grid compact">
                        <label className="full-width">
                            <span>Location</span>
                            <select value={adjustForm.locationId} onChange={(event) => setAdjustForm((curr) => ({ ...curr, locationId: event.target.value }))}>
                                <option value="">Main Stock</option>
                                {locations.map((location) => (
                                    <option key={location.id || location._id} value={location.id || location._id}>{location.warehouseId?.shortCode || ''} {location.name}</option>
                                ))}
                            </select>
                        </label>
                        <label className="full-width">
                            <span>Adjustment quantity</span>
                            <input type="number" step="1" value={adjustForm.quantity} onChange={(event) => setAdjustForm((curr) => ({ ...curr, quantity: event.target.value }))} placeholder="Use a negative value to remove stock" required />
                        </label>
                        <label className="full-width">
                            <span>Reason</span>
                            <input value={adjustForm.reason} onChange={(event) => setAdjustForm((curr) => ({ ...curr, reason: event.target.value }))} placeholder="Cycle count, return, loss..." />
                        </label>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setAdjustingItem(null)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Apply adjustment'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
