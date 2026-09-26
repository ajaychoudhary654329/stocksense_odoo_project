export default function Modal({ open, isOpen, title, children, onClose }) {
    const isVisible = open !== undefined ? open : isOpen;
    if (!isVisible) return null;

    return (
        <div className="modal-backdrop" onClick={onClose} aria-hidden="true">
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                        ✕
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}
