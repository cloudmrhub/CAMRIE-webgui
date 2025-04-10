import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import NiiVue, { nv } from '../components/viewer/Niivue';
import { JOBSAPI } from '../Variables';
import { resultActions } from '../features/rois/resultSlice';
import { loadResult, getPipelineROI } from '../features/rois/resultActionCreation';

const API_RESULTS = JOBSAPI;

const ResultsTab = () => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const jobs = useSelector((state: RootState) => state.result.jobs ?? []);
  const activeJob = useSelector((state: RootState) => state.result.activeJob);
  const pipelineID = activeJob?.pipeline_id;
  const niis = useSelector((state: RootState) => pipelineID ? state.result.niis[pipelineID] : []);
  const rois = useSelector((state: RootState) => pipelineID && state.result.rois[pipelineID] ? state.result.rois[pipelineID] : []);
  const selectedVolume = useSelector((state: RootState) => state.result.selectedVolume);

  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_RESULTS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      dispatch(resultActions.setJobs(data.jobs || []));
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => {
      fetchJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const downloadFiles = (files: any[]) => {
    files.forEach((file) => {
      if (file.link && file.link !== 'unknown') {
        const a = document.createElement('a');
        a.href = file.link;
        a.download = `${file.fileName}.${file.link.split('.').pop()}`;
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
    dispatch(loadResult({ accessToken: token, job })).then((response: any) => {
      const result = response.payload;
      const volumes = result.volumes;
      const niis = result.niis;
      if (niis?.length && volumes?.length) {
        for (let i = 0; i < niis.length; i++) {
          if (niis[i].id === 0) {
            dispatch(resultActions.selectVolume(i));
            nv.loadVolumes([volumes[i]]);
            dispatch(resultActions.setOpenPanel([1, 2]));
            nv.closeDrawing();
            break;
          }
        }
        setTimeout(() => nv.resizeListener(), 300);
        dispatch(getPipelineROI({ pipeline: job.pipeline_id, accessToken: token }));
      }
    });
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Job Results</Typography>
        <Button onClick={fetchJobs} startIcon={<RefreshIcon />}>Refresh</Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        jobs.map((job: any) => (
          <Box
            key={job.id}
            sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, mb: 2 }}
          >
            <Typography><strong>ID:</strong> {job.id}</Typography>
            <Typography><strong>Alias:</strong> {job.alias}</Typography>
            <Typography><strong>Status:</strong> {job.status}</Typography>
            <Typography><strong>Submitted:</strong> {new Date(job.createdAt).toLocaleString()}</Typography>
            <Box mt={1}>
              <Tooltip title="Download Result Files">
                <IconButton onClick={() => downloadFiles(job.files)}>
                  <GetAppIcon />
                </IconButton>
              </Tooltip>
              {job.status === 'completed' && (
                <Tooltip title={`View job ${job.alias}`}>
                  <IconButton onClick={() => handleView(job)}>
                    <PlayArrowIcon sx={{ color: '#4CAF50', '&:hover': { color: '#45a049' } }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        ))
      )}

      <Box mt={4}>
        {activeJob ? (
          <NiiVue
            niis={niis}
            selectedVolume={selectedVolume ?? 0}
            setSelectedVolume={(index: number) => dispatch(resultActions.selectVolume(index))}
            warn={() => {}}
            setWarning={() => {}}
            setWarningOpen={() => {}}
            rois={rois}
            pipelineID={activeJob.pipeline_id}
            saveROICallback={() => {
              if (pipelineID) {
                dispatch(getPipelineROI({ pipeline: pipelineID, accessToken: token }));
              }
            }}
            accessToken={token}
          />
        ) : (
          <Typography color="text.secondary">Select a job to view</Typography>
        )}
      </Box>
    </Box>
  );
};

export default ResultsTab;
