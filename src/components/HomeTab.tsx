import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import GetAppIcon from '@mui/icons-material/GetApp';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppDispatch, useAppSelector } from '../features/hooks';
import { getUploadedData, deleteUploadedData } from '../features/data/dataActionCreation';
import { getUpstreamJobs, deleteUpstreamJob } from '../features/jobs/jobActionCreation';
import { jobsSlice } from '../features/jobs/jobsSlice';

const HomeTab = () => {
  const dispatch = useAppDispatch();
  const token = useSelector((state: RootState) => state.auth?.token ?? '');
  const { files } = useAppSelector((state) => state.data);
  const jobsData = useAppSelector((state) => state.jobs.jobs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dispatch(getUploadedData(token)),
      dispatch(getUpstreamJobs(token)),
    ]).finally(() => setLoading(false));
  }, [token]);

  const downloadFile = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Uploaded Data</Typography>
      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File Name</TableCell>
                <TableCell>Date Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...files].reverse().map((file) => (
                <TableRow key={`file-${file.id}`}>
                <TableCell>{file.fileName}</TableCell>
                  <TableCell>{file.createdAt}</TableCell>
                  <TableCell>{file.status}</TableCell>
                  <TableCell>
                    <IconButton><EditIcon /></IconButton>
                    <IconButton onClick={() => downloadFile(file.link, file.fileName)}><GetAppIcon /></IconButton>
                    <IconButton onClick={() => dispatch(deleteUploadedData({ token, fileId: file.id }))}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="h5" gutterBottom>Job Results</Typography>
      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Job ID</TableCell>
                <TableCell>Alias</TableCell>
                <TableCell>Date Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...jobsData].sort((a, b) => b.id - a.id).map((job) => (
                <TableRow key={`job-${job.id}`}>
                <TableCell>{job.id}</TableCell>
                  <TableCell>{job.alias}</TableCell>
                  <TableCell>{job.createdAt}</TableCell>
                  <TableCell>{job.status}</TableCell>
                  <TableCell>
                    <IconButton><EditIcon /></IconButton>
                    <IconButton onClick={() => job.files.forEach(f => downloadFile(f.link, f.fileName))}><GetAppIcon /></IconButton>
                    <IconButton onClick={() => {
                      dispatch(deleteUpstreamJob({ token, jobId: job.id }));
                      const index = jobsData.findIndex(j => j.id === job.id);
                      dispatch(jobsSlice.actions.deleteJob({ index }));
                    }}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default HomeTab;
