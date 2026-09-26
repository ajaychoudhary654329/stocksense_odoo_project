import { useState } from 'react';
import { Link } from 'react-router-dom';
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
            await authApi.forgotPassword({ email: email.trim() });
            setMessage('If the account exists, a reset instruction has been sent.');
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
                    <h2>Reset Password</h2>
                    <p>Enter your registered email address</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        <span>Email Address</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="name@company.com"
                            required
                        />
                    </label>

                    {error && <div className="alert error">{error}</div>}
                    {message && <div className="alert success">{message}</div>}

                    <button type="submit" className="btn btn-primary" style={{ padding: '12px' }} disabled={loading}>
                        {loading ? 'Sending Request...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="auth-links" style={{ justifyContent: 'center' }}>
                    <Link to="/login">Back to Sign In</Link>
                </div>
            </div>
        </div>
    );
}
