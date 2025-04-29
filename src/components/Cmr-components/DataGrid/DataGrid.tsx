import { useState, useEffect } from 'react';
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
  onSelectionChange?: (selectedIds: string[]) => void;
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
  '& .MuiDataGrid-cell': {
    backgroundColor: '#fff',
  },
  '& .MuiDataGrid-footerContainer': {
    backgroundColor: '#fff',
    borderTop: '1px solid #ddd',
  },
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
    alignItems: 'center',
    minHeight: 'auto',
  },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
    marginTop: 0,
  },
}));

const UploadedDataGrid = ({ rows, onDownload, onDelete, onSelectionChange }: Props) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [selectedIds, onSelectionChange]);

  const columns: GridColDef[] = [
    { field: 'fileName', headerName: 'File Name', flex: 1 },
    { field: 'createdAt', headerName: 'Date Uploaded', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton onClick={() => onDownload(params.row.link, params.row.fileName)}><GetAppIcon /></IconButton>
          {/* <IconButton onClick={() => onDelete(params.row.id)}><DeleteIcon /></IconButton> */}
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
        disableRowSelectionOnClick
        // checkboxSelection
        // onRowSelectionModelChange={(selection) => {
        //   setSelectedIds(selection as string[]);
        // }}
      />
    </div>
  );
};

export default UploadedDataGrid;


// import { useState, useEffect } from 'react';
// import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
// import { IconButton, Box } from '@mui/material';
// import EditIcon from '@mui/icons-material/Edit';
// import GetAppIcon from '@mui/icons-material/GetApp';
// import DeleteIcon from '@mui/icons-material/Delete';
// import { styled } from '@mui/material/styles';

// type FileItem = {
//   id: string;
//   fileName: string;
//   createdAt: string;
//   status: string;
//   link: string;
// };

// interface Props {
//   rows: FileItem[];
//   onDownload: (url: string, name: string) => void;
//   onDelete: (fileId: string) => void;
//   onSelectionChange?: (selectedIds: string[]) => void;
// }

// const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
//   '& .MuiDataGrid-columnHeaders .MuiSvgIcon-root': {
//     color: '#580f8b',
//   },
//   '--DataGrid-containerBackground': 'transparent',
//   '& .MuiDataGrid-columnHeaders': {
//     backgroundColor: '#F3E5F5',
//     color: '#333',
//     fontWeight: 'bold',
//   },
//   '& .MuiDataGrid-cell': {
//     backgroundColor: '#fff',
//   },
//   '& .MuiDataGrid-footerContainer': {
//     backgroundColor: '#fff',
//     borderTop: '1px solid #ddd',
//   },
//   '& .MuiDataGrid-checkboxInput': {
//     color: '#580f8b',
//   },
//   '& .MuiDataGrid-checkboxInput.Mui-checked': {
//     color: '#580f8b',
//   },
//   '& .MuiDataGrid-checkboxInput:hover': {
//     backgroundColor: 'rgba(88, 15, 139, 0.1)',
//   },
//   '& .MuiDataGrid-checkboxInput.Mui-focusVisible': {
//     boxShadow: '0 0 0 3px rgba(88, 15, 139, 0.25)',
//   },
//   '& .MuiTablePagination-toolbar': {
//     alignItems: 'center',
//     minHeight: 'auto',
//   },
//   '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
//     marginTop: 0,
//   },
// }));

// const UploadedDataGrid = ({ rows, onDownload, onDelete, onSelectionChange }: Props) => {
//   const [selectedIds, setSelectedIds] = useState<string[]>([]);

//   useEffect(() => {
//     if (onSelectionChange) {
//       onSelectionChange(selectedIds);
//     }
//   }, [selectedIds, onSelectionChange]);

//   const columns: GridColDef[] = [
//     { field: 'fileName', headerName: 'File Name', flex: 1 },
//     { field: 'createdAt', headerName: 'Date Uploaded', flex: 1 },
//     {
//       field: 'actions',
//       headerName: 'Actions',
//       sortable: false,
//       flex: 1,
//       renderCell: (params: GridRenderCellParams) => (
//         <Box>
//           <IconButton onClick={() => onDownload(params.row.link, params.row.fileName)}>
//             <GetAppIcon />
//           </IconButton>
//           {/* Adding the Delete button and its functionality */}
//           <IconButton onClick={() => onDelete(params.row.id)}>
//             <DeleteIcon />
//           </IconButton>
//         </Box>
//       ),
//     },
//   ];

//   return (
//     <div style={{ height: 600, width: '100%' }}>
//       <StyledDataGrid
//         rows={rows}
//         columns={columns}
//         pageSizeOptions={[10, 20]}
//         initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
//         getRowId={(row) => row.id}
//         disableRowSelectionOnClick
//       />
//     </div>
//   );
// };

// export default UploadedDataGrid;
