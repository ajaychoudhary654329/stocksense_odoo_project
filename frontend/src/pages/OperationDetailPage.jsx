import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { deliveriesApi } from '../api/deliveries';
import { receiptsApi } from '../api/receipts';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/format';
import { emitToast } from '../utils/notify';

export default function OperationDetailPage({ type }) {
    const { id } = useParams();
    const [response, setResponse] = useState({ id: null, item: null, error: '' });
    const [actionLoading, setActionLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const isReceipt = type === 'receipt';
    const api = isReceipt ? receiptsApi : deliveriesApi;
    const title = isReceipt ? 'Receipt' : 'Delivery';

    useEffect(() => {
        let active = true;
        api.getById(id)
            .then((result) => { if (active) setResponse({ id, item: result, error: '' }); })
            .catch((requestError) => { if (active) setResponse({ id, item: null, error: requestError.message || `Unable to load ${title.toLowerCase()}.` }); });

        return () => { active = false; };
    }, [api, id, title, refreshKey]);

    const item = response.id === id ? response.item : null;
    const error = response.id === id ? response.error : '';
    const loading = response.id !== id;

    const handleSetStatus = async (nextStatus) => {
        try {
            setActionLoading(true);
            await api.setStatus(id, nextStatus);
            emitToast(`${title} status updated to ${nextStatus}.`);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            emitToast(err.message || 'Unable to update status.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        try {
            setActionLoading(true);
            await api.cancel(id);
            emitToast(`${title} cancelled.`);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            emitToast(err.message || 'Unable to cancel operation.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePrint = async () => {
        try {
            await api.print(id);
        } catch (err) {
            emitToast(err.message || 'Unable to print document.', 'error');
        }
    };

    // Determine status pipeline steps
    const steps = isReceipt
        ? ['DRAFT', 'READY', 'DONE']
        : ['DRAFT', 'WAITING', 'READY', 'DONE'];

    const currentStatusIndex = item ? steps.indexOf(item.status) : -1;

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">{title} Details</p>
                    <h2>{item?.reference || title}</h2>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to={isReceipt ? '/receipts' : '/deliveries'} className="btn btn-secondary">
                        Back to {isReceipt ? 'Receipts' : 'Deliveries'}
                    </Link>
                </div>
            </div>

            {loading && <div className="page-state">Loading {title.toLowerCase()} details...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}

            {!loading && !error && item && (
                <>
                    {/* Stepper Pipeline */}
                    <div className="stepper-container">
                        {item.status === 'CANCELLED' ? (
                            <div className="status-badge muted" style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
                                Operation Cancelled
                            </div>
                        ) : (
                            steps.map((step, idx) => {
                                const isCompleted = idx < currentStatusIndex;
                                const isActive = idx === currentStatusIndex;
                                return (
                                    <div key={step} style={{ display: 'contents' }}>
                                        <div className={`stepper-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                            <span className="stepper-badge">{idx + 1}</span>
                                            <span>{step}</span>
                                        </div>
                                        {idx < steps.length - 1 && (
                                            <div className={`stepper-line ${idx < currentStatusIndex ? 'active' : ''}`} />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'white', padding: '16px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-sm)' }}>
                        {item.status === 'DRAFT' && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => handleSetStatus('READY')}
                                disabled={actionLoading}
                            >
                                Mark as Todo (Ready)
                            </button>
                        )}

                        {item.status === 'WAITING' && !isReceipt && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => handleSetStatus('READY')}
                                disabled={actionLoading}
                            >
                                Re-check Stock & Mark Ready
                            </button>
                        )}

                        {item.status === 'READY' && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => handleSetStatus('DONE')}
                                disabled={actionLoading}
                            >
                                Validate ({title} Complete)
                            </button>
                        )}

                        {item.status === 'DONE' && (
                            <button type="button" className="btn btn-secondary" onClick={handlePrint}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 6 2 18 2 18 9" />
                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                    <rect x="6" y="14" width="12" height="8" />
                                </svg>
                                Print Slip / PDF
                            </button>
                        )}

                        {['DRAFT', 'READY', 'WAITING'].includes(item.status) && (
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={handleCancel}
                                disabled={actionLoading}
                            >
                                Cancel Operation
                            </button>
                        )}
                    </div>

                    {/* Summary Header Cards */}
                    <section className="operation-summary">
                        <div>
                            <small>{isReceipt ? 'Receive From' : 'Delivery Address / Contact'}</small>
                            <strong>{item.contact || '—'}</strong>
                        </div>
                        <div>
                            <small>Warehouse</small>
                            <strong>{item.warehouseId?.name || '—'} ({item.warehouseId?.shortCode || 'WH'})</strong>
                        </div>
                        <div>
                            <small>Scheduled Date</small>
                            <strong>{formatDate(item.scheduledDate)}</strong>
                        </div>
                        <div>
                            <small>Responsible User</small>
                            <strong>{item.responsibleUserId?.loginId || 'System Manager'}</strong>
                        </div>
                        <div>
                            <small>Status</small>
                            <StatusBadge status={item.status} />
                        </div>
                    </section>

                    {/* Stock Availability Alert for Waiting Deliveries */}
                    {!isReceipt && item.status === 'WAITING' && (
                        <div className="availability-alert">
                            <h4>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                Stock Availability Warning (Insufficient Inventory)
                            </h4>
                            <p style={{ fontSize: '0.875rem' }}>
                                One or more items on this delivery request exceed current free-to-use stock in warehouse inventory.
                            </p>
                        </div>
                    )}

                    {/* Product Lines Table */}
                    <section className="table-wrap">
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--panel-border)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Products List</h3>
                        </div>
                        {(item.lines || []).length === 0 ? (
                            <div className="page-state">No product lines on this operation.</div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product Name</th>
                                        <th>Product Code</th>
                                        <th>Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {item.lines.map((line, index) => {
                                        const product = typeof line.productId === 'object' ? line.productId : null;
                                        return (
                                            <tr key={`${product?.id || line.productId}-${index}`}>
                                                <td><strong>{product?.name || 'Product'}</strong></td>
                                                <td>{product?.code || '—'}</td>
                                                <td><strong>{line.quantity}</strong></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}