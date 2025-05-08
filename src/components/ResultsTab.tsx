import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
  Card,
  CardContent
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store'; // Updated import
import NiiVue, { nv } from './viewer/Niivue.jsx';
import { resultActions } from '../features/results/resultsSlice.js';
import { getUpstreamJobs } from '../features/jobs/jobActionCreation';
import { loadResult, getPipelineROI } from '../features/results/resultActionCreation.js';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { DataGrid, GridRenderCellParams } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';

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
  '& .MuiTablePagination-toolbar': {
    alignItems: 'center', // Ensure vertical centering
    minHeight: 'auto',
  },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
    marginTop: 0, // Remove any top margin
  },
}));


const ResultsTab = () => {
  const dispatch = useDispatch<AppDispatch>(); // Typed dispatch
  const token = useSelector((state: RootState) => state.auth.token);
  const jobs = useSelector((state: RootState) => state.jobs.jobs);
  const resultState = useSelector((state: RootState) => state.result);
  const activeJob = resultState?.activeJob;
  const pipelineID = activeJob?.pipeline_id;
  const niis = pipelineID ? resultState?.niis?.[pipelineID] ?? [] : [];
  const rois = pipelineID && resultState?.rois?.[pipelineID] ? resultState.rois[pipelineID] : [];
  const defaultVolumeIndex = niis.findIndex(nii => nii.name === "RSSRecon");
  const selectedVolume = resultState?.selectedVolume ?? (defaultVolumeIndex >= 0 ? defaultVolumeIndex : 0);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    if (token) {
      await dispatch(getUpstreamJobs(token));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => {
      fetchJobs();
    }, 500000);
    return () => clearInterval(interval);
  }, [token]);

  const downloadFiles = (files: any[]) => {
    files.forEach((file) => {
      if (file.link && file.link !== 'unknown') {
        const a = document.createElement('a');
        const ext = file.link.split('.').pop();
        a.href = file.link;
        a.download = `${file.fileName}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  };

  const handleView = async (job: any) => {
    if (job.pipeline_id === activeJob?.pipeline_id) {
      dispatch(resultActions.setOpenPanel([1, 2]));
      return;
    }

    if (token) {
      dispatch(loadResult({ accessToken: token, job })).then((response: any) => {
        const result = response.payload;
        const volumes = result.volumes;
        const niis = result.niis;

        if (niis?.length && volumes?.length) {
          const defaultIndex = niis.findIndex((nii: { name: string }) => nii.name === "RSSRecon");
          const volumeIndexToUse = defaultIndex >= 0 ? defaultIndex : 0;

          dispatch(resultActions.selectVolume(volumeIndexToUse));
          nv.loadVolumes([volumes[volumeIndexToUse]]);
          dispatch(resultActions.setOpenPanel([1, 2]));
          nv.closeDrawing();

          setTimeout(() => nv.resizeListener(), 300);
          dispatch(getPipelineROI({ pipeline: job.pipeline_id, accessToken: token }));
        }
      });
    }
  };

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
      {!token ? (
        <Typography color="text.secondary">Waiting for login...</Typography>
      ) : (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" mb={1}>
              <KeyboardDoubleArrowRightIcon sx={{ color: '#580f8b', fontSize: 20, mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#580f8b', fontSize: 18 }}>
                Job Results
              </Typography>
            </Box>
            <Button onClick={fetchJobs} startIcon={<RefreshIcon />}>Refresh</Button>
          </Box>

          {loading ? (
            <CircularProgress />
          ) : (
            <Box sx={{ height: 600, width: '100%' }}>
              <StyledDataGrid
                disableRowSelectionOnClick
                rows={jobs.map((job: any) => ({
                  id: job.id,
                  alias: job.alias,
                  status: job.status,
                  createdAt: new Date(job.createdAt).toLocaleString(),
                  files: job.files,
                  job: job,
                }))}
                columns={[
                  { field: 'id', headerName: 'Job ID', flex: 1 },
                  { field: 'alias', headerName: 'Alias', flex: 1 },
                  { field: 'status', headerName: 'Status', flex: 1 },
                  { field: 'createdAt', headerName: 'Date Submitted', flex: 1 },
                  {
                    field: 'actions',
                    headerName: 'Actions',
                    sortable: false,
                    flex: 1,
                    renderCell: (params: GridRenderCellParams) => (
                      <Box>
                        <Tooltip title="Download Result Files">
                          <IconButton onClick={() => downloadFiles(params.row.files)}>
                            <GetAppIcon />
                          </IconButton>
                        </Tooltip>
                        {params.row.status === 'completed' && (
                          <Tooltip title={`View job ${params.row.alias}`}>
                            <IconButton onClick={() => handleView(params.row.job)}>
                              <PlayArrowIcon sx={{ color: '#580f8b', '&:hover': { color: '#580f8b' } }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    ),
                  },
                ]}
                pageSizeOptions={[10, 15]}
                initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                getRowId={(row) => row.id}
              />
            </Box>
          )}

          <Box mt={4}>
            <Card variant="outlined" sx={{ p: 0 }}>
              <CardContent>
                {activeJob && token ? (
                  <NiiVue
                    niis={niis}
                    selectedVolume={selectedVolume ?? 0}
                    setSelectedVolume={(index: number) => dispatch(resultActions.selectVolume(index))}
                    warn={() => { }}
                    setWarning={() => { }}
                    setWarningOpen={() => { }}
                    rois={rois}
                    pipelineID={activeJob.pipeline_id}
                    saveROICallback={() => {
                      if (activeJob.pipeline_id && token) {
                        dispatch(getPipelineROI({ pipeline: activeJob.pipeline_id, accessToken: token }));
                      }
                    }}
                    accessToken={token}
                  />
                ) : (
                  <Typography color="text.secondary">Waiting for token...</Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ResultsTab;