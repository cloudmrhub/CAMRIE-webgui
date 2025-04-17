import { useEffect, useState } from 'react';
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
import { RootState } from '../store/store';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import UploadedDataGrid from '../components/Cmr-components/DataGrid/DataGrid';
import JobResultsDataGrid from './Cmr-components/JobResultsDataGrid/JobResultsDataGrid';

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

const HomeTab = () => {
  const dispatch = useAppDispatch();
  const token = useSelector((state: RootState) => state.auth?.token ?? '');
  const { files } = useAppSelector((state) => state.data);
  const rawJobs = useAppSelector((state: RootState) => state.jobs.jobs);
  const jobsData: JobItem[] = rawJobs.map(job => ({
    id: job.id.toString(),
    alias: job.alias,
    createdAt: job.createdAt,
    status: job.status,
    files: job.files.map(file => ({
      id: file.id.toString(),
      fileName: file.fileName,
      createdAt: file.createdAt,
      status: file.status,
      link: file.link
    }))
  }));

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
    <Box>
      <Box display="flex" alignItems="center" mb={1}>
        <KeyboardDoubleArrowRightIcon sx={{ color: '#580f8b', fontSize: 20, mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#580f8b', fontSize: 18 }}>
          Uploaded Data
        </Typography>
      </Box>
      {loading ? <CircularProgress /> : (
        <UploadedDataGrid
          rows={[...files].reverse()}
          onDownload={downloadFile}
          onDelete={(fileId: string) => dispatch(deleteUploadedData({ token, fileId }))}
        />
      )}

      {/* <Box display="flex" alignItems="center" mb={1} mt={4}>
        <KeyboardDoubleArrowRightIcon sx={{ color: '#580f8b', fontSize: 20, mr: 1 }} />
        <Typography sx={{ fontWeight: 600, color: '#580f8b', fontSize: 18 }}>
          Job Results
        </Typography>
      </Box>
      {loading ? <CircularProgress /> : (
        <JobResultsDataGrid
          rows={[...jobsData].sort((a, b) => Number(b.id) - Number(a.id))}
          onDownload={(files) => files.forEach((f: FileItem) => downloadFile(f.link, f.fileName))}
          onDelete={(jobId: string) => {
            dispatch(deleteUpstreamJob({ token, jobId }));
            const index = jobsData.findIndex(j => j.id === jobId);
            dispatch(jobsSlice.actions.deleteJob({ index }));
          }}
        />
      )} */}
    </Box>
  );
};

export default HomeTab;
