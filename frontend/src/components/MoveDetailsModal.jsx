import { useEffect, useState } from 'react';
import { movesApi } from '../api/moves';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/format';

export default function MoveDetailsModal({ id, open, onClose }) {
    const [response, setResponse] = useState({ id: null, move: null, error: '' });

    useEffect(() => {
        if (!open || !id) return undefined;
        let active = true;
        movesApi.getById(id)
            .then((result) => { if (active) setResponse({ id, move: result, error: '' }); })
            .catch((requestError) => { if (active) setResponse({ id, move: null, error: requestError.message || 'Unable to load move details.' }); });

        return () => { active = false; };
    }, [id, open]);

    const move = response.id === id ? response.move : null;
    const error = response.id === id ? response.error : '';
    const loading = open && Boolean(id) && response.id !== id;

    const product = move?.productId && typeof move.productId === 'object' ? move.productId : null;

    return (
        <Modal open={open} title={move?.reference || 'Move details'} onClose={onClose}>
            {loading && <div className="page-state">Loading move...</div>}
            {!loading && error && <div className="page-state error">{error}</div>}
            {!loading && !error && move && (
                <div className="detail-grid">
                    <div><small>Reference</small><strong>{move.reference}</strong></div>
                    <div><small>Contact</small><strong>{move.contact || '—'}</strong></div>
                    <div><small>Status</small><StatusBadge status={move.status} /></div>
                    <div><small>Date</small><strong>{formatDate(move.createdAt)}</strong></div>
                    <div><small>From</small><strong>{move.from?.name || move.from?.type || '—'}</strong></div>
                    <div><small>To</small><strong>{move.to?.name || move.to?.type || '—'}</strong></div>
                    <div><small>Product</small><strong>{product ? `[${product.code}] ${product.name}` : '—'}</strong></div>
                    <div><small>Quantity</small><strong>{move.quantity}</strong></div>
                </div>
            )}
        </Modal>
    );
}