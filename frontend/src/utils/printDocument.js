import { request } from '../api/client';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
}[character]));

export async function openPrintDocument(endpoint) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) throw new Error('Allow pop-ups to print this document.');

    try {
        const documentData = await request(endpoint);
        const rows = (documentData.lines || []).map((line) => {
            const product = typeof line.productId === 'object' ? line.productId : {};
            return `<tr><td>${escapeHtml(product.code || '')}</td><td>${escapeHtml(product.name || 'Product')}</td><td>${escapeHtml(line.quantity)}</td></tr>`;
        }).join('');
        const title = documentData.documentType === 'DELIVERY_SLIP' ? 'Delivery Slip' : 'Receipt';

        printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(documentData.reference)}</title><style>
            body{font:14px Arial,sans-serif;color:#17211d;margin:40px}h1{font-size:24px;margin:0 0 8px}p{margin:4px 0;color:#46534d}.meta{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin:28px 0}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{text-align:left;padding:12px;border-bottom:1px solid #d5ddd8}th{background:#f1f5f2;text-transform:uppercase;font-size:11px;letter-spacing:1px}@media print{body{margin:0}}
        </style></head><body><h1>${title}</h1><p>${escapeHtml(documentData.reference)}</p><div class="meta"><p><strong>Contact:</strong> ${escapeHtml(documentData.contact)}</p><p><strong>Warehouse:</strong> ${escapeHtml(documentData.warehouse?.name || '')}</p><p><strong>Schedule date:</strong> ${escapeHtml(documentData.scheduledDate ? new Date(documentData.scheduledDate).toLocaleDateString() : '')}</p><p><strong>Printed:</strong> ${escapeHtml(new Date(documentData.printedAt || Date.now()).toLocaleString())}</p></div><table><thead><tr><th>Code</th><th>Product</th><th>Quantity</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
        printWindow.document.close();
    } catch (error) {
        printWindow.close();
        throw error;
    }
}