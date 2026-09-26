import { Link } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../api/auth';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await authApi.forgotPassword({ email });
            setMessage('If the account exists, a reset link has been processed.');
        } catch (err) {
            setError(err.message || 'Unable to process password reset.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="brand-mark large">S</div>
                    <h2>Forgot password</h2>
                    <p>We’ll send a reset instruction if this account exists.</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        <span>Email</span>
                        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </label>

                    {error && <div className="alert error">{error}</div>}
                    {message && <div className="alert success">{message}</div>}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Sending...' : 'Send reset link'}
                    </button>
                </form>

                <div className="auth-links">
                    <Link to="/login">Back to login</Link>
                </div>
            </div>
        </div>
    );
}
