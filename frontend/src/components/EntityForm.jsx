export default function EntityForm({ title, initialValues, fields, onSubmit, submitLabel, onCancel }) {
    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(event);
    };

    return (
        <form className="entity-form" onSubmit={handleSubmit}>
            <div className="form-grid">
                {fields.map((field) => (
                    <label key={field.name} className={field.fullWidth ? 'full-width' : ''}>
                        <span>{field.label}</span>
                        {field.type === 'select' ? (
                            <select name={field.name} value={initialValues[field.name] ?? ''} onChange={field.onChange}>
                                {field.options.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={field.type || 'text'}
                                name={field.name}
                                value={initialValues[field.name] ?? ''}
                                onChange={field.onChange}
                                placeholder={field.placeholder || ''}
                                required={field.required}
                            />
                        )}
                    </label>
                ))}
            </div>

            <div className="form-actions">
                {onCancel && (
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                )}
                <button type="submit" className="btn btn-primary">{submitLabel || title}</button>
            </div>
        </form>
    );
}
