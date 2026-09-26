export default function Modal({ open, title, children, onClose }) {
    if (!open) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
                {children}
            </div>
        </div>
    );
}
