import { Link } from 'react-router-dom';

export default function SettingsPage() {
    return (
        <div className="page-stack">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Configuration</p>
                    <h2>Settings</h2>
                </div>
            </div>
            <div className="settings-links">
                <Link to="/warehouses" className="settings-link">
                    <strong>Warehouses</strong>
                    <span>Manage warehouse names, codes, and addresses</span>
                </Link>
                <Link to="/locations" className="settings-link">
                    <strong>Locations</strong>
                    <span>Manage rooms and stock locations by warehouse</span>
                </Link>
            </div>
        </div>
    );
}