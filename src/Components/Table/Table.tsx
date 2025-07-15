

import '../../Styles/Table.css';

export interface TableColumn<T> {
  header: string;
  key: keyof T | string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyStateMessage?: string;
  className?: string;
}

function Table<T>({ columns, data, keyExtractor, emptyStateMessage = 'No data available', className = '' }: TableProps<T>) {
  return (
    <div className={`table-container ${className}`}>
      {data.length > 0 ? (
        <table className="table">
          <thead>
            <tr className="table-header">
              {columns.map((column) => (
                <th 
                  key={column.key.toString()} 
                  className="table-header-cell"
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={keyExtractor(item)} className="table-row">
                {columns.map((column) => (
                  <td key={`${keyExtractor(item)}-${column.key.toString()}`} className="table-cell">
                    {column.render 
                      ? column.render(item, index)
                      : item[column.key as keyof T]?.toString() || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">{emptyStateMessage}</div>
      )}
    </div>
  );
}

export default Table;