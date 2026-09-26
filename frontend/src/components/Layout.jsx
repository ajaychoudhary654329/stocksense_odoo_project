import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

export default function Layout({ user, onLogout }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.warn('Logout request failed:', error);
        } finally {
            localStorage.removeItem('stocksense_token');
            onLogout();
            navigate('/login');
        }
    };

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-mark">S</div>
                    <div>
                        <strong>StockSense</strong>
                        <small>Warehouse Ops</small>
                    </div>
                </div>

                <nav className="nav">
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
                    <div className="nav-group">
                        <span className="nav-heading">Operations</span>
                        <NavLink to="/receipts" className={({ isActive }) => `nav-link nested ${isActive ? 'active' : ''}`}>Receipts</NavLink>
                        <NavLink to="/deliveries" className={({ isActive }) => `nav-link nested ${isActive ? 'active' : ''}`}>Deliveries</NavLink>
                        <NavLink to="/inventory" className={({ isActive }) => `nav-link nested ${isActive ? 'active' : ''}`}>Adjustments</NavLink>
                    </div>
                    <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Products</NavLink>
                    <NavLink to="/moves" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Move History</NavLink>
                    <div className="nav-group">
                        <NavLink to="/settings" className={({ isActive }) => `nav-heading nav-heading-link ${isActive ? 'active' : ''}`}>Settings</NavLink>
                        <NavLink to="/warehouses" className={({ isActive }) => `nav-link nested ${isActive ? 'active' : ''}`}>Warehouses</NavLink>
                        <NavLink to="/locations" className={({ isActive }) => `nav-link nested ${isActive ? 'active' : ''}`}>Locations</NavLink>
                    </div>
                </nav>
            </aside>

            <div className="main-panel">
                <header className="topbar">
                    <div>
                        <p className="eyebrow">Operations</p>
                        <h1>Warehouse management</h1>
                    </div>
                    <div className="topbar-actions">
                        <span className="user-pill">{user?.loginId || 'User'}</span>
                        <button type="button" className="btn btn-secondary" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </header>

                <main className="content-area">
                    <Outlet context={{ user }} />
                </main>
            </div>
        </div>
    );
}
