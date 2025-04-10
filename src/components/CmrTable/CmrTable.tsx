import './CmrTable.scss';
import { DataGrid, DataGridProps } from '@mui/x-data-grid';
import type { CSSProperties } from 'react';

interface CmrTableProps extends Omit<DataGridProps, 'rows'> {
  dataSource: any[];
  idAlias?: string;
  name?: string;
  style?: CSSProperties;
  showCheckbox?: boolean;
}

const CmrTable: React.FC<CmrTableProps> = ({
  dataSource,
  idAlias,
  name,
  columns,
  className,
  style,
  showCheckbox = true,
  onRowSelectionModelChange,
  ...rest
}) => {
  const rows = dataSource.map((row) => ({
    id: idAlias ? row[idAlias] : row.id,
    ...row,
  }));

  return (
    <div style={style ?? { height: 400, width: '100%' }} className={className ?? ''}>
      {name && <h3 style={{ textAlign: 'center' }}>{name}</h3>}
      <DataGrid
        rows={rows}
        columns={columns}
        checkboxSelection={showCheckbox}
        onRowSelectionModelChange={onRowSelectionModelChange}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 50, page: 0 },
          },
        }}
        localeText={{ noRowsLabel: '' }}
        {...rest}
      />
    </div>
  );
};

export default CmrTable;
