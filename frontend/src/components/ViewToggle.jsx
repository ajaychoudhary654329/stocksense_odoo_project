export default function ViewToggle({ value, onChange }) {
    return (
        <div className="view-toggle" role="group" aria-label="View mode">
            <button type="button" className={value === 'list' ? 'active' : ''} onClick={() => onChange('list')} aria-pressed={value === 'list'}>
                List
            </button>
            <button type="button" className={value === 'kanban' ? 'active' : ''} onClick={() => onChange('kanban')} aria-pressed={value === 'kanban'}>
                Kanban
            </button>
        </div>
    );
}