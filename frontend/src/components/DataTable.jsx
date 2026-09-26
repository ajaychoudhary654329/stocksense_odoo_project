export default function DataTable({ columns, rows, emptyMessage = 'No records found.' }) {
    if (!rows.length) {
        return <div className="page-state">{emptyMessage}</div>;
    }

    return (
        <div className="table-wrap">
            <table>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key}>{column.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={row.id || row._id || rowIndex}>
                            {columns.map((column) => (
                                <td key={`${row.id || row._id || rowIndex}-${column.key}`}>{column.render ? column.render(row) : row[column.key]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
