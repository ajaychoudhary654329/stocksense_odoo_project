export function emitToast(message, type = 'success') {
    window.dispatchEvent(
        new CustomEvent('stocksense-toast', {
            detail: { message, type },
        })
    );
}
