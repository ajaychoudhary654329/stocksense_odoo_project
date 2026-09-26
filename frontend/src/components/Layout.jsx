import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

export default function Layout({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

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

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.startsWith('/dashboard')) return { title: 'Dashboard Overview', eyebrow: 'Metrics & Operations' };
        if (path.startsWith('/receipts')) return { title: 'Incoming Receipts', eyebrow: 'Operations / Receipts' };
        if (path.startsWith('/deliveries')) return { title: 'Outgoing Deliveries', eyebrow: 'Operations / Deliveries' };
        if (path.startsWith('/inventory')) return { title: 'Inventory Adjustments', eyebrow: 'Operations / Stock' };
        if (path.startsWith('/moves')) return { title: 'Stock Move History', eyebrow: 'Traceability / Moves' };
        if (path.startsWith('/products')) return { title: 'Product Catalog', eyebrow: 'Master Data / Products' };
        if (path.startsWith('/warehouses')) return { title: 'Warehouses', eyebrow: 'Settings / Warehouses' };
        if (path.startsWith('/locations')) return { title: 'Stock Locations', eyebrow: 'Settings / Locations' };
        if (path.startsWith('/settings')) return { title: 'System Settings', eyebrow: 'Configuration' };
        return { title: 'Warehouse Management', eyebrow: 'StockSense' };
    };

    const pageMeta = getPageTitle();
    const userInitial = user?.loginId ? user.loginId.charAt(0).toUpperCase() : 'A';

    return (
        <div className="app-shell">
            <div
                className={`mobile-nav-backdrop ${mobileOpen ? 'open' : ''}`}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
            />

            <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="brand">
                    <div className="brand-mark">S</div>
                    <div className="brand-info">
                        <span className="brand-title">StockSense</span>
                        <span className="brand-subtitle">Warehouse Management</span>
                    </div>
                </div>

                <nav className="nav">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        onClick={() => setMobileOpen(false)}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="9" rx="1" />
                            <rect x="14" y="3" width="7" height="5" rx="1" />
                            <rect x="14" y="12" width="7" height="9" rx="1" />
                            <rect x="3" y="16" width="7" height="5" rx="1" />
                        </svg>
                        Dashboard
                    </NavLink>

                    <div className="nav-group">
                        <span className="nav-heading">Operations</span>
                        <NavLink
                            to="/receipts"
                            className={({ isActive }) => `nav-link nested ${isActive ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12l7 7 7-7" />
                            </svg>
                            Receipts
                        </NavLink>
                        <NavLink
                            to="/deliveries"
                            className={({ isActive }) => `nav-link nested ${isActive ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 19V5M5 12l7-7 7 7" />
                            </svg>
                            Deliveries
                        </NavLink>
                        <NavLink
                            to="/inventory"
                            className={({ isActive }) => `nav-link nested ${isActive ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            </svg>
                            Adjustments
                        </NavLink>
                    </div>

                    <NavLink
                        to="/products"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        onClick={() => setMobileOpen(false)}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        Products
                    </NavLink>

                    <NavLink
                        to="/moves"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        onClick={() => setMobileOpen(false)}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="17 1 21 5 17 9" />
                            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                            <polyline points="7 23 3 19 7 15" />
                            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                        </svg>
                        Move History
                    </NavLink>

                    <div className="nav-group">
                        <span className="nav-heading">Settings</span>
                        <NavLink
                            to="/warehouses"
                            className={({ isActive }) => `nav-link nested ${isActive ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 21h18M3 7l9-4 9 4v14H3V7z" />
                            </svg>
                            Warehouses
                        </NavLink>
                        <NavLink
                            to="/locations"
                            className={({ isActive }) => `nav-link nested ${isActive ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            Locations
                        </NavLink>
                    </div>
                </nav>
            </aside>

            <div className="main-panel">
                <header className="topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            type="button"
                            className="mobile-toggle"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle navigation menu"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <div>
                            <p className="eyebrow">{pageMeta.eyebrow}</p>
                            <h1>{pageMeta.title}</h1>
                        </div>
                    </div>

                    <div className="topbar-actions">
                        <div className="user-pill">
                            <span className="avatar-badge">{userInitial}</span>
                            <span>{user?.loginId || 'User'}</span>
                        </div>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
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
