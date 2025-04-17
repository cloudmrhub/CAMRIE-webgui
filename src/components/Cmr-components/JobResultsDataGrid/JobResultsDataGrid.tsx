import { useState } from 'react';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Box, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import GetAppIcon from '@mui/icons-material/GetApp';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';

type FileItem = {
    id: string;
    fileName: string;
    createdAt: string;
    status: string;
    link: string;
};

type JobItem = {
    id: string;
    alias: string;
    createdAt: string;
    status: string;
    files: FileItem[];
};

interface Props {
    rows: JobItem[];
    onDownload: (files: FileItem[]) => void;
    onDelete: (jobId: string) => void;
}

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
    '& .MuiDataGrid-columnHeaders .MuiSvgIcon-root': {
        color: '#580f8b', 
    },
    '--DataGrid-containerBackground': 'transparent',
    '& .MuiDataGrid-columnHeaders': {
        backgroundColor: '#F3E5F5',
        color: '#333',
        fontWeight: 'bold',
    },
    // '--DataGrid-containerBackground': 'transparent',
    // '& .MuiDataGrid-columnHeaders': {
    //     backgroundColor: '#DBDBDB',
    //     color: '#333',
    //     fontWeight: 'bold',
    // },
    '& .MuiDataGrid-cell': {
        backgroundColor: '#fff',
    },
    '& .MuiDataGrid-footerContainer': {
        backgroundColor: '#fff', // Footer background color (including rows per page selector)
        borderTop: '1px solid #ddd', // Optional: Add a border to separate the footer from the grid
    },
    // Custom checkbox styling
    '& .MuiDataGrid-checkboxInput': {
        color: '#580f8b',
    },

    '& .MuiDataGrid-checkboxInput.Mui-checked': {
        color: '#580f8b',
    },

    '& .MuiDataGrid-checkboxInput:hover': {
        backgroundColor: 'rgba(88, 15, 139, 0.1)',
    },

    '& .MuiDataGrid-checkboxInput.Mui-focusVisible': {
        boxShadow: '0 0 0 3px rgba(88, 15, 139, 0.25)',
    },
    '& .MuiTablePagination-toolbar': {
        alignItems: 'center', // Ensure vertical centering
        minHeight: 'auto',
    },
    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
        marginTop: 0, // Remove any top margin
    },
}));

const JobResultsDataGrid = ({ rows, onDownload, onDelete }: Props) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'Job ID', flex: 1 },
        { field: 'alias', headerName: 'Alias', flex: 1 },
        { field: 'createdAt', headerName: 'Date Uploaded', flex: 1 },
        { field: 'status', headerName: 'Status', flex: 1 },
        {
            field: 'actions',
            headerName: 'Actions',
            sortable: false,
            flex: 1,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <IconButton><EditIcon /></IconButton>
                    <IconButton onClick={() => onDownload(params.row.files)}><GetAppIcon /></IconButton>
                    <IconButton onClick={() => onDelete(params.row.id)}><DeleteIcon /></IconButton>
                </Box>
            ),
        },
    ];

    return (
        <div style={{ height: 600, width: '100%' }}>
            <StyledDataGrid
                rows={rows}
                columns={columns}
                pageSizeOptions={[10, 20]}
                initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                getRowId={(row) => row.id}
                checkboxSelection
                onRowSelectionModelChange={(selection) => {
                    setSelectedIds(selection as string[]);
                    console.log('Selected Job IDs:', selection);
                }}
            />
        </div>
    );
};

export default JobResultsDataGrid;
