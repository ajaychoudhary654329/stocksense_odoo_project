import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import { deliveriesApi } from '../api/deliveries';
import { receiptsApi } from '../api/receipts';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/format';

export default function DashboardPage() {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState(null);
    const [recentReceipts, setRecentReceipts] = useState([]);
    const [recentDeliveries, setRecentDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                setLoading(true);
                const [metricsData, receiptsData, deliveriesData] = await Promise.all([
                    dashboardApi.getMetrics(),
                    receiptsApi.list({ limit: 5 }),
                    deliveriesApi.list({ limit: 5 }),
                ]);

                if (!active) return;
                setMetrics(metricsData);
                setRecentReceipts((receiptsData || []).slice(0, 5));
                setRecentDeliveries((deliveriesData || []).slice(0, 5));
                setError('');
            } catch (err) {
                if (active) setError(err.message || 'Unable to load dashboard metrics.');
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => { active = false; };
    }, []);

    if (loading) return <div className="page-state">Loading dashboard data...</div>;
    if (error) return <div className="page-state error">{error}</div>;
    if (!metrics) return <div className="page-state">No dashboard data available.</div>;

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Real-Time Insights</p>
                    <h2>Warehouse Dashboard</h2>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="dashboard-quick-actions">
                <span className="quick-actions-title">Quick Actions</span>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/receipts')}>
                    + New Receipt
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/deliveries')}>
                    + New Delivery
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/inventory')}>
                    Adjust Stock
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/products')}>
                    Add Product
                </button>
            </div>

            {/* Metric KPI Cards */}
            <div className="dashboard-grid">
                <Link to="/receipts" className="metric-card">
                    <span className="metric-label">Receipts</span>
                    <strong>{metrics.receipts?.toReceive ?? 0}</strong>
                    <small>To Receive</small>
                    <em>{metrics.receipts?.late ?? 0} Late Schedule(s)</em>
                </Link>

                <Link to="/deliveries" className="metric-card">
                    <span className="metric-label">Deliveries</span>
                    <strong>{metrics.deliveries?.toDeliver ?? 0}</strong>
                    <small>To Deliver</small>
                    <em>{metrics.deliveries?.late ?? 0} Late Schedule(s)</em>
                </Link>

                <Link to="/deliveries?status=WAITING" className="metric-card warning-card">
                    <span className="metric-label">Waiting Backlog</span>
                    <strong>{metrics.deliveries?.waiting ?? 0}</strong>
                    <small>Awaiting Stock Availability</small>
                    <em>View Backlog Alert</em>
                </Link>

                <div className="metric-card">
                    <span className="metric-label">Total Active Operations</span>
                    <strong>{metrics.operations ?? 0}</strong>
                    <small>Active Workflows</small>
                    <em>Receipts & Deliveries Combined</em>
                </div>
            </div>

            {/* Recent Operations Tables */}
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))' }}>
                {/* Recent Receipts */}
                <div className="table-wrap">
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Recent Receipts</h3>
                        <Link to="/receipts" className="text-button" style={{ fontSize: '0.85rem' }}>View All →</Link>
                    </div>
                    {recentReceipts.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-text)', fontSize: '0.875rem' }}>No recent receipts</div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Contact</th>
                                    <th>Scheduled</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentReceipts.map((item) => (
                                    <tr key={item.id || item._id}>
                                        <td>
                                            <Link to={`/receipts/${item.id || item._id}`} className="text-button">
                                                {item.reference}
                                            </Link>
                                        </td>
                                        <td>{item.contact || '—'}</td>
                                        <td>{formatDate(item.scheduledDate)}</td>
                                        <td><StatusBadge status={item.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Recent Deliveries */}
                <div className="table-wrap">
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Recent Deliveries</h3>
                        <Link to="/deliveries" className="text-button" style={{ fontSize: '0.85rem' }}>View All →</Link>
                    </div>
                    {recentDeliveries.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-text)', fontSize: '0.875rem' }}>No recent deliveries</div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Contact</th>
                                    <th>Scheduled</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentDeliveries.map((item) => (
                                    <tr key={item.id || item._id}>
                                        <td>
                                            <Link to={`/deliveries/${item.id || item._id}`} className="text-button">
                                                {item.reference}
                                            </Link>
                                        </td>
                                        <td>{item.contact || '—'}</td>
                                        <td>{formatDate(item.scheduledDate)}</td>
                                        <td><StatusBadge status={item.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
