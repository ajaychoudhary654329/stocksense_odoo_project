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
                    <h2>Welcome back</h2>
                    <p>Sign in to continue to StockSense</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        <span>Login ID</span>
                        <input name="loginId" value={form.loginId} onChange={updateField} required />
                    </label>

                    <label>
                        <span>Password</span>
                        <input type="password" name="password" value={form.password} onChange={updateField} required />
                    </label>

                    {error && <div className="alert error">{error}</div>}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Signing in...' : 'Login'}
                    </button>
                </form>

                <div className="auth-links">
                    <Link to="/register">Create account</Link>
                    <Link to="/forgot-password">Forgot password?</Link>
                </div>
            </div>
        </div>
    );
}
