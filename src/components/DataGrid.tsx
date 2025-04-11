import { useState } from 'react';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { IconButton, Box } from '@mui/material';
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

interface Props {
    rows: FileItem[];
    onDownload: (url: string, name: string) => void;
    onDelete: (fileId: string) => void;
}

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
    '& .MuiDataGrid-columnHeaders .MuiSvgIcon-root': {
        color: '#fff', // Change the icon color in the header to white
    },
    '--DataGrid-containerBackground': 'transparent',
    '& .MuiDataGrid-columnHeaders': {
        backgroundColor: '#580f8b',
        color: '#fff',
        fontWeight: 'bold',
    },
    '& .MuiDataGrid-cell': {
        backgroundColor: '#fff', // Set the background of the cells to white
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
}));

const UploadedDataGrid = ({ rows, onDownload, onDelete }: Props) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const columns: GridColDef[] = [
        { field: 'fileName', headerName: 'File Name', flex: 1 },
        { field: 'createdAt', headerName: 'Date Uploaded', flex: 1 },
        // { field: 'status', headerName: 'Status', flex: 1 },
        {
            field: 'actions',
            headerName: 'Actions',
            sortable: false,
            flex: 1,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <IconButton><EditIcon /></IconButton>
                    <IconButton onClick={() => onDownload(params.row.link, params.row.fileName)}><GetAppIcon /></IconButton>
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
                    console.log('Selected Row IDs:', selection);
                }}
            />
        </div>
    );
};

export default UploadedDataGrid;
