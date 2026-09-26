import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';

export default function DashboardPage() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const response = await dashboardApi.getMetrics();
                setMetrics(response);
            } catch (err) {
                setError(err.message || 'Unable to load dashboard.');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    if (loading) return <div className="page-state">Loading dashboard...</div>;
    if (error) return <div className="page-state error">{error}</div>;
    if (!metrics) return <div className="page-state">No dashboard data available.</div>;

    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Overview</p>
                    <h2>Warehouse dashboard</h2>
                </div>
            </div>

            <div className="dashboard-grid">
                <Link to="/receipts" className="metric-card">
                    <span className="metric-label">Receipts</span>
                    <strong>{metrics.receipts?.toReceive ?? 0}</strong>
                    <small>To Receive</small>
                    <em>{metrics.receipts?.late ?? 0} Late</em>
                </Link>

                <Link to="/deliveries" className="metric-card">
                    <span className="metric-label">Deliveries</span>
                    <strong>{metrics.deliveries?.toDeliver ?? 0}</strong>
                    <small>To Deliver</small>
                    <em>{metrics.deliveries?.late ?? 0} Late</em>
                </Link>

                <Link to="/deliveries?status=WAITING" className="metric-card warning-card">
                    <span className="metric-label">Waiting</span>
                    <strong>{metrics.deliveries?.waiting ?? 0}</strong>
                    <small>Ready for attention</small>
                    <em>View backlog</em>
                </Link>

                <div className="metric-card stats-card">
                    <span className="metric-label">Operations</span>
                    <strong>{metrics.operations ?? 0}</strong>
                    <small>Active operations</small>
                    <em>Across receipts and deliveries</em>
                </div>
            </div>
        </div>
    );
}
