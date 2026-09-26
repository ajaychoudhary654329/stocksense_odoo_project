import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ loginId: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const loginId = form.loginId.trim();
            if (loginId.length < 6 || loginId.length > 12) {
                throw new Error('Login ID must be between 6 and 12 characters.');
            }
            if (!/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password) || form.password.length <= 8) {
                throw new Error('Password must be longer than 8 characters and include lowercase, uppercase, and a special character.');
            }
            if (form.password !== form.confirmPassword) {
                throw new Error('Passwords do not match.');
            }

            await authApi.register({ loginId, email: form.email.trim(), password: form.password });
            setSuccess('Account created successfully. Redirecting to login...');
            setTimeout(() => navigate('/login'), 1200);
        } catch (err) {
            setError(err.message || 'Unable to create account.');
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
                    <h2>Create Account</h2>
                    <p>Register as a StockSense manager</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        <span>Login ID (6-12 characters)</span>
                        <input
                            name="loginId"
                            value={form.loginId}
                            onChange={updateField}
                            minLength={6}
                            maxLength={12}
                            placeholder="Choose a login ID"
                            required
                        />
                    </label>

                    <label>
                        <span>Email Address</span>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={updateField}
                            placeholder="name@company.com"
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
                            placeholder="Min 9 chars with A-z, 0-9 & special"
                            minLength={9}
                            required
                        />
                    </label>

                    <label>
                        <span>Re-enter Password</span>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={updateField}
                            placeholder="Repeat password"
                            minLength={9}
                            required
                        />
                    </label>

                    {error && <div className="alert error">{error}</div>}
                    {success && <div className="alert success">{success}</div>}

                    <button type="submit" className="btn btn-primary" style={{ padding: '12px' }} disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-links" style={{ justifyContent: 'center' }}>
                    <span>Already registered? <Link to="/login">Sign In</Link></span>
                </div>
            </div>
        </div>
    );
}
