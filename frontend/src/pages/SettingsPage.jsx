import { Link } from 'react-router-dom';

export default function SettingsPage() {
    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">System Setup</p>
                    <h2>Warehouse Settings & Configuration</h2>
                </div>
            </div>

            <div className="dashboard-grid">
                <Link to="/warehouses" className="metric-card" style={{ textDecoration: 'none' }}>
                    <span className="metric-label">Site Configuration</span>
                    <strong style={{ fontSize: '1.4rem', margin: '8px 0' }}>Warehouses</strong>
                    <small>Manage physical warehouse names, short codes, and addresses.</small>
                    <em style={{ marginTop: '12px', display: 'block', color: 'var(--primary)', fontWeight: 600 }}>Manage Warehouses →</em>
                </Link>

                <Link to="/locations" className="metric-card" style={{ textDecoration: 'none' }}>
                    <span className="metric-label">Layout & Storage</span>
                    <strong style={{ fontSize: '1.4rem', margin: '8px 0' }}>Stock Locations</strong>
                    <small>Configure rooms, aisles, racks, and sub-locations per warehouse.</small>
                    <em style={{ marginTop: '12px', display: 'block', color: 'var(--primary)', fontWeight: 600 }}>Manage Locations →</em>
                </Link>
            </div>
        </div>
    );
}