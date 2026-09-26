import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { deliveriesApi } from '../api/deliveries';
import { receiptsApi } from '../api/receipts';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/format';

export default function OperationDetailPage({ type }) {
    const { id } = useParams();
    const [response, setResponse] = useState({ id: null, item: null, error: '' });
    const isReceipt = type === 'receipt';
    const api = isReceipt ? receiptsApi : deliveriesApi;
    const title = isReceipt ? 'Receipt' : 'Delivery';

    useEffect(() => {
        let active = true;
        api.getById(id)
            .then((result) => { if (active) setResponse({ id, item: result, error: '' }); })
            .catch((requestError) => { if (active) setResponse({ id, item: null, error: requestError.message || `Unable to load ${title.toLowerCase()}.` }); });

        return () => { active = false; };
    }, [api, id, title]);

    const item = response.id === id ? response.item : null;
    const error = response.id === id ? response.error : '';
    const loading = response.id !== id;

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">{title} details</p>
                    <h2>{item?.reference || title}</h2>
                </div>
                <Link to={isReceipt ? '/receipts' : '/deliveries'} className="btn btn-secondary">Back to {isReceipt ? 'receipts' : 'deliveries'}</Link>
            </div>

            {loading && <div className="page-state">Loading {title.toLowerCase()}...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}
            {!loading && !error && item && (
                <>
                    <section className="operation-summary">
                        <div><small>Contact</small><strong>{item.contact || '—'}</strong></div>
                        <div><small>Warehouse</small><strong>{item.warehouseId?.name || '—'}</strong></div>
                        <div><small>Schedule date</small><strong>{formatDate(item.scheduledDate)}</strong></div>
                        <div><small>Responsible</small><strong>{item.responsibleUserId?.loginId || '—'}</strong></div>
                        <div><small>Status</small><StatusBadge status={item.status} /></div>
                    </section>

                    <section className="operation-lines">
                        <h3>Products</h3>
                        {(item.lines || []).length === 0 ? <div className="page-state">No products on this operation.</div> : (
                            <div className="table-wrap">
                                <table>
                                    <thead><tr><th>Product</th><th>Code</th><th>Quantity</th></tr></thead>
                                    <tbody>
                                        {item.lines.map((line, index) => {
                                            const product = typeof line.productId === 'object' ? line.productId : null;
                                            return (
                                                <tr key={`${product?.id || line.productId}-${index}`}>
                                                    <td>{product?.name || 'Product'}</td>
                                                    <td>{product?.code || '—'}</td>
                                                    <td>{line.quantity}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}