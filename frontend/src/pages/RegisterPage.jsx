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
            setSuccess('Account created successfully. Please log in.');
            setTimeout(() => navigate('/login'), 800);
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
                    <h2>Create account</h2>
                    <p>Set up your warehouse admin profile</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        <span>Login ID</span>
                        <input name="loginId" value={form.loginId} onChange={updateField} minLength={6} maxLength={12} required />
                    </label>

                    <label>
                        <span>Email</span>
                        <input type="email" name="email" value={form.email} onChange={updateField} required />
                    </label>

                    <label>
                        <span>Password</span>
                        <input type="password" name="password" value={form.password} onChange={updateField} minLength={9} required />
                    </label>

                    <label>
                        <span>Re-enter password</span>
                        <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={updateField} minLength={9} required />
                    </label>

                    {error && <div className="alert error">{error}</div>}
                    {success && <div className="alert success">{success}</div>}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating account...' : 'Register'}
                    </button>
                </form>

                <div className="auth-links">
                    <Link to="/login">Back to login</Link>
                </div>
            </div>
        </div>
    );
}
