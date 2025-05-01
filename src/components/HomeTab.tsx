import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { faTrash, faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch, useAppSelector } from '../features/hooks';
import { getUploadedData, deleteUploadedData } from '../features/data/dataActionCreation';
import { getUpstreamJobs } from '../features/jobs/jobActionCreation';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import UploadedDataGrid from '../components/Cmr-components/DataGrid/DataGrid';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { RootState } from '../store/store';

type FileItem = {
  id: string;
  fileName: string;
  createdAt: string;
  status: string;
  link: string;
};

const HomeTab = () => {
  const dispatch = useAppDispatch();
  const token = useSelector((state: RootState) => state.auth?.token ?? '');
  const { files } = useAppSelector((state) => state.data);
  const [loading, setLoading] = useState(true);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

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

  // download multiple selections
  const downloadSelectedFiles = async () => {
    const selectedFiles = files.filter((file: FileItem) => selectedFileIds.includes(file.id));
    if (selectedFiles.length === 1) {
      const file = selectedFiles[0];
      downloadFile(file.link, file.fileName);
      return;
    }

    const zip = new JSZip();
    const fetches = selectedFiles.map(async (file) => {
      const response = await fetch(file.link);
      const blob = await response.blob();
      zip.file(file.fileName, blob);
    });

    await Promise.all(fetches);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'downloaded_files.zip');
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
        <>
          <UploadedDataGrid
            rows={[...files].reverse()}
            onDownload={downloadFile}
            onDelete={(fileId: string) => dispatch(deleteUploadedData({ token, fileId }))}
            onSelectionChange={(selectedIds: string[]) => setSelectedFileIds(selectedIds)}
          />
        </>
      )}
    </Box>
  );
};

export default HomeTab;
