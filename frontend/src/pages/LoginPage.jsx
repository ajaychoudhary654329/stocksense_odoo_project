import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

export default function LoginPage({ onLogin }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ loginId: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await authApi.login(form);
            localStorage.setItem('stocksense_token', result.token);
            onLogin(result.user);
            navigate(location.state?.from || '/dashboard', { replace: true });
        } catch (err) {
            setError(err.code === 'INVALID_CREDENTIALS' ? 'Invalid Login Id or Password' : err.message || 'Unable to log in.');
        } finally {
            setLoading(false);
        }
    };

    const updateField = (event) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    };

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="brand-mark large">S</div>
                    <h2>StockSense</h2>
                    <p>Sign in to your inventory portal</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        <span>Login ID</span>
                        <input
                            name="loginId"
                            value={form.loginId}
                            onChange={updateField}
                            placeholder="Enter your Login ID"
                            required
                        />
                    </label>

                    <label>
                        <span>Password</span>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={updateField}
                            placeholder="Enter your password"
                            required
                        />
                    </label>

                    {error && <div className="alert error">{error}</div>}

                    <button type="submit" className="btn btn-primary" style={{ padding: '12px' }} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-links">
                    <Link to="/register">Create Account</Link>
                    <Link to="/forgot-password">Forgot Password?</Link>
                </div>
            </div>
        </div>
    );
}
