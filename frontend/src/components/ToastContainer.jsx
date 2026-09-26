export default function ToastContainer({ toasts, onClose }) {
    if (!toasts.length) return null;

    return (
        <div className="toast-stack">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast ${toast.type || 'success'}`}>
                    <span>{toast.message}</span>
                    <button type="button" onClick={() => onClose(toast.id)} aria-label="Dismiss notification">
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
